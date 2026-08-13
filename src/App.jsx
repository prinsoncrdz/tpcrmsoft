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
  fetchGlobalProjectsDetails,
  saveGlobalProjectsDetails,
  SHEET_GIDS,
  DEFAULT_GAS_URL 
} from './services/googleSheets';
import confetti from 'canvas-confetti';
import { LogOut } from 'lucide-react';
import './App.css';

export default function App() {
  // Automatic Production Clean State Launch Purge (Clears all test/demo localStorage data)
  useEffect(() => {
    const prodCleanVersion = 'v6_new_gas_deployment_2026';
    if (localStorage.getItem('tp_prod_clean_version') !== prodCleanVersion) {
      localStorage.removeItem('tp_crm_subtasks_v2');
      localStorage.removeItem('tp_crm_project_financials_v1');
      localStorage.removeItem('tp_friday_executive_reports_v2');
      localStorage.removeItem('tp_crm_tax_invoices_v1');
      localStorage.removeItem('tp_deleted_project_keys_v2');
      localStorage.removeItem('tp_last_known_projects_v2');
      localStorage.removeItem('tp_team_chat_messages_v3');
      localStorage.removeItem('tp_petty_cash_deletion_requests_v2');
      localStorage.setItem('tp_prod_clean_version', prodCleanVersion);
    }
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

    let cloudDetails = null;
    try {
      cloudDetails = await fetchGlobalProjectsDetails(gasUrl);
    } catch(e) {}

    const isProjectDeleted = (proj, deletedList) => {
      if (!proj || !Array.isArray(deletedList)) return false;
      if ((proj.status || '').toLowerCase().includes('deleted')) return true;

      const cleanStr = (s) => (s || '').toString().trim().toLowerCase();
      const idClean = cleanStr(proj.id);
      const pidClean = cleanStr(proj.projectId);
      const compClean = cleanStr(proj.companyName || proj.projectName);

      return deletedList.some(d => {
        const dClean = cleanStr(d);
        if (!dClean) return false;
        return (idClean && idClean === dClean) || 
               (pidClean && pidClean === dClean) || 
               (compClean && compClean === dClean) ||
               (compClean && dClean && (compClean === dClean || compClean.includes(dClean) || dClean.includes(compClean)));
      });
    };

    const res = await fetchSheetData(SHEET_GIDS.CRM);
    if (res.success && Array.isArray(res.data) && res.data.length > 0) {
      const validDeleted = (currentDeleted || []).filter(Boolean);
      const activeProjects = res.data.filter(p => !isProjectDeleted(p, validDeleted));

      setProjects(prevProjects => {
        const detailMap = new Map();

        try {
          const cachedStr = localStorage.getItem('tp_last_known_projects_v2');
          if (cachedStr) {
            const cachedList = JSON.parse(cachedStr);
            if (Array.isArray(cachedList)) {
              cachedList.forEach(cp => {
                if (cp.projectId || cp.id) detailMap.set(cp.projectId || cp.id, cp);
              });
            }
          }
        } catch(e) {}

        (prevProjects || []).forEach(p => {
          if (p.projectId || p.id) detailMap.set(p.projectId || p.id, p);
        });

        // Overlay Cloud Details (Scope of Work, Objective, Pricing, Payment Terms)
        if (cloudDetails && typeof cloudDetails === 'object') {
          Object.keys(cloudDetails).forEach(k => {
            const existing = detailMap.get(k) || {};
            detailMap.set(k, { ...existing, ...cloudDetails[k] });
          });
        }

        const mergedProjects = activeProjects.map(sheetProj => {
          const key = sheetProj.projectId || sheetProj.id;
          const localMatch = detailMap.get(key);
          if (localMatch) {
            return {
              ...localMatch,
              ...sheetProj,
              clientContact: localMatch.clientContact || sheetProj.clientContact,
              projectObjective: localMatch.projectObjective || sheetProj.projectObjective,
              scopeOfWork: localMatch.scopeOfWork || sheetProj.scopeOfWork,
              keyDeliverables: localMatch.keyDeliverables || sheetProj.keyDeliverables,
              keyPartners: localMatch.keyPartners || sheetProj.keyPartners,
              successCriteria: localMatch.successCriteria || sheetProj.successCriteria,
              knownRisks: localMatch.knownRisks || sheetProj.knownRisks,
              outOfScope: localMatch.outOfScope || sheetProj.outOfScope,
              dependencies: localMatch.dependencies || sheetProj.dependencies,
              contractValueUsd: localMatch.contractValueUsd || sheetProj.contractValueUsd,
              advanceRetainerPct: localMatch.advanceRetainerPct || sheetProj.advanceRetainerPct,
              advanceAmountUsd: localMatch.advanceAmountUsd || sheetProj.advanceAmountUsd,
              paymentTerms: localMatch.paymentTerms || sheetProj.paymentTerms,
              preparedBy: localMatch.preparedBy || sheetProj.preparedBy,
              reviewedBy: localMatch.reviewedBy || sheetProj.reviewedBy
            };
          }
          return sheetProj;
        });

        detailMap.forEach((localProj, k) => {
          const existsInSheet = mergedProjects.some(mp => (mp.projectId || mp.id) === k);
          if (!existsInSheet && !isProjectDeleted(localProj, validDeleted)) {
            mergedProjects.unshift(localProj);
          }
        });

        const finalFilteredProjects = mergedProjects.filter(p => !isProjectDeleted(p, validDeleted));
        localStorage.setItem('tp_last_known_projects_v2', JSON.stringify(finalFilteredProjects));
        return finalFilteredProjects;
      });
    } else {
      try {
        const cached = localStorage.getItem('tp_last_known_projects_v2');
        if (cached) setProjects(JSON.parse(cached));
      } catch(e) {}
    }
    setIsSyncing(false);
  };

  // Helper to broadcast project updates instantly (0ms) across all open screens & tabs
  const broadcastProjectUpdate = (updatedList) => {
    try {
      const bc = new BroadcastChannel('tp_projects_edit_channel');
      bc.postMessage({ projects: updatedList });
      bc.close();
    } catch(e) {}
  };

  // Real-time automatic background polling every 1 second + BroadcastChannel sync
  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData();
    }, 1000);

    let bcDel, bcEdit;
    try {
      bcDel = new BroadcastChannel('tp_projects_deletion_channel');
      bcDel.onmessage = (event) => {
        if (event.data && Array.isArray(event.data.deletedKeys)) {
          setDeletedProjectKeys(event.data.deletedKeys);
          localStorage.setItem('tp_deleted_project_keys_v2', JSON.stringify(event.data.deletedKeys));
          loadData();
        }
      };

      bcEdit = new BroadcastChannel('tp_projects_edit_channel');
      bcEdit.onmessage = (event) => {
        if (event.data && Array.isArray(event.data.projects)) {
          setProjects(event.data.projects);
          localStorage.setItem('tp_last_known_projects_v2', JSON.stringify(event.data.projects));
        }
      };
    } catch(e) {}

    return () => {
      clearInterval(interval);
      if (bcDel) bcDel.close();
      if (bcEdit) bcEdit.close();
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
    localStorage.setItem('tp_last_known_projects_v2', JSON.stringify(updatedProjects));
    broadcastProjectUpdate(updatedProjects);

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

  // Helper to persist rich Section B & C details (Scope of Work, Objective, Pricing, Payment Terms) to Google Apps Script cloud storage
  const syncProjectsDetailsToCloud = async (projectsList) => {
    try {
      const map = {};
      (projectsList || []).forEach(p => {
        const key = p.projectId || p.id;
        if (key) {
          map[key] = {
            clientContact: p.clientContact || '',
            projectObjective: p.projectObjective || '',
            scopeOfWork: p.scopeOfWork || '',
            keyDeliverables: p.keyDeliverables || '',
            keyPartners: p.keyPartners || '',
            contractValueUsd: p.contractValueUsd || p.value || '',
            advanceAmountUsd: p.advanceAmountUsd || p.depositPaid || '',
            paymentTerms: p.paymentTerms || '',
            invoiceSchedule: p.invoiceSchedule || ''
          };
        }
      });
      await saveGlobalProjectsDetails(gasUrl, map);
    } catch(e) {}
  };

  // Save full project details & Section B/C inline edits permanently
  const handleSaveProjectDetails = async (targetProject, updatedFields) => {
    const updatedProjects = projects.map(p => {
      if (p.id === targetProject.id || p.projectId === targetProject.projectId) {
        return {
          ...p,
          ...updatedFields,
          value: updatedFields.contractValueUsd || p.value,
          depositPaid: updatedFields.advanceAmountUsd || p.depositPaid
        };
      }
      return p;
    });

    setProjects(updatedProjects);
    localStorage.setItem('tp_last_known_projects_v2', JSON.stringify(updatedProjects));
    broadcastProjectUpdate(updatedProjects);
    showToast('Project Scope of Work & Section C Financials updated successfully!');
    await syncProjectsDetailsToCloud(updatedProjects);
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
      const projId = newProjData.projectId || newProjData.id || `TP-PRJ-${Date.now()}`;
      const projName = newProjData.projectName || newProjData.companyName || 'New Project';

      const newProject = {
        id: projId,
        projectId: projId,
        projectName: projName,
        companyName: projName,
        client: newProjData.client || 'Turning Point Retail',
        sector: newProjData.sector || 'RETAIL & FRANCHISE',
        owner: newProjData.owner || 'Walter Dantis (CEO)',
        assignee: newProjData.assignee || 'Sreylang Thim',
        startDate: newProjData.startDate || new Date().toISOString().split('T')[0],
        targetEndDate: newProjData.targetEndDate || '2026-12-31',
        completion: newProjData.completion || '0%',
        status: newProjData.status || (isCeo ? 'In Progress' : 'Pending CEO Approval'),
        priority: newProjData.priority || 'High',
        statusUpdate: newProjData.statusUpdate || 'Project Initiation Form submitted.',
        driveLink: newProjData.driveLink || '',
        nextAction: newProjData.nextAction || '',
        nextActionDueDate: newProjData.nextActionDueDate || '',
        daysToDeadline: 0,
        lastUpdated: new Date().toLocaleDateString('en-GB'),
        remarks: newProjData.remarks || '',
        rowIndex: (projects.length || 0) + 11,
        ...newProjData
      };

      const updatedProjects = [newProject, ...(projects || [])];
      setProjects(updatedProjects);

      localStorage.setItem('tp_last_known_projects_v2', JSON.stringify(updatedProjects));
      broadcastProjectUpdate(updatedProjects);

      setIsSyncing(true);
      showToast(`Pushing "${projName}" to Google Sheet database...`);

      await addProjectToGoogleSheet(gasUrl, newProject);
      await syncProjectsDetailsToCloud(updatedProjects);

      setIsSyncing(false);
      showToast(`Project "${projName}" saved to Google Sheet!`);

      try {
        if (typeof confetti === 'function') {
          confetti({ particleCount: 70, spread: 70 });
        }
      } catch (cErr) {}
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

    const targetProject = projects.find(p => p.id === projectId || p.projectId === projectId);
    const companyName = targetProject?.companyName || targetProject?.projectName;

    const newDeleted = Array.from(new Set([...deletedProjectKeys, projectId, companyName, targetProject?.projectId].filter(Boolean)));
    saveDeletedKeys(newDeleted);

    const updated = projects.filter(p => p.id !== projectId && p.projectId !== projectId && p.companyName !== companyName);
    setProjects(updated);

    showToast(`Project "${companyName || projectId}" hidden from Web App. Updating Excel status to 'DELETED'...`);

    if (targetProject && targetProject.rowIndex) {
      await syncCellToGoogleSheet(gasUrl, {
        gid: SHEET_GIDS.CRM,
        rowIndex: targetProject.rowIndex,
        columnIndex: 10,
        value: 'DELETED'
      });
    }

    showToast(`Project hidden from Web App UI! Preserved in Google Sheet Excel as 'DELETED'. Reason: "${deleteReason || 'Executive Action'}"`);
  };

  if (!currentUser) {
    return <LoginModal onLogin={handleLogin} />;
  }

  // Filter projects by logged-in user role (CEO & Sreylang see all; Staff see assigned only)
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
            onSaveProjectDetails={handleSaveProjectDetails}
          />
        ) : activeTab === 'CEO_PNL_TRACKER' ? (
          <CeoPnLTrackerView 
            currentUser={currentUser}
          />
        ) : activeTab === 'PROJECT_APPROVALS' ? (
          <ProjectApprovalsPortal 
            projects={roleFilteredProjects}
            currentUser={currentUser}
            onApproveProject={async (approvedProj) => {
              const updated = projects.map(p => (p.id === approvedProj.id || p.projectId === approvedProj.projectId) ? { ...p, ...approvedProj } : p);
              setProjects(updated);
              localStorage.setItem('tp_last_known_projects_v2', JSON.stringify(updated));
              broadcastProjectUpdate(updated);
              await syncProjectsDetailsToCloud(updated);

              showToast(`Project "${approvedProj.projectName}" Section C Financials approved by CEO Walter Dantis!`);

              if (syncCellToGoogleSheet) {
                await syncCellToGoogleSheet(gasUrl, {
                  gid: SHEET_GIDS.CRM,
                  rowIndex: approvedProj.rowIndex || 10,
                  columnIndex: 10,
                  value: 'In Progress'
                });
                if (approvedProj.contractValueUsd) {
                  await syncCellToGoogleSheet(gasUrl, {
                    gid: SHEET_GIDS.CRM,
                    rowIndex: approvedProj.rowIndex || 10,
                    columnIndex: 6,
                    value: `$${approvedProj.contractValueUsd}`
                  });
                }
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
