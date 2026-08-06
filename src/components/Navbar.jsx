import React, { useState } from 'react';
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
  X
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, currentUser, onLogout, onOpenSettings, isSyncing }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isExecutive = currentUser?.role === 'CEO' || currentUser?.role === 'Admin';

  const navItems = [
    { id: 'CRM', label: 'Project CRM Sheet', icon: <Building2 size={15} />, restricted: false },
    { id: 'TEAM_CHAT', label: 'Team Chat 💬', icon: <MessageSquare size={15} />, restricted: false },
    { id: 'PETTY_CASH_DASHBOARD', label: 'Petty Cash Dashboard', icon: <LayoutDashboard size={15} />, restricted: true },
    { id: 'PETTY_CASH_JULY', label: 'July 2026', icon: <DollarSign size={15} />, restricted: true },
    { id: 'PETTY_CASH_AUG', label: 'August 2026', icon: <DollarSign size={15} />, restricted: true },
    { id: 'PETTY_CASH_SEPT', label: 'September 2026', icon: <DollarSign size={15} />, restricted: true }
  ];

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
