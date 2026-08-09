import React, { useState, useEffect } from 'react';
import { Search, Plus, Download, RefreshCw, ExternalLink, Edit2, AlertCircle, CheckCircle2, Clock, ShieldAlert, Sparkles, UserCheck, Lock, ListTodo, CheckSquare, DollarSign, TrendingUp, TrendingDown, Receipt, Building, Building2 } from 'lucide-react';
import { SYSTEM_USERS, fetchGlobalSubTasks, saveGlobalSubTasks } from '../services/googleSheets';
import SubTaskModal from './SubTaskModal';
import ProjectFinancialsModal from './ProjectFinancialsModal';
import ProjectDetailsModal from './ProjectDetailsModal';

const SUBTASKS_STORAGE_KEY = 'tp_crm_subtasks_v2';
const FINANCIALS_STORAGE_KEY = 'tp_crm_project_financials_v1';

export default function ProjectTable({ projects, currentUser, onCellEdit, onOpenNewProjectModal, onRefresh, onDeleteProject }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState('ALL');
  const [editingCell, setEditingCell] = useState(null); // { id, field }
  const [editValue, setEditValue] = useState('');

  // Status Change Reason Modal state (for Cancelled or On Hold)
  const [statusReasonModal, setStatusReasonModal] = useState(null); // { project, newStatus }
  const [reasonInput, setReasonInput] = useState('');

  // CEO Project Deletion QR Code 2FA Mobile Security Modal state
  const [ceoDeleteModal, setCeoDeleteModal] = useState(null); // { project, otpPin }
  const [deleteReasonInput, setDeleteReasonInput] = useState('');
  const [deleteOtpPinInput, setDeleteOtpPinInput] = useState('');

  // Project details sheet modal state
  const [detailsProject, setDetailsProject] = useState(null);

  // Sub-task modal state
  const [subTaskProject, setSubTaskProject] = useState(null);
  const [subTasksMap, setSubTasksMap] = useState(() => {
    const saved = localStorage.getItem(SUBTASKS_STORAGE_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch (err) { return {}; }
    }
    return {};
  });

  // Financials modal state
  const [financialsProject, setFinancialsProject] = useState(null);
  const [financialsMap, setFinancialsMap] = useState(() => {
    const saved = localStorage.getItem(FINANCIALS_STORAGE_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch (err) { return {}; }
    }
    return {};
  });

  const saveProjectFinancials = (projectId, data) => {
    const updatedMap = { ...financialsMap, [projectId]: data };
    setFinancialsMap(updatedMap);
    localStorage.setItem(FINANCIALS_STORAGE_KEY, JSON.stringify(updatedMap));
  };

  // Global Cloud Sub-Tasks Sync with functional state updater (prevents stale closure overwrites)
  const loadCloudSubTasks = async () => {
    const cloudMap = await fetchGlobalSubTasks();
    if (cloudMap && typeof cloudMap === 'object' && Object.keys(cloudMap).length > 0) {
      setSubTasksMap(prevMap => {
        const mergedMap = { ...prevMap, ...cloudMap };
        localStorage.setItem(SUBTASKS_STORAGE_KEY, JSON.stringify(mergedMap));
        return mergedMap;
      });
    }
  };

  useEffect(() => {
    loadCloudSubTasks();
    const interval = setInterval(loadCloudSubTasks, 3000);
    return () => clearInterval(interval);
  }, []);

  const saveSubTasks = (projectId, tasks) => {
    setSubTasksMap(prevMap => {
      const updatedMap = { ...prevMap, [projectId]: tasks };
      localStorage.setItem(SUBTASKS_STORAGE_KEY, JSON.stringify(updatedMap));
      // Save to Cloud Endpoint for cross-device sync
      saveGlobalSubTasks(null, projectId, tasks);
      return updatedMap;
    });

    // Calculate percentage of approved tasks for this project
    const projectObj = projects.find(p => p.id === projectId);
    if (projectObj && tasks.length > 0) {
      const approvedCount = tasks.filter(t => t.status === 'Approved').length;
      const calcPct = `${Math.round((approvedCount / tasks.length) * 100)}%`;
      
      // Auto-update % Complete cell in Google Sheet CRM
      onCellEdit(projectObj, 'completion', 9, calcPct);

      // If 100% approved, auto-update status to Completed
      if (approvedCount === tasks.length) {
        onCellEdit(projectObj, 'status', 10, 'Completed');
      }
    }
  };

  // Calculate overall CEO Work Progress % across ALL projects & sub-tasks
  const allSubTasks = Object.values(subTasksMap).flat();
  const totalSubTasksCount = allSubTasks.length;
  const approvedSubTasksCount = allSubTasks.filter(t => t.status === 'Approved').length;
  const pendingReviewSubTasksCount = allSubTasks.filter(t => t.status === 'Submitted').length;
  const globalCeoProgressPct = totalSubTasksCount > 0 ? Math.round((approvedSubTasksCount / totalSubTasksCount) * 100) : 0;

  // Calculate Portfolio Financials for CEO
  const totalPortfolioRevenue = Object.values(financialsMap).reduce((sum, item) => sum + (parseFloat(item.revenue) || 0), 0);
  const totalPortfolioSpent = Object.values(financialsMap).reduce((sum, item) => {
    const itemSpent = (item.expenses || []).reduce((expSum, e) => expSum + (parseFloat(e.amount) || 0), 0);
    return sum + itemSpent;
  }, 0);
  const netPortfolioProfit = totalPortfolioRevenue - totalPortfolioSpent;

  const formatShortCurrency = (val) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  const [assignmentFilter, setAssignmentFilter] = useState('ALL'); // 'ALL' | 'MINE' | 'REVIEW'

  const sectors = ['ALL', 'HEALTHCARE', 'RETAIL & FRANCHISE', 'TECHNOLOGY & INNOVATION', 'EDUCATION', 'TRADING & DISTRIBUTION', 'CONSULTING'];

  const handleSaveStatusReason = (e) => {
    e.preventDefault();
    if (!statusReasonModal || !reasonInput.trim()) return;

    const { project, newStatus } = statusReasonModal;
    
    // Update status column (10)
    onCellEdit(project, 'status', 10, newStatus);

    // Append reason to statusUpdate column (12)
    const formattedReason = `[${newStatus.toUpperCase()} REASON]: ${reasonInput.trim()}`;
    const newUpdateNote = project.statusUpdate ? `${formattedReason} | ${project.statusUpdate}` : formattedReason;
    onCellEdit(project, 'statusUpdate', 12, newUpdateNote);

    setStatusReasonModal(null);
    setReasonInput('');
  };

  const openCeoDeleteModal = (project) => {
    const generatedPin = Math.floor(100000 + Math.random() * 900000).toString();
    setCeoDeleteModal({ project, otpPin: generatedPin });
    setDeleteReasonInput('');
    setDeleteOtpPinInput('');
  };

  const handleConfirmCeoDeleteProject = (e) => {
    e.preventDefault();
    if (!ceoDeleteModal) return;

    if (!deleteReasonInput.trim()) {
      alert('Please state the official reason for deleting this project.');
      return;
    }

    const cleanInputPin = deleteOtpPinInput.replace(/\D/g, '');
    if (cleanInputPin !== ceoDeleteModal.otpPin) {
      alert(`🔒 QR Code Mobile 2FA Mismatch!\n\nPlease scan the QR code on your phone and enter the 6-digit unique security PIN displayed on screen (${ceoDeleteModal.otpPin}).`);
      return;
    }

    if (onDeleteProject) {
      onDeleteProject(ceoDeleteModal.project.id, deleteReasonInput.trim());
    }

    setCeoDeleteModal(null);
    setDeleteReasonInput('');
    setDeleteOtpPinInput('');
  };

  // Role-Based Field Edit & Deletion Permissions
  const isCeo = currentUser?.role === 'CEO' || (currentUser?.name || '').toLowerCase().includes('walter') || (currentUser?.role || '').toLowerCase().includes('ceo');
  const canEditAllFields = currentUser?.role === 'CEO' || currentUser?.role === 'Admin' || isCeo;
  const canDeleteProject = canEditAllFields; // Delete button is active for CEO/Admin and protected by the 2-Question Security Protocol Modal
  const canEditProgressUpdate = true; // Everyone assigned can edit Progress Update

  // Filter projects by search query, sector tab, and assignment tab
  const filteredProjects = projects.filter(p => {
    const matchesSearch = (
      p.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.projectId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.assignee.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const matchesSector = selectedSector === 'ALL' || (p.sector && p.sector.toUpperCase().includes(selectedSector));

    // Check if user is assigned to project OR any of its sub-tasks (match by name or email)
    const pSubTasks = subTasksMap[p.id] || [];
    const uEmail = (currentUser?.email || '').toLowerCase();
    const uName = (currentUser?.name || '').toLowerCase();

    const isAssignedToUser = 
      p.assignee.toLowerCase().includes(uName) ||
      p.owner.toLowerCase().includes(uName) ||
      pSubTasks.some(st => 
        (st.assigneeEmail && st.assigneeEmail.toLowerCase() === uEmail) ||
        (st.assigneeName && st.assigneeName.toLowerCase().includes(uName))
      );

    const hasPendingReview = pSubTasks.some(st => st.status === 'Submitted');

    let matchesAssignment = true;
    if (assignmentFilter === 'MINE') matchesAssignment = isAssignedToUser;
    if (assignmentFilter === 'REVIEW') matchesAssignment = hasPendingReview;

    return matchesSearch && matchesSector && matchesAssignment;
  });

  const handleStartEdit = (project, field, currentValue, requiresAdmin = false) => {
    if (requiresAdmin && !canEditAllFields) {
      return; // Block team member editing protected fields
    }
    setEditingCell({ id: project.id, field, rowIndex: project.rowIndex });
    setEditValue(currentValue);
  };

  const handleSaveEdit = (project, field, colIndex) => {
    if (editValue !== undefined && editValue !== null) {
      onCellEdit(project, field, colIndex, editValue);
    }
    setEditingCell(null);
  };

  const handleKeyDown = (e, project, field, colIndex) => {
    if (e.key === 'Enter') {
      handleSaveEdit(project, field, colIndex);
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  // Export visible projects to CSV
  const handleExportCSV = () => {
    const headers = ['Project ID', 'Project Name', 'Client', 'Sector', 'Owner', 'Assignee', 'Start Date', 'End Date', '% Complete', 'Status', 'Priority', 'Progress Update', 'Drive Link'];
    const rows = filteredProjects.map(p => [
      p.projectId, p.projectName, p.client, p.sector, p.owner, p.assignee, p.startDate, p.targetEndDate, p.completion, p.status, p.priority, p.statusUpdate, p.driveLink
    ]);
    
    let csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Turning_Point_CRM_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusClass = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('complete')) return 'status-pill completed';
    if (s.includes('review')) return 'status-pill review';
    if (s.includes('plan')) return 'status-pill planning';
    return 'status-pill in-progress';
  };

  const getPriorityClass = (priority) => {
    const p = (priority || '').toLowerCase();
    if (p.includes('urgent')) return 'priority-pill urgent';
    if (p.includes('high')) return 'priority-pill high';
    if (p.includes('med')) return 'priority-pill medium';
    return 'priority-pill low';
  };

  const formatUrl = (url) => {
    if (!url) return '#';
    return url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
  };

  return (
    <div>
      {/* Stats Summary Bar including CEO Work Progress % */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <div className="stat-card">
          <div className="stat-icon orange"><CheckCircle2 /></div>
          <div className="stat-details">
            <span className="stat-value">{projects.length}</span>
            <span className="stat-label">Accessible Projects ({currentUser.role})</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon blue"><Clock /></div>
          <div className="stat-details">
            <span className="stat-value">{projects.filter(p => (p.status || '').toLowerCase().includes('progress')).length}</span>
            <span className="stat-label">In Active Progress</span>
          </div>
        </div>

        {/* CEO WORK PROGRESS % STAT CARD */}
        <div className="stat-card" style={{ borderLeft: '4px solid #10B981', background: '#ECFDF5' }}>
          <div className="stat-icon emerald"><Sparkles /></div>
          <div className="stat-details">
            <span className="stat-value" style={{ color: '#047857' }}>
              {totalSubTasksCount > 0 ? `${globalCeoProgressPct}%` : '100%'}
            </span>
            <span className="stat-label" style={{ color: '#065F46', fontWeight: 600 }}>
              CEO Work Progress ({approvedSubTasksCount}/{totalSubTasksCount} Approved)
            </span>
          </div>
        </div>

        {/* CEO FINANCIALS STAT CARD (CEO / ADMIN EXCLUSIVE) */}
        {canEditAllFields && (
          <div className="stat-card" style={{ borderLeft: '4px solid #059669', background: '#F0FDF4' }}>
            <div className="stat-icon emerald"><DollarSign /></div>
            <div className="stat-details">
              <span className="stat-value" style={{ color: '#047857' }}>
                {formatShortCurrency(netPortfolioProfit)}
              </span>
              <span className="stat-label" style={{ color: '#065F46', fontWeight: 600 }}>
                Net Portfolio Profit (Rev: {formatShortCurrency(totalPortfolioRevenue)} | Spent: {formatShortCurrency(totalPortfolioSpent)})
              </span>
            </div>
          </div>
        )}

        <div className="stat-card">
          <div className="stat-icon purple"><ShieldAlert /></div>
          <div className="stat-details">
            <span className="stat-value">
              {pendingReviewSubTasksCount > 0 ? `${pendingReviewSubTasksCount} Pending` : (canEditAllFields ? 'CEO/Admin' : 'Assignee')}
            </span>
            <span className="stat-label">
              {pendingReviewSubTasksCount > 0 ? 'Sub-tasks awaiting CEO Approval ⚡' : (canEditAllFields ? 'Full Table & Drive Rights' : 'Progress Update Rights')}
            </span>
          </div>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="toolbar" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '6px', background: '#F1F5F9', padding: '4px', borderRadius: '8px' }}>
          <button
            onClick={() => setAssignmentFilter('ALL')}
            style={{
              background: assignmentFilter === 'ALL' ? '#FFFFFF' : 'transparent',
              color: assignmentFilter === 'ALL' ? 'var(--text-main)' : 'var(--text-muted)',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '0.78rem',
              fontWeight: assignmentFilter === 'ALL' ? 800 : 500,
              cursor: 'pointer',
              boxShadow: assignmentFilter === 'ALL' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              fontFamily: 'inherit'
            }}
          >
            All Projects
          </button>

          <button
            onClick={() => setAssignmentFilter('MINE')}
            style={{
              background: assignmentFilter === 'MINE' ? '#ECFDF5' : 'transparent',
              color: assignmentFilter === 'MINE' ? 'var(--brand-green)' : 'var(--text-muted)',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '0.78rem',
              fontWeight: assignmentFilter === 'MINE' ? 800 : 500,
              cursor: 'pointer',
              boxShadow: assignmentFilter === 'MINE' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              fontFamily: 'inherit',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <UserCheck size={14} /> Assigned to Me
          </button>

          <button
            onClick={() => setAssignmentFilter('REVIEW')}
            style={{
              background: assignmentFilter === 'REVIEW' ? '#F3E8FF' : 'transparent',
              color: assignmentFilter === 'REVIEW' ? '#7E22CE' : 'var(--text-muted)',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '0.78rem',
              fontWeight: assignmentFilter === 'REVIEW' ? 800 : 500,
              cursor: 'pointer',
              boxShadow: assignmentFilter === 'REVIEW' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              fontFamily: 'inherit',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Sparkles size={14} /> Pending CEO Review
            {pendingReviewSubTasksCount > 0 && (
              <span style={{ background: '#7E22CE', color: '#FFF', fontSize: '0.62rem', padding: '1px 6px', borderRadius: '10px' }}>
                {pendingReviewSubTasksCount}
              </span>
            )}
          </button>
        </div>

        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input 
            type="text" 
            className="search-input" 
            placeholder="Search projects, client, owner, assignee..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-pills">
          {sectors.map(sec => (
            <button
              key={sec}
              className={`filter-pill ${selectedSector === sec ? 'active' : ''}`}
              onClick={() => setSelectedSector(sec)}
            >
              {sec}
            </button>
          ))}
        </div>

        <div className="action-btns">
          <button className="btn-secondary" onClick={onRefresh} title="Fetch latest from Google Sheet">
            <RefreshCw size={14} />
            Refresh Sheet
          </button>
          <button className="btn-secondary" onClick={handleExportCSV}>
            <Download size={14} />
            Export CSV
          </button>
          {canEditAllFields && (
            <button className="btn-primary" onClick={onOpenNewProjectModal}>
              <Plus size={16} />
              Add Project
            </button>
          )}
        </div>
      </div>

      {/* RESPONSIVE MOBILE CARDS VIEW (For small screens <= 768px) */}
      <div className="mobile-crm-cards">
        {filteredProjects.length === 0 ? (
          <div style={{ background: '#FFFFFF', padding: '30px 16px', borderRadius: '10px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
            <Sparkles size={28} style={{ color: 'var(--brand-green)', margin: '0 auto 10px auto' }} />
            <h3 style={{ fontSize: '1.0rem', fontWeight: 800 }}>Google Sheet CRM Operational</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '6px 0 14px 0' }}>
              No projects currently listed under this filter.
            </p>
            {canEditAllFields && (
              <button className="btn-primary" onClick={onOpenNewProjectModal} style={{ width: '100%', justifyContent: 'center' }}>
                <Plus size={16} /> Add Project Live to Google Sheet
              </button>
            )}
          </div>
        ) : (
          filteredProjects.map((project) => (
            <div key={project.id} className="crm-mobile-card">
              <div className="crm-mobile-card-header">
                <div>
                  <span className="project-id-badge">{project.projectId}</span>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 800, marginTop: '4px' }}>{project.projectName}</h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{project.client}</span>
                </div>
                <span className={getStatusClass(project.status)}>{project.status}</span>
              </div>

              <div className="crm-mobile-card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Sector</span>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--brand-green)' }}>{project.sector}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Owner</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{project.owner}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Assignee</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{project.assignee}</span>
                </div>

                {/* Progress Update Cell */}
                <div style={{ background: '#ECFDF5', padding: '10px', borderRadius: '6px', border: '1px solid #A7F3D0', marginTop: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                    <span style={{ fontSize: '0.68rem', color: 'var(--brand-green)', fontWeight: 800, textTransform: 'uppercase' }}>
                      Progress Update:
                    </span>
                    <Edit2 size={12} style={{ color: 'var(--brand-green)' }} />
                  </div>
                  {editingCell?.id === project.id && editingCell?.field === 'statusUpdate' ? (
                    <input 
                      className="cell-input"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => handleSaveEdit(project, 'statusUpdate', 12)}
                      onKeyDown={(e) => handleKeyDown(e, project, 'statusUpdate', 12)}
                      autoFocus
                    />
                  ) : (
                    <p 
                      onClick={() => handleStartEdit(project, 'statusUpdate', project.statusUpdate, false)}
                      style={{ fontSize: '0.78rem', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 500 }}
                    >
                      {project.statusUpdate || 'Tap to add progress update...'}
                    </p>
                  )}
                </div>

                {/* Direct Google Drive Link (Mobile Card) */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Google Drive</span>
                  {project.driveLink ? (
                    <a 
                      href={formatUrl(project.driveLink)} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      style={{ color: 'var(--brand-green)', fontWeight: 700, fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                      title="Open Direct Google Drive Folder"
                    >
                      <ExternalLink size={14} /> Open Drive
                    </a>
                  ) : (
                    <span 
                      onClick={() => canEditAllFields && handleStartEdit(project, 'driveLink', project.driveLink, true)}
                      style={{ fontSize: '0.72rem', color: 'var(--text-muted)', cursor: canEditAllFields ? 'pointer' : 'default' }}
                    >
                      {canEditAllFields ? '+ Add Drive Link' : '-'}
                    </span>
                  )}
                </div>

                {/* Sub-Tasks & CEO Financials Mobile Actions */}
                <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>CRM Actions:</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {(() => {
                      const pTasks = subTasksMap[project.id] || [];
                      const approvedCount = pTasks.filter(t => t.status === 'Approved').length;
                      const submittedCount = pTasks.filter(t => t.status === 'Submitted').length;

                      return (
                        <button
                          onClick={() => setSubTaskProject(project)}
                          style={{
                            background: submittedCount > 0 ? '#7E22CE' : '#F3E8FF',
                            color: submittedCount > 0 ? '#FFFFFF' : '#6B21A8',
                            border: '1px solid ' + (submittedCount > 0 ? '#7E22CE' : '#D8B4FE'),
                            borderRadius: '6px',
                            padding: '4px 10px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <ListTodo size={12} />
                          <span>{pTasks.length > 0 ? `${approvedCount}/${pTasks.length} Done` : 'Sub-Tasks'}</span>
                          {submittedCount > 0 && <span style={{ background: '#FFD700', color: '#000', fontSize: '0.6rem', padding: '1px 4px', borderRadius: '8px' }}>⚡ Review</span>}
                        </button>
                      );
                    })()}

                    <button
                      onClick={() => setDetailsProject(project)}
                      style={{
                        background: '#F8FAFC',
                        color: '#0F172A',
                        border: '1px solid #CBD5E1',
                        borderRadius: '6px',
                        padding: '4px 10px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Building size={12} />
                      <span>Details</span>
                    </button>

                    {canEditAllFields && (
                      <button
                        onClick={() => setFinancialsProject(project)}
                        style={{
                          background: '#ECFDF5',
                          color: '#047857',
                          border: '1px solid #A7F3D0',
                          borderRadius: '6px',
                          padding: '4px 10px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <DollarSign size={12} />
                        <span>Financials</span>
                      </button>
                    )}

                    {canDeleteProject && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          openCeoDeleteModal(project);
                        }}
                        style={{
                          background: '#FEF2F2',
                          color: '#DC2626',
                          border: '1px solid #FECACA',
                          borderRadius: '6px',
                          padding: '4px 10px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <ShieldAlert size={12} />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MAIN DATA TABLE (Desktop & Tablet > 768px) */}
      <div className="table-container desktop-crm-table">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Project ID</th>
              <th>Project Name</th>
              <th>Client / Partner</th>
              <th>Sector</th>
              <th>Project Owner</th>
              <th>Assign To</th>
              <th>Target End</th>
              <th>% Complete</th>
              <th>Status</th>
              <th>Priority</th>
              <th style={{ background: '#F3E8FF', color: '#7E22CE' }}>
                Sub-Tasks & CEO Review
              </th>
              <th style={{ background: '#ECFDF5', color: 'var(--brand-green)' }}>
                Progress Update
              </th>
              <th>Drive Link</th>
            </tr>
          </thead>
          <tbody>
            {filteredProjects.length === 0 ? (
              <tr>
                <td colSpan={13} style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                  <div style={{ maxWidth: '400px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#ECFDF5', color: 'var(--brand-green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Sparkles size={24} />
                    </div>
                    <h3 style={{ color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: 800 }}>Google Sheet Live CRM Ready</h3>
                    <p style={{ fontSize: '0.82rem', lineHeight: '1.5' }}>
                      No project rows currently in your Google Sheet CRM tab.
                    </p>
                    {canEditAllFields && (
                      <button className="btn-primary" onClick={onOpenNewProjectModal} style={{ padding: '10px 20px' }}>
                        <Plus size={16} /> Add Project Live to Google Sheet
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredProjects.map((project) => (
                <tr key={project.id}>
                  <td>
                    <span className="project-id-badge">{project.projectId}</span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{project.projectName}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{project.client}</td>
                  <td>
                    <span style={{ fontSize: '0.72rem', color: 'var(--brand-green)', fontWeight: 700 }}>{project.sector}</span>
                  </td>
                  
                  {/* Project Owner Cell (CEO / Admin Editable Only) */}
                  <td>
                    {editingCell?.id === project.id && editingCell?.field === 'owner' && canEditAllFields ? (
                      <select 
                        className="cell-input"
                        value={editValue}
                        onChange={(e) => {
                          setEditValue(e.target.value);
                          onCellEdit(project, 'owner', 5, e.target.value);
                          setEditingCell(null);
                        }}
                        onBlur={() => setEditingCell(null)}
                        autoFocus
                      >
                        {SYSTEM_USERS.map(u => (
                          <option key={u.email} value={u.name}>{u.name} ({u.role})</option>
                        ))}
                      </select>
                    ) : (
                      <div 
                        className="editable-cell" 
                        onClick={() => handleStartEdit(project, 'owner', project.owner, true)}
                        title={canEditAllFields ? 'Click to change Project Owner' : 'Locked (CEO/Admin Only)'}
                        style={{ cursor: canEditAllFields ? 'pointer' : 'default' }}
                      >
                        <span style={{ fontWeight: 600 }}>{project.owner}</span>
                        {canEditAllFields ? (
                          <Edit2 size={11} style={{ marginLeft: '4px', color: 'var(--text-muted)' }} />
                        ) : (
                          <Lock size={11} style={{ marginLeft: '4px', color: '#94A3B8' }} />
                        )}
                      </div>
                    )}
                  </td>

                  {/* Assign To Cell (CEO / Admin Editable Only) */}
                  <td>
                    {editingCell?.id === project.id && editingCell?.field === 'assignee' && canEditAllFields ? (
                      <select 
                        className="cell-input"
                        value={editValue}
                        onChange={(e) => {
                          setEditValue(e.target.value);
                          onCellEdit(project, 'assignee', 6, e.target.value);
                          setEditingCell(null);
                        }}
                        onBlur={() => setEditingCell(null)}
                        autoFocus
                      >
                        {SYSTEM_USERS.map(u => (
                          <option key={u.email} value={u.name}>{u.name} ({u.role})</option>
                        ))}
                      </select>
                    ) : (
                      <div 
                        className="editable-cell" 
                        onClick={() => handleStartEdit(project, 'assignee', project.assignee, true)}
                        title={canEditAllFields ? 'Click to change Assignee' : 'Locked (CEO/Admin Only)'}
                        style={{ cursor: canEditAllFields ? 'pointer' : 'default', flexDirection: 'column', alignItems: 'flex-start' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{project.assignee}</span>
                          {canEditAllFields ? (
                            <Edit2 size={11} style={{ color: 'var(--text-muted)' }} />
                          ) : (
                            <Lock size={11} style={{ color: '#94A3B8' }} />
                          )}
                        </div>

                        {/* Show sub-task assignees if multiple people assigned to this project */}
                        {(() => {
                          const pTasks = subTasksMap[project.id] || [];
                          const otherAssignees = [...new Set(pTasks.map(t => t.assigneeName).filter(Boolean))];
                          if (otherAssignees.length === 0) return null;
                          return (
                            <span style={{ fontSize: '0.64rem', color: '#7E22CE', fontWeight: 700, marginTop: '2px', background: '#F3E8FF', padding: '1px 5px', borderRadius: '4px' }}>
                              👥 +{otherAssignees.length} Sub-task Team
                            </span>
                          );
                        })()}
                      </div>
                    )}
                  </td>

                  <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{project.targetEndDate}</td>
                  
                  {/* % Complete Cell (CEO / Admin Editable Only) */}
                  <td>
                    {editingCell?.id === project.id && editingCell?.field === 'completion' && canEditAllFields ? (
                      <input 
                        className="cell-input"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => handleSaveEdit(project, 'completion', 9)}
                        onKeyDown={(e) => handleKeyDown(e, project, 'completion', 9)}
                        autoFocus
                      />
                    ) : (
                      <div 
                        className="editable-cell" 
                        onClick={() => handleStartEdit(project, 'completion', project.completion, true)}
                        title={canEditAllFields ? 'Click to edit completion %' : 'Locked (CEO/Admin Only)'}
                        style={{ cursor: canEditAllFields ? 'pointer' : 'default' }}
                      >
                        <div className="progress-bar-bg">
                          <div 
                            className="progress-bar-fill" 
                            style={{ width: project.completion.includes('%') ? project.completion : `${project.completion}%` }}
                          />
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{project.completion}</span>
                      </div>
                    )}
                  </td>

                  {/* Status Cell (CEO / Admin Editable Only) */}
                  <td>
                    {editingCell?.id === project.id && editingCell?.field === 'status' && canEditAllFields ? (
                      <select 
                        className="cell-input"
                        value={editValue}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditingCell(null);
                          if (val === 'Cancelled' || val === 'On Hold') {
                            setStatusReasonModal({ project, newStatus: val });
                            setReasonInput('');
                          } else {
                            onCellEdit(project, 'status', 10, val);
                            if (val === 'Completed') {
                              onCellEdit(project, 'completion', 9, '100%');
                            }
                          }
                        }}
                        onBlur={() => setEditingCell(null)}
                        autoFocus
                      >
                        <option value="In Progress">In Progress</option>
                        <option value="Review">Review</option>
                        <option value="Completed">Completed (100%)</option>
                        <option value="On Hold">On Hold (Enter Reason)</option>
                        <option value="Cancelled">Cancelled (Enter Reason)</option>
                        <option value="Planning">Planning</option>
                      </select>
                    ) : (
                      <div 
                        className="editable-cell" 
                        onClick={() => handleStartEdit(project, 'status', project.status, true)}
                        title={canEditAllFields ? 'Click to change status' : 'Locked (CEO/Admin Only)'}
                        style={{ cursor: canEditAllFields ? 'pointer' : 'default' }}
                      >
                        <span className={getStatusClass(project.status)}>{project.status}</span>
                      </div>
                    )}
                  </td>

                  {/* Priority Cell (CEO / Admin Editable Only) */}
                  <td>
                    {editingCell?.id === project.id && editingCell?.field === 'priority' && canEditAllFields ? (
                      <select 
                        className="cell-input"
                        value={editValue}
                        onChange={(e) => {
                          setEditValue(e.target.value);
                          onCellEdit(project, 'priority', 11, e.target.value);
                          setEditingCell(null);
                        }}
                        onBlur={() => setEditingCell(null)}
                        autoFocus
                      >
                        <option value="Urgent">Urgent</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    ) : (
                      <div 
                        className="editable-cell" 
                        onClick={() => handleStartEdit(project, 'priority', project.priority, true)}
                        title={canEditAllFields ? 'Click to edit priority' : 'Locked (CEO/Admin Only)'}
                        style={{ cursor: canEditAllFields ? 'pointer' : 'default' }}
                      >
                        <span className={getPriorityClass(project.priority)}>{project.priority}</span>
                      </div>
                    )}
                  </td>

                  {/* Sub-Tasks & CEO Financials Action Cell */}
                  <td style={{ background: '#FAF5FF' }}>
                    {(() => {
                      const pTasks = subTasksMap[project.id] || [];
                      const approvedCount = pTasks.filter(t => t.status === 'Approved').length;
                      const submittedCount = pTasks.filter(t => t.status === 'Submitted').length;

                      const pFin = financialsMap[project.id] || { revenue: 0, expenses: [] };
                      const pSpent = (pFin.expenses || []).reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <button
                            onClick={() => setSubTaskProject(project)}
                            style={{
                              background: submittedCount > 0 ? '#7E22CE' : '#F3E8FF',
                              color: submittedCount > 0 ? '#FFFFFF' : '#6B21A8',
                              border: '1px solid ' + (submittedCount > 0 ? '#7E22CE' : '#D8B4FE'),
                              borderRadius: '6px',
                              padding: '4px 8px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontFamily: 'inherit',
                              boxShadow: submittedCount > 0 ? '0 2px 8px rgba(126,34,206,0.3)' : 'none'
                            }}
                          >
                            <ListTodo size={12} />
                            <span>
                              {pTasks.length > 0 ? `${approvedCount}/${pTasks.length} Sub-tasks` : 'Sub-tasks'}
                            </span>
                            {submittedCount > 0 && (
                              <span style={{ background: '#FFD700', color: '#000000', fontSize: '0.62rem', fontWeight: 900, padding: '1px 5px', borderRadius: '10px' }}>
                                {submittedCount} Review
                              </span>
                            )}
                          </button>

                          {/* Full Project Details Sheet Button */}
                          <button
                            onClick={() => setDetailsProject(project)}
                            style={{
                              background: '#F8FAFC',
                              color: '#0F172A',
                              border: '1px solid #CBD5E1',
                              borderRadius: '6px',
                              padding: '4px 8px',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontFamily: 'inherit'
                            }}
                            title="Open Full Project & Client Details Sheet with PDF/Word Export"
                          >
                            <Building size={12} />
                            <span>Details</span>
                          </button>

                          {/* CEO Financials & Expenses Button (CEO / ADMIN EXCLUSIVE) */}
                          {canEditAllFields && (
                            <button
                              onClick={() => setFinancialsProject(project)}
                              style={{
                                background: '#ECFDF5',
                                color: '#047857',
                                border: '1px solid #A7F3D0',
                                borderRadius: '6px',
                                padding: '4px 8px',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontFamily: 'inherit'
                              }}
                              title="CEO Financial Tracking: Revenue, Expenses & Net Profit"
                            >
                              <DollarSign size={12} />
                              <span>Financials ({pSpent > 0 ? formatShortCurrency(pSpent) : 'Cost/Rev'})</span>
                            </button>
                          )}

                          {/* Delete Project Button (STRICTLY CEO ONLY - Not even Admin!) */}
                          {canDeleteProject && (
                            <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          openCeoDeleteModal(project);
                        }}
                              style={{
                                background: '#FEF2F2',
                                color: '#DC2626',
                                border: '1px solid #FECACA',
                                borderRadius: '6px',
                                padding: '4px 8px',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontFamily: 'inherit'
                              }}
                              title="Delete Project (CEO Exclusive Action)"
                            >
                              <ShieldAlert size={12} />
                              <span>Delete</span>
                            </button>
                          )}
                        </div>
                      );
                    })()}
                  </td>

                  {/* Progress Update Description Cell (Editable by Assignees & CEO/Admin) */}
                  <td style={{ maxWidth: '280px', background: '#ECFDF5' }}>
                    {editingCell?.id === project.id && editingCell?.field === 'statusUpdate' ? (
                      <input 
                        className="cell-input"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => handleSaveEdit(project, 'statusUpdate', 12)}
                        onKeyDown={(e) => handleKeyDown(e, project, 'statusUpdate', 12)}
                        autoFocus
                      />
                    ) : (
                      <div 
                        className="editable-cell" 
                        onClick={() => handleStartEdit(project, 'statusUpdate', project.statusUpdate, false)}
                        title="Click to edit progress update notes"
                      >
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-main)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {project.statusUpdate || 'Click to edit progress update...'}
                        </span>
                        <Edit2 size={11} style={{ marginLeft: '4px', color: 'var(--brand-green)' }} />
                      </div>
                    )}
                  </td>

                  {/* DIRECT GOOGLE DRIVE LINK (Desktop View) */}
                  <td>
                    {editingCell?.id === project.id && editingCell?.field === 'driveLink' && canEditAllFields ? (
                      <input 
                        className="cell-input"
                        value={editValue}
                        placeholder="https://drive.google.com/..."
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => handleSaveEdit(project, 'driveLink', 13)}
                        onKeyDown={(e) => handleKeyDown(e, project, 'driveLink', 13)}
                        autoFocus
                      />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {project.driveLink ? (
                          <a 
                            href={formatUrl(project.driveLink)} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            style={{ color: 'var(--brand-green)', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none', fontWeight: 700, fontSize: '0.78rem' }}
                            title="Click to open direct Google Drive Folder"
                          >
                            <ExternalLink size={14} />
                            <span>Open Drive</span>
                          </a>
                        ) : (
                          <span 
                            onClick={() => canEditAllFields && handleStartEdit(project, 'driveLink', project.driveLink, true)}
                            style={{ color: 'var(--text-muted)', fontSize: '0.75rem', cursor: canEditAllFields ? 'pointer' : 'default' }}
                          >
                            {canEditAllFields ? '+ Add Drive Link' : '-'}
                          </span>
                        )}
                        {canEditAllFields && (
                          <Edit2 
                            size={11} 
                            onClick={() => handleStartEdit(project, 'driveLink', project.driveLink, true)}
                            style={{ cursor: 'pointer', color: 'var(--text-muted)', marginLeft: '4px' }} 
                            title="Edit Drive Link"
                          />
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Sub-Tasks & CEO Review Modal */}
      {subTaskProject && (
        <SubTaskModal 
          project={subTaskProject}
          currentUser={currentUser}
          subTasks={subTasksMap[subTaskProject.id] || []}
          onSaveSubTasks={saveSubTasks}
          onClose={() => setSubTaskProject(null)}
        />
      )}

      {/* CEO Financials & Expenses Modal */}
      {financialsProject && (
        <ProjectFinancialsModal 
          project={financialsProject}
          currentUser={currentUser}
          financialsData={financialsMap[financialsProject.id] || { revenue: 0, expenses: [] }}
          onSaveFinancials={saveProjectFinancials}
          onClose={() => setFinancialsProject(null)}
        />
      )}

      {/* Full Project Details Sheet Modal */}
      {detailsProject && (
        <ProjectDetailsModal
          project={detailsProject}
          subTasks={subTasksMap[detailsProject.id] || []}
          onClose={() => setDetailsProject(null)}
        />
      )}

      {/* Status Reason Modal (Mandatory Reason for Cancelled or On Hold) */}
      {statusReasonModal && (
        <div className="modal-overlay" style={{ zIndex: 100000 }}>
          <div className="modal-content" style={{ maxWidth: '480px', padding: '24px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                Reason for Setting Status to "{statusReasonModal.newStatus}" *
              </h3>
              <button onClick={() => setStatusReasonModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveStatusReason}>
              <p style={{ fontSize: '0.82rem', color: '#475569', marginBottom: '14px' }}>
                Please specify why project <strong>"{statusReasonModal.project.projectName}"</strong> is being marked as <strong>{statusReasonModal.newStatus}</strong>. This reason will be recorded in CRM project updates.
              </p>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '4px' }}>
                  {statusReasonModal.newStatus} Reason / Explanation *
                </label>
                <textarea 
                  rows="3" 
                  placeholder={statusReasonModal.newStatus === 'Cancelled' ? "e.g. Client requested project cancellation due to budget restructuring..." : "e.g. On hold pending Ministry of Commerce license approval..."}
                  value={reasonInput} 
                  onChange={e => setReasonInput(e.target.value)} 
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.82rem' }} 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn-secondary" onClick={() => setStatusReasonModal(null)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ background: statusReasonModal.newStatus === 'Cancelled' ? '#DC2626' : '#F59E0B' }}>
                  Confirm Status: {statusReasonModal.newStatus}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CEO Mobile QR Code 2FA Security Authorization Modal */}
      {ceoDeleteModal && (
        <div className="modal-overlay" style={{ zIndex: 100000 }}>
          <div className="modal-content" style={{ maxWidth: '520px', padding: '24px', borderRadius: '16px', borderTop: '4px solid #DC2626' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={20} style={{ color: '#DC2626' }} />
                <h3 style={{ fontSize: '1rem', fontWeight: 900, margin: 0, color: '#991B1B' }}>
                  CEO Mobile QR Code 2FA Authorization
                </h3>
              </div>
              <button onClick={() => setCeoDeleteModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleConfirmCeoDeleteProject}>
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.8rem', color: '#991B1B' }}>
                ⚠️ <strong>Executive Authorization Required:</strong> Scan the QR code below on CEO phone and enter the generated unique 6-digit PIN to delete <strong>"{ceoDeleteModal.project.projectName}"</strong>.
              </div>

              {/* QR Code & PIN Display Card */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ background: '#FFF', padding: '8px', borderRadius: '8px', border: '1px solid #CBD5E1', textAlign: 'center' }}>
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=https://script.google.com/macros/s/AKfycbw4T5aMZivnM1oNWmuBTkB5Ftt7p39StKw-MHW-1BVJg-MBIYllnMCM1au5kuU8YD1bQA/exec?action=authDelete%26pin=${ceoDeleteModal.otpPin}%26project=${encodeURIComponent(ceoDeleteModal.project.projectName)}`}
                    alt="CEO 2FA QR Code" 
                    style={{ width: '120px', height: '120px', display: 'block' }}
                  />
                  <span style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 700, display: 'block', marginTop: '4px' }}>Scan with Phone</span>
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', marginBottom: '4px' }}>On-Screen Unique Security PIN:</div>
                  <div style={{ background: '#0F172A', color: '#10B981', fontSize: '1.4rem', fontWeight: 900, padding: '8px 14px', borderRadius: '8px', letterSpacing: '3px', textAlign: 'center', fontFamily: 'monospace' }}>
                    {ceoDeleteModal.otpPin.slice(0, 3)}-{ceoDeleteModal.otpPin.slice(3)}
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#64748B', display: 'block', marginTop: '6px', lineHeight: '1.3' }}>
                    📲 CEO Walter Dantis scans QR code on mobile camera to verify OTP pin code authorization.
                  </span>
                </div>
              </div>

              {/* Input 1: Enter 6-Digit PIN */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0F172A', display: 'block', marginBottom: '4px' }}>
                  1. Enter 6-Digit Mobile Verification PIN *
                </label>
                <input 
                  type="text" 
                  maxLength={7}
                  placeholder={`Enter PIN e.g. ${ceoDeleteModal.otpPin}`}
                  value={deleteOtpPinInput} 
                  onChange={e => setDeleteOtpPinInput(e.target.value)} 
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #FCA5A5', fontSize: '0.95rem', fontWeight: 900, color: '#991B1B', letterSpacing: '2px' }} 
                />
              </div>

              {/* Input 2: Official Reason for Deletion */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0F172A', display: 'block', marginBottom: '4px' }}>
                  2. Official Reason for Deleting Project *
                </label>
                <textarea 
                  rows="2" 
                  placeholder="Provide executive reason for deleting this project record..."
                  value={deleteReasonInput} 
                  onChange={e => setDeleteReasonInput(e.target.value)} 
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.82rem' }} 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn-secondary" onClick={() => setCeoDeleteModal(null)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ background: '#DC2626', borderColor: '#DC2626' }}>
                  🔒 Verify QR Auth & Delete Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
