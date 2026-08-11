import React, { useState } from 'react';
import { Mail, Key, ShieldCheck, AlertCircle } from 'lucide-react';
import { SYSTEM_USERS, validatePassword } from '../services/googleSheets';

export default function LoginModal({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const validation = validatePassword(password);
    if (!validation.valid) {
      setError("If you enter wrong password don't fool me, I'm smarter than you! Password does not meet security requirements.");
      return;
    }

    const customPasswords = JSON.parse(localStorage.getItem('tp_custom_passwords_v1') || '{}');
    const userEmailKey = email.trim().toLowerCase();
    const customPass = customPasswords[userEmailKey];

    const matchedUser = SYSTEM_USERS.find(u => {
      if (u.email.toLowerCase() !== userEmailKey) return false;
      if (customPass) return customPass === password;
      return u.passwordHash === password || u.fallbackPassword === password;
    });

    if (matchedUser) {
      onLogin(matchedUser);
    } else {
      setError("If you enter wrong password don't fool me, I'm smarter than you! Invalid email address or password.");
    }
  };

  return (
    <div className="modal-overlay" style={{ background: 'rgba(15, 23, 42, 0.75)' }}>
      <div className="modal-card" style={{ maxWidth: '400px', padding: '28px' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <img 
            src="https://www.turningpointretail.com/images/turning-point-new-logo.png" 
            alt="Turning Point Retail Solutions" 
            style={{ height: '48px', marginBottom: '8px', objectFit: 'contain' }}
          />
        </div>

        {error && (
          <div style={{
            background: '#FEF2F2',
            border: '1.5px solid #FCA5A5',
            color: '#991B1B',
            padding: '10px 12px',
            borderRadius: '8px',
            fontSize: '0.78rem',
            fontWeight: 600,
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            lineHeight: '1.4'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0, color: '#DC2626' }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="email" 
                className="form-input" 
                style={{ paddingLeft: '38px', fontSize: '0.8rem' }}
                placeholder="name@turningpointretail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Key size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="password" 
                className="form-input" 
                style={{ paddingLeft: '38px', fontSize: '0.8rem' }}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', padding: '10px', justifyContent: 'center', marginTop: '12px', fontSize: '0.85rem' }}>
            <ShieldCheck size={16} />
            Log In
          </button>
        </form>
      </div>
    </div>
  );
}
