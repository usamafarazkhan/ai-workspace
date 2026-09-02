'use client';

import React from 'react';

export default function AgentBadge({ senderType, agentName, reasoning }) {
  if (senderType === 'user') {
    return (
      <span className="badge bg-primary bg-opacity-20 text-cyan border border-primary border-opacity-30 px-3 py-1 fw-bold">
        <i className="bi bi-person-fill me-1"></i> Developer
      </span>
    );
  }

  let badgeClass = 'badge-supervisor';
  let icon = 'bi-cpu-fill';

  if (senderType === 'slave_coding') {
    badgeClass = 'badge-coding';
    icon = 'bi-code-slash';
  } else if (senderType === 'slave_arch') {
    badgeClass = 'badge-arch';
    icon = 'bi-diagram-3-fill';
  } else if (senderType === 'slave_doc') {
    badgeClass = 'badge-doc';
    icon = 'bi-file-earmark-text-fill';
  }

  return (
    <div className="d-inline-flex align-items-center gap-2 flex-wrap" title={reasoning || 'Agent Execution Rationale'}>
      <span className={`agent-badge ${badgeClass}`}>
        <span className="pulse-dot" style={{ backgroundColor: 'currentColor' }}></span>
        <i className={`bi ${icon}`}></i>
        <span>{agentName || 'Supervisor Agent'}</span>
      </span>
      {reasoning && (
        <small className="text-secondary d-none d-md-inline fw-normal" style={{ fontSize: '0.74rem' }}>
          <i className="bi bi-info-circle text-cyan me-1"></i>
          {reasoning}
        </small>
      )}
    </div>
  );
}
