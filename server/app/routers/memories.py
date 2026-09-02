from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from app.database import get_db
from app.models import ProjectMemory
from app.schemas import MemoryCreate, MemoryResponse

router = APIRouter(prefix="/memories", tags=["Project Memory"])

@router.get("/project/{project_id}", response_model=List[MemoryResponse])
async def list_memories(project_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ProjectMemory).where(ProjectMemory.project_id == project_id).order_by(ProjectMemory.importance.desc())
    )
    return result.scalars().all()

@router.post("/project/{project_id}", response_model=MemoryResponse)
async def create_memory(project_id: str, payload: MemoryCreate, db: AsyncSession = Depends(get_db)):
    memory = ProjectMemory(
        project_id=project_id,
        memory_key=payload.memory_key,
        memory_value=payload.memory_value,
        category=payload.category,
        importance=payload.importance
    )
    db.add(memory)
    await db.commit()
    await db.refresh(memory)
    return memory

@router.delete("/{memory_id}")
async def delete_memory(memory_id: str, db: AsyncSession = Depends(get_db)):
    memory = await db.get(ProjectMemory, memory_id)
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")
    await db.delete(memory)
    await db.commit()
    return {"message": "Memory deleted successfully"}
