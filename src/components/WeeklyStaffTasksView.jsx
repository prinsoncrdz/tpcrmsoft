import React, { useState, useEffect } from 'react';
import { Calendar, Plus, CheckCircle2, Clock, AlertCircle, Send, FileText, Printer, User, Building, Sparkles, ShieldCheck, Filter, X, Trash2, Check } from 'lucide-react';
import { SYSTEM_USERS, DEPLOYED_GAS_URL } from '../services/googleSheets';
import { createNotification } from '../services/notifications';

const WEEKLY_TASKS_STORAGE_KEY = 'tp_crm_weekly_staff_tasks_v1';

export default function WeeklyStaffTasksView({ currentUser, projects = [] }) {
  const isCeoOrAdmin = currentUser?.role === 'CEO' || 
                       currentUser?.role === 'Admin' || 
                       currentUser?.name?.toLowerCase().includes('walter') || 
                       currentUser?.role?.toLowerCase().includes('ceo');

  const weeksList = [
    { id: 'W1_AUG_2026', label: 'Week 1 (Aug 1 - Aug 7, 2026)' },
    { id: 'W2_AUG_2026', label: 'Week 2 (Aug 8 - Aug 14, 2026)' },
    { id: 'W3_AUG_2026', label: 'Week 3 (Aug 15 - Aug 21, 2026)' },
    { id: 'W4_AUG_2026', label: 'Week 4 (Aug 22 - Aug 31, 2026)' }
  ];

  const daysList = ['ALL', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const [selectedWeek, setSelectedWeek] = useState('W2_AUG_2026');
  const [selectedDay, setSelectedDay] = useState('ALL');
  const [selectedUserEmail, setSelectedUserEmail] = useState(currentUser?.email || SYSTEM_USERS[0].email);

  const [weeklyTasks, setWeeklyTasks] = useState(() => {
    try {
      const saved = localStorage.getItem(WEEKLY_TASKS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (err) {
      console.error(err);
    }
    return [
      {
        id: 'wt-101',
        weekId: 'W2_AUG_2026',
        dayOfWeek: 'Monday',
        userEmail: 'prinson@turningpointretail.com',
        userName: 'Prinson Cardozo',
        projectTitle: 'Cambodia Retail Ventures Co., Ltd',
        title: 'Business Registration Document Verification',
        details: 'Submitted tax TIN registration papers to the Ministry of Commerce & verified Phnom Penh Morgan Towers office lease contract.',
        hoursSpent: 8,
        status: 'Approved',
        submittedToCeo: true,
        submissionNotes: 'All document copies submitted to MOC portal.',
        ceoFeedback: 'Verified & Approved by CEO Walter Dantis.',
        updatedAt: new Date().toISOString()
      }
    ];
  });

  // Cloud fetch
  useEffect(() => {
    let isMounted = true;
    const fetchCloudWeeklyTasks = async () => {
      try {
        const res = await fetch(`${DEPLOYED_GAS_URL}?action=getNotifications&t=${Date.now()}`);
      } catch (err) {}
    };
    fetchCloudWeeklyTasks();
  }, []);

  // New task form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [selectedProject, setSelectedProject] = useState(projects[0]?.companyName || 'General Operations');
  const [assignedStaffEmail, setAssignedStaffEmail] = useState(currentUser?.email || SYSTEM_USERS[0].email);
  const [targetDay, setTargetDay] = useState('Monday');
  const [hoursSpent, setHoursSpent] = useState(8);
  const [taskStatus, setTaskStatus] = useState('Pending'); // Pending | In Progress | Submitted | Approved | Needs Revision
  const [taskDetails, setTaskDetails] = useState('');

  // Submission / CEO Verification state
  const [submittingTaskId, setSubmittingTaskId] = useState(null);
  const [submissionNotesInput, setSubmissionNotesInput] = useState('');

  const saveWeeklyTasks = (updated) => {
    setWeeklyTasks(updated);
    localStorage.setItem(WEEKLY_TASKS_STORAGE_KEY, JSON.stringify(updated));
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    const assignedUser = SYSTEM_USERS.find(u => u.email.toLowerCase() === assignedStaffEmail.toLowerCase()) || { name: 'Staff Member', email: assignedStaffEmail };

    const newTask = {
      id: `wt-${Date.now()}`,
      weekId: selectedWeek,
      dayOfWeek: targetDay,
      userEmail: assignedUser.email.toLowerCase(),
      userName: assignedUser.name,
      projectTitle: selectedProject,
      title: taskTitle.trim(),
      details: taskDetails.trim(),
      hoursSpent: parseFloat(hoursSpent || 0),
      status: taskStatus,
      submittedToCeo: false,
      submissionNotes: '',
      ceoFeedback: '',
      updatedAt: new Date().toISOString()
    };

    const updated = [newTask, ...weeklyTasks];
    saveWeeklyTasks(updated);
    setShowAddModal(false);
    setTaskTitle('');
    setTaskDetails('');

    // Notify staff member if assigned by CEO/Admin
    createNotification({
      recipientEmail: assignedUser.email,
      title: `📅 New Weekly Task Assigned for ${targetDay}`,
      message: `${currentUser?.name} assigned you "${taskTitle.trim()}" for ${targetDay} in ${selectedWeek}. Details: ${taskDetails.trim() || 'Check dashboard for instructions.'}`,
      type: 'ASSIGNMENT',
      createdByName: currentUser?.name
    });
  };

  const handleDeleteTask = (id) => {
    if (!window.confirm('Are you sure you want to delete this weekly deliverable task?')) return;
    const updated = weeklyTasks.filter(t => t.id !== id);
    saveWeeklyTasks(updated);
  };

  // Staff Submits Task to CEO for Verification
  const handleConfirmSubmitTask = (e) => {
    e.preventDefault();
    if (!submittingTaskId) return;

    const updated = weeklyTasks.map(t => {
      if (t.id === submittingTaskId) {
        return {
          ...t,
          status: 'Submitted',
          submittedToCeo: true,
          submissionNotes: submissionNotesInput.trim(),
          updatedAt: new Date().toISOString()
        };
      }
      return t;
    });

    saveWeeklyTasks(updated);
    setSubmittingTaskId(null);
    setSubmissionNotesInput('');

    // Notify CEO & Admin for verification
    ['walterdantis@turningpointretail.com', 'admin@turningpointretail.com'].forEach(ceoEmail => {
      createNotification({
        recipientEmail: ceoEmail,
        title: `⚡ Weekly Task Submitted for CEO Verification`,
        message: `${currentUser?.name} completed and submitted weekly task "${weeklyTasks.find(t => t.id === submittingTaskId)?.title}" for CEO verification!`,
        type: 'SUBMISSION',
        createdByName: currentUser?.name
      });
    });

    alert('✅ Task submitted to CEO Walter Dantis for verification!');
  };

  // CEO Approves Task
  const handleApproveTaskByCeo = (task) => {
    const updated = weeklyTasks.map(t => {
      if (t.id === task.id) {
        return {
          ...t,
          status: 'Approved',
          ceoFeedback: 'Verified & Approved by CEO Walter Dantis',
          approvedAt: new Date().toISOString(),
          approvedByName: currentUser?.name || 'Walter Dantis (CEO)',
          updatedAt: new Date().toISOString()
        };
      }
      return t;
    });

    saveWeeklyTasks(updated);

    // Notify assigned staff
    createNotification({
      recipientEmail: task.userEmail,
      title: `🎉 CEO Approved Your Weekly Task!`,
      message: `CEO Walter Dantis verified & approved your weekly task "${task.title}". Great job!`,
      type: 'APPROVAL',
      createdByName: currentUser?.name
    });
  };

  // CEO Requests Revision
  const handleRejectTaskByCeo = (task) => {
    const reason = prompt(`Provide revision instructions for ${task.userName} on "${task.title}":`, 'Please review deliverable details and update attachments.');
    if (!reason) return;

    const updated = weeklyTasks.map(t => {
      if (t.id === task.id) {
        return {
          ...t,
          status: 'Needs Revision',
          ceoFeedback: reason.trim(),
          updatedAt: new Date().toISOString()
        };
      }
      return t;
    });

    saveWeeklyTasks(updated);

    // Notify assigned staff
    createNotification({
      recipientEmail: task.userEmail,
      title: `⚠️ CEO Requested Revision on Weekly Task`,
      message: `CEO Walter Dantis requested revision on "${task.title}". Feedback: "${reason.trim()}"`,
      type: 'REVISION',
      createdByName: currentUser?.name
    });
  };

  const handleSubmitWeeklyReport = () => {
    const userWeekTasks = weeklyTasks.filter(t => t.weekId === selectedWeek && t.userEmail.toLowerCase() === (currentUser?.email || selectedUserEmail).toLowerCase());
    if (userWeekTasks.length === 0) {
      alert('Please add at least one task before submitting your weekly report!');
      return;
    }

    const updated = weeklyTasks.map(t => {
      if (t.weekId === selectedWeek && t.userEmail.toLowerCase() === (currentUser?.email || selectedUserEmail).toLowerCase()) {
        return { ...t, submittedToCeo: true, updatedAt: new Date().toISOString() };
      }
      return t;
    });

    saveWeeklyTasks(updated);

    // Notify CEO & Admin
    ['walterdantis@turningpointretail.com', 'admin@turningpointretail.com'].forEach(ceoEmail => {
      createNotification({
        recipientEmail: ceoEmail,
        title: `📅 Weekly Staff Report Submitted by ${currentUser?.name}`,
        message: `${currentUser?.name} submitted weekly tasks report for ${weeksList.find(w => w.id === selectedWeek)?.label}. Total Tasks: ${userWeekTasks.length}`,
        type: 'SUBMISSION',
        createdByName: currentUser?.name
      });
    });

    alert('✅ Your Weekly Tasks Report has been submitted successfully to CEO Walter Dantis!');
  };

  const handlePrintPDF = () => {
    const origTitle = document.title;
    document.title = `Weekly Staff Tasks Report - ${currentUser?.name} (${selectedWeek})`;
    window.print();
    setTimeout(() => { document.title = origTitle; }, 1000);
  };

  // Filter tasks
  const filteredTasks = weeklyTasks.filter(t => {
    const matchesWeek = t.weekId === selectedWeek;
    const matchesUser = isCeoOrAdmin ? (t.userEmail.toLowerCase() === selectedUserEmail.toLowerCase() || selectedUserEmail === 'ALL') : (t.userEmail.toLowerCase() === currentUser?.email?.toLowerCase());
    return matchesWeek && matchesUser;
  });

  const totalHours = filteredTasks.reduce((sum, t) => sum + (parseFloat(t.hoursSpent || 0)), 0);
  const completedCount = filteredTasks.filter(t => t.status === 'Completed').length;

  return (
    <div style={{ padding: '24px 0' }}>
      
      {/* Header Banner */}
      <div style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', borderRadius: '16px', padding: '24px 28px', color: '#FFFFFF', marginBottom: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ background: 'var(--brand-green)', color: '#FFF', fontSize: '0.72rem', fontWeight: 800, padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
              Weekly Staff Tasks & Submission Portal
            </span>
            <span style={{ background: '#3B82F6', color: '#FFF', fontSize: '0.72rem', fontWeight: 800, padding: '3px 8px', borderRadius: '4px' }}>
              ⏰ Schedule: Monday – Friday (8:00 AM – 5:00 PM)
            </span>
            <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>Live Cloud Sync</span>
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#FFFFFF', margin: 0 }}>Weekly Staff Tasks & Deliverables Report</h2>
          <p style={{ fontSize: '0.82rem', color: '#94A3B8', margin: '4px 0 0 0' }}>
            Official working hours: 8:00 AM – 5:00 PM (Monday to Friday). Assign daily tasks, log deliverables, and submit to CEO Walter Dantis for approval.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={handlePrintPDF}
            className="btn-secondary"
            style={{ padding: '10px 16px', fontSize: '0.82rem', fontWeight: 800, background: 'rgba(255,255,255,0.1)', color: '#FFF', border: '1px solid rgba(255,255,255,0.2)' }}
          >
            <Printer size={15} /> Print / Export PDF
          </button>

          <button 
            onClick={() => setShowAddModal(true)}
            className="btn-primary"
            style={{ padding: '10px 20px', fontSize: '0.88rem', fontWeight: 800, background: 'var(--brand-green)', borderColor: 'var(--brand-green)', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}
          >
            <Plus size={16} /> Add Weekly Task
          </button>
        </div>
      </div>

      {/* Week & Day Selector Bar */}
      <div style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '16px 20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={18} style={{ color: 'var(--brand-green)' }} />
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0F172A' }}>Week:</span>
          </div>
          <select 
            value={selectedWeek} 
            onChange={e => setSelectedWeek(e.target.value)}
            style={{ padding: '8px 12px', fontSize: '0.82rem', fontWeight: 700, borderRadius: '8px', border: '1px solid var(--border-color)', background: '#F8FAFC', color: '#0F172A' }}
          >
            {weeksList.map(w => (
              <option key={w.id} value={w.id}>{w.label}</option>
            ))}
          </select>

          {/* Day of Week Selector */}
          <div style={{ display: 'flex', gap: '4px', background: '#F1F5F9', padding: '3px', borderRadius: '8px', flexWrap: 'wrap' }}>
            {daysList.map(day => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                style={{
                  background: selectedDay === day ? '#FFFFFF' : 'transparent',
                  color: selectedDay === day ? '#0F172A' : '#64748B',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '5px 10px',
                  fontSize: '0.75rem',
                  fontWeight: selectedDay === day ? 800 : 600,
                  cursor: 'pointer',
                  boxShadow: selectedDay === day ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                {day}
              </button>
            ))}
          </div>

          {isCeoOrAdmin && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '8px' }}>
              <User size={18} style={{ color: '#2563EB' }} />
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0F172A' }}>Filter Staff:</span>
              <select 
                value={selectedUserEmail} 
                onChange={e => setSelectedUserEmail(e.target.value)}
                style={{ padding: '8px 12px', fontSize: '0.82rem', fontWeight: 700, borderRadius: '8px', border: '1px solid var(--border-color)', background: '#F8FAFC', color: '#0F172A' }}
              >
                <option value="ALL">All Staff Members</option>
                {SYSTEM_USERS.map(u => (
                  <option key={u.email} value={u.email}>{u.name} ({u.role})</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-icon blue"><Calendar /></div>
          <div className="stat-details">
            <span className="stat-value">{filteredTasks.length}</span>
            <span className="stat-label">Total Weekly Tasks</span>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #10B981', background: '#ECFDF5' }}>
          <div className="stat-icon emerald"><CheckCircle2 /></div>
          <div className="stat-details">
            <span className="stat-value" style={{ color: '#047857' }}>{completedCount} / {filteredTasks.length}</span>
            <span className="stat-label" style={{ color: '#065F46', fontWeight: 600 }}>Completed Deliverables</span>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #3B82F6', background: '#EFF6FF' }}>
          <div className="stat-icon blue"><Clock /></div>
          <div className="stat-details">
            <span className="stat-value" style={{ color: '#1E40AF' }}>{totalHours} / 40.0 Hrs</span>
            <span className="stat-label" style={{ color: '#1E3A8A', fontWeight: 600 }}>Weekly Work Hours (Mon–Fri 8AM–5PM)</span>
          </div>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="printable-invoice-paper" style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
            Weekly Deliverables List ({weeksList.find(w => w.id === selectedWeek)?.label})
          </h3>
        </div>

        {filteredTasks.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748B', fontSize: '0.85rem' }}>
            No weekly tasks recorded for this period yet. Click <strong>"+ Add Weekly Task"</strong> above to add deliverables!
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ background: '#0F172A', color: '#FFFFFF', textTransform: 'uppercase', textAlign: 'left' }}>
                <th style={{ padding: '10px 12px', width: '40px' }}>No</th>
                <th style={{ padding: '10px 12px', width: '100px' }}>Schedule Day</th>
                <th style={{ padding: '10px 12px' }}>Task Scope & Deliverable Details</th>
                <th style={{ padding: '10px 12px' }}>Related Project</th>
                <th style={{ padding: '10px 12px' }}>Assigned Staff</th>
                <th style={{ padding: '10px 12px', textAlign: 'center', width: '90px' }}>Hours Logged</th>
                <th style={{ padding: '10px 12px', textAlign: 'center', width: '130px' }}>Status</th>
                <th style={{ padding: '10px 12px', textAlign: 'center', width: '160px' }}>CEO Verification</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((t, idx) => (
                <tr key={t.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <td style={{ padding: '12px', fontWeight: 700, color: '#64748B' }}>{idx + 1}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ background: '#EFF6FF', color: '#1E40AF', padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800 }}>
                      {t.dayOfWeek || 'Monday'}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.88rem', marginBottom: '2px' }}>{t.title}</div>
                    {t.details && <div style={{ fontSize: '0.78rem', color: '#475569', lineHeight: '1.4' }}>{t.details}</div>}
                    {t.submissionNotes && (
                      <div style={{ fontSize: '0.72rem', color: '#2563EB', background: '#EFF6FF', padding: '4px 8px', borderRadius: '4px', marginTop: '4px' }}>
                        💬 <strong>Staff Notes:</strong> {t.submissionNotes}
                      </div>
                    )}
                    {t.ceoFeedback && (
                      <div style={{ fontSize: '0.72rem', color: t.status === 'Approved' ? '#047857' : '#B45309', background: t.status === 'Approved' ? '#ECFDF5' : '#FFFBEB', padding: '4px 8px', borderRadius: '4px', marginTop: '4px' }}>
                        📢 <strong>CEO Feedback:</strong> {t.ceoFeedback}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '12px', fontWeight: 600, color: '#334155' }}>{t.projectTitle || 'General Operations'}</td>
                  <td style={{ padding: '12px', fontWeight: 700, color: '#0F172A' }}>{t.userName}</td>
                  <td style={{ padding: '12px', textAlign: 'center', fontWeight: 800, color: '#2563EB' }}>{t.hoursSpent} hrs</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <span style={{
                      background: t.status === 'Approved' ? '#ECFDF5' : t.status === 'Submitted' ? '#EFF6FF' : t.status === 'Needs Revision' ? '#FEF2F2' : '#FFFBEB',
                      color: t.status === 'Approved' ? '#047857' : t.status === 'Submitted' ? '#1E40AF' : t.status === 'Needs Revision' ? '#DC2626' : '#B45309',
                      border: '1px solid ' + (t.status === 'Approved' ? '#A7F3D0' : t.status === 'Submitted' ? '#BFDBFE' : t.status === 'Needs Revision' ? '#FECACA' : '#FDE68A'),
                      borderRadius: '12px',
                      padding: '4px 10px',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      {t.status === 'Approved' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                      {t.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      {/* Staff Submit Button */}
                      {t.status !== 'Approved' && t.status !== 'Submitted' && (
                        <button
                          onClick={() => setSubmittingTaskId(t.id)}
                          style={{ background: '#2563EB', color: '#FFF', border: 'none', borderRadius: '6px', padding: '4px 8px', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                          title="Submit Task to CEO for Verification"
                        >
                          <Send size={11} /> Submit
                        </button>
                      )}

                      {/* CEO Verification & Approval Buttons */}
                      {isCeoOrAdmin && t.status !== 'Approved' && (
                        <>
                          <button
                            onClick={() => handleApproveTaskByCeo(t)}
                            style={{ background: '#10B981', color: '#FFF', border: 'none', borderRadius: '6px', padding: '4px 8px', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                            title="CEO Verify & Approve Task"
                          >
                            <Check size={11} /> Approve
                          </button>
                          <button
                            onClick={() => handleRejectTaskByCeo(t)}
                            style={{ background: '#F59E0B', color: '#FFF', border: 'none', borderRadius: '6px', padding: '4px 8px', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                            title="Request Revision"
                          >
                            <AlertCircle size={11} /> Revision
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => handleDeleteTask(t.id)}
                        style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px' }}
                        title="Delete Task"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

      </div>

      {/* Add Weekly Task Modal */}
      {showAddModal && (
        <div className="modal-overlay" style={{ zIndex: 100000 }}>
          <div className="modal-content" style={{ maxWidth: '540px', padding: '24px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>Assign Weekly Deliverable Task</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleAddTask}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '4px' }}>Task Title *</label>
                <input 
                  type="text" 
                  placeholder="e.g. Verify Ministry of Commerce License Application" 
                  value={taskTitle} 
                  onChange={e => setTaskTitle(e.target.value)} 
                  required 
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }} 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '4px' }}>Assign To Staff Member *</label>
                  <select 
                    value={assignedStaffEmail} 
                    onChange={e => setAssignedStaffEmail(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.82rem', fontWeight: 700 }}
                  >
                    {SYSTEM_USERS.map(u => (
                      <option key={u.email} value={u.email}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '4px' }}>Day of Week *</label>
                  <select 
                    value={targetDay} 
                    onChange={e => setTargetDay(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.82rem', fontWeight: 700 }}
                  >
                    {daysList.filter(d => d !== 'ALL').map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '4px' }}>Related Project</label>
                  <select 
                    value={selectedProject} 
                    onChange={e => setSelectedProject(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.82rem' }}
                  >
                    <option value="General Operations">General Operations</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.companyName || p.projectName}>{p.companyName || p.projectName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '4px' }}>Hours Logged</label>
                  <input 
                    type="number" 
                    step="0.5" 
                    value={hoursSpent} 
                    onChange={e => setHoursSpent(e.target.value)} 
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }} 
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '4px' }}>Task Scope & Instructions</label>
                <textarea 
                  rows="3" 
                  placeholder="Provide detailed instructions or deliverable notes for the assigned staff member..." 
                  value={taskDetails} 
                  onChange={e => setTaskDetails(e.target.value)} 
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.82rem' }} 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ background: 'var(--brand-green)' }}>Assign Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Staff Submit Task Modal */}
      {submittingTaskId && (
        <div className="modal-overlay" style={{ zIndex: 100000 }}>
          <div className="modal-content" style={{ maxWidth: '480px', padding: '24px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>Submit Work to CEO Walter Dantis</h3>
              <button onClick={() => setSubmittingTaskId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleConfirmSubmitTask}>
              <p style={{ fontSize: '0.82rem', color: '#475569', marginBottom: '14px' }}>
                You are submitting <strong>"{weeklyTasks.find(t => t.id === submittingTaskId)?.title}"</strong> to CEO Walter Dantis for verification and approval.
              </p>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '4px' }}>Submission Notes / Deliverable Links *</label>
                <textarea 
                  rows="3" 
                  placeholder="Provide completion summary or document links for CEO verification..." 
                  value={submissionNotesInput} 
                  onChange={e => setSubmissionNotesInput(e.target.value)} 
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.82rem' }} 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn-secondary" onClick={() => setSubmittingTaskId(null)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ background: '#2563EB' }}>🚀 Submit to CEO</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
