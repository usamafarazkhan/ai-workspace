from typing import List, Optional
from app.models import Project, ProjectClass, ProjectMemory, Message

ROLE_DOMAIN_DESCRIPTIONS = {
    "Frontend Developer": "Next.js/React frontend pages, responsive UI components, CSS/Tailwind tokens, user forms, client state management, browser interactions.",
    "Frontend Development": "Next.js/React frontend pages, responsive UI components, CSS/Tailwind tokens, user forms, client state management, browser interactions.",
    "Backend Developer": "FastAPI/Python backend REST APIs, endpoint routers, async business logic, authentication JWT handlers, middleware, request validation.",
    "Backend Development": "FastAPI/Python backend REST APIs, endpoint routers, async business logic, authentication JWT handlers, middleware, request validation.",
    "Database Developer": "PostgreSQL database schemas, table definitions, foreign keys, indexes, migrations, SQL queries, relational data integrity.",
    "Database": "PostgreSQL database schemas, table definitions, foreign keys, indexes, migrations, SQL queries, relational data integrity.",
    "Technical Documentation": "Markdown technical specifications, user guides, API contracts, architecture explanations, setup manuals, docstrings.",
    "Documentation": "Markdown technical specifications, user guides, API contracts, architecture explanations, setup manuals, docstrings.",
    "UI/UX Designer": "Design systems, color palettes, typography hierarchy, component layouts, glassmorphism aesthetics, UX flow wireframes.",
    "UI/UX Design": "Design systems, color palettes, typography hierarchy, component layouts, glassmorphism aesthetics, UX flow wireframes.",
    "System Architect": "High-level architecture blueprints, Mermaid flowcharts, microservice topologies, dataflow sequence diagrams, design patterns.",
    "Architecture": "High-level architecture blueprints, Mermaid flowcharts, microservice topologies, dataflow sequence diagrams, design patterns.",
    "QA & Test Engineer": "Pytest suites, unit tests, integration test plans, mock fixtures, assertion coverage, edge-case failure testing.",
    "Testing & QA": "Pytest suites, unit tests, integration test plans, mock fixtures, assertion coverage, edge-case failure testing.",
    "DevOps Engineer": "Dockerfiles, docker-compose, CI/CD pipeline automation, environment configurations, container orchestration, deployment configs.",
    "DevOps & Deployment": "Dockerfiles, docker-compose, CI/CD pipeline automation, environment configurations, container orchestration, deployment configs.",
    "Security Specialist": "Vulnerability scanning, SAIF compliance, authentication verification, token rotation, OWASP security audits, RBAC policies.",
    "Security": "Vulnerability scanning, SAIF compliance, authentication verification, token rotation, OWASP security audits, RBAC policies.",
    "Research Analyst": "Web research, competitive benchmark analysis, document synthesis, RAG vector extraction, technical feasibility studies.",
    "Research": "Web research, competitive benchmark analysis, document synthesis, RAG vector extraction, technical feasibility studies.",
    "Project Manager": "Sprint task breakdowns, Epic planning, Kanban milestones, timeline roadmaps, dependency tracking.",
    "Project Management": "Sprint task breakdowns, Epic planning, Kanban milestones, timeline roadmaps, dependency tracking.",
    "Lead Software Architect": "Holistic system design, full-stack leadership, cross-role orchestration, and overall architecture integrity."
}

