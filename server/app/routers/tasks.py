from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional

from app.database import get_db
from app.models import Task, Project, ActivityLog
from app.schemas import TaskCreate, TaskUpdate, TaskResponse
from app.services.llm_factory import LLMFactory

router = APIRouter(prefix="/tasks", tags=["Tasks & Project State"])

@router.get("/project/{project_id}", response_model=List[TaskResponse])
async def list_tasks(
    project_id: str,
    class_id: Optional[str] = None,
    assigned_to: Optional[str] = None,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(Task).where(Task.project_id == project_id)
    if class_id:
        query = query.where(Task.class_id == class_id)
    if assigned_to:
        query = query.where(Task.assigned_to.ilike(f"%{assigned_to}%"))
    if status:
        query = query.where(Task.status == status)

    query = query.order_by(Task.updated_at.desc())
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/project/{project_id}", response_model=TaskResponse)
async def create_task(project_id: str, payload: TaskCreate, db: AsyncSession = Depends(get_db)):
    task = Task(
        project_id=project_id,
        class_id=payload.class_id,
        title=payload.title,
        description=payload.description,
        status=payload.status or "todo",
        priority=payload.priority or "medium",
        assigned_to=payload.assigned_to or "Unassigned",
        assigned_member_id=payload.assigned_member_id,
        deadline=payload.deadline,
        estimated_hours=payload.estimated_hours or 4,
        dependencies=payload.dependencies or [],
        checklists=payload.checklists or [],
        labels=payload.labels or ["Feature"]
    )
    db.add(task)
    await db.flush()

    m_id = payload.assigned_member_id or "USR-LEAD-7K2M9A"
    m_name = payload.assigned_to or "Alex Tech Lead"
    m_role = "Project Manager" if "PM" in m_id else "Developer"

    log = ActivityLog(
        project_id=project_id,
        class_id=payload.class_id,
        member_id=m_id,
        member_name=m_name,
        member_role=m_role,
        task_id=task.id,
        action_type="task_created",
        action_title=f"Created task: {task.title}",
        description=f"Created task '{task.title}' assigned to {task.assigned_to} [{m_id}]",
        user_name=m_name,
        user_member_id=m_id
    )
    db.add(log)

    await db.commit()
    await db.refresh(task)
    return task

@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(task_id: str, payload: TaskUpdate, db: AsyncSession = Depends(get_db)):
    task = await db.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    old_status = task.status

    if payload.title is not None:
        task.title = payload.title
    if payload.description is not None:
        task.description = payload.description
    if payload.status is not None:
        task.status = payload.status
    if payload.priority is not None:
        task.priority = payload.priority
    if payload.assigned_to is not None:
        task.assigned_to = payload.assigned_to
    if payload.assigned_member_id is not None:
        task.assigned_member_id = payload.assigned_member_id
    if payload.class_id is not None:
        task.class_id = payload.class_id
    if payload.deadline is not None:
        task.deadline = payload.deadline
    if payload.estimated_hours is not None:
        task.estimated_hours = payload.estimated_hours
    if payload.dependencies is not None:
        task.dependencies = payload.dependencies
    if payload.checklists is not None:
        task.checklists = payload.checklists
    if payload.labels is not None:
        task.labels = payload.labels

    m_id = task.assigned_member_id or "USR-LEAD-7K2M9A"
    m_name = task.assigned_to or "Alex Tech Lead"
    m_role = "Developer"

    if old_status != task.status:
        log = ActivityLog(
            project_id=task.project_id,
            class_id=task.class_id,
            member_id=m_id,
            member_name=m_name,
            member_role=m_role,
            task_id=task.id,
            action_type="task_status_changed",
            action_title=f"Task moved to {task.status.upper()}",
            description=f"Updated task '{task.title}' status from '{old_status}' to '{task.status}'",
            prev_version=old_status,
            new_version=task.status,
            user_name=m_name,
            user_member_id=m_id
        )
        db.add(log)

    await db.commit()
    return task

@router.delete("/{task_id}")
async def delete_task(task_id: str, db: AsyncSession = Depends(get_db)):
    task = await db.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    await db.delete(task)
    await db.commit()
    return {"message": "Task deleted successfully"}

@router.post("/project/{project_id}/ai-breakdown", response_model=List[TaskResponse])
async def ai_generate_tasks(project_id: str, goal_prompt: str = Query(...), db: AsyncSession = Depends(get_db)):
    proj = await db.get(Project, project_id)
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")

    sys_prompt = (
        f"You are the Supervisor PM Agent for Project '{proj.name}'.\n"
        "Break down the user's high-level goal into 3 concrete, actionable developer tasks.\n"
        "Output ONLY a JSON array with objects containing fields: title, description, priority (low/medium/high), assigned_to, estimated_hours.\n"
        "Do not wrap in markdown or commentary."
    )

    ai_raw = await LLMFactory.generate_response(sys_prompt, goal_prompt)
    created_tasks = []

    try:
        # Clean json backticks if any
        cleaned = ai_raw.strip().replace("```json", "").replace("```", "").strip()
        import json
        items = json.loads(cleaned)
        for item in items[:4]:
            t = Task(
                project_id=project_id,
                title=item.get("title", "AI Action Task"),
                description=item.get("description", "Generated subtask"),
                status="todo",
                priority=item.get("priority", "medium"),
                assigned_to=item.get("assigned_to", "Unassigned"),
                estimated_hours=item.get("estimated_hours", 4),
                labels=["AI Generated", "Epic Subtask"]
            )
            db.add(t)
            created_tasks.append(t)

        await db.commit()
        for t in created_tasks:
            await db.refresh(t)

        return created_tasks
    except Exception as e:
        # Fallback 1 task if JSON parsing fails
        t = Task(
            project_id=project_id,
            title=f"Execute: {goal_prompt[:50]}",
            description=ai_raw[:300],
            status="todo",
            priority="high",
            assigned_to="Unassigned"
        )
        db.add(t)
        await db.commit()
        await db.refresh(t)
        return [t]
