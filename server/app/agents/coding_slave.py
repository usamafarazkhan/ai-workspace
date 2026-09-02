from app.services.llm_factory import LLMFactory

class CodingSlaveAgent:
    """
    Slave Agent 1: Code & Execution Specialist.
    Specializes in generating production code, writing unit tests, refactoring, and setting up application structures.
    """
    AGENT_NAME = "Coding & Execution Agent (Slave-1)"

    @staticmethod
    async def run(system_prompt: str, user_prompt: str) -> str:
        enhanced_system = (
            f"{system_prompt}\n\n"
            f"=== AGENT ROLE ===\n"
            f"You are the **Coding & Execution Slave Agent**.\n"
            f"Provide clean, well-structured, production-ready code with language labels, imports, and execution instructions."
        )
        return await LLMFactory.generate_response(enhanced_system, user_prompt, temperature=0.2, agent_role="coding")
