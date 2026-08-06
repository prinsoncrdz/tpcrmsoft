import React, { useState } from 'react';
import { X, Settings, Link, Check, Code } from 'lucide-react';
import { DEFAULT_GAS_URL } from '../services/googleSheets';

export default function SheetConfigModal({ onClose, onSaveUrl }) {
  const [gasUrl, setGasUrl] = useState(localStorage.getItem('tp_gas_url') || DEFAULT_GAS_URL);
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem('tp_gas_url', gasUrl);
    onSaveUrl(gasUrl);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: '580px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Settings style={{ color: 'var(--brand-amber)' }} />
            <h3 className="modal-title">Google Sheet Sync API Configuration</h3>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSave}>
          <div className="form-group">
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
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px' }}>
              Edits in the Web App send live requests to this Google Apps Script endpoint to immediately update cells in your Google Sheet database.
            </p>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '14px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.85rem', color: 'var(--brand-amber)', marginBottom: '6px' }}>
              <Code size={16} />
              <span>Google Apps Script Setup Instructions</span>
            </div>
            <ol style={{ fontSize: '0.8rem', color: 'var(--text-muted)', paddingLeft: '20px', lineHeight: '1.6' }}>
              <li>Open your Google Sheet: <a href="https://docs.google.com/spreadsheets/d/1hy0DmROBeDcDQMOKdSPwQGU3SxK08Hrm0uQQHd7sVX4/edit" target="_blank" rel="noreferrer" style={{ color: 'var(--brand-amber)' }}>Open Sheet</a></li>
              <li>Go to <code>Extensions &gt; Apps Script</code></li>
              <li>Copy and paste the code from <code>google-apps-script/Code.gs</code></li>
              <li>Click <code>Deploy &gt; New deployment &gt; Select type: Web app</code></li>
              <li>Set <strong>Who has access: Anyone</strong> and copy the URL here!</li>
            </ol>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Close</button>
            <button type="submit" className="btn-primary">
              {saved ? <Check size={18} /> : <Settings size={18} />}
              {saved ? 'Saved!' : 'Save Connection URL'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
