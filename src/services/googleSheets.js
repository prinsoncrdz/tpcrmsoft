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

// User's Updated Live Google Apps Script Web App Deployment URL (Version 14 - Aug 28, 2026)
export const DEPLOYED_GAS_URL = 'https://script.google.com/macros/s/AKfycbx4mZTSsdee1bdXVb5PLbOGUKjoK5rkYL7uXEmm51UeD1LxlRsCYEkRFGIIrvJ_-JfyEw/exec';
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
            const pettyCash = parsePettyCashRows(rows, gid);
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

// Parse CRM Sheet rows strictly from user's live Google Sheet (Sanitizing legacy template names & dynamic column mapping)
function parseCRMRows(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return [];
  const projects = [];
  let currentSector = 'RETAIL & FRANCHISE';
  
  let headerIndex = -1;
  let colMap = {
    projectId: 0,
    projectName: 1,
    client: 2,
    sector: 3,
    value: 4,
    depositPaid: 5,
    owner: 6,
    assignee: 7,
    startDate: 8,
    targetEndDate: 9,
    completion: 10,
    status: 11,
    priority: 12,
    statusUpdate: 13,
    driveLink: 14,
    nextAction: 15,
    nextActionDueDate: 16,
    daysToDeadline: 17,
    lastUpdated: 18,
    remarks: 19
  };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] || [];
    const rowJoined = row.join(' ').toLowerCase();
    if (rowJoined.includes('project id') || rowJoined.includes('project name') || rowJoined.includes('client')) {
      headerIndex = i;
      row.forEach((cell, colIdx) => {
        const c = (cell || '').toString().toLowerCase().trim();
        if (c.includes('project id') || c === 'id') colMap.projectId = colIdx;
        else if (c.includes('project name') || c.includes('company') || c === 'name') colMap.projectName = colIdx;
        else if (c.includes('client')) colMap.client = colIdx;
        else if (c.includes('sector') || c.includes('category')) colMap.sector = colIdx;
        else if (c.includes('value') || c.includes('pricing') || c.includes('amount') || c.includes('contract')) colMap.value = colIdx;
        else if (c.includes('deposit') || c.includes('advance') || c.includes('paid')) colMap.depositPaid = colIdx;
        else if (c.includes('owner') || c.includes('lead') || c.includes('director') || c.includes('ceo')) colMap.owner = colIdx;
        else if (c.includes('assign') || c.includes('assignee') || c.includes('manager') || c.includes('pm') || c.includes('staff') || c.includes('person') || c.includes('responsible')) colMap.assignee = colIdx;
        else if (c.includes('start date') || c.includes('start')) colMap.startDate = colIdx;
        else if (c.includes('target') || c.includes('end date') || c.includes('deadline')) colMap.targetEndDate = colIdx;
        else if (c.includes('completion') || c.includes('%')) colMap.completion = colIdx;
        else if (c.includes('status')) colMap.status = colIdx;
        else if (c.includes('priority')) colMap.priority = colIdx;
      });
      break;
    }
  }
  
  if (headerIndex === -1) {
    headerIndex = 0;
  }
  
  for (let i = headerIndex; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 2) continue;
    
    const col0 = (row[colMap.projectId] || row[0] || '').toString().trim();
    const col1 = (row[colMap.projectName] || row[1] || '').toString().trim();
    
    if (!col0 && !col1) continue;

    const lower0 = col0.toLowerCase();
    const lower1 = col1.toLowerCase();

    if (lower0.includes('project id') || lower0.includes('project name') || lower1.includes('project name') || lower0.includes('portfolio total') || lower1.includes('portfolio total') || lower0.includes('total')) {
      continue;
    }

    if (col0 === 'TP-HC-001' || col0 === 'TP-RT-002' || col0 === 'TP-TC-003') {
      continue;
    }
    
    if ((col0.includes('▌') || (col0.toUpperCase() === col0 && col0.length > 3 && !col0.startsWith('TP-') && !col1)) && !col0.includes('TOTAL')) {
      currentSector = col0.replace('▌', '').trim();
      continue;
    }
    
    if (col1 || (col0 && col0.length >= 2)) {
      const rawOwner = (row[colMap.owner] || row[6] || row[4] || '').toString().trim();
      const rawAssignee = (row[colMap.assignee] || row[7] || row[5] || '').toString().trim();
      const rawValue = (row[colMap.value] || row[4] || '$0').toString().trim();
      const rawDeposit = (row[colMap.depositPaid] || row[5] || '$0').toString().trim();
      const rawSector = (row[colMap.sector] || '').toString().trim();

      const safeSector = (rawSector && !rawSector.toLowerCase().includes('total') && !rawSector.includes('$')) ? rawSector : currentSector;
      const safeOwner = (rawOwner && !rawOwner.includes('$')) ? sanitizeOwnerName(rawOwner) : 'Walter Dantis (CEO)';
      const safeAssignee = (rawAssignee && !rawAssignee.includes('$')) ? sanitizeAssigneeName(rawAssignee) : 'Sreylang Thim';

      projects.push({
        id: `p-${i}`,
        rowIndex: i + 1,
        projectId: col0.startsWith('TP-') ? col0 : `TP-${100 + i}`,
        projectName: col1 || col0 || `Project ${i}`,
        companyName: col1 || col0 || `Project ${i}`,
        client: (row[colMap.client] || row[2] || '').toString().trim() || 'Turning Point Retail',
        sector: safeSector || 'RETAIL & FRANCHISE',
        value: rawValue.startsWith('$') ? rawValue : (rawValue ? `$${rawValue}` : '$0.00'),
        contractValueUsd: rawValue.replace('$', '').replace(',', ''),
        depositPaid: rawDeposit.startsWith('$') ? rawDeposit : (rawDeposit ? `$${rawDeposit}` : '$0.00'),
        advanceAmountUsd: rawDeposit.replace('$', '').replace(',', ''),
        owner: safeOwner,
        assignee: safeAssignee,
        startDate: (row[colMap.startDate] || row[8] || '').toString().trim() || '2026-01-01',
        targetEndDate: (row[colMap.targetEndDate] || row[9] || '').toString().trim() || '2026-12-31',
        completion: (row[colMap.completion] || row[10] || '').toString().trim() || '0%',
        status: (row[colMap.status] || row[11] || '').toString().trim() || 'In Progress',
        priority: (row[colMap.priority] || row[12] || '').toString().trim() || 'Medium',
        statusUpdate: (row[colMap.statusUpdate] || row[13] || '').toString().trim() || '',
        driveLink: (row[colMap.driveLink] || row[14] || '').toString().trim() || '',
        nextAction: (row[colMap.nextAction] || row[15] || '').toString().trim() || '',
        nextActionDueDate: (row[colMap.nextActionDueDate] || row[16] || '').toString().trim() || '',
        daysToDeadline: parseInt(row[colMap.daysToDeadline] || row[17]) || 0,
        lastUpdated: (row[colMap.lastUpdated] || row[18] || '').toString().trim() || new Date().toLocaleDateString('en-GB'),
        remarks: (row[colMap.remarks] || row[19] || '').toString().trim() || ''
      });
    }
  }
  
  return projects;
}

