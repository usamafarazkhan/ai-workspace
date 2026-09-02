import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from the server directory
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)


class Settings:
    PROJECT_NAME: str = "AI Project Workspace Engine"
    API_V1_STR: str = "/api"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./workspace.db")

    # ── LLM Keys (read from .env) ──────────────────────────────
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")

    # ── Model Routing Map ──────────────────────────────────────
    # Supervisor: fastest/cheapest model for routing decisions
    SUPERVISOR_MODEL: str = "gpt-4o-mini"
    SUPERVISOR_MODEL_GEMINI: str = "gemini-3.6-flash"

    # Coding Agent: best code-generation model
    CODING_MODEL: str = "gpt-4o"
    CODING_MODEL_FALLBACK: str = "claude-3-5-sonnet-20241022"
    CODING_MODEL_GEMINI: str = "gemini-3.6-flash"

    # Architecture Agent: best at long-form reasoning & diagrams
    ARCH_MODEL: str = "claude-3-5-sonnet-20241022"
    ARCH_MODEL_FALLBACK: str = "gpt-4o"
    ARCH_MODEL_GEMINI: str = "gemini-3.6-flash"

    # RAG / Research Agent: best for large-context document reading
    RAG_MODEL: str = "gemini-3.6-flash"
    RAG_MODEL_FALLBACK: str = "gpt-4o"
    RAG_MODEL_GEMINI: str = "gemini-3.6-flash"

    # QA / Security Agent: best at analysis & audit
    QA_MODEL: str = "claude-3-5-sonnet-20241022"
    QA_MODEL_FALLBACK: str = "gpt-4o"
    QA_MODEL_GEMINI: str = "gemini-3.6-flash"

    # Personal Assistant: lightweight everyday helper
    ASSISTANT_MODEL: str = "gpt-4o-mini"
    ASSISTANT_MODEL_GEMINI: str = "gemini-3.6-flash"

    # Legacy single-model setting (kept for compatibility)
    DEFAULT_MODEL: str = os.getenv("DEFAULT_MODEL", "gpt-4o-mini")

    # ── App Security ──────────────────────────────────────────
    APP_SECRET_KEY: str = os.getenv("APP_SECRET_KEY", "multim-project-dev-key")

    # ── Storage ───────────────────────────────────────────────
    UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")


settings = Settings()
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
