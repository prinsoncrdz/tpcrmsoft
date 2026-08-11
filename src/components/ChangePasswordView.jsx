import React, { useState } from 'react';
import { Lock, Key, ShieldCheck, CheckCircle2, AlertCircle, Eye, EyeOff, Sparkles, UserCheck, Users, ShieldAlert, Check } from 'lucide-react';
import { SYSTEM_USERS, validatePassword } from '../services/googleSheets';

const CUSTOM_PASSWORDS_KEY = 'tp_custom_passwords_v1';

export default function ChangePasswordView({ currentUser, onShowToast }) {
  const userEmail = (currentUser?.email || '').toLowerCase();
  const userName = currentUser?.name || 'Staff Member';
  const isPrinson = userEmail.includes('prinson') || userName.toLowerCase().includes('prinson');

  const [selectedUserEmail, setSelectedUserEmail] = useState(userEmail);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Lock out non-Prinson users
  if (!isPrinson) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', background: '#FFFFFF', borderRadius: '16px', margin: '24px auto', maxWidth: '600px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
        <div style={{ width: '64px', height: '64px', background: '#FEF2F2', color: '#DC2626', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <Lock size={32} />
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0F172A', marginBottom: '8px' }}>Restricted Admin Security Center</h2>
        <p style={{ fontSize: '0.85rem', color: '#64748B', lineHeight: 1.6 }}>
          Team User Password Management is strictly reserved for <strong>Prinson Cardoza</strong>.
        </p>
      </div>
    );
  }

  const selectedUserObj = SYSTEM_USERS.find(u => u.email.toLowerCase() === selectedUserEmail.toLowerCase()) || SYSTEM_USERS[0];

  const handlePasswordChange = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!newPassword) {
      setErrorMsg('Please enter a new password for the selected user.');
      return;
    }

    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      setErrorMsg("If you enter wrong password don't fool me, I'm smarter than you! Password must meet security rules (e.g. uppercase, number & symbol).");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('New password and confirm password do not match.');
      return;
    }

    // Save custom password in storage
    const savedMap = JSON.parse(localStorage.getItem(CUSTOM_PASSWORDS_KEY) || '{}');
    const targetEmailKey = selectedUserEmail.toLowerCase();
    savedMap[targetEmailKey] = newPassword;
    localStorage.setItem(CUSTOM_PASSWORDS_KEY, JSON.stringify(savedMap));

    // Update active user in localStorage if updating own password
    if (targetEmailKey === userEmail) {
      try {
        const savedUser = JSON.parse(localStorage.getItem('tp_user') || '{}');
        if (savedUser && savedUser.email && savedUser.email.toLowerCase() === userEmail) {
          savedUser.passwordHash = newPassword;
          localStorage.setItem('tp_user', JSON.stringify(savedUser));
        }
      } catch(err) {}
    }

    setSuccessMsg(`🔒 Password updated successfully for ${selectedUserObj.name} (${selectedUserObj.role})! New password is now active for login.`);
    if (onShowToast) onShowToast(`Password updated for ${selectedUserObj.name}!`);

    setNewPassword('');
    setConfirmPassword('');
  };

  const getCustomPassStatus = (emailKey) => {
    const savedMap = JSON.parse(localStorage.getItem(CUSTOM_PASSWORDS_KEY) || '{}');
    return !!savedMap[emailKey.toLowerCase()];
  };

  return (
    <div style={{ maxWidth: '850px', margin: '24px auto', fontFamily: 'Segoe UI, Arial, sans-serif' }}>
      
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
        borderRadius: '16px',
        padding: '24px 28px',
        color: '#FFFFFF',
        marginBottom: '24px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ background: 'var(--brand-green)', color: '#FFF', fontSize: '0.72rem', fontWeight: 900, padding: '3px 10px', borderRadius: '20px', textTransform: 'uppercase' }}>
              System Password Administrator
            </span>
            <span style={{ background: '#2563EB', color: '#FFF', fontSize: '0.72rem', fontWeight: 800, padding: '3px 8px', borderRadius: '4px' }}>
              Prinson Access Only 🔑
            </span>
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#FFFFFF', margin: 0 }}>
            Team Password Management Console
          </h2>
          <p style={{ fontSize: '0.82rem', color: '#94A3B8', margin: '4px 0 0 0' }}>
            Prinson Cardoza can change, reset, and assign new passwords for all Turning Point CRM team members.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        
        {/* FORM CARD */}
        <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '24px', border: '1px solid #CBD5E1', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
          
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Key size={18} style={{ color: 'var(--brand-green)' }} /> Change & Assign User Password
          </h3>

          {errorMsg && (
            <div style={{
              background: '#FEF2F2',
              border: '1.5px solid #FCA5A5',
              color: '#991B1B',
              padding: '10px 12px',
              borderRadius: '10px',
              fontSize: '0.78rem',
              fontWeight: 700,
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0, color: '#DC2626' }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div style={{
              background: '#ECFDF5',
              border: '1.5px solid #A7F3D0',
              color: '#065F46',
              padding: '10px 12px',
              borderRadius: '10px',
              fontSize: '0.78rem',
              fontWeight: 800,
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <CheckCircle2 size={18} style={{ flexShrink: 0, color: '#059669' }} />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handlePasswordChange}>
            
            {/* Target User Select */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
                Select Team Member to Update Password *
              </label>
              <select
                value={selectedUserEmail}
                onChange={e => setSelectedUserEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1.5px solid #2563EB',
                  background: '#EFF6FF',
                  color: '#1E40AF',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  outline: 'none'
                }}
              >
                {SYSTEM_USERS.map(u => (
                  <option key={u.email} value={u.email}>
                    {u.name} ({u.role}) — {u.email}
                  </option>
                ))}
              </select>
            </div>

            {/* User Target Card */}
            <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img 
                src={selectedUserObj.avatar} 
                alt={selectedUserObj.name}
                style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }}
              />
              <div>
                <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0F172A' }}>{selectedUserObj.name}</div>
                <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>{selectedUserObj.email}</span>
              </div>
            </div>

            {/* New Password */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
                New Password for {selectedUserObj.name.split(' ')[0]} *
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showNewPass ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Enter new password (e.g. TurningPoint@2026!)..."
                  style={{
                    width: '100%',
                    padding: '10px 40px 10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
                <button 
                  type="button" 
                  onClick={() => setShowNewPass(!showNewPass)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
                >
                  {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
                Confirm New Password *
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showConfirmPass ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password..."
                  style={{
                    width: '100%',
                    padding: '10px 40px 10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
                <button 
                  type="button" 
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
                >
                  {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '12px 20px',
                background: '#2563EB',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(37,99,235,0.3)'
              }}
            >
              <Key size={16} /> Save & Assign New Password 🔑
            </button>

          </form>
        </div>

        {/* TEAM USERS STATUS DIRECTORY */}
        <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '24px', border: '1px solid #CBD5E1', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={18} style={{ color: '#2563EB' }} /> Team Accounts Directory
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {SYSTEM_USERS.map(u => {
              const hasCustom = getCustomPassStatus(u.email);
              const isSelected = selectedUserEmail.toLowerCase() === u.email.toLowerCase();

              return (
                <div 
                  key={u.email}
                  onClick={() => setSelectedUserEmail(u.email)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid ' + (isSelected ? '#2563EB' : '#E2E8F0'),
                    background: isSelected ? '#EFF6FF' : '#FFFFFF',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img src={u.avatar} alt={u.name} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0F172A' }}>{u.name}</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748B' }}>{u.role}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {hasCustom ? (
                      <span style={{ background: '#ECFDF5', color: '#047857', fontSize: '0.68rem', fontWeight: 800, padding: '2px 8px', borderRadius: '10px', border: '1px solid #A7F3D0' }}>
                        Updated 🔒
                      </span>
                    ) : (
                      <span style={{ background: '#F1F5F9', color: '#64748B', fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: '10px' }}>
                        Default Password
                      </span>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedUserEmail(u.email);
                      }}
                      style={{
                        background: '#2563EB',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '3px 8px',
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      Select
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
