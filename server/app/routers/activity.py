from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.models import ActivityLog, Project, ProjectMember, Conversation, Task, Artifact
from app.schemas import ActivityLogResponse, ActivityLogCreate, RoleActivitySummary

router = APIRouter(prefix="/activity", tags=["Audit & Activity History"])

ROLE_DEFINITIONS = [
    {"role_name": "Frontend Developer", "role_category": "Frontend Development", "prefix": "USR-FE"},
    {"role_name": "Backend Developer", "role_category": "Backend Development", "prefix": "USR-BE"},
    {"role_name": "Database Developer", "role_category": "Database", "prefix": "USR-DB"},
    {"role_name": "Documentation Specialist", "role_category": "Documentation", "prefix": "USR-DOC"},
    {"role_name": "UI/UX Designer", "role_category": "UI/UX Design", "prefix": "USR-UI"},
    {"role_name": "System Architect", "role_category": "Architecture", "prefix": "USR-ARCH"},
    {"role_name": "QA & Test Engineer", "role_category": "Testing & QA", "prefix": "USR-QA"},
    {"role_name": "DevOps Engineer", "role_category": "DevOps & Deployment", "prefix": "USR-DEVOPS"},
    {"role_name": "Security Specialist", "role_category": "Security", "prefix": "USR-SEC"},
    {"role_name": "Research Analyst", "role_category": "Research", "prefix": "USR-RES"},
    {"role_name": "Project Manager", "role_category": "Project Management", "prefix": "USR-PM"},
    {"role_name": "Lead Software Architect", "role_category": "Leadership & Architecture", "prefix": "USR-LEAD"}
]

@router.get("/project/{project_id}", response_model=List[ActivityLogResponse])
async def list_project_activity(
    project_id: str,
    member_id: Optional[str] = Query(None, description="Filter by Member ID"),
    role: Optional[str] = Query(None, description="Filter by Member Role"),
    action_type: Optional[str] = Query(None, description="Filter by Action Type"),
    file_path: Optional[str] = Query(None, description="Filter by Target File"),
    task_id: Optional[str] = Query(None, description="Filter by Task ID"),
    conversation_id: Optional[str] = Query(None, description="Filter by Conversation ID"),
    artifact_id: Optional[str] = Query(None, description="Filter by Artifact ID"),
    q: Optional[str] = Query(None, description="Text search"),
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db)
):
    query = select(ActivityLog).where(ActivityLog.project_id == project_id)

    if member_id:
        query = query.where(
            (ActivityLog.member_id == member_id) | (ActivityLog.user_member_id == member_id)
        )
    if role:
        query = query.where(ActivityLog.member_role.ilike(f"%{role}%"))
    if action_type:
        query = query.where(ActivityLog.action_type == action_type)
    if file_path:
        query = query.where(ActivityLog.file_path.ilike(f"%{file_path}%"))
    if task_id:
        query = query.where(ActivityLog.task_id == task_id)
    if conversation_id:
        query = query.where(ActivityLog.conversation_id == conversation_id)
    if artifact_id:
        query = query.where(ActivityLog.artifact_id == artifact_id)
    if q:
        search_pattern = f"%{q}%"
        query = query.where(
            ActivityLog.description.ilike(search_pattern) |
            ActivityLog.action_title.ilike(search_pattern) |
            ActivityLog.member_name.ilike(search_pattern) |
            ActivityLog.file_path.ilike(search_pattern)
        )

    query = query.order_by(ActivityLog.created_at.desc()).limit(limit)
    result = await db.execute(query)
    logs = result.scalars().all()
    return logs

@router.get("/project/{project_id}/grouped-by-role", response_model=List[RoleActivitySummary])
async def list_activity_grouped_by_role(project_id: str, db: AsyncSession = Depends(get_db)):
    # 1. Fetch all members and logs for project
    members_res = await db.execute(select(ProjectMember).where(ProjectMember.project_id == project_id))
    members = members_res.scalars().all()

    logs_res = await db.execute(
        select(ActivityLog).where(ActivityLog.project_id == project_id).order_by(ActivityLog.created_at.desc())
    )
    logs = logs_res.scalars().all()

    convs_res = await db.execute(select(Conversation).where(Conversation.project_id == project_id))
    convs = convs_res.scalars().all()

    artifacts_res = await db.execute(select(Artifact).where(Artifact.project_id == project_id))
    artifacts = artifacts_res.scalars().all()

    tasks_res = await db.execute(select(Task).where(Task.project_id == project_id))
    tasks = tasks_res.scalars().all()

    summaries = []
    for rdef in ROLE_DEFINITIONS:
        r_name = rdef["role_name"]
        r_cat = rdef["role_category"]
        r_prefix = rdef["prefix"]

        # Filter members matching role
        role_members = [
            m for m in members
            if r_name.lower() in m.role.lower() or m.role.lower() in r_name.lower() or r_cat.lower() in m.role.lower()
        ]
        
        # Primary member info
        p_name = role_members[0].user_name if role_members else None
        p_id = role_members[0].public_member_id if role_members else None

        # Filter logs matching role or member IDs
        role_member_ids = {m.public_member_id for m in role_members}
        role_logs = [
            l for l in logs
            if (l.member_role and (r_name.lower() in l.member_role.lower() or r_cat.lower() in l.member_role.lower()))
            or l.member_id in role_member_ids
            or (l.user_member_id and l.user_member_id in role_member_ids)
        ]

        # Related conversation
        rel_conv = next((c for c in convs if c.category and (r_cat.lower() in c.category.lower() or r_name.lower() in c.category.lower())), None)
        if not rel_conv and convs:
            rel_conv = convs[0]

        # Related count
        rel_art_count = len([a for a in artifacts if a.created_by_member_id in role_member_ids])
        rel_task_count = len([t for t in tasks if t.assigned_member_id in role_member_ids])

        summaries.append(RoleActivitySummary(
            role_name=r_name,
            role_category=r_cat,
            prefix=r_prefix,
            member_count=len(role_members),
            action_count=len(role_logs),
            primary_member_name=p_name or "Assigned on Demand",
            primary_member_id=p_id or f"{r_prefix}-DEMO",
            recent_actions=role_logs[:8],
            related_conversation_id=rel_conv.id if rel_conv else None,
            related_artifact_count=rel_art_count,
            related_task_count=rel_task_count
        ))

    return summaries

@router.post("/log", response_model=ActivityLogResponse)
async def create_activity_log(payload: ActivityLogCreate, db: AsyncSession = Depends(get_db)):
    log = ActivityLog(
        project_id=payload.project_id,
        class_id=payload.class_id,
        member_id=payload.member_id,
        member_name=payload.member_name,
        member_role=payload.member_role,
        conversation_id=payload.conversation_id,
        task_id=payload.task_id,
        artifact_id=payload.artifact_id,
        file_path=payload.file_path,
        action_type=payload.action_type,
        action_title=payload.action_title or payload.description[:100],
        description=payload.description,
        prev_version=payload.prev_version,
        new_version=payload.new_version,
        metadata_json=payload.metadata_json
    )
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return log
