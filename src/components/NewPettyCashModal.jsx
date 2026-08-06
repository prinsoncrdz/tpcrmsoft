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

    // Ensure dollar sign formatting
    const formattedData = {
      ...formData,
      cardSpent: formData.cardSpent.startsWith('$') ? formData.cardSpent : `$${formData.cardSpent}`,
      cashOut: formData.cashOut.startsWith('$') ? formData.cashOut : `$${formData.cashOut}`,
      cashIn: formData.cashIn.startsWith('$') ? formData.cashIn : `$${formData.cashIn}`
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
              <label className="form-label">Bill / Voucher Number</label>
              <input 
                name="voucherNo"
                className="form-input"
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
                <option value="Logistics">Logistics</option>
                <option value="Meals">Meals & Hospitality</option>
                <option value="Stationery">Stationery</option>
                <option value="Software">Software / Subscriptions</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Payment Method</label>
              <select name="paymentMethod" className="form-select" value={formData.paymentMethod} onChange={handleChange}>
                <option value="Card/Online">Card / Online</option>
                <option value="Petty Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Card / Online Spent ($)</label>
              <input 
                name="cardSpent"
                className="form-input"
                placeholder="0.00"
                value={formData.cardSpent}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Cash Out ($)</label>
              <input 
                name="cashOut"
                className="form-input"
                placeholder="0.00"
                value={formData.cashOut}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Cash In ($)</label>
              <input 
                name="cashIn"
                className="form-input"
                placeholder="0.00"
                value={formData.cashIn}
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
