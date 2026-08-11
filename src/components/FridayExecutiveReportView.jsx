import React, { useState, useEffect } from 'react';
import { Calendar, User, Mail, Building, Award, CheckCircle2, Clock, AlertCircle, Plus, Trash2, Send, Printer, RotateCcw, Eye, ShieldCheck, Sparkles, FileText, Check, X, Filter } from 'lucide-react';
import { SYSTEM_USERS, fetchGlobalWeeklyTasks, saveGlobalWeeklyTasks, sendGlobalNotification } from '../services/googleSheets';

const FRIDAY_REPORTS_KEY = 'tp_friday_executive_reports_v2';

export default function FridayExecutiveReportView({ currentUser, projects = [], onShowToast }) {
  const isCeo = currentUser?.role === 'CEO' || 
                (currentUser?.name || '').toLowerCase().includes('walter') || 
                (currentUser?.email || '').toLowerCase().includes('walterdantis') || 
                (currentUser?.role || '').toLowerCase().includes('ceo');

  const now = new Date();
  const dayOfWeekNum = now.getDay(); // 0 = Sun, 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat
  const isFridayOrSaturday = dayOfWeekNum === 5 || dayOfWeekNum === 6;
  const isCeoVerificationWindow = dayOfWeekNum === 6 || dayOfWeekNum === 0 || dayOfWeekNum === 1; // Sat, Sun, Mon
  const canAccessPortal = isFridayOrSaturday || isCeo;

  // Filter Assigned Projects from Live CRM Sheet for Logged-In Staff
  const staffNameLower = (currentUser?.name || '').toLowerCase();
  const staffEmailLower = (currentUser?.email || '').toLowerCase();
  const assignedProjects = projects.filter(p => {
    const assignee = (p.assignedTo || p.assignee || p.owner || '').toLowerCase();
    return assignee.includes(staffNameLower) || assignee.includes(staffEmailLower.split('@')[0]) || isCeo;
  });
  const availableProjects = assignedProjects.length > 0 ? assignedProjects : projects;

  // Form State for Staff
  const [fullName, setFullName] = useState(currentUser?.name || '');
  const [roleDesignation, setRoleDesignation] = useState(currentUser?.role || '');
  const [weekEnding, setWeekEnding] = useState('15-08-2026');
  const [emailAddress, setEmailAddress] = useState(currentUser?.email || '');
  const [departmentReportingTo, setDepartmentReportingTo] = useState('CEO Walter Dantis');
  const [keyAchievements, setKeyAchievements] = useState('');

  // Task Entries List
  const [tasks, setTasks] = useState([
    {
      id: `task-1`,
      projectArea: availableProjects[0]?.companyName || 'General Operations',
      taskTitle: '',
      deadline: '15-08-2026',
      priorityLevel: 'Medium',
      progressPct: 50,
      progressThisWeek: '',
      nextSteps: '',
      taskStatus: 'On track',
      supportNeededForTask: ''
    }
  ]);

  // Priorities & Support
  const [topPriorityNextWeek, setTopPriorityNextWeek] = useState('');
  const [supportNeededFromCeo, setSupportNeededFromCeo] = useState('');
  const [blockersOrRisks, setBlockersOrRisks] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  // Submitted Reports State & CEO Verification State
  const [submittedReports, setSubmittedReports] = useState([]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [ceoFeedbackInput, setCeoFeedbackInput] = useState('');
  const [selectedStaffFilter, setSelectedStaffFilter] = useState('ALL');

  // Sync Reports from Local Storage & Google Sheets Cloud Backend
  const loadReports = async () => {
    try {
      const saved = localStorage.getItem(FRIDAY_REPORTS_KEY);
      if (saved) setSubmittedReports(JSON.parse(saved));
      
      const cloud = await fetchGlobalWeeklyTasks();
      if (Array.isArray(cloud) && cloud.length > 0) {
        setSubmittedReports(cloud);
        localStorage.setItem(FRIDAY_REPORTS_KEY, JSON.stringify(cloud));
      }
    } catch(err) {}
  };

  useEffect(() => {
    loadReports();
    const interval = setInterval(loadReports, 8000);
    return () => clearInterval(interval);
  }, []);

  const saveReportsList = (updated) => {
    setSubmittedReports(updated);
    localStorage.setItem(FRIDAY_REPORTS_KEY, JSON.stringify(updated));
    saveGlobalWeeklyTasks(null, updated);
  };

  // Staff Task Form Handlers
  const handleAddTaskEntry = () => {
    setTasks([
      ...tasks,
      {
        id: `task-${Date.now()}`,
        projectArea: availableProjects[0]?.companyName || 'General Operations',
        taskTitle: '',
        deadline: '15-08-2026',
        priorityLevel: 'Medium',
        progressPct: 0,
        progressThisWeek: '',
        nextSteps: '',
        taskStatus: 'On track',
        supportNeededForTask: ''
      }
    ]);
  };

  const handleUpdateTaskField = (id, field, value) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const handleRemoveTaskEntry = (id) => {
    if (tasks.length === 1) return;
    setTasks(tasks.filter(t => t.id !== id));
  };

  const handleClearForm = () => {
    setKeyAchievements('');
    setTopPriorityNextWeek('');
    setSupportNeededFromCeo('');
    setBlockersOrRisks('');
    setAdditionalNotes('');
    setTasks([
      {
        id: `task-${Date.now()}`,
        projectArea: availableProjects[0]?.companyName || 'General Operations',
        taskTitle: '',
        deadline: '15-08-2026',
        priorityLevel: 'Medium',
        progressPct: 0,
        progressThisWeek: '',
        nextSteps: '',
        taskStatus: 'On track',
        supportNeededForTask: ''
      }
    ]);
  };

  const handleSubmitReportToCeo = (e) => {
    e.preventDefault();

    if (!fullName || !roleDesignation || !weekEnding || !emailAddress) {
      alert('Please fill in all required Staff Details fields (*).');
      return;
    }

    if (!keyAchievements.trim()) {
      alert('Please fill in your Key Achievements for this week.');
      return;
    }

    if (!topPriorityNextWeek.trim()) {
      alert('Please specify your Top Priority for next week.');
      return;
    }

    const reportPayload = {
      id: `report-${Date.now()}`,
      staffName: fullName,
      roleDesignation,
      weekEnding,
      userEmail: emailAddress.toLowerCase(),
      departmentReportingTo,
      keyAchievements,
      tasks,
      topPriorityNextWeek,
      supportNeededFromCeo,
      blockersOrRisks,
      additionalNotes,
      status: 'Submitted to CEO',
      submittedAt: new Date().toISOString(),
      ceoVerified: false,
      ceoFeedback: ''
    };

    const updated = [reportPayload, ...submittedReports];
    saveReportsList(updated);

    sendGlobalNotification(null, {
      recipientEmail: 'walterdantis@turningpointretail.com',
      title: `📥 New Friday Weekly Report Submitted by ${fullName}`,
      message: `${fullName} (${roleDesignation}) submitted their Friday Executive Report for week ending ${weekEnding}.`,
      type: 'WEEKLY_REPORT',
      createdByName: fullName
    });

    if (onShowToast) onShowToast(`🚀 Friday Executive Report sent directly to CEO Walter Dantis!`);
    alert(`🎉 Success! Your Friday Executive Weekly Report has been submitted directly to CEO Walter Dantis.`);

    handleClearForm();
  };

  // CEO Verification & Individual Report Export Handlers
  const handleCeoVerifyReport = (reportId, actionType) => {
    const updated = submittedReports.map(r => {
      if (r.id === reportId) {
        return {
          ...r,
          status: actionType === 'APPROVE' ? 'Approved by CEO' : 'Revision Requested by CEO',
          ceoVerified: actionType === 'APPROVE',
          ceoFeedback: ceoFeedbackInput.trim(),
          verifiedAt: new Date().toISOString()
        };
      }
      return r;
    });

    saveReportsList(updated);
    setSelectedReportId(null);
    setCeoFeedbackInput('');

    if (onShowToast) onShowToast(`Report verified by CEO Walter Dantis!`);
  };

  const handleExportIndividualWord = (rep) => {
    const content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <title>Friday Executive Weekly Report - ${rep.staffName}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #0F172A; }
          h1 { color: #0F172A; border-bottom: 3px solid #10B981; padding-bottom: 6px; font-size: 18px; }
          h2 { color: #1E293B; margin-top: 18px; font-size: 15px; border-bottom: 1px solid #CBD5E1; padding-bottom: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #CBD5E1; padding: 6px 10px; text-align: left; font-size: 12px; }
          th { background-color: #0F172A; color: #FFFFFF; }
          .box { background-color: #F8FAFC; border: 1px solid #E2E8F0; padding: 10px; margin-bottom: 12px; border-radius: 6px; }
        </style>
      </head>
      <body>
        <h1>Turning Point Retail Solutions — Friday Executive Staff Report</h1>
        <div class="box">
          <p><strong>Staff Member:</strong> ${rep.staffName} (${rep.roleDesignation}) | <strong>Email:</strong> ${rep.userEmail}</p>
          <p><strong>Week Ending (Saturday):</strong> ${rep.weekEnding} | <strong>Submitted Date:</strong> ${new Date(rep.submittedAt).toLocaleDateString()}</p>
          <p><strong>Department / Reporting To:</strong> ${rep.departmentReportingTo || 'CEO Walter Dantis'}</p>
        </div>

        <h2>1. Weekly Summary & Key Achievements</h2>
        <div class="box">
          <p>${rep.keyAchievements || 'N/A'}</p>
        </div>

        <h2>2. Assigned CRM Task Updates (${(rep.tasks || []).length} Items)</h2>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Assigned Project</th>
              <th>Task Title & Scope</th>
              <th>Deadline</th>
              <th>Priority</th>
              <th>Progress %</th>
              <th>Status</th>
              <th>CEO Support Needed</th>
            </tr>
          </thead>
          <tbody>
            ${(rep.tasks || []).map((t, idx) => `
              <tr>
                <td>${idx + 1}</td>
                <td><strong>${t.projectArea}</strong></td>
                <td>${t.taskTitle}<br/><em>${t.progressThisWeek || ''}</em></td>
                <td>${t.deadline}</td>
                <td>${t.priorityLevel}</td>
                <td>${t.progressPct}%</td>
                <td><strong>${t.taskStatus}</strong></td>
                <td>${t.supportNeededForTask || 'None'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h2>3. Priorities & CEO Support Required</h2>
        <div class="box">
          <p><strong>Top Priority for Next Week:</strong> ${rep.topPriorityNextWeek || 'N/A'}</p>
          <p><strong>Support Needed from CEO:</strong> ${rep.supportNeededFromCeo || 'None'}</p>
          <p><strong>Blockers / Risks Flagged:</strong> ${rep.blockersOrRisks || 'None'}</p>
          <p><strong>Additional Notes:</strong> ${rep.additionalNotes || 'N/A'}</p>
        </div>

        <div style="margin-top: 30px; border-top: 2px dashed #CBD5E1; padding-top: 15px;">
          <p><strong>Verification Status:</strong> ${rep.status} | <strong>CEO Sign-off:</strong> CEO Walter Dantis</p>
          ${rep.ceoFeedback ? `<p style="color:#047857;"><strong>CEO Feedback:</strong> ${rep.ceoFeedback}</p>` : ''}
          <p style="font-size: 11px; color: #64748B;">Turning Point Retail Solutions • Executive CEO Verification Approved Report</p>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Friday_Report_${rep.staffName.replace(/\s+/g, '_')}_${rep.weekEnding}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportIndividualPDF = (rep) => {
    const origTitle = document.title;
    document.title = `Friday_Executive_Report_${rep.staffName.replace(/\s+/g, '_')}_${rep.weekEnding}`;
    window.print();
    setTimeout(() => { document.title = origTitle; }, 1000);
  };

  // Lock screen for non-Friday/Saturday staff access
  if (!canAccessPortal) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', background: '#FFFFFF', borderRadius: '16px', margin: '24px auto', maxWidth: '600px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
        <div style={{ width: '64px', height: '64px', background: '#FEF3C7', color: '#D97706', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <Calendar size={32} />
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0F172A', marginBottom: '8px' }}>
          Friday Task Update Portal Closed
        </h2>
        <p style={{ fontSize: '0.85rem', color: '#64748B', lineHeight: 1.6, marginBottom: '20px' }}>
          The Friday Executive Staff Weekly Report Portal opens <strong>EXCLUSIVELY EVERY FRIDAY & SATURDAY</strong> for all staff members to complete and send weekly updates directly to CEO Walter Dantis.
        </p>
        <div style={{ background: '#F8FAFC', padding: '12px 18px', borderRadius: '10px', fontSize: '0.78rem', color: '#475569', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '8px', border: '1px solid #CBD5E1' }}>
          <Clock size={16} style={{ color: '#2563EB' }} /> Opens: Every Friday & Saturday
        </div>
      </div>
    );
  }

  // =========================================================================
  // CEO EXECUTIVE REVIEW DASHBOARD VIEW (CEO DOES NOT FILL FORM)
  // =========================================================================
  if (isCeo) {
    const filteredReports = submittedReports.filter(r => {
      if (selectedStaffFilter === 'ALL') return true;
      return (r.userEmail || '').toLowerCase() === selectedStaffFilter.toLowerCase();
    });

    const pendingCount = submittedReports.filter(r => !r.ceoVerified).length;
    const approvedCount = submittedReports.filter(r => r.ceoVerified).length;

    return (
      <div style={{ maxWidth: '1080px', margin: '24px auto', fontFamily: 'Segoe UI, Arial, sans-serif' }}>
        
        {/* CEO Executive Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          borderRadius: '16px',
          padding: '24px 28px',
          color: '#FFFFFF',
          marginBottom: '24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ background: 'var(--brand-green)', color: '#FFF', fontSize: '0.72rem', fontWeight: 900, padding: '3px 10px', borderRadius: '20px', textTransform: 'uppercase' }}>
                Executive CEO Portal
              </span>
              <span style={{ background: '#2563EB', color: '#FFF', fontSize: '0.72rem', fontWeight: 800, padding: '3px 8px', borderRadius: '4px' }}>
                📅 Verification Window: Sat–Mon 12:00 PM
              </span>
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#FFFFFF', margin: 0 }}>
              CEO Executive Staff Weekly Reports Verification Center 📋
            </h2>
            <p style={{ fontSize: '0.82rem', color: '#94A3B8', margin: '4px 0 0 0' }}>
              Review, verify, approve, and export individual staff weekly report submissions for CEO sign-off.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => window.print()}
              className="btn-secondary"
              style={{ padding: '8px 14px', fontSize: '0.8rem', fontWeight: 800, background: 'rgba(255,255,255,0.1)', color: '#FFF', border: '1px solid rgba(255,255,255,0.2)' }}
            >
              <Printer size={15} /> Print All Statements
            </button>
          </div>
        </div>

        {/* CEO Quick Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style={{ background: '#FFFFFF', padding: '18px', borderRadius: '14px', border: '1px solid #CBD5E1', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Reports Submitted</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0F172A', marginTop: '4px' }}>{submittedReports.length} Reports</div>
          </div>

          <div style={{ background: '#ECFDF5', padding: '18px', borderRadius: '14px', border: '1px solid #A7F3D0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#047857', textTransform: 'uppercase' }}>Verified & Approved</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#047857', marginTop: '4px' }}>{approvedCount} Verified</div>
          </div>

          <div style={{ background: '#EFF6FF', padding: '18px', borderRadius: '14px', border: '1px solid #BFDBFE', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1E40AF', textTransform: 'uppercase' }}>Pending CEO Review</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#1E40AF', marginTop: '4px' }}>{pendingCount} Pending</div>
          </div>
        </div>

        {/* Filter Staff Dropdown */}
        <div style={{ background: '#FFFFFF', padding: '14px 20px', borderRadius: '12px', border: '1px solid #CBD5E1', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={16} style={{ color: '#2563EB' }} />
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0F172A' }}>Filter Staff Reports:</span>
            <select
              value={selectedStaffFilter}
              onChange={e => setSelectedStaffFilter(e.target.value)}
              style={{ padding: '6px 12px', fontSize: '0.8rem', fontWeight: 700, borderRadius: '8px', border: '1px solid #CBD5E1', background: '#F8FAFC' }}
            >
              <option value="ALL">All Staff Members ({submittedReports.length})</option>
              {SYSTEM_USERS.map(u => (
                <option key={u.email} value={u.email}>{u.name} ({u.role})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Individual Staff Reports List */}
        {filteredReports.length === 0 ? (
          <div style={{ background: '#FFFFFF', padding: '40px 20px', borderRadius: '16px', border: '1px dashed #CBD5E1', textAlign: 'center', color: '#64748B' }}>
            No staff report submissions found for this filter.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {filteredReports.map((rep, idx) => (
              <div key={rep.id} style={{ background: '#FFFFFF', borderRadius: '16px', border: '1.5px solid ' + (rep.ceoVerified ? '#A7F3D0' : '#BFDBFE'), padding: '24px', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
                
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px', borderBottom: '1px solid #E2E8F0', paddingBottom: '14px' }}>
                  <div>
                    <span style={{ background: '#0F172A', color: '#FFF', fontSize: '0.7rem', fontWeight: 900, padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
                      Report #{idx + 1}
                    </span>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0F172A', margin: '6px 0 2px 0' }}>
                      {rep.staffName} — {rep.roleDesignation}
                    </h3>
                    <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                      Email: <strong>{rep.userEmail}</strong> | Department: {rep.departmentReportingTo || 'Retail Advisory'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '0.7rem',
                      fontWeight: 900,
                      background: rep.ceoVerified ? '#ECFDF5' : '#EFF6FF',
                      color: rep.ceoVerified ? '#047857' : '#1E40AF',
                      border: '1px solid ' + (rep.ceoVerified ? '#A7F3D0' : '#BFDBFE')
                    }}>
                      {rep.status}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>
                      Week Ending: <strong>{rep.weekEnding}</strong>
                    </span>
                  </div>
                </div>

                {/* Key Achievements */}
                <div style={{ background: '#F8FAFC', padding: '12px 16px', borderRadius: '10px', border: '1px solid #E2E8F0', marginBottom: '16px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0F172A', marginBottom: '4px', textTransform: 'uppercase' }}>
                    🏆 Key Achievements This Week:
                  </div>
                  <div style={{ fontSize: '0.84rem', color: '#334155', lineHeight: 1.5 }}>
                    {rep.keyAchievements}
                  </div>
                </div>

                {/* Assigned CRM Tasks Breakdown */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0F172A', marginBottom: '8px', textTransform: 'uppercase' }}>
                    📋 Assigned CRM Task Updates ({(rep.tasks || []).length} Items):
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                      <thead>
                        <tr style={{ background: '#0F172A', color: '#FFF' }}>
                          <th style={{ padding: '8px 10px', textAlign: 'left' }}>Assigned Project</th>
                          <th style={{ padding: '8px 10px', textAlign: 'left' }}>Task Title</th>
                          <th style={{ padding: '8px 10px', textAlign: 'left' }}>Deadline</th>
                          <th style={{ padding: '8px 10px', textAlign: 'left' }}>Priority</th>
                          <th style={{ padding: '8px 10px', textAlign: 'left' }}>% Done</th>
                          <th style={{ padding: '8px 10px', textAlign: 'left' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(rep.tasks || []).map((t, tIdx) => (
                          <tr key={tIdx} style={{ borderBottom: '1px solid #E2E8F0', background: tIdx % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}>
                            <td style={{ padding: '8px 10px', fontWeight: 800 }}>{t.projectArea}</td>
                            <td style={{ padding: '8px 10px' }}>
                              <strong>{t.taskTitle}</strong>
                              {t.progressThisWeek && <div style={{ fontSize: '0.7rem', color: '#64748B' }}>{t.progressThisWeek}</div>}
                            </td>
                            <td style={{ padding: '8px 10px' }}>{t.deadline}</td>
                            <td style={{ padding: '8px 10px' }}>{t.priorityLevel}</td>
                            <td style={{ padding: '8px 10px', fontWeight: 800 }}>{t.progressPct}%</td>
                            <td style={{ padding: '8px 10px' }}><span style={{ background: '#ECFDF5', color: '#047857', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>{t.taskStatus}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Priorities & Blockers */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ background: '#EFF6FF', padding: '10px 14px', borderRadius: '8px', border: '1px solid #BFDBFE' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#1E40AF' }}>🎯 Top Priority Next Week:</div>
                    <div style={{ fontSize: '0.8rem', color: '#1E293B', marginTop: '2px' }}>{rep.topPriorityNextWeek}</div>
                  </div>

                  <div style={{ background: '#FEF3C7', padding: '10px 14px', borderRadius: '8px', border: '1px solid #FDE68A' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#B45309' }}>📢 Support Needed from CEO:</div>
                    <div style={{ fontSize: '0.8rem', color: '#1E293B', marginTop: '2px' }}>{rep.supportNeededFromCeo || 'None'}</div>
                  </div>
                </div>

                {/* Individual Export & CEO Verification Actions */}
                <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  
                  {/* Export Buttons for CEO */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleExportIndividualWord(rep)}
                      style={{ background: '#0F172A', color: '#FFF', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <FileText size={13} /> Export Word (.doc)
                    </button>
                    <button
                      onClick={() => handleExportIndividualPDF(rep)}
                      style={{ background: '#2563EB', color: '#FFF', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Printer size={13} /> Export {rep.staffName.split(' ')[0]} Report (PDF)
                    </button>
                  </div>

                  {/* CEO Verify Controls */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder="Add CEO feedback note..."
                      value={selectedReportId === rep.id ? ceoFeedbackInput : ''}
                      onChange={e => {
                        setSelectedReportId(rep.id);
                        setCeoFeedbackInput(e.target.value);
                      }}
                      style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.78rem', width: '220px' }}
                    />
                    <button
                      onClick={() => handleCeoVerifyReport(rep.id, 'APPROVE')}
                      style={{ background: '#059669', color: '#FFF', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleCeoVerifyReport(rep.id, 'REVISION')}
                      style={{ background: '#DC2626', color: '#FFF', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                    >
                      Revision
                    </button>
                  </div>

                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    );
  }

  // =========================================================================
  // REGULAR STAFF FRIDAY SUBMISSION FORM VIEW
  // =========================================================================
  return (
    <div style={{ maxWidth: '960px', margin: '24px auto', fontFamily: 'Segoe UI, Arial, sans-serif' }}>
      
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
        borderRadius: '16px',
        padding: '24px 28px',
        color: '#FFFFFF',
        marginBottom: '24px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ background: 'var(--brand-green)', color: '#FFF', fontSize: '0.72rem', fontWeight: 900, padding: '3px 10px', borderRadius: '20px', textTransform: 'uppercase' }}>
              Turning Point Retail Solutions
            </span>
            <span style={{ background: '#2563EB', color: '#FFF', fontSize: '0.72rem', fontWeight: 800, padding: '3px 8px', borderRadius: '4px' }}>
              📅 Friday Submission Window
            </span>
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#FFFFFF', margin: 0 }}>
            Friday Executive Staff Weekly Report
          </h2>
          <p style={{ fontSize: '0.82rem', color: '#94A3B8', margin: '4px 0 0 0' }}>
            Fill out your weekly deliverable report every Friday. Submissions go directly to CEO Walter Dantis.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => setShowPreviewModal(true)}
            className="btn-secondary"
            style={{ padding: '8px 14px', fontSize: '0.8rem', fontWeight: 800, background: 'rgba(255,255,255,0.1)', color: '#FFF', border: '1px solid rgba(255,255,255,0.2)' }}
          >
            <Eye size={15} /> Preview My Reports ({submittedReports.length})
          </button>
          <button 
            onClick={() => window.print()}
            className="btn-secondary"
            style={{ padding: '8px 14px', fontSize: '0.8rem', fontWeight: 800, background: 'rgba(255,255,255,0.1)', color: '#FFF', border: '1px solid rgba(255,255,255,0.2)' }}
          >
            <Printer size={15} /> Print Form
          </button>
        </div>
      </div>

      {/* Main Form Container */}
      <form onSubmit={handleSubmitReportToCeo} style={{ background: '#FFFFFF', borderRadius: '16px', padding: '28px', border: '1px solid #CBD5E1', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
        
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#DC2626', marginBottom: '20px' }}>
          * Required fields
        </div>

        {/* SECTION 1: STAFF DETAILS */}
        <div style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '20px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={18} style={{ color: 'var(--brand-green)' }} /> Staff Details
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
                Full name *
              </label>
              <input 
                type="text" 
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Your full name..."
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
                Role / designation *
              </label>
              <input 
                type="text" 
                required
                value={roleDesignation}
                onChange={e => setRoleDesignation(e.target.value)}
                placeholder="e.g. Project Assignee / Senior Consultant"
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
                Week ending (Saturday) *
              </label>
              <input 
                type="text" 
                required
                value={weekEnding}
                onChange={e => setWeekEnding(e.target.value)}
                placeholder="15-08-2026"
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
                Email address *
              </label>
              <input 
                type="email" 
                required
                value={emailAddress}
                onChange={e => setEmailAddress(e.target.value)}
                placeholder="your.email@turningpointretail.com"
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
                Department / reporting to
              </label>
              <input 
                type="text" 
                value={departmentReportingTo}
                onChange={e => setDepartmentReportingTo(e.target.value)}
                placeholder="e.g. Retail Advisory / CEO Walter Dantis"
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: WEEKLY SUMMARY */}
        <div style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '20px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={18} style={{ color: '#2563EB' }} /> Weekly Summary
          </h3>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
              Key achievements this week *
            </label>
            <textarea 
              rows={3}
              required
              value={keyAchievements}
              onChange={e => setKeyAchievements(e.target.value)}
              placeholder="Highlight key milestones accomplished, contracts signed, client meetings finalized..."
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', lineHeight: '1.5' }}
            />
          </div>
        </div>

        {/* SECTION 3: TASK UPDATES (LIVE CRM ASSIGNED PROJECTS) */}
        <div style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '20px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={18} style={{ color: '#10B981' }} /> Task Updates
              </h3>
              <span style={{ fontSize: '0.72rem', color: '#64748B' }}>Add one entry per project or task area (picked from your assigned live CRM projects)</span>
            </div>

            <button 
              type="button" 
              onClick={handleAddTaskEntry}
              style={{ background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', padding: '6px 12px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Plus size={14} /> Add another task / project
            </button>
          </div>

          {tasks.map((t, idx) => (
            <div key={t.id} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '18px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ background: '#0F172A', color: '#FFF', fontSize: '0.72rem', fontWeight: 900, padding: '3px 8px', borderRadius: '4px' }}>
                  Task / Project #{idx + 1}
                </span>
                {tasks.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => handleRemoveTaskEntry(t.id)}
                    style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer' }}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                    Project / task area *
                  </label>
                  <select 
                    value={t.projectArea}
                    onChange={e => handleUpdateTaskField(t.id, 'projectArea', e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.82rem', fontWeight: 700 }}
                  >
                    <option value="">Select project / area...</option>
                    {availableProjects.map(p => (
                      <option key={p.id} value={p.companyName}>
                        {p.companyName} ({p.sector || 'Advisory'})
                      </option>
                    ))}
                    <option value="General Operations">General Operations</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                    Task title / description *
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Draft MOU for Indu Group"
                    value={t.taskTitle}
                    onChange={e => handleUpdateTaskField(t.id, 'taskTitle', e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                    Deadline *
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder="15-08-2026"
                    value={t.deadline}
                    onChange={e => handleUpdateTaskField(t.id, 'deadline', e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                    Priority level
                  </label>
                  <select 
                    value={t.priorityLevel}
                    onChange={e => handleUpdateTaskField(t.id, 'priorityLevel', e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                    % complete ({t.progressPct}%)
                  </label>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={t.progressPct}
                    onChange={e => handleUpdateTaskField(t.id, 'progressPct', parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--brand-green)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                    Task status *
                  </label>
                  <select 
                    value={t.taskStatus}
                    onChange={e => handleUpdateTaskField(t.id, 'taskStatus', e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.82rem', fontWeight: 800 }}
                  >
                    <option value="On track">On track</option>
                    <option value="At risk">At risk</option>
                    <option value="Delayed">Delayed</option>
                    <option value="Completed">Completed</option>
                    <option value="Blocked">Blocked</option>
                  </select>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                    Progress this week
                  </label>
                  <input 
                    type="text" 
                    placeholder="What was done, what stage is it at, meetings held, documents sent..."
                    value={t.progressThisWeek}
                    onChange={e => handleUpdateTaskField(t.id, 'progressThisWeek', e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                    Next steps / planned actions
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Follow up with Surya by Tuesday, send revised MOU..."
                    value={t.nextSteps}
                    onChange={e => handleUpdateTaskField(t.id, 'nextSteps', e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                    Support needed from CEO for this task
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Approval needed, introduction to partner, decision on pricing..."
                    value={t.supportNeededForTask}
                    onChange={e => handleUpdateTaskField(t.id, 'supportNeededForTask', e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* SECTION 4: PRIORITIES & SUPPORT NEEDED */}
        <div style={{ marginBottom: '28px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} style={{ color: '#F59E0B' }} /> Priorities & Support Needed
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
                Top priority for next week *
              </label>
              <textarea 
                rows={2}
                required
                value={topPriorityNextWeek}
                onChange={e => setTopPriorityNextWeek(e.target.value)}
                placeholder="What is the single most important thing you will focus on next week? Be specific."
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
                Support / resources needed from CEO
              </label>
              <textarea 
                rows={2}
                value={supportNeededFromCeo}
                onChange={e => setSupportNeededFromCeo(e.target.value)}
                placeholder="Any approvals, introductions, decisions, or resources you need from Walter Dantis..."
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
                Blockers, issues or concerns to flag
              </label>
              <textarea 
                rows={2}
                value={blockersOrRisks}
                onChange={e => setBlockersOrRisks(e.target.value)}
                placeholder="Any challenges, risks, or items that need CEO attention or urgent action this week..."
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
                Additional notes or comments
              </label>
              <textarea 
                rows={2}
                value={additionalNotes}
                onChange={e => setAdditionalNotes(e.target.value)}
                placeholder="Anything else the CEO should be aware of, upcoming travel, meetings planned, etc..."
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
              />
            </div>
          </div>
        </div>

        {/* SECTION 5: ACTION BUTTONS */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap', borderTop: '1px solid #E2E8F0', paddingTop: '20px' }}>
          <button 
            type="button" 
            onClick={handleClearForm}
            style={{ padding: '10px 16px', background: '#F1F5F9', color: '#64748B', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RotateCcw size={16} /> Clear
          </button>

          <button 
            type="button" 
            onClick={() => setShowPreviewModal(true)}
            style={{ padding: '10px 18px', background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', borderRadius: '8px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Eye size={16} /> Preview & Generate Report
          </button>

          <button 
            type="submit"
            style={{ padding: '12px 24px', background: '#2563EB', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontWeight: 900, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(37,99,235,0.3)' }}
          >
            <Send size={18} /> 🚀 Sent Directly to CEO
          </button>
        </div>

      </form>

      {/* STAFF PREVIEW MODAL */}
      {showPreviewModal && (
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
          <div className="modal-content" style={{ width: '92%', maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0F172A', margin: 0 }}>
                My Submitted Friday Reports ({submittedReports.length})
              </h3>
              <button onClick={() => setShowPreviewModal(false)} className="btn-secondary" style={{ padding: '4px 10px' }}>
                Close
              </button>
            </div>

            {submittedReports.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B' }}>
                No reports submitted yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {submittedReports.map(rep => (
                  <div key={rep.id} style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '12px', padding: '18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div>
                        <span style={{ fontSize: '0.9rem', fontWeight: 900, color: '#0F172A' }}>{rep.staffName}</span>
                        <span style={{ fontSize: '0.75rem', color: '#64748B', marginLeft: '8px' }}>({rep.roleDesignation})</span>
                      </div>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        background: rep.ceoVerified ? '#ECFDF5' : '#EFF6FF',
                        color: rep.ceoVerified ? '#047857' : '#1E40AF',
                        border: '1px solid ' + (rep.ceoVerified ? '#A7F3D0' : '#BFDBFE')
                      }}>
                        {rep.status}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.78rem', color: '#334155', marginBottom: '8px' }}>
                      <strong>Week Ending:</strong> {rep.weekEnding} | <strong>Submitted:</strong> {new Date(rep.submittedAt).toLocaleDateString()}
                    </div>

                    <div style={{ background: '#FFFFFF', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.8rem', color: '#0F172A', marginBottom: '10px' }}>
                      <strong>Key Achievements:</strong> {rep.keyAchievements}
                    </div>

                    <div style={{ fontSize: '0.78rem', color: '#475569' }}>
                      <strong>Top Priority Next Week:</strong> {rep.topPriorityNextWeek}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
