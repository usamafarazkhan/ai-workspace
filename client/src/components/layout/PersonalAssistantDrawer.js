'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getAssistantMessages, sendAssistantMessage, transferAssistantDraft } from '../../lib/api';

export default function PersonalAssistantDrawer({ project, isOpen, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [transferringId, setTransferringId] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      loadMessages();
    }
  }, [isOpen, project?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const loadMessages = async () => {
    try {
      const res = await getAssistantMessages(project?.id);
      setMessages(res.data);
    } catch (err) {
      console.error('Error loading assistant messages:', err);
    }
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput('');
    setLoading(true);

    // Optimistic user message
    setMessages((prev) => [
      ...prev,
      { id: 'temp-user', sender_type: 'user', content: userText, created_at: new Date().toISOString() },
    ]);

    try {
      const res = await sendAssistantMessage(project?.id, userText);
      setMessages((prev) => prev.filter((m) => m.id !== 'temp-user').concat([
        { id: res.data.id + '-usr', sender_type: 'user', content: userText, created_at: res.data.created_at },
        res.data
      ]));
    } catch (err) {
      console.error('Error sending message to assistant:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async (msgContent, targetType) => {
    if (!project?.id) {
      alert('Please select an active project workspace first.');
      return;
    }
    setTransferringId(msgContent);
    try {
      await transferAssistantDraft({
        project_id: project.id,
        content: msgContent,
        target_type: targetType,
        title: 'Assistant Prepared Draft',
      });
      alert(`Draft successfully transferred to ${targetType === 'conversation' ? 'Shared Conversation' : 'Project Artifacts'}!`);
    } catch (err) {
      console.error('Error transferring draft:', err);
      alert('Failed to transfer draft.');
    } finally {
      setTransferringId(null);
    }
  };

  return (
    <div className={`assistant-drawer ${isOpen ? 'open' : 'closed'}`}>
      {/* Header */}
      <div className="p-3 px-4 border-bottom border-secondary border-opacity-25 d-flex align-items-center justify-content-between bg-dark">
        <div className="d-flex align-items-center gap-3">
          <div
            className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ width: '38px', height: '38px', background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', boxShadow: '0 0 14px rgba(139, 92, 246, 0.4)' }}
          >
            <i className="bi bi-stars text-white fs-5"></i>
          </div>
          <div>
            <h6 className="mb-0 fw-bold text-white" style={{ fontSize: '0.94rem' }}>Private Personal Assistant</h6>
            <small className="text-secondary" style={{ fontSize: '0.72rem' }}>
              {project ? `Context: ${project.name}` : 'Private User Session'}
            </small>
          </div>
        </div>
        <button className="btn btn-sm btn-outline-glass p-1 px-2" onClick={onClose}>
          <i className="bi bi-x-lg fs-6"></i>
        </button>
      </div>

      {/* Security Privacy Notice */}
      <div className="px-4 py-2 bg-dark border-bottom border-secondary border-opacity-25 d-flex align-items-center gap-2 text-amber" style={{ fontSize: '0.76rem' }}>
        <i className="bi bi-shield-lock-fill fs-6 flex-shrink-0"></i>
        <span>100% private to you. Never shared with team members until exported.</span>
      </div>

      {/* Messages Scroll Body */}
      <div className="flex-grow-1 p-3 p-lg-4" style={{ overflowY: 'auto' }}>
        {messages.length === 0 ? (
          <div className="text-center text-secondary my-5 py-4">
            <div className="rounded-circle d-inline-flex p-3 mb-3" style={{ background: 'rgba(139, 92, 246, 0.15)' }}>
              <i className="bi bi-stars fs-1 text-purple"></i>
            </div>
            <h6 className="text-white fw-bold">Your Private AI Copilot</h6>
            <p className="small text-secondary px-3 mb-4" style={{ fontSize: '0.84rem' }}>
              Ask private architecture questions, draft code, summarize progress, or prepare proposals before sharing with the team.
            </p>
            <div className="d-flex flex-column gap-2 px-2">
              <button
                className="btn btn-sm btn-outline-glass text-start text-light text-truncate py-2 px-3"
                onClick={() => { setInput("Summarize my current assigned tasks and project goals."); }}
              >
                💡 "Summarize my assigned tasks"
              </button>
              <button
                className="btn btn-sm btn-outline-glass text-start text-light text-truncate py-2 px-3"
                onClick={() => { setInput("Help me draft a microservices architecture proposal."); }}
              >
                💡 "Draft architecture proposal"
              </button>
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={msg.id || idx}
              className={`p-3 rounded-3 mb-3 ${
                msg.sender_type === 'user' ? 'chat-msg-user ms-4' : 'chat-msg-agent me-4'
              }`}
            >
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="fw-bold small d-flex align-items-center gap-1">
                  {msg.sender_type === 'user' ? (
                    <>
                      <i className="bi bi-person-circle text-cyan"></i> <span className="text-white">You (Private)</span>
                    </>
                  ) : (
                    <>
                      <i className="bi bi-stars text-purple"></i> <span className="text-white">Personal Assistant</span>
                    </>
                  )}
                </span>
                <small className="text-secondary" style={{ fontSize: '0.7rem' }}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </small>
              </div>

              <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.86rem', color: '#f1f5f9', lineHeight: '1.6' }}>{msg.content}</div>

              {msg.sender_type === 'assistant' && (
                <div className="mt-3 pt-2 border-top border-secondary border-opacity-25 d-flex gap-2 justify-content-end">
                  <button
                    className="btn btn-xs btn-outline-cyan py-1 px-2"
                    style={{ fontSize: '0.72rem' }}
                    onClick={() => handleTransfer(msg.content, 'conversation')}
                  >
                    <i className="bi bi-send me-1"></i> Send to Shared Chat
                  </button>
                  <button
                    className="btn btn-xs btn-outline-purple py-1 px-2"
                    style={{ fontSize: '0.72rem' }}
                    onClick={() => handleTransfer(msg.content, 'artifact')}
                  >
                    <i className="bi bi-journal-plus me-1"></i> Save as Artifact
                  </button>
                </div>
              )}
            </div>
          ))
        )}
        {loading && (
          <div className="text-secondary small d-flex align-items-center gap-2 p-2">
            <span className="spinner-border spinner-border-sm text-purple" role="status"></span>
            <span className="fw-semibold">Assistant is thinking privately...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="p-3 border-top border-secondary border-opacity-25 bg-dark">
        <form onSubmit={handleSend} className="d-flex gap-2">
          <input
            type="text"
            className="form-control dark-input form-control-sm py-2 px-3"
            placeholder="Ask private assistant..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button type="submit" className="btn btn-sm btn-cyan px-3" disabled={loading || !input.trim()}>
            <i className="bi bi-send-fill"></i>
          </button>
        </form>
      </div>
    </div>
  );
}
