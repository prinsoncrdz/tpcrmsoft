import React, { useState } from 'react';
import { Lock, Key, ShieldCheck, CheckCircle2, AlertCircle, Eye, EyeOff, Sparkles, UserCheck } from 'lucide-react';
import { validatePassword } from '../services/googleSheets';

const CUSTOM_PASSWORDS_KEY = 'tp_custom_passwords_v1';

export default function ChangePasswordView({ currentUser, onShowToast }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const userEmail = (currentUser?.email || '').toLowerCase();
  const userName = currentUser?.name || 'Staff Member';

  const handlePasswordChange = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!currentPassword) {
      setErrorMsg('Please enter your current password.');
      return;
    }

    // Retrieve saved password or fallback
    const savedMap = JSON.parse(localStorage.getItem(CUSTOM_PASSWORDS_KEY) || '{}');
    const existingPassword = savedMap[userEmail] || currentUser?.passwordHash || currentUser?.fallbackPassword || 'TurningPoint@2026!';

    if (currentPassword !== existingPassword && currentPassword !== currentUser?.fallbackPassword) {
      setErrorMsg("If you enter wrong password don't fool me, I'm smarter than you! Current password is incorrect.");
      return;
    }

    if (!newPassword) {
      setErrorMsg('Please enter a new password.');
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

    if (newPassword === currentPassword) {
      setErrorMsg('New password cannot be identical to your current password.');
      return;
    }

    // Save customized password
    savedMap[userEmail] = newPassword;
    localStorage.setItem(CUSTOM_PASSWORDS_KEY, JSON.stringify(savedMap));

    // Update currentUser object in storage if applicable
    try {
      const savedUser = JSON.parse(localStorage.getItem('tp_user') || '{}');
      if (savedUser && savedUser.email && savedUser.email.toLowerCase() === userEmail) {
        savedUser.passwordHash = newPassword;
        localStorage.setItem('tp_user', JSON.stringify(savedUser));
      }
    } catch(err) {}

    setSuccessMsg(`🔒 Password updated successfully for ${userName}! Your new password is now active.`);
    if (onShowToast) onShowToast(`Password changed successfully for ${userName}!`);

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div style={{ maxWidth: '640px', margin: '24px auto', fontFamily: 'Segoe UI, Arial, sans-serif' }}>
      
      {/* Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
        borderRadius: '16px',
        padding: '24px 28px',
        color: '#FFFFFF',
        marginBottom: '24px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span style={{ background: 'var(--brand-green)', color: '#FFF', fontSize: '0.72rem', fontWeight: 900, padding: '3px 10px', borderRadius: '20px', textTransform: 'uppercase' }}>
            Account Security Settings
          </span>
          <span style={{ background: '#3B82F6', color: '#FFF', fontSize: '0.72rem', fontWeight: 800, padding: '3px 8px', borderRadius: '4px' }}>
            {currentUser?.role || 'Staff'} Account
          </span>
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#FFFFFF', margin: 0 }}>
          Change Password 🔑 — {userName}
        </h2>
        <p style={{ fontSize: '0.82rem', color: '#94A3B8', margin: '4px 0 0 0' }}>
          Update your secure login password for Turning Point Retail Solutions CRM ({userEmail}).
        </p>
      </div>

      {/* Main Form Card */}
      <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '28px', border: '1px solid #CBD5E1', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
        
        {errorMsg && (
          <div style={{
            background: '#FEF2F2',
            border: '1.5px solid #FCA5A5',
            color: '#991B1B',
            padding: '12px 14px',
            borderRadius: '10px',
            fontSize: '0.82rem',
            fontWeight: 700,
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <AlertCircle size={20} style={{ flexShrink: 0, color: '#DC2626' }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div style={{
            background: '#ECFDF5',
            border: '1.5px solid #A7F3D0',
            color: '#065F46',
            padding: '12px 14px',
            borderRadius: '10px',
            fontSize: '0.82rem',
            fontWeight: 800,
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <CheckCircle2 size={20} style={{ flexShrink: 0, color: '#059669' }} />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handlePasswordChange}>
          
          {/* User Account Info Bar */}
          <div style={{ background: '#F8FAFC', padding: '12px 16px', borderRadius: '10px', border: '1px solid #E2E8F0', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img 
              src={currentUser?.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150"} 
              alt={userName}
              style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--brand-green)' }}
            />
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A' }}>{userName}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>{userEmail} • Role: {currentUser?.role}</div>
            </div>
          </div>

          {/* Current Password */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
              Current Password *
            </label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showCurrentPass ? "text" : "password"}
                required
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Enter your existing password..."
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
                onClick={() => setShowCurrentPass(!showCurrentPass)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
              New Password *
            </label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showNewPass ? "text" : "password"}
                required
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Enter your new secure password..."
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
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
              Confirm New Password *
            </label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showConfirmPass ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your new password..."
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
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(37,99,235,0.3)'
            }}
          >
            <Key size={18} /> Update My Password 🔑
          </button>

        </form>
      </div>

    </div>
  );
}
