from app.agents.coding_slave import CodingSlaveAgent
from app.agents.arch_slave import ArchSlaveAgent
from app.agents.rag_slave import RAGSlaveAgent
from app.services.llm_factory import LLMFactory

class SupervisorAgent:
    """
    Supervisor Agent (Master Orchestrator):
    Inspects user prompt complexity, project context, and workload.
    - If prompt is short/direct or simple general inquiry -> Answers directly.
    - Otherwise -> Delegates to one of the 3 specialized slave agents:
        * CodingSlaveAgent: Code generation, refactoring, implementation.
        * ArchSlaveAgent: Architecture diagrams, system design, database schemas.
        * RAGSlaveAgent: File search, document synthesis, research.
    """
    AGENT_NAME = "Supervisor Orchestrator Agent"

    @staticmethod
    async def process_request(
        system_prompt: str,
        user_prompt: str,
        has_rag_files: bool = False
    ) -> tuple[str, str, str, str]:
        
        cleaned_prompt = user_prompt.strip().lower()
        word_count = len(cleaned_prompt.split())

        # Rule 1: Short / Simple Query -> Supervisor Direct Response
        if word_count <= 6 and not any(kw in cleaned_prompt for kw in ["code", "design", "arch", "schema", "file", "diagram"]):
            reasoning = "Query is concise and general. Handled directly by Supervisor Agent for fast turnaround."
            direct_system = f"{system_prompt}\n\nProvide a clear, direct, and helpful response."
            response = await LLMFactory.generate_response(direct_system, user_prompt)
            return "supervisor", SupervisorAgent.AGENT_NAME, reasoning, response

        # Rule 2: Coding Request -> Coding Slave
        coding_keywords = ["code", "write", "function", "fastapi", "react", "next.js", "class", "script", "bug", "fix", "refactor", "component", "api"]
        if any(kw in cleaned_prompt for kw in coding_keywords):
            reasoning = "Detected full-stack code implementation requirement. Delegated to Coding & Execution Agent (Slave-1)."
            response = await CodingSlaveAgent.run(system_prompt, user_prompt)
            return "slave_coding", CodingSlaveAgent.AGENT_NAME, reasoning, response

        # Rule 3: Architecture & System Design Request -> Arch Slave
        arch_keywords = ["architecture", "design", "schema", "database", "diagram", "mermaid", "system", "microservice", "infrastructure", "plan"]
        if any(kw in cleaned_prompt for kw in arch_keywords):
            reasoning = "Detected system architecture and blueprint requirement. Delegated to Architecture & System Design Agent (Slave-2)."
            response = await ArchSlaveAgent.run(system_prompt, user_prompt)
            return "slave_arch", ArchSlaveAgent.AGENT_NAME, reasoning, response

        # Rule 4: File Knowledge / Research Request -> RAG Slave
        doc_keywords = ["doc", "file", "search", "rag", "research", "summarize", "find", "document", "pdf", "explain file"]
        if has_rag_files or any(kw in cleaned_prompt for kw in doc_keywords):
            reasoning = "Detected project document knowledge search requirement. Delegated to Research & Knowledge RAG Agent (Slave-3)."
            response = await RAGSlaveAgent.run(system_prompt, user_prompt)
            return "slave_doc", RAGSlaveAgent.AGENT_NAME, reasoning, response

        # Default: Coding Slave for general technical requests
        reasoning = "Delegated to Coding & Execution Agent for comprehensive technical analysis."
        response = await CodingSlaveAgent.run(system_prompt, user_prompt)
        return "slave_coding", CodingSlaveAgent.AGENT_NAME, reasoning, response