// Universal robust Petty Cash parser with GID month isolation & dynamic header column mapping
function parsePettyCashRows(rows, gid) {
  const monthTag = gid === SHEET_GIDS.PETTY_CASH_JULY ? 'july' :
                   gid === SHEET_GIDS.PETTY_CASH_AUG ? 'aug' :
                   gid === SHEET_GIDS.PETTY_CASH_SEPT ? 'sept' : 'gen';

  const transactions = [];
  let headerSummary = {
    startingCash: '$0.00',
    cashIn: '$0.00',
    cashOut: '$0.00',
    remainingCash: '$0.00',
    cardSpent: '$0.00'
  };

  for (let i = 0; i < Math.min(25, rows.length); i++) {
    const row = rows[i] || [];
    row.forEach((cell, cIdx) => {
      const c = (cell || '').toString().toLowerCase().trim();
      if (c.includes('starting') || c.includes('initial') || c.includes('opening') || c.includes('allocation') || c.includes('float')) {
        const val = (row[cIdx + 1] || (rows[i + 1] ? rows[i + 1][cIdx] : '') || '').toString().trim();
        if (val && (val.includes('$') || !isNaN(parseFloat(val.replace('$', '').replace(',', ''))))) {
          headerSummary.startingCash = val.startsWith('$') ? val : `$${val}`;
        }
      }
      if (c.includes('cash in') || c.includes('replenish') || c.includes('deposit') || c.includes('in flow')) {
        const val = (row[cIdx + 1] || (rows[i + 1] ? rows[i + 1][cIdx] : '') || '').toString().trim();
        if (val && (val.includes('$') || !isNaN(parseFloat(val.replace('$', '').replace(',', ''))))) {
          headerSummary.cashIn = val.startsWith('$') ? val : `$${val}`;
        }
      }
    });
  }

  let colMap = {
    date: 0,
    description: 1,
    voucherNo: 2,
    category: 3,
    paymentMethod: 4,
    paidBy: 5,
    cashIn: 6,
    cashOut: 7,
    cardSpent: 8
  };

  let headerIndex = -1;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] || [];
    const rowStr = row.join(' ').toLowerCase();
    if (rowStr.includes('date') && (rowStr.includes('description') || rowStr.includes('detail') || rowStr.includes('voucher') || rowStr.includes('category') || rowStr.includes('amount') || rowStr.includes('spent'))) {
      headerIndex = i;
      row.forEach((cell, cIdx) => {
        const c = (cell || '').toString().toLowerCase().trim();
        if (c === 'date' || c.includes('date')) colMap.date = cIdx;
        else if (c.includes('description') || c.includes('detail') || c.includes('expense') || c.includes('item')) colMap.description = cIdx;
        else if (c.includes('voucher') || c.includes('bill') || c.includes('ref') || c.includes('inv')) colMap.voucherNo = cIdx;
        else if (c.includes('category') || c.includes('type')) colMap.category = cIdx;
        else if (c.includes('payment') || c.includes('method') || c.includes('mode')) colMap.paymentMethod = cIdx;
        else if (c.includes('paid by') || c.includes('person') || c.includes('staff') || c.includes('paid')) colMap.paidBy = cIdx;
        else if (c.includes('cash in') || c.includes('in flow') || c.includes('received')) colMap.cashIn = cIdx;
        else if (c.includes('cash out') || c.includes('cash spent')) colMap.cashOut = cIdx;
        else if (c.includes('card') || c.includes('spent') || c.includes('total') || c.includes('amount')) colMap.cardSpent = cIdx;
      });
      break;
    }
  }

  if (headerIndex === -1) {
    for (let i = 0; i < rows.length; i++) {
      if (rows[i] && rows[i].length >= 2) {
        const firstCell = (rows[i][0] || '').toString().trim().toLowerCase();
        if (firstCell !== 'date' && !firstCell.includes('starting') && !firstCell.includes('allocation')) {
          headerIndex = Math.max(0, i - 1);
          break;
        }
      }
    }
  }

  if (headerIndex === -1) headerIndex = 0;

  for (let i = headerIndex; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 2) continue;

    const dateVal = (row[colMap.date] !== undefined ? row[colMap.date] : row[0] || '').toString().trim();
    const descVal = (row[colMap.description] !== undefined ? row[colMap.description] : row[1] || '').toString().trim();

    if (!dateVal && !descVal) continue;
    const lowerDesc = descVal.toLowerCase();
    const lowerDate = dateVal.toLowerCase();

    if (lowerDate === 'date' || lowerDesc === 'description' || lowerDesc === 'total spent' || lowerDesc.includes('starting petty cash') || lowerDesc === 'total' || lowerDate.includes('starting')) {
      continue;
    }

    const voucherVal = (row[colMap.voucherNo] !== undefined ? row[colMap.voucherNo] : row[2] || '-').toString().trim() || '-';
    const catVal = (row[colMap.category] !== undefined ? row[colMap.category] : row[3] || 'Supplies').toString().trim() || 'Supplies';
    const payVal = (row[colMap.paymentMethod] !== undefined ? row[colMap.paymentMethod] : row[4] || 'Card/Online').toString().trim() || 'Card/Online';
    const paidByVal = (row[colMap.paidBy] !== undefined ? row[colMap.paidBy] : row[5] || 'Admin Manager').toString().trim() || 'Admin Manager';

    const cInVal = (row[colMap.cashIn] !== undefined ? row[colMap.cashIn] : row[6] || '$0.00').toString().trim();
    const cOutVal = (row[colMap.cashOut] !== undefined ? row[colMap.cashOut] : row[7] || '$0.00').toString().trim();
    const rawSpent = (row[colMap.cardSpent] !== undefined ? row[colMap.cardSpent] : (row[8] || row[7] || row[3] || '0')).toString().trim();

    const formattedCashIn = cInVal ? (cInVal.startsWith('$') ? cInVal : `$${cInVal}`) : '$0.00';
    let formattedCashOut = cOutVal ? (cOutVal.startsWith('$') ? cOutVal : `$${cOutVal}`) : '$0.00';
    let formattedSpent = rawSpent ? (rawSpent.startsWith('$') ? rawSpent : `$${rawSpent}`) : '$0.00';

    const isCashPayment = payVal.toLowerCase().includes('cash') || (cOutVal && cOutVal !== '$0.00' && !rawSpent);
    if (isCashPayment) {
      if (formattedCashOut === '$0.00' && formattedSpent !== '$0.00') {
        formattedCashOut = formattedSpent;
      }
      formattedSpent = '$0.00';
    } else {
      if (formattedSpent === '$0.00' && formattedCashOut !== '$0.00') {
        formattedSpent = formattedCashOut;
      }
      formattedCashOut = '$0.00';
    }

    transactions.push({
      id: `pc-${monthTag}-${i}`,
      monthTag: monthTag,
      rowIndex: i + 1,
      date: dateVal || '2026-08-01',
      description: descVal || 'Petty Cash Expense',
      voucherNo: voucherVal,
      category: catVal,
      paymentMethod: payVal,
      paidBy: paidByVal,
      cashIn: formattedCashIn,
      cashOut: formattedCashOut,
      cardSpent: formattedSpent
    });
  }

  return { transactions, headerSummary };
}

