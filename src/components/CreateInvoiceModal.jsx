import React, { useState } from 'react';
import { X, Plus, Trash2, Save, FileText, DollarSign, Calculator, Send } from 'lucide-react';

export default function CreateInvoiceModal({ initialInvoice = null, currentUser, onSaveInvoice, onClose }) {
  const isCeo = currentUser?.role === 'CEO' || 
                currentUser?.name?.toLowerCase().includes('walter') || 
                currentUser?.role?.toLowerCase().includes('ceo');

  const isCeoOrAdmin = isCeo || currentUser?.role === 'Admin';

  const [companyName, setCompanyName] = useState(initialInvoice?.companyName || '');
  const [taxInvoiceNo, setTaxInvoiceNo] = useState(initialInvoice?.taxInvoiceNo || `TP-INV-${Date.now().toString().slice(-4)}`);
  const [contactPerson, setContactPerson] = useState(initialInvoice?.contactPerson || '');
  const [customerAddress, setCustomerAddress] = useState(initialInvoice?.customerAddress || '');
  const [invoiceDate, setInvoiceDate] = useState(initialInvoice?.invoiceDate || new Date().toISOString().split('T')[0]);
  const [telephoneNumber, setTelephoneNumber] = useState(initialInvoice?.telephoneNumber || '');
  const [dueDate, setDueDate] = useState(initialInvoice?.dueDate || '');
  const [amountReceived, setAmountReceived] = useState(initialInvoice?.amountReceived || 0);

  // New fields for Tax option, Custom terms/notes, Address & Drive Backup
  const [includeVat, setIncludeVat] = useState(initialInvoice?.includeVat !== undefined ? initialInvoice.includeVat : true);
  const [companyAddress, setCompanyAddress] = useState(initialInvoice?.companyAddress || 'Office no:-#17F-10D, Morgan Towers, Sopheak Mongkul Street, Koh Pich, Phnom Penh, Cambodia');
  const [customPaymentTerms, setCustomPaymentTerms] = useState(initialInvoice?.customPaymentTerms || '50% advance for deposit and another 50% after completion of business registration.');
  const [customClosingMessage, setCustomClosingMessage] = useState(initialInvoice?.customClosingMessage || 'Thank you for your interest in our services. We are committed to supporting your business journey in Cambodia with reliability, transparency, and efficiency. We are looking forward to working with you.');
  const DEFAULT_DRIVE_BACKUP = 'https://drive.google.com/drive/folders/1yC_diQ2kUNra-aLgMJf7cWpMbDKFb233?usp=sharing';
  const [driveLink, setDriveLink] = useState(initialInvoice?.driveLink || DEFAULT_DRIVE_BACKUP);

  // Entry mode toggle: BILL_WISE (overall bill entry) vs ITEM_WISE (line item breakdown)
  const [entryMode, setEntryMode] = useState('BILL_WISE');
  const [billAmount, setBillAmount] = useState(initialInvoice?.subtotal || initialInvoice?.grandTotal || 2500);

  const [items, setItems] = useState(initialInvoice?.items || [
    { description: 'Business Registration & License Processing Service', quantity: 1, unitPrice: 2500 }
  ]);

  const handleBillAmountChange = (val) => {
    const num = parseFloat(val || 0);
    setBillAmount(val);
    setItems([{ description: 'Total Business Services / Project Scope Bill', quantity: 1, unitPrice: num }]);
  };

  const handleAddItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0 }]);
  };

  const handleUpdateItem = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const handleRemoveItem = (index) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
  };

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.quantity || 0) * parseFloat(item.unitPrice || 0)), 0);
  const vatAmount = includeVat ? subtotal * 0.10 : 0;
  const grandTotal = subtotal + vatAmount;
  const numAmountReceived = parseFloat(amountReceived || 0);
  const balanceDue = grandTotal - numAmountReceived;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!companyName.trim() || !taxInvoiceNo.trim()) return;

    const invoiceData = {
      id: initialInvoice?.id || `inv-${Date.now()}`,
      companyName: companyName.trim(),
      taxInvoiceNo: taxInvoiceNo.trim(),
      contactPerson: contactPerson.trim(),
      customerAddress: customerAddress.trim(),
      invoiceDate,
      telephoneNumber: telephoneNumber.trim(),
      dueDate,
      amountReceived: numAmountReceived,
      includeVat,
      companyAddress: companyAddress.trim(),
      customPaymentTerms: customPaymentTerms.trim(),
      customClosingMessage: customClosingMessage.trim(),
      driveLink: driveLink.trim(),
      items,
      subtotal,
      vatAmount,
      grandTotal,
      balanceDue,
      createdBy: currentUser?.name || 'CEO',
      createdAt: initialInvoice?.createdAt || new Date().toISOString()
    };

    onSaveInvoice(invoiceData);
  };

  if (!isCeoOrAdmin) {
    return (
      <div className="modal-overlay" style={{ zIndex: 10000 }}>
        <div className="modal-content" style={{ maxWidth: '400px', padding: '24px', textAlign: 'center', borderRadius: '12px' }}>
          <h4 style={{ color: '#DC2626', fontSize: '1rem', fontWeight: 800, marginBottom: '8px' }}>🔒 CEO & Admin Access Only</h4>
          <p style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '16px', lineHeight: '1.4' }}>
            Tax Invoice creation and editing is restricted to the CEO and Admin.
          </p>
          <button className="btn-secondary" onClick={onClose} style={{ fontSize: '0.8rem' }}>
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" style={{ zIndex: 10000 }}>
      <div className="modal-content" style={{ width: '92%', maxWidth: '850px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden', borderRadius: '16px' }}>
        
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', color: '#FFF', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={20} style={{ color: 'var(--brand-green)' }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#FFF' }}>
              {initialInvoice ? 'Edit Tax Invoice' : 'Create New Official Tax Invoice'}
            </h3>
          </div>
          <button 
            onClick={onClose} 
            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#FFF', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', flex: 1, padding: '24px', background: '#F8FAFC' }}>
          
          {/* Document Type & Tax Toggle Banner */}
          <div style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0F172A', display: 'block', marginBottom: '2px' }}>
                Document Billing Mode:
              </label>
              <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                Choose whether to include 10% VAT tax or generate a non-tax Quotation.
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px', background: '#F1F5F9', padding: '4px', borderRadius: '8px' }}>
              <button
                type="button"
                onClick={() => setIncludeVat(true)}
                style={{
                  background: includeVat ? 'var(--brand-green)' : 'transparent',
                  color: includeVat ? '#FFFFFF' : '#64748B',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 14px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Tax Invoice (10% VAT)
              </button>
              <button
                type="button"
                onClick={() => setIncludeVat(false)}
                style={{
                  background: !includeVat ? '#0F172A' : 'transparent',
                  color: !includeVat ? '#FFFFFF' : '#64748B',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 14px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Quotation / Commercial Invoice (No Tax)
              </button>
            </div>
          </div>

          {/* Customer Information Block */}
          <div style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '18px', marginBottom: '20px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              1. Customer & Invoice Details
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Company Name *
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. Turning Point Retail Co., Ltd"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  required
                  style={{ width: '100%', padding: '8px 10px', fontSize: '0.82rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  {includeVat ? 'Tax Invoice No *' : 'Quotation / Invoice No *'}
                </label>
                <input 
                  type="text" 
                  placeholder={includeVat ? 'e.g. TP-INV-2026-001' : 'e.g. TP-QTN-2026-001'}
                  value={taxInvoiceNo}
                  onChange={e => setTaxInvoiceNo(e.target.value)}
                  required
                  style={{ width: '100%', padding: '8px 10px', fontSize: '0.82rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontWeight: 700 }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Contact Person
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. Mr. John Doe"
                  value={contactPerson}
                  onChange={e => setContactPerson(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', fontSize: '0.82rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Customer Address
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. #142 Monivong Blvd, Phnom Penh, Cambodia"
                  value={customerAddress}
                  onChange={e => setCustomerAddress(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', fontSize: '0.82rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Invoice Date
                </label>
                <input 
                  type="date" 
                  value={invoiceDate}
                  onChange={e => setInvoiceDate(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', fontSize: '0.82rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Telephone Number
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. +855 12 345 678"
                  value={telephoneNumber}
                  onChange={e => setTelephoneNumber(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', fontSize: '0.82rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Due Date
                </label>
                <input 
                  type="date" 
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', fontSize: '0.82rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                />
              </div>
            </div>
          </div>

          {/* Entry Mode Toggle & Line Items Block */}
          <div style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '18px', marginBottom: '20px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                2. Scope of Service & Entry Mode
              </h4>

              <div style={{ display: 'flex', gap: '6px', background: '#F1F5F9', padding: '3px', borderRadius: '8px' }}>
                <button
                  type="button"
                  onClick={() => setEntryMode('BILL_WISE')}
                  style={{
                    background: entryMode === 'BILL_WISE' ? '#FFFFFF' : 'transparent',
                    color: entryMode === 'BILL_WISE' ? '#0F172A' : '#64748B',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '5px 12px',
                    fontSize: '0.75rem',
                    fontWeight: entryMode === 'BILL_WISE' ? 800 : 600,
                    cursor: 'pointer',
                    boxShadow: entryMode === 'BILL_WISE' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  ⚡ Quick Bill-Wise Entry
                </button>
                <button
                  type="button"
                  onClick={() => setEntryMode('ITEM_WISE')}
                  style={{
                    background: entryMode === 'ITEM_WISE' ? '#FFFFFF' : 'transparent',
                    color: entryMode === 'ITEM_WISE' ? '#0F172A' : '#64748B',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '5px 12px',
                    fontSize: '0.75rem',
                    fontWeight: entryMode === 'ITEM_WISE' ? 800 : 600,
                    cursor: 'pointer',
                    boxShadow: entryMode === 'ITEM_WISE' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  Itemized Scope Breakdown
                </button>
              </div>
            </div>

            {entryMode === 'BILL_WISE' ? (
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px', marginBottom: '10px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', alignItems: 'center' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>
                      Overall Bill Service Description / Scope *
                    </label>
                    <input 
                      type="text"
                      placeholder="e.g. Business Registration & License Processing Service"
                      value={items[0]?.description || ''}
                      onChange={e => handleUpdateItem(0, 'description', e.target.value)}
                      required
                      style={{ width: '100%', padding: '8px 10px', fontSize: '0.82rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 800, color: isCeo ? '#047857' : '#64748B', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>
                      Total Bill Amount ($ USD) *
                    </label>
                    {isCeo ? (
                      <input 
                        type="number"
                        step="0.01"
                        placeholder="e.g. 2500.00"
                        value={billAmount}
                        onChange={e => handleBillAmountChange(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px 10px', fontSize: '0.95rem', fontWeight: 900, color: '#047857', borderRadius: '6px', border: '1.5px solid #A7F3D0', background: '#ECFDF5' }}
                      />
                    ) : (
                      <input 
                        type="text"
                        disabled
                        value="🔒 Restricted to CEO"
                        style={{ width: '100%', padding: '8px 10px', fontSize: '0.8rem', fontWeight: 600, color: '#64748B', borderRadius: '6px', border: '1px dashed #CBD5E1', background: '#F8FAFC', fontStyle: 'italic' }}
                      />
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                  <button 
                    type="button" 
                    className="btn-secondary" 
                    onClick={handleAddItem}
                    style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                  >
                    <Plus size={13} /> Add Item Row
                  </button>
                </div>

            {items.map((item, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1.5fr 1.5fr 40px', gap: '8px', marginBottom: '10px', alignItems: 'center' }}>
                <input 
                  type="text" 
                  placeholder="Scope of Service / Item Description..."
                  value={item.description}
                  onChange={e => handleUpdateItem(idx, 'description', e.target.value)}
                  required
                  style={{ padding: '8px 10px', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                />
                <input 
                  type="number" 
                  min="1"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={e => handleUpdateItem(idx, 'quantity', e.target.value)}
                  required
                  style={{ padding: '8px 10px', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)', textAlign: 'center' }}
                />
                {isCeo ? (
                  <>
                    <input 
                      type="number" 
                      step="0.01"
                      placeholder="Unit Price ($)"
                      value={item.unitPrice}
                      onChange={e => handleUpdateItem(idx, 'unitPrice', e.target.value)}
                      required
                      style={{ padding: '8px 10px', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontWeight: 700 }}
                    />
                    <div style={{ padding: '8px 10px', fontSize: '0.82rem', fontWeight: 800, color: '#0F172A', background: '#F8FAFC', borderRadius: '6px', textAlign: 'right' }}>
                      ${((parseFloat(item.quantity || 0) * parseFloat(item.unitPrice || 0))).toFixed(2)}
                    </div>
                  </>
                ) : (
                  <>
                    <input 
                      type="text" 
                      disabled
                      value="🔒 CEO Only"
                      style={{ padding: '8px 10px', fontSize: '0.75rem', borderRadius: '6px', border: '1px dashed #CBD5E1', background: '#F1F5F9', color: '#64748B', fontStyle: 'italic', textAlign: 'center' }}
                    />
                    <div style={{ padding: '8px 10px', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', background: '#F8FAFC', borderRadius: '6px', textAlign: 'center', fontStyle: 'italic' }}>
                      🔒 Restricted
                    </div>
                  </>
                )}
                {items.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => handleRemoveItem(idx)}
                    style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px' }}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
              </div>
            )}
          </div>

          {/* Calculations & Amount Received Block */}
          <div style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '18px', marginBottom: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
            <div>
              <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#047857', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>
                Amount Received (Deposit / Payment) ($ USD)
              </label>
              {isCeo ? (
                <input 
                  type="number" 
                  step="0.01"
                  placeholder="e.g. 1250.00"
                  value={amountReceived}
                  onChange={e => setAmountReceived(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', fontSize: '1rem', fontWeight: 800, color: '#047857', borderRadius: '8px', border: '1.5px solid #A7F3D0', background: '#ECFDF5' }}
                />
              ) : (
                <input 
                  type="text" 
                  disabled
                  value="🔒 Restricted to CEO"
                  style={{ width: '100%', padding: '10px 12px', fontSize: '0.82rem', fontWeight: 600, color: '#64748B', borderRadius: '8px', border: '1px dashed #CBD5E1', background: '#F8FAFC', fontStyle: 'italic' }}
                />
              )}
              <span style={{ fontSize: '0.68rem', color: '#64748B', marginTop: '4px', display: 'block' }}>
                Can be updated later when customer makes partial or full payments.
              </span>
            </div>

            {isCeo ? (
              <div style={{ background: '#F8FAFC', padding: '12px 16px', borderRadius: '10px', border: '1px solid #CBD5E1' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                  <span style={{ color: '#64748B' }}>Subtotal:</span>
                  <span style={{ fontWeight: 800 }}>${subtotal.toFixed(2)}</span>
                </div>
                {includeVat && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '6px' }}>
                    <span style={{ color: '#64748B' }}>10% VAT:</span>
                    <span style={{ fontWeight: 800, color: 'var(--brand-green)' }}>+${vatAmount.toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', fontWeight: 900, borderTop: '1.5px solid #0F172A', paddingTop: '6px', marginBottom: '6px' }}>
                  <span>Grand Total:</span>
                  <span>${grandTotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', fontWeight: 900, color: balanceDue <= 0 ? '#047857' : '#DC2626', borderTop: '1px dashed #CBD5E1', paddingTop: '4px' }}>
                  <span>Balance Due:</span>
                  <span>${(balanceDue > 0 ? balanceDue : 0).toFixed(2)}</span>
                </div>
              </div>
            ) : (
              <div style={{ background: '#F8FAFC', padding: '14px 16px', borderRadius: '10px', border: '1px dashed #CBD5E1', color: '#64748B', fontSize: '0.78rem', fontStyle: 'italic', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                🔒 Pricing totals and financial amounts are confidential and configured exclusively by CEO (Walter Dantis).
              </div>
            )}
          </div>

          {/* 3. Google Drive Backup & Custom Terms Block */}
          <div style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '18px', marginBottom: '20px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              3. Google Drive Backup & Custom Note Terms (CEO Options)
            </h4>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                ☁️ Google Drive Backup Link / Folder URL (Optional)
              </label>
              <input 
                type="text" 
                placeholder="e.g. https://drive.google.com/drive/folders/1abc... (Save backup PDF or scanned agreement)"
                value={driveLink}
                onChange={e => setDriveLink(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Custom Terms of Payment Note (Auto-filled default)
              </label>
              <input 
                type="text" 
                placeholder="e.g. 50% advance for deposit and another 50% after completion of business registration."
                value={customPaymentTerms}
                onChange={e => setCustomPaymentTerms(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Custom Closing Thank You Message
              </label>
              <textarea 
                rows="2"
                placeholder="Closing message printed at end of invoice..."
                value={customClosingMessage}
                onChange={e => setCustomClosingMessage(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)', resize: 'vertical' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="btn-secondary" onClick={onClose} style={{ padding: '8px 16px' }}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" style={{ padding: '8px 24px', fontSize: '0.85rem' }}>
              <Save size={15} /> Save Tax Invoice
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
