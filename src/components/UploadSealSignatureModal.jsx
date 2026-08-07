import React, { useState } from 'react';
import { X, Upload, CheckCircle2, ShieldCheck, Image as ImageIcon, Trash2 } from 'lucide-react';

export default function UploadSealSignatureModal({ initialSignature = '', initialSeal = '', onSave, onClose }) {
  const [signatureUrl, setSignatureUrl] = useState(initialSignature);
  const [sealUrl, setSealUrl] = useState(initialSeal);

  // File upload handlers (convert file to base64 Data URL)
  const handleSignatureFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSignatureUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSealFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSealUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ signatureUrl, sealUrl });
    onClose();
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 100005 }}>
      <div className="modal-content" style={{ width: '90%', maxWidth: '640px', padding: '0', borderRadius: '16px', overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', color: '#FFF', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={20} style={{ color: 'var(--brand-green)' }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#FFF' }}>
              CEO Official Signature & Company Seal Stamp
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
        <form onSubmit={handleSubmit} style={{ padding: '24px', background: '#F8FAFC' }}>
          <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '0 0 20px 0', lineHeight: '1.5' }}>
            Upload or paste the CEO Official Signature and Company Rubber Stamp Seal. They will be automatically stamped on all official Tax Invoices.
          </p>

          {/* CEO Signature Upload Section */}
          <div style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <ImageIcon size={16} style={{ color: 'var(--brand-green)' }} /> 1. CEO Official Digital Signature (Walter Dantis)
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', alignItems: 'center' }}>
              <div>
                <input 
                  type="file"
                  accept="image/*"
                  onChange={handleSignatureFileUpload}
                  style={{ display: 'none' }}
                  id="sig-file-input"
                />
                <label 
                  htmlFor="sig-file-input"
                  className="btn-secondary"
                  style={{ width: '100%', justifyContent: 'center', padding: '8px 12px', fontSize: '0.78rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Upload size={14} /> Choose Signature File
                </label>
              </div>

              <div>
                <input 
                  type="text"
                  placeholder="Or paste Image URL..."
                  value={signatureUrl}
                  onChange={e => setSignatureUrl(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', fontSize: '0.78rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                />
              </div>
            </div>

            {/* Signature Preview */}
            {signatureUrl && (
              <div style={{ marginTop: '12px', padding: '10px', background: '#F1F5F9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569', display: 'block' }}>Signature Preview:</span>
                  <img src={signatureUrl} alt="CEO Signature" style={{ maxHeight: '50px', maxWidth: '200px', marginTop: '4px', objectFit: 'contain' }} />
                </div>
                <button type="button" onClick={() => setSignatureUrl('')} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}>
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Company Rubber Stamp Seal Upload Section */}
          <div style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <ShieldCheck size={16} style={{ color: '#DC2626' }} /> 2. Official Company Stamp / Seal Image (TBCG Partners Co., Ltd)
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', alignItems: 'center' }}>
              <div>
                <input 
                  type="file"
                  accept="image/*"
                  onChange={handleSealFileUpload}
                  style={{ display: 'none' }}
                  id="seal-file-input"
                />
                <label 
                  htmlFor="seal-file-input"
                  className="btn-secondary"
                  style={{ width: '100%', justifyContent: 'center', padding: '8px 12px', fontSize: '0.78rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Upload size={14} /> Choose Seal Stamp File
                </label>
              </div>

              <div>
                <input 
                  type="text"
                  placeholder="Or paste Image URL..."
                  value={sealUrl}
                  onChange={e => setSealUrl(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', fontSize: '0.78rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                />
              </div>
            </div>

            {/* Seal Preview */}
            {sealUrl && (
              <div style={{ marginTop: '12px', padding: '10px', background: '#FEF2F2', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#991B1B', display: 'block' }}>Company Stamp Seal Preview:</span>
                  <img src={sealUrl} alt="Company Seal Stamp" style={{ maxHeight: '70px', maxWidth: '120px', marginTop: '4px', objectFit: 'contain' }} />
                </div>
                <button type="button" onClick={() => setSealUrl('')} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}>
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="btn-secondary" onClick={onClose} style={{ padding: '8px 16px' }}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" style={{ padding: '8px 24px', fontSize: '0.85rem' }}>
              <CheckCircle2 size={15} /> Save Signature & Seal
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
