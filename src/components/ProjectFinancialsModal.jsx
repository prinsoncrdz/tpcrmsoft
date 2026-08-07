import React, { useState } from 'react';
import { X, Plus, DollarSign, TrendingUp, TrendingDown, CreditCard, Receipt, FileText, Trash2, PieChart, ShieldCheck } from 'lucide-react';

export default function ProjectFinancialsModal({ project, currentUser, financialsData = { revenue: 0, expenses: [] }, onSaveFinancials, onClose }) {
  const [revenue, setRevenue] = useState(financialsData.revenue || 0);
  const [expenses, setExpenses] = useState(financialsData.expenses || []);
  const [showAddExpense, setShowAddExpense] = useState(false);

  // New expense form state
  const [expenseTitle, setExpenseTitle] = useState('');
  const [category, setCategory] = useState('Hotel & Accommodation');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer / Online');
  const [receiptNotes, setReceiptNotes] = useState('');

  const isCeoOrAdmin = currentUser?.role === 'CEO' || currentUser?.role === 'Admin';

  const categories = [
    'Hotel & Accommodation',
    'Event Logistics & Freight',
    'Customs Clearance & Duties',
    'Venue & Equipment Hire',
    'Catering & Hospitality',
    'Sub-Contractor / Labour Fees',
    'Permits & Documentation',
    'Miscellaneous / Other'
  ];

  const handleUpdateRevenue = (e) => {
    const val = parseFloat(e.target.value) || 0;
    setRevenue(val);
    onSaveFinancials(project.id, { revenue: val, expenses });
  };

  const handleAddExpense = (e) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!expenseTitle.trim() || isNaN(numAmount) || numAmount <= 0) return;

    const newExpense = {
      id: `exp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: expenseTitle.trim(),
      category,
      amount: numAmount,
      paymentMethod,
      receiptNotes: receiptNotes.trim(),
      addedByName: currentUser?.name || 'CEO',
      addedAt: new Date().toISOString()
    };

    const updatedExpenses = [newExpense, ...expenses];
    setExpenses(updatedExpenses);
    onSaveFinancials(project.id, { revenue, expenses: updatedExpenses });

    // Reset form
    setExpenseTitle('');
    setAmount('');
    setReceiptNotes('');
    setShowAddExpense(false);
  };

  const handleDeleteExpense = (expenseId) => {
    const updatedExpenses = expenses.filter(e => e.id !== expenseId);
    setExpenses(updatedExpenses);
    onSaveFinancials(project.id, { revenue, expenses: updatedExpenses });
  };

  // Calculations
  const totalMoneySpent = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  const netProfit = revenue - totalMoneySpent;
  const profitMarginPct = revenue > 0 ? Math.round((netProfit / revenue) * 100) : 0;

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 10000 }}>
      <div className="modal-content" style={{ width: '90%', maxWidth: '840px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden', borderRadius: '16px' }}>
        
        {/* Modal Header */}
        <div style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', color: '#FFF', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="project-id-badge" style={{ background: '#1E293B', color: 'var(--brand-green)', border: '1px solid var(--brand-green)' }}>
                {project.projectId}
              </span>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>{project.projectName}</h3>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#94A3B8', margin: 0 }}>
              Client: <strong style={{ color: '#E2E8F0' }}>{project.client}</strong> | CEO Project Cost & Expense Tracking
            </p>
          </div>
          <button 
            onClick={onClose} 
            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#FFF', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Financial KPI Cards */}
        <div style={{ background: '#F8FAFC', padding: '16px 24px', borderBottom: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          
          {/* Revenue Box */}
          <div style={{ background: '#FFFFFF', padding: '12px 16px', borderRadius: '10px', border: '1px solid #CBD5E1', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px', display: 'flex', alignItems: 'center', justifyBetween: 'space-between' }}>
              <span>Total Contract Revenue</span>
              <DollarSign size={14} style={{ color: 'var(--brand-green)' }} />
            </div>
            {isCeoOrAdmin ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--brand-green)' }}>$</span>
                <input 
                  type="number" 
                  value={revenue} 
                  onChange={handleUpdateRevenue}
                  placeholder="0.00"
                  style={{ width: '100%', fontSize: '1.1rem', fontWeight: 900, color: 'var(--brand-green)', border: 'none', borderBottom: '1.5px solid var(--brand-green)', outline: 'none', padding: '2px 4px', background: 'transparent' }}
                  title="Click to edit total project contract revenue"
                />
              </div>
            ) : (
              <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--brand-green)' }}>
                {formatCurrency(revenue)}
              </div>
            )}
          </div>

          {/* Total Money Spent / Expenses */}
          <div style={{ background: '#FFFFFF', padding: '12px 16px', borderRadius: '10px', border: '1px solid #FCA5A5', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#991B1B', textTransform: 'uppercase', marginBottom: '4px', display: 'flex', alignItems: 'center', justifyBetween: 'space-between' }}>
              <span>Total Money Spent</span>
              <CreditCard size={14} style={{ color: '#DC2626' }} />
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#DC2626' }}>
              {formatCurrency(totalMoneySpent)}
            </div>
          </div>

          {/* Net Profit Margin */}
          <div style={{ background: netProfit >= 0 ? '#ECFDF5' : '#FEF2F2', padding: '12px 16px', borderRadius: '10px', border: '1px solid ' + (netProfit >= 0 ? '#A7F3D0' : '#FCA5A5'), boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: netProfit >= 0 ? '#047857' : '#991B1B', textTransform: 'uppercase', marginBottom: '4px', display: 'flex', alignItems: 'center', justifyBetween: 'space-between' }}>
              <span>Net Profit Margin ({profitMarginPct}%)</span>
              {netProfit >= 0 ? <TrendingUp size={14} style={{ color: '#047857' }} /> : <TrendingDown size={14} style={{ color: '#DC2626' }} />}
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: netProfit >= 0 ? '#047857' : '#DC2626' }}>
              {formatCurrency(netProfit)}
            </div>
          </div>

        </div>

        {/* Action Header & Form Toggle */}
        <div style={{ padding: '12px 24px', background: '#FFFFFF', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Receipt size={16} style={{ color: 'var(--brand-green)' }} /> Logged Expenses ({expenses.length})
          </h4>
          {isCeoOrAdmin && (
            <button 
              className="btn-primary" 
              onClick={() => setShowAddExpense(!showAddExpense)}
              style={{ fontSize: '0.78rem', padding: '6px 14px' }}
            >
              <Plus size={14} /> {showAddExpense ? 'Cancel' : 'Add Project Expense'}
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          
          {/* Add Expense Form */}
          {showAddExpense && (
            <form onSubmit={handleAddExpense} style={{ background: '#F8FAFC', border: '1.5px solid var(--brand-green)', borderRadius: '12px', padding: '16px', marginBottom: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Plus size={15} style={{ color: 'var(--brand-green)' }} /> Log New Expense Item
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Expense Description / Item *
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. 5-Star Hotel Booking for Delegation / Customs Duty & Clearance Fees..."
                    value={expenseTitle}
                    onChange={e => setExpenseTitle(e.target.value)}
                    required
                    style={{ width: '100%', padding: '8px 10px', fontSize: '0.82rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Expense Category
                  </label>
                  <select 
                    className="cell-input"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', fontSize: '0.8rem', background: '#FFF' }}
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Amount ($ USD) *
                  </label>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    required
                    style={{ width: '100%', padding: '8px 10px', fontSize: '0.82rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontWeight: 700, color: '#DC2626' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Payment Method
                  </label>
                  <select 
                    className="cell-input"
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', fontSize: '0.8rem', background: '#FFF' }}
                  >
                    <option value="Bank Transfer / Online">Bank Transfer / Online</option>
                    <option value="Corporate Credit Card">Corporate Credit Card</option>
                    <option value="Petty Cash">Petty Cash</option>
                    <option value="Cheque Payment">Cheque Payment</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Receipt Notes / Reference ID
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Receipt #9842, uploaded to Google Drive expense folder."
                    value={receiptNotes}
                    onChange={e => setReceiptNotes(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAddExpense(false)} style={{ fontSize: '0.78rem', padding: '6px 12px' }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ fontSize: '0.78rem', padding: '6px 16px' }}>
                  <Plus size={14} /> Log Expense Item
                </button>
              </div>
            </form>
          )}

          {/* Expense Item List */}
          {expenses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', background: '#F8FAFC', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
              <Receipt size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 10px auto' }} />
              <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)' }}>No Expenses Logged Yet</h4>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 14px 0' }}>
                Log project expenses for hotel bookings, freight, clearance, equipment, labor, or vendor invoices.
              </p>
              {isCeoOrAdmin && (
                <button className="btn-primary" onClick={() => setShowAddExpense(true)} style={{ fontSize: '0.78rem' }}>
                  <Plus size={14} /> Add First Expense
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {expenses.map(item => (
                <div 
                  key={item.id}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    padding: '14px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ background: '#FEF2F2', color: '#991B1B', fontSize: '0.65rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>
                        {item.category}
                      </span>
                      <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                        {item.title}
                      </h4>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      <span>Paid via: <strong style={{ color: 'var(--text-main)' }}>{item.paymentMethod}</strong></span>
                      {item.receiptNotes && <span>Notes: <strong style={{ color: 'var(--text-main)' }}>{item.receiptNotes}</strong></span>}
                      <span>Logged by: {item.addedByName} on {new Date(item.addedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '1rem', fontWeight: 900, color: '#DC2626' }}>
                      {formatCurrency(item.amount)}
                    </span>
                    {isCeoOrAdmin && (
                      <button 
                        onClick={() => handleDeleteExpense(item.id)}
                        style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px' }}
                        title="Delete Expense"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Footer */}
        <div style={{ background: '#F8FAFC', padding: '12px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ShieldCheck size={14} style={{ color: 'var(--brand-green)' }} /> Project Revenue & Expenses automatically calculate Net Margin & Profit %
          </span>
          <button className="btn-secondary" onClick={onClose} style={{ fontSize: '0.78rem' }}>
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
