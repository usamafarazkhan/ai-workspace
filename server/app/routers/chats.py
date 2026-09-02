import json
import asyncio
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional

from app.database import get_db
from app.models import Project, ProjectMember, ProjectClass, Conversation, Message, ProjectMemory, ProjectFile, Task, Artifact, ArtifactVersion, ActivityLog, User
from app.schemas import ConversationCreate, ConversationResponse, MessageCreate, MessageResponse, TaskResponse
from app.services.context_builder import ContextBuilder
from app.services.rag_service import RAGService
from app.services.memory_service import MemoryService
from app.agents.supervisor import SupervisorAgent

router = APIRouter(prefix="/chats", tags=["Chats & Multi-Agent"])

@router.get("/project/{project_id}", response_model=List[ConversationResponse])
async def list_conversations(
    project_id: str,
    class_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(Conversation).where(Conversation.project_id == project_id)
    if class_id:
        query = query.where(Conversation.class_id == class_id)

    query = query.order_by(Conversation.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()

@router.post("", response_model=ConversationResponse)
async def create_conversation(payload: ConversationCreate, db: AsyncSession = Depends(get_db)):
    conv = Conversation(
        project_id=payload.project_id,
        class_id=payload.class_id,
        assigned_agent=payload.assigned_agent,
        title=payload.title,
        category=payload.category
    )
    db.add(conv)
    await db.commit()
    await db.refresh(conv)
    return conv

@router.get("/{conversation_id}/messages", response_model=List[MessageResponse])
async def list_messages(conversation_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Message).where(Message.conversation_id == conversation_id).order_by(Message.created_at.asc())
    )
    return result.scalars().all()

@router.post("/{conversation_id}/messages", response_model=MessageResponse)
async def post_message(conversation_id: str, payload: MessageCreate, db: AsyncSession = Depends(get_db)):
    # 1. Fetch Conversation and Project
    conv = await db.get(Conversation, conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    project = await db.get(Project, conv.project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Fetch current user identity if not provided in payload
    sender_name = payload.sender_name or "Alex Tech Lead"
    sender_member_id = payload.sender_member_id
    sender_role = payload.sender_role

    if not sender_member_id or not sender_role:
        u_res = await db.execute(select(User))
        curr_user = u_res.scalars().first()
        if curr_user:
            sender_member_id = sender_member_id or curr_user.public_member_id
            sender_role = sender_role or curr_user.role
            sender_name = sender_name or curr_user.full_name
        else:
            sender_member_id = sender_member_id or "USR-LEAD-7K2M9A"
            sender_role = sender_role or "Lead Software Architect"

    # Fetch class if assigned
    project_class = None
    if conv.class_id:
        project_class = await db.get(ProjectClass, conv.class_id)

    # 2. Save User Message with Bound Member Identity
    user_msg = Message(
        conversation_id=conversation_id,
        sender_type="user",
        sender_name=sender_name,
        sender_member_id=sender_member_id,
        sender_role=sender_role,
        content=payload.content
    )
    db.add(user_msg)
    await db.commit()

    # 3. Retrieve Context (Memories, RAG Chunks, History)
    mem_res = await db.execute(select(ProjectMemory).where(ProjectMemory.project_id == project.id))
    memories = mem_res.scalars().all()

    file_res = await db.execute(select(ProjectFile).where(ProjectFile.project_id == project.id))
    project_files = file_res.scalars().all()
    has_rag_files = len(project_files) > 0

    rag_chunks = await RAGService.retrieve_relevant_chunks(db, project.id, payload.content)

    hist_res = await db.execute(
        select(Message).where(Message.conversation_id == conversation_id).order_by(Message.created_at.asc())
    )
    recent_messages = hist_res.scalars().all()

    # 4. Build Role-Aware Context with Member Identity Directives
    system_prompt, user_prompt = ContextBuilder.build_context(
        project=project,
        memories=memories,
        rag_chunks=rag_chunks,
        recent_messages=recent_messages,
        current_prompt=payload.content,
        project_class=project_class,
        active_user_name=sender_name,
        active_user_role=sender_role,
        active_member_id=sender_member_id
    )

    # 5. Process Request via Multi-Agent Orchestration (Supervisor)
    sender_type, agent_name, agent_reasoning, ai_response = await SupervisorAgent.process_request(
        system_prompt, user_prompt, has_rag_files=has_rag_files
    )

    # Safety guard: never store None or empty as AI response
    if not ai_response or not str(ai_response).strip():
        ai_response = (
            "I received your request but could not generate a response. "
            "Please check that at least one API key is configured in `server/.env`."
        )

    # 6. Save AI Response Message
    ai_msg = Message(
        conversation_id=conversation_id,
        sender_type=sender_type,
        sender_name=agent_name,
        agent_name=agent_name,
        agent_reasoning=agent_reasoning,
        content=str(ai_response),
        citations=rag_chunks if rag_chunks else None
    )
    db.add(ai_msg)
    await db.commit()
    await db.refresh(ai_msg)

    # 7. Check if response contains code or Mermaid diagram -> Create Artifact automatically with Member ID tracking
    if "```python" in ai_response or "```javascript" in ai_response or "```mermaid" in ai_response:
        art_type = "diagram" if "```mermaid" in ai_response else "code"
        lang = "mermaid" if "```mermaid" in ai_response else ("python" if "```python" in ai_response else "javascript")
        auto_art = Artifact(
            project_id=project.id,
            class_id=conv.class_id,
            title=f"AI Generated {art_type.capitalize()} ({conv.title})",
            artifact_type=art_type,
            content=ai_response,
            language=lang,
            created_by=f"{agent_name} (for {sender_name})",
            created_by_member_id=sender_member_id
        )
        db.add(auto_art)
        await db.flush()

        ver = ArtifactVersion(
            artifact_id=auto_art.id,
            version=1,
            content=ai_response,
            change_summary=f"Created for request by {sender_name} [{sender_member_id}]",
            created_by=agent_name,
            created_by_member_id=sender_member_id
        )
        db.add(ver)

    # 8. Extract Persistent Memory
    try:
        await MemoryService.extract_and_save_memory(db, project.id, payload.content, class_id=conv.class_id)
        await MemoryService.extract_and_save_memory(db, project.id, ai_response, class_id=conv.class_id)
        await db.commit()
    except Exception as mem_err:
        print(f"[chats] Memory extraction error (non-fatal): {mem_err}")

    return ai_msg

@router.post("/messages/{message_id}/convert-to-task", response_model=TaskResponse)
async def convert_message_to_task(message_id: str, db: AsyncSession = Depends(get_db)):
    msg = await db.get(Message, message_id)
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")

    conv = await db.get(Conversation, msg.conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    title_clean = msg.content.split("\n")[0][:80].replace("#", "").strip() or "Task from Chat Message"
    task = Task(
        project_id=conv.project_id,
        class_id=conv.class_id,
        title=f"[Chat Task] {title_clean}",
        description=f"Generated from conversation '{conv.title}' message:\n\n{msg.content}",
        status="todo",
        priority="medium",
        assigned_to=msg.sender_name or "Unassigned",
        assigned_member_id=msg.sender_member_id
    )
    db.add(task)

    log = ActivityLog(
        project_id=conv.project_id,
        class_id=conv.class_id,
        user_name=msg.sender_name,
        user_member_id=msg.sender_member_id,
        action_type="task_created",
        description=f"Converted chat message to task: '{task.title}'"
    )
    db.add(log)

    await db.commit()
    await db.refresh(task)
    return task
