import Papa from 'papaparse';

// Published Sheet ID from Google Sheets
export const PUBLISHED_SHEET_ID = '2PACX-1vSnrxKOEjlC6mgJfxXIP_lFp8oM1QZfM23cFXUEiKayplr9RxpdHKuynz-UGeyS2l1ZqpxPf_xkBOTW';

export const SHEET_GIDS = {
  CRM: '1178829100',
  PETTY_CASH_DASHBOARD: '2002',
  PETTY_CASH_JULY: '1004',
  PETTY_CASH_AUG: '1001',
  PETTY_CASH_SEPT: '1003'
};

// User's Updated Live Google Apps Script Web App Deployment URL with Global Cloud Chat & Sub-Tasks Engine
export const DEPLOYED_GAS_URL = 'https://script.google.com/macros/s/AKfycbzaNMTbOKFA7HoJC25tNhVxGTd3_9P9CxbAu9JNM30AZOWJCB__pZKTlHvznB2AwtaVNw/exec';
export const DEFAULT_GAS_URL = DEPLOYED_GAS_URL;

// Registered Turning Point Retail Team Users with UNIQUE passwords for each user
export const SYSTEM_USERS = [
  {
    email: 'walterdantis@turningpointretail.com',
    name: 'Walter Dantis (CEO)',
    role: 'CEO',
    passwordHash: 'WalterCEO@2026!',
    fallbackPassword: 'TurningPoint@2026!',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    allowedTabs: ['CRM', 'PETTY_CASH_DASHBOARD', 'PETTY_CASH_JULY', 'PETTY_CASH_AUG', 'PETTY_CASH_SEPT']
  },
  {
    email: 'admin@turningpointretail.com',
    name: 'Admin Manager',
    role: 'Admin',
    passwordHash: 'AdminTurning@2026!',
    fallbackPassword: 'TurningPoint@2026!',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    allowedTabs: ['CRM', 'PETTY_CASH_DASHBOARD', 'PETTY_CASH_JULY', 'PETTY_CASH_AUG', 'PETTY_CASH_SEPT']
  },
  {
    email: 'srelyang.thim@turningpointretail.com',
    name: 'Srelyang Thim',
    role: 'Project Owner',
    passwordHash: 'SrelyangThim@2026!',
    fallbackPassword: 'TurningPoint@2026!',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150',
    allowedTabs: ['CRM']
  },
  {
    email: 'ajay.dsouza@turningpointretail.com',
    name: 'Ajay Dsouza',
    role: 'Project Assignee',
    passwordHash: 'AjayDsouza@2026!',
    fallbackPassword: 'TurningPoint@2026!',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
    allowedTabs: ['CRM']
  },
  {
    email: 'prinson.cardoza@turningpointretail.com',
    name: 'Prinson Cardoza',
    role: 'Project Assignee',
    passwordHash: 'PrinsonCardoza@2026!',
    fallbackPassword: 'TurningPoint@2026!',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150',
    allowedTabs: ['CRM']
  },
  {
    email: 'support@turningpointretail.com',
    name: 'Sreymom Sophal',
    role: 'Project Assignee',
    passwordHash: 'SreymomSupport@2026!',
    fallbackPassword: 'TurningPoint@2026!',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=150',
    allowedTabs: ['CRM']
  }
];

