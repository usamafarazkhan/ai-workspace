'use client';

import React, { useState, useEffect } from 'react';
import { addProjectMember, updateProjectMember, deleteProjectMember, getProjectMembers } from '../../lib/api';

const AVAILABLE_ROLES = [
  { id: 'Frontend Developer', label: 'Frontend Development', prefix: 'USR-FE', desc: 'Next.js, React UI components, state management & CSS' },
  { id: 'Backend Developer', label: 'Backend Development', prefix: 'USR-BE', desc: 'FastAPI, async REST APIs, JWT authentication & controllers' },
  { id: 'Database Developer', label: 'Database', prefix: 'USR-DB', desc: 'PostgreSQL schemas, table structures, indexing & migrations' },
  { id: 'Documentation Specialist', label: 'Documentation', prefix: 'USR-DOC', desc: 'Markdown technical docs, API specs & architecture guides' },
  { id: 'UI/UX Designer', label: 'UI/UX Design', prefix: 'USR-UI', desc: 'Design system tokens, color palettes & responsive flows' },
  { id: 'System Architect', label: 'Architecture', prefix: 'USR-ARCH', desc: 'System blueprints, Mermaid flowcharts & microservice topologies' },
  { id: 'QA & Test Engineer', label: 'Testing & QA', prefix: 'USR-QA', desc: 'Pytest test suites, integration tests & quality verification' },
  { id: 'DevOps Engineer', label: 'DevOps & Deployment', prefix: 'USR-DEVOPS', desc: 'Docker containers, CI/CD pipelines & deployment configurations' },
  { id: 'Security Specialist', label: 'Security', prefix: 'USR-SEC', desc: 'Vulnerability audits, SAIF compliance & authentication policies' },
  { id: 'Research Analyst', label: 'Research', prefix: 'USR-RES', desc: 'Technical research, document synthesis & RAG indexing' },
  { id: 'Project Manager', label: 'Project Management', prefix: 'USR-PM', desc: 'Sprint task planning, Kanban tracking & milestone coordination' },
];

