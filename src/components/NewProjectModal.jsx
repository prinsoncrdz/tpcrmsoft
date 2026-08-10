import React, { useState, useEffect } from 'react';
import { X, Sparkles, CheckCircle2, Send, ShieldCheck, Lock, DollarSign, FileText, AlertCircle } from 'lucide-react';
import { SYSTEM_USERS } from '../services/googleSheets';

export default function NewProjectModal({ onClose, onAddProject, currentUser }) {
  const isCeo = currentUser?.role === 'CEO' || 
                (currentUser?.name || '').toLowerCase().includes('walter') || 
                (currentUser?.role || '').toLowerCase().includes('ceo');

  // Auto-generate Project ID in format: TP-SL-MM-YY (e.g. TP-RET-08-26)
  const generateProjectId = (sectorName) => {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yy = String(today.getFullYear()).slice(-2);
    
    let sectorCode = 'GEN';
    const s = (sectorName || '').toUpperCase();
    if (s.includes('RETAIL') || s.includes('FRANCHISE')) sectorCode = 'RET';
    else if (s.includes('HEALTH')) sectorCode = 'HLT';
    else if (s.includes('TECH')) sectorCode = 'TEC';
    else if (s.includes('EDU')) sectorCode = 'EDU';
    else if (s.includes('TRAD')) sectorCode = 'TRD';
    else if (s.includes('CONSULT')) sectorCode = 'CNS';

    const randSeq = Math.floor(10 + Math.random() * 90);
    return `TP-${sectorCode}-${randSeq}-${mm}${yy}`;
  };

  const [formData, setFormData] = useState({
    // SECTION A - BASIC PROJECT INFORMATION
    projectId: generateProjectId('RETAIL & FRANCHISE'),
    projectName: '',
    client: '',
    clientContact: '',
    leadGeneration: '',
    owner: 'Walter Dantis (CEO)',
    assignee: 'Sreylang Thim',
    coreTeamMembers: 'Chan Sombath, Sreylang Thim, Prinson Cardozo',
    startDate: new Date().toISOString().split('T')[0],
    targetEndDate: '2026-12-31',
    budgetUsd: '',
    estimatedRevenueUsd: '',
    sector: 'RETAIL & FRANCHISE',
    priority: 'High',

    // SECTION B – SCOPE & OBJECTIVES
    projectObjective: '',
    scopeOfWork: '',
    keyDeliverables: '',
    keyPartners: '',
    successCriteria: '',
    knownRisks: '',
    outOfScope: '',
    dependencies: '',

    // SECTION C – FINANCIAL SUMMARY (CEO EXCLUSIVE UPDATE SECTION)
    contractValueUsd: '',
    advanceRetainerPct: '25',
    advanceAmountUsd: '',
    paymentTerms: '25% advance / 50% mid-way / 25% completion',
    billingCurrency: 'USD',
    estimatedDirectCosts: '',
    estimatedGrossMargin: '',
    invoiceSchedule: 'Milestone-based billing upon key deliverable completion',

    // SECTION D – APPROVALS
    preparedBy: currentUser?.name || 'Admin Manager',
    reviewedBy: 'Walter Dantis (CEO)',
    status: isCeo ? 'In Progress' : 'Pending CEO Approval',
    statusUpdate: 'Project Initiation Form submitted for CEO review and sign-off.'
  });

  const [submitted, setSubmitted] = useState(false);

  // Auto update Project ID when sector changes
  const handleSectorChange = (e) => {
    const newSector = e.target.value;
    setFormData(prev => ({
      ...prev,
      sector: newSector,
      projectId: generateProjectId(newSector)
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };

      // Auto calculation for Section C if CEO is filling
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.projectName || !formData.client) {
      alert('Please fill out all mandatory fields in Section A.');
      return;
    }

    try {
      setSubmitted(true);

      const projectPayload = {
        ...formData,
        id: formData.projectId || `TP-PRJ-${Date.now()}`,
        projectId: formData.projectId || `TP-PRJ-${Date.now()}`,
        value: formData.contractValueUsd || formData.estimatedRevenueUsd || '$0',
        depositPaid: formData.advanceAmountUsd || '$0',
        progress: 0,
        driveLink: ''
      };

      if (onAddProject) {
        await onAddProject(projectPayload);
      }

      setTimeout(() => {
        onClose();
      }, 2500);
    } catch (err) {
      console.error('Submit Error:', err);
      alert(`Project saved locally! Error syncing: ${err.message || err}`);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 100000 }}>
      <div className="modal-content" style={{ maxWidth: '920px', width: '95%', maxHeight: '90vh', overflowY: 'auto', padding: '0', borderRadius: '16px', borderTop: '5px solid #F59E0B' }}>
        
        {/* Modal Header */}
        <div style={{ background: '#0F172A', color: '#FFF', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Sparkles style={{ color: '#F59E0B' }} size={20} />
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Turning Point Retail Solutions • Phnom Penh, Cambodia
              </span>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0, color: '#FFFFFF' }}>
              PROJECT INITIATION FORM (TP-SL-MM-YY)
            </h2>
            <p style={{ fontSize: '0.75rem', color: '#94A3B8', margin: '4px 0 0 0' }}>
              Complete one form per new project | Obtain CEO approval before commencing | CONFIDENTIAL
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#FFF', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={18} />
          </button>
        </div>

        {/* Form Notice Bar */}
        <div style={{ background: '#FEF3C7', borderBottom: '1px solid #FCD34D', padding: '10px 24px', fontSize: '0.78rem', color: '#92400E', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} style={{ color: '#D97706' }} />
          <span>INSTRUCTIONS: Fill all fields highlighted in amber. Submit to CEO (Walter Dantis) for sign-off. Section C is strictly for CEO updates.</span>
        </div>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', border: '2px solid #A7F3D0' }}>
              <CheckCircle2 size={40} />
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0F172A' }}>
              Project Initiation Form Submitted! 🎉
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#475569', marginTop: '8px', maxWidth: '520px', margin: '8px auto 0' }}>
              Project <strong>"{formData.projectName}"</strong> (ID: <code>{formData.projectId}</code>) has been submitted. {isCeo ? 'As CEO, project is approved & live in CRM!' : 'Submitted to CEO Walter Dantis for final Section C financial sign-off.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
            
            {/* ==================== SECTION A – BASIC PROJECT INFORMATION ==================== */}
            <div style={{ background: '#FFFBEB', border: '1.5px solid #FCD34D', borderRadius: '12px', padding: '18px', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '0.92rem', fontWeight: 900, color: '#92400E', margin: '0 0 14px 0', borderBottom: '1px solid #FDE68A', paddingBottom: '8px', textTransform: 'uppercase' }}>
                SECTION A – BASIC PROJECT INFORMATION
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#78350F', display: 'block', marginBottom: '4px' }}>
                    Project Name *
                  </label>
                  <input 
                    name="projectName" 
                    value={formData.projectName} 
                    onChange={handleChange} 
                    placeholder="Enter full project name e.g. Ministry of Commerce License & Expansion"
                    required
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #FCD34D', background: '#FFF', fontSize: '0.85rem', fontWeight: 700 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#78350F', display: 'block', marginBottom: '4px' }}>
                    Project ID (TP-SL-MM-YY) *
                  </label>
                  <input 
                    name="projectId" 
                    value={formData.projectId} 
                    onChange={handleChange} 
                    required
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #FCD34D', background: '#FEF3C7', fontSize: '0.88rem', fontWeight: 900, color: '#92400E', fontFamily: 'monospace' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#78350F', display: 'block', marginBottom: '4px' }}>
                    Client Name *
                  </label>
                  <input 
                    name="client" 
                    value={formData.client} 
                    onChange={handleChange} 
                    placeholder="Company / Individual Name"
                    required
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#78350F', display: 'block', marginBottom: '4px' }}>
                    Client Contact Info
                  </label>
                  <input 
                    name="clientContact" 
                    value={formData.clientContact} 
                    onChange={handleChange} 
                    placeholder="Name, designation, phone, email"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#78350F', display: 'block', marginBottom: '4px' }}>
                    Lead Generation Source
                  </label>
                  <input 
                    name="leadGeneration" 
                    value={formData.leadGeneration} 
                    onChange={handleChange} 
                    placeholder="How was this lead sourced?"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#78350F', display: 'block', marginBottom: '4px' }}>
                    Sector / Category *
                  </label>
                  <select name="sector" value={formData.sector} onChange={handleSectorChange} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #FCD34D', background: '#FFF', fontSize: '0.82rem', fontWeight: 700 }}>
                    <option value="RETAIL & FRANCHISE">RETAIL & FRANCHISE (RET)</option>
                    <option value="HEALTHCARE">HEALTHCARE (HLT)</option>
                    <option value="TECHNOLOGY & INNOVATION">TECHNOLOGY & INNOVATION (TEC)</option>
                    <option value="EDUCATION">EDUCATION (EDU)</option>
                    <option value="TRADING & DISTRIBUTION">TRADING & DISTRIBUTION (TRD)</option>
                    <option value="CONSULTING">CONSULTING (CNS)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#78350F', display: 'block', marginBottom: '4px' }}>
                    Project Manager
                  </label>
                  <select name="owner" value={formData.owner} onChange={handleChange} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem' }}>
                    {SYSTEM_USERS.map(u => (
                      <option key={u.email} value={u.name}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#78350F', display: 'block', marginBottom: '4px' }}>
                    Lead Assignee (Dispatches Work)
                  </label>
                  <select name="assignee" value={formData.assignee} onChange={handleChange} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem' }}>
                    {SYSTEM_USERS.map(u => (
                      <option key={u.email} value={u.name}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#78350F', display: 'block', marginBottom: '4px' }}>
                    Start Date
                  </label>
                  <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8rem' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#78350F', display: 'block', marginBottom: '4px' }}>
                    Target End Date
                  </label>
                  <input type="date" name="targetEndDate" value={formData.targetEndDate} onChange={handleChange} style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8rem' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#78350F', display: 'block', marginBottom: '4px' }}>
                    Priority
                  </label>
                  <select name="priority" value={formData.priority} onChange={handleChange} style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8rem' }}>
                    <option value="Urgent">Urgent</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#78350F', display: 'block', marginBottom: '4px' }}>
                    Est. Revenue ($ USD)
                  </label>
                  <input name="estimatedRevenueUsd" value={formData.estimatedRevenueUsd} onChange={handleChange} placeholder="e.g. $15,000" style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8rem' }} />
                </div>
              </div>
            </div>

            {/* ==================== SECTION B – SCOPE & OBJECTIVES ==================== */}
            <div style={{ background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: '12px', padding: '18px', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '0.92rem', fontWeight: 900, color: '#0F172A', margin: '0 0 14px 0', borderBottom: '1px solid #E2E8F0', paddingBottom: '8px', textTransform: 'uppercase' }}>
                SECTION B – SCOPE & OBJECTIVES
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '4px' }}>
                    Project Objective (2–3 sentences)
                  </label>
                  <textarea name="projectObjective" rows="2" value={formData.projectObjective} onChange={handleChange} placeholder="State primary objective..." style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8rem' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '4px' }}>
                    Scope of Work & Key Activities
                  </label>
                  <textarea name="scopeOfWork" rows="2" value={formData.scopeOfWork} onChange={handleChange} placeholder="Describe key activities and deliverables..." style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8rem' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '4px' }}>
                    Key Deliverables & Milestones
                  </label>
                  <textarea name="keyDeliverables" rows="2" value={formData.keyDeliverables} onChange={handleChange} placeholder="List main outputs..." style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8rem' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '4px' }}>
                    Key External Partners / Vendors
                  </label>
                  <textarea name="keyPartners" rows="2" value={formData.keyPartners} onChange={handleChange} placeholder="List external partners..." style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8rem' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '4px' }}>
                    Out of Scope (Explicitly Excluded)
                  </label>
                  <input name="outOfScope" value={formData.outOfScope} onChange={handleChange} placeholder="Explicitly state what is NOT included..." style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8rem' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '4px' }}>
                    Dependencies & Risks
                  </label>
                  <input name="dependencies" value={formData.dependencies} onChange={handleChange} placeholder="What must happen first? Top risks..." style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8rem' }} />
                </div>
              </div>
            </div>

            {/* ==================== SECTION C – FINANCIAL SUMMARY (CEO EXCLUSIVE UPDATE) ==================== */}
            <div style={{ background: isCeo ? '#ECFDF5' : '#F1F5F9', border: `1.5px solid ${isCeo ? '#A7F3D0' : '#CBD5E1'}`, borderRadius: '12px', padding: '18px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: `1px solid ${isCeo ? '#A7F3D0' : '#CBD5E1'}`, paddingBottom: '8px' }}>
                <h3 style={{ fontSize: '0.92rem', fontWeight: 900, color: isCeo ? '#047857' : '#475569', margin: 0, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <DollarSign size={16} /> SECTION C – FINANCIAL SUMMARY (CEO Exclusive Update)
                </h3>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, background: isCeo ? '#047857' : '#64748B', color: '#FFF', padding: '3px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  {isCeo ? <ShieldCheck size={12} /> : <Lock size={12} />}
                  {isCeo ? 'CEO Walter Dantis Unlocked' : 'CEO Only - Read Only for Admin'}
                </span>
              </div>

              {!isCeo && (
                <div style={{ background: '#E2E8F0', padding: '8px 12px', borderRadius: '6px', fontSize: '0.75rem', color: '#334155', fontWeight: 600, marginBottom: '12px' }}>
                  🔒 <strong>Notice:</strong> Section C is strictly reserved for CEO Walter Dantis to update contract terms, direct costs, and retainer calculations.
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: isCeo ? '#065F46' : '#475569', display: 'block', marginBottom: '4px' }}>
                    Contract Value ($ USD)
                  </label>
                  <input 
                    name="contractValueUsd" 
                    value={formData.contractValueUsd} 
                    onChange={handleChange} 
                    disabled={!isCeo}
                    placeholder="Total fee e.g. 25000"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', fontWeight: 800, background: isCeo ? '#FFF' : '#E2E8F0' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: isCeo ? '#065F46' : '#475569', display: 'block', marginBottom: '4px' }}>
                    Advance / Retainer %
                  </label>
                  <input 
                    name="advanceRetainerPct" 
                    value={formData.advanceRetainerPct} 
                    onChange={handleChange} 
                    disabled={!isCeo}
                    placeholder="e.g. 25"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', background: isCeo ? '#FFF' : '#E2E8F0' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: isCeo ? '#065F46' : '#475569', display: 'block', marginBottom: '4px' }}>
                    Advance Amount ($ USD)
                  </label>
                  <input 
                    name="advanceAmountUsd" 
                    value={formData.advanceAmountUsd} 
                    onChange={handleChange} 
                    disabled={!isCeo}
                    placeholder="Auto-calculated advance"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', fontWeight: 800, background: isCeo ? '#FFF' : '#E2E8F0' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: isCeo ? '#065F46' : '#475569', display: 'block', marginBottom: '4px' }}>
                    Est. Direct Costs ($ USD)
                  </label>
                  <input 
                    name="estimatedDirectCosts" 
                    value={formData.estimatedDirectCosts} 
                    onChange={handleChange} 
                    disabled={!isCeo}
                    placeholder="Materials, travel, contractors"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', background: isCeo ? '#FFF' : '#E2E8F0' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: isCeo ? '#065F46' : '#475569', display: 'block', marginBottom: '4px' }}>
                    Est. Gross Margin %
                  </label>
                  <input 
                    name="estimatedGrossMargin" 
                    value={formData.estimatedGrossMargin} 
                    onChange={handleChange} 
                    disabled={!isCeo}
                    placeholder="Auto-calculated margin"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', fontWeight: 800, color: '#047857', background: isCeo ? '#FFF' : '#E2E8F0' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: isCeo ? '#065F46' : '#475569', display: 'block', marginBottom: '4px' }}>
                    Billing Currency
                  </label>
                  <input 
                    name="billingCurrency" 
                    value={formData.billingCurrency} 
                    onChange={handleChange} 
                    disabled={!isCeo}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', background: isCeo ? '#FFF' : '#E2E8F0' }}
                  />
                </div>
              </div>
            </div>

            {/* ==================== SECTION D – APPROVALS ==================== */}
            <div style={{ background: '#F8FAFC', border: '1.5px solid #CBD5E1', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '0.88rem', fontWeight: 900, color: '#0F172A', margin: '0 0 12px 0', borderBottom: '1px solid #E2E8F0', paddingBottom: '6px', textTransform: 'uppercase' }}>
                SECTION D – APPROVAL SIGN-OFF
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', fontSize: '0.78rem' }}>
                <div style={{ background: '#FFF', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <span style={{ color: '#64748B', display: 'block', marginBottom: '2px' }}>Prepared By (Admin/Staff):</span>
                  <strong style={{ color: '#0F172A', fontSize: '0.85rem' }}>{formData.preparedBy}</strong>
                  <span style={{ color: '#94A3B8', display: 'block', marginTop: '4px' }}>Date: {new Date().toLocaleDateString()}</span>
                </div>
                <div style={{ background: '#FFF', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <span style={{ color: '#64748B', display: 'block', marginBottom: '2px' }}>Reviewed By (PM):</span>
                  <strong style={{ color: '#0F172A', fontSize: '0.85rem' }}>{formData.owner}</strong>
                  <span style={{ color: '#94A3B8', display: 'block', marginTop: '4px' }}>Date: Pending</span>
                </div>
                <div style={{ background: isCeo ? '#ECFDF5' : '#FFFBEB', padding: '10px', borderRadius: '8px', border: `1px solid ${isCeo ? '#A7F3D0' : '#FCD34D'}` }}>
                  <span style={{ color: isCeo ? '#047857' : '#B45309', display: 'block', marginBottom: '2px' }}>CEO Approval Sign-Off:</span>
                  <strong style={{ color: isCeo ? '#047857' : '#D97706', fontSize: '0.85rem' }}>
                    {isCeo ? 'Walter Dantis (Approved)' : 'Pending CEO Approval'}
                  </strong>
                  <span style={{ color: isCeo ? '#059669' : '#B45309', display: 'block', marginTop: '4px' }}>
                    {isCeo ? `Signed & Approved: ${new Date().toLocaleDateString()}` : 'Awaiting CEO Sign-Off'}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '10px', borderTop: '1px solid #E2E8F0' }}>
              <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn-primary" style={{ background: isCeo ? '#10B981' : '#F59E0B', borderColor: isCeo ? '#10B981' : '#F59E0B' }}>
                <Send size={18} /> {isCeo ? 'CEO Approve & Add Project to CRM' : 'Submit Form to CEO for Approval'}
              </button>
            </div>

          </form>
        )}
      </div>
    </div>
  );
}
