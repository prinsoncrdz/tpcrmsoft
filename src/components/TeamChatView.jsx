import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, Clock, Trash2, Users, User, ShieldCheck, Sparkles, AlertCircle, Smile } from 'lucide-react';
import { SYSTEM_USERS } from '../services/googleSheets';

const CHAT_STORAGE_KEY = 'tp_team_chat_messages_v1';

export default function TeamChatView({ currentUser }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);

  // Load and prune messages older than 24 hours (86,400,000 ms)
  const loadAndPruneMessages = () => {
    const saved = localStorage.getItem(CHAT_STORAGE_KEY);
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    let parsedMessages = [];
    if (saved) {
      try {
        parsedMessages = JSON.parse(saved);
      } catch (err) {
        parsedMessages = [];
      }
    }

    // Default starter welcome messages within last 24 hours if empty
    if (parsedMessages.length === 0) {
      parsedMessages = [
        {
          id: 'msg-1',
          senderEmail: 'walterdantis@turningpointretail.com',
          senderName: 'Walter Dantis (CEO)',
          senderRole: 'CEO',
          senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
          text: 'Welcome team! Please use this live channel for daily updates and project coordination. Note: Messages expire after 24 hours.',
          timestamp: now - (2 * 60 * 60 * 1000) // 2 hours ago
        },
        {
          id: 'msg-2',
          senderEmail: 'srelyang.thim@turningpointretail.com',
          senderName: 'Srelyang Thim',
          senderRole: 'Project Owner',
          senderAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150',
          text: 'Understood Walter. Progress update for the retail flagship is saved in the CRM tab.',
          timestamp: now - (1 * 60 * 60 * 1000) // 1 hour ago
        }
      ];
    }

    // Strictly filter out messages older than 24 hours
    const validMessages = parsedMessages.filter(msg => (now - msg.timestamp) < oneDayMs);
    setMessages(validMessages);
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(validMessages));
  };

  useEffect(() => {
    loadAndPruneMessages();
    // Periodically prune expired messages every 60 seconds
    const interval = setInterval(loadAndPruneMessages, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const newMessage = {
      id: `msg-${Date.now()}`,
      senderEmail: currentUser.email,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      senderAvatar: currentUser.avatar,
      text: inputMessage.trim(),
      timestamp: Date.now()
    };

    const updated = [...messages, newMessage];
    setMessages(updated);
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(updated));
    setInputMessage('');
  };

  const handleTagMember = (memberName) => {
    setInputMessage(prev => `${prev} @${memberName} `);
  };

  const formatTimestamp = (ts) => {
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getRoleBadgeStyle = (role) => {
    if (role === 'CEO') return { bg: '#FEF3C7', color: '#B45309', border: '#FDE68A' };
    if (role === 'Admin') return { bg: '#DBEAFE', color: '#1D4ED8', border: '#93C5FD' };
    return { bg: '#ECFDF5', color: '#047857', border: '#A7F3D0' };
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '16px', minHeight: 'calc(100vh - 120px)' }} className="team-chat-container">
      {/* Sidebar: Team Directory & Expiration Notice */}
      <div style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: 'var(--shadow-card)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Users size={16} style={{ color: 'var(--brand-green)' }} />
            <h3 style={{ fontSize: '0.9rem', fontWeight: 800 }}>Team Members</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {SYSTEM_USERS.map(user => {
              const roleStyle = getRoleBadgeStyle(user.role);
              const isSelf = user.email === currentUser.email;
              return (
                <div 
                  key={user.email}
                  onClick={() => handleTagMember(user.name.split(' ')[0])}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 8px',
                    borderRadius: '6px',
                    background: isSelf ? '#ECFDF5' : '#F8FAFC',
                    border: '1px solid ' + (isSelf ? '#A7F3D0' : 'var(--border-color)'),
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  title={`Click to tag @${user.name}`}
                >
                  <img src={user.avatar} alt={user.name} style={{ width: '26px', height: '26px', borderRadius: '50%', objectFit: 'cover' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user.name} {isSelf && '(You)'}
                    </span>
                    <span style={{ fontSize: '0.6rem', color: roleStyle.color, fontWeight: 700 }}>
                      {user.role}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 24-Hour Expiration Banner */}
        <div style={{ marginTop: 'auto', background: '#FEF3C7', border: '1px solid #FDE68A', padding: '10px 12px', borderRadius: '8px', fontSize: '0.7rem', color: '#B45309', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <Clock size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>
            <strong>1-Day Chat History:</strong> Messages automatically self-delete after 24 hours to keep the workspace focused.
          </span>
        </div>
      </div>

      {/* Main Chat Area */}
      <div style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
        {/* Chat Room Header */}
        <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border-color)', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#ECFDF5', color: 'var(--brand-green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageSquare size={16} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800 }}>Turning Point Team Live Chat</h3>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Real-Time Messaging • 24-Hour Rolling History
              </p>
            </div>
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--brand-green)', background: '#ECFDF5', padding: '4px 10px', borderRadius: '12px', border: '1px solid #A7F3D0', fontWeight: 700 }}>
            ● Live Channel
          </span>
        </div>

        {/* Message Feed */}
        <div style={{ flex: 1, padding: '18px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', background: '#F8FAFC' }}>
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <Sparkles size={28} style={{ color: 'var(--brand-green)', margin: '0 auto 8px auto' }} />
              <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>No active messages in the last 24 hours.</p>
              <p style={{ fontSize: '0.75rem', marginTop: '4px' }}>Be the first to post a team update!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.senderEmail === currentUser.email;
              const roleStyle = getRoleBadgeStyle(msg.senderRole);

              return (
                <div 
                  key={msg.id}
                  style={{
                    display: 'flex',
                    gap: '10px',
                    alignSelf: isMine ? 'flex-end' : 'flex-start',
                    maxWidth: '80%'
                  }}
                >
                  {!isMine && (
                    <img src={msg.senderAvatar} alt={msg.senderName} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-main)' }}>{msg.senderName}</span>
                      <span style={{ fontSize: '0.6rem', padding: '1px 5px', borderRadius: '3px', background: roleStyle.bg, color: roleStyle.color, border: '1px solid ' + roleStyle.border, fontWeight: 700 }}>
                        {msg.senderRole}
                      </span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{formatTimestamp(msg.timestamp)}</span>
                    </div>

                    <div 
                      style={{
                        background: isMine ? 'var(--brand-green)' : '#FFFFFF',
                        color: isMine ? '#FFFFFF' : 'var(--text-main)',
                        padding: '10px 14px',
                        borderRadius: isMine ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        border: isMine ? 'none' : '1px solid var(--border-color)',
                        fontSize: '0.8rem',
                        lineHeight: '1.4',
                        wordBreak: 'break-word'
                      }}
                    >
                      {msg.text}
                    </div>
                  </div>

                  {isMine && (
                    <img src={msg.senderAvatar} alt={msg.senderName} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} style={{ padding: '12px 16px', background: '#FFFFFF', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input 
            type="text"
            className="form-input"
            placeholder="Type your message or project update..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            style={{ flex: 1, fontSize: '0.8rem', padding: '10px 14px' }}
          />
          <button type="submit" className="btn-primary" style={{ padding: '10px 16px', fontSize: '0.8rem' }}>
            <Send size={15} /> Send
          </button>
        </form>
      </div>
    </div>
  );
}
