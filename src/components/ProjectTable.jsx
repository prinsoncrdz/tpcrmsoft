import React, { useState } from 'react';
import { Search, Plus, Download, RefreshCw, ExternalLink, Edit2, AlertCircle, CheckCircle2, Clock, ShieldAlert, Sparkles, UserCheck, Lock } from 'lucide-react';
import { SYSTEM_USERS } from '../services/googleSheets';

export default function ProjectTable({ projects, currentUser, onCellEdit, onOpenNewProjectModal, onRefresh }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState('ALL');
  const [editingCell, setEditingCell] = useState(null); // { id, field }
  const [editValue, setEditValue] = useState('');

  const sectors = ['ALL', 'HEALTHCARE', 'RETAIL & FRANCHISE', 'TECHNOLOGY & INNOVATION', 'EDUCATION', 'TRADING & DISTRIBUTION', 'CONSULTING'];

  // Role-Based Field Edit Permissions
  const canEditAllFields = currentUser?.role === 'CEO' || currentUser?.role === 'Admin';
  const canEditProgressUpdate = true; // Everyone assigned can edit Progress Update

  // Filter projects by search query and sector tab
  const filteredProjects = projects.filter(p => {
    const matchesSearch = (
      p.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.projectId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.assignee.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const matchesSector = selectedSector === 'ALL' || (p.sector && p.sector.toUpperCase().includes(selectedSector));
    return matchesSearch && matchesSector;
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
      {/* Stats Summary Bar */}
      <div className="stats-grid">
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

        <div className="stat-card">
          <div className="stat-icon emerald"><AlertCircle /></div>
          <div className="stat-details">
            <span className="stat-value">{projects.filter(p => (p.priority || '').toLowerCase().includes('high') || (p.priority || '').toLowerCase().includes('urgent')).length}</span>
            <span className="stat-label">High / Urgent Priority</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple"><ShieldAlert /></div>
          <div className="stat-details">
            <span className="stat-value">{canEditAllFields ? 'CEO/Admin' : 'Assignee'} Edit</span>
            <span className="stat-label">{canEditAllFields ? 'Full Table & Drive Rights' : 'Progress Update Rights'}</span>
          </div>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="toolbar">
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
              <th style={{ background: '#ECFDF5', color: 'var(--brand-green)' }}>
                Progress Update
              </th>
              <th>Drive Link</th>
            </tr>
          </thead>
          <tbody>
            {filteredProjects.length === 0 ? (
              <tr>
                <td colSpan={12} style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
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
                        style={{ cursor: canEditAllFields ? 'pointer' : 'default' }}
                      >
                        <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{project.assignee}</span>
                        {canEditAllFields ? (
                          <Edit2 size={11} style={{ marginLeft: '4px', color: 'var(--text-muted)' }} />
                        ) : (
                          <Lock size={11} style={{ marginLeft: '4px', color: '#94A3B8' }} />
                        )}
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
    </div>
  );
}
