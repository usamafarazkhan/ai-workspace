from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List

from app.database import get_db
from app.models import Project, ProjectMember, ProjectClass, Conversation, ActivityLog, generate_public_member_id
from app.schemas import ProjectCreate, ProjectUpdate, ProjectResponse, MemberCreate, MemberUpdate, MemberResponse

router = APIRouter(prefix="/projects", tags=["Projects"])

STANDARD_CLASSES = [
    ("Architecture & Design", "System blueprints, microservices, and design patterns.", "bi-diagram-3", "#8b5cf6", "Supervisor Orchestrator Agent"),
    ("Frontend Development", "Next.js pages, responsive components, CSS3 styling.", "bi-code-slash", "#06b6d4", "Coding & Execution Agent (Slave-1)"),
    ("Backend Development", "FastAPI endpoints, async handlers, security middleware.", "bi-cpu", "#10b981", "Coding & Execution Agent (Slave-1)"),
    ("Database", "PostgreSQL schemas, migrations, pgvector indices.", "bi-database", "#3b82f6", "Architecture & System Design Agent (Slave-2)"),
    ("API Development", "REST API contracts, Swagger specs, SSE streaming.", "bi-plug", "#f59e0b", "Coding & Execution Agent (Slave-1)"),
    ("UI/UX Design", "Glassmorphism dark theme tokens and responsive layouts.", "bi-palette", "#ec4899", "UI/UX & Frontend Specialist Agent"),
    ("Testing & QA", "Unit tests, integration testing, test automation.", "bi-bug", "#ef4444", "Review & Quality Assurance Agent (Slave-4)"),
    ("DevOps & Deployment", "Docker containers, Redis caching, environment configs.", "bi-cloud-upload", "#6366f1", "Architecture & System Design Agent (Slave-2)"),
    ("Security", "Auth verification, JWT token security, role permissions.", "bi-shield-check", "#14b8a6", "Review & Quality Assurance Agent (Slave-4)"),
    ("Documentation", "Technical documentation, architecture docs, API refs.", "bi-journal-code", "#a855f7", "Research & Knowledge RAG Agent (Slave-3)"),
    ("Research", "Web research, benchmark comparisons, RAG synthesis.", "bi-search", "#0284c7", "Research & Knowledge RAG Agent (Slave-3)"),
    ("Project Management", "Sprint planning, task breakdowns, roadmap tracking.", "bi-kanban", "#eab308", "Supervisor Orchestrator Agent")
]

@router.get("", response_model=List[ProjectResponse])
async def list_projects(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Project)
        .options(selectinload(Project.members), selectinload(Project.classes))
        .order_by(Project.is_pinned.desc(), Project.created_at.desc())
    )
    return result.scalars().all()

@router.post("", response_model=ProjectResponse)
async def create_project(payload: ProjectCreate, db: AsyncSession = Depends(get_db)):
    project = Project(
        name=payload.name,
        description=payload.description,
        owner_name=payload.owner_name or "Alex Tech Lead",
        visibility=payload.visibility or "team",
        current_phase=payload.current_phase or "Development & Architecture",
        technologies=payload.technologies or ["Next.js", "FastAPI", "PostgreSQL", "Redis", "LangChain"],
        goals=payload.goals or ["Build multi-agent platform", "Deploy microservices architecture"],
        system_instructions=payload.system_instructions,
        developer_rules=payload.developer_rules
    )
    db.add(project)
    await db.flush()

    # Add default owner member with Lead ID
    owner_member_id = generate_public_member_id("owner")
    owner_member = ProjectMember(
        project_id=project.id,
        public_member_id=owner_member_id,
        user_name=project.owner_name,
        user_email=f"{project.owner_name.lower().replace(' ', '.')}@workspace.dev",
        role="Lead Software Architect",
        specialty="Architecture & Full-Stack Leadership",
        permissions=["all", "admin", "manage_members", "chat", "code", "architecture", "publish"]
    )
    db.add(owner_member)

    # Seed the 12 standard project classes
    created_classes = []
    for idx, (cname, cdesc, cicon, ccolor, cagent) in enumerate(STANDARD_CLASSES):
        pcl = ProjectClass(
            project_id=project.id,
            name=cname,
            description=cdesc,
            icon=cicon,
            color=ccolor,
            assigned_agent=cagent,
            sort_order=idx
        )
        db.add(pcl)
        created_classes.append(pcl)

    await db.flush()

    # Add default general conversation
    default_conv = Conversation(
        project_id=project.id,
        class_id=created_classes[0].id,
        title="Architecture & General",
        category="Architecture"
    )
    db.add(default_conv)

    # Log activity with member ID
    log = ActivityLog(
        project_id=project.id,
        user_name=project.owner_name,
        user_member_id=owner_member_id,
        action_type="project_created",
        description=f"Created new project '{project.name}' with public ID {project.public_project_id}"
    )
    db.add(log)

    await db.commit()

    # Reload with relationships
    res = await db.execute(
        select(Project)
        .options(selectinload(Project.members), selectinload(Project.classes))
        .where(Project.id == project.id)
    )
    return res.scalars().first()

