import React, { useState, useEffect } from 'react';
import { Lock, ShieldAlert, DollarSign, Calendar, CheckCircle2, TrendingUp, RefreshCw, Plus, PieChart, BarChart3, CreditCard, Wallet, Layers, Eye, Table, ArrowUpRight, ArrowDownRight, Tag, User } from 'lucide-react';
import { fetchSheetData, SHEET_GIDS, PUBLISHED_SHEET_ID } from '../services/googleSheets';

export default function PettyCashView({ activeTab, currentUser, onOpenNewPettyCashModal, refreshTrigger }) {
  const isAuthorized = currentUser?.role === 'CEO' || currentUser?.role === 'Admin' || currentUser?.role?.includes('Support');
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

  const isDashboardTab = activeTab === 'PETTY_CASH_DASHBOARD';

  const tabTitles = {
    PETTY_CASH_DASHBOARD: 'Petty Cash Executive Graphics Dashboard (gid=2002)',
    PETTY_CASH_JULY: 'July 2026 Petty Cash Transactions (gid=1004)',
    PETTY_CASH_AUG: 'August 2026 Petty Cash Transactions (gid=1001)',
    PETTY_CASH_SEPT: 'September 2026 Petty Cash Transactions (gid=1003)'
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

  if (!isAuthorized) {
    return (
      <div className="restricted-box">
        <div className="restricted-icon">
          <Lock />
        </div>
        <h2 className="restricted-title">Access Restricted - Management Only</h2>
        <p className="restricted-desc">
          The <strong>{tabTitles[activeTab]}</strong> tab is strictly restricted to management. 
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

  // Calculate live analytics across months
  const parseVal = (str) => parseFloat((str || '0').toString().replace('$', '').replace(',', '')) || 0;

  const julyTotal = julyData.reduce((acc, r) => acc + parseVal(r.cardSpent || r.cashOut), 0);
  const augTotal = augData.reduce((acc, r) => acc + parseVal(r.cardSpent || r.cashOut), 0);
  const septTotal = septData.reduce((acc, r) => acc + parseVal(r.cardSpent || r.cashOut), 0);
  const totalYTD = julyTotal + augTotal + septTotal;

  // Category breakdown compile
  const allRows = [...julyData, ...augData, ...septData];
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

  return (
    <div>
      {/* Header Toolbar */}
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

      {/* GOOGLE SHEET MASTER SUMMARY HEADER BAR FOR ALL MONTHS */}
      {!isDashboardTab && (
        <div style={{ 
          background: '#FFFFFF', 
          border: '2px solid var(--brand-green)', 
          borderRadius: 'var(--radius-lg)', 
          padding: '20px 24px', 
          marginBottom: '24px',
          boxShadow: 'var(--shadow-card)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '16px',
          alignItems: 'center'
        }}>
          <div>
            <span style={{ fontSize: '0.73rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Starting Petty Cash</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
              {headerSummary.startingCash || '$0.00'}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.73rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cash In</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#059669', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ArrowUpRight size={20} />
              {headerSummary.cashIn || '$0.00'}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.73rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cash Out</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#DC2626', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ArrowDownRight size={20} />
              {headerSummary.cashOut || '$0.00'}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.73rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Remaining Petty Cash</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2563EB', marginTop: '4px' }}>
              {headerSummary.remainingCash || '$0.00'}
            </div>
          </div>

          <div style={{ background: '#ECFDF5', padding: '12px 16px', borderRadius: '12px', border: '1px solid #A7F3D0' }}>
            <span style={{ fontSize: '0.73rem', fontWeight: 800, color: 'var(--brand-green)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Card / Online Spent</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--brand-green)', marginTop: '2px' }}>
              {headerSummary.cardSpent || `$${activeTabData.reduce((acc, r) => acc + parseVal(r.cardSpent || r.cashOut), 0).toFixed(2)}`}
            </div>
          </div>
        </div>
      )}

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
                    <span style={{ color: 'var(--brand-green)', fontWeight: 800 }}>${julyTotal.toFixed(2)} ({julyData.length} items)</span>
                  </div>
                  <div style={{ width: '100%', height: '14px', background: '#F1F5F9', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, (julyTotal / Math.max(1, totalYTD)) * 100)}%`, height: '100%', background: 'linear-gradient(90deg, #FDB913, #0A6B3D)', borderRadius: '8px', transition: 'width 0.8s ease' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    <span>August 2026</span>
                    <span style={{ color: '#2563EB', fontWeight: 800 }}>${augTotal.toFixed(2)} ({augData.length} items)</span>
                  </div>
                  <div style={{ width: '100%', height: '14px', background: '#F1F5F9', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, (augTotal / Math.max(1, totalYTD)) * 100)}%`, height: '100%', background: 'linear-gradient(90deg, #3B82F6, #1D4ED8)', borderRadius: '8px', transition: 'width 0.8s ease' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    <span>September 2026</span>
                    <span style={{ color: '#059669', fontWeight: 800 }}>${septTotal.toFixed(2)} ({septData.length} items)</span>
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

          {/* Mobile Responsive Cards View for Dashboard */}
          <div className="mobile-crm-cards">
            {allRows.map((item, idx) => (
              <div key={item.id || idx} className="crm-mobile-card">
                <div className="crm-mobile-card-header">
                  <div>
                    <span className="project-id-badge">{item.date}</span>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, marginTop: '4px' }}>{item.description}</h4>
                  </div>
                  <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--brand-green)' }}>{item.cardSpent || '$0.00'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span>Category: <strong>{item.category || 'General'}</strong></span>
                  <span>Voucher: <strong>{item.voucherNo || '-'}</strong></span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
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
                </tr>
              </thead>
              <tbody>
                {allRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                      No transactions recorded. Click "+ Add Transaction" to create an entry live in your Google Sheet!
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
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* NATIVE GOOGLE SHEET IFRAME EMBED MODE */}
      {isDashboardTab && viewMode === 'SHEET_EMBED' && (
        <div style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '16px', boxShadow: 'var(--shadow-card)', minHeight: '650px' }}>
          <div style={{ marginBottom: '12px', fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Eye size={16} style={{ color: 'var(--brand-green)' }} />
            <span>Native Google Sheet Embedded Canvas (gid=2002)</span>
          </div>
          <iframe 
            src={`https://docs.google.com/spreadsheets/d/e/${PUBLISHED_SHEET_ID}/pubhtml/sheet?headers=false&gid=2002`}
            style={{ width: '100%', height: '600px', border: 'none', borderRadius: '8px', background: '#FFF' }}
            title="Google Sheet Native Dashboard Canvas"
          />
        </div>
      )}

      {/* MONTHLY TAB TRANSACTION TABLES (July, August, September) */}
      {!isDashboardTab && (
        <div>
          {/* Mobile Cards for Monthly Tab */}
          <div className="mobile-crm-cards">
            {activeTabData.length === 0 ? (
              <div style={{ background: '#FFFFFF', padding: '30px', textAlign: 'center', borderRadius: '12px', color: 'var(--text-muted)' }}>
                {loading ? 'Fetching live rows from Google Sheet...' : 'No transactions recorded in this tab.'}
              </div>
            ) : (
              activeTabData.map((item, idx) => (
                <div key={item.id || idx} className="crm-mobile-card">
                  <div className="crm-mobile-card-header">
                    <div>
                      <span className="project-id-badge">{item.date}</span>
                      <h4 style={{ fontSize: '1rem', fontWeight: 700, marginTop: '4px' }}>{item.description}</h4>
                    </div>
                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--brand-green)' }}>{item.cardSpent || '$0.00'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span>Category: <strong>{item.category || 'General'}</strong></span>
                    <span>Voucher: <strong>{item.voucherNo || '-'}</strong></span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View */}
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
                </tr>
              </thead>
              <tbody>
                {activeTabData.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                      {loading ? 'Fetching live rows from Google Sheet...' : 'No transactions recorded in this Google Sheet tab.'}
                    </td>
                  </tr>
                ) : (
                  activeTabData.map((item, idx) => (
                    <tr key={item.id || idx}>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.date}</td>
                      <td style={{ fontWeight: 600 }}>{item.description}</td>
                      <td><span className="project-id-badge">{item.voucherNo || '-'}</span></td>
                      <td style={{ color: 'var(--brand-green)', fontWeight: 600 }}>{item.category || 'General'}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.paymentMethod || 'Card/Online'}</td>
                      <td style={{ fontWeight: 800, color: 'var(--brand-green)' }}>{item.cardSpent || '$0.00'}</td>
                      <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{item.cashOut || '$0.00'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
