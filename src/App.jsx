import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import ProjectTable from './components/ProjectTable';
import PettyCashView from './components/PettyCashView';
import TeamChatView from './components/TeamChatView';
import InvoiceTab from './components/InvoiceTab';
import WeeklyStaffTasksView from './components/WeeklyStaffTasksView';
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

  // Pure live fetch from published Google Sheet CSV feed
  const loadData = async () => {
    setIsSyncing(true);
    const res = await fetchSheetData(SHEET_GIDS.CRM);
    if (res.success && Array.isArray(res.data)) {
      setProjects(res.data);
    } else {
      setProjects([]);
    }
    setIsSyncing(false);
  };

  useEffect(() => {
    loadData();
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
    const newProject = {
      id: `p-${Date.now()}`,
      rowIndex: projects.length + 11,
      ...newProjData
    };

    const updatedProjects = [newProject, ...projects];
    setProjects(updatedProjects);

    setIsSyncing(true);
    showToast('Pushing new project to Google Sheet...');

    await addProjectToGoogleSheet(gasUrl, newProject);

    setIsSyncing(false);
    showToast(`Project "${newProjData.projectName}" saved to Google Sheet!`);
    confetti({ particleCount: 70, spread: 70 });
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
          />
        ) : activeTab === 'WEEKLY_TASKS' ? (
          <WeeklyStaffTasksView 
            currentUser={currentUser}
            projects={roleFilteredProjects}
          />
        ) : activeTab === 'TAX_INVOICES' ? (
          <InvoiceTab 
            currentUser={currentUser}
          />
        ) : activeTab === 'TEAM_CHAT' ? (
          <TeamChatView 
            currentUser={currentUser}
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
