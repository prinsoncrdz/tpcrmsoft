import React, { useState, useEffect } from 'react';
import { Search, Plus, Download, RefreshCw, ExternalLink, Edit2, AlertCircle, CheckCircle2, Clock, ShieldAlert, Sparkles, UserCheck, Lock, ListTodo, CheckSquare } from 'lucide-react';
import { SYSTEM_USERS } from '../services/googleSheets';
import SubTaskModal from './SubTaskModal';

const SUBTASKS_STORAGE_KEY = 'tp_crm_subtasks_v2';

export default function ProjectTable({ projects, currentUser, onCellEdit, onOpenNewProjectModal, onRefresh }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState('ALL');
  const [editingCell, setEditingCell] = useState(null); // { id, field }
  const [editValue, setEditValue] = useState('');

  // Sub-task modal state
  const [subTaskProject, setSubTaskProject] = useState(null);
  const [subTasksMap, setSubTasksMap] = useState(() => {
    const saved = localStorage.getItem(SUBTASKS_STORAGE_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch (err) { return {}; }
    }
    return {};
  });

  const saveSubTasks = (projectId, tasks) => {
    const updatedMap = { ...subTasksMap, [projectId]: tasks };
    setSubTasksMap(updatedMap);
    localStorage.setItem(SUBTASKS_STORAGE_KEY, JSON.stringify(updatedMap));

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

  const [assignmentFilter, setAssignmentFilter] = useState('ALL'); // 'ALL' | 'MINE' | 'REVIEW'

  const sectors = ['ALL', 'HEALTHCARE', 'RETAIL & FRANCHISE', 'TECHNOLOGY & INNOVATION', 'EDUCATION', 'TRADING & DISTRIBUTION', 'CONSULTING'];

  // Role-Based Field Edit Permissions
  const canEditAllFields = currentUser?.role === 'CEO' || currentUser?.role === 'Admin';
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

    // Check if user is assigned to project OR any of its sub-tasks
    const pSubTasks = subTasksMap[p.id] || [];
    const isAssignedToUser = 
      p.assignee.toLowerCase().includes(currentUser.name.toLowerCase()) ||
      p.owner.toLowerCase().includes(currentUser.name.toLowerCase()) ||
      pSubTasks.some(st => st.assigneeEmail?.toLowerCase() === currentUser.email?.toLowerCase());

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

                {/* Sub-Tasks Mobile Action Button */}
                <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Sub-Tasks & CEO Review:</span>
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
                          gap: '6px'
                        }}
                      >
                        <ListTodo size={12} />
                        <span>{pTasks.length > 0 ? `${approvedCount}/${pTasks.length} Done` : 'Manage Sub-Tasks'}</span>
                        {submittedCount > 0 && <span style={{ background: '#FFD700', color: '#000', fontSize: '0.6rem', padding: '1px 4px', borderRadius: '8px' }}>⚡ CEO Review</span>}
                      </button>
                    );
                  })()}
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
                          setEditValue(e.target.value);
                          onCellEdit(project, 'status', 10, e.target.value);
                          setEditingCell(null);
                        }}
                        onBlur={() => setEditingCell(null)}
                        autoFocus
                      >
                        <option value="In Progress">In Progress</option>
                        <option value="Review">Review</option>
                        <option value="Completed">Completed</option>
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

                  {/* Sub-Tasks & CEO Review Action Cell */}
                  <td style={{ background: '#FAF5FF' }}>
                    {(() => {
                      const pTasks = subTasksMap[project.id] || [];
                      const approvedCount = pTasks.filter(t => t.status === 'Approved').length;
                      const submittedCount = pTasks.filter(t => t.status === 'Submitted').length;

                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <button
                            onClick={() => setSubTaskProject(project)}
                            style={{
                              background: submittedCount > 0 ? '#7E22CE' : '#F3E8FF',
                              color: submittedCount > 0 ? '#FFFFFF' : '#6B21A8',
                              border: '1px solid ' + (submittedCount > 0 ? '#7E22CE' : '#D8B4FE'),
                              borderRadius: '6px',
                              padding: '5px 10px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontFamily: 'inherit',
                              boxShadow: submittedCount > 0 ? '0 2px 8px rgba(126,34,206,0.3)' : 'none'
                            }}
                          >
                            <ListTodo size={13} />
                            <span>
                              {pTasks.length > 0 ? `${approvedCount}/${pTasks.length} Done` : 'Sub-Tasks'}
                            </span>
                            {submittedCount > 0 && (
                              <span style={{ background: '#FFD700', color: '#000000', fontSize: '0.62rem', fontWeight: 900, padding: '1px 5px', borderRadius: '10px' }}>
                                {submittedCount} Review
                              </span>
                            )}
                          </button>
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

    </div>
  );
}

