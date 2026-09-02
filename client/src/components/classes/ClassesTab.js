'use client';

import React, { useState, useEffect } from 'react';
import { getProjectClasses, createProjectClass, deleteProjectClass } from '../../lib/api';

const AVAILABLE_ICONS = [
  'bi-diagram-3', 'bi-code-slash', 'bi-cpu', 'bi-database',
  'bi-plug', 'bi-palette', 'bi-bug', 'bi-cloud-upload',
  'bi-shield-check', 'bi-journal-code', 'bi-search', 'bi-kanban',
  'bi-phone', 'bi-robot', 'bi-credit-card', 'bi-graph-up'
];

export default function ClassesTab({ project, onSelectClassFilter }) {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // New Class Form
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('bi-phone');
  const [color, setColor] = useState('#06b6d4');
  const [assignedAgent, setAssignedAgent] = useState('Coding & Execution Agent (Slave-1)');
  const [instructions, setInstructions] = useState('');

  useEffect(() => {
    if (project?.id) {
      loadClasses();
    }
  }, [project?.id]);

  const loadClasses = async () => {
    setLoading(true);
    try {
      const res = await getProjectClasses(project.id);
      setClasses(res.data);
    } catch (err) {
      console.error('Error loading project classes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    if (!name.trim() || !project?.id) return;

    try {
      const res = await createProjectClass(project.id, {
        name: name.trim(),
        description: description.trim(),
        icon,
        color,
        assigned_agent: assignedAgent,
        instructions: instructions.trim(),
      });
      setClasses((prev) => [...prev, res.data]);
      setShowModal(false);
      setName('');
      setDescription('');
      setInstructions('');
    } catch (err) {
      console.error('Error creating class:', err);
      alert('Failed to create class.');
    }
  };

  const handleDeleteClass = async (classId, className) => {
    if (!window.confirm(`Are you sure you want to delete workstream class '${className}'?`)) return;
    try {
      await deleteProjectClass(classId);
      setClasses((prev) => prev.filter((c) => c.id !== classId));
    } catch (err) {
      console.error('Error deleting class:', err);
    }
  };

  return (
    <div className="container-fluid p-0">
      {/* Header */}
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 mb-4">
        <div>
          <h4 className="fw-bold mb-1 text-white d-flex align-items-center gap-2">
            <i className="bi bi-diagram-3-fill text-purple"></i>
            Project Workstreams & Classes
          </h4>
          <p className="text-secondary small mb-0" style={{ fontSize: '0.88rem' }}>
            Configurable domain workstreams for architectural separation, permissions, and specialized agent assignments.
          </p>
        </div>
        <button className="btn btn-cyan d-flex align-items-center gap-2 px-4 py-2" onClick={() => setShowModal(true)}>
          <i className="bi bi-plus-circle-fill"></i>
          <span>Add Workstream</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-5 text-secondary">
          <div className="spinner-border spinner-border-sm text-cyan me-2" role="status"></div>
          <span>Loading project workstreams...</span>
        </div>
      ) : classes.length === 0 ? (
        <div className="dark-card p-5 text-center text-secondary">
          <i className="bi bi-diagram-3 fs-1 text-cyan d-block mb-3"></i>
          <h5 className="text-white">No Workstreams Configured</h5>
          <p className="small mb-4 text-secondary">Add workstreams like Frontend, Backend, Database, Mobile, or Machine Learning.</p>
          <button className="btn btn-cyan px-4" onClick={() => setShowModal(true)}>
            + Add First Class
          </button>
        </div>
      ) : (
        <div className="row g-3">
          {classes.map((cls) => (
            <div key={cls.id} className="col-12 col-md-6 col-lg-4">
              <div className="workstream-card h-100 d-flex flex-column justify-content-between">
                <div>
                  {/* Top Bar */}
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div className="d-flex align-items-center gap-3">
                      <div
                        className="rounded-3 d-flex align-items-center justify-content-center text-white shadow-sm flex-shrink-0"
                        style={{ width: '44px', height: '44px', backgroundColor: cls.color || '#06b6d4', boxShadow: `0 0 14px ${cls.color || '#06b6d4'}40` }}
                      >
                        <i className={`bi ${cls.icon} fs-5`}></i>
                      </div>
                      <div>
                        <h6 className="mb-0 fw-bold text-white" style={{ fontSize: '0.98rem' }}>{cls.name}</h6>
                        <small className="text-secondary fw-medium" style={{ fontSize: '0.74rem' }}>
                          Priority: <strong className="text-white">{cls.priority?.toUpperCase() || 'MEDIUM'}</strong>
                        </small>
                      </div>
                    </div>
                    <button
                      className="btn btn-sm btn-outline-danger p-1 px-2"
                      title="Delete workstream"
                      onClick={() => handleDeleteClass(cls.id, cls.name)}
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>

                  <p className="text-secondary small mb-3" style={{ fontSize: '0.85rem', lineHeight: '1.55' }}>
                    {cls.description || 'No description provided.'}
                  </p>

                  {/* Assigned Agent */}
                  <div className="p-3 rounded-3 bg-dark border border-secondary border-opacity-30 mb-3">
                    <small className="text-secondary fw-bold d-block mb-1" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>ASSIGNED AI SPECIALIST</small>
                    <span className="badge badge-supervisor mt-1" style={{ fontSize: '0.75rem' }}>
                      <i className="bi bi-robot"></i> {cls.assigned_agent}
                    </span>
                  </div>

                  {cls.instructions && (
                    <div className="mb-3">
                      <small className="text-secondary fw-bold d-block mb-1" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>WORKSTREAM INSTRUCTIONS</small>
                      <small className="text-light d-block p-2 bg-dark rounded border border-secondary border-opacity-30" style={{ fontSize: '0.8rem' }}>
                        {cls.instructions}
                      </small>
                    </div>
                  )}
                </div>

                {/* Card Action Footer */}
                <div className="pt-3 border-top border-secondary border-opacity-25 d-flex justify-content-between align-items-center">
                  <span className="badge bg-secondary bg-opacity-30 text-light border border-secondary border-opacity-30" style={{ fontSize: '0.72rem' }}>
                    Active Workstream
                  </span>
                  <button
                    className="btn btn-sm btn-outline-cyan px-3 py-1"
                    style={{ fontSize: '0.78rem' }}
                    onClick={() => onSelectClassFilter && onSelectClassFilter(cls)}
                  >
                    Filter Chats <i className="bi bi-arrow-right ms-1"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Class Modal */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 1080 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content dark-card border-secondary text-light shadow-2xl">
              <div className="modal-header dark-card-header">
                <h5 className="modal-title fw-bold text-white d-flex align-items-center gap-2">
                  <i className="bi bi-diagram-3 text-cyan"></i> Add New Workstream / Class
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>

              <form onSubmit={handleCreateClass}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-white">Workstream Class Name *</label>
                    <input
                      type="text"
                      className="form-control dark-input"
                      placeholder="e.g. Mobile Application, Machine Learning, Payments"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold text-white">Description</label>
                    <textarea
                      className="form-control dark-input"
                      rows="2"
                      placeholder="Brief overview of responsibilities for this workstream..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    ></textarea>
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-bold text-white">Icon</label>
                      <select className="form-select dark-input" value={icon} onChange={(e) => setIcon(e.target.value)}>
                        {AVAILABLE_ICONS.map((ic) => (
                          <option key={ic} value={ic}>{ic.replace('bi-', '')}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-bold text-white">Theme Color</label>
                      <input
                        type="color"
                        className="form-control dark-input form-control-color w-100"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold text-white">Assigned Specialist AI Agent</label>
                    <select className="form-select dark-input" value={assignedAgent} onChange={(e) => setAssignedAgent(e.target.value)}>
                      <option value="Coding & Execution Agent (Slave-1)">Coding & Execution Agent (Slave-1)</option>
                      <option value="Architecture & System Design Agent (Slave-2)">Architecture & System Design Agent (Slave-2)</option>
                      <option value="Research & Knowledge RAG Agent (Slave-3)">Research & Knowledge RAG Agent (Slave-3)</option>
                      <option value="Review & Quality Assurance Agent (Slave-4)">Review & Quality Assurance Agent (Slave-4)</option>
                      <option value="UI/UX & Frontend Specialist Agent">UI/UX & Frontend Specialist Agent</option>
                      <option value="Supervisor Orchestrator Agent">Supervisor Orchestrator Agent</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold text-white">Class-Specific AI Instructions</label>
                    <textarea
                      className="form-control dark-input"
                      rows="2"
                      placeholder="Special coding standards or domain rules for this class..."
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                    ></textarea>
                  </div>
                </div>

                <div className="modal-footer border-secondary border-opacity-25 p-3">
                  <button type="button" className="btn btn-outline-glass px-4" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-cyan px-4" disabled={!name.trim()}>
                    Create Class
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
