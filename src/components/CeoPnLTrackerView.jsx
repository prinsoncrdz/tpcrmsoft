import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, PieChart, Printer, FileText, 
  Save, RotateCcw, ShieldCheck, Lock, Edit3, Sparkles, AlertCircle, ArrowUpRight, ArrowDownRight 
} from 'lucide-react';

import { fetchGlobalPnLData, saveGlobalPnLData } from '../services/googleSheets';

const PNL_STORAGE_KEY = 'tp_crm_ceo_pnl_tracker_v1';

const MONTHS = [
  { key: 'aug26', label: 'Aug-26' },
  { key: 'sep26', label: 'Sep-26' },
  { key: 'oct26', label: 'Oct-26' },
  { key: 'nov26', label: 'Nov-26' },
  { key: 'dec26', label: 'Dec-26' },
  { key: 'jan27', label: 'Jan-27' },
  { key: 'feb27', label: 'Feb-27' },
  { key: 'mar27', label: 'Mar-27' },
  { key: 'apr27', label: 'Apr-27' },
  { key: 'may27', label: 'May-27' },
  { key: 'jun27', label: 'Jun-27' },
  { key: 'jul27', label: 'Jul-27' }
];

const INITIAL_PNL_DATA = {
  // Revenue
  revenue: {
    advisory: { label: 'Retail Advisory & Consultancy Fees', values: { aug26: 0, sep26: 0, oct26: 0, nov26: 0, dec26: 0, jan27: 0, feb27: 0, mar27: 0, apr27: 0, may27: 0, jun27: 0, jul27: 0 } },
    coaching: { label: 'Training & Coaching Programs', values: { aug26: 0, sep26: 0, oct26: 0, nov26: 0, dec26: 0, jan27: 0, feb27: 0, mar27: 0, apr27: 0, may27: 0, jun27: 0, jul27: 0 } },
    franchise: { label: 'Franchise Introduction / Brand Rep Fees', values: { aug26: 0, sep26: 0, oct26: 0, nov26: 0, dec26: 0, jan27: 0, feb27: 0, mar27: 0, apr27: 0, may27: 0, jun27: 0, jul27: 0 } },
    softwareCommission: { label: 'Software Partnership Commission (e.g. Gilbarco/POS)', values: { aug26: 0, sep26: 0, oct26: 0, nov26: 0, dec26: 0, jan27: 0, feb27: 0, mar27: 0, apr27: 0, may27: 0, jun27: 0, jul27: 0 } },
    projectReports: { label: 'Project Reports & Business Planning Fees', values: { aug26: 0, sep26: 0, oct26: 0, nov26: 0, dec26: 0, jan27: 0, feb27: 0, mar27: 0, apr27: 0, may27: 0, jun27: 0, jul27: 0 } },
    otherIncome: { label: 'Other Income', values: { aug26: 0, sep26: 0, oct26: 0, nov26: 0, dec26: 0, jan27: 0, feb27: 0, mar27: 0, apr27: 0, may27: 0, jun27: 0, jul27: 0 } }
  },
  // Cost of Sales (Direct Project Costs)
  costOfSales: {
    subcontractorFees: { label: 'Associate / Subcontractor Consultant Fees', values: { aug26: 0, sep26: 0, oct26: 0, nov26: 0, dec26: 0, jan27: 0, feb27: 0, mar27: 0, apr27: 0, may27: 0, jun27: 0, jul27: 0 } },
    travelSiteVisits: { label: 'Project Travel & Site Visits', values: { aug26: 0, sep26: 0, oct26: 0, nov26: 0, dec26: 0, jan27: 0, feb27: 0, mar27: 0, apr27: 0, may27: 0, jun27: 0, jul27: 0 } },
    softwareLicensing: { label: 'Software Pass-through / Licensing Costs', values: { aug26: 0, sep26: 0, oct26: 0, nov26: 0, dec26: 0, jan27: 0, feb27: 0, mar27: 0, apr27: 0, may27: 0, jun27: 0, jul27: 0 } }
  },
  // Operating Expenses
  operatingExpenses: {
    salaries: { label: 'Salaries & Staff / Intern Stipends', values: { aug26: 0, sep26: 0, oct26: 0, nov26: 0, dec26: 0, jan27: 0, feb27: 0, mar27: 0, apr27: 0, may27: 0, jun27: 0, jul27: 0 } },
    rent: { label: 'Office Rent & Service Charges', values: { aug26: 0, sep26: 0, oct26: 0, nov26: 0, dec26: 0, jan27: 0, feb27: 0, mar27: 0, apr27: 0, may27: 0, jun27: 0, jul27: 0 } },
    utilities: { label: 'Utilities', values: { aug26: 0, sep26: 0, oct26: 0, nov26: 0, dec26: 0, jan27: 0, feb27: 0, mar27: 0, apr27: 0, may27: 0, jun27: 0, jul27: 0 } },
    marketing: { label: 'Marketing & Business Development (incl. Events)', values: { aug26: 0, sep26: 0, oct26: 0, nov26: 0, dec26: 0, jan27: 0, feb27: 0, mar27: 0, apr27: 0, may27: 0, jun27: 0, jul27: 0 } },
    softwareSubs: { label: 'Software & Subscriptions (CRM, Canva, MS Office)', values: { aug26: 0, sep26: 0, oct26: 0, nov26: 0, dec26: 0, jan27: 0, feb27: 0, mar27: 0, apr27: 0, may27: 0, jun27: 0, jul27: 0 } },
    transport: { label: 'Travel & Local Transport', values: { aug26: 0, sep26: 0, oct26: 0, nov26: 0, dec26: 0, jan27: 0, feb27: 0, mar27: 0, apr27: 0, may27: 0, jun27: 0, jul27: 0 } },
    legalAccounting: { label: 'Professional, Legal & Accounting Fees', values: { aug26: 0, sep26: 0, oct26: 0, nov26: 0, dec26: 0, jan27: 0, feb27: 0, mar27: 0, apr27: 0, may27: 0, jun27: 0, jul27: 0 } },
    bankAdmin: { label: 'Bank Charges & Admin', values: { aug26: 0, sep26: 0, oct26: 0, nov26: 0, dec26: 0, jan27: 0, feb27: 0, mar27: 0, apr27: 0, may27: 0, jun27: 0, jul27: 0 } },
    otherExpenses: { label: 'Other Operating Expenses', values: { aug26: 0, sep26: 0, oct26: 0, nov26: 0, dec26: 0, jan27: 0, feb27: 0, mar27: 0, apr27: 0, may27: 0, jun27: 0, jul27: 0 } }
  },
  // Depreciation
  depreciation: { label: 'Depreciation & Amortization', values: { aug26: 0, sep26: 0, oct26: 0, nov26: 0, dec26: 0, jan27: 0, feb27: 0, mar27: 0, apr27: 0, may27: 0, jun27: 0, jul27: 0 } }
};

