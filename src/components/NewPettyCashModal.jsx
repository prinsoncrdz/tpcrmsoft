import React, { useState } from 'react';
import { X, Plus, DollarSign } from 'lucide-react';

export default function NewPettyCashModal({ onClose, onAddPettyCash, currentUser, activeTab }) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    voucherNo: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
    category: 'Supplies',
    paymentMethod: 'Card/Online',
    paidBy: currentUser?.name || 'Admin Manager',
    cashIn: '$0.00',
    cashOut: '$0.00',
    cardSpent: '$0.00'
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.description) return;

    // Robust monthTag parsing from date string without timezone shifts
    let computedMonthTag = 'sept';
    const dStr = (formData.date || '').toString();
    const match1 = dStr.match(/([0-9]{4})[\/\-]([0-9]{1,2})[\/\-]([0-9]{1,2})/); // YYYY-MM-DD
    const match2 = dStr.match(/([0-9]{1,2})[\/\-]([0-9]{1,2})[\/\-]([0-9]{4})/); // DD-MM-YYYY

    if (match1) {
      const m = parseInt(match1[2]);
      computedMonthTag = m === 7 ? 'july' : (m === 8 ? 'aug' : 'sept');
    } else if (match2) {
      const m = parseInt(match2[2]);
      computedMonthTag = m === 7 ? 'july' : (m === 8 ? 'aug' : 'sept');
    }

    const rawAmt = parseFloat((formData.cardSpent || formData.cashOut || '0').toString().replace('$', '').replace(',', '')) || 0;
    const formattedAmt = `$${rawAmt.toFixed(2)}`;

    const isCash = (formData.paymentMethod || '').toLowerCase().includes('cash');
    const isReimbursement = (formData.category || '').toLowerCase().includes('reimbursement') || (formData.description || '').toLowerCase().includes('reimbursement');

    const formattedData = {
      ...formData,
      monthTag: computedMonthTag,
      cardSpent: isReimbursement ? '$0.00' : (!isCash ? formattedAmt : '$0.00'),
      cashOut: isReimbursement ? '$0.00' : (isCash ? formattedAmt : '$0.00'),
      cashIn: isReimbursement ? formattedAmt : '$0.00'
    };

    onAddPettyCash(formattedData);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: '580px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <DollarSign style={{ color: 'var(--brand-amber)' }} />
            <h3 className="modal-title">Add Petty Cash Record (Syncs to Google Sheet)</h3>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Transaction Date</label>
              <input 
                type="date"
                name="date"
                className="form-input"
                value={formData.date}
                onChange={handleChange}
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Invoice Number</label>
              <input 
                name="voucherNo"
                className="form-input"
                placeholder="e.g. INV-1002"
                value={formData.voucherNo}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description / Expense Details</label>
            <input 
              name="description"
              className="form-input"
              placeholder="e.g. Office Supplies & Stationery"
              value={formData.description}
              onChange={handleChange}
              required 
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select name="category" className="form-select" value={formData.category} onChange={handleChange}>
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
            <div className="form-group">
              <label className="form-label">Payment Method</label>
              <select name="paymentMethod" className="form-select" value={formData.paymentMethod} onChange={handleChange}>
                <option value="ABA QR Code">ABA QR Code</option>
                <option value="Card/Online">Card / Online</option>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Amount ($)</label>
              <input 
                name="cardSpent"
                className="form-input"
                placeholder="0.00"
                value={formData.cardSpent}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    cardSpent: e.target.value,
                    cashOut: formData.paymentMethod === 'Cash' ? e.target.value : '$0.00'
                  });
                }}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Paid By</label>
              <input 
                name="paidBy"
                className="form-input"
                value={formData.paidBy}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Paid By</label>
            <input 
              name="paidBy"
              className="form-input"
              value={formData.paidBy}
              onChange={handleChange}
              required 
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">
              <Plus size={18} /> Add & Sync to Google Sheet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
