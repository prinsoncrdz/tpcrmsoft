import React, { useState, useEffect } from 'react';
import { Lock, ShieldAlert, DollarSign, Calendar, CheckCircle2, TrendingUp, RefreshCw, Plus, PieChart, BarChart3, CreditCard, Wallet, Layers, Eye, Table, ArrowUpRight, ArrowDownRight, Tag, User, Printer, FileText, Trash2, Edit2, Save, AlertTriangle, Check, X, Clock, Send, ShieldCheck, AlertCircle } from 'lucide-react';
import { fetchSheetData, SHEET_GIDS, PUBLISHED_SHEET_ID, sendGlobalNotification, fetchGlobalPettyCashDeletions, saveGlobalPettyCashDeletions, fetchGlobalPettyCashEdits, saveGlobalPettyCashEdits, syncCellToGoogleSheet } from '../services/googleSheets';

const DELETION_REQUESTS_KEY = 'tp_petty_cash_deletion_requests_v2';
const PETTY_EDITS_KEY = 'tp_petty_cash_edits_v1';

export default function PettyCashView({ activeTab, currentUser, onOpenNewPettyCashModal, refreshTrigger }) {
  const isAuthorized = currentUser?.role === 'CEO' || currentUser?.role === 'Admin';
  const isCeo = currentUser?.role === 'CEO' || 
                (currentUser?.name || '').toLowerCase().includes('walter') || 
                (currentUser?.email || '').toLowerCase().includes('walterdantis') || 
                (currentUser?.role || '').toLowerCase().includes('ceo');

  const [julyData, setJulyData] = useState([]);
  const [augData, setAugData] = useState([]);
  const [septData, setSeptData] = useState([]);
  const [activeTabData, setActiveTabData] = useState([]);
  const [headerSummary, setHeaderSummary] = useState({
    startingCash: '$0.00',
    cashIn: '$0.00',
    cashOut: '$0.00',
    remainingCash: '$0.00',
    cardSpent: '$0.00'
  });
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('ANALYTICS');

  // Custom Header Allocations Editing State
  const PETTY_HEADER_KEY = 'tp_petty_cash_header_summary_v2';
  const [customHeader, setCustomHeader] = useState(() => {
    try {
      const saved = localStorage.getItem('tp_petty_cash_header_summary_v2');
      return saved ? JSON.parse(saved) : null;
    } catch(e) {
      return null;
    }
  });
  const [showEditHeaderModal, setShowEditHeaderModal] = useState(false);
  const [headerFormData, setHeaderFormData] = useState({
    startingCash: '0.00',
    cashIn: '0.00'
  });

  // Deletions Registry
  const [deletionRequests, setDeletionRequests] = useState([]);
  
  // Petty Cash Editing State
  const [editingItem, setEditingItem] = useState(null);
  const [editFormData, setEditFormData] = useState({
    date: '',
    description: '',
    voucherNo: '',
    category: '',
    paymentMethod: '',
    paidBy: '',
    amountSpent: ''
  });

  const isDashboardTab = activeTab === 'PETTY_CASH_DASHBOARD';

  const tabTitles = {
    PETTY_CASH_DASHBOARD: 'Petty Cash Executive Graphics Dashboard (gid=2002)',
    PETTY_CASH_JULY: 'July 2026 Petty Cash Transactions (gid=1004)',
    PETTY_CASH_AUG: 'August 2026 Petty Cash Transactions (gid=1001)',
    PETTY_CASH_SEPT: 'September 2026 Petty Cash Transactions (gid=1003)'
  };

  // Real-time Cloud + BroadcastChannel Sync for Deletions & Edits
  const loadDeletionRequests = async () => {
    try {
      const cloud = await fetchGlobalPettyCashDeletions();
      const saved = localStorage.getItem(DELETION_REQUESTS_KEY);
      let local = saved ? JSON.parse(saved) : [];

      if (Array.isArray(cloud)) {
        const map = new Map();
        (local || []).forEach(r => map.set(r.id, r));
        (cloud || []).forEach(r => map.set(r.id, r));
        const merged = Array.from(map.values());
        setDeletionRequests(merged);
        localStorage.setItem(DELETION_REQUESTS_KEY, JSON.stringify(merged));
      } else if (local.length > 0) {
        setDeletionRequests(local);
      }
    } catch (e) {}
  };

  useEffect(() => {
    loadDeletionRequests();
    const interval = setInterval(loadDeletionRequests, 1000);

    let bc;
    try {
      bc = new BroadcastChannel('tp_petty_cash_deletions_channel');
      bc.onmessage = (event) => {
        if (event.data && Array.isArray(event.data.deletionRequests)) {
          setDeletionRequests(event.data.deletionRequests);
          localStorage.setItem(DELETION_REQUESTS_KEY, JSON.stringify(event.data.deletionRequests));
        }
      };
    } catch(e) {}

    return () => {
      clearInterval(interval);
      if (bc) bc.close();
    };
  }, []);

  const saveDeletionRequests = (updated) => {
    setDeletionRequests(updated);
    localStorage.setItem(DELETION_REQUESTS_KEY, JSON.stringify(updated));
    saveGlobalPettyCashDeletions(null, updated);

    try {
      const bc = new BroadcastChannel('tp_petty_cash_deletions_channel');
      bc.postMessage({ deletionRequests: updated });
      bc.close();
    } catch(e) {}
  };

  const loadAllPettyCashData = async () => {
    setLoading(true);

    const [julyRes, augRes, septRes, cloudEdits] = await Promise.all([
      fetchSheetData(SHEET_GIDS.PETTY_CASH_JULY),
      fetchSheetData(SHEET_GIDS.PETTY_CASH_AUG),
      fetchSheetData(SHEET_GIDS.PETTY_CASH_SEPT),
      fetchGlobalPettyCashEdits()
    ]);

    let jT = julyRes.success ? (Array.isArray(julyRes.data) ? julyRes.data : (julyRes.data?.transactions || [])) : [];
    let aT = augRes.success ? (Array.isArray(augRes.data) ? augRes.data : (augRes.data?.transactions || [])) : [];
    let sT = septRes.success ? (Array.isArray(septRes.data) ? septRes.data : (septRes.data?.transactions || [])) : [];

    // Apply cloud + local overlay edits across all devices
    try {
      const editsMap = {};
      const savedStr = localStorage.getItem(PETTY_EDITS_KEY);
      if (savedStr) Object.assign(editsMap, JSON.parse(savedStr));
      if (cloudEdits && typeof cloudEdits === 'object') Object.assign(editsMap, cloudEdits);

      if (editsMap['__HEADER_ALLOCATION__']) {
        setCustomHeader(editsMap['__HEADER_ALLOCATION__']);
        localStorage.setItem(PETTY_HEADER_KEY, JSON.stringify(editsMap['__HEADER_ALLOCATION__']));
      }

      if (Object.keys(editsMap).length > 0) {
        localStorage.setItem(PETTY_EDITS_KEY, JSON.stringify(editsMap));
        const applyEdits = (list) => list.map(item => editsMap[item.id] ? { ...item, ...editsMap[item.id] } : item);
        jT = applyEdits(jT);
        aT = applyEdits(aT);
        sT = applyEdits(sT);
      }
    } catch(e) {}

    setJulyData(jT);
    setAugData(aT);
    setSeptData(sT);

    if (activeTab === 'PETTY_CASH_JULY') {
      setActiveTabData(jT);
      if (julyRes.success && julyRes.data && julyRes.data.headerSummary) setHeaderSummary(julyRes.data.headerSummary);
    } else if (activeTab === 'PETTY_CASH_AUG') {
      setActiveTabData(aT);
      if (augRes.success && augRes.data && augRes.data.headerSummary) setHeaderSummary(augRes.data.headerSummary);
    } else if (activeTab === 'PETTY_CASH_SEPT') {
      setActiveTabData(sT);
      if (septRes.success && septRes.data && septRes.data.headerSummary) setHeaderSummary(septRes.data.headerSummary);
    } else {
      setActiveTabData([...jT, ...aT, ...sT]);
      if (septRes.success && septRes.data && septRes.data.headerSummary) setHeaderSummary(septRes.data.headerSummary);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadAllPettyCashData();
    const interval = setInterval(loadAllPettyCashData, 1000);

    let bcSync;
    try {
      bcSync = new BroadcastChannel('tp_petty_cash_sync_channel');
      bcSync.onmessage = () => {
        loadAllPettyCashData();
      };
    } catch(e) {}

    return () => {
      clearInterval(interval);
      if (bcSync) bcSync.close();
    };
  }, [activeTab, refreshTrigger]);

  const cleanStr = (s) => (s || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');

  const getItemKey = (item) => {
    if (!item) return '';
    return `${cleanStr(item.date)}_${cleanStr(item.description)}_${cleanStr(item.voucherNo || item.cardSpent || item.cashOut)}`;
  };

  const isItemDeleted = (item) => {
    if (!item) return false;
    const descClean = cleanStr(item.description);
    if (descClean.includes('[deleted]')) return true;

    const itemVoucher = cleanStr(item.voucherNo);
    const itemDate = cleanStr(item.date);
    const itemAmt = cleanStr(item.cardSpent || item.cashOut);
    const itemKey = getItemKey(item);

    return deletionRequests.some(r => {
      if (r.status !== 'APPROVED') return false;
      if (r.itemKey && r.itemKey === itemKey) return true;
      
      const reqVoucher = cleanStr(r.itemVoucherNo);
      if (itemVoucher && itemVoucher !== '-' && reqVoucher && reqVoucher !== '-' && itemVoucher === reqVoucher) return true;

      const reqDesc = cleanStr(r.itemDescription);
      const reqDate = cleanStr(r.itemDate);
      const reqAmt = cleanStr(r.itemAmount);

      if (descClean && reqDesc && descClean === reqDesc && itemDate === reqDate && itemAmt === reqAmt) {
        return true;
      }
      return false;
    });
  };

  // Direct instant deletion without CEO approval requirement
  const handleDirectDelete = async (item) => {
    if (!window.confirm(`Are you sure you want to delete "${item.description}" (${item.cardSpent || item.cashOut || '$0.00'})?`)) {
      return;
    }

    const key = getItemKey(item);
    const newRequest = {
      id: `del-req-${Date.now()}`,
      itemKey: key,
      itemDate: item.date,
      itemDescription: item.description,
      itemVoucherNo: item.voucherNo || '-',
      itemCategory: item.category || 'General',
      itemAmount: item.cardSpent || item.cashOut || '$0.00',
      activeTab,
      requestedBy: currentUser?.name || 'Authorized User',
      requestedByEmail: currentUser?.email || 'user@turningpointretail.com',
      reason: 'Direct Instant Deletion',
      status: 'APPROVED',
      requestedAt: new Date().toISOString(),
      reviewedBy: currentUser?.name || 'Authorized User',
      reviewedAt: new Date().toISOString()
    };

    const updated = [newRequest, ...deletionRequests.filter(r => r.itemKey !== key)];
    saveDeletionRequests(updated);

    if (item.rowIndex) {
      try {
        const targetGid = SHEET_GIDS[activeTab] || SHEET_GIDS.PETTY_CASH_JULY;
        syncCellToGoogleSheet(null, {
          gid: targetGid,
          rowIndex: item.rowIndex,
          columnIndex: 2,
          value: `[DELETED] ${item.description}`
        });
      } catch(e) {}
    }

    loadAllPettyCashData();
  };

  // Open Edit Modal for Petty Cash Row
  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    const rawAmt = (item.cardSpent || item.cashOut || '$0.00').toString().replace('$', '').replace(',', '');
    setEditFormData({
      date: item.date || '',
      description: item.description || '',
      voucherNo: item.voucherNo || '',
      category: item.category || 'Supplies',
      paymentMethod: item.paymentMethod || 'Card/Online',
      paidBy: item.paidBy || 'Admin Manager',
      amountSpent: rawAmt
    });
  };

  // Save Edit Petty Cash Changes
  const handleSavePettyEdit = async (e) => {
    e.preventDefault();
    if (!editingItem) return;

    const formattedAmt = editFormData.amountSpent ? `$${parseFloat(editFormData.amountSpent).toFixed(2)}` : '$0.00';
    const isCash = (editFormData.paymentMethod || '').toLowerCase().includes('cash');

    const updatedRow = {
      ...editingItem,
      date: editFormData.date,
      description: editFormData.description,
      voucherNo: editFormData.voucherNo || '-',
      category: editFormData.category,
      paymentMethod: editFormData.paymentMethod,
      paidBy: editFormData.paidBy,
      cardSpent: formattedAmt,
      cashOut: isCash ? formattedAmt : '$0.00'
    };

    // Save overlay edits to local cache & global cloud endpoint
    try {
      const savedStr = localStorage.getItem(PETTY_EDITS_KEY);
      const editsMap = savedStr ? JSON.parse(savedStr) : {};
      editsMap[editingItem.id] = updatedRow;
      localStorage.setItem(PETTY_EDITS_KEY, JSON.stringify(editsMap));
      await saveGlobalPettyCashEdits(null, editsMap);
    } catch(e) {}

    // Update in-memory lists
    const updateList = (list) => list.map(it => it.id === editingItem.id ? updatedRow : it);
    setJulyData(prev => updateList(prev));
    setAugData(prev => updateList(prev));
    setSeptData(prev => updateList(prev));
    setActiveTabData(prev => updateList(prev));

    // Sync edited cells back to Google Sheet
    if (editingItem.rowIndex) {
      const targetGid = SHEET_GIDS[activeTab] || SHEET_GIDS.PETTY_CASH_JULY;
      try {
        await syncCellToGoogleSheet(null, { gid: targetGid, rowIndex: editingItem.rowIndex, columnIndex: 1, value: editFormData.date });
        await syncCellToGoogleSheet(null, { gid: targetGid, rowIndex: editingItem.rowIndex, columnIndex: 2, value: editFormData.description });
        await syncCellToGoogleSheet(null, { gid: targetGid, rowIndex: editingItem.rowIndex, columnIndex: 3, value: editFormData.voucherNo || '-' });
        await syncCellToGoogleSheet(null, { gid: targetGid, rowIndex: editingItem.rowIndex, columnIndex: 4, value: editFormData.category });
        await syncCellToGoogleSheet(null, { gid: targetGid, rowIndex: editingItem.rowIndex, columnIndex: 5, value: editFormData.paymentMethod });
        await syncCellToGoogleSheet(null, { gid: targetGid, rowIndex: editingItem.rowIndex, columnIndex: 8, value: formattedAmt });
      } catch(e) {}
    }

    setEditingItem(null);
  };

  if (!isAuthorized) {
    return (
      <div className="restricted-box">
        <div className="restricted-icon">
          <Lock />
        </div>
        <h2 className="restricted-title">Access Restricted - CEO & Admin Only</h2>
        <p className="restricted-desc">
          The <strong>{tabTitles[activeTab]}</strong> tab is strictly restricted to executive management. 
        </p>
      </div>
    );
  }

  // Filter out approved deleted rows & enforce strict month isolation for each tab
  const isJulyRow = (r) => r.monthTag === 'july' || (r.date || '').toLowerCase().includes('jul') || (r.date || '').includes('-07-') || (r.date || '').includes('/07/');
  const isAugRow = (r) => r.monthTag === 'aug' || (r.date || '').toLowerCase().includes('aug') || (r.date || '').includes('-08-') || (r.date || '').includes('/08/');
  const isSeptRow = (r) => r.monthTag === 'sept' || (r.date || '').toLowerCase().includes('sep') || (r.date || '').includes('-09-') || (r.date || '').includes('/09/');

  const filteredJulyData = julyData.filter(r => !isItemDeleted(r) && isJulyRow(r));
  const filteredAugData = augData.filter(r => !isItemDeleted(r) && isAugRow(r));
  const filteredSeptData = septData.filter(r => !isItemDeleted(r) && isSeptRow(r));

  const filteredActiveTabData = activeTab === 'PETTY_CASH_JULY' ? filteredJulyData :
                                activeTab === 'PETTY_CASH_AUG' ? filteredAugData :
                                activeTab === 'PETTY_CASH_SEPT' ? filteredSeptData :
                                [...filteredJulyData, ...filteredAugData, ...filteredSeptData];

  // Calculate live analytics across non-deleted rows
  const parseVal = (str) => parseFloat((str || '0').toString().replace('$', '').replace(',', '')) || 0;

  const julyTotal = filteredJulyData.reduce((acc, r) => acc + parseVal(r.cardSpent || r.cashOut), 0);
  const augTotal = filteredAugData.reduce((acc, r) => acc + parseVal(r.cardSpent || r.cashOut), 0);
  const septTotal = filteredSeptData.reduce((acc, r) => acc + parseVal(r.cardSpent || r.cashOut), 0);
  const totalYTD = julyTotal + augTotal + septTotal;

  // Category breakdown compile
  const allRows = [...filteredJulyData, ...filteredAugData, ...filteredSeptData];

  // Target rows for financial summary bar (All rows when on Dashboard, active month rows otherwise)
  const targetRowsForSummary = isDashboardTab ? allRows : filteredActiveTabData;

  // Safe header summary fallback object (overlays user's custom edits)
  const safeHeaderSummary = customHeader || headerSummary || {
    startingCash: '$0.00',
    cashIn: '$0.00',
    cashOut: '$0.00',
    remainingCash: '$0.00',
    cardSpent: '$0.00'
  };

  const handleOpenEditHeaderModal = () => {
    const sRaw = parseVal(safeHeaderSummary.startingCash);
    const cRaw = parseVal(safeHeaderSummary.cashIn);
    setHeaderFormData({
      startingCash: sRaw.toFixed(2),
      cashIn: cRaw.toFixed(2)
    });
    setShowEditHeaderModal(true);
  };

  const handleSaveHeaderAllocations = async (e) => {
    e.preventDefault();
    const updatedHeader = {
      startingCash: `$${parseFloat(headerFormData.startingCash || 0).toFixed(2)}`,
      cashIn: `$${parseFloat(headerFormData.cashIn || 0).toFixed(2)}`
    };

    setCustomHeader(updatedHeader);
    localStorage.setItem(PETTY_HEADER_KEY, JSON.stringify(updatedHeader));

    try {
      const savedStr = localStorage.getItem(PETTY_EDITS_KEY);
      const editsMap = savedStr ? JSON.parse(savedStr) : {};
      editsMap['__HEADER_ALLOCATION__'] = updatedHeader;
      localStorage.setItem(PETTY_EDITS_KEY, JSON.stringify(editsMap));
      await saveGlobalPettyCashEdits(null, editsMap);
    } catch(e) {}

    setShowEditHeaderModal(false);
  };

  // Dynamic automatic mathematical calculations across active non-deleted rows
  const rawStarting = parseVal(safeHeaderSummary.startingCash);
  const liveCashIn = targetRowsForSummary.reduce((acc, r) => acc + parseVal(r.cashIn), 0);
  const parsedCashIn = parseVal(safeHeaderSummary.cashIn);
  
  // 1. Cash Out (Physical cash expenditures)
  const cashOutSpent = targetRowsForSummary.reduce((acc, r) => {
    const isCash = (r.paymentMethod || '').toLowerCase().includes('cash') || parseVal(r.cashOut) > 0;
    return acc + (isCash ? parseVal(r.cashOut || r.cardSpent) : 0);
  }, 0);

  // 2. Card Spent (Card / Online expenditures)
  const cardSpentNum = targetRowsForSummary.reduce((acc, r) => {
    const isCard = (r.paymentMethod || '').toLowerCase().includes('card') || (r.paymentMethod || '').toLowerCase().includes('online') || parseVal(r.cardSpent) > 0;
    return acc + (isCard ? parseVal(r.cardSpent || r.cashOut) : 0);
  }, 0);

  const liveTotalSpent = targetRowsForSummary.reduce((acc, r) => acc + parseVal(r.cardSpent || r.cashOut), 0);
  const liveCashOut = liveTotalSpent;

  // Allocation & dynamic funds calculations
  let startingCashNum = rawStarting;
  let totalCashInNum = Math.max(parsedCashIn, liveCashIn);

  const totalAvailableFunds = startingCashNum + totalCashInNum;
  const dynamicRemainingCash = Math.max(0, totalAvailableFunds - liveTotalSpent);
  const categoryMap = {};
  allRows.forEach(r => {
    const cat = r.category || 'Supplies';
    const val = parseVal(r.cardSpent || r.cashOut);
    categoryMap[cat] = (categoryMap[cat] || 0) + val;
  });

  const categories = Object.keys(categoryMap).map(cat => ({
    name: cat,
    amount: categoryMap[cat],
    percentage: totalYTD > 0 ? ((categoryMap[cat] / totalYTD) * 100).toFixed(1) : 0
  })).sort((a, b) => b.amount - a.amount);

  const monthNameMap = {
    PETTY_CASH_DASHBOARD: 'YTD Overview (July – September 2026)',
    PETTY_CASH_JULY: 'July 2026 Monthly Statement',
    PETTY_CASH_AUG: 'August 2026 Monthly Statement',
    PETTY_CASH_SEPT: 'September 2026 Monthly Statement'
  };

  const handlePrintMonthlyPDF = () => {
    const origTitle = document.title;
    document.title = `Turning_Point_Petty_Cash_${activeTab}_Report`;
    window.print();
    setTimeout(() => { document.title = origTitle; }, 1000);
  };

  const handleExportMonthlyWord = () => {
    const dataToExport = isDashboardTab ? allRows : filteredActiveTabData;
    const title = monthNameMap[activeTab] || 'Petty Cash Statement';

    const content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <title>PETTY CASH STATEMENT - ${title}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.5; color: #0F172A; font-size: 11px; }
          h1 { color: #0F172A; border-bottom: 3px solid #0A6B3D; padding-bottom: 6px; font-size: 18px; text-transform: uppercase; margin-bottom: 2px; }
          .subtitle { color: #475569; font-size: 10px; margin-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 10px; }
          th, td { border: 1px solid #CBD5E1; padding: 6px 10px; text-align: left; }
          th { background-color: #F8FAFC; color: #0F172A; font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>Turning Point Retail Solutions</h1>
        <div class="subtitle">PETTY CASH EXPENDITURE STATEMENT • ${title.toUpperCase()}</div>
        
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description / Item</th>
              <th>Voucher / Bill No</th>
              <th>Category</th>
              <th>Payment Method</th>
              <th>Amount Spent ($ USD)</th>
            </tr>
          </thead>
          <tbody>
            ${dataToExport.map(r => `
              <tr>
                <td>${r.date}</td>
                <td><strong>${r.description}</strong></td>
                <td>${r.voucherNo || '-'}</td>
                <td>${r.category || 'General'}</td>
                <td>${r.paymentMethod || 'Card/Online'}</td>
                <td><strong>${r.cardSpent || r.cashOut || '$0.00'}</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div style="margin-top: 20px; text-align: right; font-size: 11px;">
          <strong>Total Spent: $${liveTotalSpent.toFixed(2)} USD</strong>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Petty_Cash_${activeTab}_Statement.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="petty-cash-container">
      
      {/* Header Bar */}
      <div className="petty-cash-header no-print">
        <div>
          <h2 className="petty-cash-title">
            {monthNameMap[activeTab] || 'Petty Cash Management'}
          </h2>
          <p className="petty-cash-subtitle">
            Turning Point Retail Solutions • Real-time Financial Ledger Sync
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={handleOpenEditHeaderModal} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', background: '#FFFBEB', color: '#B45309', borderColor: '#FDE68A', fontWeight: 700 }}>
            <Edit2 size={15} /> ✏️ Edit Allocations
          </button>

          <button onClick={handleExportMonthlyWord} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}>
            <FileText size={15} /> Export Word (.doc)
          </button>

          <button onClick={handlePrintMonthlyPDF} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}>
            <Printer size={15} /> Print / Save PDF
          </button>

          <button onClick={onOpenNewPettyCashModal} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 800 }}>
            <Plus size={16} /> + Add Transaction
          </button>
        </div>
      </div>

      {/* Master Financial Summary Cards Bar - 5 Metric Columns */}
      <div className="summary-cards-grid no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
        <div className="summary-card text-emerald">
          <div className="summary-card-header">
            <span className="summary-card-title">Starting Petty Cash</span>
            <Wallet className="summary-card-icon text-emerald" />
          </div>
          <div className="summary-card-value text-emerald">
            ${startingCashNum.toFixed(2)}
          </div>
          <span className="summary-card-subtitle">Approved Allocation</span>
        </div>

        <div className="summary-card text-blue">
          <div className="summary-card-header">
            <span className="summary-card-title">Cash In</span>
            <TrendingUp className="summary-card-icon text-blue" />
          </div>
          <div className="summary-card-value text-blue">
            ${totalCashInNum.toFixed(2)}
          </div>
          <span className="summary-card-subtitle">Replenished Funds</span>
        </div>

        <div className="summary-card text-amber">
          <div className="summary-card-header">
            <span className="summary-card-title">Cash Out</span>
            <ArrowDownRight className="summary-card-icon text-amber" />
          </div>
          <div className="summary-card-value text-amber">
            ${cashOutSpent.toFixed(2)}
          </div>
          <span className="summary-card-subtitle">Cash Expenditures</span>
        </div>

        <div className="summary-card text-indigo" style={{ borderLeft: '4px solid #6366F1' }}>
          <div className="summary-card-header">
            <span className="summary-card-title">Card Spent</span>
            <CreditCard className="summary-card-icon" style={{ color: '#6366F1' }} />
          </div>
          <div className="summary-card-value" style={{ color: '#6366F1' }}>
            ${cardSpentNum.toFixed(2)}
          </div>
          <span className="summary-card-subtitle">Online / Card Purchases</span>
        </div>

        <div className="summary-card text-purple">
          <div className="summary-card-header">
            <span className="summary-card-title">Remaining Petty Cash</span>
            <DollarSign className="summary-card-icon text-purple" />
          </div>
          <div className="summary-card-value text-purple">
            ${dynamicRemainingCash.toFixed(2)}
          </div>
          <span className="summary-card-subtitle">Net Available Funds</span>
        </div>
      </div>

      {/* DASHBOARD GRAPHICS VIEW */}
      {isDashboardTab && (
        <div className="no-print">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
            
            {/* Monthly Trend Graphic */}
            <div style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <BarChart3 style={{ color: 'var(--brand-green)' }} />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Monthly Expenditure Trend</h3>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>FY 2025–2026</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginTop: '16px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    <span>July 2026</span>
                    <span style={{ color: 'var(--brand-green)', fontWeight: 800 }}>${julyTotal.toFixed(2)} ({filteredJulyData.length} items)</span>
                  </div>
                  <div style={{ width: '100%', height: '14px', background: '#F1F5F9', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, (julyTotal / Math.max(1, totalYTD)) * 100)}%`, height: '100%', background: 'linear-gradient(90deg, #FDB913, #0A6B3D)', borderRadius: '8px' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    <span>August 2026</span>
                    <span style={{ color: '#2563EB', fontWeight: 800 }}>${augTotal.toFixed(2)} ({filteredAugData.length} items)</span>
                  </div>
                  <div style={{ width: '100%', height: '14px', background: '#F1F5F9', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, (augTotal / Math.max(1, totalYTD)) * 100)}%`, height: '100%', background: 'linear-gradient(90deg, #3B82F6, #1D4ED8)', borderRadius: '8px' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    <span>September 2026</span>
                    <span style={{ color: '#059669', fontWeight: 800 }}>${septTotal.toFixed(2)} ({filteredSeptData.length} items)</span>
                  </div>
                  <div style={{ width: '100%', height: '14px', background: '#F1F5F9', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, (septTotal / Math.max(1, totalYTD)) * 100)}%`, height: '100%', background: 'linear-gradient(90deg, #10B981, #047857)', borderRadius: '8px' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Category Breakdown Distribution */}
            <div style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <PieChart style={{ color: '#059669' }} />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Expense Category Distribution</h3>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Live Category Aggregation</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {categories.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '20px' }}>Loading live category graphics...</p>
                ) : (
                  categories.map((cat, i) => (
                    <div key={cat.name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600 }}>{cat.name}</span>
                        <span style={{ color: 'var(--brand-green)', fontWeight: 700 }}>${cat.amount.toFixed(2)} ({cat.percentage}%)</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ 
                          width: `${cat.percentage}%`, 
                          height: '100%', 
                          background: i % 2 === 0 ? 'linear-gradient(90deg, #FDB913, #0A6B3D)' : 'linear-gradient(90deg, #2563EB, #7C3AED)', 
                          borderRadius: '4px' 
                        }} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Desktop Table View for Dashboard */}
          <div className="table-container desktop-crm-table">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description / Item</th>
                  <th>Bill Number</th>
                  <th>Category</th>
                  <th>Payment Method</th>
                  <th>Card / Online Spent</th>
                  <th>Cash Out</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {allRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                      No transactions recorded. Click "+ Add Transaction" to create an entry live!
                    </td>
                  </tr>
                ) : (
                  allRows.map((item, idx) => (
                    <tr key={item.id || idx}>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.date}</td>
                      <td style={{ fontWeight: 600 }}>{item.description}</td>
                      <td><span className="project-id-badge">{item.voucherNo || '-'}</span></td>
                      <td style={{ color: 'var(--brand-green)', fontWeight: 600 }}>{item.category || 'General'}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.paymentMethod || 'Card/Online'}</td>
                      <td style={{ fontWeight: 800, color: 'var(--brand-green)' }}>{item.cardSpent || '$0.00'}</td>
                      <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{item.cashOut || '$0.00'}</td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            style={{ background: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            title="Edit Petty Cash Entry"
                          >
                            <Edit2 size={13} /> Edit
                          </button>
                          <button
                            onClick={() => handleDirectDelete(item)}
                            style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            title="Direct Delete Transaction"
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Responsive Cards View for Dashboard */}
          <div className="mobile-crm-cards no-print">
            {allRows.map((item, idx) => (
              <div key={item.id || idx} style={{
                background: '#FFFFFF',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '12px',
                boxShadow: 'var(--shadow-card)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>{item.date}</span>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', margin: '2px 0 0 0' }}>{item.description}</h4>
                  </div>
                  <span style={{ 
                    fontSize: '1rem', 
                    fontWeight: 900, 
                    color: 'var(--brand-green)',
                    background: '#ECFDF5',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    border: '1px solid #A7F3D0'
                  }}>
                    {item.cardSpent || item.cashOut || '$0.00'}
                  </span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '0.75rem', alignItems: 'center' }}>
                  <span style={{ background: '#F1F5F9', color: '#475569', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                    Bill: {item.voucherNo || '-'}
                  </span>
                  <span style={{ background: '#FEF3C7', color: '#B45309', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                    {item.category || 'Supplies'}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>
                    Via: {item.paymentMethod || 'Card/Online'}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '6px', paddingTop: '8px', borderTop: '1px dashed #E2E8F0' }}>
                  <button
                    onClick={() => handleOpenEditModal(item)}
                    style={{ flex: 1, background: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A', padding: '8px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    <Edit2 size={14} /> Edit Entry
                  </button>
                  <button
                    onClick={() => handleDirectDelete(item)}
                    style={{ flex: 1, background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5', padding: '8px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MONTHLY TAB TRANSACTION TABLES (July, August, September) */}
      {!isDashboardTab && (
        <div>
          {/* Desktop Table View for Monthly Tab */}
          <div className="table-container desktop-crm-table">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description / Item</th>
                  <th>Bill Number</th>
                  <th>Category</th>
                  <th>Payment Method</th>
                  <th>Card / Online Spent</th>
                  <th>Cash Out</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredActiveTabData.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                      {loading ? 'Fetching live rows from Google Sheet...' : 'No transactions recorded in this Google Sheet tab.'}
                    </td>
                  </tr>
                ) : (
                  filteredActiveTabData.map((item, idx) => (
                    <tr key={item.id || idx}>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.date}</td>
                      <td style={{ fontWeight: 600 }}>{item.description}</td>
                      <td><span className="project-id-badge">{item.voucherNo || '-'}</span></td>
                      <td style={{ color: 'var(--brand-green)', fontWeight: 600 }}>{item.category || 'General'}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.paymentMethod || 'Card/Online'}</td>
                      <td style={{ fontWeight: 800, color: 'var(--brand-green)' }}>{item.cardSpent || '$0.00'}</td>
                      <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{item.cashOut || '$0.00'}</td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            style={{ background: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            title="Edit Petty Cash Entry"
                          >
                            <Edit2 size={13} /> Edit
                          </button>
                          <button
                            onClick={() => handleDirectDelete(item)}
                            style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            title="Direct Delete Transaction"
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Responsive Cards View for Monthly Tab */}
          <div className="mobile-crm-cards no-print">
            {filteredActiveTabData.map((item, idx) => (
              <div key={item.id || idx} style={{
                background: '#FFFFFF',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '12px',
                boxShadow: 'var(--shadow-card)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>{item.date}</span>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', margin: '2px 0 0 0' }}>{item.description}</h4>
                  </div>
                  <span style={{ 
                    fontSize: '1rem', 
                    fontWeight: 900, 
                    color: 'var(--brand-green)',
                    background: '#ECFDF5',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    border: '1px solid #A7F3D0'
                  }}>
                    {item.cardSpent || item.cashOut || '$0.00'}
                  </span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '0.75rem', alignItems: 'center' }}>
                  <span style={{ background: '#F1F5F9', color: '#475569', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                    Bill: {item.voucherNo || '-'}
                  </span>
                  <span style={{ background: '#FEF3C7', color: '#B45309', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                    {item.category || 'Supplies'}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>
                    Via: {item.paymentMethod || 'Card/Online'}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '6px', paddingTop: '8px', borderTop: '1px dashed #E2E8F0' }}>
                  <button
                    onClick={() => handleOpenEditModal(item)}
                    style={{ flex: 1, background: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A', padding: '8px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    <Edit2 size={14} /> Edit Entry
                  </button>
                  <button
                    onClick={() => handleDirectDelete(item)}
                    style={{ flex: 1, background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5', padding: '8px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EDIT PETTY CASH MODAL */}
      {editingItem && (
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
          <div className="modal-content" style={{ width: '90%', maxWidth: '520px', borderRadius: '16px', padding: '24px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Edit2 size={20} style={{ color: '#F59E0B' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0F172A', margin: 0 }}>
                  Edit Petty Cash Entry
                </h3>
              </div>
              <button onClick={() => setEditingItem(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleSavePettyEdit}>
              
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#475569', marginBottom: '4px' }}>
                  Date *
                </label>
                <input
                  type="date"
                  required
                  value={editFormData.date}
                  onChange={e => setEditFormData({ ...editFormData, date: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#475569', marginBottom: '4px' }}>
                  Description / Item Purchased *
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.description}
                  onChange={e => setEditFormData({ ...editFormData, description: e.target.value })}
                  placeholder="Item description..."
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#475569', marginBottom: '4px' }}>
                    Voucher / Bill Number
                  </label>
                  <input
                    type="text"
                    value={editFormData.voucherNo}
                    onChange={e => setEditFormData({ ...editFormData, voucherNo: e.target.value })}
                    placeholder="e.g. V-102"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#475569', marginBottom: '4px' }}>
                    Amount Spent ($ USD) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editFormData.amountSpent}
                    onChange={e => setEditFormData({ ...editFormData, amountSpent: e.target.value })}
                    placeholder="e.g. 15.80"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', fontWeight: 800 }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#475569', marginBottom: '4px' }}>
                    Category
                  </label>
                  <select
                    value={editFormData.category}
                    onChange={e => setEditFormData({ ...editFormData, category: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                  >
                    <option value="Supplies">Supplies</option>
                    <option value="Travel/Fuel">Travel/Fuel</option>
                    <option value="Meals/Entertainment">Meals/Entertainment</option>
                    <option value="Office Equipment">Office Equipment</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Miscellaneous">Miscellaneous</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#475569', marginBottom: '4px' }}>
                    Payment Method
                  </label>
                  <select
                    value={editFormData.paymentMethod}
                    onChange={e => setEditFormData({ ...editFormData, paymentMethod: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                  >
                    <option value="Card/Online">Card/Online</option>
                    <option value="Petty Cash">Petty Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  style={{ padding: '9px 16px', background: '#F1F5F9', color: '#64748B', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '9px 18px', background: '#059669', color: '#FFF', border: 'none', borderRadius: '8px', fontWeight: 900, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Save size={15} /> Save Petty Cash Edit
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* EDIT HEADER FINANCIAL ALLOCATIONS MODAL */}
      {showEditHeaderModal && (
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
          <div className="modal-content" style={{ width: '90%', maxWidth: '480px', borderRadius: '16px', padding: '24px', background: '#FFFFFF', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <DollarSign size={20} style={{ color: 'var(--brand-green)' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0F172A', margin: 0 }}>
                  Edit Financial Allocations
                </h3>
              </div>
              <button onClick={() => setShowEditHeaderModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveHeaderAllocations}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#475569', marginBottom: '6px' }}>
                  Starting Petty Cash Float ($ USD)
                </label>
                <input 
                  type="number"
                  step="0.01"
                  className="form-input"
                  placeholder="e.g. 500.00"
                  value={headerFormData.startingCash}
                  onChange={(e) => setHeaderFormData({ ...headerFormData, startingCash: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem', fontWeight: 800 }}
                  required 
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  Base float allocated to the petty cash safe at start of period.
                </span>
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#475569', marginBottom: '6px' }}>
                  Cash In Replenishment ($ USD)
                </label>
                <input 
                  type="number"
                  step="0.01"
                  className="form-input"
                  placeholder="e.g. 5.00"
                  value={headerFormData.cashIn}
                  onChange={(e) => setHeaderFormData({ ...headerFormData, cashIn: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem', fontWeight: 800 }}
                  required 
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  Total incoming replenishment funds injected into petty cash.
                </span>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '12px', borderTop: '1px solid #E2E8F0' }}>
                <button 
                  type="button" 
                  onClick={() => setShowEditHeaderModal(false)} 
                  style={{ padding: '9px 16px', background: '#F1F5F9', color: '#64748B', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  style={{ padding: '9px 18px', background: '#059669', color: '#FFF', border: 'none', borderRadius: '8px', fontWeight: 900, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Save size={15} /> Save Allocations
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
