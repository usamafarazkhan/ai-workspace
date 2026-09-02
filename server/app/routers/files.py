import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from app.database import get_db
from app.config import settings
from app.models import ProjectFile
from app.schemas import FileResponse
from app.services.rag_service import RAGService

router = APIRouter(prefix="/files", tags=["Files & Knowledge RAG"])

@router.get("/project/{project_id}", response_model=List[FileResponse])
async def list_files(project_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ProjectFile).where(ProjectFile.project_id == project_id).order_by(ProjectFile.uploaded_at.desc())
    )
    return result.scalars().all()

@router.post("/upload", response_model=FileResponse)
async def upload_file(
    project_id: str = Form(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    project_dir = os.path.join(settings.UPLOAD_DIR, project_id)
    os.makedirs(project_dir, exist_ok=True)
    
    file_path = os.path.join(project_dir, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = os.path.getsize(file_path)
    file_type = file.content_type or os.path.splitext(file.filename)[1]

    project_file = ProjectFile(
        project_id=project_id,
        filename=file.filename,
        file_path=file_path,
        file_type=file_type,
        file_size=file_size
    )
    db.add(project_file)
    await db.flush()

    # Process and Chunk RAG file
    await RAGService.process_file(db, project_file)
    
    await db.commit()
    await db.refresh(project_file)
    return project_file
