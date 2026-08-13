import React, { useState } from 'react';
import { Sparkles, CheckCircle2, Clock, ShieldCheck, FileText, Send, UserCheck, Lock, AlertCircle, DollarSign, X, Check, ArrowRight } from 'lucide-react';
import { SYSTEM_USERS } from '../services/googleSheets';

export default function ProjectApprovalsPortal({ projects = [], currentUser, onApproveProject, onUpdateProject }) {
  const isCeo = currentUser?.role === 'CEO' || 
                (currentUser?.name || '').toLowerCase().includes('walter') || 
                (currentUser?.role || '').toLowerCase().includes('ceo');

  const isSrelyangOrCeo = isCeo || 
                          (currentUser?.name || '').toLowerCase().includes('srelyang') || 
                          (currentUser?.email || '').toLowerCase().includes('srelyang.thim');

  const [selectedProject, setSelectedProject] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState('PENDING'); // 'PENDING' | 'APPROVED'

  if (!isSrelyangOrCeo) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', background: '#FFFFFF', borderRadius: '16px', margin: '24px auto', maxWidth: '600px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
        <div style={{ width: '64px', height: '64px', background: '#FEF2F2', color: '#DC2626', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <Lock size={32} />
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0F172A', marginBottom: '8px' }}>Restricted Access</h2>
        <p style={{ fontSize: '0.85rem', color: '#64748B', lineHeight: 1.6 }}>
          Project Approvals management is strictly reserved for <strong>Srelyang Thim</strong> & <strong>CEO Walter Dantis</strong>.
        </p>
      </div>
    );
  }

  // Filter out DELETED status projects strictly
  const activeNonDeletedProjects = (projects || []).filter(p => {
    if (!p) return false;
    const st = (p.status || '').toString().toLowerCase();
    if (st.includes('deleted') || st === 'deleted') return false;
    return true;
  });

  // Filter projects by pending CEO approval vs approved
  const pendingProjects = activeNonDeletedProjects.filter(p => 
    (p.status || '').toLowerCase().includes('pending') || 
    (p.status || '').toLowerCase().includes('review')
  );

  const approvedProjects = activeNonDeletedProjects.filter(p => 
    !(p.status || '').toLowerCase().includes('pending')
  );

  const displayList = activeSubTab === 'PENDING' ? pendingProjects : approvedProjects;

  return (
    <div style={{ padding: '24px', maxWidth: '1280px', margin: '0 auto', fontFamily: 'Poppins, sans-serif' }}>
      
      {/* Portal Executive Header */}
      <div style={{ background: '#0F172A', color: '#FFF', borderRadius: '16px', padding: '24px 32px', marginBottom: '24px', boxShadow: '0 10px 25px rgba(15, 23, 42, 0.25)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Sparkles style={{ color: '#F59E0B' }} size={20} />
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Turning Point Retail Solutions • Phnom Penh, Cambodia
            </span>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0, color: '#FFFFFF' }}>
            CEO Executive Project Approval Portal 📋
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#94A3B8', margin: '6px 0 0 0' }}>
            Review Admin submitted Project Initiation Forms • Complete Section C Financial Summary • CEO Sign-Off & Live CRM Activation
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid #F59E0B', padding: '10px 18px', borderRadius: '12px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: '#FCD34D', fontWeight: 800, display: 'block' }}>Pending CEO Approval</span>
            <strong style={{ fontSize: '1.4rem', color: '#F59E0B', fontWeight: 900 }}>{pendingProjects.length}</strong>
          </div>
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', padding: '10px 18px', borderRadius: '12px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: '#6EE7B7', fontWeight: 800, display: 'block' }}>Approved CRM Projects</span>
            <strong style={{ fontSize: '1.4rem', color: '#10B981', fontWeight: 900 }}>{approvedProjects.length}</strong>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          onClick={() => setActiveSubTab('PENDING')}
          style={{
            background: activeSubTab === 'PENDING' ? '#F59E0B' : '#FFFFFF',
            color: activeSubTab === 'PENDING' ? '#FFFFFF' : '#475569',
            border: '1.5px solid ' + (activeSubTab === 'PENDING' ? '#F59E0B' : '#CBD5E1'),
            padding: '10px 20px',
            borderRadius: '10px',
            fontWeight: 800,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Clock size={16} /> Pending CEO Approval ({pendingProjects.length})
        </button>
        <button 
          onClick={() => setActiveSubTab('APPROVED')}
          style={{
            background: activeSubTab === 'APPROVED' ? '#10B981' : '#FFFFFF',
            color: activeSubTab === 'APPROVED' ? '#FFFFFF' : '#475569',
            border: '1.5px solid ' + (activeSubTab === 'APPROVED' ? '#10B981' : '#CBD5E1'),
            padding: '10px 20px',
            borderRadius: '10px',
            fontWeight: 800,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <CheckCircle2 size={16} /> Approved CRM Portfolio ({approvedProjects.length})
        </button>
      </div>

      {/* Projects List Queue */}
      {displayList.length === 0 ? (
        <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '48px 24px', textAlign: 'center' }}>
          <CheckCircle2 size={48} style={{ color: '#10B981', margin: '0 auto 12px auto' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0F172A' }}>
            {activeSubTab === 'PENDING' ? 'All Project Initiation Forms Approved!' : 'No Approved Projects Found'}
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '4px 0 0 0' }}>
            {activeSubTab === 'PENDING' ? 'No pending projects currently awaiting CEO Walter Dantis sign-off.' : 'New project initiation forms submitted by Admin will appear here.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
          {displayList.map(p => (
            <div 
              key={p.id}
              style={{
                background: '#FFFFFF',
                borderRadius: '14px',
                border: '1.5px solid ' + ((p.status || '').toLowerCase().includes('pending') ? '#FCD34D' : '#E2E8F0'),
                padding: '20px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                display: 'flex',
                flexDirection: 'column',
                justify: 'space-between',
                position: 'relative'
              }}
            >
              {/* Header Badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 900, background: '#FEF3C7', color: '#92400E', padding: '3px 8px', borderRadius: '6px', fontFamily: 'monospace' }}>
                    {p.projectId || p.id}
                  </span>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0F172A', margin: '6px 0 2px 0' }}>
                    {p.projectName}
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>{p.client}</span>
                </div>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  padding: '4px 10px',
                  borderRadius: '12px',
                  background: (p.status || '').toLowerCase().includes('pending') ? '#FFFBEB' : '#ECFDF5',
                  color: (p.status || '').toLowerCase().includes('pending') ? '#B45309' : '#047857',
                  border: '1px solid ' + ((p.status || '').toLowerCase().includes('pending') ? '#FDE68A' : '#A7F3D0')
                }}>
                  {p.status || 'Pending CEO Approval'}
                </span>
              </div>

              {/* Body Details */}
              <div style={{ background: '#F8FAFC', borderRadius: '10px', padding: '12px', marginBottom: '16px', fontSize: '0.78rem', color: '#334155' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#64748B' }}>Sector:</span>
                  <strong style={{ color: 'var(--brand-green)' }}>{p.sector || 'RETAIL & FRANCHISE'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#64748B' }}>Prepared By:</span>
                  <strong>{p.preparedBy || 'Admin Manager'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#64748B' }}>Project Lead:</span>
                  <strong>{p.assignee || 'Sreylang Thim'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>Target Completion:</span>
                  <strong>{p.targetEndDate || p.targetDate || '2026-12-31'}</strong>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => setSelectedProject(p)}
                style={{
                  background: (p.status || '').toLowerCase().includes('pending') ? '#F59E0B' : '#0F172A',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '10px 16px',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                }}
              >
                <FileText size={16} /> 
                {(p.status || '').toLowerCase().includes('pending') ? '📝 Review & CEO Sign-Off Form' : '📄 View Initiation Document'}
              </button>

            </div>
          ))}
        </div>
      )}

      {/* CEO REVIEW & APPROVAL MODAL */}
      {selectedProject && (
        <CeoProjectReviewModal 
          project={selectedProject}
          currentUser={currentUser}
          isCeo={isCeo}
          onClose={() => setSelectedProject(null)}
          onApproveProject={(approvedData) => {
            if (onApproveProject) onApproveProject(approvedData);
            setSelectedProject(null);
          }}
        />
      )}

    </div>
  );
}

// Inner Modal Component for CEO to Review & Approve
function CeoProjectReviewModal({ project, currentUser, isCeo, onClose, onApproveProject }) {
  const [formData, setFormData] = useState({
    projectObjective: project.projectObjective || project.statusUpdate || '',
    scopeOfWork: project.scopeOfWork || project.notes || '',
    keyDeliverables: project.keyDeliverables || '',
    contractValueUsd: project.contractValueUsd || project.value || '',
    advanceRetainerPct: project.advanceRetainerPct || '25',
    advanceAmountUsd: project.advanceAmountUsd || project.depositPaid || '',
    estimatedDirectCosts: project.estimatedDirectCosts || '',
    estimatedGrossMargin: project.estimatedGrossMargin || '',
    paymentTerms: project.paymentTerms || '25% advance / 50% mid-way / 25% completion',
    billingCurrency: project.billingCurrency || 'USD',
    statusUpdate: project.statusUpdate || 'Project approved by CEO Walter Dantis and activated in CRM live Sheet.'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };

      if (name === 'contractValueUsd' || name === 'advanceRetainerPct' || name === 'estimatedDirectCosts') {
        const cVal = parseFloat(updated.contractValueUsd) || 0;
        const retPct = parseFloat(updated.advanceRetainerPct) || 0;
        const dCosts = parseFloat(updated.estimatedDirectCosts) || 0;

        const advAmt = Math.round((cVal * retPct) / 100);
        const grossMargin = cVal > 0 ? Math.round(((cVal - dCosts) / cVal) * 100) : 0;

        updated.advanceAmountUsd = advAmt > 0 ? advAmt.toString() : '';
        updated.estimatedGrossMargin = cVal > 0 ? `${grossMargin}%` : '';
      }

      return updated;
    });
  };

  const handleApprove = (e) => {
    e.preventDefault();
    const approvedPayload = {
      ...project,
      ...formData,
      status: 'In Progress',
      value: formData.contractValueUsd ? `$${formData.contractValueUsd}` : project.value,
      depositPaid: formData.advanceAmountUsd ? `$${formData.advanceAmountUsd}` : project.depositPaid
    };

    onApproveProject(approvedPayload);
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 100000 }}>
      <div className="modal-content" style={{ maxWidth: '880px', width: '95%', maxHeight: '90vh', overflowY: 'auto', padding: '0', borderRadius: '16px', borderTop: '5px solid #10B981' }}>
        
        {/* Header */}
        <div style={{ background: '#0F172A', color: '#FFF', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <ShieldCheck style={{ color: '#10B981' }} size={20} />
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#10B981', textTransform: 'uppercase', letterSpacing: '1px' }}>
                CEO Executive Approval Portal
              </span>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0, color: '#FFFFFF' }}>
              Review Project Initiation Form ({project.projectId || project.id})
            </h2>
            <p style={{ fontSize: '0.75rem', color: '#94A3B8', margin: '4px 0 0 0' }}>
              Prepared By: {project.preparedBy || 'Admin Manager'} • Project: "{project.projectName}"
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#FFF', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleApprove} style={{ padding: '24px' }}>
          
          {/* SECTION A SUMMARY */}
          <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 900, color: '#92400E', margin: '0 0 10px 0', textTransform: 'uppercase' }}>
              SECTION A – BASIC PROJECT INFORMATION
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', fontSize: '0.8rem', color: '#78350F' }}>
              <div><strong>Project Name:</strong> {project.projectName}</div>
              <div><strong>Client Name:</strong> {project.client}</div>
              <div><strong>Sector Category:</strong> {project.sector}</div>
              <div><strong>Project Lead:</strong> {project.assignee}</div>
              <div><strong>Project Manager:</strong> {project.owner}</div>
              <div><strong>Target End Date:</strong> {project.targetEndDate || project.targetDate || 'N/A'}</div>
            </div>
          </div>

          {/* SECTION B - SCOPE & OBJECTIVES (CEO EDITABLE) */}
          <div style={{ background: '#FFFBEB', border: '1.5px solid #FCD34D', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 900, color: '#92400E', margin: '0 0 10px 0', textTransform: 'uppercase' }}>
              SECTION B – SCOPE & OBJECTIVES (CEO Edit Unlocked)
            </h3>
            
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#78350F', display: 'block', marginBottom: '4px' }}>
                🎯 Project Objective (CEO Editable)
              </label>
              <textarea 
                name="projectObjective" 
                rows="2"
                value={formData.projectObjective} 
                onChange={handleChange}
                disabled={!isCeo}
                placeholder="Type or edit project objective..."
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #FCD34D', fontSize: '0.82rem', background: '#FFF' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#78350F', display: 'block', marginBottom: '4px' }}>
                📋 Scope of Work (CEO Editable)
              </label>
              <textarea 
                name="scopeOfWork" 
                rows="3"
                value={formData.scopeOfWork} 
                onChange={handleChange}
                disabled={!isCeo}
                placeholder="Type or edit detailed scope of work..."
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #FCD34D', fontSize: '0.82rem', background: '#FFF' }}
              />
            </div>
          </div>

          {/* SECTION C - FINANCIAL SUMMARY (CEO UNLOCKED FOR UPDATE) */}
          <div style={{ background: '#ECFDF5', border: '1.5px solid #A7F3D0', borderRadius: '12px', padding: '18px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #A7F3D0', paddingBottom: '6px' }}>
              <h3 style={{ fontSize: '0.88rem', fontWeight: 900, color: '#047857', margin: 0, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <DollarSign size={16} /> SECTION C – FINANCIAL SUMMARY (CEO Sign-Off & Update)
              </h3>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, background: '#047857', color: '#FFF', padding: '3px 8px', borderRadius: '6px' }}>
                {isCeo ? 'CEO Walter Dantis Unlocked' : 'Read Only View'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#065F46', display: 'block', marginBottom: '4px' }}>
                  Contract Value ($ USD) *
                </label>
                <input 
                  name="contractValueUsd" 
                  value={formData.contractValueUsd} 
                  onChange={handleChange}
                  disabled={!isCeo}
                  placeholder="e.g. 25000"
                  required
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #A7F3D0', fontSize: '0.85rem', fontWeight: 800, background: '#FFF' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#065F46', display: 'block', marginBottom: '4px' }}>
                  Advance Retainer %
                </label>
                <input 
                  name="advanceRetainerPct" 
                  value={formData.advanceRetainerPct} 
                  onChange={handleChange}
                  disabled={!isCeo}
                  placeholder="e.g. 25"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #A7F3D0', fontSize: '0.85rem', background: '#FFF' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#065F46', display: 'block', marginBottom: '4px' }}>
                  Advance Amount ($ USD)
                </label>
                <input 
                  name="advanceAmountUsd" 
                  value={formData.advanceAmountUsd} 
                  onChange={handleChange}
                  disabled={!isCeo}
                  placeholder="Auto-calculated advance"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #A7F3D0', fontSize: '0.85rem', fontWeight: 800, background: '#FFF' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#065F46', display: 'block', marginBottom: '4px' }}>
                  Est. Direct Costs ($ USD)
                </label>
                <input 
                  name="estimatedDirectCosts" 
                  value={formData.estimatedDirectCosts} 
                  onChange={handleChange}
                  disabled={!isCeo}
                  placeholder="e.g. 5000"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #A7F3D0', fontSize: '0.82rem', background: '#FFF' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#065F46', display: 'block', marginBottom: '4px' }}>
                  Est. Gross Margin %
                </label>
                <input 
                  name="estimatedGrossMargin" 
                  value={formData.estimatedGrossMargin} 
                  onChange={handleChange}
                  disabled={!isCeo}
                  placeholder="Auto-calculated margin"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #A7F3D0', fontSize: '0.82rem', fontWeight: 800, color: '#047857', background: '#FFF' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#065F46', display: 'block', marginBottom: '4px' }}>
                  Billing Currency
                </label>
                <input 
                  name="billingCurrency" 
                  value={formData.billingCurrency} 
                  onChange={handleChange}
                  disabled={!isCeo}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #A7F3D0', fontSize: '0.82rem', background: '#FFF' }}
                />
              </div>
            </div>
          </div>

          {/* SECTION D APPROVAL ACTION */}
          <div style={{ background: '#0F172A', color: '#FFF', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.72rem', color: '#94A3B8', display: 'block' }}>CEO Sign-Off Authorization:</span>
              <strong style={{ fontSize: '0.9rem', color: '#10B981' }}>Approved By: Walter Dantis (CEO)</strong>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button 
                type="button" 
                onClick={() => {
                  const origTitle = document.title;
                  document.title = `Project_Initiation_Form_${(project.projectName || project.companyName || 'Project').replace(/\s+/g, '_')}`;
                  window.print();
                  setTimeout(() => { document.title = origTitle; }, 1000);
                }} 
                style={{ background: '#2563EB', color: '#FFF', border: 'none', borderRadius: '8px', padding: '10px 16px', fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                title="Download / Save Project Initiation Form as PDF"
              >
                📥 Download PDF
              </button>
              <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
              {isCeo ? (
                <button type="submit" className="btn-primary" style={{ background: '#10B981', borderColor: '#10B981' }}>
                  <CheckCircle2 size={18} /> CEO Sign-Off & Approve Live to CRM
                </button>
              ) : (
                <div style={{ fontSize: '0.75rem', color: '#FCD34D', fontWeight: 700, padding: '8px 12px', background: 'rgba(245, 158, 11, 0.2)', borderRadius: '8px' }}>
                  🔒 CEO Login Required for Sign-Off
                </div>
              )}
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}