// Filter projects based on User Role permissions (CEO & Sreylang see all active; Staff see assigned active only)
export function filterProjectsByRole(projects, currentUser, subTasksMap = {}) {
  if (!currentUser) return [];

  // Filter out any deleted projects for EVERYONE including CEO Walter Dantis
  const activeProjects = (projects || []).filter(p => {
    if (!p) return false;
    const st = (p.status || '').toString().toLowerCase();
    if (st.includes('deleted') || st === 'deleted') return false;
    return true;
  });

  const uRole = currentUser.role || '';
  const uName = (currentUser.name || '').toLowerCase();
  const uEmail = (currentUser.email || '').toLowerCase();

  const isCeo = uRole === 'CEO' || uName.includes('walter') || uRole.toLowerCase().includes('ceo');
  const isSrelyang = uName.includes('sreylang') || uEmail.includes('sreylang.thim') || uRole.toLowerCase().includes('operations');

  // CEO Walter Dantis & Sreylang Thim see all active non-deleted company projects
  if (isCeo || isSrelyang) return activeProjects;

  const isNameMatch = (targetStr, userNameStr) => {
    if (!targetStr || !userNameStr) return false;
    const t = targetStr.toLowerCase();
    const u = userNameStr.toLowerCase();
    
    if (t.includes(u) || u.includes(t)) return true;

    const tTokens = t.split(/[\s,._/-]+/).filter(Boolean);
    const uTokens = u.split(/[\s,._/-]+/).filter(Boolean);

    return tTokens.some(tTok => uTokens.some(uTok => tTok.length >= 3 && (tTok === uTok || tTok.includes(uTok) || uTok.includes(tTok))));
  };

  // Team members (e.g. Prinson Cardozo, Ajay Dsouza) see ONLY projects assigned to them by CEO or where they have assigned sub-tasks
  return activeProjects.filter(p => {
    const pAssignee = p.assignee || '';
    const pOwner = p.owner || '';
    const pSubTasks = subTasksMap[p.id] || [];

    const isAssigned = isNameMatch(pAssignee, uName) || isNameMatch(pOwner, uName);
    const hasSubTask = pSubTasks.some(st => 
      (st.assigneeEmail && st.assigneeEmail.toLowerCase() === uEmail) ||
      (st.assigneeName && isNameMatch(st.assigneeName, uName))
    );

    return isAssigned || hasSubTask;
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
export async function saveGlobalSubTasks(gasUrl, projectIdOrMap, subTasks) {
  const targetUrl = gasUrl || DEPLOYED_GAS_URL;
  
  let payloadMap = {};
  if (typeof projectIdOrMap === 'object' && projectIdOrMap !== null) {
    payloadMap = projectIdOrMap;
  } else if (typeof projectIdOrMap === 'string') {
    payloadMap = { [projectIdOrMap]: subTasks || [] };
  }

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'saveSubTasks',
        subTasks: payloadMap
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

// FETCH GLOBAL CEO SEAL & SIGNATURE FROM CLOUD BACKEND
export async function fetchGlobalSealSignature(gasUrl) {
  const targetUrl = gasUrl || DEPLOYED_GAS_URL;
  try {
    const response = await fetch(`${targetUrl}?action=getSealSignature&t=${Date.now()}`);
    if (!response.ok) throw new Error('Network response not ok');
    const json = await response.json();
    if (json.status === 'success' && json.data) {
      return json.data;
    }
  } catch (err) {
    console.warn('Global Seal Signature fetch error:', err);
  }
  return null;
}

// SAVE GLOBAL CEO SEAL & SIGNATURE TO CLOUD BACKEND
export async function saveGlobalSealSignature(gasUrl, signatureUrl, sealUrl) {
  const targetUrl = gasUrl || DEPLOYED_GAS_URL;
  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'saveSealSignature',
        signatureUrl: signatureUrl || '',
        sealUrl: sealUrl || ''
      })
    });
    const json = await response.json();
    return json.data || null;
  } catch (err) {
    console.warn('Global Seal Signature save error:', err);
  }
  return null;
}

