from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict
from datetime import datetime

# User & Profile Schemas
class UserBase(BaseModel):
    email: str
    full_name: str
    avatar_url: Optional[str] = None
    availability_status: str = "online"
    role: str = "Lead Software Architect"
    permissions: Optional[List[str]] = ["all"]

class UserCreate(UserBase):
    password: Optional[str] = None

class UserSwitchRequest(BaseModel):
    member_id: Optional[str] = None
    email: Optional[str] = None
    full_name: Optional[str] = None
    role: Optional[str] = None

class UserResponse(UserBase):
    id: str
    public_member_id: str
    created_at: datetime

    class Config:
        from_attributes = True

# Member Schemas
class MemberBase(BaseModel):
    user_name: str
    user_email: str
    role: str = "Frontend Developer"
    specialty: Optional[str] = "Frontend Development"
    permissions: Optional[List[str]] = ["chat", "code", "tasks", "read_artifacts"]

class MemberCreate(MemberBase):
    pass

class MemberUpdate(BaseModel):
    role: Optional[str] = None
    specialty: Optional[str] = None
    permissions: Optional[List[str]] = None

class MemberResponse(MemberBase):
    id: str
    project_id: str
    public_member_id: str
    joined_at: datetime

    class Config:
        from_attributes = True

# Class / Workstream Schemas
class ProjectClassBase(BaseModel):
    name: str
    description: Optional[str] = None
    icon: str = "bi-diagram-3"
    color: str = "#3b82f6"
    lead_member_id: Optional[str] = None
    assigned_agent: str = "Supervisor Orchestrator Agent"
    instructions: Optional[str] = None
    status: str = "active"
    priority: str = "medium"

class ProjectClassCreate(ProjectClassBase):
    project_id: str
    parent_class_id: Optional[str] = None

class ProjectClassUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    lead_member_id: Optional[str] = None
    assigned_agent: Optional[str] = None
    instructions: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None

class ProjectClassResponse(ProjectClassBase):
    id: str
    project_id: str
    parent_class_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Project Schemas
class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    visibility: str = "team"
    current_phase: str = "Development & Architecture"
    technologies: Optional[List[str]] = ["Next.js", "FastAPI", "PostgreSQL", "Redis", "LangChain"]
    goals: Optional[List[str]] = ["Build multi-agent platform", "Deploy microservices architecture"]
    system_instructions: Optional[str] = "You are an expert AI software architect and senior full-stack developer assistant."
    developer_rules: Optional[str] = "1. Always write modular code.\n2. Provide clean diagrams in Mermaid format when requested."
    is_pinned: bool = False

class ProjectCreate(ProjectBase):
    owner_name: Optional[str] = "Alex Tech Lead"

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    visibility: Optional[str] = None
    current_phase: Optional[str] = None
    technologies: Optional[List[str]] = None
    goals: Optional[List[str]] = None
    system_instructions: Optional[str] = None
    developer_rules: Optional[str] = None
    status: Optional[str] = None
    is_pinned: Optional[bool] = None

class ProjectResponse(ProjectBase):
    id: str
    public_project_id: str
    owner_name: str
    status: str
    created_at: datetime
    updated_at: datetime
    members: List[MemberResponse] = []
    classes: List[ProjectClassResponse] = []

    class Config:
        from_attributes = True

# Conversation Schemas
class ConversationBase(BaseModel):
    title: str = "New Conversation"
    category: str = "General"
    class_id: Optional[str] = None
    assigned_agent: Optional[str] = None
    status: str = "active"
    member_id: Optional[str] = None
    member_name: Optional[str] = None
    member_role: Optional[str] = None
    related_tasks: Optional[List[str]] = []
    related_files: Optional[List[str]] = []
    related_artifacts: Optional[List[str]] = []

class ConversationCreate(ConversationBase):
    project_id: str

class ConversationResponse(ConversationBase):
    id: str
    project_id: str
    summary: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Message Schemas
class MessageCreate(BaseModel):
    conversation_id: str
    content: str
    sender_name: Optional[str] = "Developer"
    sender_member_id: Optional[str] = None
    sender_role: Optional[str] = None

class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    sender_type: str
    sender_name: str
    sender_member_id: Optional[str] = None
    sender_role: Optional[str] = None
    content: str
    agent_name: Optional[str] = None
    agent_reasoning: Optional[str] = None
    tool_calls: Optional[Any] = None
    citations: Optional[Any] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Personal Assistant Schemas
class PersonalAssistantCreate(BaseModel):
    project_id: Optional[str] = None
    content: str

