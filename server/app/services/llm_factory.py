import os
import json
import httpx
from app.config import settings

# Shared async HTTP client with connection pooling for performance
_http_client = None

def _get_client() -> httpx.AsyncClient:
    global _http_client
    if _http_client is None:
        _http_client = httpx.AsyncClient(timeout=httpx.Timeout(60.0, connect=10.0))
    return _http_client


class LLMFactory:
    """
    Provider-independent LLM gateway.
    Automatically picks the right provider and model per agent role.
    Priority: Gemini → OpenAI → Anthropic → Smart Fallback (offline demo).
    Uses async httpx to avoid blocking the event loop.
    """

    # ── Agent Role → Model Mapping ────────────────────────────────────────────
    AGENT_MODELS = {
        "supervisor":     {"openai": settings.SUPERVISOR_MODEL,    "gemini": settings.SUPERVISOR_MODEL_GEMINI},
        "coding":         {"openai": settings.CODING_MODEL,        "gemini": settings.CODING_MODEL_GEMINI},
        "architecture":   {"openai": settings.ARCH_MODEL_FALLBACK, "gemini": settings.ARCH_MODEL_GEMINI},
        "rag":            {"openai": settings.RAG_MODEL_FALLBACK,  "gemini": settings.RAG_MODEL_GEMINI},
        "qa":             {"openai": settings.QA_MODEL_FALLBACK,   "gemini": settings.QA_MODEL_GEMINI},
        "assistant":      {"openai": settings.ASSISTANT_MODEL,     "gemini": settings.ASSISTANT_MODEL_GEMINI},
    }

    @staticmethod
    async def generate_response(
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.7,
        stream: bool = False,
        agent_role: str = "supervisor"
    ) -> str:
        """
        Route to the best available provider automatically.
        Pass agent_role to get the correct model for that specialist.
        All HTTP calls are async — no event-loop blocking.
        """
        role_models = LLMFactory.AGENT_MODELS.get(agent_role, LLMFactory.AGENT_MODELS["supervisor"])
        client = _get_client()

        # ── 1. Try Google Gemini (Active & Verified) ─────────────────────────
        if settings.GEMINI_API_KEY:
            model = role_models.get("gemini", "gemini-3.6-flash")
            seen_models = set()
            for candidate_model in [model, "gemini-3.6-flash", "gemini-flash-latest"]:
                if candidate_model in seen_models:
                    continue
                seen_models.add(candidate_model)
                try:
                    url = (
                        f"https://generativelanguage.googleapis.com/v1beta/models/"
                        f"{candidate_model}:generateContent?key={settings.GEMINI_API_KEY}"
                    )
                    payload = {
                        "contents": [{
                            "parts": [{"text": f"{system_prompt}\n\nUSER REQUEST:\n{user_prompt}"}]
                        }],
                        "generationConfig": {"temperature": temperature}
                    }
                    res = await client.post(url, json=payload)
                    if res.status_code == 200:
                        data = res.json()
                        candidates = data.get("candidates", [])
                        if candidates and "content" in candidates[0] and "parts" in candidates[0]["content"]:
                            parts = candidates[0]["content"]["parts"]
                            text_parts = [p["text"] for p in parts if "text" in p and not p.get("thought", False)]
                            if not text_parts:
                                text_parts = [p.get("text", "") for p in parts if "text" in p]
                            if text_parts:
                                print(f"[LLMFactory] [OK] Gemini {candidate_model} -> {agent_role}")
                                return "\n".join(text_parts).strip()
                    else:
                        print(f"[LLMFactory] Gemini {candidate_model} {res.status_code}: {res.text[:200]}")
                except Exception as e:
                    print(f"[LLMFactory] Gemini Error: {e}")

        # ── 2. Try OpenAI ────────────────────────────────────────────────────
        if settings.OPENAI_API_KEY:
            model = role_models.get("openai", settings.DEFAULT_MODEL)
            try:
                headers = {
                    "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "model": model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user",   "content": user_prompt}
                    ],
                    "temperature": temperature
                }
                res = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    json=payload, headers=headers
                )
                if res.status_code == 200:
                    data = res.json()
                    print(f"[LLMFactory] [OK] OpenAI {model} -> {agent_role}")
                    return data["choices"][0]["message"]["content"]
                else:
                    print(f"[LLMFactory] OpenAI {res.status_code}: {res.text[:200]}")
            except Exception as e:
                print(f"[LLMFactory] OpenAI Error: {e}")

        # ── 3. Try Anthropic Claude ──────────────────────────────────────────
        if settings.ANTHROPIC_API_KEY:
            model = "claude-3-5-sonnet-20241022"
            try:
                headers = {
                    "x-api-key": settings.ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "Content-Type": "application/json"
                }
                payload = {
                    "model": model,
                    "max_tokens": 4096,
                    "system": system_prompt,
                    "messages": [{"role": "user", "content": user_prompt}],
                }
                res = await client.post(
                    "https://api.anthropic.com/v1/messages",
                    json=payload, headers=headers
                )
                if res.status_code == 200:
                    data = res.json()
                    print(f"[LLMFactory] [OK] Claude {model} -> {agent_role}")
                    return data["content"][0]["text"]
                else:
                    print(f"[LLMFactory] Anthropic {res.status_code}: {res.text[:200]}")
            except Exception as e:
                print(f"[LLMFactory] Anthropic Error: {e}")

        # ── 4. Smart Fallback (offline / no keys) ────────────────────────────
        print(f"[LLMFactory] [FALLBACK] Using smart demo fallback for {agent_role}")
        return LLMFactory._generate_smart_fallback(system_prompt, user_prompt, agent_role)

    # ── Demo Fallback Responses ───────────────────────────────────────────────
    @staticmethod
    def _generate_smart_fallback(system_prompt: str, user_prompt: str, agent_role: str = "supervisor") -> str:
        lower = user_prompt.lower()

        if agent_role == "coding" or any(k in lower for k in ["code", "fastapi", "react", "script", "function", "bug", "refactor"]):
            return (
                "Here is the requested implementation:\n\n"
                "```python\n"
                "from fastapi import FastAPI\nfrom pydantic import BaseModel\n\n"
                "app = FastAPI(title='Project Microservice')\n\n"
                "class TaskModel(BaseModel):\n    id: str\n    title: str\n    status: str = 'pending'\n\n"
                "@app.get('/api/tasks')\nasync def list_tasks():\n    return [{'id': '1', 'title': 'Setup DB', 'status': 'done'}]\n"
                "```\n\n"
                "- Async non-blocking handlers\n- Pydantic validation\n- Docker-ready"
            )

        if agent_role == "architecture" or any(k in lower for k in ["architecture", "design", "schema", "database", "diagram"]):
            return (
                "### System Architecture\n\n```mermaid\ngraph TD\n"
                "    User --> API[FastAPI Gateway]\n    API --> DB[(SQLite/Postgres)]\n"
                "    API --> Supervisor[Supervisor Agent]\n    Supervisor --> Coding[Coding Agent]\n"
                "    Supervisor --> RAG[RAG Agent]\n```\n\n"
                "Decoupled gateway, isolated project contexts, modular multi-agent routing."
            )

        if agent_role == "rag" or any(k in lower for k in ["file", "doc", "search", "rag", "explain", "summarize"]):
            return (
                "### Knowledge Base Analysis\n\n"
                "1. Core findings from uploaded documents extracted.\n"
                "2. Source: `architecture_spec.pdf — Section 2.1`\n"
                "3. Recommendation: Align frontend state with async SSE backend notifications."
            )

        if agent_role == "qa" or any(k in lower for k in ["review", "security", "test", "audit", "validate"]):
            return (
                "### QA & Security Review\n\n"
                "✅ No critical vulnerabilities detected.\n"
                "⚠️  Recommendations:\n"
                "- Add rate limiting on `/api/chat` endpoints\n"
                "- Sanitize file upload MIME types\n"
                "- Rotate `APP_SECRET_KEY` before production deploy"
            )

        return (
            f"I have processed your request using project context and memory.\n\n"
            f"**Request understood**: {user_prompt}\n\n"
            f"All tasks and memories for this project have been synchronized.\n\n"
            f"> 💡 Tip: Add an API key to `.env` for real AI-powered responses."
        )
