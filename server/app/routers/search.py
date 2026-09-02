from fastapi import APIRouter, Depends, Query
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.database import get_db
from app.models import Project, ProjectClass, Conversation, Message, ProjectFile, ProjectMemory, Task, Artifact, ProjectMember
from app.schemas import SearchResultItem

router = APIRouter(tags=["search"])

@router.get("/search", response_model=List[SearchResultItem])
async def global_search(
    q: str = Query(..., min_length=1),
    project_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    query_str = f"%{q.strip().lower()}%"
    results: List[SearchResultItem] = []

    # 1. Projects Search
    proj_query = select(Project).where(Project.name.ilike(query_str) | Project.description.ilike(query_str))
    if project_id:
        proj_query = proj_query.where(Project.id == project_id)
    p_res = await db.execute(proj_query)
    for p in p_res.scalars().all():
        results.append(SearchResultItem(
            id=p.id,
            entity_type="project",
            title=p.name,
            subtitle=p.description or f"Project ID: {p.public_project_id}",
            category="Project",
            project_id=p.id
        ))

    # 2. Classes Search
    cls_query = select(ProjectClass).where(ProjectClass.name.ilike(query_str) | ProjectClass.description.ilike(query_str))
    if project_id:
        cls_query = cls_query.where(ProjectClass.project_id == project_id)
    c_res = await db.execute(cls_query)
    for c in c_res.scalars().all():
        results.append(SearchResultItem(
            id=c.id,
            entity_type="class",
            title=f"Workstream: {c.name}",
            subtitle=c.description or "Project Workstream Class",
            category="Workstream",
            project_id=c.project_id,
            class_id=c.id
        ))

    # 3. Tasks Search
    task_query = select(Task).where(Task.title.ilike(query_str) | Task.description.ilike(query_str))
    if project_id:
        task_query = task_query.where(Task.project_id == project_id)
    t_res = await db.execute(task_query)
    for t in t_res.scalars().all():
        results.append(SearchResultItem(
            id=t.id,
            entity_type="task",
            title=t.title,
            subtitle=f"Status: {t.status.upper()} | Priority: {t.priority.capitalize()} | Assigned: {t.assigned_to}",
            category="Task",
            project_id=t.project_id,
            class_id=t.class_id
        ))

    # 4. Artifacts Search
    art_query = select(Artifact).where(Artifact.title.ilike(query_str) | Artifact.content.ilike(query_str))
    if project_id:
        art_query = art_query.where(Artifact.project_id == project_id)
    a_res = await db.execute(art_query)
    for a in a_res.scalars().all():
        results.append(SearchResultItem(
            id=a.id,
            entity_type="artifact",
            title=a.title,
            subtitle=f"Type: {a.artifact_type.capitalize()} | v{a.version} | Status: {a.status}",
            category="Artifact",
            project_id=a.project_id,
            class_id=a.class_id
        ))

    # 5. Conversations & Messages Search
    msg_query = select(Message).where(Message.content.ilike(query_str))
    m_res = await db.execute(msg_query)
    for m in m_res.scalars().all():
        results.append(SearchResultItem(
            id=m.id,
            entity_type="message",
            title=f"Message by {m.sender_name}",
            subtitle=m.content[:120] + "..." if len(m.content) > 120 else m.content,
            category="Conversation",
            project_id=project_id
        ))

    # 6. Files Search
    file_query = select(ProjectFile).where(ProjectFile.filename.ilike(query_str) | ProjectFile.summary.ilike(query_str))
    if project_id:
        file_query = file_query.where(ProjectFile.project_id == project_id)
    f_res = await db.execute(file_query)
    for f in f_res.scalars().all():
        results.append(SearchResultItem(
            id=f.id,
            entity_type="file",
            title=f.filename,
            subtitle=f.summary or f"File size: {f.file_size} bytes | Chunks: {f.chunk_count}",
            category="Knowledge File",
            project_id=f.project_id,
            class_id=f.class_id
        ))

    # 7. Memories Search
    mem_query = select(ProjectMemory).where(ProjectMemory.memory_key.ilike(query_str) | ProjectMemory.memory_value.ilike(query_str))
    if project_id:
        mem_query = mem_query.where(ProjectMemory.project_id == project_id)
    mem_res = await db.execute(mem_query)
    for mem in mem_res.scalars().all():
        results.append(SearchResultItem(
            id=mem.id,
            entity_type="memory",
            title=f"Memory: {mem.memory_key}",
            subtitle=mem.memory_value,
            category="Project Memory",
            project_id=mem.project_id,
            class_id=mem.class_id
        ))

    return results
