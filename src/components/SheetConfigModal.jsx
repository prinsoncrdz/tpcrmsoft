import React, { useState } from 'react';
import { X, Settings, Link, Check, Code, Database, Zap } from 'lucide-react';
import { DEFAULT_GAS_URL } from '../services/googleSheets';

export default function SheetConfigModal({ onClose, onSaveUrl }) {
  const [gasUrl, setGasUrl] = useState(localStorage.getItem('tp_gas_url') || DEFAULT_GAS_URL);
  const [supabaseUrl, setSupabaseUrl] = useState(localStorage.getItem('tp_supabase_url') || '');
  const [supabaseKey, setSupabaseKey] = useState(localStorage.getItem('tp_supabase_anon_key') || '');
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem('tp_gas_url', gasUrl);
    localStorage.setItem('tp_supabase_url', supabaseUrl);
    localStorage.setItem('tp_supabase_anon_key', supabaseKey);
    onSaveUrl(gasUrl);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
      window.location.reload();
    }, 1200);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Database style={{ color: 'var(--brand-green)' }} />
            <h3 className="modal-title">Cloud Backend & Database Configuration</h3>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSave}>
          {/* Supabase Configuration Section */}
          <div style={{ background: '#F0FDF4', border: '1.5px solid #A7F3D0', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '0.9rem', color: '#065F46', marginBottom: '10px' }}>
              <Zap size={18} style={{ color: '#10B981' }} />
              <span>Supabase PostgreSQL Realtime Engine (Sub-50ms Multi-Device Sync)</span>
            </div>

            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label className="form-label" style={{ fontSize: '0.76rem', color: '#065F46' }}>Supabase Project URL</label>
              <input 
                type="url"
                className="form-input"
                placeholder="https://xyzcompany.supabase.co"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                style={{ fontSize: '0.8rem' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '6px' }}>
              <label className="form-label" style={{ fontSize: '0.76rem', color: '#065F46' }}>Supabase Anon / Public API Key</label>
              <input 
                type="text"
                className="form-input"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
                style={{ fontSize: '0.8rem' }}
              />
            </div>
            <p style={{ fontSize: '0.72rem', color: '#047857', margin: '6px 0 0 0' }}>
              Enter your Supabase URL & Anon Key from your Supabase Dashboard &gt; Project Settings &gt; API.
            </p>
          </div>

          {/* Google Apps Script Section */}
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label className="form-label">Google Apps Script Web App Deployment URL</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="url"
                className="form-input"
                placeholder="https://script.google.com/macros/s/.../exec"
                value={gasUrl}
                onChange={(e) => setGasUrl(e.target.value)}
                style={{ paddingLeft: '40px' }}
              />
              <Link size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Close</button>
            <button type="submit" className="btn-primary" style={{ background: '#10B981', border: '1px solid #059669' }}>
              {saved ? <Check size={18} /> : <Settings size={18} />}
              {saved ? 'Cloud Connected!' : 'Save & Connect Cloud'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
