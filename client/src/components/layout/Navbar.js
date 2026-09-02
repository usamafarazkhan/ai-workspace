'use client';

import React, { useState } from 'react';

export default function Navbar({ activeProject, currentUser, onOpenMembersModal, onOpenNewProject, onOpenSearch, onSwitchActiveUser }) {
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="workspace-header py-2 px-3 px-lg-4 d-flex justify-content-between align-items-center position-relative">
      {/* Left Title & Project Info */}
      <div className="d-flex align-items-center gap-3 animate-fade-in">
        <div
          className="rounded-3 d-flex align-items-center justify-content-center text-white shadow-sm flex-shrink-0"
          style={{
            width: '42px', height: '42px',
            background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.35), 0 0 40px rgba(6, 182, 212, 0.15)',
            animation: 'breathe 4s ease-in-out infinite'
          }}
        >
          <i className="bi bi-cpu-fill fs-5"></i>
        </div>

        <div>
          <div className="d-flex align-items-center gap-2">
            <h6 className="mb-0 fw-bold text-white" style={{ letterSpacing: '-0.01em', fontSize: '1rem' }}>
              {activeProject?.name || 'AI Project Workspace'}
            </h6>
            {activeProject?.public_project_id && (
              <span className="badge px-2 py-1" style={{
                fontSize: '0.68rem',
                background: 'rgba(99, 102, 241, 0.12)',
                color: '#818cf8',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                borderRadius: '6px'
              }}>
                {activeProject.public_project_id}
              </span>
            )}
          </div>
          <div className="d-flex align-items-center gap-2 mt-1">
            <span className="badge bg-emerald bg-opacity-20 text-emerald border border-emerald px-2 py-0" style={{ fontSize: '0.63rem', borderRadius: '6px' }}>
              <span className="pulse-dot bg-emerald me-1"></span>
              {activeProject?.status?.toUpperCase() || 'ACTIVE'}
            </span>
            <small className="text-secondary" style={{ fontSize: '0.73rem' }}>
              {activeProject ? `Phase: ${activeProject.current_phase || 'Phase 1 — Development'}` : 'Developer Multi-Agent Environment'}
            </small>
          </div>
        </div>
      </div>

      {/* Center Search Trigger & Agent Status Badges */}
      <div className="d-none d-md-flex align-items-center gap-3">
        <button
          className="nav-search-btn"
          onClick={onOpenSearch}
          title="Search all workspace entities (Ctrl + K)"
        >
          <i className="bi bi-search text-cyan"></i>
          <span>Search Workspace...</span>
          <span className="kbd-shortcut">Ctrl K</span>
        </button>

        <div className="d-none d-xl-flex align-items-center gap-2">
          <span className="agent-badge badge-supervisor" style={{ animationDelay: '0s' }}>
            <span className="pulse-dot" style={{ backgroundColor: '#38bdf8' }}></span>
            <i className="bi bi-shield-check"></i> Supervisor
          </span>
          <span className="agent-badge badge-coding" style={{ animationDelay: '0.1s' }}>
            <span className="pulse-dot" style={{ backgroundColor: '#34d399' }}></span>
            <i className="bi bi-code-slash"></i> Coding
          </span>
          <span className="agent-badge badge-arch" style={{ animationDelay: '0.2s' }}>
            <span className="pulse-dot" style={{ backgroundColor: '#c084fc' }}></span>
            <i className="bi bi-diagram-3"></i> Arch
          </span>
          <span className="agent-badge badge-doc" style={{ animationDelay: '0.3s' }}>
            <span className="pulse-dot" style={{ backgroundColor: '#fbbf24' }}></span>
            <i className="bi bi-search"></i> RAG
          </span>
        </div>
      </div>

      {/* Right User Profile & Action Controls */}
      <div className="d-flex align-items-center gap-2">
        <button
          className="btn btn-sm btn-outline-glass d-flex align-items-center gap-2 px-3 py-1"
          onClick={onOpenMembersModal}
        >
          <i className="bi bi-people-fill text-indigo"></i>
          <span className="d-none d-sm-inline">Team ({activeProject?.members?.length || 1})</span>
        </button>

        <button
          className="btn btn-sm btn-cyan d-flex align-items-center gap-2 px-3 py-1"
          onClick={onOpenNewProject}
        >
          <i className="bi bi-plus-lg"></i>
          <span className="d-none d-sm-inline">New Project</span>
        </button>

        {/* User Member Identity Badge with Switcher */}
        <div className="position-relative ps-2 ms-2 border-start border-secondary border-opacity-20">
          <div
            className="d-flex align-items-center gap-2 cursor-pointer p-1 rounded-3 transition-all hover-bg-dark"
            onClick={() => setShowUserMenu(!showUserMenu)}
            title="Click to switch active member identity"
            style={{ cursor: 'pointer' }}
          >
            <div className="position-relative">
              <img
                src={currentUser?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                alt="Avatar"
                className="rounded-circle"
                style={{
                  width: '36px', height: '36px', objectFit: 'cover',
                  border: '2px solid rgba(99, 102, 241, 0.4)',
                  boxShadow: '0 0 14px rgba(99, 102, 241, 0.25)'
                }}
              />
              <span
                className="position-absolute bottom-0 end-0 rounded-circle bg-emerald"
                style={{ width: '10px', height: '10px', border: '2px solid #050810' }}
              ></span>
            </div>

            <div className="d-none d-lg-block text-start">
              <div className="d-flex align-items-center gap-1">
                <span className="fw-bold text-white" style={{ fontSize: '0.82rem', lineHeight: '1.1' }}>
                  You
                </span>
                <span className="text-secondary small" style={{ fontSize: '0.72rem' }}>
                  ({currentUser?.full_name?.split(' ')[0] || 'Member'})
                </span>
              </div>
              <div className="d-flex align-items-center gap-1 mt-0.5">
                <span className="badge px-1.5 py-0" style={{
                  fontSize: '0.62rem',
                  background: 'rgba(99, 102, 241, 0.12)',
                  color: '#818cf8',
                  border: '1px solid rgba(99, 102, 241, 0.25)'
                }}>
                  {currentUser?.role || 'Frontend Developer'}
                </span>
                <code className="text-cyan fw-bold" style={{ fontSize: '0.64rem' }}>
                  {currentUser?.public_member_id || 'USR-FE-7A29X4'}
                </code>
              </div>
            </div>
            <i className="bi bi-chevron-down text-secondary ms-1 small"></i>
          </div>

          {/* Quick Active Member Switcher Dropdown */}
          {showUserMenu && (
            <div
              className="position-absolute top-100 end-0 mt-2 p-3 rounded-3 shadow-2xl dark-card text-light animate-scale-in"
              style={{
                width: '320px', zIndex: 1070,
                background: 'rgba(8, 13, 26, 0.96)',
                backdropFilter: 'blur(24px)',
                border: '1px solid rgba(99, 102, 241, 0.15)'
              }}
            >
              <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom border-secondary border-opacity-20">
                <span className="fw-bold text-white small d-flex align-items-center gap-1">
                  <i className="bi bi-person-badge text-indigo"></i> Active Member Identity
                </span>
                <button className="btn btn-xs btn-outline-glass p-0 px-1" onClick={() => setShowUserMenu(false)}>
                  <i className="bi bi-x"></i>
                </button>
              </div>

              <div className="p-2 mb-3 rounded-3 border border-secondary border-opacity-20" style={{ background: 'rgba(99, 102, 241, 0.06)' }}>
                <div className="text-white fw-bold small">{currentUser?.full_name || 'Muhammad Fahad'}</div>
                <div className="text-secondary small" style={{ fontSize: '0.74rem' }}>{currentUser?.email || 'fahad@workspace.dev'}</div>
                <div className="d-flex align-items-center justify-content-between mt-2 pt-1 border-top border-secondary border-opacity-15">
                  <span className="badge px-2 py-0" style={{
                    fontSize: '0.66rem',
                    background: 'rgba(99, 102, 241, 0.12)',
                    color: '#818cf8',
                    border: '1px solid rgba(99, 102, 241, 0.25)'
                  }}>
                    {currentUser?.role || 'Frontend Developer'}
                  </span>
                  <code className="text-cyan fw-bold" style={{ fontSize: '0.7rem' }}>
                    {currentUser?.public_member_id || 'USR-FE-7A29X4'}
                  </code>
                </div>
              </div>

              <label className="text-secondary fw-bold d-block mb-1" style={{ fontSize: '0.66rem', letterSpacing: '0.8px' }}>
                SWITCH ACTIVE IDENTITY:
              </label>

              <div className="d-flex flex-column gap-1 mb-2">
                {/* Muhammad Fahad Preset */}
                <button
                  className="btn btn-sm btn-outline-glass text-start py-1.5 px-2 d-flex align-items-center justify-content-between"
                  onClick={() => {
                    onSwitchActiveUser && onSwitchActiveUser({
                      full_name: 'Muhammad Fahad',
                      email: 'fahad@workspace.dev',
                      role: 'Frontend Developer',
                      member_id: 'USR-FE-7A29X4'
                    });
                    setShowUserMenu(false);
                  }}
                >
                  <div>
                    <span className="d-block text-white fw-semibold" style={{ fontSize: '0.78rem' }}>Muhammad Fahad</span>
                    <small className="text-secondary" style={{ fontSize: '0.68rem' }}>Frontend Developer</small>
                  </div>
                  <code className="text-cyan" style={{ fontSize: '0.68rem' }}>USR-FE-7A29X4</code>
                </button>

                {/* Project Members List */}
                {activeProject?.members?.filter(m => m.public_member_id !== currentUser?.public_member_id).map(m => (
                  <button
                    key={m.id}
                    className="btn btn-sm btn-outline-glass text-start py-1.5 px-2 d-flex align-items-center justify-content-between"
                    onClick={() => {
                      onSwitchActiveUser && onSwitchActiveUser({
                        full_name: m.user_name,
                        email: m.user_email,
                        role: m.role,
                        member_id: m.public_member_id
                      });
                      setShowUserMenu(false);
                    }}
                  >
                    <div>
                      <span className="d-block text-white fw-semibold text-truncate" style={{ maxWidth: '140px', fontSize: '0.78rem' }}>{m.user_name}</span>
                      <small className="text-secondary" style={{ fontSize: '0.68rem' }}>{m.role}</small>
                    </div>
                    <code className="text-cyan" style={{ fontSize: '0.68rem' }}>{m.public_member_id}</code>
                  </button>
                ))}
              </div>

              <button
                className="btn btn-sm btn-outline-cyan w-100 py-1.5 text-center mt-1"
                style={{ fontSize: '0.76rem' }}
                onClick={() => {
                  setShowUserMenu(false);
                  onOpenMembersModal && onOpenMembersModal();
                }}
              >
                <i className="bi bi-people me-1"></i> Manage All Team Members
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
