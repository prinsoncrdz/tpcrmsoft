import React from 'react';
import { X, Building2, User, Phone, Mail, MapPin, Calendar, DollarSign, CheckCircle2, Clock, FileText, Printer, ShieldCheck, PieChart, Sparkles } from 'lucide-react';

export default function ProjectDetailsModal({ project, subTasks = [], onClose, onDeleteProject, onCellEdit }) {
  if (!project) return null;

  const totalContract = parseFloat(project.totalContractValue || project.value || 0);
  const paidAmount = parseFloat(project.depositPaid || project.amountPaid || 0);
  const balanceDue = totalContract - paidAmount;

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

  const handlePrintPDF = () => {
    const origTitle = document.title;
    document.title = `Project Summary Report - ${project.companyName || project.projectName || 'Project'}`;
    window.print();
    setTimeout(() => { document.title = origTitle; }, 1000);
  };

  const handleExportWord = () => {
    const content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <title>PROJECT INITIATION FORM - ${project.projectName || 'Project'}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.5; color: #1E293B; }
          h1 { color: #0F172A; border-bottom: 3px solid #F59E0B; padding-bottom: 6px; font-size: 20px; }
          h2 { color: #92400E; background: #FEF3C7; padding: 6px 10px; font-size: 14px; margin-top: 18px; border-left: 4px solid #F59E0B; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
          th, td { border: 1px solid #CBD5E1; padding: 6px 10px; text-align: left; }
          th { background-color: #F8FAFC; color: #0F172A; font-weight: bold; width: 30%; }
        </style>
      </head>
      <body>
        <h1>Turning Point Retail Solutions — PROJECT INITIATION FORM</h1>
        <p style="font-size: 11px; color: #64748B;">Complete one form per new project | Obtain CEO approval before commencing | CONFIDENTIAL</p>
        
        <h2>SECTION A – BASIC PROJECT INFORMATION</h2>
        <table>
          <tr><th>Project Name</th><td>${project.projectName || 'N/A'}</td></tr>
          <tr><th>Project ID (TP-SL-MM-YY)</th><td><strong>${project.projectId || project.id || 'N/A'}</strong></td></tr>
          <tr><th>Client Name</th><td>${project.client || project.companyName || 'N/A'}</td></tr>
          <tr><th>Client Contact</th><td>${project.clientContact || project.phone || 'N/A'}</td></tr>
          <tr><th>Lead Generation Source</th><td>${project.leadGeneration || 'Direct Referral'}</td></tr>
          <tr><th>Project Manager</th><td>${project.owner || 'Walter Dantis (CEO)'}</td></tr>
          <tr><th>Lead Assignee</th><td>${project.assignee || 'Unassigned'}</td></tr>
          <tr><th>Sector / Category</th><td>${project.sector || 'RETAIL & FRANCHISE'}</td></tr>
          <tr><th>Priority</th><td>${project.priority || 'High'}</td></tr>
          <tr><th>Start Date & End Date</th><td>${project.startDate || 'N/A'} to ${project.targetEndDate || project.targetDate || 'N/A'}</td></tr>
        </table>

        <h2>SECTION B – SCOPE & OBJECTIVES</h2>
        <table>
          <tr><th>Project Objective</th><td>${project.projectObjective || project.statusUpdate || 'Primary retail consulting and implementation objective.'}</td></tr>
          <tr><th>Scope of Work</th><td>${project.scopeOfWork || 'End-to-end management, license coordination, and operational deployment.'}</td></tr>
          <tr><th>Key Deliverables</th><td>${project.keyDeliverables || 'Milestone outputs and weekly deliverable reports.'}</td></tr>
          <tr><th>Out of Scope</th><td>${project.outOfScope || 'Explicitly excluded tasks outside initial agreement.'}</td></tr>
        </table>

        <h2>SECTION C – FINANCIAL SUMMARY (CEO Exclusive Update)</h2>
        <table>
          <tr><th>Total Contract Value</th><td>${formatCurrency(totalContract)}</td></tr>
          <tr><th>Advance Amount Paid</th><td>${formatCurrency(paidAmount)}</td></tr>
          <tr><th>Outstanding Balance Due</th><td>${formatCurrency(balanceDue)}</td></tr>
          <tr><th>Payment Terms</th><td>${project.paymentTerms || '25% advance / 50% mid-way / 25% completion'}</td></tr>
        </table>

        <h2>SECTION D – APPROVAL SIGN-OFF</h2>
        <table>
          <tr><th>Prepared By</th><td>${project.preparedBy || 'Admin Manager'}</td></tr>
          <tr><th>Reviewed By</th><td>${project.owner || 'Walter Dantis (CEO)'}</td></tr>
          <tr><th>Approved By (CEO)</th><td>Walter Dantis (CEO) — <strong>Status: ${project.status || 'Approved'}</strong></td></tr>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Project_Summary_${(project.companyName || 'Project').replace(/\s+/g, '_')}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-overlay invoice-modal-overlay" style={{ zIndex: 100000 }}>
      <div className="modal-content invoice-preview-container" style={{ width: '92%', maxWidth: '850px', maxHeight: '92vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', borderRadius: '16px', background: '#FFFFFF' }}>
        
        {/* Controls Header (Hidden during window.print()) */}
        <div className="no-print" style={{ background: '#0F172A', color: '#FFF', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Building2 size={20} style={{ color: 'var(--brand-green)' }} />
            <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#FFF' }}>
              Full Project Details Sheet: {project.companyName || 'Client Project'}
            </h3>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button 
              onClick={handleExportWord}
              style={{ background: '#2563EB', color: '#FFF', border: 'none', padding: '8px 14px', borderRadius: '8px', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              title="Download Word Document Report"
            >
              📄 Word (.doc)
            </button>
            <button 
              onClick={handlePrintPDF}
              style={{ background: 'var(--brand-green)', color: '#FFF', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Printer size={15} /> Print / PDF Report
            </button>
            {onDeleteProject && (
              <button 
                onClick={() => onDeleteProject(project)}
                style={{ background: '#DC2626', color: '#FFF', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                title="Delete Project via CEO Mobile QR Code 2FA Security"
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
              <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Official Client & Project Performance Details Sheet</span>
            </div>

            <div style={{ textAlign: 'right' }}>
              <select
                value={project.status || 'In Progress'}
                onChange={(e) => {
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
                <p style={{ margin: 0 }}><strong>Progress:</strong> {calculatedProgress}% Completed</p>
                <p style={{ margin: '2px 0 0 0' }}><strong>Target Date:</strong> {project.targetDate || project.dueDate || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Client Details Grid */}
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '18px', marginBottom: '24px' }}>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #CBD5E1', paddingBottom: '6px' }}>
              1. Client & Business Summary
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '0.82rem', color: '#334155' }}>
              <div>
                <p style={{ margin: '0 0 6px 0' }}><strong>Client / Company Name:</strong> {project.companyName || 'N/A'}</p>
                <p style={{ margin: '0 0 6px 0' }}><strong>Contact Person:</strong> {project.contactPerson || project.clientName || 'N/A'}</p>
                <p style={{ margin: '0 0 6px 0' }}><strong>Telephone:</strong> {project.phone || 'N/A'}</p>
                <p style={{ margin: 0 }}><strong>Email Address:</strong> {project.email || 'N/A'}</p>
              </div>
              <div>
                <p style={{ margin: '0 0 6px 0' }}><strong>Business Registration Type:</strong> {project.registrationType || 'N/A'}</p>
                <p style={{ margin: '0 0 6px 0' }}><strong>Assigned Lead:</strong> {project.assignee || 'Unassigned'}</p>
                <p style={{ margin: 0 }}><strong>Office Address:</strong> {project.address || 'Phnom Penh, Cambodia'}</p>
              </div>
            </div>
          </div>

          {/* Scope of Work & Progress Bar Block */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '18px', marginBottom: '24px' }}>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A', margin: '0 0 10px 0', textTransform: 'uppercase' }}>
              2. Scope of Service & Completion Performance
            </h4>
            <p style={{ fontSize: '0.82rem', color: '#334155', lineHeight: '1.5', margin: '0 0 14px 0' }}>
              {project.scopeOfWork || project.notes || 'Full Business Registration, Licensing, and Operational Consulting in Cambodia.'}
            </p>

            <div style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}>
                <span>Overall Milestone Progress</span>
                <span style={{ color: 'var(--brand-green)' }}>{calculatedProgress}%</span>
              </div>
              <div style={{ width: '100%', height: '10px', background: '#E2E8F0', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ width: `${calculatedProgress}%`, height: '100%', background: 'linear-gradient(90deg, #10B981 0%, #059669 100%)', transition: 'width 0.4s ease' }}></div>
              </div>
            </div>
          </div>

          {/* Tasks & Milestones Table */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A', margin: '0 0 10px 0', textTransform: 'uppercase' }}>
              3. Assigned Tasks & Milestone Breakdown ({completedTasks.length} / {projectTasks.length} Completed)
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
