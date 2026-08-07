import React from 'react';
import { X, Printer, Download, Mail, Phone, Globe, MapPin, Building, FileText, CheckCircle2 } from 'lucide-react';

export default function InvoicePrintPreviewModal({ invoice, onClose }) {
  if (!invoice) return null;

  const subtotal = (invoice.items || []).reduce((sum, item) => sum + (parseFloat(item.quantity || 0) * parseFloat(item.unitPrice || 0)), 0);
  const vatAmount = subtotal * 0.10; // 10% VAT
  const grandTotal = subtotal + vatAmount;
  const amountReceived = parseFloat(invoice.amountReceived || 0);
  const balanceDue = grandTotal - amountReceived;

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay invoice-modal-overlay" style={{ zIndex: 100000 }}>
      <div className="modal-content invoice-preview-container" style={{ width: '92%', maxWidth: '900px', maxHeight: '92vh', display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden', borderRadius: '16px' }}>
        
        {/* Modal Controls Bar (Hidden during window.print()) */}
        <div className="no-print" style={{ background: '#0F172A', color: '#FFF', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} style={{ color: 'var(--brand-green)' }} />
            <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#FFF' }}>
              {invoice.includeVat !== false ? 'Official Tax Invoice Preview:' : 'Official Quotation Preview:'} {invoice.taxInvoiceNo || 'TP-INV-2026-001'}
            </h3>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {invoice.driveLink && (
              <a
                href={invoice.driveLink}
                target="_blank"
                rel="noreferrer"
                style={{ background: 'rgba(255,255,255,0.15)', color: '#FFF', padding: '8px 14px', borderRadius: '8px', fontWeight: 700, fontSize: '0.78rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                ☁️ Open Google Drive Backup
              </a>
            )}
            <button 
              onClick={handlePrint}
              style={{ background: 'var(--brand-green)', color: '#FFF', border: 'none', padding: '8px 18px', borderRadius: '8px', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Printer size={15} /> Print / Save as PDF
            </button>
            <button 
              onClick={onClose} 
              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#FFF', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Official Invoice Document */}
        <div className="printable-invoice-paper" style={{ padding: '32px 40px', overflowY: 'auto', flex: 1, background: '#FFFFFF', color: '#1E293B', fontFamily: 'Poppins, sans-serif' }}>
          
          {/* Header Row: Company Brand Logo & Official Tax Invoice Label */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid var(--brand-green)', paddingBottom: '16px', marginBottom: '20px' }}>
            <div>
              <img 
                src="https://www.turningpointretail.com/images/turning-point-new-logo.png" 
                alt="Turning Point Retail Solutions Logo" 
                style={{ height: '54px', width: 'auto', marginBottom: '8px' }}
              />
              <h2 style={{ fontSize: '1rem', fontWeight: 900, color: '#0F172A', margin: '0 0 2px 0' }}>Turning Point Retail Solutions</h2>
              <div style={{ fontSize: '0.75rem', color: '#475569', lineHeight: '1.4' }}>
                {invoice.includeVat !== false && <p style={{ margin: 0, fontWeight: 700 }}>VAT TIN: E000-2400000027</p>}
                <p style={{ margin: 0 }}>{invoice.companyAddress || 'Office no:-#17F-10D, Morgan Towers, Sopheak Mongkul Street, Koh Pich, Phnom Penh, Cambodia'}</p>
                <p style={{ margin: 0 }}>Tel: +855 (0) 86 844 464 | Email: info@turningpointretail.com | www.turningpointretail.com</p>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ background: invoice.includeVat !== false ? 'var(--brand-green)' : '#0F172A', color: '#FFFFFF', padding: '6px 16px', borderRadius: '6px', fontSize: '1.1rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', display: 'inline-block', marginBottom: '8px' }}>
                {invoice.includeVat !== false ? 'TAX INVOICE' : 'QUOTATION'}
              </div>
              <div style={{ fontSize: '0.82rem', color: '#334155' }}>
                <p style={{ margin: 0 }}><strong>{invoice.includeVat !== false ? 'Invoice No:' : 'Quotation No:'}</strong> {invoice.taxInvoiceNo || 'TP-INV-2026-001'}</p>
                <p style={{ margin: '2px 0 0 0' }}><strong>Date:</strong> {invoice.invoiceDate || new Date().toISOString().split('T')[0]}</p>
                <p style={{ margin: '2px 0 0 0' }}><strong>Due Date:</strong> {invoice.dueDate || 'Upon Receipt'}</p>
              </div>
            </div>
          </div>

          {/* Customer Information Block */}
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px 18px', marginBottom: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: '4px' }}>Billed To (Customer Information):</div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A', margin: '0 0 4px 0' }}>{invoice.companyName || 'N/A'}</h4>
              <p style={{ fontSize: '0.78rem', color: '#334155', margin: '0 0 2px 0' }}><strong>Contact Person:</strong> {invoice.contactPerson || 'N/A'}</p>
              <p style={{ fontSize: '0.78rem', color: '#334155', margin: 0 }}><strong>Customer Address:</strong> {invoice.customerAddress || 'N/A'}</p>
            </div>

            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: '4px' }}>Contact Details & Status:</div>
              <p style={{ fontSize: '0.78rem', color: '#334155', margin: '0 0 2px 0' }}><strong>Telephone:</strong> {invoice.telephoneNumber || 'N/A'}</p>
              <p style={{ fontSize: '0.78rem', color: '#334155', margin: '0 0 2px 0' }}><strong>Payment Status:</strong> <span style={{ fontWeight: 800, color: balanceDue <= 0 ? '#047857' : '#DC2626' }}>{balanceDue <= 0 ? 'PAID IN FULL' : amountReceived > 0 ? 'PARTIALLY PAID' : 'PENDING PAYMENT'}</span></p>
            </div>
          </div>

          {/* Line Items Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
            <thead>
              <tr style={{ background: '#0F172A', color: '#FFFFFF', fontSize: '0.75rem', textTransform: 'uppercase', textAlign: 'left' }}>
                <th style={{ padding: '10px 12px', borderRadius: '6px 0 0 0', width: '50px' }}>No</th>
                <th style={{ padding: '10px 12px' }}>Description / Scope of Service</th>
                <th style={{ padding: '10px 12px', textAlign: 'center', width: '90px' }}>Quantity</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', width: '120px' }}>Unit Price</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', borderRadius: '0 6px 0 0', width: '130px' }}>Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {(invoice.items || []).map((item, idx) => {
                const itemTotal = (parseFloat(item.quantity || 0) * parseFloat(item.unitPrice || 0));
                return (
                  <tr key={idx} style={{ borderBottom: '1px solid #E2E8F0', fontSize: '0.8rem' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: '#64748B' }}>{idx + 1}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#0F172A', lineHeight: '1.4' }}>{item.description}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600 }}>{item.quantity}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.unitPrice)}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, color: '#0F172A' }}>{formatCurrency(itemTotal)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Subtotal & Calculations Box */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '28px' }}>
            <div style={{ width: '320px', background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '10px', padding: '14px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
                <span style={{ color: '#475569', fontWeight: 600 }}>Subtotal:</span>
                <span style={{ fontWeight: 800, color: '#0F172A' }}>{formatCurrency(subtotal)}</span>
              </div>
              {invoice.includeVat !== false ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '8px' }}>
                  <span style={{ color: '#475569', fontWeight: 600 }}>10% VAT:</span>
                  <span style={{ fontWeight: 800, color: 'var(--brand-green)' }}>{formatCurrency(vatAmount)}</span>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '8px' }}>
                  <span style={{ color: '#475569', fontWeight: 600 }}>VAT Tax:</span>
                  <span style={{ fontWeight: 700, color: '#64748B' }}>0% (No Tax)</span>
                </div>
              )}
              <div style={{ borderTop: '2px solid #0F172A', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 900, marginBottom: '6px' }}>
                <span>Grand Total:</span>
                <span style={{ color: '#0F172A' }}>{formatCurrency(grandTotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#047857', marginBottom: '4px' }}>
                <span>Amount Received:</span>
                <span style={{ fontWeight: 800 }}>{formatCurrency(amountReceived)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', fontWeight: 900, color: balanceDue <= 0 ? '#047857' : '#DC2626', borderTop: '1px dashed #CBD5E1', paddingTop: '6px' }}>
                <span>Balance Due:</span>
                <span>{formatCurrency(balanceDue > 0 ? balanceDue : 0)}</span>
              </div>
            </div>
          </div>

          {/* Official Footer Terms & Notes */}
          <div style={{ borderTop: '2px solid #E2E8F0', paddingTop: '16px', fontSize: '0.72rem', color: '#334155', lineHeight: '1.5' }}>
            <h5 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0F172A', margin: '0 0 6px 0', textTransform: 'uppercase' }}>Note & Terms of Payment:</h5>
            <ul style={{ margin: '0 0 12px 0', paddingLeft: '16px', listStyleType: 'disc' }}>
              <li>This quotation is not a contract or a bill.</li>
              <li>The customer will be billed after indicating acceptance of this quote.</li>
              <li>Additional fee may be charged on work outside of scope mentioned above.</li>
              <li><strong>Term of Payments:</strong> {invoice.customPaymentTerms || '50% advance for deposit and another 50% after completion of business registration.'}</li>
              <li>
                If you have any questions, please contact us:
                <ul style={{ margin: '4px 0 0 0', paddingLeft: '16px', listStyleType: 'circle' }}>
                  <li><strong>Walter Dantis</strong>, CEO of Turning Point Retail Solutions</li>
                  <li>Email: <strong>walter.dantis@turningpointretail.com</strong> | Phone: <strong>+855 868 444 64</strong></li>
                </ul>
              </li>
            </ul>

            <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '12px 16px', borderRadius: '8px', color: '#065F46', fontStyle: 'italic', fontWeight: 600, textAlign: 'center' }}>
              “{invoice.customClosingMessage || 'Thank you for your interest in our services. We are committed to supporting your business journey in Cambodia with reliability, transparency, and efficiency. We are looking forward to working with you.'}”
            </div>

            {/* Signature & Seal Block */}
            {(() => {
              const signatureUrl = localStorage.getItem('tp_crm_ceo_signature_v1') || '';
              const sealUrl = localStorage.getItem('tp_crm_company_seal_v1') || '';

              return (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '32px', position: 'relative' }}>
                  <div style={{ textAlign: 'center', width: '200px' }}>
                    <div style={{ borderBottom: '1px solid #94A3B8', height: '45px', marginBottom: '4px' }}></div>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B' }}>Customer Acceptance Signature</span>
                  </div>

                  <div style={{ textAlign: 'center', width: '240px', position: 'relative' }}>
                    {/* Company Seal Stamp Overlay (if uploaded) */}
                    {sealUrl && (
                      <img 
                        src={sealUrl} 
                        alt="Official Company Stamp Seal" 
                        style={{
                          position: 'absolute',
                          right: '-10px',
                          bottom: '-10px',
                          width: '100px',
                          height: '100px',
                          objectFit: 'contain',
                          opacity: 0.85,
                          pointerEvents: 'none',
                          zIndex: 2
                        }}
                      />
                    )}

                    {/* CEO Signature */}
                    <div style={{ borderBottom: '1.5px solid #0F172A', height: '50px', marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
                      {signatureUrl ? (
                        <img src={signatureUrl} alt="Walter Dantis CEO Signature" style={{ maxHeight: '48px', maxWidth: '200px', objectFit: 'contain' }} />
                      ) : (
                        <span style={{ fontFamily: 'cursive', fontSize: '1.1rem', color: '#0F172A', fontWeight: 800 }}>Walter Dantis</span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0F172A', display: 'block' }}>Walter Dantis, CEO</span>
                    <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 600 }}>Turning Point Retail Solutions</div>
                  </div>
                </div>
              );
            })()}
          </div>

        </div>

      </div>
    </div>
  );
}
