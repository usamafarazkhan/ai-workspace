'use client';

import React, { useState, useEffect } from 'react';
import { searchWorkspace } from '../../lib/api';

export default function GlobalSearchModal({ show, onClose, project, onSelectItem }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.trim().length > 1) {
      const delayDebounce = setTimeout(() => {
        performSearch();
      }, 300);
      return () => clearTimeout(delayDebounce);
    } else {
      setResults([]);
    }
  }, [query]);

  const performSearch = async () => {
    setLoading(true);
    try {
      const res = await searchWorkspace(query.trim(), project?.id);
      setResults(res.data);
    } catch (err) {
      console.error('Error performing search:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 1080 }}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content dark-card border-secondary text-light shadow-2xl overflow-hidden">
          {/* Header Input */}
          <div className="modal-header border-secondary border-opacity-25 p-3 bg-dark">
            <div className="input-group">
              <span className="input-group-text bg-dark border-secondary border-opacity-30 text-cyan">
                <i className="bi bi-search fs-5 text-cyan"></i>
              </span>
              <input
                type="text"
                className="form-control dark-input form-control-lg border-secondary border-opacity-30 text-white"
                placeholder="Global Workspace Search (Projects, Classes, Tasks, Files, Artifacts)..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
            </div>
            <button type="button" className="btn-close btn-close-white ms-3" onClick={onClose}></button>
          </div>

          {/* Results Area */}
          <div className="modal-body p-3" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
            {loading ? (
              <div className="text-center py-5 text-secondary">
                <div className="spinner-border spinner-border-sm text-cyan me-2" role="status"></div>
                <span>Searching workspace entities...</span>
              </div>
            ) : query.trim().length <= 1 ? (
              <div className="text-center py-5 text-secondary">
                <i className="bi bi-search fs-1 d-block mb-3 text-cyan opacity-50"></i>
                <p className="mb-0">Type at least 2 characters to search across all workspace entities.</p>
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-5 text-secondary">
                <p className="mb-0">No matching workspace items found for "{query}".</p>
              </div>
            ) : (
              <div className="d-flex flex-column gap-2">
                {results.map((item) => (
                  <button
                    key={`${item.entity_type}-${item.id}`}
                    className="btn btn-outline-glass text-start p-3 d-flex align-items-center justify-content-between"
                    onClick={() => {
                      if (onSelectItem) onSelectItem(item);
                      onClose();
                    }}
                  >
                    <div>
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <span className="badge bg-primary bg-opacity-20 text-cyan border border-primary border-opacity-30" style={{ fontSize: '0.7rem' }}>
                          {item.category || item.entity_type.toUpperCase()}
                        </span>
                        <h6 className="mb-0 fw-bold text-white">{item.title}</h6>
                      </div>
                      <small className="text-secondary d-block text-truncate" style={{ maxWidth: '600px', fontSize: '0.8rem' }}>
                        {item.subtitle}
                      </small>
                    </div>
                    <i className="bi bi-chevron-right text-cyan"></i>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="modal-footer border-secondary border-opacity-25 justify-content-between p-3">
            <small className="text-secondary" style={{ fontSize: '0.75rem' }}>
              ProTip: Search indexes Projects, Workstreams, Tasks, Code Artifacts, Files, and Messages.
            </small>
            <button className="btn btn-sm btn-outline-glass px-3" onClick={onClose}>
              Esc to Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
