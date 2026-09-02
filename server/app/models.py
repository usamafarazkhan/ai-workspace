import datetime
import uuid
import random
import string
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Integer, JSON, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

ROLE_PREFIX_MAP = {
    "Frontend Development": "USR-FE",
    "Frontend Developer": "USR-FE",
    "frontend_dev": "USR-FE",
    "Backend Development": "USR-BE",
    "Backend Developer": "USR-BE",
    "backend_dev": "USR-BE",
    "Database": "USR-DB",
    "Database Developer": "USR-DB",
    "database_dev": "USR-DB",
    "Documentation": "USR-DOC",
    "Documentation Specialist": "USR-DOC",
    "Technical Documentation": "USR-DOC",
    "documentation": "USR-DOC",
    "UI/UX Design": "USR-UI",
    "UI/UX Designer": "USR-UI",
    "ui_ux": "USR-UI",
    "Architecture": "USR-ARCH",
    "System Architect": "USR-ARCH",
    "architecture": "USR-ARCH",
    "Testing & QA": "USR-QA",
    "QA & Test Engineer": "USR-QA",
    "qa_testing": "USR-QA",
    "DevOps & Deployment": "USR-DEVOPS",
    "DevOps Engineer": "USR-DEVOPS",
    "devops": "USR-DEVOPS",
    "Security": "USR-SEC",
    "Security Specialist": "USR-SEC",
    "security": "USR-SEC",
    "Research": "USR-RES",
    "Research Analyst": "USR-RES",
    "research": "USR-RES",
    "Project Management": "USR-PM",
    "Project Manager": "USR-PM",
    "project_manager": "USR-PM",
    "owner": "USR-LEAD",
    "Lead Software Architect": "USR-LEAD"
}

def generate_uuid():
    return str(uuid.uuid4())

def generate_public_member_id(role=None):
    prefix = "USR-DEV"
    if role:
        if role in ROLE_PREFIX_MAP:
            prefix = ROLE_PREFIX_MAP[role]
        else:
            for k, v in ROLE_PREFIX_MAP.items():
                if k.lower() in role.lower() or role.lower() in k.lower():
                    prefix = v
                    break
    chars = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"{prefix}-{chars}"

def generate_public_project_id():
    chars = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"PRJ-{chars}"

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    public_member_id = Column(String(30), unique=True, default=lambda: generate_public_member_id("owner"))
    email = Column(String(120), unique=True, nullable=False)
    hashed_password = Column(String(200), nullable=True)
    full_name = Column(String(100), nullable=False)
    avatar_url = Column(String(300), nullable=True)
    availability_status = Column(String(30), default="online") # online, busy, offline
    role = Column(String(50), default="Lead Software Architect")
    permissions = Column(JSON, nullable=True, default=["all"])
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Project(Base):
    __tablename__ = "projects"

    id = Column(String, primary_key=True, default=generate_uuid)
    public_project_id = Column(String(20), unique=True, default=generate_public_project_id)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    owner_name = Column(String(100), default="Alex Tech Lead")
    owner_id = Column(String(100), nullable=True)
    status = Column(String(20), default="active") # active, archived
    visibility = Column(String(20), default="team") # private, team, public
    current_phase = Column(String(50), default="Development & Architecture")
    technologies = Column(JSON, nullable=True, default=["Next.js", "FastAPI", "PostgreSQL", "Redis", "LangChain"])
    goals = Column(JSON, nullable=True, default=["Build multi-agent platform", "Deploy microservices architecture"])
    system_instructions = Column(Text, nullable=True, default="You are an expert AI software architect and senior full-stack developer assistant.")
    developer_rules = Column(Text, nullable=True, default="1. Always write modular, high-quality code.\n2. Provide clean architectural diagrams in Mermaid format when applicable.\n3. Respect project constraints.")
    is_pinned = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    members = relationship("ProjectMember", back_populates="project", cascade="all, delete-orphan")
    classes = relationship("ProjectClass", back_populates="project", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="project", cascade="all, delete-orphan")
    memories = relationship("ProjectMemory", back_populates="project", cascade="all, delete-orphan")
    files = relationship("ProjectFile", back_populates="project", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="project", cascade="all, delete-orphan")
    artifacts = relationship("Artifact", back_populates="project", cascade="all, delete-orphan")

