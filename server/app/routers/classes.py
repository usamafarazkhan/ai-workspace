from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.database import get_db
from app.models import ProjectClass, ActivityLog
from app.schemas import ProjectClassResponse, ProjectClassCreate, ProjectClassUpdate

router = APIRouter(tags=["classes"])

@router.get("/projects/{project_id}/classes", response_model=List[ProjectClassResponse])
async def get_project_classes(project_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ProjectClass)
        .where(ProjectClass.project_id == project_id)
        .order_by(ProjectClass.sort_order.asc())
    )
    classes = result.scalars().all()
    return classes

@router.post("/projects/{project_id}/classes", response_model=ProjectClassResponse)
async def create_project_class(project_id: str, payload: ProjectClassCreate, db: AsyncSession = Depends(get_db)):
    # Calculate sort order
    result = await db.execute(select(ProjectClass).where(ProjectClass.project_id == project_id))
    existing_count = len(result.scalars().all())

    new_class = ProjectClass(
        project_id=project_id,
        parent_class_id=payload.parent_class_id,
        name=payload.name,
        description=payload.description,
        icon=payload.icon or "bi-diagram-3",
        color=payload.color or "#06b6d4",
        lead_member_id=payload.lead_member_id,
        assigned_agent=payload.assigned_agent or "Supervisor Orchestrator Agent",
        instructions=payload.instructions,
        status=payload.status or "active",
        priority=payload.priority or "medium",
        sort_order=existing_count
    )
    db.add(new_class)
    await db.flush()

    # Log activity
    log = ActivityLog(
        project_id=project_id,
        class_id=new_class.id,
        user_name="Project Owner",
        action_type="class_created",
        description=f"Created new project class/workstream: '{new_class.name}'"
    )
    db.add(log)
    await db.commit()
    await db.refresh(new_class)
    return new_class

@router.put("/classes/{class_id}", response_model=ProjectClassResponse)
async def update_project_class(class_id: str, payload: ProjectClassUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ProjectClass).where(ProjectClass.id == class_id))
    pcl = result.scalars().first()
    if not pcl:
        raise HTTPException(status_code=404, detail="Project class not found")

    if payload.name is not None:
        pcl.name = payload.name
    if payload.description is not None:
        pcl.description = payload.description
    if payload.icon is not None:
        pcl.icon = payload.icon
    if payload.color is not None:
        pcl.color = payload.color
    if payload.lead_member_id is not None:
        pcl.lead_member_id = payload.lead_member_id
    if payload.assigned_agent is not None:
        pcl.assigned_agent = payload.assigned_agent
    if payload.instructions is not None:
        pcl.instructions = payload.instructions
    if payload.status is not None:
        pcl.status = payload.status
    if payload.priority is not None:
        pcl.priority = payload.priority

    await db.commit()
    await db.refresh(pcl)
    return pcl

@router.delete("/classes/{class_id}")
async def delete_project_class(class_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ProjectClass).where(ProjectClass.id == class_id))
    pcl = result.scalars().first()
    if not pcl:
        raise HTTPException(status_code=404, detail="Project class not found")

    await db.delete(pcl)
    await db.commit()
    return {"message": "Project class deleted successfully", "id": class_id}
