import React from 'react';
import { X, Building2, User, Phone, Mail, MapPin, Calendar, DollarSign, CheckCircle2, Clock, FileText, Printer, ShieldCheck, PieChart, Sparkles } from 'lucide-react';

export default function ProjectDetailsModal({ project, subTasks = [], onClose, onDeleteProject }) {
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
        <title>Project Details Summary Report</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #1E293B; }
          h1 { color: #0F172A; border-bottom: 2px solid #10B981; padding-bottom: 8px; }
          h2 { color: #1E293B; margin-top: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th, td { border: 1px solid #CBD5E1; padding: 8px 12px; text-align: left; }
          th { background-color: #0F172A; color: #FFFFFF; }
          .badge { padding: 4px 8px; background: #ECFDF5; color: #047857; font-weight: bold; border-radius: 4px; }
        </style>
      </head>
      <body>
        <h1>Turning Point Retail Solutions - Project Details Summary Report</h1>
        <p><strong>Generated Date:</strong> ${new Date().toLocaleDateString()}</p>
        
        <h2>1. Client & Project Overview</h2>
        <table>
          <tr><th>Client Company Name</th><td>${project.companyName || 'N/A'}</td></tr>
          <tr><th>Project Name / Scope</th><td>${project.projectName || project.scopeOfWork || 'N/A'}</td></tr>
          <tr><th>Contact Person</th><td>${project.contactPerson || project.clientName || 'N/A'}</td></tr>
          <tr><th>Contact Details</th><td>Phone: ${project.phone || 'N/A'} | Email: ${project.email || 'N/A'}</td></tr>
          <tr><th>Business Registration Type</th><td>${project.registrationType || 'N/A'}</td></tr>
          <tr><th>Assigned Team Member</th><td>${project.assignee || 'N/A'}</td></tr>
          <tr><th>Target Completion Date</th><td>${project.targetDate || project.dueDate || 'N/A'}</td></tr>
          <tr><th>Current Progress</th><td>${calculatedProgress}% Completed</td></tr>
        </table>

        <h2>2. Financial Summary</h2>
        <table>
          <tr><th>Total Contract Value</th><td>${formatCurrency(totalContract)}</td></tr>
          <tr><th>Deposit / Amount Paid</th><td>${formatCurrency(paidAmount)}</td></tr>
          <tr><th>Outstanding Balance Due</th><td>${formatCurrency(balanceDue)}</td></tr>
        </table>

        <h2>3. Milestone Tasks & Progress Updates (${completedTasks.length} / ${projectTasks.length} Completed)</h2>
        <table>
          <thead>
            <tr><th>#</th><th>Task Title</th><th>Category</th><th>Assigned To</th><th>Weight %</th><th>Status</th></tr>
          </thead>
          <tbody>
            ${projectTasks.map((t, idx) => `
              <tr>
                <td>${idx + 1}</td>
                <td>${t.title || 'Task'}</td>
                <td>${t.category || 'General'}</td>
                <td>${t.assigneeName || 'Staff'}</td>
                <td>${t.weightScore || Math.round(100 / (projectTasks.length || 1))}%</td>
                <td>${t.status}</td>
              </tr>
            `).join('')}
          </tbody>
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
              <div style={{ background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', padding: '6px 14px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 800, display: 'inline-block', marginBottom: '6px' }}>
                Status: {project.status || 'In Progress'}
              </div>
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
