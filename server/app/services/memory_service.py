import re
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models import ProjectMemory

class MemoryService:
    """
    Extracts persistent facts, architectural decisions, technology stack choices, and project goals from conversation flow.
    """

    @staticmethod
    async def extract_and_save_memory(db: AsyncSession, project_id: str, text: str, class_id: str = None):
        # Look for explicit keyword patterns like "tech stack", "database", "must use", "framework", "architecture"
        lines = text.split("\n")
        keywords = ["must use", "database", "tech stack", "framework", "architecture", "rule", "convention", "deploy"]
        
        for line in lines:
            line_clean = line.strip("-* ").strip()
            if any(kw in line_clean.lower() for kw in keywords) and len(line_clean) > 10:
                # Check if memory already exists
                result = await db.execute(
                    select(ProjectMemory).where(
                        ProjectMemory.project_id == project_id,
                        ProjectMemory.memory_value == line_clean
                    )
                )
                existing = result.scalars().first()
                if not existing:
                    new_mem = ProjectMemory(
                        project_id=project_id,
                        memory_key="Extracted Requirement",
                        memory_value=line_clean,
                        category="constraint" if "must" in line_clean.lower() else "decision",
                        importance=4
                    )
                    db.add(new_mem)
        await db.commit()
