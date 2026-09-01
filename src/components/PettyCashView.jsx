import React, { useState, useEffect } from 'react';
import { Lock, ShieldAlert, DollarSign, Calendar, CheckCircle2, TrendingUp, RefreshCw, Plus, PieChart, BarChart3, CreditCard, Wallet, Layers, Eye, Table, ArrowUpRight, ArrowDownRight, Tag, User, Printer, FileText, Trash2, Edit2, Save, AlertTriangle, Check, X, Clock, Send, ShieldCheck, AlertCircle } from 'lucide-react';
import { fetchSheetData, SHEET_GIDS, PUBLISHED_SHEET_ID, sendGlobalNotification, fetchGlobalPettyCashDeletions, saveGlobalPettyCashDeletions, fetchGlobalPettyCashEdits, saveGlobalPettyCashEdits, syncCellToGoogleSheet } from '../services/googleSheets';

const DELETION_REQUESTS_KEY = 'tp_petty_cash_deletion_requests_v2';
const PETTY_EDITS_KEY = 'tp_petty_cash_edits_v1';

export default function PettyCashView({ activeTab, currentUser, onOpenNewPettyCashModal, refreshTrigger }) {
  const isAuthorized = currentUser?.role === 'CEO' || 
                       currentUser?.role === 'Admin' || 
                       (currentUser?.name || '').toLowerCase().includes('walter') || 
                       (currentUser?.name || '').toLowerCase().includes('admin') || 
                       (currentUser?.email || '').toLowerCase().includes('walterdantis') || 
                       (currentUser?.email || '').toLowerCase().includes('admin@') || 
                       (currentUser?.role || '').toLowerCase().includes('ceo') || 
                       (currentUser?.role || '').toLowerCase().includes('admin');

  const isCeoOrAdmin = isAuthorized;
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

  const isFetchingRef = React.useRef(false);

  const loadAllPettyCashData = async (isInitial = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (isInitial || (julyData.length === 0 && augData.length === 0 && septData.length === 0)) {
      setLoading(true);
    }

    try {
      const [dashRes, julyRes, augRes, septRes, cloudEdits] = await Promise.all([
        fetchSheetData(SHEET_GIDS.PETTY_CASH_DASHBOARD),
        fetchSheetData(SHEET_GIDS.PETTY_CASH_JULY),
        fetchSheetData(SHEET_GIDS.PETTY_CASH_AUG),
        fetchSheetData(SHEET_GIDS.PETTY_CASH_SEPT),
        fetchGlobalPettyCashEdits()
      ]);

      let jT = julyRes.success ? (Array.isArray(julyRes.data) ? julyRes.data : (julyRes.data?.transactions || [])) : [];
      let aT = augRes.success ? (Array.isArray(augRes.data) ? augRes.data : (augRes.data?.transactions || [])) : [];
      let sT = septRes.success ? (Array.isArray(septRes.data) ? septRes.data : (septRes.data?.transactions || [])) : [];

      // Preserve existing in-memory transactions if a fetch fails
      if (jT.length === 0 && julyData.length > 0) jT = julyData;
      if (aT.length === 0 && augData.length > 0) aT = augData;
      if (sT.length === 0 && septData.length > 0) sT = septData;

      // 1. Seamless 2-Way Multi-Device Sync Merger (Combines Cloud + Local Edits)
      let editsMap = {};
      const savedStr = localStorage.getItem(PETTY_EDITS_KEY);
      if (savedStr) {
        try { Object.assign(editsMap, JSON.parse(savedStr)); } catch(e) {}
      }
      if (cloudEdits && typeof cloudEdits === 'object') {
        Object.assign(editsMap, cloudEdits);
      }
      // Save merged master state back to local storage
      localStorage.setItem(PETTY_EDITS_KEY, JSON.stringify(editsMap));

      if (editsMap['__HEADER_ALLOCATION__']) {
        setCustomHeader(editsMap['__HEADER_ALLOCATION__']);
        localStorage.setItem(PETTY_HEADER_KEY, JSON.stringify(editsMap['__HEADER_ALLOCATION__']));
      }

      if (Object.keys(editsMap).length > 0) {
        // 1. Overlay edits onto existing CSV rows
        const applyEdits = (list) => list.map(item => editsMap[item.id] ? { ...item, ...editsMap[item.id] } : item);
        jT = applyEdits(jT);
        aT = applyEdits(aT);
        sT = applyEdits(sT);

        // 2. Append newly created local/cloud transactions not yet published in CSV
        const existingIds = new Set([...jT, ...aT, ...sT].map(r => r.id));
        Object.keys(editsMap).forEach(key => {
          if (key === '__HEADER_ALLOCATION__') return;
          const newEntry = editsMap[key];
          if (!newEntry || !newEntry.description) return;

          if (!existingIds.has(key)) {
            const mTag = newEntry.monthTag || (
              (newEntry.date || '').includes('-09-') || (newEntry.date || '').includes('/09/') || (newEntry.date || '').toLowerCase().includes('sep') ? 'sept' :
              (newEntry.date || '').includes('-07-') || (newEntry.date || '').includes('/07/') || (newEntry.date || '').toLowerCase().includes('jul') ? 'july' :
              (newEntry.date || '').includes('-08-') || (newEntry.date || '').includes('/08/') || (newEntry.date || '').toLowerCase().includes('aug') ? 'aug' : 'sept'
            );

            if (mTag === 'july') jT.push(newEntry);
            else if (mTag === 'sept') sT.push(newEntry);
            else if (mTag === 'aug') aT.push(newEntry);
            else sT.push(newEntry);
          }
        });
      }

      setJulyData(jT);
      setAugData(aT);
      setSeptData(sT);

      // Dynamic header summary priority: September Tab -> August Tab -> Dashboard Tab -> July Tab
      const liveHeaderFromSheet = (septRes.success && septRes.headerSummary && septRes.headerSummary.startingCash !== '$0.00') ? septRes.headerSummary :
                                  (augRes.success && augRes.headerSummary && augRes.headerSummary.startingCash !== '$0.00') ? augRes.headerSummary :
                                  (dashRes.success && dashRes.headerSummary && dashRes.headerSummary.startingCash !== '$0.00') ? dashRes.headerSummary :
                                  (julyRes.success && julyRes.headerSummary) ? julyRes.headerSummary : null;

      if (activeTab === 'PETTY_CASH_JULY') {
        setActiveTabData(jT);
        if (julyRes.success && julyRes.headerSummary) setHeaderSummary(julyRes.headerSummary);
      } else if (activeTab === 'PETTY_CASH_AUG') {
        setActiveTabData(aT);
        if (augRes.success && augRes.headerSummary) setHeaderSummary(augRes.headerSummary);
      } else if (activeTab === 'PETTY_CASH_SEPT') {
        setActiveTabData(sT);
        if (septRes.success && septRes.headerSummary) setHeaderSummary(septRes.headerSummary);
      } else {
        setActiveTabData([...jT, ...aT, ...sT]);
        if (liveHeaderFromSheet) setHeaderSummary(liveHeaderFromSheet);
      }
    } catch(e) {
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  // Immediate tab switching without network lag
  useEffect(() => {
    if (activeTab === 'PETTY_CASH_JULY') setActiveTabData(julyData);
    else if (activeTab === 'PETTY_CASH_AUG') setActiveTabData(augData);
    else if (activeTab === 'PETTY_CASH_SEPT') setActiveTabData(septData);
    else setActiveTabData([...julyData, ...augData, ...septData]);
  }, [activeTab]);

  // Stable persistent background sync poller (mount-only)
  useEffect(() => {
    loadAllPettyCashData(true);
    const interval = setInterval(() => loadAllPettyCashData(false), 60000);

    let bcSync;
    try {
      bcSync = new BroadcastChannel('tp_petty_cash_sync_channel');
      bcSync.onmessage = () => {
        loadAllPettyCashData(false);
      };
    } catch(e) {}

    return () => {
      clearInterval(interval);
      if (bcSync) bcSync.close();
    };
  }, [refreshTrigger]);

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

  // Filter out approved deleted rows & enforce strict month isolation for each tab with robust date parsing
  const getRowMonthTag = (r) => {
    if (!r) return 'aug';
    if (r.monthTag === 'july' || r.monthTag === 'aug' || r.monthTag === 'sept') return r.monthTag;
    
    const dStr = (r.date || '').toLowerCase();
    if (dStr.includes('jul') || dStr.includes('-07-') || dStr.includes('/07/') || dStr.includes('-7-') || dStr.includes('/7/')) return 'july';
    if (dStr.includes('sep') || dStr.includes('-09-') || dStr.includes('/09/') || dStr.includes('-9-') || dStr.includes('/9/')) return 'sept';
    if (dStr.includes('aug') || dStr.includes('-08-') || dStr.includes('/08/') || dStr.includes('-8-') || dStr.includes('/8/')) return 'aug';

    try {
      const parsedDate = new Date(dStr);
      if (!isNaN(parsedDate.getTime())) {
        const m = parsedDate.getMonth() + 1;
        if (m === 7) return 'july';
        if (m === 9) return 'sept';
        if (m === 8) return 'aug';
      }
    } catch(e) {}

    return 'aug'; // Default fallback to August 2026 current month
  };

  // Date-wise parsing and chronological sorting helper
  const parseDateMs = (dStr) => {
    if (!dStr) return 0;
    const s = dStr.toString().trim();
    const m = s.match(/^([0-9]{4})[\/\-]([0-9]{1,2})[\/\-]([0-9]{1,2})/);
    if (m) return new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3])).getTime();
    const p = new Date(s);
    return isNaN(p.getTime()) ? 0 : p.getTime();
  };

  const formatDisplayDate = (dStr) => {
    if (!dStr) return '-';
    const s = dStr.toString().trim();
    const m = s.match(/^([0-9]{4})[\/\-]([0-9]{1,2})[\/\-]([0-9]{1,2})/);
    if (m) {
      const year = m[1];
      const month = m[2].padStart(2, '0');
      const day = m[3].padStart(2, '0');
      return `${day}-${month}-${year}`;
    }
    return s;
  };

  const sortByDate = (arr) => {
    return [...arr].sort((a, b) => parseDateMs(b.date) - parseDateMs(a.date));
  };

  const isJulyRow = (r) => getRowMonthTag(r) === 'july';
  const isAugRow = (r) => getRowMonthTag(r) === 'aug';
  const isSeptRow = (r) => getRowMonthTag(r) === 'sept';

  const filteredJulyData = sortByDate(julyData.filter(r => !isItemDeleted(r) && isJulyRow(r)));
  const filteredAugData = sortByDate(augData.filter(r => !isItemDeleted(r) && isAugRow(r)));
  const filteredSeptData = sortByDate(septData.filter(r => !isItemDeleted(r) && isSeptRow(r)));

  const filteredActiveTabData = activeTab === 'PETTY_CASH_JULY' ? filteredJulyData :
                                activeTab === 'PETTY_CASH_AUG' ? filteredAugData :
                                activeTab === 'PETTY_CASH_SEPT' ? filteredSeptData :
                                sortByDate([...filteredJulyData, ...filteredAugData, ...filteredSeptData]);

  // Calculate live analytics across non-deleted rows
  const parseVal = (str) => parseFloat((str || '0').toString().replace('$', '').replace(',', '')) || 0;

  const julyTotal = filteredJulyData.reduce((acc, r) => acc + parseVal(r.cardSpent || r.cashOut), 0);
  const augTotal = filteredAugData.reduce((acc, r) => acc + parseVal(r.cardSpent || r.cashOut), 0);
  const septTotal = filteredSeptData.reduce((acc, r) => acc + parseVal(r.cardSpent || r.cashOut), 0);
  const totalYTD = julyTotal + augTotal + septTotal;

  // Category breakdown compile
  const allRows = sortByDate([...filteredJulyData, ...filteredAugData, ...filteredSeptData]);

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

  // Payment Method Breakdown Calculations across target rows
  const abaQrSpent = targetRowsForSummary.reduce((acc, r) => {
    const p = (r.paymentMethod || '').toLowerCase();
    const isReimbursement = (r.category || '').toLowerCase().includes('reimbursement') || (r.description || '').toLowerCase().includes('reimbursement');
    if (isReimbursement) return acc;
    return acc + (p.includes('aba') || p.includes('qr') ? parseVal(r.cardSpent || r.cashOut) : 0);
  }, 0);

  const cardOnlineSpent = targetRowsForSummary.reduce((acc, r) => {
    const p = (r.paymentMethod || '').toLowerCase();
    const isReimbursement = (r.category || '').toLowerCase().includes('reimbursement') || (r.description || '').toLowerCase().includes('reimbursement');
    if (isReimbursement) return acc;
    return acc + ((p.includes('card') || p.includes('online')) && !p.includes('aba') ? parseVal(r.cardSpent || r.cashOut) : 0);
  }, 0);

  const cashSpent = targetRowsForSummary.reduce((acc, r) => {
    const p = (r.paymentMethod || '').toLowerCase();
    const isReimbursement = (r.category || '').toLowerCase().includes('reimbursement') || (r.description || '').toLowerCase().includes('reimbursement');
    if (isReimbursement) return acc;
    return acc + (p.includes('cash') || (parseVal(r.cashOut) > 0 && !p.includes('bank') && !p.includes('card')) ? parseVal(r.cashOut || r.cardSpent) : 0);
  }, 0);

  const bankTransferSpent = targetRowsForSummary.reduce((acc, r) => {
    const p = (r.paymentMethod || '').toLowerCase();
    const isReimbursement = (r.category || '').toLowerCase().includes('reimbursement') || (r.description || '').toLowerCase().includes('reimbursement');
    if (isReimbursement) return acc;
    return acc + (p.includes('bank') || p.includes('transfer') ? parseVal(r.cardSpent || r.cashOut) : 0);
  }, 0);

  // CEO Reimbursements (Extra funds provided by CEO added to Admin Cash On Hand)
  const ceoReimbursementNum = targetRowsForSummary.reduce((acc, r) => {
    const isReimbursement = (r.category || '').toLowerCase().includes('reimbursement') || (r.description || '').toLowerCase().includes('reimbursement');
    return acc + (isReimbursement ? parseVal(r.cardSpent || r.cashOut || r.cashIn) : 0);
  }, 0);

  const rawStarting = parseVal(safeHeaderSummary.startingCash);
  const parsedCashIn = parseVal(safeHeaderSummary.cashIn);

  // Financial summary metrics
  let adminCashOnHandNum = rawStarting;
  let totalReimbursementsNum = ceoReimbursementNum + parsedCashIn;

  const totalAdminCashAvailable = adminCashOnHandNum + totalReimbursementsNum;
  const liveTotalSpent = abaQrSpent + cardOnlineSpent + cashSpent + bankTransferSpent;
  const dynamicRemainingCash = Math.max(0, totalAdminCashAvailable - liveTotalSpent);

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

  const getItemAmount = (item) => {
    if (!item) return '$0.00';
    const cSpent = parseVal(item.cardSpent);
    const cOut = parseVal(item.cashOut);
    const cIn = parseVal(item.cashIn);

    if (cSpent > 0) return `$${cSpent.toFixed(2)}`;
    if (cOut > 0) return `$${cOut.toFixed(2)}`;
    if (cIn > 0) return `$${cIn.toFixed(2)}`;

    if (item.cardSpent && item.cardSpent !== '$0.00' && item.cardSpent !== '$0' && item.cardSpent !== '0') return item.cardSpent;
    if (item.cashOut && item.cashOut !== '$0.00' && item.cashOut !== '$0' && item.cashOut !== '0') return item.cashOut;
    if (item.cashIn && item.cashIn !== '$0.00' && item.cashIn !== '$0' && item.cashIn !== '0') return item.cashIn;

    return '$0.00';
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
              <th>Date (DD-MM-YYYY)</th>
              <th>Description / Item</th>
              <th>Invoice Number</th>
              <th>Category</th>
              <th>Payment Method</th>
              <th>Paid By</th>
              <th>Amount ($ USD)</th>
            </tr>
          </thead>
          <tbody>
            ${dataToExport.map(r => `
              <tr>
                <td>${formatDisplayDate(r.date)}</td>
                <td><strong>${r.description}</strong></td>
                <td>${r.voucherNo || '-'}</td>
                <td>${r.category || 'General'}</td>
                <td>${r.paymentMethod || 'Card/Online'}</td>
                <td>${r.paidBy || 'Admin Manager'}</td>
                <td><strong>${getItemAmount(r)}</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div style="margin-top: 20px; text-align: right; font-size: 11px;">
          <strong>Total Expenses: $${liveTotalSpent.toFixed(2)} USD</strong>
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
          {isCeoOrAdmin && (
            <button onClick={handleOpenEditHeaderModal} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', background: '#FFFBEB', color: '#B45309', borderColor: '#FDE68A', fontWeight: 700 }}>
              <Edit2 size={15} /> ✏️ Edit Allocations
            </button>
          )}

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

      {/* Master Financial Summary Cards Bar */}
      <div className="summary-cards-grid no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '12px', marginBottom: '16px' }}>
        <div className="summary-card text-emerald">
          <div className="summary-card-header">
            <span className="summary-card-title">Admin Cash On Hand</span>
            <Wallet className="summary-card-icon text-emerald" />
          </div>
          <div className="summary-card-value text-emerald">
            ${adminCashOnHandNum.toFixed(2)}
          </div>
          <span className="summary-card-subtitle">Starting Cash Float</span>
        </div>

        <div className="summary-card text-blue">
          <div className="summary-card-header">
            <span className="summary-card-title">CEO Reimbursements</span>
            <TrendingUp className="summary-card-icon text-blue" />
          </div>
          <div className="summary-card-value text-blue">
            ${totalReimbursementsNum.toFixed(2)}
          </div>
          <span className="summary-card-subtitle">Extra Funds Added to Float</span>
        </div>

        <div className="summary-card text-amber">
          <div className="summary-card-header">
            <span className="summary-card-title">Total Expenses Spent</span>
            <ArrowDownRight className="summary-card-icon text-amber" />
          </div>
          <div className="summary-card-value text-amber">
            ${liveTotalSpent.toFixed(2)}
          </div>
          <span className="summary-card-subtitle">Total Expenditures</span>
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

      {/* Payment Method Financial Breakdown Section */}
      <div className="no-print" style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '16px 20px', marginBottom: '24px', boxShadow: 'var(--shadow-card)' }}>
        <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CreditCard size={16} style={{ color: 'var(--brand-green)' }} /> Payment Method Expenditures Breakdown
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
          <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '12px', borderRadius: '10px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#166534', display: 'block' }}>📱 ABA QR Code</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#15803D' }}>${abaQrSpent.toFixed(2)}</span>
          </div>

          <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '12px', borderRadius: '10px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1E40AF', display: 'block' }}>💳 Card / Online</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#1D4ED8' }}>${cardOnlineSpent.toFixed(2)}</span>
          </div>

          <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', padding: '12px', borderRadius: '10px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#92400E', display: 'block' }}>💵 Cash Payment</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#B45309' }}>${cashSpent.toFixed(2)}</span>
          </div>

          <div style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', padding: '12px', borderRadius: '10px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#5B21B6', display: 'block' }}>🏦 Bank Transfer</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#6D28D9' }}>${bankTransferSpent.toFixed(2)}</span>
          </div>
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
                    <span style={{ color: '#8B5CF6', fontWeight: 800 }}>${septTotal.toFixed(2)} ({filteredSeptData.length} items)</span>
                  </div>
                  <div style={{ width: '100%', height: '14px', background: '#F1F5F9', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, (septTotal / Math.max(1, totalYTD)) * 100)}%`, height: '100%', background: 'linear-gradient(90deg, #A855F7, #6D28D9)', borderRadius: '8px' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Category Breakdown Graphic */}
            <div style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <PieChart style={{ color: '#8B5CF6' }} />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Expenditure Category Breakdown</h3>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Distribution</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' }}>
                {categories.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No category data available.</p>
                ) : (
                  categories.map((cat, idx) => (
                    <div key={idx}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>
                        <span>{cat.name}</span>
                        <span>${cat.amount.toFixed(2)} ({cat.percentage}%)</span>
                      </div>
                      <div style={{ width: '100%', height: '10px', background: '#F1F5F9', borderRadius: '6px', overflow: 'hidden' }}>
                        <div style={{ 
                          width: `${cat.percentage}%`, 
                          height: '100%', 
                          background: idx === 0 ? '#0A6B3D' : idx === 1 ? '#2563EB' : idx === 2 ? '#8B5CF6' : idx === 3 ? '#F59E0B' : '#64748B',
                          borderRadius: '6px' 
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
                  <th>Date (DD-MM-YYYY)</th>
                  <th>Description / Item</th>
                  <th>Invoice Number</th>
                  <th>Category</th>
                  <th>Payment Method</th>
                  <th>Paid By</th>
                  <th>Amount</th>
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
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{formatDisplayDate(item.date)}</td>
                      <td style={{ fontWeight: 600 }}>{item.description}</td>
                      <td><span className="project-id-badge">{item.voucherNo || '-'}</span></td>
                      <td style={{ color: 'var(--brand-green)', fontWeight: 600 }}>{item.category || 'General'}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.paymentMethod || 'Card/Online'}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.paidBy || 'Admin Manager'}</td>
                      <td style={{ fontWeight: 800, color: 'var(--brand-green)' }}>{getItemAmount(item)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            style={{ background: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            title="Edit Petty Cash Entry"
                          >
                            <Edit2 size={13} /> Edit
                          </button>
                          {isCeo && (
                            <button
                              onClick={() => handleDirectDelete(item)}
                              style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              title="Delete Petty Cash Entry (CEO Only)"
                            >
                              <Trash2 size={13} /> Delete
                            </button>
                          )}
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
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>{formatDisplayDate(item.date)}</span>
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
                    {getItemAmount(item)}
                  </span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '0.75rem', alignItems: 'center' }}>
                  <span style={{ background: '#F1F5F9', color: '#475569', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                    Invoice: {item.voucherNo || '-'}
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
                  {isCeo && (
                    <button
                      onClick={() => handleDirectDelete(item)}
                      style={{ flex: 1, background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5', padding: '8px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  )}
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
                  <th>Date (DD-MM-YYYY)</th>
                  <th>Description / Item</th>
                  <th>Invoice Number</th>
                  <th>Category</th>
                  <th>Payment Method</th>
                  <th>Paid By</th>
                  <th>Amount</th>
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
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{formatDisplayDate(item.date)}</td>
                      <td style={{ fontWeight: 600 }}>{item.description}</td>
                      <td><span className="project-id-badge">{item.voucherNo || '-'}</span></td>
                      <td style={{ color: 'var(--brand-green)', fontWeight: 600 }}>{item.category || 'General'}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.paymentMethod || 'Card/Online'}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.paidBy || 'Admin Manager'}</td>
                      <td style={{ fontWeight: 800, color: 'var(--brand-green)' }}>{getItemAmount(item)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            style={{ background: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            title="Edit Petty Cash Entry"
                          >
                            <Edit2 size={13} /> Edit
                          </button>
                          {isCeo && (
                            <button
                              onClick={() => handleDirectDelete(item)}
                              style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              title="Delete Petty Cash Entry (CEO Only)"
                            >
                              <Trash2 size={13} /> Delete
                            </button>
                          )}
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
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>{formatDisplayDate(item.date)}</span>
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
                    {getItemAmount(item)}
                  </span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '0.75rem', alignItems: 'center' }}>
                  <span style={{ background: '#F1F5F9', color: '#475569', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                    Invoice: {item.voucherNo || '-'}
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
                  {isCeo && (
                    <button
                      onClick={() => handleDirectDelete(item)}
                      style={{ flex: 1, background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5', padding: '8px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  )}
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
                    Invoice Number
                  </label>
                  <input
                    type="text"
                    value={editFormData.voucherNo}
                    onChange={e => setEditFormData({ ...editFormData, voucherNo: e.target.value })}
                    placeholder="e.g. INV-1002"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#475569', marginBottom: '4px' }}>
                    Amount ($ USD) *
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
                    <option value="Travel and Transport">Travel and Transport</option>
                    <option value="Meals & Hospitality">Meals & Hospitality</option>
                    <option value="Stationery">Stationery</option>
                    <option value="Tax Related">Tax Related</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Reimbursement">Reimbursement (CEO Extra Funds)</option>
                    <option value="Other">Other</option>
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
                    <option value="ABA QR Code">ABA QR Code</option>
                    <option value="Card/Online">Card / Online</option>
                    <option value="Cash">Cash</option>
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
