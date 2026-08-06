import React, { useState } from 'react';
import { X, Plus, Sparkles, CheckCircle2, UserCheck, Send } from 'lucide-react';
import { SYSTEM_USERS } from '../services/googleSheets';

export default function NewProjectModal({ onClose, onAddProject, currentUser }) {
  const [formData, setFormData] = useState({
    projectId: `TP-PRJ-${Math.floor(100 + Math.random() * 900)}`,
    projectName: '',
    client: '',
    sector: 'RETAIL & FRANCHISE',
    owner: 'Walter Dantis (CEO)',
    assignee: 'Srelyang Thim',
    startDate: new Date().toISOString().split('T')[0],
    targetEndDate: '2026-12-31',
    priority: 'High',
    status: 'In Progress',
    statusUpdate: 'Project initialized in Turning Point CRM.'
  });

  const [submitted, setSubmitted] = useState(false);
  const [addedAssignee, setAddedAssignee] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.projectName || !formData.client) return;

    setAddedAssignee(formData.assignee);
    setSubmitted(true);

    onAddProject(formData);

    setTimeout(() => {
      onClose();
    }, 2800);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: '640px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles style={{ color: 'var(--brand-green)' }} />
            <h3 className="modal-title">Create New Project (Syncs to Google Sheet)</h3>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '36px 20px', animation: 'fadeIn 0.3s ease' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', border: '2px solid #A7F3D0' }}>
              <CheckCircle2 size={40} />
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Thanks for Adding! 🎉
            </h3>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginTop: '8px', lineHeight: '1.6' }}>
              Project <strong>"{formData.projectName}"</strong> has been saved to your Google Sheet database and dispatched directly to <strong>{addedAssignee}</strong>'s dashboard.
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#ECFDF5', color: 'var(--brand-green)', padding: '8px 16px', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 700, marginTop: '20px', border: '1px solid #A7F3D0' }}>
              <Send size={16} /> Sent to {addedAssignee}'s Dashboard
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Project ID</label>
                <input 
                  name="projectId"
                  className="form-input"
                  value={formData.projectId}
                  onChange={handleChange}
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Project Name</label>
                <input 
                  name="projectName"
                  className="form-input"
                  placeholder="e.g. Phnom Penh Retail Expansion"
                  value={formData.projectName}
                  onChange={handleChange}
                  required 
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Client / Partner</label>
                <input 
                  name="client"
                  className="form-input"
                  placeholder="e.g. Turning Point Retail"
                  value={formData.client}
                  onChange={handleChange}
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Sector</label>
                <select name="sector" className="form-select" value={formData.sector} onChange={handleChange}>
                  <option value="RETAIL & FRANCHISE">RETAIL & FRANCHISE</option>
                  <option value="HEALTHCARE">HEALTHCARE</option>
                  <option value="TECHNOLOGY & INNOVATION">TECHNOLOGY & INNOVATION</option>
                  <option value="EDUCATION">EDUCATION</option>
                  <option value="TRADING & DISTRIBUTION">TRADING & DISTRIBUTION</option>
                  <option value="CONSULTING">CONSULTING</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Project Owner</label>
                <select name="owner" className="form-select" value={formData.owner} onChange={handleChange}>
                  {SYSTEM_USERS.map(u => (
                    <option key={u.email} value={u.name}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Assigned To (Dispatches to their Dashboard)</label>
                <select name="assignee" className="form-select" value={formData.assignee} onChange={handleChange}>
                  {SYSTEM_USERS.map(u => (
                    <option key={u.email} value={u.name}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Target End Date</label>
                <input 
                  type="date"
                  name="targetEndDate"
                  className="form-input"
                  value={formData.targetEndDate}
                  onChange={handleChange}
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select name="priority" className="form-select" value={formData.priority} onChange={handleChange}>
                  <option value="Urgent">Urgent</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Initial Status</label>
                <select name="status" className="form-select" value={formData.status} onChange={handleChange}>
                  <option value="In Progress">In Progress</option>
                  <option value="Planning">Planning</option>
                  <option value="Review">Review</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Initial Progress Update</label>
              <textarea 
                name="statusUpdate"
                className="form-textarea"
                rows={2}
                value={formData.statusUpdate}
                onChange={handleChange}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
              <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn-primary">
                <Send size={18} /> Add Project & Send to Dashboard
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