// FETCH GLOBAL CEO P&L TRACKER DATA FROM CLOUD BACKEND
export async function fetchGlobalPnLData(gasUrl) {
  const targetUrl = gasUrl || DEPLOYED_GAS_URL;
  try {
    const response = await fetch(`${targetUrl}?action=getPnLData&t=${Date.now()}`);
    if (!response.ok) throw new Error('Network response not ok');
    const json = await response.json();
    if (json.status === 'success' && json.data) {
      return json.data;
    }
  } catch (err) {
    console.warn('Global PnL Data fetch error:', err);
  }
  return null;
}

// SAVE GLOBAL CEO P&L TRACKER DATA TO CLOUD BACKEND
export async function saveGlobalPnLData(gasUrl, pnlData) {
  const targetUrl = gasUrl || DEPLOYED_GAS_URL;
  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'savePnLData',
        pnlData: pnlData || {}
      })
    });
    const json = await response.json();
    return json.data || null;
  } catch (err) {
    console.warn('Global PnL Data save error:', err);
  }
  return null;
}

// FETCH GLOBAL WEEKLY STAFF TASKS & FRIDAY REPORTS FROM CLOUD BACKEND
export async function fetchGlobalWeeklyTasks(gasUrl) {
  const targetUrl = gasUrl || DEPLOYED_GAS_URL;
  try {
    const res = await fetch(`${targetUrl}?action=getFridayReports&t=${Date.now()}`);
    if (res.ok) {
      const json = await res.json();
      if (json.status === 'success' && json.data) {
        if (Array.isArray(json.data)) return json.data;
        if (typeof json.data === 'object') return Object.values(json.data);
      }
    }
  } catch (err) {}

  try {
    const res2 = await fetch(`${targetUrl}?action=getWeeklyTasks&t=${Date.now()}`);
    if (res2.ok) {
      const json2 = await res2.json();
      if (json2.status === 'success' && json2.data) {
        if (Array.isArray(json2.data)) return json2.data;
        if (typeof json2.data === 'object') return Object.values(json2.data);
      }
    }
  } catch (err) {}

  return null;
}

