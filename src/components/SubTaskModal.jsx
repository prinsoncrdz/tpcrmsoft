import React, { useState } from 'react';
import { X, Plus, CheckCircle2, Clock, AlertCircle, ShieldCheck, UserCheck, Send, ArrowRight, Sparkles, MessageSquare, Trash2, Check, RotateCcw } from 'lucide-react';
import { SYSTEM_USERS } from '../services/googleSheets';

export default function SubTaskModal({ project, currentUser, subTasks = [], onSaveSubTasks, onClose }) {
  const [tasks, setTasks] = useState(subTasks);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // New task form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Hotel Booking');
  const [assigneeEmail, setAssigneeEmail] = useState(currentUser?.email || SYSTEM_USERS[0].email);
  const [detail, setDetail] = useState('');
  
  // Submission notes state for assignee submitting to CEO
  const [submittingTaskId, setSubmittingTaskId] = useState(null);
  const [submissionNotes, setSubmissionNotes] = useState('');

  const isCeoOrAdmin = currentUser?.role === 'CEO' || currentUser?.role === 'Admin';

  const categories = [
    'Hotel Booking',
    'Event Logistics',
    'Shipping & Clearance',
    'Venue & Setup',
    'Catering & Refreshments',
    'IT & Technical Support',
    'Document & Permits',
    'Other / Custom'
  ];

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const assignedUser = SYSTEM_USERS.find(u => u.email.toLowerCase() === assigneeEmail.toLowerCase());

    const newTask = {
      id: `st-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: title.trim(),
      category,
      assigneeEmail: assignedUser?.email || assigneeEmail,
      assigneeName: assignedUser?.name || 'Assigned Member',
      detail: detail.trim(),
      status: 'Pending', // Pending | In Progress | Submitted | Approved | Needs Revision
      createdByName: currentUser?.name || 'User',
      createdAt: new Date().toISOString(),
      submittedAt: null,
      submissionNotes: '',
      approvedAt: null,
      approvedByName: null
    };

    const updated = [newTask, ...tasks];
    setTasks(updated);
    onSaveSubTasks(project.id, updated);
    
    // Reset form
    setTitle('');
    setDetail('');
    setShowAddForm(false);
  };

  const handleStatusChange = (taskId, newStatus, extra = {}) => {
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        const item = { ...t, status: newStatus, ...extra };
        if (newStatus === 'Approved') {
          item.approvedAt = new Date().toISOString();
          item.approvedByName = currentUser?.name || 'CEO';
        }
        if (newStatus === 'Submitted') {
          item.submittedAt = new Date().toISOString();
        }
        return item;
      }
      return t;
    });
    setTasks(updated);
    onSaveSubTasks(project.id, updated);
  };

  const handleDeleteTask = (taskId) => {
    const updated = tasks.filter(t => t.id !== taskId);
    setTasks(updated);
    onSaveSubTasks(project.id, updated);
  };

  const handleConfirmSubmitForReview = (taskId) => {
    handleStatusChange(taskId, 'Submitted', { submissionNotes: submissionNotes.trim() });
    setSubmittingTaskId(null);
    setSubmissionNotes('');
  };

  // Aggregation Stats
  const totalCount = tasks.length;
  const approvedCount = tasks.filter(t => t.status === 'Approved').length;
  const submittedCount = tasks.filter(t => t.status === 'Submitted').length;
  const ceoProgressPct = totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 0;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return (
          <span style={{ background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', padding: '3px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle2 size={12} /> Approved by CEO
          </span>
        );
      case 'Submitted':
        return (
          <span style={{ background: '#F3E8FF', color: '#7E22CE', border: '1px solid #D8B4FE', padding: '3px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Sparkles size={12} /> Submitted for CEO Review
          </span>
        );
      case 'Needs Revision':
        return (
          <span style={{ background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FCA5A5', padding: '3px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <AlertCircle size={12} /> Needs Revision
          </span>
        );
      case 'In Progress':
        return (
          <span style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #93C5FD', padding: '3px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={12} /> In Progress
          </span>
        );
      default:
        return (
          <span style={{ background: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1', padding: '3px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={12} /> Pending
          </span>
        );
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 10000 }}>
      <div className="modal-content" style={{ width: '90%', maxWidth: '780px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden', borderRadius: '16px' }}>
        
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', color: '#FFF', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="project-id-badge" style={{ background: '#1E293B', color: 'var(--brand-green)', border: '1px solid var(--brand-green)' }}>
                {project.projectId}
              </span>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>{project.projectName}</h3>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#94A3B8', margin: 0 }}>
              Client: <strong style={{ color: '#E2E8F0' }}>{project.client}</strong> | Sub-Tasks & CEO Approval Manager
            </p>
          </div>
          <button 
            onClick={onClose} 
            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#FFF', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* CEO Work Progress Bar Header */}
        <div style={{ background: '#F8FAFC', padding: '14px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ flex: 1, minWidth: '220px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-main)' }}>
              <span>CEO Progress Approval</span>
              <span style={{ color: 'var(--brand-green)' }}>{approvedCount} / {totalCount} Completed ({ceoProgressPct}%)</span>
            </div>
            <div style={{ height: '8px', width: '100%', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${ceoProgressPct}%`, background: 'linear-gradient(90deg, #10B981, #059669)', transition: 'width 0.3s ease' }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {submittedCount > 0 && (
              <div style={{ background: '#F3E8FF', color: '#7E22CE', padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={14} /> {submittedCount} Pending CEO Review
              </div>
            )}
            <button 
              className="btn-primary" 
              onClick={() => setShowAddForm(!showAddForm)}
              style={{ fontSize: '0.78rem', padding: '6px 14px' }}
            >
              <Plus size={14} /> {showAddForm ? 'Cancel' : 'Add Sub-Task'}
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          
          {/* Add Sub-Task Form */}
          {showAddForm && (
            <form onSubmit={handleAddTask} style={{ background: '#F8FAFC', border: '1.5px solid var(--brand-green)', borderRadius: '12px', padding: '16px', marginBottom: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Plus size={16} style={{ color: 'var(--brand-green)' }} /> Create New Sub-Task
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Category / Type
                  </label>
                  <select 
                    className="cell-input" 
                    value={category} 
                    onChange={e => setCategory(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', fontSize: '0.8rem', background: '#FFF' }}
                  >
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Assign To Team Member
                  </label>
                  <select 
                    className="cell-input" 
                    value={assigneeEmail} 
                    onChange={e => setAssigneeEmail(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', fontSize: '0.8rem', background: '#FFF' }}
                  >
                    {SYSTEM_USERS.map(u => (
                      <option key={u.email} value={u.email}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Sub-Task Title *
                </label>
                <input 
                  type="text"
                  placeholder="e.g., Book 5-star hotel rooms for delegation / Clear customs clearance docs..."
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                  style={{ width: '100%', padding: '8px 10px', fontSize: '0.82rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Assignment Detail & Instructions
                </label>
                <textarea 
                  rows={3}
                  placeholder="Provide specific instructions, target dates, budget, contact details, or reference links..."
                  value={detail}
                  onChange={e => setDetail(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAddForm(false)} style={{ fontSize: '0.78rem', padding: '6px 12px' }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ fontSize: '0.78rem', padding: '6px 16px' }}>
                  <Plus size={14} /> Assign Sub-Task
                </button>
              </div>
            </form>
          )}

          {/* Sub-Task List */}
          {tasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', background: '#F8FAFC', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
              <Clock size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 10px auto' }} />
              <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)' }}>No Sub-Tasks Created Yet</h4>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 14px 0' }}>
                Create sub-tasks for hotel booking, logistics, shipping, venue setup, etc., and assign them to team members.
              </p>
              <button className="btn-primary" onClick={() => setShowAddForm(true)} style={{ fontSize: '0.78rem' }}>
                <Plus size={14} /> Add First Sub-Task
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {tasks.map(task => {
                const assignedUser = SYSTEM_USERS.find(u => u.email.toLowerCase() === task.assigneeEmail?.toLowerCase());
                const isSubmittingThis = submittingTaskId === task.id;

                return (
                  <div 
                    key={task.id} 
                    style={{ 
                      background: '#FFFFFF', 
                      border: '1px solid ' + (task.status === 'Submitted' ? '#D8B4FE' : task.status === 'Approved' ? '#A7F3D0' : 'var(--border-color)'), 
                      borderRadius: '12px', 
                      padding: '16px', 
                      boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {/* Task Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '8px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ background: '#ECFDF5', color: 'var(--brand-green)', fontSize: '0.65rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>
                            {task.category || 'Task'}
                          </span>
                          <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                            {task.title}
                          </h4>
                        </div>

                        {/* Assignee pill */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          <span>Assigned to:</span>
                          {assignedUser ? (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#F1F5F9', padding: '2px 8px', borderRadius: '12px', color: 'var(--text-main)', fontWeight: 600 }}>
                              <img src={assignedUser.avatar} alt={assignedUser.name} style={{ width: '16px', height: '16px', borderRadius: '50%' }} />
                              <span>{assignedUser.name}</span>
                            </div>
                          ) : (
                            <span style={{ fontWeight: 600 }}>{task.assigneeName || task.assigneeEmail}</span>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {getStatusBadge(task.status)}
                        {isCeoOrAdmin && (
                          <button 
                            onClick={() => handleDeleteTask(task.id)}
                            style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px' }}
                            title="Delete Sub-Task"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Assignment Detail & Instructions */}
                    {task.detail && (
                      <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: '8px', borderLeft: '3px solid var(--brand-green)', margin: '10px 0', fontSize: '0.78rem', color: 'var(--text-main)', lineHeight: '1.5' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.68rem', marginBottom: '2px', textTransform: 'uppercase' }}>
                          Assignment Detail & Instructions:
                        </div>
                        {task.detail}
                      </div>
                    )}

                    {/* Submission Notes (if submitted) */}
                    {task.submissionNotes && (
                      <div style={{ background: '#FAF5FF', padding: '8px 12px', borderRadius: '8px', border: '1px solid #E9D5FF', margin: '8px 0', fontSize: '0.75rem', color: '#6B21A8' }}>
                        <strong style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                          <MessageSquare size={12} /> Assignee Submission Notes:
                        </strong>
                        {task.submissionNotes}
                      </div>
                    )}

                    {/* Approval Info */}
                    {task.status === 'Approved' && (
                      <div style={{ fontSize: '0.7rem', color: '#047857', fontWeight: 600, marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <UserCheck size={12} /> Approved by {task.approvedByName || 'CEO'} on {new Date(task.approvedAt).toLocaleDateString()}
                      </div>
                    )}

                    {/* Workflow Actions */}
                    <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      
                      {/* Status toggle for assignee or team */}
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {task.status === 'Pending' && (
                          <button 
                            className="btn-secondary" 
                            onClick={() => handleStatusChange(task.id, 'In Progress')}
                            style={{ fontSize: '0.72rem', padding: '4px 10px' }}
                          >
                            Start Working →
                          </button>
                        )}

                        {/* Assignee / Team member Submit for CEO Review */}
                        {task.status !== 'Approved' && task.status !== 'Submitted' && (
                          <button 
                            className="btn-primary" 
                            onClick={() => setSubmittingTaskId(task.id)}
                            style={{ fontSize: '0.72rem', padding: '4px 12px', background: '#7E22CE', borderColor: '#7E22CE' }}
                          >
                            <Sparkles size={12} /> Submit for CEO Review
                          </button>
                        )}
                      </div>

                      {/* CEO / Admin Exclusive Approval Actions */}
                      {isCeoOrAdmin && (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          {task.status !== 'Approved' ? (
                            <>
                              <button 
                                onClick={() => handleStatusChange(task.id, 'Needs Revision')}
                                style={{ background: '#FEF2F2', color: '#991B1B', border: '1px solid #FCA5A5', borderRadius: '6px', padding: '4px 10px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              >
                                <RotateCcw size={12} /> Needs Revision
                              </button>

                              <button 
                                onClick={() => handleStatusChange(task.id, 'Approved')}
                                style={{ background: '#10B981', color: '#FFFFFF', border: 'none', borderRadius: '6px', padding: '5px 14px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 6px rgba(16,185,129,0.3)' }}
                              >
                                <CheckCircle2 size={14} /> CEO Approve Task
                              </button>
                            </>
                          ) : (
                            <button 
                              onClick={() => handleStatusChange(task.id, 'In Progress')}
                              style={{ background: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '3px 8px', fontSize: '0.68rem', cursor: 'pointer' }}
                            >
                              Re-open Task
                            </button>
                          )}
                        </div>
                      )}

                    </div>

                    {/* Inline Form to add submission notes when clicking Submit for Review */}
                    {isSubmittingThis && (
                      <div style={{ marginTop: '10px', background: '#F3E8FF', padding: '12px', borderRadius: '8px', border: '1px solid #D8B4FE' }}>
                        <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6B21A8', display: 'block', marginBottom: '4px' }}>
                          Add Completion Notes / Proof for CEO:
                        </label>
                        <input 
                          type="text" 
                          placeholder="e.g. Hotel reservation #1094 confirmed, confirmation PDF uploaded to Drive folder."
                          value={submissionNotes}
                          onChange={e => setSubmissionNotes(e.target.value)}
                          style={{ width: '100%', padding: '6px 10px', fontSize: '0.78rem', borderRadius: '6px', border: '1px solid #C084FC', marginBottom: '8px' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                          <button className="btn-secondary" onClick={() => setSubmittingTaskId(null)} style={{ fontSize: '0.72rem', padding: '4px 8px' }}>
                            Cancel
                          </button>
                          <button 
                            className="btn-primary" 
                            onClick={() => handleConfirmSubmitForReview(task.id)}
                            style={{ fontSize: '0.72rem', padding: '4px 12px', background: '#7E22CE' }}
                          >
                            <Send size={12} /> Confirm & Submit to CEO
                          </button>
                        </div>
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* Footer */}
        <div style={{ background: '#F8FAFC', padding: '12px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            💡 Sub-tasks automatically update overall CEO progress and project completion.
          </span>
          <button className="btn-secondary" onClick={onClose} style={{ fontSize: '0.78rem' }}>
            Done / Close
          </button>
        </div>

      </div>
    </div>
  );
}