export default function MemberModal({ project, currentUser, show, onClose, onMemberAdded, onSwitchActiveUser }) {
  const [membersList, setMembersList] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [role, setRole] = useState('Frontend Developer');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [editRole, setEditRole] = useState('');

  useEffect(() => {
    if (show && project?.id) {
      loadMembers();
    }
  }, [show, project?.id]);

  const loadMembers = async () => {
    if (!project?.id) return;
    setLoadingMembers(true);
    try {
      const res = await getProjectMembers(project.id);
      setMembersList(res.data);
    } catch (err) {
      console.error('Error fetching project members:', err);
      // Fallback to project.members if available
      if (project.members) setMembersList(project.members);
    } finally {
      setLoadingMembers(false);
    }
  };

  if (!show) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!userName.trim() || !userEmail.trim()) return;
    if (!project?.id) {
      setErrorMessage('No active project found. Please select a project first.');
      return;
    }

    setLoading(true);
    try {
      const res = await addProjectMember(project.id, {
        user_name: userName.trim(),
        user_email: userEmail.trim(),
        role: role,
        specialty: role
      });
      setSuccessMessage(`Successfully invited ${res.data.user_name} with Member ID: ${res.data.public_member_id}`);
      setUserName('');
      setUserEmail('');
      await loadMembers();
      if (onMemberAdded) onMemberAdded();
    } catch (err) {
      console.error('Error adding member:', err);
      const detail = err.response?.data?.detail || err.message || 'Failed to invite member';
      setErrorMessage(detail);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (memberId) => {
    if (!editRole || !project?.id) return;
    setErrorMessage('');
    try {
      await updateProjectMember(project.id, memberId, { role: editRole });
      setEditingMemberId(null);
      await loadMembers();
      if (onMemberAdded) onMemberAdded();
    } catch (err) {
      console.error('Error updating member role:', err);
      const detail = err.response?.data?.detail || err.message || 'Failed to update role';
      setErrorMessage(detail);
    }
  };

  const handleDeleteMember = async (memberId, name) => {
    if (!window.confirm(`Remove ${name} from this project workspace?`)) return;
    setErrorMessage('');
    try {
      await deleteProjectMember(project.id, memberId);
      await loadMembers();
      if (onMemberAdded) onMemberAdded();
    } catch (err) {
      console.error('Error deleting member:', err);
      const detail = err.response?.data?.detail || err.message || 'Failed to delete member';
      setErrorMessage(detail);
    }
  };

  const currentRoleObj = AVAILABLE_ROLES.find(r => r.id === role);

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 1080 }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content dark-card border-secondary text-light shadow-2xl overflow-hidden">
          <div className="modal-header dark-card-header d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2">
              <div
                className="rounded-3 d-flex align-items-center justify-content-center text-white"
                style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #06b6d4, #3b82f6)' }}
              >
                <i className="bi bi-people-fill fs-5"></i>
              </div>
              <div>
                <h5 className="modal-title text-white fw-bold mb-0">Project Member Identity & Roles</h5>
                <small className="text-secondary" style={{ fontSize: '0.72rem' }}>
                  Permanent Member ID binding: Email → Member ID → Name → Role → Permissions
                </small>
              </div>
            </div>
            <button className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          <div className="modal-body p-4" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
            {/* Feedback Alerts */}
            {errorMessage && (
              <div className="alert alert-danger py-2 px-3 mb-3 d-flex align-items-center justify-content-between" style={{ fontSize: '0.84rem' }}>
                <div><i className="bi bi-exclamation-triangle-fill me-2"></i>{errorMessage}</div>
                <button className="btn btn-xs btn-close p-0" onClick={() => setErrorMessage('')}></button>
              </div>
            )}

            {successMessage && (
              <div className="alert alert-success py-2 px-3 mb-3 d-flex align-items-center justify-content-between" style={{ fontSize: '0.84rem', background: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.3)', color: '#34d399' }}>
                <div><i className="bi bi-check-circle-fill me-2"></i>{successMessage}</div>
                <button className="btn btn-xs btn-close btn-close-white p-0" onClick={() => setSuccessMessage('')}></button>
              </div>
            )}

            {/* Existing Bound Project Members */}
            <div className="d-flex align-items-center justify-content-between mb-2">
              <h6 className="text-cyan mb-0 fw-bold d-flex align-items-center gap-2" style={{ fontSize: '0.92rem' }}>
                <i className="bi bi-shield-check"></i>
                Active Project Members ({membersList.length})
              </h6>
              {loadingMembers && (
                <span className="spinner-border spinner-border-sm text-cyan" role="status"></span>
              )}
            </div>

            <div className="mb-4 d-flex flex-column gap-2">
              {membersList.length === 0 && !loadingMembers ? (
                <div className="p-3 text-center text-secondary small bg-dark rounded-3 border border-secondary border-opacity-25">
                  No additional members invited yet. Use the form below to bind your first team member!
                </div>
              ) : (
                membersList.map((m) => {
                  const isCurrentActive = currentUser?.public_member_id === m.public_member_id;
                  return (
                    <div
                      key={m.id}
                      className={`p-3 rounded-3 border transition-all ${
                        isCurrentActive
                          ? 'bg-cyan bg-opacity-10 border-cyan'
                          : 'bg-dark bg-opacity-60 border-secondary border-opacity-30'
                      }`}
                    >
                      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2">
                        <div>
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <strong className="text-white" style={{ fontSize: '0.92rem' }}>
                              {m.user_name}
                            </strong>
                            {isCurrentActive && (
                              <span className="badge bg-cyan text-dark fw-bold" style={{ fontSize: '0.65rem' }}>
                                YOU (ACTIVE)
                              </span>
                            )}
                            <span className="badge bg-secondary bg-opacity-40 text-light border border-secondary border-opacity-30" style={{ fontSize: '0.7rem' }}>
                              {m.role}
                            </span>
                          </div>
                          <div className="d-flex flex-wrap align-items-center gap-3 text-secondary" style={{ fontSize: '0.76rem' }}>
                            <span><i className="bi bi-envelope me-1 text-cyan"></i>{m.user_email}</span>
                            <span>
                              <i className="bi bi-key-fill me-1 text-amber"></i>
                              Member ID: <code className="text-cyan fw-bold">{m.public_member_id}</code>
                            </span>
                          </div>
                        </div>

                        {/* Member Actions */}
                        <div className="d-flex align-items-center gap-2 flex-shrink-0">
                          {editingMemberId === m.id ? (
                            <div className="d-flex align-items-center gap-1">
                              <select
                                className="form-select dark-input form-select-sm py-1"
                                style={{ fontSize: '0.75rem' }}
                                value={editRole}
                                onChange={(e) => setEditRole(e.target.value)}
                              >
                                {AVAILABLE_ROLES.map((r) => (
                                  <option key={r.id} value={r.id}>{r.label} ({r.prefix})</option>
                                ))}
                              </select>
                              <button
                                className="btn btn-xs btn-cyan px-2 py-1"
                                style={{ fontSize: '0.72rem' }}
                                onClick={() => handleUpdateRole(m.id)}
                              >
                                Save
                              </button>
                              <button
                                className="btn btn-xs btn-outline-glass px-2 py-1"
                                style={{ fontSize: '0.72rem' }}
                                onClick={() => setEditingMemberId(null)}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                className="btn btn-xs btn-outline-glass px-2 py-1"
                                style={{ fontSize: '0.74rem' }}
                                title="Change Member Role"
                                onClick={() => {
                                  setEditingMemberId(m.id);
                                  setEditRole(m.role);
                                }}
                              >
                                <i className="bi bi-pencil-square me-1 text-cyan"></i>
                                Change Role
                              </button>

                              {!isCurrentActive && (
                                <button
                                  className="btn btn-xs btn-outline-cyan px-2 py-1"
                                  style={{ fontSize: '0.74rem' }}
                                  title="Switch active workspace view to this member"
                                  onClick={() => {
                                    onSwitchActiveUser && onSwitchActiveUser({
                                      full_name: m.user_name,
                                      email: m.user_email,
                                      role: m.role,
                                      member_id: m.public_member_id
                                    });
                                  }}
                                >
                                  <i className="bi bi-arrow-repeat me-1"></i>
                                  View As
                                </button>
                              )}

                              {m.role !== 'owner' && m.role !== 'Lead Software Architect' && (
                                <button
                                  className="btn btn-xs btn-outline-danger px-2 py-1"
                                  title="Remove member"
                                  onClick={() => handleDeleteMember(m.id, m.user_name)}
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Invite New Bound Member Form */}
            <div className="p-3 p-lg-4 rounded-3 bg-dark border border-secondary border-opacity-30">
              <h6 className="text-white mb-2 fw-bold d-flex align-items-center gap-2" style={{ fontSize: '0.92rem' }}>
                <i className="bi bi-person-plus-fill text-cyan"></i>
                Invite & Bind New Team Member
              </h6>
              <p className="text-secondary small mb-3" style={{ fontSize: '0.8rem' }}>
                Inviting a member automatically generates a permanent Member ID bound to their Email, Role, and Domain Permissions.
              </p>

              <form onSubmit={handleSubmit}>
                <div className="row g-3 mb-3">
                  <div className="col-12 col-md-6">
                    <label className="form-label text-white small fw-bold">Full Name *</label>
                    <input
                      type="text"
                      className="form-control dark-input form-control-sm py-2"
                      placeholder="e.g. dawood"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label text-white small fw-bold">Email Address *</label>
                    <input
                      type="email"
                      className="form-control dark-input form-control-sm py-2"
                      placeholder="e.g. myhomedecorweb7@gmail.com"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label text-white small fw-bold d-flex align-items-center justify-content-between">
                    <span>Assigned Discipline Role *</span>
                    <span className="text-cyan small fw-normal" style={{ fontSize: '0.72rem' }}>
                      Auto-generates role-bound ID prefix
                    </span>
                  </label>
                  <select
                    className="form-select dark-input form-select-sm py-2 fw-semibold"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    {AVAILABLE_ROLES.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.label} ({r.prefix}) — {r.desc}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Identity Binding Preview */}
                <div className="p-2 px-3 rounded-2 bg-dark border border-secondary border-opacity-25 mb-3 d-flex align-items-center justify-content-between text-secondary" style={{ fontSize: '0.76rem' }}>
                  <span>
                    <i className="bi bi-shield-lock text-cyan me-1"></i>
                    Generated Identity Format: <strong className="text-cyan">{currentRoleObj?.prefix || 'USR-DEV'}-XXXXXX</strong>
                  </span>
                  <span className="badge bg-secondary bg-opacity-30 text-light">Role-Bound</span>
                </div>

                <button type="submit" className="btn btn-cyan w-100 py-2" disabled={loading}>
                  {loading ? (
                    <span><i className="bi bi-arrow-repeat spin me-1"></i> Creating Member Identity...</span>
                  ) : (
                    <span><i className="bi bi-person-check-fill me-1"></i> Invite & Assign Role</span>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