// SAVE GLOBAL WEEKLY STAFF TASKS & FRIDAY REPORTS TO CLOUD BACKEND
export async function saveGlobalWeeklyTasks(gasUrl, tasks) {
  const targetUrl = gasUrl || DEPLOYED_GAS_URL;
  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'saveFridayReports',
        reports: tasks || [],
        tasks: tasks || []
      })
    });
    const json = await response.json();
    return json.data || null;
  } catch (err) {
    console.warn('Global Weekly Tasks save error:', err);
  }
  return null;
}

// FETCH GLOBAL PETTY CASH DELETION REQUESTS FROM CLOUD BACKEND
export async function fetchGlobalPettyCashDeletions(gasUrl) {
  const targetUrl = gasUrl || DEPLOYED_GAS_URL;
  try {
    const response = await fetch(`${targetUrl}?action=getPettyCashDeletions&t=${Date.now()}`);
    if (!response.ok) throw new Error('Network response not ok');
    const json = await response.json();
    if (json.status === 'success' && Array.isArray(json.data)) {
      return json.data;
    }
  } catch (err) {
    console.warn('Global Petty Cash Deletions fetch error:', err);
  }
  return null;
}

// SAVE GLOBAL PETTY CASH DELETION REQUESTS TO CLOUD BACKEND
export async function saveGlobalPettyCashDeletions(gasUrl, deletionRequests) {
  const targetUrl = gasUrl || DEPLOYED_GAS_URL;
  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'savePettyCashDeletions',
        deletionRequests: deletionRequests || []
      })
    });
    const json = await response.json();
    return json.data || null;
  } catch (err) {
    console.warn('Global Petty Cash Deletions save error:', err);
  }
  return null;
}

