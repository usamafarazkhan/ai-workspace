from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.future import select

from app.database import engine, Base, AsyncSessionLocal
from app.models import (
    User, Project, ProjectMember, ProjectClass, Conversation, Message,
    ProjectMemory, Task, Artifact, ArtifactVersion, ActivityLog, ModelUsageLog
)
from app.routers import (
    projects, chats, files, memories, tasks, artifacts,
    classes, personal_assistant, search, auth, activity
)

app = FastAPI(
    title="AI Project Workspace Engine",
    description="Multi-Agent Developer Project Workspace Backend",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth.router, prefix="/api")
app.include_router(projects.router, prefix="/api")
app.include_router(classes.router, prefix="/api")
app.include_router(chats.router, prefix="/api")
app.include_router(personal_assistant.router, prefix="/api")
app.include_router(files.router, prefix="/api")
app.include_router(memories.router, prefix="/api")
app.include_router(tasks.router, prefix="/api")
app.include_router(artifacts.router, prefix="/api")
app.include_router(search.router, prefix="/api")
app.include_router(activity.router, prefix="/api")

@app.on_event("startup")
async def startup_event():
    # Initialize DB tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Seed Demo Developer Project & Data if database is empty
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Project))
        projects_list = result.scalars().all()

        if not projects_list:
            # 1. Create Default User
            default_user = User(
                public_member_id="USR-7K2M9A",
                email="alex@devworkspace.ai",
                full_name="Alex Tech Lead",
                avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
                availability_status="online",
                role="Software Architect & Project Lead"
            )
            session.add(default_user)
            await session.flush()

            # 2. Create Demo Project
            demo_project = Project(
                public_project_id="PRJ-DF7K2Q",
                name="E-Commerce AI Platform",
                description="High-performance microservice e-commerce platform with AI vector search, real-time inventory engine, and multi-tenant auth.",
                owner_name="Alex Tech Lead",
                owner_id=default_user.id,
                status="active",
                visibility="team",
                current_phase="Phase 2 — Microservices & AI Routing",
                technologies=["Next.js 14", "FastAPI", "PostgreSQL", "Redis", "LangGraph", "Docker"],
                goals=[
                    "Implement multi-agent supervisor routing for full-stack code and architecture",
                    "Configure project classes/workstreams for clear department separation",
                    "Deploy vector search RAG knowledge base for technical specs"
                ],
                system_instructions="You are an expert AI software architect and senior full-stack developer assistant.",
                developer_rules="1. Use clean architecture and async Python FastAPI handlers.\n2. Always format database models with SQLAlchemy 2.0 specs.\n3. Output system designs using Mermaid.js diagrams.\n4. Write modular React components with Bootstrap 5 and modern CSS3."
            )
            session.add(demo_project)
            await session.flush()

            # 3. Seed Members
            m1 = ProjectMember(
                project_id=demo_project.id,
                user_id=default_user.id,
                public_member_id="USR-7K2M9A",
                user_name="Alex Tech Lead",
                user_email="alex@devworkspace.ai",
                role="owner",
                specialty="Software Architect"
            )
            m2 = ProjectMember(
                project_id=demo_project.id,
                public_member_id="USR-9P3X21",
                user_name="Sarah Backend Dev",
                user_email="sarah@devworkspace.ai",
                role="editor",
                specialty="Backend & Database Engineer"
            )
            m3 = ProjectMember(
                project_id=demo_project.id,
                public_member_id="USR-4M8K10",
                user_name="David Frontend Engineer",
                user_email="david@devworkspace.ai",
                role="editor",
                specialty="Next.js & UI Engineer"
            )
            m4 = ProjectMember(
                project_id=demo_project.id,
                public_member_id="USR-2R5L77",
                user_name="Elena UI/UX Designer",
                user_email="elena@devworkspace.ai",
                role="editor",
                specialty="Product Designer"
            )
            session.add_all([m1, m2, m3, m4])

            # 4. Seed Standard Workstreams / Classes
            classes_data = [
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

            created_classes = []
            for idx, (cname, cdesc, cicon, ccolor, cagent) in enumerate(classes_data):
                pcl = ProjectClass(
                    project_id=demo_project.id,
                    name=cname,
                    description=cdesc,
                    icon=cicon,
                    color=ccolor,
                    assigned_agent=cagent,
                    sort_order=idx
                )
                session.add(pcl)
                created_classes.append(pcl)

            await session.flush()
            arch_class_id = created_classes[0].id
            backend_class_id = created_classes[2].id
            frontend_class_id = created_classes[1].id

            # 5. Seed Conversations
            c1 = Conversation(
                project_id=demo_project.id,
                class_id=arch_class_id,
                title="System Architecture & Microservices",
                category="Architecture",
                summary="Discussion on microservices API gateway and Redis caching."
            )
            c2 = Conversation(
                project_id=demo_project.id,
                class_id=backend_class_id,
                title="Database Schema & Auth Implementation",
                category="Coding",
                summary="Design of PostgreSQL SQLAlchemy models and auth tokens."
            )
            c3 = Conversation(
                project_id=demo_project.id,
                class_id=frontend_class_id,
                title="Next.js Dashboard & Component Styling",
                category="General",
                summary="Frontend layout, Bootstrap 5 custom styling, glassmorphism UI."
            )
            session.add_all([c1, c2, c3])

            # 6. Seed Project Memories
            mem1 = ProjectMemory(
                project_id=demo_project.id,
                class_id=backend_class_id,
                memory_key="Target Database",
                memory_value="Must use PostgreSQL with UUID primary keys and asyncpg driver.",
                category="stack",
                importance=5
            )
            mem2 = ProjectMemory(
                project_id=demo_project.id,
                class_id=backend_class_id,
                memory_key="Auth Provider",
                memory_value="OAuth2 JWT tokens with Redis session caching.",
                category="decision",
                importance=4
            )
            mem3 = ProjectMemory(
                project_id=demo_project.id,
                class_id=frontend_class_id,
                memory_key="Design System",
                memory_value="Dark mode glassmorphism palette with HSL custom properties and Bootstrap 5 grid.",
                category="constraint",
                importance=4
            )
            session.add_all([mem1, mem2, mem3])

            # 7. Seed Tasks
            t1 = Task(
                project_id=demo_project.id,
                class_id=backend_class_id,
                title="Design PostgreSQL Schema & Async Migrations",
                description="Create Alembic scripts for users, projects, workstream classes, tasks, and auth tokens.",
                status="in_progress",
                priority="high",
                assigned_to="Sarah Backend Dev",
                deadline="2026-08-30",
                estimated_hours=8,
                labels=["Database", "Backend"]
            )
            t2 = Task(
                project_id=demo_project.id,
                class_id=arch_class_id,
                title="Implement Supervisor Multi-Agent Router",
                description="Setup LangChain supervisor routing to coding, architecture, research, and review specialist agents.",
                status="completed",
                priority="high",
                assigned_to="Alex Tech Lead",
                deadline="2026-08-25",
                estimated_hours=12,
                labels=["AI Router", "Architecture"]
            )
            t3 = Task(
                project_id=demo_project.id,
                class_id=frontend_class_id,
                title="Build Right-Side Personal Assistant Drawer",
                description="Implement persistent floating action button and compact slide-over assistant drawer.",
                status="todo",
                priority="medium",
                assigned_to="David Frontend Engineer",
                deadline="2026-09-01",
                estimated_hours=6,
                labels=["Frontend", "UI"]
            )
            session.add_all([t1, t2, t3])

            # 8. Seed Initial Artifacts & Versions
            art1 = Artifact(
                project_id=demo_project.id,
                class_id=arch_class_id,
                title="Microservices Architecture Diagram",
                artifact_type="diagram",
                language="mermaid",
                status="published",
                change_summary="Initial system architecture design",
                created_by="Architecture & System Design Agent (Slave-2)",
                content=(
                    "```mermaid\n"
                    "graph TD\n"
                    "    Client[Next.js 14 Web Client] --> Gateway[FastAPI API Gateway]\n"
                    "    Gateway --> Auth[Auth & Permissions Service]\n"
                    "    Gateway --> MultiAgent[Supervisor Agent Orchestrator]\n"
                    "    MultiAgent --> CodingAgent[Coding Specialist Agent]\n"
                    "    MultiAgent --> ArchAgent[Architecture Specialist Agent]\n"
                    "    MultiAgent --> RAGAgent[Research & RAG Specialist Agent]\n"
                    "    MultiAgent --> ReviewAgent[Security & Review Agent]\n"
                    "    Auth --> Redis[(Redis Cache & Queues)]\n"
                    "    Gateway --> Postgres[(PostgreSQL DB + pgvector)]\n"
                    "```"
                )
            )
            session.add(art1)
            await session.flush()

            art_v1 = ArtifactVersion(
                artifact_id=art1.id,
                version=1,
                content=art1.content,
                change_summary="Initial system architecture design",
                created_by="Architecture & System Design Agent (Slave-2)"
            )
            session.add(art_v1)

            # 9. Seed Activity Log
            act1 = ActivityLog(
                project_id=demo_project.id,
                class_id=arch_class_id,
                user_name="Alex Tech Lead",
                action_type="project_initialized",
                description="Initialized Developer AI Project Workspace with 12 standard project classes."
            )
            session.add(act1)

            # 10. Seed Model Usage Log
            usage1 = ModelUsageLog(
                project_id=demo_project.id,
                user_name="Alex Tech Lead",
                model_name="gemini-2.0-flash",
                provider="Google Gemini",
                prompt_tokens=420,
                completion_tokens=680,
                total_cost="$0.0003",
                latency_ms=280
            )
            session.add(usage1)

            await session.commit()
            print("[Backend] Seeded initial demo project with classes, members, and artifacts successfully!")

@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "AI Project Workspace Backend Server",
        "version": "1.0.0",
        "active_features": [
            "Multi-Agent Supervisor Routing",
            "Project Classes / Workstreams",
            "Private Personal Assistant",
            "RAG Knowledge Engine",
            "Task Kanban & Timeline",
            "Versioned Artifacts Studio"
        ]
    }