export default function CeoPnLTrackerView({ currentUser }) {
  const isCeo = currentUser?.role === 'CEO' || 
                (currentUser?.name || '').toLowerCase().includes('walter') || 
                (currentUser?.email || '').toLowerCase().includes('walterdantis') || 
                (currentUser?.role || '').toLowerCase().includes('ceo');

  const [pnlData, setPnlData] = useState(() => {
    try {
      const saved = localStorage.getItem(PNL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.revenue && parsed.costOfSales && parsed.operatingExpenses) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to parse saved P&L data', e);
    }
    return INITIAL_PNL_DATA;
  });

  const [activeSubTab, setActiveSubTab] = useState('PNL_TRACKER'); // 'PNL_TRACKER' | 'COMPARISON_CHARTS'
  const [editingCell, setEditingCell] = useState(null); // { section, key, monthKey }
  const [editValueInput, setEditValueInput] = useState('');
  const [saveToast, setSaveToast] = useState(null);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);

  // Fetch real-time cloud P&L data on component mount + 2s polling pulse + BroadcastChannel sync
  useEffect(() => {
    async function loadCloudPnL() {
      setIsCloudSyncing(true);
      const cloudData = await fetchGlobalPnLData();
      if (cloudData && cloudData.revenue && cloudData.costOfSales && cloudData.operatingExpenses) {
        setPnlData(cloudData);
        localStorage.setItem(PNL_STORAGE_KEY, JSON.stringify(cloudData));
      }
      setIsCloudSyncing(false);
    }
    loadCloudPnL();
    const interval = setInterval(loadCloudPnL, 1000);

    let bc;
    try {
      bc = new BroadcastChannel('tp_ceo_pnl_channel');
      bc.onmessage = (event) => {
        if (event.data && event.data.pnlData) {
          setPnlData(event.data.pnlData);
          localStorage.setItem(PNL_STORAGE_KEY, JSON.stringify(event.data.pnlData));
        }
      };
    } catch(e) {}

    return () => {
      clearInterval(interval);
      if (bc) bc.close();
    };
  }, []);

  const triggerToast = (msg) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 3000);
  };

  const handleSaveToLocalStorage = (dataToSave) => {
    try {
      localStorage.setItem(PNL_STORAGE_KEY, JSON.stringify(dataToSave));
      triggerToast('💾 Real-time saved & synced to cloud!');
      // Sync real-time to Google Cloud backend
      saveGlobalPnLData(null, dataToSave);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCellChange = (section, itemKey, monthKey, val) => {
    const numVal = parseFloat(val) || 0;
    const updated = {
      ...pnlData,
      [section]: {
        ...pnlData[section],
        [itemKey]: {
          ...pnlData[section][itemKey],
          values: {
            ...pnlData[section][itemKey].values,
            [monthKey]: numVal
          }
        }
      }
    };
    setPnlData(updated);
    handleSaveToLocalStorage(updated);
  };

  const handleResetSampleData = () => {
    if (!window.confirm('Reset all P&L figures back to sample initial values?')) return;
    setPnlData(INITIAL_PNL_DATA);
    handleSaveToLocalStorage(INITIAL_PNL_DATA);
    triggerToast('↺ Reset P&L Tracker to initial figures');
  };

  // Helper formatting
  const formatNum = (val) => {
    if (val === 0 || !val) return '-';
    return new Intl.NumberFormat('en-US').format(Math.round(val));
  };

  const formatMoney = (val) => {
    if (val === 0 || !val) return '-';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  const formatPct = (val) => {
    if (isNaN(val) || !isFinite(val)) return '0.0%';
    return val.toFixed(1) + '%';
  };

  // Calculate monthly totals and metrics
  const calculateMetrics = () => {
    const monthlyMetrics = {};
    const totalsFY = {
      revenue: {},
      totalRevenue: 0,
      costOfSales: {},
      totalCostOfSales: 0,
      grossProfit: 0,
      operatingExpenses: {},
      totalOperatingExpenses: 0,
      ebitda: 0,
      depreciation: 0,
      netProfit: 0
    };

    // Initialize item FY totals
    Object.keys(pnlData.revenue).forEach(k => totalsFY.revenue[k] = 0);
    Object.keys(pnlData.costOfSales).forEach(k => totalsFY.costOfSales[k] = 0);
    Object.keys(pnlData.operatingExpenses).forEach(k => totalsFY.operatingExpenses[k] = 0);

    MONTHS.forEach(m => {
      const mKey = m.key;

      // Sum Revenue
      let mRevTotal = 0;
      Object.keys(pnlData.revenue).forEach(k => {
        const val = pnlData.revenue[k].values[mKey] || 0;
        mRevTotal += val;
        totalsFY.revenue[k] += val;
      });

      // Sum Cost of Sales
      let mCosTotal = 0;
      Object.keys(pnlData.costOfSales).forEach(k => {
        const val = pnlData.costOfSales[k].values[mKey] || 0;
        mCosTotal += val;
        totalsFY.costOfSales[k] += val;
      });

      const mGrossProfit = mRevTotal - mCosTotal;
      const mGrossMarginPct = mRevTotal > 0 ? (mGrossProfit / mRevTotal) * 100 : 0;

      // Sum Operating Expenses
      let mOpexTotal = 0;
      Object.keys(pnlData.operatingExpenses).forEach(k => {
        const val = pnlData.operatingExpenses[k].values[mKey] || 0;
        mOpexTotal += val;
        totalsFY.operatingExpenses[k] += val;
      });

      const mEbitda = mGrossProfit - mOpexTotal;
      const mDepr = pnlData.depreciation.values[mKey] || 0;
      totalsFY.depreciation += mDepr;
      const mNetProfit = mEbitda - mDepr;
      const mNetMarginPct = mRevTotal > 0 ? (mNetProfit / mRevTotal) * 100 : 0;

      monthlyMetrics[mKey] = {
        totalRevenue: mRevTotal,
        totalCostOfSales: mCosTotal,
        grossProfit: mGrossProfit,
        grossMarginPct: mGrossMarginPct,
        totalOperatingExpenses: mOpexTotal,
        ebitda: mEbitda,
        depreciation: mDepr,
        netProfit: mNetProfit,
        netMarginPct: mNetMarginPct
      };

      totalsFY.totalRevenue += mRevTotal;
      totalsFY.totalCostOfSales += mCosTotal;
      totalsFY.totalOperatingExpenses += mOpexTotal;
    });

    totalsFY.grossProfit = totalsFY.totalRevenue - totalsFY.totalCostOfSales;
    totalsFY.grossMarginPct = totalsFY.totalRevenue > 0 ? (totalsFY.grossProfit / totalsFY.totalRevenue) * 100 : 0;
    totalsFY.ebitda = totalsFY.grossProfit - totalsFY.totalOperatingExpenses;
    totalsFY.netProfit = totalsFY.ebitda - totalsFY.depreciation;
    totalsFY.netMarginPct = totalsFY.totalRevenue > 0 ? (totalsFY.netProfit / totalsFY.totalRevenue) * 100 : 0;

    return { monthlyMetrics, totalsFY };
  };

  const { monthlyMetrics, totalsFY } = calculateMetrics();

  // Quick stats calculations
  let bestMonth = { label: 'Aug-26', val: 0 };
  let weakestMonth = { label: 'Sep-26', val: 0 };
  let profitableCount = 0;

  MONTHS.forEach((m, idx) => {
    const netP = monthlyMetrics[m.key].netProfit;
    if (netP > 0) profitableCount++;
    if (idx === 0 || netP > bestMonth.val) {
      bestMonth = { label: m.label, val: netP };
    }
    if (idx === 0 || netP < weakestMonth.val) {
      weakestMonth = { label: m.label, val: netP };
    }
  });

  const avgMonthlyNetProfit = totalsFY.netProfit / 12;

  // Print PDF
  const handlePrintPDF = () => {
    const origTitle = document.title;
    document.title = `CEO Executive P&L Financial Tracker - Turning Point Retail Solutions`;
    window.print();
    setTimeout(() => { document.title = origTitle; }, 1000);
  };

  // Export Word (.doc)
  const handleExportWord = () => {
    const content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <title>CEO Monthly Revenue & P&L Tracker</title>
        <style>
          body { font-family: Arial, sans-serif; font-size: 11px; color: #1E293B; }
          h1 { color: #065F46; border-bottom: 3px solid #10B981; padding-bottom: 4px; font-size: 18px; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 10px; }
          th, td { border: 1px solid #CBD5E1; padding: 5px 8px; text-align: right; }
          th { background-color: #065F46; color: #FFFFFF; text-align: center; }
          td.label-col { text-align: left; font-weight: bold; }
          tr.header-row td { background-color: #065F46; color: #FFFFFF; font-weight: bold; text-align: left; }
          tr.total-row td { background-color: #FEF08A; font-weight: bold; color: #854D0E; }
          tr.net-row td { background-color: #065F46; color: #FFFFFF; font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>TURNING POINT RETAIL SOLUTIONS</h1>
        <p><strong>Monthly Revenue & P&L Tracker | FY Aug 2026 - Jul 2027 | Figures in USD</strong></p>
        <p>CONFIDENTIAL Executive CEO Report • Generated for Walter Dantis (CEO)</p>
        
        <table>
          <thead>
            <tr>
              <th style="width:25%; text-align:left;">Description</th>
              ${MONTHS.map(m => `<th>${m.label}</th>`).join('')}
              <th>Total (FY)</th>
              <th>Avg / Month</th>
            </tr>
          </thead>
          <tbody>
            <tr class="header-row"><td colspan="15">REVENUE</td></tr>
            ${Object.keys(pnlData.revenue).map(k => `
              <tr>
                <td class="label-col">${pnlData.revenue[k].label}</td>
                ${MONTHS.map(m => `<td>${formatNum(pnlData.revenue[k].values[m.key])}</td>`).join('')}
                <td><strong>${formatNum(totalsFY.revenue[k])}</strong></td>
                <td>${formatNum(totalsFY.revenue[k] / 12)}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td class="label-col">TOTAL REVENUE</td>
              ${MONTHS.map(m => `<td>${formatNum(monthlyMetrics[m.key].totalRevenue)}</td>`).join('')}
              <td><strong>${formatNum(totalsFY.totalRevenue)}</strong></td>
              <td>${formatNum(totalsFY.totalRevenue / 12)}</td>
            </tr>

            <tr class="header-row"><td colspan="15">COST OF SALES (Direct Project Costs)</td></tr>
            ${Object.keys(pnlData.costOfSales).map(k => `
              <tr>
                <td class="label-col">${pnlData.costOfSales[k].label}</td>
                ${MONTHS.map(m => `<td>${formatNum(pnlData.costOfSales[k].values[m.key])}</td>`).join('')}
                <td><strong>${formatNum(totalsFY.costOfSales[k])}</strong></td>
                <td>${formatNum(totalsFY.costOfSales[k] / 12)}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td class="label-col">TOTAL COST OF SALES</td>
              ${MONTHS.map(m => `<td>${formatNum(monthlyMetrics[m.key].totalCostOfSales)}</td>`).join('')}
              <td><strong>${formatNum(totalsFY.totalCostOfSales)}</strong></td>
              <td>${formatNum(totalsFY.totalCostOfSales / 12)}</td>
            </tr>

            <tr class="total-row">
              <td class="label-col">GROSS PROFIT</td>
              ${MONTHS.map(m => `<td>${formatNum(monthlyMetrics[m.key].grossProfit)}</td>`).join('')}
              <td><strong>${formatNum(totalsFY.grossProfit)}</strong></td>
              <td>${formatNum(totalsFY.grossProfit / 12)}</td>
            </tr>

            <tr class="header-row"><td colspan="15">OPERATING EXPENSES</td></tr>
            ${Object.keys(pnlData.operatingExpenses).map(k => `
              <tr>
                <td class="label-col">${pnlData.operatingExpenses[k].label}</td>
                ${MONTHS.map(m => `<td>${formatNum(pnlData.operatingExpenses[k].values[m.key])}</td>`).join('')}
                <td><strong>${formatNum(totalsFY.operatingExpenses[k])}</strong></td>
                <td>${formatNum(totalsFY.operatingExpenses[k] / 12)}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td class="label-col">TOTAL OPERATING EXPENSES</td>
              ${MONTHS.map(m => `<td>${formatNum(monthlyMetrics[m.key].totalOperatingExpenses)}</td>`).join('')}
              <td><strong>${formatNum(totalsFY.totalOperatingExpenses)}</strong></td>
              <td>${formatNum(totalsFY.totalOperatingExpenses / 12)}</td>
            </tr>

            <tr class="net-row">
              <td class="label-col">NET PROFIT / (LOSS)</td>
              ${MONTHS.map(m => `<td>${formatNum(monthlyMetrics[m.key].netProfit)}</td>`).join('')}
              <td><strong>${formatNum(totalsFY.netProfit)}</strong></td>
              <td>${formatNum(totalsFY.netProfit / 12)}</td>
            </tr>
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CEO_Monthly_PnL_Report_Aug2026_Jul2027.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // If user is not CEO / Admin, block access completely
  if (!isCeo) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', background: '#FFFFFF', borderRadius: '16px', margin: '20px auto', maxWidth: '600px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
        <div style={{ width: '64px', height: '64px', background: '#FEF2F2', color: '#DC2626', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <Lock size={32} />
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0F172A', marginBottom: '8px' }}>Restricted CEO Executive Dashboard</h2>
        <p style={{ fontSize: '0.85rem', color: '#64748B', lineHeight: 1.6, marginBottom: '20px' }}>
          The Monthly Revenue & P&L Financial Tracker and Executive Comparison Dashboard is strictly reserved for CEO <strong>Walter Dantis</strong>.
        </p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', fontFamily: 'Segoe UI, Arial, sans-serif' }}>
      
      {/* Toast Notification */}
      {saveToast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: '#065F46',
          color: '#FFFFFF',
          padding: '12px 20px',
          borderRadius: '30px',
          fontSize: '0.82rem',
          fontWeight: 800,
          boxShadow: '0 8px 24px rgba(6,95,70,0.3)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Sparkles size={16} /> {saveToast}
        </div>
      )}

      {/* HEADER BANNER (GREEN BRAND BAR) */}
      <div className="no-print" style={{ 
        background: 'linear-gradient(135deg, #065F46 0%, #047857 100%)', 
        borderRadius: '16px', 
        padding: '24px 28px', 
        color: '#FFFFFF', 
        marginBottom: '20px', 
        boxShadow: '0 4px 20px rgba(6,95,70,0.15)',
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ background: '#FEF08A', color: '#854D0E', fontSize: '0.72rem', fontWeight: 900, padding: '3px 10px', borderRadius: '20px', textTransform: 'uppercase' }}>
              CEO Executive Financial Dashboard
            </span>
            <span style={{ background: 'rgba(255,255,255,0.2)', color: '#FFFFFF', fontSize: '0.72rem', fontWeight: 800, padding: '3px 8px', borderRadius: '4px' }}>
              FY Aug 2026 – Jul 2027
            </span>
            <span style={{ background: '#2563EB', color: '#FFFFFF', fontSize: '0.72rem', fontWeight: 800, padding: '3px 8px', borderRadius: '4px' }}>
              ⚡ Real-time Cloud Saved
            </span>
            <span style={{ fontSize: '0.78rem', color: '#A7F3D0' }}>Figures in USD ($)</span>
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#FFFFFF', margin: 0, letterSpacing: '-0.02em' }}>
            TURNING POINT RETAIL SOLUTIONS
          </h1>
          <p style={{ fontSize: '0.84rem', color: '#A7F3D0', margin: '4px 0 0 0' }}>
            Monthly Revenue & P&L Tracker | Interactive CEO Financial Control & Executive Bottom-Line Comparison
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={handleResetSampleData}
            style={{ padding: '10px 16px', fontSize: '0.82rem', fontWeight: 800, background: 'rgba(255,255,255,0.12)', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Reset P&L data back to sample values"
          >
            <RotateCcw size={15} /> Reset Sample Figures
          </button>

          <button 
            onClick={handleExportWord}
            style={{ padding: '10px 16px', fontSize: '0.82rem', fontWeight: 800, background: 'rgba(255,255,255,0.18)', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Download Word (.doc) P&L Financial Report"
          >
            <FileText size={15} /> Export Word (.doc)
          </button>

          <button 
            onClick={handlePrintPDF}
            style={{ padding: '10px 20px', fontSize: '0.88rem', fontWeight: 900, background: '#FEF08A', color: '#854D0E', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(254,240,138,0.4)' }}
            title="Print or Save PDF Executive P&L Report"
          >
            <Printer size={16} /> Print / Save PDF 🖨️
          </button>
        </div>
      </div>

      {/* HOW TO USE BANNER */}
      <div className="no-print" style={{ 
        background: '#FEF3C7', 
        borderLeft: '4px solid #F59E0B', 
        padding: '12px 18px', 
        borderRadius: '8px', 
        marginBottom: '20px', 
        fontSize: '0.82rem', 
        color: '#92400E',
        lineHeight: 1.5,
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <Edit3 size={18} style={{ color: '#D97706', flexShrink: 0 }} />
        <div>
          <strong>HOW TO USE:</strong> Type your actual monthly figures into the <span style={{ color: '#1D4ED8', fontWeight: 800 }}>BLUE input cells</span> only. Totals, margins and the bottom-line comparison tab update automatically. August is pre-filled with sample figures — overwrite with real numbers or delete and enter your own.
        </div>
      </div>

      {/* SUB-TABS NAVIGATION (PNL TRACKER vs BOTTOM-LINE COMPARISON) */}
      <div className="no-print" style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '2px solid #E2E8F0', paddingBottom: '4px' }}>
        <button
          onClick={() => setActiveSubTab('PNL_TRACKER')}
          style={{
            background: activeSubTab === 'PNL_TRACKER' ? '#065F46' : 'transparent',
            color: activeSubTab === 'PNL_TRACKER' ? '#FFFFFF' : '#64748B',
            border: 'none',
            borderRadius: '8px 8px 0 0',
            padding: '10px 20px',
            fontSize: '0.85rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s'
          }}
        >
          <TrendingUp size={16} /> <span>Monthly P&L Tracker</span>
        </button>

        <button
          onClick={() => setActiveSubTab('COMPARISON_CHARTS')}
          style={{
            background: activeSubTab === 'COMPARISON_CHARTS' ? '#065F46' : 'transparent',
            color: activeSubTab === 'COMPARISON_CHARTS' ? '#FFFFFF' : '#64748B',
            border: 'none',
            borderRadius: '8px 8px 0 0',
            padding: '10px 20px',
            fontSize: '0.85rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s'
          }}
        >
          <PieChart size={16} /> <span>Monthly Bottom-Line Comparison & Charts</span>
        </button>
      </div>

      {/* PRINT HEADER FOR PAPER OUTPUT */}
      <div className="print-only" style={{ display: 'none', marginBottom: '20px', textAlign: 'center', borderBottom: '2px solid #065F46', paddingBottom: '12px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 900, color: '#065F46', margin: 0 }}>TURNING POINT RETAIL SOLUTIONS</h1>
        <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B', margin: '4px 0' }}>Monthly Revenue & P&L Tracker | FY Aug 2026 - Jul 2027</h2>
        <p style={{ fontSize: '10px', color: '#64748B', margin: 0 }}>CONFIDENTIAL Executive CEO Report • Generated for Walter Dantis (CEO)</p>
      </div>

      {/* TAB 1: MONTHLY PNL TRACKER TABLE */}
      {(activeSubTab === 'PNL_TRACKER' || window.matchMedia('print').matches) && (
        <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #CBD5E1', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', marginBottom: '24px' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', minWidth: '1100px' }}>
              <thead>
                <tr style={{ background: '#065F46', color: '#FFFFFF', textTransform: 'uppercase' }}>
                  <th style={{ padding: '10px 14px', textAlign: 'left', width: '260px', fontWeight: 800 }}>Description</th>
                  {MONTHS.map(m => (
                    <th key={m.key} style={{ padding: '10px 8px', textAlign: 'right', width: '70px', fontWeight: 800 }}>{m.label}</th>
                  ))}
                  <th style={{ padding: '10px 10px', textAlign: 'right', width: '90px', background: '#044E39', fontWeight: 900 }}>Total (FY)</th>
                  <th style={{ padding: '10px 10px', textAlign: 'right', width: '85px', background: '#033B2B', fontWeight: 900 }}>Avg / Month</th>
                </tr>
              </thead>
              <tbody>

                {/* --- SECTION 1: REVENUE --- */}
                <tr style={{ background: '#065F46', color: '#FFFFFF', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <td colSpan={15} style={{ padding: '8px 14px' }}>REVENUE</td>
                </tr>

                {Object.keys(pnlData.revenue).map((itemKey) => {
                  const item = pnlData.revenue[itemKey];
                  return (
                    <tr key={itemKey} style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '8px 14px', fontWeight: 600, color: '#334155' }}>{item.label}</td>
                      {MONTHS.map(m => {
                        const val = item.values[m.key] || 0;
                        return (
                          <td key={m.key} style={{ padding: '4px 6px', textAlign: 'right', background: '#EFF6FF' }}>
                            <input
                              type="number"
                              className="no-print-input"
                              value={val === 0 ? '' : val}
                              placeholder="-"
                              onChange={(e) => handleCellChange('revenue', itemKey, m.key, e.target.value)}
                              style={{
                                width: '100%',
                                textAlign: 'right',
                                border: '1px solid transparent',
                                background: 'transparent',
                                color: '#1D4ED8',
                                fontWeight: 700,
                                fontSize: '0.78rem',
                                padding: '3px 4px',
                                outline: 'none',
                                borderRadius: '4px'
                              }}
                              onFocus={(e) => e.target.style.background = '#FFFFFF'}
                              onBlur={(e) => e.target.style.background = 'transparent'}
                            />
                            <span className="print-only-text" style={{ display: 'none', fontWeight: 700, color: '#1D4ED8' }}>
                              {formatNum(val)}
                            </span>
                          </td>
                        );
                      })}
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 800, color: '#0F172A', background: '#F8FAFC' }}>
                        {formatNum(totalsFY.revenue[itemKey])}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#475569', background: '#F1F5F9' }}>
                        {formatNum(totalsFY.revenue[itemKey] / 12)}
                      </td>
                    </tr>
                  );
                })}

                {/* TOTAL REVENUE ROW (GOLD) */}
                <tr style={{ background: '#EAB308', color: '#000000', fontWeight: 900 }}>
                  <td style={{ padding: '10px 14px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>TOTAL REVENUE</td>
                  {MONTHS.map(m => (
                    <td key={m.key} style={{ padding: '10px 8px', textAlign: 'right' }}>
                      {formatNum(monthlyMetrics[m.key].totalRevenue)}
                    </td>
                  ))}
                  <td style={{ padding: '10px 10px', textAlign: 'right', background: '#CA8A04' }}>
                    {formatNum(totalsFY.totalRevenue)}
                  </td>
                  <td style={{ padding: '10px 10px', textAlign: 'right', background: '#A16207' }}>
                    {formatNum(totalsFY.totalRevenue / 12)}
                  </td>
                </tr>

                {/* --- SECTION 2: COST OF SALES --- */}
                <tr style={{ background: '#065F46', color: '#FFFFFF', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <td colSpan={15} style={{ padding: '8px 14px' }}>COST OF SALES (Direct Project Costs)</td>
                </tr>

                {Object.keys(pnlData.costOfSales).map((itemKey) => {
                  const item = pnlData.costOfSales[itemKey];
                  return (
                    <tr key={itemKey} style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '8px 14px', fontWeight: 600, color: '#334155' }}>{item.label}</td>
                      {MONTHS.map(m => {
                        const val = item.values[m.key] || 0;
                        return (
                          <td key={m.key} style={{ padding: '4px 6px', textAlign: 'right', background: '#EFF6FF' }}>
                            <input
                              type="number"
                              className="no-print-input"
                              value={val === 0 ? '' : val}
                              placeholder="-"
                              onChange={(e) => handleCellChange('costOfSales', itemKey, m.key, e.target.value)}
                              style={{
                                width: '100%',
                                textAlign: 'right',
                                border: '1px solid transparent',
                                background: 'transparent',
                                color: '#1D4ED8',
                                fontWeight: 700,
                                fontSize: '0.78rem',
                                padding: '3px 4px',
                                outline: 'none',
                                borderRadius: '4px'
                              }}
                              onFocus={(e) => e.target.style.background = '#FFFFFF'}
                              onBlur={(e) => e.target.style.background = 'transparent'}
                            />
                            <span className="print-only-text" style={{ display: 'none', fontWeight: 700, color: '#1D4ED8' }}>
                              {formatNum(val)}
                            </span>
                          </td>
                        );
                      })}
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 800, color: '#0F172A', background: '#F8FAFC' }}>
                        {formatNum(totalsFY.costOfSales[itemKey])}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#475569', background: '#F1F5F9' }}>
                        {formatNum(totalsFY.costOfSales[itemKey] / 12)}
                      </td>
                    </tr>
                  );
                })}

                {/* TOTAL COST OF SALES ROW */}
                <tr style={{ background: '#F1F5F9', color: '#0F172A', fontWeight: 800, borderTop: '1.5px solid #CBD5E1' }}>
                  <td style={{ padding: '9px 14px', textTransform: 'uppercase' }}>TOTAL COST OF SALES</td>
                  {MONTHS.map(m => (
                    <td key={m.key} style={{ padding: '9px 8px', textAlign: 'right' }}>
                      {formatNum(monthlyMetrics[m.key].totalCostOfSales)}
                    </td>
                  ))}
                  <td style={{ padding: '9px 10px', textAlign: 'right', background: '#E2E8F0' }}>
                    {formatNum(totalsFY.totalCostOfSales)}
                  </td>
                  <td style={{ padding: '9px 10px', textAlign: 'right', background: '#CBD5E1' }}>
                    {formatNum(totalsFY.totalCostOfSales / 12)}
                  </td>
                </tr>

                {/* --- SECTION 3: GROSS PROFIT --- */}
                <tr style={{ background: '#FEF08A', color: '#854D0E', fontWeight: 900, borderTop: '2px solid #EAB308', borderBottom: '1px solid #EAB308' }}>
                  <td style={{ padding: '10px 14px', textTransform: 'uppercase' }}>GROSS PROFIT</td>
                  {MONTHS.map(m => (
                    <td key={m.key} style={{ padding: '10px 8px', textAlign: 'right' }}>
                      {formatNum(monthlyMetrics[m.key].grossProfit)}
                    </td>
                  ))}
                  <td style={{ padding: '10px 10px', textAlign: 'right', background: '#FDE047' }}>
                    {formatNum(totalsFY.grossProfit)}
                  </td>
                  <td style={{ padding: '10px 10px', textAlign: 'right', background: '#EAB308', color: '#FFFFFF' }}>
                    {formatNum(totalsFY.grossProfit / 12)}
                  </td>
                </tr>

                <tr style={{ background: '#FEFCE8', color: '#713F12', fontSize: '0.72rem', fontStyle: 'italic' }}>
                  <td style={{ padding: '6px 14px', fontWeight: 700 }}>Gross Margin %</td>
                  {MONTHS.map(m => (
                    <td key={m.key} style={{ padding: '6px 8px', textAlign: 'right' }}>
                      {formatPct(monthlyMetrics[m.key].grossMarginPct)}
                    </td>
                  ))}
                  <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 800 }}>
                    {formatPct(totalsFY.grossMarginPct)}
                  </td>
                  <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 800 }}>
                    {formatPct(totalsFY.grossMarginPct)}
                  </td>
                </tr>

                {/* --- SECTION 4: OPERATING EXPENSES --- */}
                <tr style={{ background: '#065F46', color: '#FFFFFF', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <td colSpan={15} style={{ padding: '8px 14px' }}>OPERATING EXPENSES</td>
                </tr>

                {Object.keys(pnlData.operatingExpenses).map((itemKey) => {
                  const item = pnlData.operatingExpenses[itemKey];
                  return (
                    <tr key={itemKey} style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '8px 14px', fontWeight: 600, color: '#334155' }}>{item.label}</td>
                      {MONTHS.map(m => {
                        const val = item.values[m.key] || 0;
                        return (
                          <td key={m.key} style={{ padding: '4px 6px', textAlign: 'right', background: '#EFF6FF' }}>
                            <input
                              type="number"
                              className="no-print-input"
                              value={val === 0 ? '' : val}
                              placeholder="-"
                              onChange={(e) => handleCellChange('operatingExpenses', itemKey, m.key, e.target.value)}
                              style={{
                                width: '100%',
                                textAlign: 'right',
                                border: '1px solid transparent',
                                background: 'transparent',
                                color: '#1D4ED8',
                                fontWeight: 700,
                                fontSize: '0.78rem',
                                padding: '3px 4px',
                                outline: 'none',
                                borderRadius: '4px'
                              }}
                              onFocus={(e) => e.target.style.background = '#FFFFFF'}
                              onBlur={(e) => e.target.style.background = 'transparent'}
                            />
                            <span className="print-only-text" style={{ display: 'none', fontWeight: 700, color: '#1D4ED8' }}>
                              {formatNum(val)}
                            </span>
                          </td>
                        );
                      })}
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 800, color: '#0F172A', background: '#F8FAFC' }}>
                        {formatNum(totalsFY.operatingExpenses[itemKey])}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#475569', background: '#F1F5F9' }}>
                        {formatNum(totalsFY.operatingExpenses[itemKey] / 12)}
                      </td>
                    </tr>
                  );
                })}

                {/* TOTAL OPERATING EXPENSES ROW */}
                <tr style={{ background: '#F1F5F9', color: '#0F172A', fontWeight: 800, borderTop: '1.5px solid #CBD5E1' }}>
                  <td style={{ padding: '9px 14px', textTransform: 'uppercase' }}>TOTAL OPERATING EXPENSES</td>
                  {MONTHS.map(m => (
                    <td key={m.key} style={{ padding: '9px 8px', textAlign: 'right' }}>
                      {formatNum(monthlyMetrics[m.key].totalOperatingExpenses)}
                    </td>
                  ))}
                  <td style={{ padding: '9px 10px', textAlign: 'right', background: '#E2E8F0' }}>
                    {formatNum(totalsFY.totalOperatingExpenses)}
                  </td>
                  <td style={{ padding: '9px 10px', textAlign: 'right', background: '#CBD5E1' }}>
                    {formatNum(totalsFY.totalOperatingExpenses / 12)}
                  </td>
                </tr>

                {/* --- SECTION 5: EBITDA & NET PROFIT --- */}
                <tr style={{ background: '#F8FAFC', color: '#0F172A', fontWeight: 800, borderTop: '2px solid #94A3B8' }}>
                  <td style={{ padding: '9px 14px', textTransform: 'uppercase' }}>EBITDA (Operating Profit)</td>
                  {MONTHS.map(m => (
                    <td key={m.key} style={{ padding: '9px 8px', textAlign: 'right' }}>
                      {formatNum(monthlyMetrics[m.key].ebitda)}
                    </td>
                  ))}
                  <td style={{ padding: '9px 10px', textAlign: 'right', background: '#E2E8F0' }}>
                    {formatNum(totalsFY.ebitda)}
                  </td>
                  <td style={{ padding: '9px 10px', textAlign: 'right', background: '#CBD5E1' }}>
                    {formatNum(totalsFY.ebitda / 12)}
                  </td>
                </tr>

                <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <td style={{ padding: '8px 14px', fontWeight: 600, color: '#64748B' }}>Depreciation & Amortization</td>
                  {MONTHS.map(m => (
                    <td key={m.key} style={{ padding: '8px 8px', textAlign: 'right', color: '#64748B' }}>
                      {formatNum(monthlyMetrics[m.key].depreciation)}
                    </td>
                  ))}
                  <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#64748B' }}>
                    {formatNum(totalsFY.depreciation)}
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#64748B' }}>
                    {formatNum(totalsFY.depreciation / 12)}
                  </td>
                </tr>

                {/* NET PROFIT / (LOSS) FINAL HIGHLIGHT ROW */}
                <tr style={{ background: '#065F46', color: '#FFFFFF', fontWeight: 900, fontSize: '0.82rem' }}>
                  <td style={{ padding: '12px 14px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>NET PROFIT / (LOSS)</td>
                  {MONTHS.map(m => {
                    const np = monthlyMetrics[m.key].netProfit;
                    return (
                      <td key={m.key} style={{ padding: '12px 8px', textAlign: 'right', background: np > 0 ? '#047857' : np < 0 ? '#DC2626' : '#065F46' }}>
                        {formatNum(np)}
                      </td>
                    );
                  })}
                  <td style={{ padding: '12px 10px', textAlign: 'right', background: '#044E39', color: '#FEF08A' }}>
                    <strong>{formatNum(totalsFY.netProfit)}</strong>
                  </td>
                  <td style={{ padding: '12px 10px', textAlign: 'right', background: '#033B2B', color: '#FEF08A' }}>
                    <strong>{formatNum(totalsFY.netProfit / 12)}</strong>
                  </td>
                </tr>

                <tr style={{ background: '#ECFDF5', color: '#065F46', fontSize: '0.72rem', fontStyle: 'italic' }}>
                  <td style={{ padding: '6px 14px', fontWeight: 700 }}>Net Profit Margin %</td>
                  {MONTHS.map(m => (
                    <td key={m.key} style={{ padding: '6px 8px', textAlign: 'right' }}>
                      {formatPct(monthlyMetrics[m.key].netMarginPct)}
                    </td>
                  ))}
                  <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 800 }}>
                    {formatPct(totalsFY.netMarginPct)}
                  </td>
                  <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 800 }}>
                    {formatPct(totalsFY.netMarginPct)}
                  </td>
                </tr>

              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: MONTHLY BOTTOM-LINE COMPARISON & CHARTS */}
      {(activeSubTab === 'COMPARISON_CHARTS' || window.matchMedia('print').matches) && (
        <div>
          
          {/* BOTTOM LINE COMPARISON TABLE */}
          <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #CBD5E1', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', marginBottom: '24px' }}>
            <div style={{ padding: '16px 20px', background: '#065F46', color: '#FFFFFF', borderBottom: '1px solid #047857' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 900, margin: 0 }}>TURNING POINT RETAIL SOLUTIONS - Monthly Bottom-Line Comparison</h3>
              <p style={{ fontSize: '0.75rem', color: '#A7F3D0', margin: '3px 0 0 0', fontStyle: 'italic' }}>
                All figures pull automatically from the 'Monthly P&L' tab - nothing to type here. Figures in USD.
              </p>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', minWidth: '1000px' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', color: '#0F172A', textTransform: 'uppercase', borderBottom: '2px solid #CBD5E1' }}>
                    <th style={{ padding: '10px 14px', textAlign: 'left', width: '220px', fontWeight: 800 }}>Metric</th>
                    {MONTHS.map(m => (
                      <th key={m.key} style={{ padding: '10px 8px', textAlign: 'right', width: '65px', fontWeight: 800 }}>{m.label}</th>
                    ))}
                    <th style={{ padding: '10px 10px', textAlign: 'right', width: '85px', background: '#E2E8F0', fontWeight: 900 }}>Total (FY)</th>
                    <th style={{ padding: '10px 10px', textAlign: 'right', width: '80px', background: '#CBD5E1', fontWeight: 900 }}>Avg / Month</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '8px 14px', fontWeight: 700 }}>Total Revenue</td>
                    {MONTHS.map(m => <td key={m.key} style={{ padding: '8px 8px', textAlign: 'right' }}>{formatNum(monthlyMetrics[m.key].totalRevenue)}</td>)}
                    <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 800, background: '#F8FAFC' }}>{formatNum(totalsFY.totalRevenue)}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, background: '#F1F5F9' }}>{formatNum(totalsFY.totalRevenue / 12)}</td>
                  </tr>

                  <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '8px 14px', color: '#64748B' }}>Total Cost of Sales</td>
                    {MONTHS.map(m => <td key={m.key} style={{ padding: '8px 8px', textAlign: 'right', color: '#64748B' }}>{formatNum(monthlyMetrics[m.key].totalCostOfSales)}</td>)}
                    <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>{formatNum(totalsFY.totalCostOfSales)}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>{formatNum(totalsFY.totalCostOfSales / 12)}</td>
                  </tr>

                  <tr style={{ background: '#FEF08A', color: '#854D0E', fontWeight: 800 }}>
                    <td style={{ padding: '8px 14px' }}>Gross Profit</td>
                    {MONTHS.map(m => <td key={m.key} style={{ padding: '8px 8px', textAlign: 'right' }}>{formatNum(monthlyMetrics[m.key].grossProfit)}</td>)}
                    <td style={{ padding: '8px 10px', textAlign: 'right', background: '#FDE047' }}>{formatNum(totalsFY.grossProfit)}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', background: '#EAB308', color: '#FFF' }}>{formatNum(totalsFY.grossProfit / 12)}</td>
                  </tr>

                  <tr style={{ fontSize: '0.72rem', color: '#713F12', fontStyle: 'italic', borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '6px 14px' }}>Gross Margin %</td>
                    {MONTHS.map(m => <td key={m.key} style={{ padding: '6px 8px', textAlign: 'right' }}>{formatPct(monthlyMetrics[m.key].grossMarginPct)}</td>)}
                    <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700 }}>{formatPct(totalsFY.grossMarginPct)}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right' }}>{formatPct(totalsFY.grossMarginPct)}</td>
                  </tr>

                  <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '8px 14px', color: '#64748B' }}>Total Operating Expenses</td>
                    {MONTHS.map(m => <td key={m.key} style={{ padding: '8px 8px', textAlign: 'right', color: '#64748B' }}>{formatNum(monthlyMetrics[m.key].totalOperatingExpenses)}</td>)}
                    <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>{formatNum(totalsFY.totalOperatingExpenses)}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>{formatNum(totalsFY.totalOperatingExpenses / 12)}</td>
                  </tr>

                  <tr style={{ borderBottom: '1px solid #E2E8F0', fontWeight: 700 }}>
                    <td style={{ padding: '8px 14px' }}>EBITDA</td>
                    {MONTHS.map(m => <td key={m.key} style={{ padding: '8px 8px', textAlign: 'right' }}>{formatNum(monthlyMetrics[m.key].ebitda)}</td>)}
                    <td style={{ padding: '8px 10px', textAlign: 'right', background: '#F8FAFC' }}>{formatNum(totalsFY.ebitda)}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', background: '#F1F5F9' }}>{formatNum(totalsFY.ebitda / 12)}</td>
                  </tr>

                  <tr style={{ background: '#EAB308', color: '#000000', fontWeight: 900, fontSize: '0.82rem' }}>
                    <td style={{ padding: '10px 14px' }}>NET PROFIT / (LOSS)</td>
                    {MONTHS.map(m => <td key={m.key} style={{ padding: '10px 8px', textAlign: 'right' }}>{formatNum(monthlyMetrics[m.key].netProfit)}</td>)}
                    <td style={{ padding: '10px 10px', textAlign: 'right', background: '#CA8A04', color: '#FFF' }}>{formatNum(totalsFY.netProfit)}</td>
                    <td style={{ padding: '10px 10px', textAlign: 'right', background: '#A16207', color: '#FFF' }}>{formatNum(totalsFY.netProfit / 12)}</td>
                  </tr>

                  <tr style={{ fontSize: '0.72rem', fontStyle: 'italic', background: '#FEFCE8', color: '#854D0E' }}>
                    <td style={{ padding: '6px 14px', fontWeight: 700 }}>Net Profit Margin %</td>
                    {MONTHS.map(m => <td key={m.key} style={{ padding: '6px 8px', textAlign: 'right' }}>{formatPct(monthlyMetrics[m.key].netMarginPct)}</td>)}
                    <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 800 }}>{formatPct(totalsFY.netMarginPct)}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 800 }}>{formatPct(totalsFY.netMarginPct)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* QUICK STATS CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '12px', padding: '16px', borderLeft: '4px solid #065F46' }}>
              <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Best Net Profit Month</span>
              <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#065F46', marginTop: '4px' }}>
                {bestMonth.label} — <span style={{ color: '#047857' }}>{formatMoney(bestMonth.val)}</span>
              </div>
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '12px', padding: '16px', borderLeft: '4px solid #DC2626' }}>
              <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Weakest Net Profit Month</span>
              <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#DC2626', marginTop: '4px' }}>
                {weakestMonth.label} — <span style={{ color: '#991B1B' }}>{formatMoney(weakestMonth.val)}</span>
              </div>
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '12px', padding: '16px', borderLeft: '4px solid #2563EB' }}>
              <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Average Monthly Net Profit</span>
              <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#2563EB', marginTop: '4px' }}>
                {formatMoney(avgMonthlyNetProfit)}
              </div>
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '12px', padding: '16px', borderLeft: '4px solid #F59E0B' }}>
              <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Months Profitable (of 12)</span>
              <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#D97706', marginTop: '4px' }}>
                {profitableCount} Month{profitableCount !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {/* VISUAL CHARTS CONTAINER */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            
            {/* CHART 1: NET PROFIT BY MONTH */}
            <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #CBD5E1', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <TrendingUp size={18} style={{ color: '#2563EB' }} /> Net Profit by Month (USD)
              </h3>
              <div style={{ height: '220px', display: 'flex', alignItems: 'flex-end', gap: '8px', padding: '10px 0', borderBottom: '1.5px solid #CBD5E1', position: 'relative' }}>
                {MONTHS.map(m => {
                  const np = monthlyMetrics[m.key].netProfit;
                  const maxNp = Math.max(...MONTHS.map(mth => monthlyMetrics[mth.key].netProfit), 2000);
                  const barHeightPct = maxNp > 0 ? Math.max((np / maxNp) * 100, 3) : 3;

                  return (
                    <div key={m.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: '0.62rem', fontWeight: 800, color: np > 0 ? '#047857' : np < 0 ? '#DC2626' : '#94A3B8', marginBottom: '4px' }}>
                        {np > 0 ? formatNum(np) : np < 0 ? `(${formatNum(Math.abs(np))})` : '-'}
                      </span>
                      <div style={{
                        width: '100%',
                        maxWidth: '24px',
                        height: `${barHeightPct}%`,
                        background: np > 0 ? '#2563EB' : np < 0 ? '#EF4444' : '#E2E8F0',
                        borderRadius: '4px 4px 0 0',
                        transition: 'height 0.3s ease'
                      }} />
                      <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#64748B', marginTop: '6px' }}>{m.label.split('-')[0]}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CHART 2: REVENUE vs EXPENSES vs NET PROFIT */}
            <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #CBD5E1', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <TrendingUp size={18} style={{ color: '#059669' }} /> Revenue vs Total Expenses vs Net Profit
              </h3>
              <div style={{ height: '220px', display: 'flex', alignItems: 'flex-end', gap: '8px', padding: '10px 0', borderBottom: '1.5px solid #CBD5E1', position: 'relative' }}>
                {MONTHS.map(m => {
                  const rev = monthlyMetrics[m.key].totalRevenue;
                  const exp = monthlyMetrics[m.key].totalOperatingExpenses + monthlyMetrics[m.key].totalCostOfSales;
                  const maxRev = Math.max(...MONTHS.map(mth => monthlyMetrics[mth.key].totalRevenue), 6000);
                  
                  const revHeight = maxRev > 0 ? Math.max((rev / maxRev) * 100, 2) : 2;
                  const expHeight = maxRev > 0 ? Math.max((exp / maxRev) * 100, 2) : 2;

                  return (
                    <div key={m.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                      <div style={{ display: 'flex', gap: '2px', alignItems: 'flex-end', width: '100%', height: '100%', justifyContent: 'center' }}>
                        {/* Revenue Bar */}
                        <div style={{ width: '45%', height: `${revHeight}%`, background: '#854D0E', borderRadius: '2px 2px 0 0' }} title={`Revenue: $${rev}`} />
                        {/* Expenses Bar */}
                        <div style={{ width: '45%', height: `${expHeight}%`, background: '#F59E0B', borderRadius: '2px 2px 0 0' }} title={`Expenses: $${exp}`} />
                      </div>
                      <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#64748B', marginTop: '6px' }}>{m.label.split('-')[0]}</span>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '12px', fontSize: '0.72rem', fontWeight: 700 }}>
                <span style={{ color: '#854D0E' }}>■ Total Revenue</span>
                <span style={{ color: '#F59E0B' }}>■ Total Expenses</span>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* PRINT STYLES */}
      <style>{`
        @media print {
          body { background: #FFFFFF !important; padding: 0 !important; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          .no-print-input { display: none !important; }
          .print-only-text { display: inline !important; }
          table { width: 100% !important; font-size: 8.5pt !important; border-collapse: collapse !important; }
          th, td { padding: 4px 6px !important; border: 1px solid #94A3B8 !important; }
          .stats-grid, .stats-card { break-inside: avoid; }
        }
      `}</style>

    </div>
  );
}
