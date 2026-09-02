from app.services.llm_factory import LLMFactory

class RAGSlaveAgent:
    """
    Slave Agent 3: Research & Knowledge Base Specialist.
    Specializes in document analysis, searching project RAG files, summarization, and providing cited answers.
    """
    AGENT_NAME = "Research & Knowledge RAG Agent (Slave-3)"

    @staticmethod
    async def run(system_prompt: str, user_prompt: str) -> str:
        enhanced_system = (
            f"{system_prompt}\n\n"
            f"=== AGENT ROLE ===\n"
            f"You are the **Research & Knowledge Base Slave Agent**.\n"
            f"Synthesize uploaded files, document chunks, and project research. Always provide clear citations and key takeaways."
        )
        return await LLMFactory.generate_response(enhanced_system, user_prompt, temperature=0.3, agent_role="rag")
