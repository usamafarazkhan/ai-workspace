'use client';

import React, { useState } from 'react';

export default function ProjectOverviewTab({
  project,
  classesCount = 0,
  tasksCount = 0,
  artifactsCount = 0,
  onNavigateTab,
  onLaunchPrompt,
  onOpenMembersModal
}) {
  const [completedSteps, setCompletedSteps] = useState({
    init: true,
    code: false,
    arch: false,
    rag: false,
    tasks: false
  });

  if (!project) return null;

  const toggleStep = (step) => {
    setCompletedSteps((prev) => ({ ...prev, [step]: !prev[step] }));
  };

  const completedCount = Object.values(completedSteps).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / 5) * 100);

  const promptStarters = [
    {
      category: 'Coding & APIs',
      icon: 'bi-code-slash text-cyan',
      prompt: `Generate a production-ready Python FastAPI authentication module with JWT tokens, password hashing, and user registration for ${project.name}.`,
      label: 'Build FastAPI Auth & JWT System'
    },
    {
      category: 'Frontend & UI',
      icon: 'bi-window-desktop text-blue',
      prompt: `Write a responsive modern Next.js 14 dashboard overview component with dark mode, interactive charts, and Tailwind/CSS tokens for ${project.name}.`,
      label: 'Create Modern Next.js Dashboard UI'
    },
    {
      category: 'Architecture & Schemas',
      icon: 'bi-diagram-3-fill text-purple',
      prompt: `Create a comprehensive system architecture diagram in Mermaid format and PostgreSQL database schema (with tables, relationships, and indexes) for ${project.name}.`,
      label: 'Design System Architecture & DB Schema'
    },
    {
      category: 'Security & Quality',
      icon: 'bi-shield-check text-emerald',
      prompt: `Perform a full security review and test suite plan (unit tests + integration tests) for ${project.name} APIs and state management.`,
      label: 'Run Security Audit & Test Plan'
    }
  ];

  return (
    <div className="container-fluid p-0">
      {/* ── Top Hero Card ────────────────────────────────────────────────────── */}
      <div className="dark-card p-4 p-lg-5 mb-4 position-relative overflow-hidden shadow-lg" style={{ background: 'linear-gradient(135deg, rgba(18, 28, 54, 0.95) 0%, rgba(9, 14, 28, 0.95) 100%)' }}>
        {/* Background Ambient Watermark */}
        <div
          className="position-absolute top-0 end-0 p-4 opacity-10"
          style={{ pointerEvents: 'none', fontSize: '9rem', lineHeight: '0', color: 'var(--accent-cyan)' }}
        >
          <i className="bi bi-cpu"></i>
        </div>

        <div className="row align-items-center position-relative" style={{ zIndex: 2 }}>
          <div className="col-12 col-lg-8">
            <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
              <span className="badge px-3 py-1 fw-bold" style={{ fontSize: '0.75rem', background: 'rgba(6, 182, 212, 0.15)', color: '#38bdf8', border: '1px solid rgba(6, 182, 212, 0.35)' }}>
                {project.public_project_id || 'PRJ-DF7K2Q'}
              </span>
              <span className="badge bg-emerald bg-opacity-20 text-emerald border border-emerald px-3 py-1 fw-semibold" style={{ fontSize: '0.75rem' }}>
                <span className="pulse-dot bg-emerald me-1"></span>
                {project.status?.toUpperCase() || 'ACTIVE WORKSPACE'}
              </span>
              <span className="badge bg-secondary bg-opacity-30 text-light px-3 py-1 border border-secondary border-opacity-30" style={{ fontSize: '0.75rem' }}>
                Visibility: {project.visibility?.toUpperCase() || 'TEAM'}
              </span>
            </div>

            <h1 className="fw-bold text-white mb-2" style={{ fontSize: '2rem', letterSpacing: '-0.5px' }}>
              {project.name}
            </h1>
            <p className="text-secondary mb-4" style={{ maxWidth: '750px', lineHeight: '1.65', fontSize: '0.94rem' }}>
              {project.description || 'Welcome to your AI-accelerated multi-agent workspace. Use the guided next steps below to jump straight into coding, architecture design, or document synthesis.'}
            </p>

            <div className="d-flex flex-wrap align-items-center gap-4 text-secondary small pt-1">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-person-circle text-cyan fs-5"></i>
                <span>Lead: <strong className="text-white">{project.owner_name}</strong></span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-rocket-takeoff text-purple fs-5"></i>
                <span>Phase: <strong className="text-white">{project.current_phase || 'Development & Architecture'}</strong></span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-calendar3 text-amber fs-5"></i>
                <span>Created: <strong className="text-white">{new Date(project.created_at || Date.now()).toLocaleDateString()}</strong></span>
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-4 mt-4 mt-lg-0 text-lg-end">
            <div className="d-flex flex-column flex-sm-row justify-content-lg-end gap-3">
              <button
                className="btn btn-cyan px-4 py-2 d-flex align-items-center justify-content-center gap-2"
                onClick={() => onNavigateTab && onNavigateTab('chats')}
              >
                <i className="bi bi-chat-dots-fill"></i>
                <span>Open AI Chat</span>
              </button>
              <button
                className="btn btn-outline-glass px-4 py-2 d-flex align-items-center justify-content-center gap-2"
                onClick={() => onNavigateTab && onNavigateTab('tasks')}
              >
                <i className="bi bi-kanban"></i>
                <span>Tasks Board</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Guided Next Steps: Interactive Action Pathway ────────────────────── */}
      <div className="dark-card p-4 p-lg-5 mb-4">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
          <div>
            <h5 className="fw-bold text-white mb-1 d-flex align-items-center gap-2" style={{ fontSize: '1.2rem' }}>
              <i className="bi bi-compass text-cyan fs-4"></i>
              What to Do Next: Recommended Action Guide
            </h5>
            <p className="text-secondary small mb-0" style={{ fontSize: '0.88rem' }}>
              New to this workspace? Follow these 5 interactive steps to bootstrap your project with multi-agent AI.
            </p>
          </div>

          {/* Readiness Meter */}
          <div className="d-flex align-items-center gap-3 bg-dark bg-opacity-70 p-2 px-3 rounded-pill border border-secondary border-opacity-30">
            <div className="text-end">
              <span className="text-muted d-block fw-semibold" style={{ fontSize: '0.68rem', letterSpacing: '0.5px' }}>WORKSPACE READINESS</span>
              <div className="fw-bold text-cyan" style={{ fontSize: '0.92rem' }}>{progressPercent}% Complete</div>
            </div>
            <div className="progress" style={{ width: '110px', height: '10px', backgroundColor: '#090e1c', borderRadius: '10px' }}>
              <div
                className="progress-bar bg-info progress-bar-striped progress-bar-animated"
                role="progressbar"
                style={{ width: `${progressPercent}%`, background: 'linear-gradient(90deg, #06b6d4, #3b82f6)' }}
              ></div>
            </div>
          </div>
        </div>

        <div className="row g-3">
          {/* Step 1: Code Generation */}
          <div className="col-12 col-md-6 col-xl-4">
            <div className="action-guide-card">
              <div className="d-flex align-items-start justify-content-between mb-3">
                <div className="p-2 rounded-3 text-cyan fs-4 d-flex align-items-center justify-content-center" style={{ width: 44, height: 44, background: 'rgba(6, 182, 212, 0.15)' }}>
                  <i className="bi bi-code-square"></i>
                </div>
                <span className="badge fw-bold" style={{ background: 'rgba(6, 182, 212, 0.2)', color: '#38bdf8' }}>STEP 1</span>
              </div>
              <h6 className="fw-bold text-white mb-2" style={{ fontSize: '0.98rem' }}>1. Generate Production Code</h6>
              <p className="text-secondary small flex-grow-1" style={{ fontSize: '0.84rem', lineHeight: '1.6' }}>
                Ask the <strong className="text-white">Coding & Execution Agent</strong> to write backend APIs, database models, or Next.js components.
              </p>
              <button
                className="btn btn-sm btn-cyan w-100 mt-3 py-2"
                onClick={() => {
                  toggleStep('code');
                  if (onLaunchPrompt) {
                    onLaunchPrompt(`Generate backend API microservices and database models for ${project.name}`);
                  } else if (onNavigateTab) {
                    onNavigateTab('chats');
                  }
                }}
              >
                <i className="bi bi-play-fill me-1"></i> Launch Coding Agent
              </button>
            </div>
          </div>

          {/* Step 2: Architecture & Schemas */}
          <div className="col-12 col-md-6 col-xl-4">
            <div className="action-guide-card">
              <div className="d-flex align-items-start justify-content-between mb-3">
                <div className="p-2 rounded-3 text-purple fs-4 d-flex align-items-center justify-content-center" style={{ width: 44, height: 44, background: 'rgba(139, 92, 246, 0.15)' }}>
                  <i className="bi bi-diagram-3"></i>
                </div>
                <span className="badge fw-bold" style={{ background: 'rgba(139, 92, 246, 0.2)', color: '#c084fc' }}>STEP 2</span>
              </div>
              <h6 className="fw-bold text-white mb-2" style={{ fontSize: '0.98rem' }}>2. Design System Architecture</h6>
              <p className="text-secondary small flex-grow-1" style={{ fontSize: '0.84rem', lineHeight: '1.6' }}>
                Let the <strong className="text-white">Architecture Agent</strong> generate interactive Mermaid flowcharts, database schemas, and service topologies.
              </p>
              <button
                className="btn btn-sm btn-outline-purple w-100 mt-3 py-2"
                onClick={() => {
                  toggleStep('arch');
                  if (onLaunchPrompt) {
                    onLaunchPrompt(`Generate a complete system architecture diagram in Mermaid and database schema for ${project.name}`);
                  } else if (onNavigateTab) {
                    onNavigateTab('chats');
                  }
                }}
              >
                <i className="bi bi-diagram-2 me-1"></i> Generate Architecture
              </button>
            </div>
          </div>

          {/* Step 3: Knowledge Base RAG */}
          <div className="col-12 col-md-6 col-xl-4">
            <div className="action-guide-card">
              <div className="d-flex align-items-start justify-content-between mb-3">
                <div className="p-2 rounded-3 text-amber fs-4 d-flex align-items-center justify-content-center" style={{ width: 44, height: 44, background: 'rgba(245, 158, 11, 0.15)' }}>
                  <i className="bi bi-file-earmark-arrow-up"></i>
                </div>
                <span className="badge fw-bold" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24' }}>STEP 3</span>
              </div>
              <h6 className="fw-bold text-white mb-2" style={{ fontSize: '0.98rem' }}>3. Upload Knowledge & Docs</h6>
              <p className="text-secondary small flex-grow-1" style={{ fontSize: '0.84rem', lineHeight: '1.6' }}>
                Upload PDF specifications, design requirements, or API contracts for AI RAG semantic search.
              </p>
              <button
                className="btn btn-sm btn-outline-cyan w-100 mt-3 py-2"
                onClick={() => {
                  toggleStep('rag');
                  if (onNavigateTab) onNavigateTab('knowledge');
                }}
              >
                <i className="bi bi-upload me-1"></i> Open Knowledge Base
              </button>
            </div>
          </div>

          {/* Step 4: Sprint Tasks */}
          <div className="col-12 col-md-6 col-xl-6">
            <div className="action-guide-card">
              <div className="d-flex align-items-start justify-content-between mb-3">
                <div className="p-2 rounded-3 text-emerald fs-4 d-flex align-items-center justify-content-center" style={{ width: 44, height: 44, background: 'rgba(16, 185, 129, 0.15)' }}>
                  <i className="bi bi-kanban"></i>
                </div>
                <span className="badge fw-bold" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>STEP 4</span>
              </div>
              <h6 className="fw-bold text-white mb-2" style={{ fontSize: '0.98rem' }}>4. Plan Kanban Tasks & Sprints</h6>
              <p className="text-secondary small flex-grow-1" style={{ fontSize: '0.84rem', lineHeight: '1.6' }}>
                Track development progress across Backlog, In Progress, and Completed columns. Convert AI chat messages directly into tasks.
              </p>
              <button
                className="btn btn-sm btn-outline-cyan w-100 mt-3 py-2"
                onClick={() => {
                  toggleStep('tasks');
                  if (onNavigateTab) onNavigateTab('tasks');
                }}
              >
                <i className="bi bi-list-check me-1"></i> Manage Tasks Board
              </button>
            </div>
          </div>

          {/* Step 5: Invite Members */}
          <div className="col-12 col-md-6 col-xl-6">
            <div className="action-guide-card">
              <div className="d-flex align-items-start justify-content-between mb-3">
                <div className="p-2 rounded-3 text-cyan fs-4 d-flex align-items-center justify-content-center" style={{ width: 44, height: 44, background: 'rgba(6, 182, 212, 0.15)' }}>
                  <i className="bi bi-people"></i>
                </div>
                <span className="badge fw-bold" style={{ background: 'rgba(6, 182, 212, 0.2)', color: '#38bdf8' }}>STEP 5</span>
              </div>
              <h6 className="fw-bold text-white mb-2" style={{ fontSize: '0.98rem' }}>5. Invite Team Collaborators</h6>
              <p className="text-secondary small flex-grow-1" style={{ fontSize: '0.84rem', lineHeight: '1.6' }}>
                Add developers, product leads, and QA specialists with custom role permissions to this workspace.
              </p>
              <button
                className="btn btn-sm btn-outline-glass w-100 mt-3 py-2"
                onClick={() => {
                  if (onOpenMembersModal) onOpenMembersModal();
                }}
              >
                <i className="bi bi-person-plus me-1"></i> Invite Collaborators
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Interactive 1-Click Prompt Starters ──────────────────────────────── */}
      <div className="dark-card p-4 p-lg-5 mb-4">
        <h5 className="fw-bold text-white mb-1 d-flex align-items-center gap-2" style={{ fontSize: '1.2rem' }}>
          <i className="bi bi-lightning-charge-fill text-amber"></i>
          Instant AI Quick-Starters (Click to Execute)
        </h5>
        <p className="text-secondary small mb-4" style={{ fontSize: '0.88rem' }}>
          Click any prompt card below to immediately dispatch it in your project's AI conversation:
        </p>

        <div className="row g-3">
          {promptStarters.map((item, idx) => (
            <div key={idx} className="col-12 col-md-6">
              <button
                className="prompt-chip d-flex align-items-center justify-content-between p-3 w-100"
                onClick={() => {
                  if (onLaunchPrompt) {
                    onLaunchPrompt(item.prompt);
                  } else if (onNavigateTab) {
                    onNavigateTab('chats');
                  }
                }}
              >
                <div className="d-flex align-items-center gap-3">
                  <div className="p-2 rounded-3 d-flex align-items-center justify-content-center bg-dark" style={{ width: 42, height: 42 }}>
                    <i className={`bi ${item.icon} fs-4`}></i>
                  </div>
                  <div>
                    <strong className="d-block text-white" style={{ fontSize: '0.92rem' }}>{item.label}</strong>
                    <span className="text-secondary" style={{ fontSize: '0.78rem' }}>{item.category} • One-Click AI Dispatch</span>
                  </div>
                </div>
                <i className="bi bi-arrow-right-short fs-3 text-cyan"></i>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Multi-Agent Specialist Team Roster ───────────────────────────────── */}
      <div className="dark-card p-4 p-lg-5 mb-4">
        <h5 className="fw-bold text-white mb-1 d-flex align-items-center gap-2" style={{ fontSize: '1.2rem' }}>
          <i className="bi bi-robot text-purple"></i>
          Active Multi-Agent AI Team
        </h5>
        <p className="text-secondary small mb-4" style={{ fontSize: '0.88rem' }}>
          Your project is powered by 4 specialized AI agents that automatically collaborate on your instructions:
        </p>

        <div className="row g-3">
          {/* Supervisor */}
          <div className="col-12 col-md-6 col-lg-3">
            <div className="agent-showcase-card h-100 d-flex flex-column justify-content-between">
              <div>
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <span className="badge" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#38bdf8', border: '1px solid rgba(6, 182, 212, 0.3)' }}>MASTER ROUTER</span>
                  <span className="text-emerald small fw-semibold"><span className="pulse-dot bg-emerald me-1"></span> Ready</span>
                </div>
                <h6 className="text-white fw-bold mb-2">Supervisor Orchestrator</h6>
                <p className="text-secondary small mb-3" style={{ fontSize: '0.8rem', lineHeight: '1.5' }}>
                  Analyzes request intent and delegates to the optimal specialist agent.
                </p>
              </div>
              <button
                className="btn btn-sm btn-outline-cyan w-100 py-2"
                onClick={() => onNavigateTab && onNavigateTab('chats')}
              >
                Chat with Supervisor
              </button>
            </div>
          </div>

          {/* Coding Slave */}
          <div className="col-12 col-md-6 col-lg-3">
            <div className="agent-showcase-card h-100 d-flex flex-column justify-content-between">
              <div>
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>SLAVE-1</span>
                  <span className="text-emerald small fw-semibold"><span className="pulse-dot bg-emerald me-1"></span> Ready</span>
                </div>
                <h6 className="text-white fw-bold mb-2">Coding & Execution</h6>
                <p className="text-secondary small mb-3" style={{ fontSize: '0.8rem', lineHeight: '1.5' }}>
                  Generates production code, scripts, bug fixes, unit tests, and API microservices.
                </p>
              </div>
              <button
                className="btn btn-sm btn-cyan w-100 py-2"
                onClick={() => {
                  if (onLaunchPrompt) onLaunchPrompt(`Write code for ${project.name}`);
                  else if (onNavigateTab) onNavigateTab('chats');
                }}
              >
                Request Code
              </button>
            </div>
          </div>

          {/* Arch Slave */}
          <div className="col-12 col-md-6 col-lg-3">
            <div className="agent-showcase-card h-100 d-flex flex-column justify-content-between">
              <div>
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <span className="badge" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#c084fc', border: '1px solid rgba(139, 92, 246, 0.3)' }}>SLAVE-2</span>
                  <span className="text-emerald small fw-semibold"><span className="pulse-dot bg-emerald me-1"></span> Ready</span>
                </div>
                <h6 className="text-white fw-bold mb-2">Architecture & Design</h6>
                <p className="text-secondary small mb-3" style={{ fontSize: '0.8rem', lineHeight: '1.5' }}>
                  Generates Mermaid diagrams, ERDs, database schemas, and microservice blueprints.
                </p>
              </div>
              <button
                className="btn btn-sm btn-outline-purple w-100 py-2"
                onClick={() => {
                  if (onLaunchPrompt) onLaunchPrompt(`Draw system architecture diagram for ${project.name}`);
                  else if (onNavigateTab) onNavigateTab('chats');
                }}
              >
                Design Blueprint
              </button>
            </div>
          </div>

          {/* RAG Slave */}
          <div className="col-12 col-md-6 col-lg-3">
            <div className="agent-showcase-card h-100 d-flex flex-column justify-content-between">
              <div>
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' }}>SLAVE-3</span>
                  <span className="text-emerald small fw-semibold"><span className="pulse-dot bg-emerald me-1"></span> Ready</span>
                </div>
                <h6 className="text-white fw-bold mb-2">Research & RAG</h6>
                <p className="text-secondary small mb-3" style={{ fontSize: '0.8rem', lineHeight: '1.5' }}>
                  Reads uploaded project files, performs semantic search, and extracts cited insights.
                </p>
              </div>
              <button
                className="btn btn-sm btn-outline-cyan w-100 py-2"
                onClick={() => onNavigateTab && onNavigateTab('knowledge')}
              >
                Search Knowledge
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Project Details, Tech Stack & Goals ──────────────────────────────── */}
      <div className="row g-4 mb-4">
        {/* Left: Tech Stack & Milestones */}
        <div className="col-12 col-lg-6">
          {/* Tech Stack */}
          <div className="dark-card p-4 mb-4">
            <h6 className="fw-bold text-white mb-3 d-flex align-items-center gap-2">
              <i className="bi bi-stack text-cyan"></i> Project Technologies
            </h6>
            <div className="d-flex flex-wrap gap-2">
              {(project.technologies || ['Next.js 14', 'FastAPI', 'PostgreSQL', 'Redis', 'Gemini 3.6 Flash', 'LangChain', 'Docker']).map((tech, idx) => (
                <span key={idx} className="badge bg-dark border border-secondary border-opacity-40 text-light py-2 px-3" style={{ fontSize: '0.82rem' }}>
                  <i className="bi bi-check2-circle text-cyan me-1"></i> {tech}
                </span>
              ))}
            </div>
          </div>

          {/* Goals */}
          <div className="dark-card p-4">
            <h6 className="fw-bold text-white mb-3 d-flex align-items-center gap-2">
              <i className="bi bi-flag-fill text-amber"></i> Strategic Goals & Milestones
            </h6>
            <ul className="list-group list-group-flush bg-transparent">
              {(project.goals || [
                'Build and test multi-agent supervisor routing engine',
                'Deploy 12 standard developer workstream classes',
                'Generate versioned code artifacts and system diagrams'
              ]).map((goal, idx) => (
                <li key={idx} className="list-group-item bg-transparent text-secondary border-secondary border-opacity-25 px-0 py-2 d-flex align-items-center gap-2" style={{ fontSize: '0.88rem' }}>
                  <i className="bi bi-check-square-fill text-emerald"></i>
                  <span className="text-light">{goal}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right: AI System Instructions */}
        <div className="col-12 col-lg-6">
          <div className="dark-card p-4 h-100">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h6 className="fw-bold text-white mb-0 d-flex align-items-center gap-2">
                <i className="bi bi-shield-check text-purple"></i> Project Instructions & Context
              </h6>
              <button
                className="btn btn-sm btn-outline-glass px-3"
                onClick={() => onNavigateTab && onNavigateTab('memory')}
              >
                Edit Memory
              </button>
            </div>

            <div className="mb-3">
              <small className="text-secondary fw-bold d-block mb-1" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>SYSTEM & ROLE INSTRUCTIONS</small>
              <div className="p-3 rounded bg-dark border border-secondary border-opacity-40 text-light small" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                {project.system_instructions || 'You are an expert AI software architect and senior developer assistant.'}
              </div>
            </div>

            <div>
              <small className="text-secondary fw-bold d-block mb-1" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>DEVELOPER ARCHITECTURE RULES</small>
              <div className="p-3 rounded bg-dark border border-secondary border-opacity-40 text-light small" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                {project.developer_rules || '1. Always write modular code.\n2. Output Mermaid diagrams for system architecture.\n3. Include type hints and docstrings.'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
