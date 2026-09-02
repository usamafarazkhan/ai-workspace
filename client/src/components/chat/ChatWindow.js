'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getMessages, sendMessage, convertMessageToTask } from '../../lib/api';
import AgentBadge from './AgentBadge';

export default function ChatWindow({ conversation, project, currentUser, initialPrompt, onClearInitialPrompt }) {
  const [messages, setMessages] = useState([]);
  const [inputContent, setInputContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [convertingId, setConvertingId] = useState(null);
  const messagesEndRef = useRef(null);

  const activeUserName = currentUser?.full_name || project?.owner_name || 'Muhammad Fahad';
  const activeMemberId = currentUser?.public_member_id || 'USR-FE-7A29X4';
  const activeUserRole = currentUser?.role || 'Frontend Developer';

  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      setInputContent(initialPrompt);
      if (onClearInitialPrompt) onClearInitialPrompt();
    }
  }, [initialPrompt]);

  useEffect(() => {
    if (conversation?.id) {
      loadMessages();
    }
  }, [conversation?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const loadMessages = async () => {
    try {
      const res = await getMessages(conversation.id);
      setMessages(res.data);
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!inputContent.trim() || loading) return;

    const userText = inputContent;
    setInputContent('');

    // Optimistic user message shown immediately with active identity
    const tempUserMsg = {
      id: 'temp-' + Date.now(),
      sender_type: 'user',
      sender_name: activeUserName,
      sender_member_id: activeMemberId,
      sender_role: activeUserRole,
      content: userText,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setLoading(true);

    try {
      // Send message with bound member ID and role
      const res = await sendMessage(
        conversation.id,
        userText,
        activeUserName,
        activeMemberId,
        activeUserRole
      );

      // Append AI response
      const aiMsg = res.data;
      setMessages((prev) => {
        const withoutTemp = prev.filter((m) => m.id !== tempUserMsg.id);
        return [
          ...withoutTemp,
          { ...tempUserMsg, id: 'user-' + Date.now() },
          aiMsg,
        ];
      });
    } catch (err) {
      console.error('Error sending message:', err);
      const errMsg = {
        id: 'err-' + Date.now(),
        sender_type: 'supervisor',
        sender_name: 'System',
        content: '⚠️ Could not reach the backend. Make sure the server is running on http://localhost:8000 and try again.',
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev.filter((m) => m.id !== tempUserMsg.id), tempUserMsg, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleConvertToTask = async (msgId) => {
    setConvertingId(msgId);
    try {
      await convertMessageToTask(msgId);
      alert('Message successfully converted into a project task!');
    } catch (err) {
      console.error('Error converting message to task:', err);
      alert('Failed to convert message to task.');
    } finally {
      setConvertingId(null);
    }
  };

  const copyCode = (text) => {
    navigator.clipboard.writeText(text);
    alert('Code copied to clipboard!');
  };

  const renderContentWithFormatting = (content) => {
    if (!content) return null;

    const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        const textBefore = content.slice(lastIndex, match.index);
        parts.push({ type: 'text', content: textBefore });
      }

      const lang = match[1] || 'code';
      const code = match[2] || '';

      if (lang === 'mermaid') {
        parts.push({ type: 'mermaid', content: code });
      } else {
        parts.push({ type: 'code', lang, content: code });
      }

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push({ type: 'text', content: content.slice(lastIndex) });
    }

    if (parts.length === 0) {
      return <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.7', color: '#f1f5f9' }}>{content}</div>;
    }

    return (
      <div>
        {parts.map((part, idx) => {
          if (part.type === 'text') {
            return (
              <div key={idx} style={{ whiteSpace: 'pre-wrap', lineHeight: '1.7', marginBottom: '0.5rem', color: '#f1f5f9' }}>
                {part.content}
              </div>
            );
          }

          if (part.type === 'mermaid') {
            return (
              <div key={idx} style={{ background: '#0e1224', border: '1px solid rgba(139, 92, 246, 0.4)', borderRadius: '10px', padding: '1.25rem', margin: '0.75rem 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ color: '#c084fc', fontSize: '0.78rem', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                    <i className="bi bi-diagram-3-fill me-1"></i> MERMAID ARCHITECTURE DIAGRAM
                  </span>
                  <button className="btn btn-sm btn-outline-purple py-0 px-2" style={{ fontSize: '0.72rem' }} onClick={() => copyCode(part.content)}>
                    Copy Diagram
                  </button>
                </div>
                <pre style={{ color: '#c084fc', margin: 0, fontSize: '0.85rem', fontFamily: 'JetBrains Mono, monospace' }}>{part.content}</pre>
              </div>
            );
          }

          // code block
          return (
            <div key={idx} style={{ background: '#030611', border: '1px solid #1e293b', borderRadius: '10px', margin: '0.75rem 0', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 1rem', background: '#090e1c', borderBottom: '1px solid #1e293b' }}>
                <span style={{ color: '#38bdf8', fontSize: '0.74rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <i className="bi bi-code-slash me-1"></i> {part.lang}
                </span>
                <button className="btn btn-sm btn-outline-cyan py-0 px-2" style={{ fontSize: '0.72rem' }} onClick={() => copyCode(part.content)}>
                  📋 Copy Code
                </button>
              </div>
              <pre style={{ margin: 0, padding: '1rem', color: '#f8fafc', fontSize: '0.86rem', fontFamily: 'JetBrains Mono, monospace', overflowX: 'auto', lineHeight: '1.65' }}>
                {part.content}
              </pre>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="d-flex flex-column h-100 dark-card overflow-hidden">
      {/* Understandable Team Conversation Header (2.4) */}
      <div className="dark-card-header d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
            <h6 className="mb-0 fw-bold text-white d-flex align-items-center gap-2" style={{ fontSize: '1rem' }}>
              <i className="bi bi-chat-left-dots-fill text-cyan"></i>
              {conversation?.title || 'Active Conversation'}
            </h6>
            <span className="badge bg-emerald bg-opacity-20 text-emerald border border-emerald border-opacity-30 py-0.5" style={{ fontSize: '0.68rem' }}>
              <span className="pulse-dot bg-emerald me-1"></span>
              {conversation?.status?.toUpperCase() || 'ACTIVE'}
            </span>
            <span className="badge bg-dark border border-secondary border-opacity-40 text-secondary py-0.5" style={{ fontSize: '0.68rem' }}>
              {conversation?.category || 'General'}
            </span>
          </div>

          <div className="d-flex flex-wrap align-items-center gap-2.5 text-secondary" style={{ fontSize: '0.76rem' }}>
            <span>
              Initiator: <strong className="text-white">{conversation?.member_name || activeUserName}</strong>
            </span>
            <span>
              Role: <span className="text-cyan fw-semibold">{conversation?.member_role || activeUserRole}</span>
            </span>
            <span>
              ID: <code className="text-cyan fw-bold">{conversation?.member_id || activeMemberId}</code>
            </span>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2 flex-shrink-0">
          <div className="d-none d-lg-flex flex-column align-items-end text-secondary" style={{ fontSize: '0.72rem' }}>
            <span><i className="bi bi-link-45deg text-cyan me-1"></i>Linked Entities:</span>
            <span className="text-light">Tasks, Specs & Code</span>
          </div>
          <button className="btn btn-sm btn-outline-glass px-3" onClick={loadMessages}>
            <i className="bi bi-arrow-clockwise me-1"></i> Refresh
          </button>
        </div>
      </div>

      {/* Role-Aware Identity Banner (1.4 & 2.4) */}
      <div className="px-3 py-2 bg-dark border-bottom border-secondary border-opacity-25 d-flex flex-wrap align-items-center justify-content-between gap-2 text-secondary" style={{ fontSize: '0.76rem' }}>
        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-primary bg-opacity-20 text-cyan border border-primary border-opacity-30">
            <i className="bi bi-person-fill me-1"></i> YOU: {activeUserRole}
          </span>
          <span>ID: <code className="text-cyan fw-bold">{activeMemberId}</code></span>
        </div>
        <div className="d-flex align-items-center gap-1 text-emerald">
          <i className="bi bi-shield-check"></i>
          <span>Audited Member Attribution & Role-Aware Multi-Agent Directives Active</span>
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-grow-1 p-3 p-lg-4 overflow-auto" style={{ maxHeight: 'calc(100vh - 320px)', minHeight: '360px' }}>
        {messages.length === 0 && !loading && (
          <div className="text-center py-5 text-secondary">
            <div className="rounded-circle d-inline-flex p-3 mb-3" style={{ background: 'rgba(6, 182, 212, 0.15)' }}>
              <i className="bi bi-robot fs-1 text-cyan"></i>
            </div>
            <h5 className="text-white fw-bold">Role-Aware AI Workspace Ready</h5>
            <p className="text-secondary mx-auto" style={{ fontSize: '0.9rem', maxWidth: '580px' }}>
              Connected as <strong className="text-white">{activeUserName}</strong> ({activeUserRole} • <code>{activeMemberId}</code>). The AI is automatically attuned to your discipline and detects cross-role dependencies.
            </p>
            <div className="d-flex justify-content-center gap-2 flex-wrap mt-4">
              <button
                className="btn btn-sm btn-outline-cyan px-3 py-2"
                onClick={() => setInputContent(
                  activeUserRole.includes('Doc')
                    ? 'Create comprehensive documentation for the authentication and JWT token lifecycle.'
                    : activeUserRole.includes('Database')
                    ? 'Create the PostgreSQL database structure, tables, and indexes for users and workspace entities.'
                    : 'Implement the responsive Next.js login and dashboard view with authentication state.'
                )}
              >
                ⚡ Launch Role-Specific Prompt ({activeUserRole})
              </button>
              <button
                className="btn btn-sm btn-outline-purple px-3 py-2"
                onClick={() => setInputContent('Implement user registration with a new database phone column and backend OTP endpoint.')}
              >
                🔗 Test Cross-Role Dependency Detection
              </button>
            </div>
          </div>
        )}

        {messages.map((msg) => {
          const isUser = msg.sender_type === 'user';
          const isSelf = isUser && (msg.sender_member_id === activeMemberId || msg.sender_name === activeUserName || msg.sender_name === 'Developer');

          return (
            <div
              key={msg.id}
              className={`chat-msg-card ${isUser ? 'chat-msg-user' : 'chat-msg-agent'}`}
            >
              <div className="d-flex justify-content-between align-items-center mb-3">
                {isUser ? (
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <span className="badge bg-primary bg-opacity-20 text-cyan border border-primary border-opacity-30 px-2 py-1 fw-bold">
                      <i className="bi bi-person-fill me-1"></i>
                      {isSelf ? 'You' : msg.sender_name}
                    </span>
                    <span className="badge bg-secondary bg-opacity-30 text-light border border-secondary border-opacity-30" style={{ fontSize: '0.68rem' }}>
                      {msg.sender_role || activeUserRole}
                    </span>
                    <code className="text-cyan fw-bold" style={{ fontSize: '0.68rem' }}>
                      {msg.sender_member_id || activeMemberId}
                    </code>
                  </div>
                ) : (
                  <AgentBadge
                    senderType={msg.sender_type}
                    agentName={msg.agent_name || msg.sender_name}
                    reasoning={msg.agent_reasoning}
                  />
                )}

                <div className="d-flex align-items-center gap-3">
                  <small className="text-secondary fw-medium" style={{ fontSize: '0.72rem' }}>
                    {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </small>
                  <button
                    className="btn btn-xs btn-outline-glass px-2 py-0"
                    title="Convert message into a Project Task"
                    onClick={() => handleConvertToTask(msg.id)}
                    disabled={convertingId === msg.id}
                    style={{ fontSize: '0.72rem' }}
                  >
                    <i className="bi bi-plus-square me-1"></i>
                    <span>Task</span>
                  </button>
                </div>
              </div>

              <div className="text-light">{renderContentWithFormatting(msg.content)}</div>

              {/* Citations block */}
              {msg.citations && Array.isArray(msg.citations) && msg.citations.length > 0 && (
                <div className="mt-3 p-3 bg-dark rounded-3 border border-warning border-opacity-40">
                  <small className="text-amber fw-bold d-block mb-1">
                    <i className="bi bi-journal-bookmark-fill me-1"></i> RAG Source Citations:
                  </small>
                  {msg.citations.map((cit, idx) => (
                    <small key={idx} className="d-block text-secondary" style={{ fontSize: '0.78rem' }}>
                      • {cit}
                    </small>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="chat-msg-card chat-msg-agent">
            <div className="d-flex align-items-center gap-3 text-cyan">
              <div className="spinner-border spinner-border-sm" role="status"></div>
              <span className="fw-semibold">Supervisor analyzing request in role context ({activeUserRole}) & delegating...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="p-3 p-lg-4 border-top border-secondary border-opacity-25" style={{ background: 'rgba(6, 10, 22, 0.5)' }}>
        <form onSubmit={handleSend} className="d-flex gap-3">
          <textarea
            className="form-control dark-input p-3"
            rows="2"
            placeholder={`Ask AI as ${activeUserRole} (${activeMemberId})...`}
            value={inputContent}
            onChange={(e) => setInputContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <button type="submit" className="btn btn-cyan px-4 d-flex align-items-center gap-2 flex-shrink-0" disabled={loading}>
            <i className="bi bi-send-fill"></i>
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
