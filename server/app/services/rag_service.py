import os
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models import ProjectFile, FileChunk

class RAGService:
    """
    RAG document ingestion, chunking, and similarity search for uploaded project files.
    """

    @staticmethod
    async def process_file(db: AsyncSession, project_file: ProjectFile) -> int:
        path = project_file.file_path
        if not os.path.exists(path):
            return 0

        content = ""
        ext = os.path.splitext(path)[1].lower()

        try:
            if ext in [".txt", ".md", ".py", ".js", ".json", ".csv", ".html", ".css", ".sql"]:
                with open(path, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
            elif ext == ".pdf":
                try:
                    import pypdf
                    reader = pypdf.PdfReader(path)
                    content = "\n".join([page.extract_text() for page in reader.pages if page.extract_text()])
                except Exception:
                    content = f"[PDF file: {project_file.filename}]"
            else:
                with open(path, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
        except Exception as e:
            print(f"[RAGService] File read error: {e}")
            content = f"Content from {project_file.filename}"

        if not content:
            content = f"Empty or unreadable file: {project_file.filename}"

        # Chunk content into ~500 character chunks
        chunks = RAGService._chunk_text(content, chunk_size=500, overlap=50)
        
        for idx, chunk_text in enumerate(chunks):
            chunk = FileChunk(
                file_id=project_file.id,
                project_id=project_file.project_id,
                chunk_index=idx,
                content=chunk_text,
                metadata_json={"filename": project_file.filename, "chunk_index": idx}
            )
            db.add(chunk)

        project_file.chunk_count = len(chunks)
        project_file.summary = content[:200] + "..." if len(content) > 200 else content
        await db.commit()
        return len(chunks)

    @staticmethod
    def _chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
        chunks = []
        start = 0
        while start < len(text):
            end = start + chunk_size
            chunks.append(text[start:end])
            start = end - overlap
        return chunks if chunks else [text]

    @staticmethod
    async def retrieve_relevant_chunks(db: AsyncSession, project_id: str, query: str, limit: int = 3) -> List[str]:
        result = await db.execute(
            select(FileChunk).where(FileChunk.project_id == project_id)
        )
        all_chunks = result.scalars().all()
        if not all_chunks:
            return []

        # Keyword relevance score ranking
        query_words = set(query.lower().split())
        scored_chunks = []
        for chunk in all_chunks:
            content_words = set(chunk.content.lower().split())
            overlap_score = len(query_words.intersection(content_words))
            scored_chunks.append((overlap_score, chunk))

        # Sort by overlap score descending
        scored_chunks.sort(key=lambda x: x[0], reverse=True)
        top_chunks = [c.content for score, c in scored_chunks[:limit] if score > 0 or len(scored_chunks) <= limit]
        
        formatted_chunks = []
        for idx, text in enumerate(top_chunks):
            formatted_chunks.append(f"[Chunk {idx+1}]: {text}")
        return formatted_chunks