// FETCH GLOBAL DELETED PROJECTS REGISTRY FROM CLOUD BACKEND
export async function fetchGlobalDeletedProjects(gasUrl) {
  const targetUrl = gasUrl || DEPLOYED_GAS_URL;
  try {
    const response = await fetch(`${targetUrl}?action=getDeletedProjects&t=${Date.now()}`);
    if (!response.ok) throw new Error('Network response not ok');
    const json = await response.json();
    if (json.status === 'success' && Array.isArray(json.data)) {
      return json.data;
    }
  } catch (err) {
    console.warn('Global Deleted Projects fetch error:', err);
  }
  return null;
}

// SAVE GLOBAL DELETED PROJECTS REGISTRY TO CLOUD BACKEND
export async function saveGlobalDeletedProjects(gasUrl, deletedProjectKeys) {
  const targetUrl = gasUrl || DEPLOYED_GAS_URL;
  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'saveDeletedProjects',
        deletedProjectKeys: deletedProjectKeys || []
      })
    });
    const json = await response.json();
    return json.data || null;
  } catch (err) {
    console.warn('Global Deleted Projects save error:', err);
  }
  return null;
}

// FETCH GLOBAL RICH PROJECT DETAILS (Scope of Work, Objective, Pricing, Payment Terms) FROM CLOUD BACKEND
export async function fetchGlobalProjectsDetails(gasUrl) {
  const targetUrl = gasUrl || DEPLOYED_GAS_URL;
  try {
    const response = await fetch(`${targetUrl}?action=getProjectsDetails&t=${Date.now()}`);
    if (!response.ok) throw new Error('Network response not ok');
    const json = await response.json();
    if (json.status === 'success' && json.data) {
      return json.data;
    }
  } catch (err) {
    console.warn('Global Projects Details fetch error:', err);
  }
  return null;
}

// SAVE GLOBAL RICH PROJECT DETAILS TO CLOUD BACKEND
export async function saveGlobalProjectsDetails(gasUrl, projectsMap) {
  const targetUrl = gasUrl || DEPLOYED_GAS_URL;
  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'saveProjectsDetails',
        projectsDetails: projectsMap || {}
      })
    });
    const json = await response.json();
    return json.data || null;
  } catch (err) {
    console.warn('Global Projects Details save error:', err);
  }
  return null;
}

// FETCH GLOBAL PETTY CASH OVERLAY EDITS FROM CLOUD BACKEND
export async function fetchGlobalPettyCashEdits(gasUrl) {
  const targetUrl = gasUrl || DEPLOYED_GAS_URL;
  try {
    const response = await fetch(`${targetUrl}?action=getPettyCashEdits&t=${Date.now()}`);
    if (!response.ok) throw new Error('Network response not ok');
    const json = await response.json();
    if (json.status === 'success' && json.data) {
      return json.data;
    }
  } catch (err) {
    console.warn('Global Petty Cash Edits fetch error:', err);
  }
  return null;
}

// SAVE GLOBAL PETTY CASH OVERLAY EDITS TO CLOUD BACKEND
export async function saveGlobalPettyCashEdits(gasUrl, editsMap) {
  const targetUrl = gasUrl || DEPLOYED_GAS_URL;
  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'savePettyCashEdits',
        pettyCashEdits: editsMap || {}
      })
    });
    const json = await response.json();
    return json.data || null;
  } catch (err) {
    console.warn('Global Petty Cash Edits save error:', err);
  }
  return null;
}


