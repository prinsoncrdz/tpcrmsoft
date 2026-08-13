import React, { useState } from 'react';
import { X, Building2, User, Phone, Mail, MapPin, Calendar, DollarSign, CheckCircle2, Clock, FileText, Printer, ShieldCheck, PieChart, Sparkles, AlertTriangle, Layers, Award, Edit3, Save } from 'lucide-react';

export default function ProjectDetailsModal({ project, currentUser, subTasks = [], onClose, onDeleteProject, onCellEdit, onSaveProjectDetails }) {
  if (!project) return null;

  const isCeo = currentUser?.role === 'CEO' || (currentUser?.name || '').toLowerCase().includes('walter') || (currentUser?.role || '').toLowerCase().includes('ceo');

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    clientContact: project.clientContact || project.contactPerson || project.phone || '',
    projectObjective: project.projectObjective || project.statusUpdate || '',
    scopeOfWork: project.scopeOfWork || project.notes || '',
    keyDeliverables: project.keyDeliverables || '',
    keyPartners: project.keyPartners || '',
    contractValueUsd: project.contractValueUsd || project.value || '',
    advanceAmountUsd: project.advanceAmountUsd || project.depositPaid || '',
    paymentTerms: project.paymentTerms || '',
    invoiceSchedule: project.invoiceSchedule || ''
  });

  const totalContract = parseFloat(formData.contractValueUsd || project.contractValueUsd || project.totalContractValue || project.value || 0);
  const paidAmount = parseFloat(formData.advanceAmountUsd || project.advanceAmountUsd || project.depositPaid || project.amountPaid || 0);
  const balanceDue = Math.max(0, totalContract - paidAmount);

  const projectTasks = Array.isArray(subTasks) ? subTasks : [];
  const completedTasks = projectTasks.filter(t => t.status === 'Approved' || t.status === 'Completed');
  
  // Calculate weighted progress
  let calculatedProgress = project.progress || 0;
  if (projectTasks.length > 0) {
    const totalWeight = projectTasks.reduce((sum, t) => sum + (parseFloat(t.weightScore || (100 / projectTasks.length))), 0);
    const completedWeight = completedTasks.reduce((sum, t) => sum + (parseFloat(t.weightScore || (100 / projectTasks.length))), 0);
    calculatedProgress = Math.round((completedWeight / (totalWeight || 1)) * 100);
  }

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(isNaN(val) ? 0 : val);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveDetails = () => {
    if (onSaveProjectDetails) {
      onSaveProjectDetails(project, formData);
    }
    setIsEditing(false);
  };

  const handlePrintPDF = () => {
    const origTitle = document.title;
    document.title = `Project_Initiation_Form_${(project.projectName || project.companyName || 'Project').replace(/\s+/g, '_')}`;
    window.print();
    setTimeout(() => { document.title = origTitle; }, 1000);
  };

  const handleExportWord = () => {
    const content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <title>PROJECT INITIATION FORM - ${project.projectName || project.companyName || 'Project'}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.5; color: #0F172A; font-size: 11px; }
          h1 { color: #0F172A; border-bottom: 3px solid #0A6B3D; padding-bottom: 6px; font-size: 18px; text-transform: uppercase; margin-bottom: 2px; }
          .subtitle { color: #475569; font-size: 10px; margin-bottom: 16px; }
          h2 { color: #0A6B3D; background: #ECFDF5; padding: 6px 10px; font-size: 12px; margin-top: 18px; border-left: 4px solid #0A6B3D; text-transform: uppercase; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 11px; }
          th, td { border: 1px solid #CBD5E1; padding: 6px 10px; text-align: left; vertical-align: top; }
          th { background-color: #F8FAFC; color: #0F172A; font-weight: bold; width: 32%; }
          .header-table { width: 100%; margin-bottom: 12px; border: none; }
          .header-table td { border: none; padding: 0; }
        </style>
      </head>
      <body>
        <table class="header-table">
          <tr>
            <td>
              <h1>Turning Point Retail Solutions</h1>
              <div class="subtitle">PROJECT INITIATION FORM (OFFICIAL EXECUTIVE SPECIFICATION)</div>
            </td>
            <td style="text-align: right;">
              <strong>Project ID:</strong> ${project.projectId || project.id || '-'}<br/>
              <strong>Date:</strong> ${new Date().toLocaleDateString()}<br/>
              <strong>Status:</strong> ${project.status || 'In Progress'}
            </td>
          </tr>
        </table>

        <h2>SECTION A – BASIC PROJECT INFORMATION</h2>
        <table>
          <tr><th>Project Name</th><td><strong>${project.projectName || project.companyName || '-'}</strong></td></tr>
          <tr><th>Project ID (TP-SL-MM-YY)</th><td><strong>${project.projectId || project.id || '-'}</strong></td></tr>
          <tr><th>Client Name</th><td>${project.client || project.companyName || '-'}</td></tr>
          <tr><th>Client Contact Details</th><td>${formData.clientContact || project.clientContact || project.phone || '-'}</td></tr>
          <tr><th>Lead Generation Source</th><td>${project.leadGeneration || '-'}</td></tr>
          <tr><th>Project Manager / Owner</th><td>${project.owner || 'Walter Dantis (CEO)'}</td></tr>
          <tr><th>Lead Assignee</th><td>${project.assignee || '-'}</td></tr>
          <tr><th>Core Team Members</th><td>${project.coreTeamMembers || '-'}</td></tr>
          <tr><th>Sector / Category</th><td>${project.sector || 'RETAIL & FRANCHISE'}</td></tr>
          <tr><th>Priority Level</th><td>${project.priority || 'High'}</td></tr>
          <tr><th>Start Date & Target End Date</th><td>${project.startDate || '-'} to ${project.targetEndDate || project.targetDate || '-'}</td></tr>
        </table>

        <h2>SECTION B – SCOPE & OBJECTIVES</h2>
        <table>
          <tr><th>Project Objective</th><td>${formData.projectObjective || project.projectObjective || '-'}</td></tr>
          <tr><th>Scope of Work</th><td>${formData.scopeOfWork || project.scopeOfWork || '-'}</td></tr>
          <tr><th>Key Deliverables</th><td>${formData.keyDeliverables || project.keyDeliverables || '-'}</td></tr>
          <tr><th>Key Partners & Stakeholders</th><td>${formData.keyPartners || project.keyPartners || '-'}</td></tr>
          <tr><th>Success Criteria</th><td>${project.successCriteria || '-'}</td></tr>
          <tr><th>Known Risks & Constraints</th><td>${project.knownRisks || '-'}</td></tr>
          <tr><th>Out of Scope Tasks</th><td>${project.outOfScope || '-'}</td></tr>
          <tr><th>Dependencies</th><td>${project.dependencies || '-'}</td></tr>
        </table>

        <h2>SECTION C – FINANCIAL SUMMARY (CEO EXCLUSIVE)</h2>
        <table>
          <tr><th>Contract Value (USD)</th><td><strong>${totalContract > 0 ? formatCurrency(totalContract) : '-'}</strong></td></tr>
          <tr><th>Advance Retainer Amount</th><td>${paidAmount > 0 ? formatCurrency(paidAmount) : '-'}</td></tr>
          <tr><th>Outstanding Balance Due</th><td><strong>${totalContract > 0 ? formatCurrency(balanceDue) : '-'}</strong></td></tr>
          <tr><th>Payment Terms</th><td>${formData.paymentTerms || project.paymentTerms || '-'}</td></tr>
          <tr><th>Billing Currency</th><td>${project.billingCurrency || 'USD'}</td></tr>
          <tr><th>Invoice Schedule</th><td>${formData.invoiceSchedule || project.invoiceSchedule || '-'}</td></tr>
        </table>

        <h2>SECTION D – APPROVAL SIGN-OFF & STATUS</h2>
        <table>
          <tr><th>Prepared By</th><td>${project.preparedBy || '-'}</td></tr>
          <tr><th>Reviewed By</th><td>${project.reviewedBy || 'Walter Dantis (CEO)'}</td></tr>
          <tr><th>CEO Approval Status</th><td>Walter Dantis (CEO) — <strong>${project.status || 'In Progress'}</strong></td></tr>
          <tr><th>Progress Update / Remarks</th><td>${project.statusUpdate || '-'}</td></tr>
        </table>

        <div style="margin-top: 40px; display: flex; justify-content: space-between;">
          <div>
            <p>___________________________________<br/><strong>Prepared By Signature</strong></p>
          </div>
          <div>
            <p>___________________________________<br/><strong>CEO Walter Dantis Signature & Approval</strong></p>
          </div>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Project_Initiation_Form_${(project.projectName || project.companyName || 'Project').replace(/\s+/g, '_')}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-overlay invoice-modal-overlay" style={{ zIndex: 100000 }}>
      <div className="modal-content invoice-preview-container" style={{ width: '94%', maxWidth: '920px', maxHeight: '94vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', borderRadius: '16px', background: '#FFFFFF' }}>
        
        {/* Controls Header (Hidden during window.print()) */}
        <div className="no-print" style={{ background: '#0F172A', color: '#FFF', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Building2 size={20} style={{ color: 'var(--brand-green)' }} />
            <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#FFF' }}>
              Project Initiation Form & Details Sheet: {project.projectName || project.companyName || 'Client Project'}
            </h3>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {isEditing ? (
              <button 
                onClick={handleSaveDetails}
                style={{ background: '#059669', color: '#FFF', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Save size={15} /> 💾 Save Details
              </button>
            ) : (
              <button 
                onClick={() => setIsEditing(true)}
                style={{ background: '#F59E0B', color: '#FFF', border: 'none', padding: '8px 14px', borderRadius: '8px', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                title="Edit Scope of Work, Objectives & Financial Summary"
              >
                <Edit3 size={15} /> ✏️ Edit Details
              </button>
            )}
            <button 
              onClick={handleExportWord}
              style={{ background: '#2563EB', color: '#FFF', border: 'none', padding: '8px 14px', borderRadius: '8px', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              title="Download Full Project Initiation Form (.doc)"
            >
              📄 Export Word (.doc)
            </button>
            <button 
              onClick={handlePrintPDF}
              style={{ background: 'var(--brand-green)', color: '#FFF', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Printer size={15} /> Print / PDF Report
            </button>
            {isCeo && onDeleteProject && (
              <button 
                onClick={() => onDeleteProject(project)}
                style={{ background: '#DC2626', color: '#FFF', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                🗑️ Delete Project
              </button>
            )}
            <button 
              onClick={onClose} 
              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#FFF', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Project Details Sheet Content */}
        <div className="printable-invoice-paper" style={{ padding: '28px 36px', overflowY: 'auto', flex: 1, background: '#FFFFFF', color: '#1E293B', fontFamily: 'Poppins, sans-serif' }}>
          
          {/* Header Title Block */}
          <div style={{ borderBottom: '2.5px solid var(--brand-green)', paddingBottom: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <img 
                src="https://www.turningpointretail.com/images/turning-point-new-logo.png" 
                alt="Turning Point Logo" 
                style={{ height: '48px', width: 'auto', marginBottom: '8px' }}
              />
              <h2 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0F172A', margin: 0 }}>Turning Point Retail Solutions</h2>
              <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>PROJECT INITIATION FORM & EXECUTIVE SPECIFICATION SHEET</span>
            </div>

            <div style={{ textAlign: 'right' }}>
              <select
                value={project.status || 'In Progress'}
                disabled={!isCeo}
                title={isCeo ? 'Update Project Status' : '🔒 Project Status Update Reserved Exclusively for CEO Walter Dantis'}
                onChange={(e) => {
                  if (!isCeo) return;
                  if (onCellEdit) {
                    onCellEdit(project, 'status', 10, e.target.value);
                    if (e.target.value === 'Completed') {
                      onCellEdit(project, 'completion', 9, '100%');
                    }
                  }
                }}
                style={{
                  background: '#ECFDF5',
                  color: '#047857',
                  border: '1px solid #A7F3D0',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  marginBottom: '6px'
                }}
              >
                <option value="In Progress">Status: In Progress</option>
                <option value="Review">Status: Review</option>
                <option value="Completed">Status: Completed (100%)</option>
                <option value="On Hold">Status: On Hold</option>
                <option value="Cancelled">Status: Cancelled</option>
                <option value="Planning">Status: Planning</option>
              </select>
              <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                <p style={{ margin: 0 }}><strong>ID:</strong> {project.projectId || project.id || '-'}</p>
                <p style={{ margin: '2px 0 0 0' }}><strong>Progress:</strong> {calculatedProgress}% Completed</p>
                <p style={{ margin: '2px 0 0 0' }}><strong>Target Date:</strong> {project.targetEndDate || project.targetDate || '-'}</p>
              </div>
            </div>
          </div>

          {/* SECTION A – BASIC PROJECT INFORMATION */}
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '18px', marginBottom: '20px' }}>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #CBD5E1', paddingBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 size={16} style={{ color: 'var(--brand-green)' }} /> SECTION A – BASIC PROJECT INFORMATION
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '0.82rem', color: '#334155' }}>
              <div>
                <p style={{ margin: '0 0 6px 0' }}><strong>Project Name:</strong> {project.projectName || project.companyName || '-'}</p>
                <p style={{ margin: '0 0 6px 0' }}><strong>Project ID:</strong> {project.projectId || project.id || '-'}</p>
                <p style={{ margin: '0 0 6px 0' }}><strong>Client Name:</strong> {project.client || project.companyName || '-'}</p>
                <p style={{ margin: '0 0 6px 0' }}>
                  <strong>Client Contact Details:</strong>{' '}
                  {isEditing ? (
                    <input name="clientContact" className="cell-input" value={formData.clientContact} onChange={handleChange} placeholder="Person, Phone, Email..." />
                  ) : (
                    formData.clientContact || project.clientContact || '-'
                  )}
                </p>
                <p style={{ margin: 0 }}><strong>Lead Source:</strong> {project.leadGeneration || '-'}</p>
              </div>
              <div>
                <p style={{ margin: '0 0 6px 0' }}><strong>Project Manager:</strong> {project.owner || 'Walter Dantis (CEO)'}</p>
                <p style={{ margin: '0 0 6px 0' }}><strong>Lead Assignee:</strong> {project.assignee || '-'}</p>
                <p style={{ margin: '0 0 6px 0' }}><strong>Sector:</strong> {project.sector || 'RETAIL & FRANCHISE'}</p>
                <p style={{ margin: '0 0 6px 0' }}><strong>Priority:</strong> {project.priority || 'High'}</p>
                <p style={{ margin: 0 }}><strong>Duration:</strong> {project.startDate || '-'} → {project.targetEndDate || project.targetDate || '-'}</p>
              </div>
            </div>
          </div>

          {/* SECTION B – SCOPE & OBJECTIVES (100% EDITABLE ON SCREEN) */}
          <div style={{ background: '#FFFFFF', border: '1.5px solid #F59E0B', borderRadius: '12px', padding: '18px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(245,158,11,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #FDE68A', paddingBottom: '6px' }}>
              <h4 style={{ fontSize: '0.88rem', fontWeight: 900, color: '#92400E', margin: 0, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={16} style={{ color: '#F59E0B' }} /> SECTION B – SCOPE & OBJECTIVES
              </h4>
              {!isEditing && (
                <button 
                  onClick={() => setIsEditing(true)}
                  style={{ background: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A', borderRadius: '6px', padding: '2px 8px', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer' }}
                >
                  ✏️ Edit Scope
                </button>
              )}
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', fontSize: '0.82rem' }}>
              <div style={{ background: '#FEF3C7', padding: '10px 14px', borderRadius: '8px', border: '1px solid #FDE68A' }}>
                <strong style={{ color: '#78350F', display: 'block', marginBottom: '4px' }}>🎯 Project Objective:</strong>
                {isEditing ? (
                  <textarea name="projectObjective" rows={2} style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #FCD34D' }} value={formData.projectObjective} onChange={handleChange} placeholder="Type project objective..." />
                ) : (
                  <span style={{ color: '#1E293B' }}>{formData.projectObjective || project.projectObjective || '-'}</span>
                )}
              </div>

              <div style={{ background: '#F8FAFC', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <strong style={{ color: '#0F172A', display: 'block', marginBottom: '4px' }}>📋 Scope of Work (Editable):</strong>
                {isEditing ? (
                  <textarea name="scopeOfWork" rows={4} style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #CBD5E1' }} value={formData.scopeOfWork} onChange={handleChange} placeholder="Type detailed scope of work..." />
                ) : (
                  <span style={{ color: '#334155', lineHeight: '1.5' }}>{formData.scopeOfWork || project.scopeOfWork || '-'}</span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ background: '#ECFDF5', padding: '10px 14px', borderRadius: '8px', border: '1px solid #A7F3D0' }}>
                  <strong style={{ color: '#065F46', display: 'block', marginBottom: '4px' }}>🏆 Key Deliverables:</strong>
                  {isEditing ? (
                    <input name="keyDeliverables" style={{ width: '100%', padding: '4px', borderRadius: '4px', border: '1px solid #A7F3D0' }} value={formData.keyDeliverables} onChange={handleChange} placeholder="Key deliverables..." />
                  ) : (
                    <span style={{ color: '#047857' }}>{formData.keyDeliverables || project.keyDeliverables || '-'}</span>
                  )}
                </div>

                <div style={{ background: '#EFF6FF', padding: '10px 14px', borderRadius: '8px', border: '1px solid #BFDBFE' }}>
                  <strong style={{ color: '#1E40AF', display: 'block', marginBottom: '4px' }}>🤝 Key Partners & Stakeholders:</strong>
                  {isEditing ? (
                    <input name="keyPartners" style={{ width: '100%', padding: '4px', borderRadius: '4px', border: '1px solid #BFDBFE' }} value={formData.keyPartners} onChange={handleChange} placeholder="Key partners..." />
                  ) : (
                    <span style={{ color: '#1E3A8A' }}>{formData.keyPartners || project.keyPartners || '-'}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION C – FINANCIAL SUMMARY (100% EDITABLE & SAVED) */}
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '18px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #CBD5E1', paddingBottom: '6px' }}>
              <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A', margin: 0, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <DollarSign size={16} style={{ color: 'var(--brand-green)' }} /> SECTION C – FINANCIAL SUMMARY & PAYMENT TERMS
              </h4>
              {!isEditing && (
                <button 
                  onClick={() => setIsEditing(true)}
                  style={{ background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', borderRadius: '6px', padding: '2px 8px', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer' }}
                >
                  ✏️ Edit Financials
                </button>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '0.82rem', color: '#334155' }}>
              <div>
                <p style={{ margin: '0 0 6px 0' }}>
                  <strong>Contract Value ($):</strong>{' '}
                  {isEditing ? (
                    <input name="contractValueUsd" type="number" style={{ padding: '4px', width: '130px', borderRadius: '4px', border: '1px solid #CBD5E1' }} value={formData.contractValueUsd} onChange={handleChange} placeholder="e.g. 5000" />
                  ) : (
                    <span style={{ fontWeight: 800, color: 'var(--brand-green)' }}>{totalContract > 0 ? formatCurrency(totalContract) : '-'}</span>
                  )}
                </p>
                <p style={{ margin: '0 0 6px 0' }}>
                  <strong>Advance Paid ($):</strong>{' '}
                  {isEditing ? (
                    <input name="advanceAmountUsd" type="number" style={{ padding: '4px', width: '130px', borderRadius: '4px', border: '1px solid #CBD5E1' }} value={formData.advanceAmountUsd} onChange={handleChange} placeholder="e.g. 1250" />
                  ) : (
                    paidAmount > 0 ? formatCurrency(paidAmount) : '-'
                  )}
                </p>
                <p style={{ margin: 0 }}>
                  <strong>Outstanding Balance Due:</strong>{' '}
                  <span style={{ fontWeight: 800, color: '#DC2626' }}>{totalContract > 0 ? formatCurrency(balanceDue) : '-'}</span>
                </p>
              </div>

              <div>
                <p style={{ margin: '0 0 6px 0' }}>
                  <strong>Payment Terms:</strong>{' '}
                  {isEditing ? (
                    <input name="paymentTerms" style={{ padding: '4px', width: '100%', borderRadius: '4px', border: '1px solid #CBD5E1' }} value={formData.paymentTerms} onChange={handleChange} placeholder="e.g. 25% adv / 75% comp" />
                  ) : (
                    formData.paymentTerms || project.paymentTerms || '-'
                  )}
                </p>
                <p style={{ margin: 0 }}>
                  <strong>Invoice Schedule:</strong>{' '}
                  {isEditing ? (
                    <input name="invoiceSchedule" style={{ padding: '4px', width: '100%', borderRadius: '4px', border: '1px solid #CBD5E1' }} value={formData.invoiceSchedule} onChange={handleChange} placeholder="Milestone schedule..." />
                  ) : (
                    formData.invoiceSchedule || project.invoiceSchedule || '-'
                  )}
                </p>
              </div>
            </div>

            {isEditing && (
              <div style={{ marginTop: '14px', textAlign: 'right' }}>
                <button
                  onClick={handleSaveDetails}
                  style={{ background: '#059669', color: '#FFF', border: 'none', borderRadius: '8px', padding: '8px 18px', fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Save size={16} /> Save Section B & C Changes
                </button>
              </div>
            )}
          </div>

          {/* SECTION D – APPROVAL SIGN-OFF */}
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '14px 18px', marginBottom: '20px' }}>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #CBD5E1', paddingBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={16} style={{ color: '#2563EB' }} /> SECTION D – APPROVAL SIGN-OFF
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', fontSize: '0.78rem', color: '#334155' }}>
              <p style={{ margin: 0 }}><strong>Prepared By:</strong> {project.preparedBy || '-'}</p>
              <p style={{ margin: 0 }}><strong>Reviewed By:</strong> {project.reviewedBy || 'Walter Dantis (CEO)'}</p>
              <p style={{ margin: 0 }}><strong>Executive Sign-off:</strong> <span style={{ color: '#047857', fontWeight: 800 }}>Walter Dantis (CEO) ✅</span></p>
            </div>
          </div>

          {/* SECTION E – ASSIGNED TASKS & MILESTONES */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A', margin: '0 0 10px 0', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={16} style={{ color: 'var(--brand-green)' }} /> SECTION E – ASSIGNED TASKS & MILESTONE BREAKDOWN ({completedTasks.length} / {projectTasks.length} Completed)
            </h4>

            {projectTasks.length === 0 ? (
              <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '8px', textAlign: 'center', color: '#64748B', fontSize: '0.8rem', fontStyle: 'italic' }}>
                No milestone tasks added for this project yet.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                <thead>
                  <tr style={{ background: '#0F172A', color: '#FFFFFF', textTransform: 'uppercase', textAlign: 'left' }}>
                    <th style={{ padding: '8px 10px', width: '40px' }}>No</th>
                    <th style={{ padding: '8px 10px' }}>Task Title & Scope</th>
                    <th style={{ padding: '8px 10px' }}>Category</th>
                    <th style={{ padding: '8px 10px' }}>Assigned To</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center', width: '80px' }}>Weight %</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center', width: '110px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {projectTasks.map((task, idx) => (
                    <tr key={task.id || idx} style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '8px 10px', fontWeight: 700, color: '#64748B' }}>{idx + 1}</td>
                      <td style={{ padding: '8px 10px', fontWeight: 600, color: '#0F172A' }}>
                        {task.title}
                        {task.detail && <div style={{ fontSize: '0.7rem', color: '#64748B', fontStyle: 'italic' }}>{task.detail}</div>}
                      </td>
                      <td style={{ padding: '8px 10px', color: '#475569' }}>{task.category || 'General'}</td>
                      <td style={{ padding: '8px 10px', fontWeight: 600 }}>{task.assigneeName || 'Staff'}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700 }}>{task.weightScore || Math.round(100 / (projectTasks.length || 1))}%</td>
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '10px',
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          background: task.status === 'Approved' || task.status === 'Completed' ? '#ECFDF5' : '#FFFBEB',
                          color: task.status === 'Approved' || task.status === 'Completed' ? '#047857' : '#B45309',
                          border: '1px solid ' + (task.status === 'Approved' || task.status === 'Completed' ? '#A7F3D0' : '#FDE68A')
                        }}>
                          {task.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer Note */}
          <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '14px', fontSize: '0.72rem', color: '#64748B', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Turning Point Retail Solutions • Phnom Penh, Cambodia</span>
            <span>Tel: +855 (0) 86 844 464 | info@turningpointretail.com</span>
          </div>

        </div>

      </div>
    </div>
  );
}
