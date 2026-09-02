'use client';

import React, { useState, useEffect } from 'react';
import { getTasks, createTask, updateTask, deleteTask, generateAITasks, getProjectClasses } from '../../lib/api';

export default function TaskBoard({ project, currentUser }) {
  const [tasks, setTasks] = useState([]);
  const [classes, setClasses] = useState([]);
  const [viewMode, setViewMode] = useState('kanban');
  const [selectedClass, setSelectedClass] = useState('');
  const [myTasksOnly, setMyTasksOnly] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [priority, setPriority] = useState('medium');
  const [classId, setClassId] = useState('');
  const [assignedMemberId, setAssignedMemberId] = useState(currentUser?.public_member_id || '');

  // AI Breakdown Modal
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiGoal, setAiGoal] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (project?.id) {
      loadTasks();
      loadClasses();
    }
  }, [project?.id, selectedClass, myTasksOnly]);

  const loadTasks = async () => {
    try {
      const params = {};
      if (selectedClass) params.class_id = selectedClass;
      if (myTasksOnly) params.assigned_to = currentUser?.full_name || project?.owner_name;
      const res = await getTasks(project.id, params);
      setTasks(res.data);
    } catch (err) {
      console.error('Error loading tasks:', err);
    }
  };

  const loadClasses = async () => {
    try {
      const res = await getProjectClasses(project.id);
      setClasses(res.data);
    } catch (err) {
      console.error('Error loading classes:', err);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const matchedMember = project?.members?.find(m => m.public_member_id === assignedMemberId);
    const assigneeName = matchedMember ? matchedMember.user_name : (currentUser?.full_name || 'Unassigned');

    try {
      await createTask(project.id, {
        title: title.trim(),
        description: desc.trim(),
        priority,
        status: 'todo',
        class_id: classId || null,
        assigned_to: assigneeName,
        assigned_member_id: assignedMemberId || currentUser?.public_member_id || null
      });
      setTitle('');
      setDesc('');
      await loadTasks();
    } catch (err) {
      console.error('Error creating task:', err);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await updateTask(taskId, { status: newStatus });
      await loadTasks();
    } catch (err) {
      console.error('Error updating task:', err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await deleteTask(taskId);
      await loadTasks();
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  const handleAIBreakdown = async (e) => {
    e.preventDefault();
    if (!aiGoal.trim() || aiLoading) return;
    setAiLoading(true);
    try {
      await generateAITasks(project.id, aiGoal.trim());
      setAiGoal('');
      setShowAIModal(false);
      await loadTasks();
    } catch (err) {
      console.error('Error generating AI tasks:', err);
      alert('Failed to generate AI tasks.');
    } finally {
      setAiLoading(false);
    }
  };

  const kanbanColumns = [
    { id: 'todo', name: 'To Do', color: '#38bdf8', icon: 'bi-circle' },
    { id: 'in_progress', name: 'In Progress', color: '#60a5fa', icon: 'bi-arrow-repeat' },
    { id: 'completed', name: 'Completed', color: '#34d399', icon: 'bi-check-circle-fill' },
    { id: 'blocked', name: 'Blocked', color: '#fb7185', icon: 'bi-exclamation-octagon-fill' },
  ];

  return (
    <div className="dark-card p-4 p-lg-5">
      {/* Header & Controls */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <h4 className="text-white mb-1 fw-bold d-flex align-items-center gap-2">
            <i className="bi bi-kanban-fill text-cyan"></i>
            Tasks, Goals & Project Planning
          </h4>
          <p className="text-secondary mb-0" style={{ fontSize: '0.88rem' }}>
            Manage workstream tasks, assigned member IDs, Kanban status, and AI subtask breakdowns.
          </p>
        </div>

        <div className="d-flex flex-wrap align-items-center gap-2">
          {/* View Selector */}
          <div className="btn-group btn-group-sm">
            <button
              className={`btn px-3 py-1 fw-semibold ${viewMode === 'kanban' ? 'btn-cyan' : 'btn-outline-glass'}`}
              onClick={() => setViewMode('kanban')}
            >
              <i className="bi bi-kanban me-1"></i> Kanban
            </button>
            <button
              className={`btn px-3 py-1 fw-semibold ${viewMode === 'list' ? 'btn-cyan' : 'btn-outline-glass'}`}
              onClick={() => setViewMode('list')}
            >
              <i className="bi bi-list-ul me-1"></i> List
            </button>
            <button
              className={`btn px-3 py-1 fw-semibold ${viewMode === 'timeline' ? 'btn-cyan' : 'btn-outline-glass'}`}
              onClick={() => setViewMode('timeline')}
            >
              <i className="bi bi-calendar3 me-1"></i> Timeline
            </button>
          </div>

          {/* AI Task Generator Trigger */}
          <button className="btn btn-sm btn-purple px-3 py-1 d-flex align-items-center gap-1" onClick={() => setShowAIModal(true)}>
            <i className="bi bi-stars"></i> AI Breakdown
          </button>

          {/* My Tasks Filter */}
          <button
            className={`btn btn-sm px-3 py-1 ${myTasksOnly ? 'btn-cyan' : 'btn-outline-glass'}`}
            onClick={() => setMyTasksOnly(!myTasksOnly)}
          >
            <i className="bi bi-person-fill me-1"></i> My Tasks
          </button>
        </div>
      </div>

      {/* Class Filter Bar */}
      <div className="d-flex align-items-center gap-2 mb-4 overflow-auto pb-2">
        <span className="text-secondary small fw-bold me-1">Filter:</span>
        <button
          className={`btn btn-xs rounded-pill px-3 py-1 ${!selectedClass ? 'btn-cyan' : 'btn-outline-glass'}`}
          style={{ fontSize: '0.78rem' }}
          onClick={() => setSelectedClass('')}
        >
          All Classes
        </button>
        {classes.map((cls) => (
          <button
            key={cls.id}
            className={`btn btn-xs rounded-pill px-3 py-1 ${selectedClass === cls.id ? 'btn-cyan' : 'btn-outline-glass'}`}
            style={{ fontSize: '0.78rem' }}
            onClick={() => setSelectedClass(cls.id)}
          >
            <i className={`bi ${cls.icon} me-1`}></i> {cls.name}
          </button>
        ))}
      </div>

      {/* Quick Add Form */}
      <form onSubmit={handleAddTask} className="mb-4 bg-dark p-3 rounded-3 border border-secondary border-opacity-30">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-4">
            <input
              type="text"
              className="form-control dark-input form-control-sm py-2"
              placeholder="Task Title (e.g. Implement OAuth JWT Refresh)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="col-12 col-md-2">
            <select className="form-select dark-input form-select-sm py-2" value={classId} onChange={(e) => setClassId(e.target.value)}>
              <option value="">-- Workstream --</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="col-12 col-md-3">
            <select
              className="form-select dark-input form-select-sm py-2"
              value={assignedMemberId}
              onChange={(e) => setAssignedMemberId(e.target.value)}
            >
              <option value="">Assign Member (By Member ID)</option>
              {project?.members?.map((m) => (
                <option key={m.id} value={m.public_member_id}>
                  {m.user_name} ({m.role} • {m.public_member_id})
                </option>
              ))}
            </select>
          </div>
          <div className="col-6 col-md-1">
            <select className="form-select dark-input form-select-sm py-2" value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="low">Low</option>
              <option value="medium">Med</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className="col-6 col-md-2">
            <button type="submit" className="btn btn-sm btn-cyan w-100 py-2">
              <i className="bi bi-plus-lg me-1"></i> Add Task
            </button>
          </div>
        </div>
      </form>

      {/* VIEW 1: KANBAN BOARD VIEW */}
      {viewMode === 'kanban' && (
        <div className="row g-3">
          {kanbanColumns.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.id);
            return (
              <div key={col.id} className="col-12 col-md-6 col-lg-3">
                <div className="kanban-col">
                  {/* Column Header */}
                  <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom border-secondary border-opacity-25">
                    <span className="fw-bold text-white d-flex align-items-center gap-2" style={{ fontSize: '0.94rem' }}>
                      <i className={`bi ${col.icon}`} style={{ color: col.color }}></i> {col.name}
                    </span>
                    <span className="badge bg-dark border border-secondary border-opacity-40 text-secondary" style={{ fontSize: '0.75rem' }}>
                      {colTasks.length}
                    </span>
                  </div>

                  {/* Task Cards */}
                  {colTasks.length === 0 ? (
                    <div className="text-center text-secondary py-5 small opacity-50">No tasks in this column</div>
                  ) : (
                    colTasks.map((t) => (
                      <div key={t.id} className="kanban-task-card">
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <span
                            className={`badge ${
                              t.priority === 'high'
                                ? 'bg-danger bg-opacity-20 text-rose border border-danger'
                                : t.priority === 'medium'
                                ? 'bg-warning bg-opacity-20 text-amber border border-warning'
                                : 'bg-info bg-opacity-20 text-cyan border border-info'
                            }`}
                            style={{ fontSize: '0.68rem' }}
                          >
                            {t.priority.toUpperCase()}
                          </span>
                          <button className="btn btn-xs btn-outline-danger p-0 px-1" onClick={() => handleDeleteTask(t.id)}>
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>

                        <h6 className="fw-bold text-white mb-2" style={{ fontSize: '0.92rem' }}>{t.title}</h6>
                        {t.description && <p className="text-secondary small mb-2 text-truncate" style={{ fontSize: '0.82rem' }}>{t.description}</p>}

                        <div className="d-flex align-items-center justify-content-between pt-2 mt-2 border-top border-secondary border-opacity-25 text-secondary" style={{ fontSize: '0.75rem' }}>
                          <div className="d-flex align-items-center gap-1">
                            <i className="bi bi-person-badge text-cyan"></i>
                            <span className="text-white fw-semibold">{t.assigned_to}</span>
                            {t.assigned_member_id && (
                              <code className="text-cyan ms-1" style={{ fontSize: '0.65rem' }}>{t.assigned_member_id}</code>
                            )}
                          </div>
                          <div className="btn-group btn-group-xs">
                            {col.id !== 'todo' && (
                              <button className="btn btn-xs btn-outline-glass py-0 px-2" title="Move Left" onClick={() => handleStatusChange(t.id, col.id === 'in_progress' ? 'todo' : 'in_progress')}>
                                ◀
                              </button>
                            )}
                            {col.id !== 'completed' && (
                              <button className="btn btn-xs btn-outline-glass py-0 px-2" title="Move Right" onClick={() => handleStatusChange(t.id, col.id === 'todo' ? 'in_progress' : 'completed')}>
                                ▶
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 2: LIST VIEW */}
      {viewMode === 'list' && (
        <div className="table-responsive">
          <table className="table table-dark table-hover align-middle">
            <thead>
              <tr className="text-secondary border-secondary border-opacity-25">
                <th>Status</th>
                <th>Task Title & Details</th>
                <th>Priority</th>
                <th>Assigned Member ID</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t) => (
                <tr key={t.id} className="border-secondary border-opacity-25">
                  <td>
                    <span className={`badge ${t.status === 'completed' ? 'bg-success bg-opacity-20 text-emerald border border-success' : t.status === 'in_progress' ? 'bg-primary bg-opacity-20 text-cyan border border-primary' : t.status === 'blocked' ? 'bg-danger bg-opacity-20 text-rose border border-danger' : 'bg-secondary bg-opacity-30 text-secondary'}`}>
                      {t.status.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <strong className="text-white d-block">{t.title}</strong>
                    {t.description && <small className="text-secondary">{t.description}</small>}
                  </td>
                  <td>
                    <span className={`badge ${t.priority === 'high' ? 'bg-danger bg-opacity-20 text-rose' : 'bg-warning bg-opacity-20 text-amber'}`}>
                      {t.priority.toUpperCase()}
                    </span>
                  </td>
                  <td className="text-light">
                    <span className="fw-semibold">{t.assigned_to}</span>
                    {t.assigned_member_id && (
                      <code className="text-cyan ms-2 small">{t.assigned_member_id}</code>
                    )}
                  </td>
                  <td>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteTask(t.id)}>
                      <i className="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* VIEW 3: TIMELINE ROADMAP VIEW */}
      {viewMode === 'timeline' && (
        <div className="p-4 bg-dark rounded-3 border border-secondary border-opacity-30 text-light">
          <h6 className="fw-bold text-white mb-3"><i className="bi bi-clock-history text-cyan me-2"></i> Project Roadmap Timeline</h6>
          <div className="timeline-list border-start border-cyan ms-3 ps-3">
            {tasks.map((t) => (
              <div key={t.id} className="mb-4 position-relative">
                <div className="position-absolute top-0 start-0 translate-middle-x rounded-circle bg-cyan shadow-sm" style={{ width: '14px', height: '14px', marginLeft: '-20px', marginTop: '4px', boxShadow: '0 0 10px rgba(6, 182, 212, 0.5)' }}></div>
                <h6 className="fw-bold text-white mb-1">{t.title}</h6>
                <small className="text-secondary d-block mb-2">{t.description || 'Sprint task item'}</small>
                <div className="d-flex gap-2 align-items-center">
                  <span className="badge bg-dark border border-secondary border-opacity-40 text-secondary" style={{ fontSize: '0.72rem' }}>Status: {t.status}</span>
                  <span className="text-cyan small fw-semibold" style={{ fontSize: '0.76rem' }}>
                    Assignee: {t.assigned_to} ({t.assigned_member_id || 'ID Pending'})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Breakdown Modal */}
      {showAIModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 1080 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content dark-card border-secondary text-light shadow-2xl">
              <div className="modal-header dark-card-header">
                <h5 className="modal-title fw-bold text-white d-flex align-items-center gap-2">
                  <i className="bi bi-stars text-purple"></i> AI Task & Epic Breakdown
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowAIModal(false)}></button>
              </div>
              <form onSubmit={handleAIBreakdown}>
                <div className="modal-body p-4">
                  <p className="text-secondary small mb-3">
                    Describe a high-level project goal or feature. The Supervisor PM Agent will automatically break it down into actionable subtasks.
                  </p>
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-white">Goal or Requirement *</label>
                    <textarea
                      className="form-control dark-input"
                      rows="3"
                      placeholder="e.g. Implement multi-tenant authentication with OAuth2 Google login and Redis session revocation."
                      value={aiGoal}
                      onChange={(e) => setAiGoal(e.target.value)}
                      required
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer border-secondary border-opacity-25 p-3">
                  <button type="button" className="btn btn-outline-glass px-4" onClick={() => setShowAIModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-purple px-4" disabled={aiLoading || !aiGoal.trim()}>
                    {aiLoading ? 'Generating Subtasks...' : 'Generate Tasks'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
