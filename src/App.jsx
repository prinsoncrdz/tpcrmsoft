import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import ProjectTable from './components/ProjectTable';
import PettyCashView from './components/PettyCashView';
import TeamChatView from './components/TeamChatView';
import InvoiceTab from './components/InvoiceTab';
import ProjectApprovalsPortal from './components/ProjectApprovalsPortal';
import FridayExecutiveReportView from './components/FridayExecutiveReportView';
import CeoPnLTrackerView from './components/CeoPnLTrackerView';
import ChangePasswordView from './components/ChangePasswordView';
import LoginModal from './components/LoginModal';
import NewProjectModal from './components/NewProjectModal';
import NewPettyCashModal from './components/NewPettyCashModal';
import SheetConfigModal from './components/SheetConfigModal';
import { 
  fetchSheetData, 
  filterProjectsByRole, 
  syncCellToGoogleSheet, 
  addProjectToGoogleSheet,
  addPettyCashToGoogleSheet,
  fetchGlobalDeletedProjects,
  saveGlobalDeletedProjects,
  SHEET_GIDS,
  DEFAULT_GAS_URL 
} from './services/googleSheets';
import confetti from 'canvas-confetti';
import { LogOut } from 'lucide-react';
import './App.css';

export default function App() {
  // Clear any legacy dummy cache from browser storage
  useEffect(() => {
    localStorage.removeItem('tp_crm_cache');
  }, []);

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('tp_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState('CRM');
  
  // Strictly initialize to empty array - NO DUMMY DATA AT ALL
  const [projects, setProjects] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showNewPettyCashModal, setShowNewPettyCashModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [gasUrl, setGasUrl] = useState(localStorage.getItem('tp_gas_url') || DEFAULT_GAS_URL);
  const [toast, setToast] = useState(null);

  // Deleted Projects Registry for Persistent Real-time Removal Across System
  const [deletedProjectKeys, setDeletedProjectKeys] = useState(() => {
    try {
      const saved = localStorage.getItem('tp_deleted_project_keys_v2');
      return saved ? JSON.parse(saved) : [];
    } catch(e) { return []; }
  });

  const saveDeletedKeys = (keys) => {
    setDeletedProjectKeys(keys);
    localStorage.setItem('tp_deleted_project_keys_v2', JSON.stringify(keys));
    saveGlobalDeletedProjects(gasUrl, keys);
    try {
      const bc = new BroadcastChannel('tp_projects_deletion_channel');
      bc.postMessage({ deletedKeys: keys });
      bc.close();
    } catch(e) {}
  };

  // Pure live fetch from published Google Sheet CSV feed with Real-time Deletion Filtering
  const loadData = async () => {
    setIsSyncing(true);

    let currentDeleted = deletedProjectKeys;
    try {
      const saved = localStorage.getItem('tp_deleted_project_keys_v2');
      if (saved) currentDeleted = JSON.parse(saved);
      const cloudDeleted = await fetchGlobalDeletedProjects(gasUrl);
      if (Array.isArray(cloudDeleted) && cloudDeleted.length > 0) {
        currentDeleted = Array.from(new Set([...currentDeleted, ...cloudDeleted]));
        localStorage.setItem('tp_deleted_project_keys_v2', JSON.stringify(currentDeleted));
        setDeletedProjectKeys(currentDeleted);
      }
    } catch(e) {}

    const res = await fetchSheetData(SHEET_GIDS.CRM);
    if (res.success && Array.isArray(res.data)) {
      const validDeleted = (currentDeleted || []).filter(Boolean);
      const activeProjects = res.data.filter(p => {
        if ((p.status || '').toLowerCase().includes('deleted')) return false;
        if (p.id && validDeleted.includes(p.id)) return false;
        if (p.projectName && validDeleted.includes(p.projectName)) return false;
        if (p.companyName && validDeleted.includes(p.companyName)) return false;
        if (p.projectId && validDeleted.includes(p.projectId)) return false;
        return true;
      });
      setProjects(activeProjects);
    } else {
      setProjects([]);
    }
    setIsSyncing(false);
  };

  // Real-time automatic background polling every 3 seconds + BroadcastChannel sync
  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData();
    }, 3000);

    let bc;
    try {
      bc = new BroadcastChannel('tp_projects_deletion_channel');
      bc.onmessage = (event) => {
        if (event.data && Array.isArray(event.data.deletedKeys)) {
          setDeletedProjectKeys(event.data.deletedKeys);
          localStorage.setItem('tp_deleted_project_keys_v2', JSON.stringify(event.data.deletedKeys));
          loadData();
        }
      };
    } catch(e) {}

    return () => {
      clearInterval(interval);
      if (bc) bc.close();
    };
  }, []);

  const handleLogin = (user) => {
    setCurrentUser(user);
    localStorage.setItem('tp_user', JSON.stringify(user));
    showToast(`Welcome back, ${user.name}! Authenticated as ${user.role}.`);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('tp_user');
    showToast('Logged out successfully.');
  };

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 4000);
  };

  // Immediate cell edit sync for CRM
  const handleCellEdit = async (project, field, colIndex, newValue) => {
    const updatedProjects = projects.map(p => p.id === project.id ? { ...p, [field]: newValue } : p);
    setProjects(updatedProjects);

    setIsSyncing(true);
    showToast(`Updating ${field} in Google Sheet...`);

    const syncRes = await syncCellToGoogleSheet(gasUrl, {
      gid: SHEET_GIDS.CRM,
      rowIndex: project.rowIndex || 10,
      columnIndex: colIndex,
      value: newValue
    });

    setIsSyncing(false);
    if (syncRes.success) {
      showToast(`Saved ${field} = "${newValue}" to Google Sheet database!`);
    }
  };

  // Add new project live
  const handleAddProject = async (newProjData) => {
    const isSrelyang = (currentUser?.name || '').toLowerCase().includes('srelyang') || (currentUser?.email || '').toLowerCase().includes('srelyang.thim');
    const isCeo = currentUser?.role === 'CEO' || (currentUser?.name || '').toLowerCase().includes('walter') || (currentUser?.role || '').toLowerCase().includes('ceo');

    if (!isSrelyang && !isCeo) {
      showToast('🔒 Access Denied: Creating projects is reserved for Srelyang Thim & CEO Walter Dantis!');
      return;
    }

    try {
      const newProject = {
        id: `p-${Date.now()}`,
        rowIndex: (projects.length || 0) + 11,
        ...newProjData
      };

      const updatedProjects = [newProject, ...(projects || [])];
      setProjects(updatedProjects);

      setIsSyncing(true);
      showToast('Pushing new project to Google Sheet...');

      await addProjectToGoogleSheet(gasUrl, newProject);

      setIsSyncing(false);
      showToast(`Project "${newProjData.projectName || 'New Project'}" saved to Google Sheet!`);

      try {
        if (typeof confetti === 'function') {
          confetti({ particleCount: 70, spread: 70 });
        }
      } catch (cErr) {
        console.warn('Confetti animation:', cErr);
      }
    } catch (err) {
      console.error('handleAddProject error:', err);
      setIsSyncing(false);
      showToast('Project saved locally!');
    }
  };

  // Add new Petty Cash transaction
  const handleAddPettyCash = async (pettyCashItem) => {
    const currentGid = SHEET_GIDS[activeTab] || SHEET_GIDS.PETTY_CASH_JULY;
    setIsSyncing(true);
    showToast('Syncing Petty Cash transaction to Google Sheet...');

    await addPettyCashToGoogleSheet(gasUrl, {
      gid: currentGid,
      item: pettyCashItem
    });

    setIsSyncing(false);
    showToast(`Petty Cash transaction for "${pettyCashItem.description}" saved to Google Sheet!`);
    setRefreshTrigger(prev => prev + 1);
    confetti({ particleCount: 60, spread: 60 });
  };

  const handleDeleteProject = async (projectId, deleteReason) => {
    const isCeo = currentUser?.role === 'CEO' || 
                  (currentUser?.name || '').toLowerCase().includes('walter') || 
                  (currentUser?.role || '').toLowerCase().includes('ceo');
    if (!isCeo) {
      showToast('🔒 Access Denied: Only CEO Walter Dantis can delete projects!');
      return;
    }

    const targetProject = projects.find(p => p.id === projectId);
    const companyName = targetProject?.companyName;

    const newDeleted = Array.from(new Set([...deletedProjectKeys, projectId, companyName].filter(Boolean)));
    saveDeletedKeys(newDeleted);

    const updated = projects.filter(p => p.id !== projectId && p.companyName !== companyName);
    setProjects(updated);

    showToast(`Project "${companyName || projectId}" deleted by CEO. Syncing to Google Sheet...`);

    if (targetProject && targetProject.rowIndex) {
      await syncCellToGoogleSheet(gasUrl, {
        gid: SHEET_GIDS.CRM,
        rowIndex: targetProject.rowIndex,
        columnIndex: 10,
        value: 'DELETED'
      });
    }

    showToast(`Project deleted permanently across system! Reason logged: "${deleteReason || 'Executive Cleanup'}"`);
  };

  if (!currentUser) {
    return <LoginModal onLogin={handleLogin} />;
  }

  // Filter projects by logged-in user role
  const roleFilteredProjects = filterProjectsByRole(projects, currentUser);

  return (
    <div className="app-container">
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenSettings={() => setShowConfigModal(true)}
        isSyncing={isSyncing}
      />

      <main className="main-content">
        {toast && (
          <div style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: '#FFFFFF',
            border: '2px solid var(--brand-green)',
            color: 'var(--text-main)',
            padding: '12px 18px',
            borderRadius: '10px',
            boxShadow: 'var(--shadow-card)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.82rem',
            animation: 'fadeIn 0.2s ease'
          }}>
            <span style={{ color: 'var(--brand-green)', fontWeight: 800 }}>●</span>
            {toast}
          </div>
        )}

        {/* ALWAYS VISIBLE FLOATING LOGOUT BUTTON AT BOTTOM LEFT */}
        <button
          onClick={handleLogout}
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '20px',
            background: '#DC2626',
            color: '#FFFFFF',
            border: 'none',
            padding: '10px 16px',
            borderRadius: '30px',
            fontWeight: 700,
            fontSize: '0.78rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 16px rgba(220, 38, 38, 0.4)',
            zIndex: 9990,
            fontFamily: 'Poppins, sans-serif'
          }}
          title="Log Out Account"
        >
          <LogOut size={16} />
          <span>Log Out</span>
        </button>

        {activeTab === 'CRM' ? (
          <ProjectTable 
            projects={roleFilteredProjects}
            currentUser={currentUser}
            onCellEdit={handleCellEdit}
            onOpenNewProjectModal={() => setShowNewProjectModal(true)}
            onRefresh={loadData}
            onDeleteProject={handleDeleteProject}
          />
        ) : activeTab === 'CEO_PNL_TRACKER' ? (
          <CeoPnLTrackerView 
            currentUser={currentUser}
          />
        ) : activeTab === 'PROJECT_APPROVALS' ? (
          <ProjectApprovalsPortal 
            projects={projects}
            currentUser={currentUser}
            onApproveProject={async (approvedProj) => {
              const updated = projects.map(p => p.id === approvedProj.id ? approvedProj : p);
              setProjects(updated);
              showToast(`Project "${approvedProj.projectName}" approved by CEO Walter Dantis!`);
              if (syncCellToGoogleSheet) {
                await syncCellToGoogleSheet(gasUrl, {
                  gid: SHEET_GIDS.CRM,
                  rowIndex: approvedProj.rowIndex || 10,
                  columnIndex: 10,
                  value: 'In Progress'
                });
              }
              try {
                if (typeof confetti === 'function') confetti({ particleCount: 80, spread: 80 });
              } catch(e) {}
            }}
          />
        ) : activeTab === 'FRIDAY_REPORT' ? (
          <FridayExecutiveReportView 
            currentUser={currentUser}
            projects={roleFilteredProjects}
            onShowToast={showToast}
          />
        ) : activeTab === 'TAX_INVOICES' ? (
          <InvoiceTab 
            currentUser={currentUser}
          />
        ) : activeTab === 'TEAM_CHAT' ? (
          <TeamChatView 
            currentUser={currentUser}
          />
        ) : activeTab === 'CHANGE_PASSWORD' ? (
          <ChangePasswordView 
            currentUser={currentUser}
            onShowToast={showToast}
          />
        ) : (
          <PettyCashView 
            activeTab={activeTab}
            currentUser={currentUser}
            onOpenNewPettyCashModal={() => setShowNewPettyCashModal(true)}
            refreshTrigger={refreshTrigger}
          />
        )}
      </main>

      {showNewProjectModal && (
        <NewProjectModal 
          onClose={() => setShowNewProjectModal(false)}
          onAddProject={handleAddProject}
          currentUser={currentUser}
        />
      )}

      {showNewPettyCashModal && (
        <NewPettyCashModal 
          onClose={() => setShowNewPettyCashModal(false)}
          onAddPettyCash={handleAddPettyCash}
          currentUser={currentUser}
          activeTab={activeTab}
        />
      )}

      {showConfigModal && (
        <SheetConfigModal 
          onClose={() => setShowConfigModal(false)}
          onSaveUrl={(url) => setGasUrl(url)}
        />
      )}
    </div>
  );
}
