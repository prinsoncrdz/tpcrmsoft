import React, { useState, useEffect } from 'react';
import { Plus, Search, FileText, Printer, Edit2, Trash2, DollarSign, CheckCircle2, Clock, AlertCircle, Building, Calendar, Phone, Sparkles, ShieldCheck } from 'lucide-react';
import CreateInvoiceModal from './CreateInvoiceModal';
import InvoicePrintPreviewModal from './InvoicePrintPreviewModal';
import UploadSealSignatureModal from './UploadSealSignatureModal';

export const OFFICIAL_GOOGLE_DRIVE_BACKUP_URL = 'https://drive.google.com/drive/folders/1yC_diQ2kUNra-aLgMJf7cWpMbDKFb233?usp=sharing';

export default function InvoiceTab({ currentUser }) {
  const isCeoOrAdmin = currentUser?.role === 'CEO' || currentUser?.role === 'Admin';

  const [invoices, setInvoices] = useState(() => {
    const saved = localStorage.getItem(INVOICES_STORAGE_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch (err) { return []; }
    }
    return [
      {
        id: 'inv-1001',
        companyName: 'Cambodia Retail Ventures Co., Ltd',
        taxInvoiceNo: 'TP-INV-2026-001',
        contactPerson: 'Mr. Sokha Chan',
        customerAddress: 'Building 18, Street 288, Chamkarmon, Phnom Penh, Cambodia',
        invoiceDate: '2026-08-01',
        telephoneNumber: '+855 12 888 999',
        dueDate: '2026-08-15',
        amountReceived: 1375.00,
        items: [
          { description: 'Business Registration & License Processing Service in Cambodia', quantity: 1, unitPrice: 2500.00 }
        ],
        subtotal: 2500.00,
        vatAmount: 250.00,
        grandTotal: 2750.00,
        balanceDue: 1375.00,
        createdBy: 'Walter Dantis (CEO)',
        createdAt: new Date().toISOString()
      }
    ];
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL' | 'PAID' | 'PENDING' | 'PARTIAL'
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSealModal, setShowSealModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [previewInvoice, setPreviewInvoice] = useState(null);

  const handleSaveSealSignature = ({ signatureUrl, sealUrl }) => {
    localStorage.setItem('tp_crm_ceo_signature_v1', signatureUrl || '');
    localStorage.setItem('tp_crm_company_seal_v1', sealUrl || '');
  };

  const saveInvoices = (newInvoices) => {
    setInvoices(newInvoices);
    localStorage.setItem(INVOICES_STORAGE_KEY, JSON.stringify(newInvoices));
  };

  const handleSaveInvoice = (invoiceData) => {
    const exists = invoices.some(i => i.id === invoiceData.id);
    let updated = [];
    if (exists) {
      updated = invoices.map(i => i.id === invoiceData.id ? invoiceData : i);
    } else {
      updated = [invoiceData, ...invoices];
    }
    saveInvoices(updated);
    setShowCreateModal(false);
    setEditingInvoice(null);
  };

  const handleDeleteInvoice = (id) => {
    if (window.confirm('Are you sure you want to delete this Tax Invoice?')) {
      const updated = invoices.filter(i => i.id !== id);
      saveInvoices(updated);
    }
  };

  const handleUpdateAmountReceived = (id, newAmount) => {
    const updated = invoices.map(inv => {
      if (inv.id === id) {
        const recv = parseFloat(newAmount || 0);
        const bal = inv.grandTotal - recv;
        return { ...inv, amountReceived: recv, balanceDue: bal > 0 ? bal : 0 };
      }
      return inv;
    });
    saveInvoices(updated);
  };

  // Filter invoices
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = (
      (inv.companyName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.taxInvoiceNo || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.contactPerson || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const isPaid = (inv.balanceDue || 0) <= 0;
    const isPartial = (inv.amountReceived || 0) > 0 && (inv.balanceDue || 0) > 0;
    const isPending = (inv.amountReceived || 0) <= 0 && (inv.balanceDue || 0) > 0;

    let matchesStatus = true;
    if (filterStatus === 'PAID') matchesStatus = isPaid;
    if (filterStatus === 'PARTIAL') matchesStatus = isPartial;
    if (filterStatus === 'PENDING') matchesStatus = isPending;

    return matchesSearch && matchesStatus;
  });

  // Financial Stats
  const totalBilled = invoices.reduce((sum, i) => sum + (i.grandTotal || 0), 0);
  const totalReceived = invoices.reduce((sum, i) => sum + (i.amountReceived || 0), 0);
  const totalOutstanding = invoices.reduce((sum, i) => sum + (i.balanceDue > 0 ? i.balanceDue : 0), 0);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);
  };

  return (
    <div style={{ padding: '24px 0' }}>
      
      {/* Header Banner */}
      <div style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', borderRadius: '16px', padding: '24px 28px', color: '#FFFFFF', marginBottom: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ background: 'var(--brand-green)', color: '#FFF', fontSize: '0.72rem', fontWeight: 800, padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
              Official Tax Invoicing System
            </span>
            <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>VAT TIN: E000-2400000027</span>
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#FFFFFF', margin: 0 }}>Turning Point Tax Invoices & Quotations</h2>
          <p style={{ fontSize: '0.82rem', color: '#94A3B8', margin: '4px 0 0 0' }}>
            Generate official 10% VAT tax invoices with company terms, print PDF, and track customer payments.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <a
            href={OFFICIAL_GOOGLE_DRIVE_BACKUP_URL}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary"
            style={{ padding: '10px 16px', fontSize: '0.82rem', fontWeight: 800, background: '#1E40AF', color: '#FFF', border: '1px solid #3B82F6', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            title="Open official Google Drive folder for invoice bill backups"
          >
            ☁️ Open Google Drive Bills Backup
          </a>

          {isCeoOrAdmin && (
            <>
              <button 
                className="btn-secondary"
                onClick={() => setShowSealModal(true)}
                style={{ padding: '10px 16px', fontSize: '0.82rem', fontWeight: 800, background: 'rgba(255,255,255,0.1)', color: '#FFF', border: '1px solid rgba(255,255,255,0.2)' }}
              >
                <ShieldCheck size={16} style={{ color: 'var(--brand-green)' }} /> CEO Signature & Seal Stamp
              </button>

              <button 
                className="btn-primary"
                onClick={() => { setEditingInvoice(null); setShowCreateModal(true); }}
                style={{ padding: '10px 20px', fontSize: '0.88rem', fontWeight: 800, background: 'var(--brand-green)', borderColor: 'var(--brand-green)', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}
              >
                <Plus size={16} /> Create Tax Invoice
              </button>
            </>
          )}
        </div>
      </div>

      {/* Invoice Financial Stats Grid */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-icon blue"><FileText /></div>
          <div className="stat-details">
            <span className="stat-value">{formatCurrency(totalBilled)}</span>
            <span className="stat-label">Total Invoiced (Grand Total + 10% VAT)</span>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #10B981', background: '#ECFDF5' }}>
          <div className="stat-icon emerald"><CheckCircle2 /></div>
          <div className="stat-details">
            <span className="stat-value" style={{ color: '#047857' }}>{formatCurrency(totalReceived)}</span>
            <span className="stat-label" style={{ color: '#065F46', fontWeight: 600 }}>Total Payments Received</span>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #EF4444', background: '#FEF2F2' }}>
          <div className="stat-icon orange"><AlertCircle /></div>
          <div className="stat-details">
            <span className="stat-value" style={{ color: '#B91C1C' }}>{formatCurrency(totalOutstanding)}</span>
            <span className="stat-label" style={{ color: '#991B1B', fontWeight: 600 }}>Outstanding Balance Due</span>
          </div>
        </div>
      </div>

      {/* Toolbar Filters */}
      <div className="toolbar" style={{ marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '6px', background: '#F1F5F9', padding: '4px', borderRadius: '8px' }}>
          {[
            { id: 'ALL', label: `All Invoices (${invoices.length})` },
            { id: 'PAID', label: 'Paid in Full' },
            { id: 'PARTIAL', label: 'Partially Paid' },
            { id: 'PENDING', label: 'Pending Payment' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              style={{
                background: filterStatus === tab.id ? '#FFFFFF' : 'transparent',
                color: filterStatus === tab.id ? 'var(--text-main)' : 'var(--text-muted)',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '0.78rem',
                fontWeight: filterStatus === tab.id ? 800 : 500,
                cursor: 'pointer',
                boxShadow: filterStatus === tab.id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                fontFamily: 'inherit'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="search-box" style={{ maxWidth: '320px', marginLeft: 'auto' }}>
          <Search className="search-icon" size={16} />
          <input 
            type="text"
            className="search-input"
            placeholder="Search company, invoice #, contact..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Invoices List */}
      {filteredInvoices.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#FFFFFF', borderRadius: '16px', border: '1px dashed var(--border-color)' }}>
          <FileText size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 12px auto' }} />
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>No Tax Invoices Found</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 16px 0' }}>
            Click Create Tax Invoice to generate an official 10% VAT quote or bill for your customers.
          </p>
          {isCeoOrAdmin && (
            <button className="btn-primary" onClick={() => { setEditingInvoice(null); setShowCreateModal(true); }}>
              <Plus size={16} /> Create Tax Invoice
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
          {filteredInvoices.map(inv => {
            const isPaid = (inv.balanceDue || 0) <= 0;
            const isPartial = (inv.amountReceived || 0) > 0 && (inv.balanceDue || 0) > 0;

            return (
              <div 
                key={inv.id}
                style={{
                  background: '#FFFFFF',
                  border: '1.5px solid ' + (isPaid ? '#A7F3D0' : isPartial ? '#FDE68A' : 'var(--border-color)'),
                  borderRadius: '14px',
                  padding: '20px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  justify: 'space-between',
                  transition: 'transform 0.2s ease'
                }}
              >
                <div>
                  {/* Top Status & Invoice No */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <span className="project-id-badge" style={{ background: '#0F172A', color: '#FFF' }}>
                        {inv.taxInvoiceNo}
                      </span>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', margin: '6px 0 2px 0' }}>
                        {inv.companyName}
                      </h3>
                      {inv.contactPerson && (
                        <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                          Contact: <strong>{inv.contactPerson}</strong>
                        </span>
                      )}
                    </div>

                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      background: isPaid ? '#ECFDF5' : isPartial ? '#FFFBEB' : '#FEF2F2',
                      color: isPaid ? '#047857' : isPartial ? '#B45309' : '#B91C1C',
                      border: '1px solid ' + (isPaid ? '#A7F3D0' : isPartial ? '#FDE68A' : '#FCA5A5')
                    }}>
                      {isPaid ? 'PAID IN FULL' : isPartial ? 'PARTIALLY PAID' : 'PENDING PAYMENT'}
                    </span>
                  </div>

                  {/* Dates & Line Items Count */}
                  <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: '8px', fontSize: '0.75rem', color: '#334155', marginBottom: '14px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Date: <strong>{inv.invoiceDate}</strong></span>
                    <span>Due: <strong>{inv.dueDate || 'Upon Receipt'}</strong></span>
                    <span>Items: <strong>{(inv.items || []).length}</strong></span>
                  </div>

                  {/* Pricing Breakdown */}
                  <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '10px', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#64748B', marginBottom: '4px' }}>
                      <span>Subtotal:</span>
                      <span>{formatCurrency(inv.subtotal)}</span>
                    </div>
                    {inv.includeVat !== false ? (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--brand-green)', marginBottom: '4px' }}>
                        <span>10% VAT:</span>
                        <span>+{formatCurrency(inv.vatAmount)}</span>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#64748B', marginBottom: '4px' }}>
                        <span>Tax Mode:</span>
                        <span style={{ fontWeight: 600 }}>0% VAT (No Tax)</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', fontWeight: 900, color: '#0F172A', borderTop: '1px solid #E2E8F0', paddingTop: '4px', marginBottom: '4px' }}>
                      <span>Grand Total:</span>
                      <span>{formatCurrency(inv.grandTotal)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#047857' }}>
                      <span>Amount Received:</span>
                      <span style={{ fontWeight: 800 }}>{formatCurrency(inv.amountReceived)}</span>
                    </div>
                    {inv.balanceDue > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 900, color: '#DC2626', marginTop: '2px' }}>
                        <span>Balance Due:</span>
                        <span>{formatCurrency(inv.balanceDue)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => setPreviewInvoice(inv)}
                      style={{
                        background: 'var(--brand-green)',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: '0 2px 6px rgba(16,185,129,0.2)'
                      }}
                    >
                      <Printer size={13} /> Print PDF
                    </button>

                    {inv.driveLink && (
                      <a
                        href={inv.driveLink}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          background: '#EFF6FF',
                          color: '#2563EB',
                          border: '1px solid #BFDBFE',
                          borderRadius: '6px',
                          padding: '5px 8px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}
                        title="Open Google Drive Backup Folder/File"
                      >
                        ☁️ Drive
                      </a>
                    )}
                  </div>

                  {isCeoOrAdmin && (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => {
                          const val = prompt(`Enter Amount Received for ${inv.companyName}:`, inv.amountReceived || 0);
                          if (val !== null && !isNaN(parseFloat(val))) {
                            handleUpdateAmountReceived(inv.id, val);
                          }
                        }}
                        style={{ background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', borderRadius: '6px', padding: '5px 8px', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}
                        title="Record payment or update amount received"
                      >
                        <DollarSign size={12} /> Payment
                      </button>

                      <button
                        onClick={() => { setEditingInvoice(inv); setShowCreateModal(true); }}
                        style={{ background: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '5px 8px', fontSize: '0.7rem', cursor: 'pointer' }}
                        title="Edit Invoice"
                      >
                        <Edit2 size={12} />
                      </button>

                      <button
                        onClick={() => handleDeleteInvoice(inv.id)}
                        style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5', borderRadius: '6px', padding: '5px 8px', fontSize: '0.7rem', cursor: 'pointer' }}
                        title="Delete Invoice"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Invoice Modal */}
      {showCreateModal && (
        <CreateInvoiceModal 
          initialInvoice={editingInvoice}
          currentUser={currentUser}
          onSaveInvoice={handleSaveInvoice}
          onClose={() => { setShowCreateModal(false); setEditingInvoice(null); }}
        />
      )}

      {/* Official Tax Invoice Print & PDF Preview Modal */}
      {previewInvoice && (
        <InvoicePrintPreviewModal 
          invoice={previewInvoice}
          onClose={() => setPreviewInvoice(null)}
        />
      )}

      {/* CEO Signature & Seal Upload Modal */}
      {showSealModal && (
        <UploadSealSignatureModal 
          initialSignature={localStorage.getItem('tp_crm_ceo_signature_v1') || ''}
          initialSeal={localStorage.getItem('tp_crm_company_seal_v1') || ''}
          onSave={handleSaveSealSignature}
          onClose={() => setShowSealModal(false)}
        />
      )}

    </div>
  );
}
