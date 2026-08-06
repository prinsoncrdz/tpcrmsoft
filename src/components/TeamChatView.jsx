import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, Clock, Users, User, ShieldCheck, Sparkles, Lock, MessageCircle, Check, CheckCheck } from 'lucide-react';
import { SYSTEM_USERS, fetchGlobalChatMessages, sendGlobalChatMessage } from '../services/googleSheets';

const CHAT_STORAGE_KEY = 'tp_team_chat_messages_v3';
const PRESENCE_STORAGE_KEY = 'tp_team_user_presence_v1';

export default function TeamChatView({ currentUser }) {
  const [activeChannel, setActiveChannel] = useState('GROUP');
  const [messages, setMessages] = useState([]);
  const [presenceMap, setPresenceMap] = useState({});
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);

  const otherUsers = SYSTEM_USERS.filter(u => u.email !== currentUser.email);

  // Update current user's presence heartbeat
  const updatePresence = () => {
    const saved = localStorage.getItem(PRESENCE_STORAGE_KEY);
    let map = {};
    if (saved) {
      try { map = JSON.parse(saved); } catch (err) { map = {}; }
    }

    map[currentUser.email] = {
      email: currentUser.email,
      name: currentUser.name,
      lastActive: Date.now()
    };

    localStorage.setItem(PRESENCE_STORAGE_KEY, JSON.stringify(map));
    setPresenceMap(map);
  };

  // Sync and load messages from Cloud + local backup
  const loadAndProcessMessages = async () => {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    // Fetch live messages from Cloud Apps Script backend
    const cloudMessages = await fetchGlobalChatMessages();
    let baseMessages = cloudMessages;

    if (!baseMessages || !Array.isArray(baseMessages) || baseMessages.length === 0) {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY);
      if (saved) {
        try { baseMessages = JSON.parse(saved); } catch (err) { baseMessages = []; }
      }
    }

    if (!baseMessages || baseMessages.length === 0) {
      baseMessages = [
        {
          id: 'msg-1',
          channel: 'GROUP',
          senderEmail: 'walterdantis@turningpointretail.com',
          receiverEmail: null,
          senderName: 'Walter Dantis (CEO)',
          senderRole: 'CEO',
          senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
          text: 'Welcome team! Use this channel for public announcements or select any member for a private DM.',
          timestamp: now - (2 * 60 * 60 * 1000),
          seenBy: ['walterdantis@turningpointretail.com', 'admin@turningpointretail.com', 'srelyang.thim@turningpointretail.com']
        },
        {
          id: 'msg-2',
          channel: 'GROUP',
          senderEmail: 'srelyang.thim@turningpointretail.com',
          receiverEmail: null,
          senderName: 'Srelyang Thim',
          senderRole: 'Project Owner',
          senderAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150',
          text: 'Understood Walter. Project notes are updated live in the CRM.',
          timestamp: now - (1 * 60 * 60 * 1000),
          seenBy: ['srelyang.thim@turningpointretail.com', 'walterdantis@turningpointretail.com']
        }
      ];
    }

    // Prune > 24 hours
    const validMessages = baseMessages.filter(msg => (now - msg.timestamp) < oneDayMs);

    // Auto-mark messages as SEEN by current user if they are viewing the channel
    let modified = false;
    const processedMessages = validMessages.map(msg => {
      const isForCurrentView = (
        (activeChannel === 'GROUP' && msg.channel === 'GROUP') ||
        (activeChannel.startsWith('dm:') && 
          ((msg.senderEmail === activeChannel.replace('dm:', '') && msg.receiverEmail === currentUser.email) ||
           (msg.senderEmail === currentUser.email && msg.receiverEmail === activeChannel.replace('dm:', ''))))
      );

      if (isForCurrentView && !(msg.seenBy || []).includes(currentUser.email)) {
        modified = true;
        return { ...msg, seenBy: [...(msg.seenBy || []), currentUser.email] };
      }
      return msg;
    });

    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(processedMessages));
    setMessages(processedMessages);
  };

  useEffect(() => {
    updatePresence();
    loadAndProcessMessages();

    // Fast 3-second Cloud Polling interval for instant messages on hosted domains
    const interval = setInterval(() => {
      updatePresence();
      loadAndProcessMessages();
    }, 3000);

    return () => clearInterval(interval);
  }, [activeChannel]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeChannel]);

  const handleSendMessage = async (e) => {
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
      timestamp: Date.now(),
      seenBy: [currentUser.email]
    };

    // Immediate optimistic local UI update
    const updated = [...messages, newMessage];
    setMessages(updated);
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(updated));
    setInputMessage('');

    // Push message to Cloud Google Apps Script API endpoint
    await sendGlobalChatMessage(null, newMessage);
  };

  const formatTimestamp = (ts) => {
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatLastSeen = (ts) => {
    if (!ts) return 'Offline';
    const diffMs = Date.now() - ts;
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getUserOnlineStatus = (email) => {
    if (email === currentUser.email) return { isOnline: true, statusText: 'Online Now' };
    const p = presenceMap[email];
    if (!p || !p.lastActive) return { isOnline: false, statusText: 'Offline' };

    const isOnline = (Date.now() - p.lastActive) < 35000;
    return {
      isOnline,
      statusText: isOnline ? 'Online Now' : `Last seen ${formatLastSeen(p.lastActive)}`
    };
  };

  const getRoleBadgeStyle = (role) => {
    if (role === 'CEO') return { bg: '#FEF3C7', color: '#B45309', border: '#FDE68A' };
    if (role === 'Admin') return { bg: '#DBEAFE', color: '#1D4ED8', border: '#93C5FD' };
    return { bg: '#ECFDF5', color: '#047857', border: '#A7F3D0' };
  };

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

  const activeDmUser = activeChannel.startsWith('dm:') 
    ? SYSTEM_USERS.find(u => u.email === activeChannel.replace('dm:', '')) 
    : null;

  const activeDmStatus = activeDmUser ? getUserOnlineStatus(activeDmUser.email) : null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '14px', minHeight: 'calc(100vh - 120px)' }} className="team-chat-container">
      
      {/* Sidebar */}
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
            <span>Personal DMs & Status</span>
            <Lock size={12} title="Private & Encrypted" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {otherUsers.map(user => {
              const dmKey = `dm:${user.email}`;
              const isActive = activeChannel === dmKey;
              const presence = getUserOnlineStatus(user.email);

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
                  <div style={{ position: 'relative' }}>
                    <img src={user.avatar} alt={user.name} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                    <div 
                      style={{
                        position: 'absolute',
                        bottom: '0',
                        right: '0',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: presence.isOnline ? '#10B981' : '#94A3B8',
                        border: '1.5px solid #FFFFFF'
                      }} 
                      title={presence.statusText}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user.name}
                    </span>
                    <span style={{ fontSize: '0.6rem', color: presence.isOnline ? '#059669' : 'var(--text-muted)', fontWeight: 600 }}>
                      {presence.statusText}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 24-Hour Expiration Banner */}
        <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', padding: '10px', borderRadius: '8px', fontSize: '0.68rem', color: '#B45309', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
          <Clock size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>
            <strong>Cloud Global Sync:</strong> Messages sync across all hosted devices & auto-delete after 24h. Blue ticks ✔✔ indicate recipient has seen the message.
          </span>
        </div>

      </div>

      {/* Main Chat Area */}
      <div style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
        
        {/* Chat Room Header */}
        <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-color)', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {activeDmUser ? (
              <div style={{ position: 'relative' }}>
                <img src={activeDmUser.avatar} alt={activeDmUser.name} style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--brand-green)' }} />
                <div style={{ position: 'absolute', bottom: '0', right: '0', width: '9px', height: '9px', borderRadius: '50%', background: activeDmStatus.isOnline ? '#10B981' : '#94A3B8', border: '1.5px solid #FFFFFF' }} />
              </div>
            ) : (
              <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#ECFDF5', color: 'var(--brand-green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={18} />
              </div>
            )}

            <div>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 800 }}>
                {activeDmUser ? `Private DM: ${activeDmUser.name}` : '🌐 Team Public Group Chat'}
              </h3>
              <p style={{ fontSize: '0.68rem', color: activeDmStatus?.isOnline ? '#059669' : 'var(--text-muted)', fontWeight: 600 }}>
                {activeDmUser ? activeDmStatus.statusText : 'Cloud-synced live channel across all hosted devices'}
              </p>
            </div>
          </div>

          <span style={{ fontSize: '0.68rem', color: 'var(--brand-green)', background: '#ECFDF5', padding: '3px 8px', borderRadius: '10px', border: '1px solid #A7F3D0', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
            {activeDmUser ? <Lock size={12} /> : null}
            {activeDmUser ? 'Personal DM' : 'Cloud Live'}
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
              <p style={{ fontSize: '0.72rem', marginTop: '4px' }}>Type a message below to send live across all hosted computers!</p>
            </div>
          ) : (
            visibleMessages.map((msg) => {
              const isMine = msg.senderEmail === currentUser.email;
              const roleStyle = getRoleBadgeStyle(msg.senderRole);

              const seenByOthers = (msg.seenBy || []).filter(e => e !== msg.senderEmail);
              const isSeen = seenByOthers.length > 0;

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

                    {isMine && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px', fontSize: '0.65rem' }}>
                        {isSeen ? (
                          <span style={{ color: '#2563EB', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '2px' }} title={`Seen by recipient`}>
                            <CheckCheck size={14} style={{ color: '#2563EB' }} />
                            <span>Seen</span>
                          </span>
                        ) : (
                          <span style={{ color: '#94A3B8', display: 'inline-flex', alignItems: 'center', gap: '2px' }} title="Sent to Cloud API, awaiting recipient view">
                            <Check size={14} />
                            <span>Sent</span>
                          </span>
                        )}
                      </div>
                    )}
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
            placeholder={activeDmUser ? `Send cloud message to ${activeDmUser.name}...` : 'Post a live cloud message to the team...'}
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
