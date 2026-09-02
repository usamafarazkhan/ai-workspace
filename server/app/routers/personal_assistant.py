from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.database import get_db
from app.models import PersonalAssistantMessage, Project, Conversation, Message, Artifact, ArtifactVersion, ActivityLog
from app.schemas import PersonalAssistantCreate, PersonalAssistantMessageResponse, TransferDraftRequest
from app.services.llm_factory import LLMFactory
from app.services.context_builder import ContextBuilder

router = APIRouter(tags=["personal-assistant"])

@router.get("/personal-assistant/messages", response_model=List[PersonalAssistantMessageResponse])
async def get_assistant_messages(
    user_id: str = "default_user",
    project_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(PersonalAssistantMessage).where(PersonalAssistantMessage.user_id == user_id)
    if project_id:
        query = query.where(PersonalAssistantMessage.project_id == project_id)

    query = query.order_by(PersonalAssistantMessage.created_at.asc())
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/personal-assistant/chat", response_model=PersonalAssistantMessageResponse)
async def chat_with_personal_assistant(
    payload: PersonalAssistantCreate,
    user_id: str = "default_user",
    db: AsyncSession = Depends(get_db)
):
    # Save User message in private history
    user_msg = PersonalAssistantMessage(
        user_id=user_id,
        project_id=payload.project_id,
        sender_type="user",
        content=payload.content
    )
    db.add(user_msg)
    await db.flush()

    # Build context for project if project_id is available
    project_context = ""
    if payload.project_id:
        proj_result = await db.execute(select(Project).where(Project.id == payload.project_id))
        proj = proj_result.scalars().first()
        if proj:
            project_context = (
                f"Active Project: {proj.name} ({proj.public_project_id})\n"
                f"Current Phase: {proj.current_phase}\n"
                f"Technologies: {', '.join(proj.technologies or [])}\n"
                f"Project Purpose & Instructions: {proj.system_instructions}\n"
            )

    system_prompt = (
        "You are the user's Private Personal AI Assistant in the AI Project Workspace.\n"
        "Your responses are completely private to this user and will NOT appear in the shared team project history.\n"
        "Provide direct, high-value assistance, explain technical concepts, help prepare drafts, suggest next steps, and analyze project status.\n\n"
        f"{project_context}"
    )

    assistant_response_text = await LLMFactory.generate_response(
        system_prompt=system_prompt,
        user_prompt=payload.content
    )

    assistant_msg = PersonalAssistantMessage(
        user_id=user_id,
        project_id=payload.project_id,
        sender_type="assistant",
        content=assistant_response_text
    )
    db.add(assistant_msg)
    await db.commit()
    await db.refresh(assistant_msg)

    return assistant_msg

@router.post("/personal-assistant/transfer")
async def transfer_draft_to_workspace(
    payload: TransferDraftRequest,
    db: AsyncSession = Depends(get_db)
):
    if payload.target_type == "conversation":
        conv_id = payload.conversation_id
        if not conv_id:
            # Find or create general conversation
            conv_result = await db.execute(
                select(Conversation)
                .where(Conversation.project_id == payload.project_id)
            )
            conv = conv_result.scalars().first()
            if not conv:
                conv = Conversation(
                    project_id=payload.project_id,
                    title="General Discussion & Drafts",
                    category="General"
                )
                db.add(conv)
                await db.flush()
            conv_id = conv.id

        new_msg = Message(
            conversation_id=conv_id,
            sender_type="user",
            sender_name="Developer (via Personal Assistant Draft)",
            content=payload.content,
            agent_name="Personal Assistant"
        )
        db.add(new_msg)
        await db.commit()
        return {"status": "transferred", "target": "conversation", "conversation_id": conv_id}

    elif payload.target_type == "artifact":
        new_artifact = Artifact(
            project_id=payload.project_id,
            title=payload.title or "Assistant Prepared Technical Spec",
            artifact_type="code" if ("```" in payload.content and ("function" in payload.content or "import" in payload.content)) else "document",
            content=payload.content,
            language="markdown",
            status="draft",
            change_summary="Draft transferred from Personal Assistant",
            created_by="Developer (Personal Assistant Draft)"
        )
        db.add(new_artifact)
        await db.flush()

        ver = ArtifactVersion(
            artifact_id=new_artifact.id,
            version=1,
            content=payload.content,
            change_summary="Draft transferred from Personal Assistant",
            created_by="Developer"
        )
        db.add(ver)

        log = ActivityLog(
            project_id=payload.project_id,
            action_type="artifact_created",
            description=f"Created new project artifact draft '{new_artifact.title}' from Personal Assistant."
        )
        db.add(log)

        await db.commit()
        return {"status": "transferred", "target": "artifact", "artifact_id": new_artifact.id}

    else:
        raise HTTPException(status_code=400, detail="Invalid target type. Use 'conversation' or 'artifact'.")