class ProjectMember(Base):
    __tablename__ = "project_members"

    id = Column(String, primary_key=True, default=generate_uuid)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    user_id = Column(String, nullable=True)
    public_member_id = Column(String(30), default=lambda: generate_public_member_id("Frontend Developer"))
    user_name = Column(String(100), nullable=False)
    user_email = Column(String(100), nullable=False)
    role = Column(String(50), default="Frontend Developer")
    specialty = Column(String(100), default="Frontend Development")
    permissions = Column(JSON, nullable=True, default=["chat", "code", "tasks", "read_artifacts"])
    joined_at = Column(DateTime, default=datetime.datetime.utcnow)

    project = relationship("Project", back_populates="members")

class ProjectClass(Base):
    __tablename__ = "project_classes"

    id = Column(String, primary_key=True, default=generate_uuid)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    parent_class_id = Column(String, ForeignKey("project_classes.id"), nullable=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    icon = Column(String(50), default="bi-diagram-3")
    color = Column(String(30), default="#3b82f6")
    lead_member_id = Column(String, nullable=True)
    assigned_agent = Column(String(100), default="Supervisor Orchestrator Agent")
    instructions = Column(Text, nullable=True)
    status = Column(String(20), default="active")
    priority = Column(String(20), default="medium")
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    project = relationship("Project", back_populates="classes")

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(String, primary_key=True, default=generate_uuid)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    class_id = Column(String, ForeignKey("project_classes.id"), nullable=True)
    assigned_agent = Column(String(100), nullable=True)
    title = Column(String(150), nullable=False, default="New Conversation")
    category = Column(String(50), default="General")
    summary = Column(Text, nullable=True)
    status = Column(String(20), default="active") # active, archived
    member_id = Column(String(30), nullable=True)
    member_name = Column(String(100), nullable=True)
    member_role = Column(String(50), nullable=True)
    related_tasks = Column(JSON, nullable=True, default=[])
    related_files = Column(JSON, nullable=True, default=[])
    related_artifacts = Column(JSON, nullable=True, default=[])
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    project = relationship("Project", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")

class Message(Base):
    __tablename__ = "messages"

    id = Column(String, primary_key=True, default=generate_uuid)
    conversation_id = Column(String, ForeignKey("conversations.id"), nullable=False)
    sender_type = Column(String(30), nullable=False) # user, supervisor, slave_coding, slave_arch, slave_doc, slave_review
    sender_name = Column(String(100), nullable=False)
    sender_member_id = Column(String(30), nullable=True)
    sender_role = Column(String(50), nullable=True)
    content = Column(Text, nullable=False)
    agent_name = Column(String(100), nullable=True)
    agent_reasoning = Column(Text, nullable=True)
    tool_calls = Column(JSON, nullable=True)
    citations = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    conversation = relationship("Conversation", back_populates="messages")

class PersonalAssistantMessage(Base):
    __tablename__ = "personal_assistant_messages"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, nullable=False, default="default_user")
    project_id = Column(String, nullable=True)
    sender_type = Column(String(20), nullable=False) # user, assistant
    sender_member_id = Column(String(30), nullable=True)
    content = Column(Text, nullable=False)
    citations = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class ProjectMemory(Base):
    __tablename__ = "project_memories"

    id = Column(String, primary_key=True, default=generate_uuid)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    class_id = Column(String, ForeignKey("project_classes.id"), nullable=True)
    memory_key = Column(String(100), nullable=False)
    memory_value = Column(Text, nullable=False)
    category = Column(String(30), default="fact") # fact, decision, constraint, stack, goal
    importance = Column(Integer, default=3)
    created_by_member_id = Column(String(30), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    project = relationship("Project", back_populates="memories")

class ProjectFile(Base):
    __tablename__ = "project_files"

    id = Column(String, primary_key=True, default=generate_uuid)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    class_id = Column(String, ForeignKey("project_classes.id"), nullable=True)
    filename = Column(String(200), nullable=False)
    file_path = Column(String(300), nullable=False)
    file_type = Column(String(50), nullable=False)
    file_size = Column(Integer, default=0)
    chunk_count = Column(Integer, default=0)
    summary = Column(Text, nullable=True)
    uploaded_by_member_id = Column(String(30), nullable=True)
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)

    project = relationship("Project", back_populates="files")
    chunks = relationship("FileChunk", back_populates="file", cascade="all, delete-orphan")

class FileChunk(Base):
    __tablename__ = "file_chunks"

    id = Column(String, primary_key=True, default=generate_uuid)
    file_id = Column(String, ForeignKey("project_files.id"), nullable=False)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    metadata_json = Column(JSON, nullable=True)

    file = relationship("ProjectFile", back_populates="chunks")

class Task(Base):
    __tablename__ = "tasks"

    id = Column(String, primary_key=True, default=generate_uuid)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    class_id = Column(String, ForeignKey("project_classes.id"), nullable=True)
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(20), default="todo") # todo, in_progress, completed, blocked
    priority = Column(String(20), default="medium") # low, medium, high
    assigned_to = Column(String(100), default="Unassigned")
    assigned_member_id = Column(String(30), nullable=True)
    deadline = Column(String(50), nullable=True)
    estimated_hours = Column(Integer, default=4)
    dependencies = Column(JSON, nullable=True, default=[])
    checklists = Column(JSON, nullable=True, default=[])
    labels = Column(JSON, nullable=True, default=["Feature"])
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    project = relationship("Project", back_populates="tasks")