@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Project)
        .options(selectinload(Project.members), selectinload(Project.classes))
        .where((Project.id == project_id) | (Project.public_project_id == project_id))
    )
    project = result.scalars().first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(project_id: str, payload: ProjectUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Project)
        .options(selectinload(Project.members), selectinload(Project.classes))
        .where(Project.id == project_id)
    )
    project = result.scalars().first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if payload.name is not None:
        project.name = payload.name
    if payload.description is not None:
        project.description = payload.description
    if payload.visibility is not None:
        project.visibility = payload.visibility
    if payload.current_phase is not None:
        project.current_phase = payload.current_phase
    if payload.technologies is not None:
        project.technologies = payload.technologies
    if payload.goals is not None:
        project.goals = payload.goals
    if payload.system_instructions is not None:
        project.system_instructions = payload.system_instructions
    if payload.developer_rules is not None:
        project.developer_rules = payload.developer_rules
    if payload.status is not None:
        project.status = payload.status
    if payload.is_pinned is not None:
        project.is_pinned = payload.is_pinned

    await db.commit()
    return project

@router.get("/{project_id}/members", response_model=List[MemberResponse])
async def list_members(project_id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(ProjectMember).where(ProjectMember.project_id == project_id))
    return res.scalars().all()

@router.post("/{project_id}/members", response_model=MemberResponse)
async def add_member(project_id: str, payload: MemberCreate, db: AsyncSession = Depends(get_db)):
    # Automatically generate a role-bound permanent Member ID
    member_id = generate_public_member_id(payload.role)
    
    # Calculate role-appropriate default permissions
    role_perms = ["chat", "tasks", "read_artifacts"]
    if "Developer" in payload.role or "Development" in payload.role or "Coding" in payload.role:
        role_perms.extend(["code", "create_artifacts"])
    elif "Architecture" in payload.role:
        role_perms.extend(["architecture", "diagrams", "create_artifacts"])
    elif "Documentation" in payload.role:
        role_perms.extend(["docs", "write_specs", "create_artifacts"])
    elif "Database" in payload.role:
        role_perms.extend(["database_schemas", "migrations", "create_artifacts"])
    elif "UI/UX" in payload.role:
        role_perms.extend(["design_tokens", "ui_components", "create_artifacts"])
    elif "Testing" in payload.role or "QA" in payload.role:
        role_perms.extend(["test_suites", "qa_audits"])
    elif "DevOps" in payload.role:
        role_perms.extend(["docker", "cicd", "deployments"])
    elif "Security" in payload.role:
        role_perms.extend(["security_audits", "auth_policies"])
    elif "Project Management" in payload.role or "Lead" in payload.role:
        role_perms.extend(["manage_tasks", "manage_classes", "roadmap"])

    member = ProjectMember(
        project_id=project_id,
        public_member_id=member_id,
        user_name=payload.user_name,
        user_email=payload.user_email,
        role=payload.role,
        specialty=payload.specialty or payload.role,
        permissions=payload.permissions or role_perms
    )
    db.add(member)

    log = ActivityLog(
        project_id=project_id,
        user_name="Project Owner",
        user_member_id=member_id,
        action_type="member_invited",
        description=f"Bound invitation: {payload.user_email} → Member ID {member_id} ({payload.user_name} as {payload.role})"
    )
    db.add(log)

    await db.commit()
    await db.refresh(member)
    return member

@router.put("/{project_id}/members/{member_id}", response_model=MemberResponse)
async def update_member_role(
    project_id: str,
    member_id: str,
    payload: MemberUpdate,
    db: AsyncSession = Depends(get_db)
):
    member = await db.get(ProjectMember, member_id)
    if not member or member.project_id != project_id:
        raise HTTPException(status_code=404, detail="Member not found in project")

    old_role = member.role
    if payload.role and payload.role != old_role:
        member.role = payload.role
        # Regenerate member ID prefix to reflect new role while keeping uniqueness
        member.public_member_id = generate_public_member_id(payload.role)
    
    if payload.specialty is not None:
        member.specialty = payload.specialty
    if payload.permissions is not None:
        member.permissions = payload.permissions

    log = ActivityLog(
        project_id=project_id,
        user_name="Project Lead",
        user_member_id=member.public_member_id,
        action_type="member_role_updated",
        description=f"Updated role for {member.user_name} from '{old_role}' to '{member.role}' (New ID: {member.public_member_id})"
    )
    db.add(log)

    await db.commit()
    await db.refresh(member)
    return member

@router.delete("/{project_id}/members/{member_id}")
async def delete_member(project_id: str, member_id: str, db: AsyncSession = Depends(get_db)):
    member = await db.get(ProjectMember, member_id)
    if not member or member.project_id != project_id:
        raise HTTPException(status_code=404, detail="Member not found in project")

    await db.delete(member)
    await db.commit()
    return {"status": "success", "message": f"Member {member.user_name} removed"}