class PersonalAssistantMessageResponse(BaseModel):
    id: str
    user_id: str
    project_id: Optional[str] = None
    sender_type: str
    sender_member_id: Optional[str] = None
    content: str
    citations: Optional[Any] = None
    created_at: datetime

    class Config:
        from_attributes = True

class TransferDraftRequest(BaseModel):
    project_id: str
    content: str
    target_type: str
    conversation_id: Optional[str] = None
    title: Optional[str] = "Transferred Assistant Draft"

# Memory Schemas
class MemoryCreate(BaseModel):
    memory_key: str
    memory_value: str
    category: str = "fact"
    importance: int = 3
    class_id: Optional[str] = None

class MemoryResponse(MemoryCreate):
    id: str
    project_id: str
    created_by_member_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# File Schemas
class FileResponse(BaseModel):
    id: str
    project_id: str
    class_id: Optional[str] = None
    filename: str
    file_path: Optional[str] = None
    file_type: str
    file_size: int
    chunk_count: int
    summary: Optional[str] = None
    uploaded_by_member_id: Optional[str] = None
    uploaded_at: datetime

    class Config:
        from_attributes = True

# Task Schemas
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: str = "todo"
    priority: str = "medium"
    assigned_to: str = "Unassigned"
    assigned_member_id: Optional[str] = None
    deadline: Optional[str] = None
    estimated_hours: int = 4
    dependencies: Optional[List[str]] = []
    checklists: Optional[List[Dict[str, Any]]] = []
    labels: Optional[List[str]] = ["Feature"]

class TaskCreate(TaskBase):
    class_id: Optional[str] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    assigned_to: Optional[str] = None
    assigned_member_id: Optional[str] = None
    class_id: Optional[str] = None
    deadline: Optional[str] = None
    estimated_hours: Optional[int] = None
    dependencies: Optional[List[str]] = None
    checklists: Optional[List[Dict[str, Any]]] = None
    labels: Optional[List[str]] = None

class TaskResponse(TaskBase):
    id: str
    project_id: str
    class_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Artifact Schemas
class ArtifactBase(BaseModel):
    title: str
    artifact_type: str = "code"
    content: str
    language: str = "javascript"
    status: str = "approved"
    change_summary: Optional[str] = "Initial artifact creation"

class ArtifactCreate(ArtifactBase):
    class_id: Optional[str] = None
    created_by: Optional[str] = "AI Assistant"
    created_by_member_id: Optional[str] = None

class ArtifactResponse(ArtifactBase):
    id: str
    project_id: str
    class_id: Optional[str] = None
    version: int
    created_by: str
    created_by_member_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ArtifactVersionResponse(BaseModel):
    id: str
    artifact_id: str
    version: int
    content: str
    change_summary: Optional[str] = None
    created_by: str
    created_by_member_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Complete Activity History & Audit Schemas (2.1 & 2.2)
class ActivityLogBase(BaseModel):
    project_id: str
    class_id: Optional[str] = None
    member_id: str = "USR-LEAD-7K2M9A"
    member_name: str = "Alex Tech Lead"
    member_role: str = "Lead Software Architect"
    conversation_id: Optional[str] = None
    task_id: Optional[str] = None
    artifact_id: Optional[str] = None
    file_path: Optional[str] = None
    action_type: str = "code_change"
    action_title: Optional[str] = None
    description: str
    prev_version: Optional[str] = None
    new_version: Optional[str] = None
    metadata_json: Optional[Any] = None

class ActivityLogCreate(ActivityLogBase):
    pass

class ActivityLogResponse(ActivityLogBase):
    id: str
    user_name: Optional[str] = None
    user_member_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class RoleActivitySummary(BaseModel):
    role_name: str
    role_category: str
    prefix: str
    member_count: int
    action_count: int
    primary_member_name: Optional[str] = None
    primary_member_id: Optional[str] = None
    recent_actions: List[ActivityLogResponse] = []
    related_conversation_id: Optional[str] = None
    related_artifact_count: int = 0
    related_task_count: int = 0

class ModelUsageLogResponse(BaseModel):
    id: str
    project_id: Optional[str] = None
    user_name: str
    user_member_id: Optional[str] = None
    model_name: str
    provider: str
    prompt_tokens: int
    completion_tokens: int
    total_cost: str
    latency_ms: int
    created_at: datetime

    class Config:
        from_attributes = True

class SearchResultItem(BaseModel):
    entity_type: str
    id: str
    title: str
    subtitle: Optional[str] = None
    category: Optional[str] = None
    score: float = 1.0
