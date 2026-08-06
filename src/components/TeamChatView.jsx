import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, Clock, Users, User, ShieldCheck, Sparkles, Lock, MessageCircle } from 'lucide-react';
import { SYSTEM_USERS } from '../services/googleSheets';

const CHAT_STORAGE_KEY = 'tp_team_chat_messages_v2';

export default function TeamChatView({ currentUser }) {
  // Active channel: 'GROUP' or DM email 'dm:email@domain.com'
  const [activeChannel, setActiveChannel] = useState('GROUP');
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);

  // Filter out system users list (excluding current user for DM targets)
  const otherUsers = SYSTEM_USERS.filter(u => u.email !== currentUser.email);

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

    // Default starter welcome messages if empty
    if (parsedMessages.length === 0) {
      parsedMessages = [
        {
          id: 'msg-1',
          channel: 'GROUP',
          senderEmail: 'walterdantis@turningpointretail.com',
          receiverEmail: null,
          senderName: 'Walter Dantis (CEO)',
          senderRole: 'CEO',
          senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
          text: 'Welcome team! Use this channel for public announcements or click any team member to start a Personal DM.',
          timestamp: now - (2 * 60 * 60 * 1000)
        },
        {
          id: 'msg-2',
          channel: 'GROUP',
          senderEmail: 'srelyang.thim@turningpointretail.com',
          receiverEmail: null,
          senderName: 'Srelyang Thim',
          senderRole: 'Project Owner',
          senderAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150',
          text: 'Got it Walter. Project progress notes are logged live in the CRM.',
          timestamp: now - (1 * 60 * 60 * 1000)
        }
      ];
    }

    // Filter messages strictly within 24 hours
    const validMessages = parsedMessages.filter(msg => (now - msg.timestamp) < oneDayMs);
    setMessages(validMessages);
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(validMessages));
  };

  useEffect(() => {
    loadAndPruneMessages();
    const interval = setInterval(loadAndPruneMessages, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeChannel]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    let targetReceiver = null;
    if (activeChannel.startsWith('dm:')) {
      targetReceiver = activeChannel.replace('dm:', '');
    }

    const newMessage = {
      id: `msg-${Date.now()}`,
      channel: activeChannel,
      senderEmail: currentUser.email,
      receiverEmail: targetReceiver,
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

  const formatTimestamp = (ts) => {
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getRoleBadgeStyle = (role) => {
    if (role === 'CEO') return { bg: '#FEF3C7', color: '#B45309', border: '#FDE68A' };
    if (role === 'Admin') return { bg: '#DBEAFE', color: '#1D4ED8', border: '#93C5FD' };
    return { bg: '#ECFDF5', color: '#047857', border: '#A7F3D0' };
  };

  // Filter messages for current channel view
  const visibleMessages = messages.filter(msg => {
    if (activeChannel === 'GROUP') {
      return msg.channel === 'GROUP' || !msg.receiverEmail;
    }
    if (activeChannel.startsWith('dm:')) {
      const targetEmail = activeChannel.replace('dm:', '');
      return (
        (msg.senderEmail === currentUser.email && msg.receiverEmail === targetEmail) ||
        (msg.senderEmail === targetEmail && msg.receiverEmail === currentUser.email)
      );
    }
    return false;
  });

  // Target DM User info
  const activeDmUser = activeChannel.startsWith('dm:') 
    ? SYSTEM_USERS.find(u => u.email === activeChannel.replace('dm:', '')) 
    : null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '14px', minHeight: 'calc(100vh - 120px)' }} className="team-chat-container">
      
      {/* Sidebar: Channels & Personal DMs */}
      <div style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '14px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: 'var(--shadow-card)' }}>
        
        {/* Public Group Channels */}
        <div>
          <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
            Team Channels
          </div>
          <button
            onClick={() => setActiveChannel('GROUP')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 10px',
              borderRadius: '6px',
              border: '1px solid ' + (activeChannel === 'GROUP' ? 'var(--brand-green)' : 'transparent'),
              background: activeChannel === 'GROUP' ? '#ECFDF5' : 'transparent',
              color: activeChannel === 'GROUP' ? 'var(--brand-green)' : 'var(--text-main)',
              fontWeight: activeChannel === 'GROUP' ? 700 : 500,
              fontSize: '0.78rem',
              cursor: 'pointer',
              textAlign: 'left',
              fontFamily: 'Poppins, sans-serif'
            }}
          >
            <Users size={16} />
            <span>🌐 Team Group Chat</span>
          </button>
        </div>

        {/* 1-on-1 Personal Direct Messages */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Personal 1-on-1 DMs</span>
            <Lock size={12} title="Private & Encrypted" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {otherUsers.map(user => {
              const dmKey = `dm:${user.email}`;
              const isActive = activeChannel === dmKey;
              const roleStyle = getRoleBadgeStyle(user.role);

              // Check for unread / latest message in this DM
              const dmMessages = messages.filter(
                m => (m.senderEmail === user.email && m.receiverEmail === currentUser.email)
              );
              const hasMessages = dmMessages.length > 0;

              return (
                <button
                  key={user.email}
                  onClick={() => setActiveChannel(dmKey)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 8px',
                    borderRadius: '6px',
                    border: '1px solid ' + (isActive ? 'var(--brand-green)' : 'var(--border-color)'),
                    background: isActive ? '#ECFDF5' : '#F8FAFC',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: 'Poppins, sans-serif'
                  }}
                >
                  <img src={user.avatar} alt={user.name} style={{ width: '26px', height: '26px', borderRadius: '50%', objectFit: 'cover' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user.name}
                    </span>
                    <span style={{ fontSize: '0.6rem', color: roleStyle.color, fontWeight: 700 }}>
                      {user.role}
                    </span>
                  </div>
                  {hasMessages && (
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--brand-green)' }} title="Active DM History" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 24-Hour Expiration Banner */}
        <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', padding: '10px', borderRadius: '8px', fontSize: '0.68rem', color: '#B45309', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
          <Clock size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>
            <strong>1-Day History Policy:</strong> Both Team & Personal DMs self-delete after 24 hours.
          </span>
        </div>

      </div>

      {/* Main Chat Area */}
      <div style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
        
        {/* Chat Room Header */}
        <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-color)', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {activeDmUser ? (
              <img src={activeDmUser.avatar} alt={activeDmUser.name} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--brand-green)' }} />
            ) : (
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#ECFDF5', color: 'var(--brand-green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={16} />
              </div>
            )}

            <div>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 800 }}>
                {activeDmUser ? `Private Personal DM with ${activeDmUser.name}` : '🌐 Team Public Group Chat'}
              </h3>
              <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                {activeDmUser ? `Private 1-on-1 Chat • Visible only to you & ${activeDmUser.name.split(' ')[0]}` : 'Visible to all 5 Turning Point team members'}
              </p>
            </div>
          </div>

          <span style={{ fontSize: '0.68rem', color: 'var(--brand-green)', background: '#ECFDF5', padding: '3px 8px', borderRadius: '10px', border: '1px solid #A7F3D0', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
            {activeDmUser ? <Lock size={12} /> : null}
            {activeDmUser ? 'Personal DM' : 'Team Public'}
          </span>
        </div>

        {/* Message Feed */}
        <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', background: '#F8FAFC' }}>
          {visibleMessages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <MessageCircle size={28} style={{ color: 'var(--brand-green)', margin: '0 auto 8px auto' }} />
              <p style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                {activeDmUser ? `No personal messages with ${activeDmUser.name} in the last 24 hours.` : 'No group messages in the last 24 hours.'}
              </p>
              <p style={{ fontSize: '0.72rem', marginTop: '4px' }}>Type a message below to start chatting!</p>
            </div>
          ) : (
            visibleMessages.map((msg) => {
              const isMine = msg.senderEmail === currentUser.email;
              const roleStyle = getRoleBadgeStyle(msg.senderRole);

              return (
                <div 
                  key={msg.id}
                  style={{
                    display: 'flex',
                    gap: '8px',
                    alignSelf: isMine ? 'flex-end' : 'flex-start',
                    maxWidth: '75%'
                  }}
                >
                  {!isMine && (
                    <img src={msg.senderAvatar} alt={msg.senderName} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-main)' }}>{msg.senderName}</span>
                      <span style={{ fontSize: '0.58rem', padding: '1px 4px', borderRadius: '3px', background: roleStyle.bg, color: roleStyle.color, border: '1px solid ' + roleStyle.border, fontWeight: 700 }}>
                        {msg.senderRole}
                      </span>
                      <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{formatTimestamp(msg.timestamp)}</span>
                    </div>

                    <div 
                      style={{
                        background: isMine ? 'var(--brand-green)' : '#FFFFFF',
                        color: isMine ? '#FFFFFF' : 'var(--text-main)',
                        padding: '8px 12px',
                        borderRadius: isMine ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                        border: isMine ? 'none' : '1px solid var(--border-color)',
                        fontSize: '0.78rem',
                        lineHeight: '1.4',
                        wordBreak: 'break-word'
                      }}
                    >
                      {msg.text}
                    </div>
                  </div>

                  {isMine && (
                    <img src={msg.senderAvatar} alt={msg.senderName} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} style={{ padding: '10px 14px', background: '#FFFFFF', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input 
            type="text"
            className="form-input"
            placeholder={activeDmUser ? `Send personal message to ${activeDmUser.name}...` : 'Post a public message to the team...'}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            style={{ flex: 1, fontSize: '0.78rem', padding: '8px 12px' }}
          />
          <button type="submit" className="btn-primary" style={{ padding: '8px 14px', fontSize: '0.78rem' }}>
            <Send size={14} /> Send
          </button>
        </form>

      </div>
    </div>
  );
}
