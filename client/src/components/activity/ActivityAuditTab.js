'use client';

import React, { useState, useEffect } from 'react';
import { getActivityLogs, getRoleGroupedActivity } from '../../lib/api';

const AVAILABLE_ROLES = [
  'All Roles',
  'Frontend Developer',
  'Backend Developer',
  'Database Developer',
  'Documentation Specialist',
  'UI/UX Designer',
  'System Architect',
  'QA & Test Engineer',
  'DevOps Engineer',
  'Security Specialist',
  'Research Analyst',
  'Project Manager',
  'Lead Software Architect'
];

const ACTION_TYPES = [
  { id: '', label: 'All Action Types' },
  { id: 'code_change', label: 'Code Changes' },
  { id: 'task_created', label: 'Task Created' },
  { id: 'task_status_changed', label: 'Task Status Changed' },
  { id: 'artifact_created', label: 'Artifacts Generated' },
  { id: 'doc_update', label: 'Documentation Updated' },
  { id: 'member_invited', label: 'Member Invited' },
  { id: 'member_role_updated', label: 'Role Reassigned' },
  { id: 'project_created', label: 'Project Created' }
];

export default function ActivityAuditTab({ project, currentUser, onNavigateTab }) {
  const [viewMode, setViewMode] = useState('role_grouped'); // 'role_grouped' | 'audit_trail'
  
  // Role Grouped State
  const [roleSummaries, setRoleSummaries] = useState([]);
  const [loadingRoleGrouped, setLoadingRoleGrouped] = useState(false);

  // Audit Trail State & Filters
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [selectedMember, setSelectedMember] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (project?.id) {
      loadRoleSummaries();
      loadAuditLogs();
    }
  }, [project?.id, selectedMember, selectedRole, selectedAction, searchQuery]);

  const loadRoleSummaries = async () => {
    setLoadingRoleGrouped(true);
    try {
      const res = await getRoleGroupedActivity(project.id);
      setRoleSummaries(res.data);
    } catch (err) {
      console.error('Error loading role grouped activity:', err);
    } finally {
      setLoadingRoleGrouped(false);
    }
  };

  const loadAuditLogs = async () => {
    setLoadingLogs(true);
    try {
      const params = {};
      if (selectedMember) params.member_id = selectedMember;
      if (selectedRole && selectedRole !== 'All Roles') params.role = selectedRole;
      if (selectedAction) params.action_type = selectedAction;
      if (searchQuery.trim()) params.q = searchQuery.trim();

      const res = await getActivityLogs(project.id, params);
      setAuditLogs(res.data);
    } catch (err) {
      console.error('Error loading audit logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const getActionBadgeColor = (actionType) => {
    switch (actionType) {
      case 'code_change':
      case 'artifact_created':
        return 'bg-info bg-opacity-20 text-cyan border border-info border-opacity-30';
      case 'task_created':
      case 'task_status_changed':
        return 'bg-warning bg-opacity-20 text-amber border border-warning border-opacity-30';
      case 'doc_update':
        return 'bg-purple bg-opacity-20 text-purple border border-purple border-opacity-30';
      case 'member_invited':
      case 'member_role_updated':
        return 'bg-success bg-opacity-20 text-emerald border border-success border-opacity-30';
      default:
        return 'bg-secondary bg-opacity-30 text-light border border-secondary border-opacity-30';
    }
  };

  return (
    <div className="dark-card p-4 p-lg-5">
      {/* Header & Mode Switcher */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <div
              className="rounded-3 d-flex align-items-center justify-content-center text-white"
              style={{ width: '38px', height: '38px', background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)', boxShadow: '0 0 16px rgba(6, 182, 212, 0.35)' }}
            >
              <i className="bi bi-clock-history fs-5"></i>
            </div>
            <div>
              <h4 className="text-white mb-0 fw-bold">
                Member Attribution & Activity Audit Trail
              </h4>
              <small className="text-secondary" style={{ fontSize: '0.78rem' }}>
                Auditable changelog with Member ID binding, role-organized work, and Team Leader visibility.
              </small>
            </div>
          </div>
        </div>

        {/* View Switcher Buttons */}
        <div className="d-flex align-items-center gap-2">
          <div className="btn-group btn-group-sm">
            <button
              className={`btn px-3 py-1.5 fw-semibold ${viewMode === 'role_grouped' ? 'btn-cyan' : 'btn-outline-glass'}`}
              onClick={() => setViewMode('role_grouped')}
            >
              <i className="bi bi-grid-1x2-fill me-1"></i> Role-Organized History (2.3)
            </button>
            <button
              className={`btn px-3 py-1.5 fw-semibold ${viewMode === 'audit_trail' ? 'btn-cyan' : 'btn-outline-glass'}`}
              onClick={() => setViewMode('audit_trail')}
            >
              <i className="bi bi-funnel-fill me-1"></i> Team Leader Filter Trail (2.5)
            </button>
          </div>

          <button className="btn btn-sm btn-outline-glass px-3 py-1.5" onClick={() => { loadRoleSummaries(); loadAuditLogs(); }}>
            <i className="bi bi-arrow-clockwise me-1"></i> Refresh
          </button>
        </div>
      </div>

      {/* VIEW 1: ROLE-ORGANIZED MEMBER HISTORY (Requirement 2.3) */}
      {viewMode === 'role_grouped' && (
        <div>
          <div className="alert alert-dark border-secondary border-opacity-30 d-flex align-items-center justify-content-between mb-4 p-3 rounded-3" style={{ background: 'rgba(10, 16, 32, 0.6)' }}>
            <div className="d-flex align-items-center gap-2 text-secondary" style={{ fontSize: '0.84rem' }}>
              <i className="bi bi-info-circle-fill text-cyan fs-5"></i>
              <span>
                History is automatically categorized by <strong className="text-white">Discipline Roles</strong>. Each role card lists bound members, action summaries, and quick navigation shortcuts.
              </span>
            </div>
            <span className="badge bg-cyan bg-opacity-20 text-cyan border border-cyan border-opacity-30">
              12 Disciplines Active
            </span>
          </div>

          {loadingRoleGrouped ? (
            <div className="text-center py-5 text-cyan">
              <div className="spinner-border" role="status"></div>
              <p className="mt-2 small fw-semibold">Loading role-organized history...</p>
            </div>
          ) : (
            <div className="row g-4">
              {roleSummaries.map((summary, idx) => {
                const hasActions = summary.recent_actions && summary.recent_actions.length > 0;
                return (
                  <div key={idx} className="col-12 col-xl-6">
                    <div className="dark-card h-100 p-4 border border-secondary border-opacity-30 rounded-3 transition-all hover-border-cyan">
                      {/* Role Category Header */}
                      <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom border-secondary border-opacity-25">
                        <div>
                          <span className="text-cyan fw-bold text-uppercase" style={{ fontSize: '0.78rem', letterSpacing: '0.8px' }}>
                            {summary.role_category}
                          </span>
                          <h6 className="text-white fw-bold mb-0 mt-0.5" style={{ fontSize: '1rem' }}>
                            {summary.role_name}
                          </h6>
                        </div>
                        <span className="badge bg-dark border border-secondary border-opacity-40 text-secondary" style={{ fontSize: '0.72rem' }}>
                          <i className="bi bi-activity me-1 text-cyan"></i>
                          {summary.action_count} Recorded Actions
                        </span>
                      </div>

                      {/* Primary Bound Member */}
                      <div className="p-2.5 px-3 rounded-2 bg-dark border border-secondary border-opacity-25 mb-3 d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center text-white"
                            style={{ width: '30px', height: '30px', background: 'rgba(6, 182, 212, 0.2)', border: '1px solid rgba(6, 182, 212, 0.4)' }}
                          >
                            <i className="bi bi-person-fill text-cyan small"></i>
                          </div>
                          <div>
                            <span className="text-white fw-bold d-block" style={{ fontSize: '0.84rem', lineHeight: '1.2' }}>
                              {summary.primary_member_name}
                            </span>
                            <small className="text-secondary" style={{ fontSize: '0.72rem' }}>{summary.role_name}</small>
                          </div>
                        </div>
                        <code className="text-cyan fw-bold" style={{ fontSize: '0.78rem' }}>
                          {summary.primary_member_id}
                        </code>
                      </div>

                      {/* Chronological Action List */}
                      <div className="mb-3">
                        <label className="text-secondary small fw-bold d-block mb-2" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>
                          RECORDED AUDIT ACTIONS:
                        </label>
                        {hasActions ? (
                          <div className="d-flex flex-column gap-2">
                            {summary.recent_actions.map((act) => (
                              <div
                                key={act.id}
                                className="p-2 px-3 rounded-2 bg-dark bg-opacity-60 border border-secondary border-opacity-20 d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-1 text-light"
                                style={{ fontSize: '0.8rem' }}
                              >
                                <div className="d-flex align-items-center gap-2 text-truncate">
                                  <span className="text-cyan fw-bold">•</span>
                                  <span className="text-white fw-semibold text-truncate" title={act.description}>
                                    {act.action_title || act.description}
                                  </span>
                                  {act.file_path && (
                                    <code className="text-secondary ms-1 small text-truncate" style={{ maxWidth: '140px', fontSize: '0.68rem' }}>
                                      {act.file_path}
                                    </code>
                                  )}
                                </div>
                                <div className="d-flex align-items-center gap-2 flex-shrink-0 text-secondary" style={{ fontSize: '0.72rem' }}>
                                  {act.new_version && (
                                    <span className="badge bg-secondary bg-opacity-30 text-cyan py-0" style={{ fontSize: '0.65rem' }}>
                                      {act.new_version}
                                    </span>
                                  )}
                                  <span>{new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-3 text-center text-secondary small bg-dark bg-opacity-40 rounded-2 border border-secondary border-opacity-15">
                            No actions recorded for this discipline yet.
                          </div>
                        )}
                      </div>

                      {/* Quick Jump Shortcuts */}
                      <div className="d-flex flex-wrap gap-2 pt-2 border-top border-secondary border-opacity-20">
                        <button
                          className="btn btn-xs btn-outline-cyan px-2.5 py-1"
                          style={{ fontSize: '0.74rem' }}
                          onClick={() => onNavigateTab && onNavigateTab('chats')}
                        >
                          <i className="bi bi-chat-left-text me-1"></i> [View Conversation]
                        </button>
                        <button
                          className="btn btn-xs btn-outline-purple px-2.5 py-1"
                          style={{ fontSize: '0.74rem' }}
                          onClick={() => onNavigateTab && onNavigateTab('artifacts')}
                        >
                          <i className="bi bi-file-earmark-code me-1"></i> [View Artifacts ({summary.related_artifact_count})]
                        </button>
                        <button
                          className="btn btn-xs btn-outline-glass px-2.5 py-1"
                          style={{ fontSize: '0.74rem' }}
                          onClick={() => onNavigateTab && onNavigateTab('tasks')}
                        >
                          <i className="bi bi-kanban me-1"></i> [View Tasks ({summary.related_task_count})]
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: TEAM LEADER MULTI-DIMENSIONAL AUDIT TRAIL (Requirement 2.1, 2.2, 2.5) */}
      {viewMode === 'audit_trail' && (
        <div>
          {/* Multi-Dimensional Filter Toolbar (2.5) */}
          <div className="p-3 p-lg-4 rounded-3 bg-dark border border-secondary border-opacity-30 mb-4">
            <h6 className="text-white fw-bold mb-3 d-flex align-items-center gap-2" style={{ fontSize: '0.92rem' }}>
              <i className="bi bi-funnel text-cyan"></i>
              Team Leader Visibility & Multi-Filter Search
            </h6>

            <div className="row g-2 align-items-center">
              {/* Filter: Member */}
              <div className="col-12 col-sm-6 col-md-3">
                <label className="text-secondary small fw-bold d-block mb-1" style={{ fontSize: '0.72rem' }}>MEMBER ID / OWNER:</label>
                <select
                  className="form-select dark-input form-select-sm py-2"
                  value={selectedMember}
                  onChange={(e) => setSelectedMember(e.target.value)}
                >
                  <option value="">All Members</option>
                  {project?.members?.map((m) => (
                    <option key={m.id} value={m.public_member_id}>
                      {m.user_name} ({m.public_member_id})
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter: Role */}
              <div className="col-12 col-sm-6 col-md-3">
                <label className="text-secondary small fw-bold d-block mb-1" style={{ fontSize: '0.72rem' }}>DISCIPLINE ROLE:</label>
                <select
                  className="form-select dark-input form-select-sm py-2"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                >
                  {AVAILABLE_ROLES.map((r, idx) => (
                    <option key={idx} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {/* Filter: Action Type */}
              <div className="col-12 col-sm-6 col-md-3">
                <label className="text-secondary small fw-bold d-block mb-1" style={{ fontSize: '0.72rem' }}>ACTION TYPE:</label>
                <select
                  className="form-select dark-input form-select-sm py-2"
                  value={selectedAction}
                  onChange={(e) => setSelectedAction(e.target.value)}
                >
                  {ACTION_TYPES.map((a) => (
                    <option key={a.id} value={a.id}>{a.label}</option>
                  ))}
                </select>
              </div>

              {/* Text Search */}
              <div className="col-12 col-sm-6 col-md-3">
                <label className="text-secondary small fw-bold d-block mb-1" style={{ fontSize: '0.72rem' }}>SEARCH KEYWORD / FILE:</label>
                <div className="position-relative">
                  <input
                    type="text"
                    className="form-control dark-input form-control-sm py-2 ps-4"
                    placeholder="Search file, task, action..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-2 text-secondary small"></i>
                </div>
              </div>
            </div>

            {/* Active filter reset */}
            {(selectedMember || (selectedRole && selectedRole !== 'All Roles') || selectedAction || searchQuery) && (
              <div className="d-flex align-items-center gap-2 mt-3 pt-2 border-top border-secondary border-opacity-20">
                <small className="text-secondary">Active Filters:</small>
                {selectedMember && <span className="badge bg-cyan text-dark fw-bold">Member: {selectedMember}</span>}
                {selectedRole && selectedRole !== 'All Roles' && <span className="badge bg-purple text-light">Role: {selectedRole}</span>}
                {selectedAction && <span className="badge bg-secondary text-light">Action: {selectedAction}</span>}
                {searchQuery && <span className="badge bg-secondary text-light">Search: "{searchQuery}"</span>}
                <button
                  className="btn btn-xs btn-outline-danger ms-auto px-2 py-0"
                  onClick={() => {
                    setSelectedMember('');
                    setSelectedRole('');
                    setSelectedAction('');
                    setSearchQuery('');
                  }}
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>

          {/* Audit Trail Cards (Requirement 2.1 & 2.2 Formatting) */}
          {loadingLogs ? (
            <div className="text-center py-5 text-cyan">
              <div className="spinner-border" role="status"></div>
              <p className="mt-2 small fw-semibold">Loading audit trail...</p>
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="text-center py-5 text-secondary dark-card rounded-3 border-secondary border-opacity-25">
              <i className="bi bi-shield-check fs-1 text-cyan d-block mb-2"></i>
              <h5 className="text-white">No Audit Records Found</h5>
              <p className="small text-secondary">Try adjusting your filter criteria or perform new actions in the workspace.</p>
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {auditLogs.map((log) => {
                const isCurrentUser = log.member_id === currentUser?.public_member_id;
                return (
                  <div
                    key={log.id}
                    className="p-3 p-lg-4 rounded-3 dark-card border border-secondary border-opacity-30 transition-all hover-border-cyan"
                    style={{ background: 'rgba(10, 16, 32, 0.7)' }}
                  >
                    {/* Top Owner Bar (2.1 & 2.2) */}
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-3 pb-2.5 border-bottom border-secondary border-opacity-25">
                      <div className="d-flex align-items-center gap-2.5 flex-wrap">
                        <code className="text-cyan fw-bold px-2 py-0.5 rounded bg-dark border border-cyan border-opacity-30" style={{ fontSize: '0.78rem' }}>
                          {log.member_id || log.user_member_id || 'USR-LEAD-7K2M9A'}
                        </code>
                        <strong className="text-white" style={{ fontSize: '0.94rem' }}>
                          {log.member_name || log.user_name || 'Muhammad Fahad'}
                        </strong>
                        {isCurrentUser && (
                          <span className="badge bg-cyan text-dark fw-bold" style={{ fontSize: '0.65rem' }}>
                            YOU
                          </span>
                        )}
                        <span className="badge bg-secondary bg-opacity-30 text-light border border-secondary border-opacity-30" style={{ fontSize: '0.72rem' }}>
                          {log.member_role || 'Developer'}
                        </span>
                      </div>

                      <div className="d-flex align-items-center gap-2 text-secondary" style={{ fontSize: '0.76rem' }}>
                        <span className={`badge ${getActionBadgeColor(log.action_type)}`} style={{ fontSize: '0.7rem' }}>
                          {log.action_type?.replace('_', ' ').toUpperCase()}
                        </span>
                        <span>
                          <i className="bi bi-clock me-1"></i>
                          {new Date(log.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>
                    </div>

                    {/* Action & Change Details (2.1 & 2.2) */}
                    <div className="row g-3 align-items-center">
                      <div className="col-12 col-md-7">
                        {log.file_path && (
                          <div className="mb-1.5 text-secondary" style={{ fontSize: '0.8rem' }}>
                            <strong className="text-secondary me-1">Changed Target:</strong>
                            <code className="text-cyan fw-semibold">{log.file_path}</code>
                          </div>
                        )}
                        <div className="text-white fw-bold mb-1" style={{ fontSize: '0.92rem' }}>
                          Action: {log.action_title || log.description}
                        </div>
                        <p className="text-secondary small mb-0" style={{ fontSize: '0.82rem', lineHeight: '1.6' }}>
                          {log.description}
                        </p>
                      </div>

                      {/* Versions & Quick Jump */}
                      <div className="col-12 col-md-5 d-flex flex-column align-items-md-end justify-content-center gap-2">
                        {log.prev_version && log.new_version && (
                          <div className="d-flex align-items-center gap-2 text-secondary" style={{ fontSize: '0.76rem' }}>
                            <span className="text-secondary">Version:</span>
                            <span className="badge bg-dark border border-secondary border-opacity-40 text-secondary">{log.prev_version}</span>
                            <i className="bi bi-arrow-right text-cyan small"></i>
                            <span className="badge bg-cyan bg-opacity-20 text-cyan border border-cyan border-opacity-40">{log.new_version}</span>
                          </div>
                        )}

                        <div className="d-flex align-items-center gap-1.5 mt-1">
                          {log.conversation_id && (
                            <button
                              className="btn btn-xs btn-outline-cyan px-2 py-0.5"
                              style={{ fontSize: '0.72rem' }}
                              onClick={() => onNavigateTab && onNavigateTab('chats')}
                            >
                              <i className="bi bi-chat-left-text me-1"></i> Conversation
                            </button>
                          )}
                          {log.artifact_id && (
                            <button
                              className="btn btn-xs btn-outline-purple px-2 py-0.5"
                              style={{ fontSize: '0.72rem' }}
                              onClick={() => onNavigateTab && onNavigateTab('artifacts')}
                            >
                              <i className="bi bi-file-earmark-code me-1"></i> Artifact
                            </button>
                          )}
                          {log.task_id && (
                            <button
                              className="btn btn-xs btn-outline-glass px-2 py-0.5"
                              style={{ fontSize: '0.72rem' }}
                              onClick={() => onNavigateTab && onNavigateTab('tasks')}
                            >
                              <i className="bi bi-kanban me-1"></i> Task
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
