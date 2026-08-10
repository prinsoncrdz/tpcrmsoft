import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  DollarSign, 
  Settings, 
  LogOut, 
  RefreshCw, 
  Lock, 
  LayoutDashboard,
  MessageSquare,
  Menu,
  X,
  Bell,
  CheckCircle2,
  Sparkles,
  Clock,
  Check,
  FileText,
  Calendar
} from 'lucide-react';
import { getNotifications, markAllNotificationsAsRead, markNotificationAsRead, syncGlobalNotifications } from '../services/notifications';

function NotificationBell({ currentUser }) {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);

  const loadNotifs = async () => {
    if (currentUser?.email) {
      const synced = await syncGlobalNotifications(currentUser.email);
      setNotifications(synced || getNotifications(currentUser.email));
    }
  };

  useEffect(() => {
    loadNotifs();

    const handleCreated = () => loadNotifs();
    const handleUpdated = () => loadNotifs();

    window.addEventListener('tp_notification_created', handleCreated);
    window.addEventListener('tp_notification_updated', handleUpdated);

    // Also poll every 3 seconds for cloud notifications
    const timer = setInterval(loadNotifs, 3000);

    return () => {
      window.removeEventListener('tp_notification_created', handleCreated);
      window.removeEventListener('tp_notification_updated', handleUpdated);
      clearInterval(timer);
    };
  }, [currentUser?.email]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAllRead = () => {
    if (currentUser?.email) {
      markAllNotificationsAsRead(currentUser.email);
      loadNotifs();
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <button 
        className="btn-icon" 
        onClick={() => setOpen(!open)}
        title="Task & Approval Notifications"
        style={{ position: 'relative', background: unreadCount > 0 ? '#ECFDF5' : undefined, borderColor: unreadCount > 0 ? 'var(--brand-green)' : undefined }}
      >
        <Bell size={16} style={{ color: unreadCount > 0 ? 'var(--brand-green)' : 'inherit' }} />
        {unreadCount > 0 && (
          <span 
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: '#EF4444',
              color: '#FFFFFF',
              fontSize: '0.62rem',
              fontWeight: 800,
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #FFFFFF',
              boxShadow: '0 2px 4px rgba(239, 68, 68, 0.4)'
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown Panel */}
      {open && (
        <div 
          style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            right: 0,
            width: '340px',
            maxHeight: '420px',
            background: '#FFFFFF',
            border: '1.5px solid var(--border-color)',
            borderRadius: '14px',
            boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* Panel Header */}
          <div style={{ padding: '12px 16px', background: '#F8FAFC', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Bell size={15} style={{ color: 'var(--brand-green)' }} />
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Notifications ({unreadCount} unread)
              </span>
            </div>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllRead}
                style={{ background: 'none', border: 'none', color: 'var(--brand-green)', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div style={{ overflowY: 'auto', flex: 1, padding: '8px' }}>
            {notifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 16px', color: 'var(--text-muted)' }}>
                <Clock size={24} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
                <p style={{ fontSize: '0.78rem', margin: 0 }}>No notifications yet.</p>
                <p style={{ fontSize: '0.68rem', margin: '4px 0 0 0' }}>Tasks assigned to you or submitted for CEO review will appear here.</p>
              </div>
            ) : (
              notifications.map(n => (
                <div 
                  key={n.id}
                  onClick={() => {
                    markNotificationAsRead(n.id);
                    loadNotifs();
                  }}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    marginBottom: '6px',
                    background: n.isRead ? '#FFFFFF' : '#ECFDF5',
                    border: '1px solid ' + (n.isRead ? 'var(--border-color)' : '#A7F3D0'),
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3px' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-main)' }}>
                      {n.title}
                    </span>
                    <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.4' }}>
                    {n.message}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Navbar({ activeTab, setActiveTab, currentUser, onLogout, onOpenSettings, isSyncing }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isExecutive = currentUser?.role === 'CEO' || 
                      currentUser?.role === 'Admin' || 
                      currentUser?.name?.toLowerCase().includes('walter') || 
                      currentUser?.role?.toLowerCase().includes('ceo');

  const navItems = [
    { id: 'CRM', label: 'Project CRM Sheet', icon: <Building2 size={15} />, restricted: false },
    { id: 'PROJECT_APPROVALS', label: 'Project Approvals 📋', icon: <FileText size={15} />, ceoAdminOnly: true },
    { id: 'WEEKLY_TASKS', label: 'Friday Task Update Portal 📅', icon: <Calendar size={15} />, restricted: false },
    { id: 'TAX_INVOICES', label: 'Tax Invoices 🧾', icon: <FileText size={15} />, ceoAdminOnly: true },
    { id: 'TEAM_CHAT', label: 'Team Chat 💬', icon: <MessageSquare size={15} />, restricted: false },
    { id: 'PETTY_CASH_DASHBOARD', label: 'Petty Cash Dashboard', icon: <LayoutDashboard size={15} />, restricted: true },
    { id: 'PETTY_CASH_JULY', label: 'July 2026', icon: <DollarSign size={15} />, restricted: true },
    { id: 'PETTY_CASH_AUG', label: 'August 2026', icon: <DollarSign size={15} />, restricted: true },
    { id: 'PETTY_CASH_SEPT', label: 'September 2026', icon: <DollarSign size={15} />, restricted: true }
  ].filter(item => {
    // Tax Invoices is completely removed from dashboard for non-CEO / non-Admin users
    if (item.ceoAdminOnly && !isExecutive) return false;
    return true;
  });

  return (
    <nav className="navbar">
      <div className="brand-section">
        <img 
          src="https://www.turningpointretail.com/images/turning-point-new-logo.png" 
          alt="Turning Point Retail Solutions" 
          className="brand-logo"
        />
      </div>

      <div className="nav-tabs" style={{ display: mobileMenuOpen ? 'flex' : undefined }}>
        {navItems.map(item => {
          const isDisabled = item.restricted && !isExecutive;
          return (
            <button
              key={item.id}
              className={`tab-btn ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(item.id);
                setMobileMenuOpen(false);
              }}
              title={isDisabled ? 'Restricted to CEO & Admin Roles' : ''}
            >
              {item.icon}
              {item.label}
              {isDisabled && <span className="tab-badge-restricted">CEO/Admin</span>}
            </button>
          );
        })}
        {/* Mobile menu logout button */}
        <button 
          onClick={onLogout} 
          style={{
            background: '#FEF2F2',
            border: '1.5px solid #FCA5A5',
            color: '#DC2626',
            fontWeight: 700,
            fontSize: '0.8rem',
            padding: '8px 12px',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginTop: '8px',
            fontFamily: 'Poppins, sans-serif'
          }}
        >
          <LogOut size={16} /> Log Out Account
        </button>
      </div>

      <div className="user-controls">
        <div className="sync-pill" title="Live Google Sheet Sync Status">
          <div className="sync-dot" />
          <span>{isSyncing ? 'Syncing...' : 'Google Sheet Live'}</span>
        </div>

        <div className="user-badge">
          <img src={currentUser.avatar} alt={currentUser.name} className="user-avatar" />
          <div className="user-info">
            <span className="user-name">{currentUser.name}</span>
            <span className="user-role-tag">{currentUser.role}</span>
          </div>
        </div>

        <button className="btn-icon" onClick={onOpenSettings} title="Configure Endpoint">
          <Settings size={16} />
        </button>

        {/* NOTIFICATION BELL & DROPDOWN PANEL */}
        <NotificationBell currentUser={currentUser} />

        {/* PROMINENT RED LOGOUT BUTTON IN NAVBAR */}
        <button 
          onClick={onLogout} 
          style={{
            background: '#DC2626',
            color: '#FFFFFF',
            border: 'none',
            fontWeight: 700,
            fontSize: '0.78rem',
            padding: '6px 14px',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3)',
            transition: 'all 0.2s',
            fontFamily: 'Poppins, sans-serif'
          }}
          title="Log Out & Switch User"
        >
          <LogOut size={15} />
          <span>Log Out</span>
        </button>

        <button className="mobile-menu-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>
    </nav>
  );
}
