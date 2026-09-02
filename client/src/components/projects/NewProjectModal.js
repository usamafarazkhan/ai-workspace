'use client';

import React, { useState } from 'react';
import { createProject } from '../../lib/api';

const PROJECT_TEMPLATES = [
  {
    id: 'ecommerce',
    name: 'E-Commerce Platform',
    icon: 'bi-cart-check text-cyan',
    desc: 'Full-stack store with FastAPI backend, JWT Auth, and Next.js UI',
    defaultName: 'E-Commerce & Payments Engine',
    defaultDesc: 'Modern full-stack e-commerce platform with product catalogs, JWT user authentication, shopping cart, and Stripe payment webhooks.',
    instructions: 'You are an expert full-stack developer. Build scalable FastAPI APIs with async database access and high-performance Next.js 14 frontends.'
  },
  {
    id: 'ai-agents',
    name: 'AI Multi-Agent System',
    icon: 'bi-robot text-purple',
    desc: 'Autonomous multi-agent supervisor orchestrator with tools and RAG',
    defaultName: 'Enterprise AI Agent Hub',
    defaultDesc: 'Multi-agent orchestration system with supervisor routing, coding specialist, architecture designer, and document vector search.',
    instructions: 'You are a multi-agent AI engineer specializing in LangGraph supervisor orchestration, vector embeddings, and agent tool execution.'
  },
  {
    id: 'saas-dashboard',
    name: 'SaaS Analytics Dashboard',
    icon: 'bi-speedometer2 text-amber',
    desc: 'Interactive metrics, user management, and subscription billing',
    defaultName: 'Cloud SaaS Analytics Platform',
    defaultDesc: 'Subscription SaaS application featuring real-time charts, role-based access control (RBAC), and customer usage analytics.',
    instructions: 'You are a senior SaaS architect. Focus on clean database schemas, modular React dashboard widgets, and secure REST endpoints.'
  },
  {
    id: 'custom',
    name: 'Custom Project',
    icon: 'bi-stars text-emerald',
    desc: 'Blank slate configured with default multi-agent intelligence',
    defaultName: '',
    defaultDesc: '',
    instructions: 'You are an expert AI software architect and senior full-stack developer assistant.'
  }
];

export default function NewProjectModal({ show, onClose, onProjectCreated }) {
  const [selectedTemplate, setSelectedTemplate] = useState('ecommerce');
  const [name, setName] = useState('E-Commerce & Payments Engine');
  const [description, setDescription] = useState('Modern full-stack e-commerce platform with product catalogs, JWT user authentication, shopping cart, and Stripe payment webhooks.');
  const [ownerName, setOwnerName] = useState('Lead Developer');
  const [instructions, setInstructions] = useState('You are an expert full-stack developer. Build scalable FastAPI APIs with async database access and high-performance Next.js 14 frontends.');
  const [loading, setLoading] = useState(false);

  if (!show) return null;

  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template.id);
    setName(template.defaultName);
    setDescription(template.defaultDesc);
    setInstructions(template.instructions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const res = await createProject({
        name,
        description,
        owner_name: ownerName,
        system_instructions: instructions,
      });
      setName('');
      setDescription('');
      if (onProjectCreated) onProjectCreated(res.data);
      onClose();
    } catch (err) {
      console.error('Error creating project:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 1080 }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content dark-card border-secondary text-light shadow-2xl overflow-hidden">
          <div className="modal-header border-secondary border-opacity-25 p-4 bg-gradient">
            <div>
              <span className="badge bg-primary bg-opacity-20 text-cyan mb-1 fw-bold">PROJECT WIZARD</span>
              <h5 className="modal-title text-white fw-bold d-flex align-items-center gap-2">
                <i className="bi bi-folder-plus text-cyan"></i>
                Create New Developer Workspace
              </h5>
            </div>
            <button className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          <div className="modal-body p-4">
            {/* Template Selector */}
            <div className="mb-4">
              <label className="form-label text-white fw-bold small d-flex align-items-center gap-2 mb-2">
                <i className="bi bi-magic text-cyan"></i> Choose a Starter Template:
              </label>
              <div className="row g-2">
                {PROJECT_TEMPLATES.map((tmpl) => (
                  <div key={tmpl.id} className="col-12 col-md-6">
                    <div
                      className={`template-card ${selectedTemplate === tmpl.id ? 'active' : ''}`}
                      onClick={() => handleSelectTemplate(tmpl)}
                    >
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <i className={`bi ${tmpl.icon} fs-5`}></i>
                        <span className="fw-bold text-white small">{tmpl.name}</span>
                      </div>
                      <p className="text-secondary small mb-0" style={{ fontSize: '0.76rem' }}>{tmpl.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="row g-3 mb-3">
                <div className="col-12 col-md-8">
                  <label className="form-label text-white small fw-bold">Project Name *</label>
                  <input
                    type="text"
                    className="form-control dark-input"
                    placeholder="e.g. AI-Powered Healthcare Dashboard"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label text-white small fw-bold">Lead Owner Name</label>
                  <input
                    type="text"
                    className="form-control dark-input"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label text-white small fw-bold">Project Description</label>
                <textarea
                  className="form-control dark-input"
                  rows="2"
                  placeholder="Summary of project goals, features, and technology stack..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="mb-4">
                <label className="form-label text-cyan small fw-bold d-flex align-items-center gap-1">
                  <i className="bi bi-cpu"></i> AI System Role & Instructions
                </label>
                <textarea
                  className="form-control dark-input"
                  rows="2"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                />
              </div>

              {/* What happens next preview */}
              <div className="p-3 rounded-3 bg-dark border border-secondary border-opacity-30 mb-4">
                <div className="d-flex align-items-center gap-2 text-cyan small fw-bold mb-1">
                  <i className="bi bi-info-circle-fill"></i> What happens after creation:
                </div>
                <div className="text-secondary small" style={{ fontSize: '0.82rem', lineHeight: '1.5' }}>
                  Your workspace will immediately open with <strong className="text-white">Guided Next Steps</strong>, <strong className="text-white">1-Click AI Starter Prompts</strong>, <strong className="text-white">Task Sprints</strong>, and dedicated <strong className="text-white">Multi-Agent Specialists</strong> ready to write code.
                </div>
              </div>

              <div className="d-flex justify-content-end gap-2">
                <button type="button" className="btn btn-outline-glass px-4" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-cyan px-4 py-2" disabled={loading}>
                  {loading ? (
                    <span><i className="bi bi-arrow-repeat spin me-1"></i> Creating Workspace...</span>
                  ) : (
                    <span><i className="bi bi-check2-circle me-1"></i> Launch Workspace</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
