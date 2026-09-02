# 🚀 multim-project — Developer Multi-Agent AI Project Workspace

A persistent, secure, scalable AI Project Workspace inspired by ChatGPT Projects, Claude Projects, and Gemini Workspaces built specifically for software developers and technical teams.

```
                                  +---------------------------------------+
                                  |    Next.js / React Frontend (Client)   |
                                  |  Bootstrap 5 + Modern Developer UI    |
                                  +-------------------+-------------------+
                                                      | REST API / SSE
                                                      v
                                  +---------------------------------------+
                                  |        FastAPI Backend (Server)       |
                                  +-------------------+-------------------+
                                                      |
                  +-----------------------------------+-----------------------------------+
                  |                                   |                                   |
                  v                                   v                                   v
    +---------------------------+       +---------------------------+       +---------------------------+
    |  Supervisor Agent Router  |       |   RAG & Document Engine   |       | Project Memory & Context  |
    +-------------+-------------+       | (PyPDF/Text -> Chunking   |       | (Fact Extraction, Rules,  |
                  |                     |  -> RAG Vector Search)    |       |  Dynamic Context Assembly)|
       +----------+----------+          +---------------------------+       +---------------------------+
       |          |          |
       v          v          v
  +--------+  +--------+  +--------+
  | Coding |  | Arch.  |  | Doc    |
  | Slave  |  | Slave  |  | Slave  |
  +--------+  +--------+  +--------+
```

---

## 🌟 Key Features & Capabilities

1. **Multi-Agent Orchestrator**:
   - **Supervisor Agent (Master Router)**: Evaluates developer query intent & length. Answers simple queries directly for maximum speed.
   - **Coding Specialist Agent (Slave-1)**: Full-stack code generation, refactoring, unit tests, and script execution.
   - **Architecture Specialist Agent (Slave-2)**: System architecture blueprints, microservices design, and **Mermaid.js** diagrams.
   - **Research & RAG Specialist Agent (Slave-3)**: RAG document search over uploaded PDFs, Markdown, and codebase files with citations.
   - **Review & QA Specialist Agent (Slave-4)**: Code review, security auditing, and test validation.
2. **Persistent Context & Instructions**:
   - Dynamic context assembly: System Rules → Developer Rules → Project Instructions → Class Instructions → Memories → RAG Chunks → Chat History.
3. **Configurable Workstream Classes**:
   - 12 standard department classes + `+ Add Class` modal for custom workstreams (Mobile, ML, Payments, etc.).
4. **Private Personal Assistant**:
   - Floating `✨ Personal Assistant` drawer button with 100% private conversation history.
5. **Project State & Task Kanban Board**:
   - Kanban Board, List View, Roadmap Timeline, and AI Subtask Generator.
6. **Artifacts Studio**:
   - Persistent code snippets, Mermaid diagrams, version history, version restoration, and downloading.

---

## 📁 Directory Structure

- `client/`: Next.js / React app with Bootstrap 5 & modern dark glassmorphism stylesheet.
- `server/`: Python FastAPI app with Async SQLAlchemy, LangChain multi-agent framework, and RAG service.

---

## ⚡ How to Run

### Method 1: Double-Click Launcher
Double-click `start_workspace.bat` inside `multim-project`.

### Method 2: Manual Commands
```bash
# Backend (Server)
cd server
python run.py

# Frontend (Client)
cd client
npm run dev
```
