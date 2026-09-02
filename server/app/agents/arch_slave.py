from app.services.llm_factory import LLMFactory

class ArchSlaveAgent:
    """
    Slave Agent 2: Architecture & System Design Specialist.
    Specializes in database schemas, system architecture, microservices design, and Mermaid diagrams.
    """
    AGENT_NAME = "Architecture & System Design Agent (Slave-2)"

    @staticmethod
    async def run(system_prompt: str, user_prompt: str) -> str:
        enhanced_system = (
            f"{system_prompt}\n\n"
            f"=== AGENT ROLE ===\n"
            f"You are the **Architecture & System Design Slave Agent**.\n"
            f"Provide architectural blueprints, component diagrams in Mermaid format (` ```mermaid ... ``` `), data flow diagrams, and database schemas."
        )
        return await LLMFactory.generate_response(enhanced_system, user_prompt, temperature=0.4, agent_role="architecture")