class ContextBuilder:
    """
    Dynamically constructs LLM system and conversation context adhering to:
    Platform Rules -> Project Instructions -> Active User Identity & Role Directives -> Class Instructions -> Memories -> RAG Knowledge -> Current Request.
    """

    @staticmethod
    def build_context(
        project: Project,
        memories: List[ProjectMemory],
        rag_chunks: List[str],
        recent_messages: List[Message],
        current_prompt: str,
        project_class: Optional[ProjectClass] = None,
        active_user_name: str = "Alex Tech Lead",
        active_user_role: str = "Lead Software Architect",
        active_member_id: str = "USR-LEAD-7K2M9A"
    ) -> tuple[str, str]:
        
        # 1. Platform & System Rules
        platform_rules = "Platform Rules: You are an enterprise AI Multi-Agent Project Workspace. All access control, security policies, and user permissions are strictly enforced."
        sys_rules = getattr(project, "system_instructions", "You are an expert AI software architect and senior full-stack developer assistant.")
        dev_rules = getattr(project, "developer_rules", "1. Always write modular code.\n2. Provide clean diagrams in Mermaid format when requested.")
        
        # 2. Member Identity & Role-Aware Directives
        role_domain = ROLE_DOMAIN_DESCRIPTIONS.get(active_user_role, "General full-stack engineering and development.")
        identity_str = (
            f"\n=== 3. ACTIVE MEMBER IDENTITY & ROLE DIRECTIVES ===\n"
            f"Active Member: {active_user_name}\n"
            f"Member ID: {active_member_id}\n"
            f"Assigned Role: {active_user_role}\n"
            f"Role Domain Focus: {role_domain}\n\n"
            f"ROLE-AWARE EXECUTION GUIDELINES:\n"
            f"- Align your deliverables primarily to the member's domain ({active_user_role}).\n"
            f"  * If Documentation member: Focus on Markdown documentation, guides, specs. Do not unilaterally generate backend APIs or frontend code unless asked as reference.\n"
            f"  * If Frontend Developer: Focus on Next.js/React UI components, state, responsive styling, and client-side interactions.\n"
            f"  * If Database Developer: Focus on PostgreSQL schemas, table structures, relationships, indexes, and migrations.\n"
            f"  * If Backend Developer: Focus on FastAPI endpoints, routers, auth handlers, and controller logic.\n"
            f"  * If QA & Test Engineer: Focus on test suites, pytest scripts, assertions, and edge-case testing.\n"
            f"  * If Architecture/Design: Focus on Mermaid diagrams, service topologies, and structural design.\n\n"
            f"TRANSPARENT CROSS-ROLE DEPENDENCY RULE:\n"
            f"- A member may freely ask questions across disciplines. However, if their request touches or affects another role's domain:\n"
            f"  * Transparently distinguish:\n"
            f"    1. [Requested Work] in context of {active_user_role}\n"
            f"    2. [Role-Related Work] (the immediate deliverable for {active_user_role})\n"
            f"    3. [Cross-Role Dependencies] (explicitly note required changes from other role members e.g. Backend [USR-BE-...], Database [USR-DB-...], UI/UX [USR-UI-...])\n"
            f"    4. [Actual Changes] (code/artifact deliverables)\n"
            f"- Never silently mix or hide cross-role dependencies.\n"
        )

        # 3. Class-specific instructions if available
        class_str = ""
        if project_class:
            class_str = (
                f"\n=== 4. WORKSTREAM CLASS: {project_class.name} ===\n"
                f"Assigned Specialist Agent: {project_class.assigned_agent}\n"
                f"Class Instructions: {project_class.instructions or 'N/A'}\n"
            )

        # 4. Dynamic Memory Block
        memory_str = ""
        if memories:
            memory_items = [f"- [{m.category.upper()}] {m.memory_key}: {m.memory_value}" for m in memories]
            memory_str = "\n=== 5. PERSISTENT PROJECT MEMORY ===\n" + "\n".join(memory_items) + "\n"

        # 5. Dynamic RAG Files / Knowledge Chunks
        rag_str = ""
        if rag_chunks:
            rag_str = "\n=== 6. RELEVANT PROJECT KNOWLEDGE (RAG) ===\n" + "\n".join([f"- {chunk}" for chunk in rag_chunks]) + "\n"

        # 6. Combine into final System Prompt following requirement order
        system_prompt = (
            f"=== 1. PLATFORM & SECURITY RULES ===\n{platform_rules}\n\n"
            f"=== 2. PROJECT INSTRUCTIONS ({project.name} | Public ID: {project.public_project_id}) ===\n"
            f"Phase: {project.current_phase}\n"
            f"Technologies: {', '.join(project.technologies or [])}\n"
            f"Instructions: {sys_rules}\n"
            f"Developer Rules: {dev_rules}\n"
            f"{identity_str}"
            f"{class_str}"
            f"{memory_str}"
            f"{rag_str}\n"
            f"=== 7. EXECUTION POLICY ===\n"
            f"Format all output with GitHub-flavored markdown. Use language tags on code blocks. Provide Mermaid diagrams for architecture designs."
        )

        # 7. Format Chat History
        history_str = ""
        if recent_messages:
            history_lines = []
            for msg in recent_messages[-10:]:
                m_id_str = f" [{msg.sender_member_id}]" if getattr(msg, 'sender_member_id', None) else ""
                history_lines.append(f"{msg.sender_name}{m_id_str} ({msg.sender_type}): {msg.content}")
            history_str = "=== RECENT CONVERSATION HISTORY ===\n" + "\n".join(history_lines) + "\n\n"

        # 8. Final User Prompt
        full_user_prompt = f"{history_str}=== CURRENT REQUEST FROM {active_user_name} ({active_user_role} | {active_member_id}) ===\n{current_prompt}"

        return system_prompt, full_user_prompt