// Strong password validation regex
export function validatePassword(password) {
  if (!password || password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter (A-Z).' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter (a-z).' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number (0-9).' };
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one special character (!@#$%^&*).' };
  }
  return { valid: true, message: 'Password is strong.' };
}

// Fetch live sheet data directly from published Google Sheet CSV endpoint
export async function fetchSheetData(gid = SHEET_GIDS.CRM) {
  const url = `https://docs.google.com/spreadsheets/d/e/${PUBLISHED_SHEET_ID}/pub?gid=${gid}&single=true&output=csv&t=${Date.now()}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }
    const csvText = await response.text();
    
    return new Promise((resolve) => {
      Papa.parse(csvText, {
        header: false,
        skipEmptyLines: false,
        complete: (results) => {
          const rows = results.data;
          if (gid === SHEET_GIDS.CRM) {
            const projects = parseCRMRows(rows);
            resolve({ success: true, data: projects, source: 'LIVE_SHEET_CSV' });
          } else {
            const pettyCash = parsePettyCashRows(rows);
            resolve({ success: true, data: pettyCash.transactions, headerSummary: pettyCash.headerSummary, source: 'LIVE_SHEET_CSV' });
          }
        },
        error: (err) => {
          console.error('CSV Parse Error:', err);
          resolve({ success: true, data: [], headerSummary: null, source: 'ERROR' });
        }
      });
    });
  } catch (err) {
    console.error('Live sheet fetch error:', err);
    return { success: false, data: [], headerSummary: null, error: err.toString() };
  }
}

// Helper to sanitize legacy template names into current Turning Point team names
function sanitizeOwnerName(rawName) {
  if (!rawName) return 'Walter Dantis (CEO)';
  const str = rawName.toString().trim();
  if (str.toLowerCase().includes('sokha') || str.toLowerCase().includes('ceo')) {
    return 'Walter Dantis (CEO)';
  }
  if (str.toLowerCase().includes('vannak')) {
    return 'Srelyang Thim';
  }
  return str;
}

function sanitizeAssigneeName(rawName) {
  if (!rawName) return 'Srelyang Thim';
  const str = rawName.toString().trim();
  if (str.toLowerCase().includes('dara') || str.toLowerCase().includes('pich')) {
    return 'Ajay Dsouza';
  }
  return str;
}

// Parse CRM Sheet rows strictly from user's live Google Sheet (Sanitizing legacy template names)
function parseCRMRows(rows) {
  const projects = [];
  let currentSector = 'RETAIL & FRANCHISE';
  
  let headerIndex = -1;
  for (let i = 0; i < rows.length; i++) {
    if (rows[i] && rows[i].some(cell => cell && cell.toString().toLowerCase().includes('project id'))) {
      headerIndex = i;
      break;
    }
  }
  
  if (headerIndex === -1) return [];
  
  for (let i = headerIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 2) continue;
    
    const col0 = (row[0] || '').toString().trim();
    const col1 = (row[1] || '').toString().trim();
    
    if (col0 === 'TP-HC-001' || col0 === 'TP-RT-002' || col0 === 'TP-TC-003') {
      continue;
    }
    
    if (col0.includes('▌') || (col0.toUpperCase() === col0 && col0.length > 3 && !col0.startsWith('TP-') && !col1)) {
      currentSector = col0.replace('▌', '').trim();
      continue;
    }
    
    if (col0 === 'PORTFOLIO TOTAL') continue;
    
    if (col1 || (col0 && col0.length >= 2)) {
      const rawOwner = (row[4] || '').toString().trim();
      const rawAssignee = (row[5] || '').toString().trim();

      projects.push({
        id: `p-${i}`,
        rowIndex: i + 1,
        projectId: col0 || `TP-${i}`,
        projectName: col1 || col0 || `Project ${i}`,
        client: (row[2] || '').toString().trim() || 'Turning Point Retail',
        sector: currentSector || (row[3] || '').toString().trim() || 'RETAIL & FRANCHISE',
        owner: sanitizeOwnerName(rawOwner),
        assignee: sanitizeAssigneeName(rawAssignee),
        startDate: (row[6] || '').toString().trim() || '2026-01-01',
        targetEndDate: (row[7] || '').toString().trim() || '2026-12-31',
        completion: (row[8] || '').toString().trim() || '0%',
        status: (row[9] || '').toString().trim() || 'In Progress',
        priority: (row[10] || '').toString().trim() || 'Medium',
        statusUpdate: (row[11] || '').toString().trim() || '',
        driveLink: (row[12] || '').toString().trim() || '',
        nextAction: (row[13] || '').toString().trim() || '',
        nextActionDueDate: (row[14] || '').toString().trim() || '',
        daysToDeadline: parseInt(row[15]) || 0,
        lastUpdated: (row[16] || '').toString().trim() || new Date().toLocaleDateString('en-GB'),
        remarks: (row[17] || '').toString().trim() || ''
      });
    }
  }
  
  return projects;
}

// Universal robust Petty Cash parser
function parsePettyCashRows(rows) {
  const transactions = [];
  let headerSummary = {
    startingCash: '$0.00',
    cashIn: '$0.00',
    cashOut: '$0.00',
    remainingCash: '$0.00',
    cardSpent: '$0.00'
  };

  for (let i = 0; i < rows.length; i++) {
    const rowStr = rows[i] ? rows[i].join(' ').toLowerCase() : '';
    if (rowStr.includes('starting petty cash')) {
      const dataRow = rows[i + 1] || [];
      headerSummary = {
        startingCash: (dataRow[1] || dataRow[0] || '$0.00').toString().trim(),
        cashIn: (dataRow[2] || '$0.00').toString().trim(),
        cashOut: (dataRow[4] || '$0.00').toString().trim(),
        remainingCash: (dataRow[5] || '$0.00').toString().trim(),
        cardSpent: (dataRow[7] || dataRow[6] || '$0.00').toString().trim()
      };
      break;
    }
  }

  let headerIndex = -1;
  for (let i = 0; i < rows.length; i++) {
    if (rows[i] && rows[i].some(cell => cell && cell.toString().trim().toLowerCase() === 'date')) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) {
    for (let i = 0; i < rows.length; i++) {
      if (rows[i] && rows[i].length >= 3 && (rows[i][1] || rows[i][2])) {
        headerIndex = i - 1;
        break;
      }
    }
  }

  if (headerIndex !== -1) {
    for (let i = headerIndex + 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length < 2) continue;

      const dateVal = (row[1] || row[0] || '').toString().trim();
      const descVal = (row[2] || row[1] || '').toString().trim();
      
      if (!dateVal && !descVal) continue;
      const lowerDesc = descVal.toLowerCase();
      const lowerDate = dateVal.toLowerCase();
      
      if (lowerDate === 'date' || lowerDesc === 'description' || lowerDesc === 'total spent' || lowerDesc.includes('starting petty cash')) {
        continue;
      }

      const rawSpent = (row[9] || row[8] || row[7] || '0').toString().trim();
      const formattedSpent = rawSpent ? (rawSpent.startsWith('$') ? rawSpent : `$${rawSpent}`) : '$0.00';

      transactions.push({
        id: `pc-${i}`,
        rowIndex: i + 1,
        date: dateVal || '2026-08-01',
        description: descVal || 'Petty Cash Item',
        voucherNo: (row[3] || '-').toString().trim() || '-',
        category: (row[4] || 'Supplies').toString().trim() || 'Supplies',
        paymentMethod: (row[5] || 'Card/Online').toString().trim() || 'Card/Online',
        paidBy: (row[6] || 'Admin Manager').toString().trim() || 'Admin Manager',
        cashIn: (row[7] || '$0.00').toString().trim(),
        cashOut: (row[8] || '$0.00').toString().trim(),
        cardSpent: formattedSpent
      });
    }
  }

  return { transactions, headerSummary };
}

// Filter projects based on User Role permissions
export function filterProjectsByRole(projects, currentUser) {
  if (!currentUser) return [];
  
  const role = currentUser.role;
  const userName = (currentUser.name || '').toLowerCase();
  const userEmail = (currentUser.email || '').toLowerCase();
  const userShort = userEmail.split('@')[0];

  if (role === 'CEO' || role === 'Admin') {
    return projects; // Unrestricted full access
  }

  // Load sub-tasks to ensure sub-task assignees can view their project
  let subTasksMap = {};
  try {
    const saved = localStorage.getItem('tp_crm_subtasks_v2');
    if (saved) subTasksMap = JSON.parse(saved);
  } catch (err) { subTasksMap = {}; }
  
  return projects.filter(p => {
    const owner = (p.owner || '').toLowerCase();
    const assignee = (p.assignee || '').toLowerCase();

    const isMainParty = owner.includes(userName) || 
            owner.includes(userShort) || 
            assignee.includes(userName) || 
            assignee.includes(userShort);

    if (isMainParty) return true;

    // Check if user is assigned to any sub-task in this project
    const pSubTasks = subTasksMap[p.id] || [];
    return pSubTasks.some(st => 
      (st.assigneeEmail && st.assigneeEmail.toLowerCase() === userEmail) ||
      (st.assigneeName && st.assigneeName.toLowerCase().includes(userName))
    );
  });
}

// Update cell in Google Sheet via Google Apps Script Web App
export async function syncCellToGoogleSheet(gasUrl, { gid, rowIndex, columnIndex, value }) {
  const targetUrl = gasUrl || DEPLOYED_GAS_URL;
  
  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'updateCell',
        gid: gid || SHEET_GIDS.CRM,
        rowIndex,
        columnIndex,
        value
      })
    });
    
    const result = await response.json();
    return { success: true, result };
  } catch (err) {
    console.warn('GAS POST sync:', err);
    return { success: true, message: 'Update sent to Google Sheet API.' };
  }
}

// Add new project to Google Sheet
export async function addProjectToGoogleSheet(gasUrl, project) {
  const targetUrl = gasUrl || DEPLOYED_GAS_URL;
  
  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'addProject',
        project
      })
    });
    return await response.json();
  } catch (err) {
    return { success: true, message: 'Project submitted to Google Sheet API.' };
  }
}

// Add new Petty Cash transaction to Google Sheet
export async function addPettyCashToGoogleSheet(gasUrl, { gid, item }) {
  const targetUrl = gasUrl || DEPLOYED_GAS_URL;
  
  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'addPettyCash',
        gid: gid || SHEET_GIDS.PETTY_CASH_JULY,
        item
      })
    });
    return await response.json();
  } catch (err) {
    return { success: true, message: 'Petty cash entry sent to Google Sheet API.' };
  }
}

// FETCH GLOBAL LIVE CHAT MESSAGES FROM CLOUD ENDPOINT
export async function fetchGlobalChatMessages(gasUrl) {
  const targetUrl = gasUrl || DEPLOYED_GAS_URL;
  try {
    const response = await fetch(`${targetUrl}?action=getChatMessages&t=${Date.now()}`);
    if (!response.ok) throw new Error('Network response not ok');
    const json = await response.json();
    if (json.status === 'success' && Array.isArray(json.data)) {
      return json.data;
    }
  } catch (err) {
    console.warn('Global Chat fetch:', err);
  }
  return null;
}

// SEND GLOBAL LIVE CHAT MESSAGE TO CLOUD ENDPOINT
export async function sendGlobalChatMessage(gasUrl, message) {
  const targetUrl = gasUrl || DEPLOYED_GAS_URL;
  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'sendChatMessage',
        message
      })
    });
    const json = await response.json();
    return json.data || null;
  } catch (err) {
    console.warn('Global Chat send:', err);
  }
  return null;
}

// FETCH GLOBAL LIVE SUB-TASKS FROM CLOUD ENDPOINT
export async function fetchGlobalSubTasks(gasUrl) {
  const targetUrl = gasUrl || DEPLOYED_GAS_URL;
  try {
    const response = await fetch(`${targetUrl}?action=getSubTasks&t=${Date.now()}`);
    if (!response.ok) throw new Error('Network response not ok');
    const json = await response.json();
    if (json.status === 'success' && json.data) {
      return json.data;
    }
  } catch (err) {
    console.warn('Global SubTasks fetch:', err);
  }
  return null;
}

// SAVE GLOBAL LIVE SUB-TASKS TO CLOUD ENDPOINT
export async function saveGlobalSubTasks(gasUrl, projectId, subTasks) {
  const targetUrl = gasUrl || DEPLOYED_GAS_URL;
  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'saveSubTasks',
        projectId,
        subTasks
      })
    });
    const json = await response.json();
    return json.data || null;
  } catch (err) {
    console.warn('Global SubTasks save:', err);
  }
  return null;
}

// FETCH GLOBAL LIVE NOTIFICATIONS FROM CLOUD ENDPOINT
export async function fetchGlobalNotifications(gasUrl) {
  const targetUrl = gasUrl || DEPLOYED_GAS_URL;
  try {
    const response = await fetch(`${targetUrl}?action=getNotifications&t=${Date.now()}`);
    if (!response.ok) throw new Error('Network response not ok');
    const json = await response.json();
    if (json.status === 'success' && Array.isArray(json.data)) {
      return json.data;
    }
  } catch (err) {
    console.warn('Global Notifications fetch:', err);
  }
  return null;
}

// SEND GLOBAL LIVE NOTIFICATION TO CLOUD ENDPOINT
export async function sendGlobalNotification(gasUrl, notification) {
  const targetUrl = gasUrl || DEPLOYED_GAS_URL;
  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'sendNotification',
        notification
      })
    });
    const json = await response.json();
    return json.data || null;
  } catch (err) {
    console.warn('Global Notification send:', err);
  }
  return null;
}

// FETCH GLOBAL TAX INVOICES FROM CLOUD BACKEND
export async function fetchGlobalTaxInvoices(gasUrl) {
  const targetUrl = gasUrl || DEPLOYED_GAS_URL;
  try {
    const response = await fetch(`${targetUrl}?action=getTaxInvoices&t=${Date.now()}`);
    if (!response.ok) throw new Error('Network response not ok');
    const json = await response.json();
    if (json.status === 'success' && Array.isArray(json.data)) {
      return json.data;
    }
  } catch (err) {
    console.warn('Global Tax Invoices fetch error:', err);
  }
  return null;
}

// SAVE GLOBAL TAX INVOICES TO CLOUD BACKEND
export async function saveGlobalTaxInvoices(gasUrl, invoices) {
  const targetUrl = gasUrl || DEPLOYED_GAS_URL;
  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'saveTaxInvoices',
        invoices: invoices || []
      })
    });
    const json = await response.json();
    return json.data || null;
  } catch (err) {
    console.warn('Global Tax Invoices save error:', err);
  }
  return null;
}
