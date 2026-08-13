import React, { useState, useEffect } from 'react';
import { Lock, ShieldAlert, DollarSign, Calendar, CheckCircle2, TrendingUp, RefreshCw, Plus, PieChart, BarChart3, CreditCard, Wallet, Layers, Eye, Table, ArrowUpRight, ArrowDownRight, Tag, User, Printer, FileText, Trash2, AlertTriangle, Check, X, Clock, Send, ShieldCheck, AlertCircle } from 'lucide-react';
import { fetchSheetData, SHEET_GIDS, PUBLISHED_SHEET_ID, sendGlobalNotification, fetchGlobalPettyCashDeletions, saveGlobalPettyCashDeletions, syncCellToGoogleSheet } from '../services/googleSheets';

const DELETION_REQUESTS_KEY = 'tp_petty_cash_deletion_requests_v2';

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

  // Petty Cash Deletion Request & CEO Approval States
  const [deletionRequests, setDeletionRequests] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deletionReasonInput, setDeletionReasonInput] = useState('');

  const isDashboardTab = activeTab === 'PETTY_CASH_DASHBOARD';

  const tabTitles = {
    PETTY_CASH_DASHBOARD: 'Petty Cash Executive Graphics Dashboard (gid=2002)',
    PETTY_CASH_JULY: 'July 2026 Petty Cash Transactions (gid=1004)',
    PETTY_CASH_AUG: 'August 2026 Petty Cash Transactions (gid=1001)',
    PETTY_CASH_SEPT: 'September 2026 Petty Cash Transactions (gid=1003)'
  };

  // Real-time Cloud + BroadcastChannel Sync for Deletion Requests & Permanently Deleted Items
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
    const interval = setInterval(loadDeletionRequests, 2000);

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

    const [julyRes, augRes, septRes] = await Promise.all([
      fetchSheetData(SHEET_GIDS.PETTY_CASH_JULY),
      fetchSheetData(SHEET_GIDS.PETTY_CASH_AUG),
      fetchSheetData(SHEET_GIDS.PETTY_CASH_SEPT)
    ]);

    if (julyRes.success) setJulyData(julyRes.data || []);
    if (augRes.success) setAugData(augRes.data || []);
    if (septRes.success) setSeptData(septRes.data || []);

    const activeGid = SHEET_GIDS[activeTab] || SHEET_GIDS.PETTY_CASH_JULY;
    const activeRes = await fetchSheetData(activeGid);
    if (activeRes.success && Array.isArray(activeRes.data)) {
      setActiveTabData(activeRes.data);
      if (activeRes.headerSummary) {
        setHeaderSummary(activeRes.headerSummary);
      }
    } else {
      setActiveTabData([]);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (isAuthorized) {
      loadAllPettyCashData();
    }
  }, [activeTab, isAuthorized, refreshTrigger]);

  // Helper Keys and Deletion Handlers
  const getItemKey = (item) => item.id || item.voucherNo || `${item.date}_${item.description}_${item.cardSpent || item.cashOut}`;

  const cleanStr = (s) => (s || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');

  const isItemDeleted = (item) => {
    if (!item) return false;
    const descClean = cleanStr(item.description);
    if (descClean.includes('deleted')) return true;

    const itemVoucher = cleanStr(item.voucherNo);
    const itemDate = cleanStr(item.date);
    const itemAmt = cleanStr(item.cardSpent || item.cashOut);
    const itemKey = getItemKey(item);

    return deletionRequests.some(r => {
      if (r.status !== 'APPROVED') return false;
      if (r.itemKey && r.itemKey === itemKey) return true;
      if (itemVoucher && itemVoucher !== '-' && cleanStr(r.itemVoucherNo) === itemVoucher) return true;

      const reqDesc = cleanStr(r.itemDescription);
      const reqDate = cleanStr(r.itemDate);
      const reqAmt = cleanStr(r.itemAmount);

      if (descClean && reqDesc && (descClean === reqDesc || descClean.includes(reqDesc) || reqDesc.includes(descClean))) {
        if ((itemDate && reqDate && itemDate === reqDate) || (itemAmt && reqAmt && itemAmt === reqAmt)) {
          return true;
        }
      }
      return false;
    });
  };

  const getPendingDeletionRequest = (item) => {
    if (!item) return null;
    const descClean = cleanStr(item.description);
    const itemVoucher = cleanStr(item.voucherNo);
    const itemDate = cleanStr(item.date);
    const itemAmt = cleanStr(item.cardSpent || item.cashOut);
    const itemKey = getItemKey(item);

    return deletionRequests.find(r => {
      if (r.status !== 'PENDING') return false;
      if (r.itemKey && r.itemKey === itemKey) return true;
      if (itemVoucher && itemVoucher !== '-' && cleanStr(r.itemVoucherNo) === itemVoucher) return true;

      const reqDesc = cleanStr(r.itemDescription);
      const reqDate = cleanStr(r.itemDate);
      const reqAmt = cleanStr(r.itemAmount);

      if (descClean && reqDesc && (descClean === reqDesc || descClean.includes(reqDesc) || reqDesc.includes(descClean))) {
        if ((itemDate && reqDate && itemDate === reqDate) || (itemAmt && reqAmt && itemAmt === reqAmt)) {
          return true;
        }
      }
      return false;
    });
  };

  const handleOpenDeleteModal = (item) => {
    setItemToDelete(item);
    setDeletionReasonInput('');
    setShowDeleteModal(true);
  };

  const handleSubmitDeleteRequest = (e) => {
    e.preventDefault();
    if (!deletionReasonInput.trim()) {
      alert('Please provide a mandatory reason explaining why this petty cash entry is being deleted.');
      return;
    }

    const key = getItemKey(itemToDelete);
    const newRequest = {
      id: `del-req-${Date.now()}`,
      itemKey: key,
      itemDate: itemToDelete.date,
      itemDescription: itemToDelete.description,
      itemVoucherNo: itemToDelete.voucherNo || '-',
      itemCategory: itemToDelete.category || 'General',
      itemAmount: itemToDelete.cardSpent || itemToDelete.cashOut || '$0.00',
      activeTab,
      requestedBy: currentUser?.name || 'Staff User',
      requestedByEmail: currentUser?.email || 'user@turningpointretail.com',
      reason: deletionReasonInput.trim(),
      status: isCeo ? 'APPROVED' : 'PENDING',
      requestedAt: new Date().toISOString(),
      reviewedBy: isCeo ? 'CEO Walter Dantis' : null,
      reviewedAt: isCeo ? new Date().toISOString() : null
    };

    const updated = [newRequest, ...deletionRequests.filter(r => r.itemKey !== key)];
    saveDeletionRequests(updated);

    if (!isCeo) {
      sendGlobalNotification(null, {
        recipientEmail: 'walterdantis@turningpointretail.com',
        title: `🚨 Petty Cash Deletion Request from ${currentUser?.name}`,
        message: `${currentUser?.name} requested deletion of petty cash transaction "${itemToDelete.description}" (${itemToDelete.cardSpent || itemToDelete.cashOut}). Reason: ${deletionReasonInput}`,
        type: 'PETTY_CASH_DELETE'
      });
      alert('🚀 Deletion request submitted! Sent directly to CEO Walter Dantis for approval.');
    } else {
      // If CEO deletes directly, also mark cell in live Google Sheet as [DELETED]
      if (itemToDelete && itemToDelete.rowIndex) {
        try {
          const targetGid = SHEET_GIDS[activeTab] || SHEET_GIDS.PETTY_CASH_JULY;
          syncCellToGoogleSheet(null, {
            gid: targetGid,
            rowIndex: itemToDelete.rowIndex,
            columnIndex: 2,
            value: `[DELETED] ${itemToDelete.description}`
          });
        } catch(e) {}
      }
      alert('✅ Transaction permanently deleted by CEO Walter Dantis.');
    }

    setShowDeleteModal(false);
    setItemToDelete(null);
    setDeletionReasonInput('');
  };

  const handleCeoAction = async (requestId, actionType) => {
    const updated = deletionRequests.map(r => {
      if (r.id === requestId) {
        return {
          ...r,
          status: actionType === 'APPROVE' ? 'APPROVED' : 'REJECTED',
          reviewedBy: 'CEO Walter Dantis',
          reviewedAt: new Date().toISOString()
        };
      }
      return r;
    });

    saveDeletionRequests(updated);

    const req = deletionRequests.find(r => r.id === requestId);
    if (req) {
      sendGlobalNotification(null, {
        recipientEmail: req.requestedByEmail,
        title: `Petty Cash Deletion ${actionType === 'APPROVE' ? 'Approved ✅' : 'Rejected ❌'} by CEO`,
        message: `CEO Walter Dantis has ${actionType === 'APPROVE' ? 'approved and removed' : 'rejected'} your deletion request for "${req.itemDescription}".`,
        type: 'PETTY_CASH_DELETE_RESULT'
      });

      // If approved by CEO, also mark cell in live Google Sheet as [DELETED]
      if (actionType === 'APPROVE' && req.activeTab && SHEET_GIDS[req.activeTab]) {
        try {
          const targetGid = SHEET_GIDS[req.activeTab];
          const targetItem = [...activeTabData, ...julyData, ...augData, ...septData].find(it => 
            cleanStr(it.description) === cleanStr(req.itemDescription) || 
            (it.voucherNo && it.voucherNo !== '-' && cleanStr(it.voucherNo) === cleanStr(req.itemVoucherNo))
          );
          if (targetItem && targetItem.rowIndex) {
            await syncCellToGoogleSheet(null, {
              gid: targetGid,
              rowIndex: targetItem.rowIndex,
              columnIndex: 2,
              value: `[DELETED] ${req.itemDescription}`
            });
          }
        } catch(e) {}
      }
    }
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
          <br /><br />
          Your account role is currently <strong>{currentUser?.role}</strong> ({currentUser?.name}). 
          <br />
          If you require access to financial petty cash records, please request permission from the CEO or System Administrator.
        </p>
        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          <ShieldAlert size={16} />
          <span>Security Protocol Enforced (Google Sheet GIDs: 2002, 1004, 1001, 1003)</span>
        </div>
      </div>
    );
  }

  // Filter out approved deleted rows for active display & totals calculation
  const filteredJulyData = julyData.filter(r => !isItemDeleted(r));
  const filteredAugData = augData.filter(r => !isItemDeleted(r));
  const filteredSeptData = septData.filter(r => !isItemDeleted(r));
  const filteredActiveTabData = activeTabData.filter(r => !isItemDeleted(r));

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

  // Dynamic automatic mathematical calculations across active non-deleted rows
  const startingCashNum = parseVal(headerSummary.startingCash);
  const cashInNum = parseVal(headerSummary.cashIn);

  const liveCashOut = targetRowsForSummary.reduce((acc, r) => {
    const isCash = (r.paymentMethod || '').toLowerCase().includes('cash') || parseVal(r.cashOut) > 0;
    return acc + (isCash ? parseVal(r.cashOut || r.cardSpent) : 0);
  }, 0);

  const liveTotalSpent = targetRowsForSummary.reduce((acc, r) => acc + parseVal(r.cardSpent || r.cashOut), 0);
  const dynamicRemainingCash = Math.max(0, startingCashNum + cashInNum - liveCashOut);
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

    const tableRowsHtml = dataToExport.map((r, i) => `
      <tr>
        <td style="border: 1px solid #CBD5E1; padding: 6px;">${r.date || '-'}</td>
        <td style="border: 1px solid #CBD5E1; padding: 6px;"><strong>${r.description || '-'}</strong></td>
        <td style="border: 1px solid #CBD5E1; padding: 6px;">${r.voucherNo || '-'}</td>
        <td style="border: 1px solid #CBD5E1; padding: 6px;">${r.category || 'General'}</td>
        <td style="border: 1px solid #CBD5E1; padding: 6px;">${r.paymentMethod || 'Card/Online'}</td>
        <td style="border: 1px solid #CBD5E1; padding: 6px; text-align: right;"><strong>${r.cardSpent || r.cashOut || '$0.00'}</strong></td>
      </tr>
    `).join('');

    const wordHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; font-size: 12px; color: #0F172A; }
          h1 { color: #0F172A; font-size: 18px; border-bottom: 2px solid #0A6B3D; padding-bottom: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th { background: #0F172A; color: #FFFFFF; padding: 8px; font-size: 11px; text-align: left; }
        </style>
      </head>
      <body>
        <h1>Turning Point Retail Solutions — ${title}</h1>
        <p><strong>Generated Date:</strong> ${new Date().toLocaleDateString()} | <strong>Authorized By:</strong> CEO Walter Dantis</p>
        <p><strong>Total Expenditure:</strong> $${(isDashboardTab ? totalYTD : dataToExport.reduce((acc, r) => acc + parseVal(r.cardSpent || r.cashOut), 0)).toFixed(2)}</p>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description / Item</th>
              <th>Voucher #</th>
              <th>Category</th>
              <th>Method</th>
              <th style="text-align: right;">Amount ($)</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>
        <div style="margin-top: 30px;">
          <p>__________________________<br/><strong>CEO Walter Dantis Approval Signature</strong></p>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + wordHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TurningPoint_Petty_Cash_${activeTab}_Statement.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const pendingDeletionRequests = deletionRequests.filter(r => r.status === 'PENDING');

  return (
    <div className="petty-cash-container" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Top Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>{tabTitles[activeTab]}</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Google Sheet Financial Intelligence & Expense Graphics (Authorized View: {currentUser.role})
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', width: '100%', maxWidth: 'max-content' }}>
          {isDashboardTab && (
            <div style={{ background: '#F1F5F9', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              <button 
                className={`tab-btn ${viewMode === 'ANALYTICS' ? 'active' : ''}`} 
                onClick={() => setViewMode('ANALYTICS')}
                style={{ padding: '6px 12px', fontSize: '0.78rem' }}
              >
                <BarChart3 size={14} /> Analytics & Graphics
              </button>
              <button 
                className={`tab-btn ${viewMode === 'SHEET_EMBED' ? 'active' : ''}`} 
                onClick={() => setViewMode('SHEET_EMBED')}
                style={{ padding: '6px 12px', fontSize: '0.78rem' }}
              >
                <Eye size={14} /> Google Sheet Canvas
              </button>
            </div>
          )}
          <button 
            className="btn-secondary" 
            onClick={handleExportMonthlyWord}
            style={{ padding: '8px 14px', fontSize: '0.8rem', fontWeight: 800 }}
            title="Download Word (.doc) Monthly Expense Statement"
          >
            <FileText size={15} /> Export Word (.doc)
          </button>
          <button 
            className="btn-secondary" 
            onClick={handlePrintMonthlyPDF}
            style={{ padding: '8px 14px', fontSize: '0.8rem', fontWeight: 800, background: '#2563EB', color: '#FFF', border: '1px solid #2563EB' }}
            title="Print / Save PDF Monthly Expense Statement"
          >
            <Printer size={15} /> Export Monthly PDF 🖨️
          </button>
          <button className="btn-secondary" onClick={loadAllPettyCashData} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            Refresh
          </button>
          <button className="btn-primary" onClick={onOpenNewPettyCashModal}>
            <Plus size={18} />
            Add Entry
          </button>
        </div>
      </div>

      {/* PENDING PETTY CASH DELETION REQUESTS BANNER FOR CEO */}
      {isCeo && pendingDeletionRequests.length > 0 && (
        <div style={{ background: '#FFFBEB', border: '2px solid #F59E0B', borderRadius: '16px', padding: '20px', marginBottom: '24px', boxShadow: '0 4px 16px rgba(245,158,11,0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ background: '#F59E0B', color: '#FFF', padding: '6px', borderRadius: '50%', display: 'flex' }}>
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#92400E', margin: 0 }}>
                  🚨 Pending Petty Cash Deletion Requests ({pendingDeletionRequests.length} Approval Required)
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#B45309' }}>
                  Review staff deletion rationale ("Why") below before approving permanent removal.
                </span>
              </div>
            </div>
            <span style={{ background: '#FEF3C7', color: '#B45309', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800, border: '1px solid #FDE68A' }}>
              CEO Decision Required
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {pendingDeletionRequests.map(req => (
              <div key={req.id} style={{ background: '#FFFFFF', border: '1px solid #FCD34D', borderRadius: '12px', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ flex: 1, minWidth: '280px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 900, fontSize: '0.9rem', color: '#0F172A' }}>{req.itemDescription}</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--brand-green)' }}>({req.itemAmount})</span>
                    <span style={{ fontSize: '0.72rem', background: '#F1F5F9', padding: '2px 6px', borderRadius: '4px', color: '#475569' }}>{req.itemDate}</span>
                  </div>

                  <div style={{ fontSize: '0.78rem', color: '#475569', marginBottom: '6px' }}>
                    Requested by <strong>{req.requestedBy}</strong> ({req.requestedByEmail}) | Voucher: {req.itemVoucherNo}
                  </div>

                  <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', padding: '6px 10px', borderRadius: '6px', fontSize: '0.78rem', color: '#991B1B' }}>
                    <strong>Why deleting:</strong> "{req.reason}"
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleCeoAction(req.id, 'APPROVE')}
                    style={{ background: '#059669', color: '#FFF', border: 'none', borderRadius: '8px', padding: '8px 14px', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Check size={16} /> Approve Deletion
                  </button>
                  <button
                    onClick={() => handleCeoAction(req.id, 'REJECT')}
                    style={{ background: '#DC2626', color: '#FFF', border: 'none', borderRadius: '8px', padding: '8px 14px', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <X size={16} /> Reject Deletion
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GOOGLE SHEET MASTER SUMMARY HEADER BAR FOR ALL MONTHS & DASHBOARD */}
      <div style={{ 
        background: '#FFFFFF', 
        border: '1px solid var(--border-color)', 
        borderRadius: 'var(--radius-lg)', 
        padding: '20px', 
        marginBottom: '24px', 
        boxShadow: 'var(--shadow-card)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '16px'
      }}>
        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Starting Cash Balance</span>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--brand-green)' }}>
            ${startingCashNum.toFixed(2)}
          </div>
        </div>
        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Total Cash In</span>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#2563EB' }}>
            ${cashInNum.toFixed(2)}
          </div>
        </div>
        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Total Cash Out</span>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#DC2626' }}>
            ${liveCashOut.toFixed(2)}
          </div>
        </div>
        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Remaining Cash Balance</span>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#047857', background: '#ECFDF5', padding: '2px 8px', borderRadius: '6px', display: 'inline-block' }}>
            ${dynamicRemainingCash.toFixed(2)}
          </div>
        </div>
        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Card / Online Spent</span>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#7C3AED' }}>
            ${liveTotalSpent.toFixed(2)}
          </div>
        </div>
      </div>

      {/* DASHBOARD GRAPHICS VIEW */}
      {isDashboardTab && viewMode === 'ANALYTICS' && (
        <div>
          {/* Executive KPI Summary Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon orange"><DollarSign /></div>
              <div className="stat-details">
                <span className="stat-value">${totalYTD.toFixed(2)}</span>
                <span className="stat-label">Total Expense YTD (Live Sheet)</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon blue"><CreditCard /></div>
              <div className="stat-details">
                <span className="stat-value">${julyTotal.toFixed(2)}</span>
                <span className="stat-label">July 2026 Expense</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon emerald"><Wallet /></div>
              <div className="stat-details">
                <span className="stat-value">${augTotal.toFixed(2)}</span>
                <span className="stat-label">August 2026 Expense</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon purple"><Layers /></div>
              <div className="stat-details">
                <span className="stat-value">{allRows.length}</span>
                <span className="stat-label">Total Transactions Logged</span>
              </div>
            </div>
          </div>

          {/* Graphics Section: Monthly Breakdown & Category Distribution */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '24px' }}>
            
            {/* Monthly Expenditure Comparison Bar Graphics */}
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
                    <div style={{ width: `${Math.min(100, (julyTotal / Math.max(1, totalYTD)) * 100)}%`, height: '100%', background: 'linear-gradient(90deg, #FDB913, #0A6B3D)', borderRadius: '8px', transition: 'width 0.8s ease' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    <span>August 2026</span>
                    <span style={{ color: '#2563EB', fontWeight: 800 }}>${augTotal.toFixed(2)} ({filteredAugData.length} items)</span>
                  </div>
                  <div style={{ width: '100%', height: '14px', background: '#F1F5F9', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, (augTotal / Math.max(1, totalYTD)) * 100)}%`, height: '100%', background: 'linear-gradient(90deg, #3B82F6, #1D4ED8)', borderRadius: '8px', transition: 'width 0.8s ease' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    <span>September 2026</span>
                    <span style={{ color: '#059669', fontWeight: 800 }}>${septTotal.toFixed(2)} ({filteredSeptData.length} items)</span>
                  </div>
                  <div style={{ width: '100%', height: '14px', background: '#F1F5F9', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, (septTotal / Math.max(1, totalYTD)) * 100)}%`, height: '100%', background: 'linear-gradient(90deg, #10B981, #047857)', borderRadius: '8px', transition: 'width 0.8s ease' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Category Breakdown Pie/Bar Distribution */}
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
                      No transactions recorded. Click "+ Add Transaction" to create an entry live in your Google Sheet!
                    </td>
                  </tr>
                ) : (
                  allRows.map((item, idx) => {
                    const pendingReq = getPendingDeletionRequest(item);
                    return (
                      <tr key={item.id || idx} style={{ background: pendingReq ? '#FFFBEB' : 'transparent' }}>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.date}</td>
                        <td style={{ fontWeight: 600 }}>
                          {item.description}
                          {pendingReq && (
                            <div style={{ fontSize: '0.72rem', color: '#B45309', fontWeight: 700, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Clock size={12} /> Pending CEO Approval: "{pendingReq.reason}"
                            </div>
                          )}
                        </td>
                        <td><span className="project-id-badge">{item.voucherNo || '-'}</span></td>
                        <td style={{ color: 'var(--brand-green)', fontWeight: 600 }}>{item.category || 'General'}</td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.paymentMethod || 'Card/Online'}</td>
                        <td style={{ fontWeight: 800, color: 'var(--brand-green)' }}>{item.cardSpent || '$0.00'}</td>
                        <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{item.cashOut || '$0.00'}</td>
                        <td style={{ textAlign: 'center' }}>
                          {pendingReq ? (
                            <span style={{ fontSize: '0.7rem', background: '#FEF3C7', color: '#B45309', padding: '3px 8px', borderRadius: '6px', fontWeight: 800 }}>
                              ⏳ Pending CEO
                            </span>
                          ) : (
                            <button
                              onClick={() => handleOpenDeleteModal(item)}
                              style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              title="Delete transaction (requires CEO approval rationale)"
                            >
                              <Trash2 size={13} /> Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
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
                  filteredActiveTabData.map((item, idx) => {
                    const pendingReq = getPendingDeletionRequest(item);
                    return (
                      <tr key={item.id || idx} style={{ background: pendingReq ? '#FFFBEB' : 'transparent' }}>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.date}</td>
                        <td style={{ fontWeight: 600 }}>
                          {item.description}
                          {pendingReq && (
                            <div style={{ fontSize: '0.72rem', color: '#B45309', fontWeight: 700, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Clock size={12} /> Pending CEO Approval: "{pendingReq.reason}"
                            </div>
                          )}
                        </td>
                        <td><span className="project-id-badge">{item.voucherNo || '-'}</span></td>
                        <td style={{ color: 'var(--brand-green)', fontWeight: 600 }}>{item.category || 'General'}</td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.paymentMethod || 'Card/Online'}</td>
                        <td style={{ fontWeight: 800, color: 'var(--brand-green)' }}>{item.cardSpent || '$0.00'}</td>
                        <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{item.cashOut || '$0.00'}</td>
                        <td style={{ textAlign: 'center' }}>
                          {pendingReq ? (
                            <span style={{ fontSize: '0.7rem', background: '#FEF3C7', color: '#B45309', padding: '3px 8px', borderRadius: '6px', fontWeight: 800 }}>
                              ⏳ Pending CEO
                            </span>
                          ) : (
                            <button
                              onClick={() => handleOpenDeleteModal(item)}
                              style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              title="Delete transaction (requires CEO approval rationale)"
                            >
                              <Trash2 size={13} /> Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PETTY CASH DELETE REASON MODAL */}
      {showDeleteModal && itemToDelete && (
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
          <div className="modal-content" style={{ width: '90%', maxWidth: '540px', borderRadius: '16px', padding: '24px' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
              <div style={{ background: '#FEF2F2', color: '#DC2626', padding: '8px', borderRadius: '50%', display: 'flex' }}>
                <Trash2 size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0F172A', margin: 0 }}>
                  Delete Petty Cash Entry
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                  {isCeo ? 'CEO Executive Direct Deletion' : 'Requires CEO Walter Dantis Approval'}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmitDeleteRequest}>
              
              {/* Item Info Summary Card */}
              <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Transaction to Delete:</div>
                <div style={{ fontSize: '1rem', fontWeight: 900, color: '#0F172A', marginTop: '2px' }}>{itemToDelete.description}</div>
                <div style={{ fontSize: '0.82rem', color: '#334155', marginTop: '4px', display: 'flex', gap: '12px' }}>
                  <span>Amount: <strong style={{ color: 'var(--brand-green)' }}>{itemToDelete.cardSpent || itemToDelete.cashOut || '$0.00'}</strong></span>
                  <span>Date: <strong>{itemToDelete.date}</strong></span>
                  <span>Voucher: <strong>{itemToDelete.voucherNo || '-'}</strong></span>
                </div>
              </div>

              {/* Mandatory Reason Input */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 900, color: '#0F172A', marginBottom: '6px' }}>
                  Why are you deleting this petty cash entry? *
                </label>
                <textarea
                  rows={3}
                  required
                  value={deletionReasonInput}
                  onChange={e => setDeletionReasonInput(e.target.value)}
                  placeholder="Please specify the exact reason (e.g., Duplicate record logged by mistake, incorrect bill amount, vendor refund issued)..."
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', lineHeight: '1.4' }}
                />
              </div>

              {!isCeo && (
                <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', padding: '10px 14px', borderRadius: '8px', fontSize: '0.78rem', color: '#B45309', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={16} />
                  <span>Submitting this form flags the item for <strong>CEO Walter Dantis</strong> review. Deletion occurs once approved.</span>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  style={{ padding: '9px 16px', background: '#F1F5F9', color: '#64748B', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '9px 18px', background: '#DC2626', color: '#FFF', border: 'none', borderRadius: '8px', fontWeight: 900, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Send size={15} /> {isCeo ? 'Permanently Delete Now' : 'Submit Request to CEO'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