class Artifact(Base):
    __tablename__ = "artifacts"

    id = Column(String, primary_key=True, default=generate_uuid)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    class_id = Column(String, ForeignKey("project_classes.id"), nullable=True)
    title = Column(String(150), nullable=False)
    artifact_type = Column(String(30), default="code") # code, document, diagram, spec
    content = Column(Text, nullable=False)
    language = Column(String(30), default="javascript")
    version = Column(Integer, default=1)
    status = Column(String(20), default="approved") # draft, in_review, approved, published
    change_summary = Column(Text, default="Initial artifact creation")
    created_by = Column(String(100), default="AI Assistant")
    created_by_member_id = Column(String(30), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    project = relationship("Project", back_populates="artifacts")
    versions = relationship("ArtifactVersion", back_populates="artifact", cascade="all, delete-orphan")

class ArtifactVersion(Base):
    __tablename__ = "artifact_versions"

    id = Column(String, primary_key=True, default=generate_uuid)
    artifact_id = Column(String, ForeignKey("artifacts.id"), nullable=False)
    version = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    change_summary = Column(Text, nullable=True)
    created_by = Column(String(100), default="AI Assistant")
    created_by_member_id = Column(String(30), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    artifact = relationship("Artifact", back_populates="versions")

class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    class_id = Column(String, ForeignKey("project_classes.id"), nullable=True)
    
    # Audit Attribution (2.1 & 2.2)
    member_id = Column(String(30), nullable=False, default="USR-LEAD-7K2M9A")
    member_name = Column(String(100), nullable=False, default="Alex Tech Lead")
    member_role = Column(String(50), nullable=False, default="Lead Software Architect")
    
    # Target Entities
    conversation_id = Column(String(100), nullable=True)
    task_id = Column(String(100), nullable=True)
    artifact_id = Column(String(100), nullable=True)
    file_path = Column(String(250), nullable=True)
    
    # Action & Version Details
    action_type = Column(String(50), nullable=False) # code_change, doc_update, task_created, task_status_changed, artifact_created, db_change, security_audit, role_reassigned, member_invited
    action_title = Column(String(200), nullable=True)
    description = Column(Text, nullable=False)
    prev_version = Column(String(50), nullable=True)
    new_version = Column(String(50), nullable=True)
    
    # Legacy fields compatibility
    user_name = Column(String(100), nullable=True)
    user_member_id = Column(String(30), nullable=True)
    
    metadata_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class ModelUsageLog(Base):
    __tablename__ = "model_usage_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    project_id = Column(String, ForeignKey("projects.id"), nullable=True)
    user_name = Column(String(100), default="Alex Tech Lead")
    user_member_id = Column(String(30), nullable=True)
    model_name = Column(String(50), default="gemini-2.0-flash")
    provider = Column(String(30), default="Google Gemini")
    prompt_tokens = Column(Integer, default=0)
    completion_tokens = Column(Integer, default=0)
    total_cost = Column(String(30), default="$0.0002")
    latency_ms = Column(Integer, default=320)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class ApprovalRequest(Base):
    __tablename__ = "approval_requests"

    id = Column(String, primary_key=True, default=generate_uuid)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    requested_by = Column(String(100), default="Supervisor Orchestrator Agent")
    requested_by_member_id = Column(String(30), nullable=True)
    action_type = Column(String(50), nullable=False)
    target_entity = Column(String(100), nullable=False)
    impact_summary = Column(Text, nullable=False)
    status = Column(String(20), default="pending")
    metadata_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
