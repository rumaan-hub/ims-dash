"use client";
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { apiCallManager } from '@/_api_/apiCallManager';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import type { Office, Staff } from '@/store/reducers/staffStore';

interface AddCustomProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  offices: Office[];
  staff: Staff[];
}

interface VariantRow {
  name: string;
  values: string[];
  valueInput: string; // current text being typed (not persisted)
}

const emptyVariant = (): VariantRow => ({ name: '', values: [], valueInput: '' });

export default function AddCustomProductModal({ isOpen, onClose, onSuccess, offices, staff }: AddCustomProductModalProps) {
  // Product info
  const [name, setName] = useState('');
  const [descriptiveTitle, setDescriptiveTitle] = useState('');
  const [description, setDescription] = useState('');
  // Category + type
  const [category, setCategory] = useState('');
  const [inventoryType, setInventoryType] = useState<'CONSUMABLE' | 'EQUIPMENT'>('CONSUMABLE');
  // Specification
  const [brand, setBrand] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [materialType, setMaterialType] = useState('');
  // Initial stock-in (optional)
  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [officeId, setOfficeId] = useState('');
  const [staffId, setStaffId] = useState('');
  // Variants
  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState<VariantRow[]>([emptyVariant()]);
  // Media
  const [images, setImages] = useState<string[]>([]);
  const [video, setVideo] = useState('');
  // status
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useBodyScrollLock(isOpen);

  const reset = () => {
    setName(''); setDescriptiveTitle(''); setDescription(''); setCategory('');
    setInventoryType('CONSUMABLE'); setBrand(''); setManufacturer(''); setMaterialType('');
    setQuantity(''); setUnitPrice(''); setOfficeId(''); setStaffId('');
    setHasVariants(false); setVariants([emptyVariant()]); setImages([]); setVideo('');
  };
  const handleClose = () => { if (!saving && !uploading) onClose(); };

  // ── Media uploads (reuse apiCallManager.uploadFile → S3 URL) ──
  const upload = async (file: File): Promise<string | null> => {
    try {
      const res = await apiCallManager.uploadFile(file);
      return (res?.Location ?? res?.location ?? res?.url) || null;
    } catch {
      toast.error(`Upload failed: ${file.name}`);
      return null;
    }
  };
  const handleImages = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    const urls: string[] = [];
    for (const f of Array.from(files)) { const u = await upload(f); if (u) urls.push(u); }
    setImages((prev) => [...prev, ...urls]);
    setUploading(false);
  };
  const handleVideo = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    const u = await upload(file);
    if (u) setVideo(u);
    setUploading(false);
  };

  // ── Variant builder ──
  const setVariantName = (i: number, v: string) =>
    setVariants((vs) => vs.map((x, idx) => (idx === i ? { ...x, name: v } : x)));
  const setVariantInput = (i: number, v: string) =>
    setVariants((vs) => vs.map((x, idx) => (idx === i ? { ...x, valueInput: v } : x)));
  const commitValue = (i: number) =>
    setVariants((vs) => vs.map((x, idx) => {
      if (idx !== i) return x;
      const val = x.valueInput.trim().replace(/,+$/, '').trim();
      if (!val || x.values.includes(val)) return { ...x, valueInput: '' };
      return { ...x, values: [...x.values, val], valueInput: '' };
    }));
  const removeValue = (i: number, vi: number) =>
    setVariants((vs) => vs.map((x, idx) => (idx === i ? { ...x, values: x.values.filter((_, k) => k !== vi) } : x)));
  const addVariantRow = () => setVariants((vs) => [...vs, emptyVariant()]);
  const removeVariantRow = (i: number) => setVariants((vs) => vs.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Product Title is required.'); return; }

    // Initial Stock-In is optional. Only when a real quantity is entered do Office +
    // Staff + Unit Price become required (the inventory IN endpoint needs all three).
    const wantsStock = quantity.trim() !== '' && Number(quantity) > 0;
    if (wantsStock && (!officeId || !staffId || unitPrice.trim() === '')) {
      toast.error('Quantity ke saath Office, Staff aur Unit Price zaroori hain.');
      return;
    }

    setSaving(true);
    try {
      const data: Record<string, unknown> = {};
      if (descriptiveTitle.trim()) data.descriptiveTitle = descriptiveTitle.trim();
      if (description.trim()) data.description = description.trim();
      if (category.trim()) data.category = category.trim();
      if (brand.trim()) data.brand = brand.trim();
      if (manufacturer.trim()) data.manufacturer = manufacturer.trim();
      if (materialType.trim()) data.materialType = materialType.trim();

      if (images.length) data.images = images;
      if (video) data.video = video;

      data.hasVariants = hasVariants;
      if (hasVariants) {
        const cleaned = variants
          .map((v) => ({ name: v.name.trim(), values: v.values.map((x) => x.trim()).filter(Boolean) }))
          .filter((v) => v.name || v.values.length);
        if (cleaned.length) data.variants = cleaned;
      }

      // Step 1 — always create the catalog product first.
      const created = await apiCallManager.createCustomProduct({ name: name.trim(), inventory_type: inventoryType, data });
      const customProductId = (created?.id ?? created?.data?.id) as string | undefined;

      // Step 2 — only when a quantity is entered, create a real inventory IN so the product
      // is immediately stocked (appears on grid + KPI + ledger). Reuses the same
      // POST /ims/inventory the "Update Item" form uses, but with customProductId.
      if (wantsStock) {
        if (!customProductId) {
          toast.error('Product ban gaya lekin uska id nahi mila — ise Update Item se stock karein.');
          reset(); onClose(); onSuccess();
          return;
        }
        try {
          await apiCallManager.createInventory({
            customProductId,
            quantity: Number(quantity),
            unit_price: Number(unitPrice),
            office_id: officeId,
            staff_id: staffId,
            transaction_type: 'IN',
            status: 'ACTIVE',
          });
        } catch (stockErr: unknown) {
          // The catalog product already exists — surface the failure clearly and let the
          // user stock it later via Update Item. Do NOT re-run step 1 (avoids a duplicate).
          const se = stockErr as { response?: { data?: { message?: string } }; message?: string };
          toast.error(se?.response?.data?.message || se?.message || 'Product ban gaya lekin stock-in fail hua — ise Update Item se stock karein.');
          reset(); onClose(); onSuccess();
          return;
        }
      }

      toast.success(wantsStock ? 'Custom product created & stocked!' : 'Custom product created!');
      reset();
      onClose();
      onSuccess();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      toast.error(e?.response?.data?.message || e?.message || 'Failed to create custom product');
      // keep modal open + keep form data
    } finally {
      setSaving(false);
    }
  };

  const grid2 = { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 } as const;
  const sectionTitle = { margin: '4px 0 10px', fontSize: 15, fontWeight: 700 } as const;
  const hr = { margin: '18px 0', border: 'none', borderTop: '1px solid #e5e7eb' } as const;
  const chip = { display: 'inline-flex', alignItems: 'center', gap: 4, background: '#e0f2fe', color: '#0369a1', borderRadius: 14, padding: '2px 10px', fontSize: 13 } as const;

  return (
    <div className={`inventory-modal ${isOpen ? 'active' : ''}`} onMouseDown={handleClose}>
      <div className="inventory-modal-content" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Add Custom Product</h2>
          <button type="button" className="modal-close-icon" onClick={handleClose} aria-label="Close modal">&times;</button>
        </div>

        {/* ── Media ── */}
        <h4 style={sectionTitle}>Media</h4>
        <div className="form-group">
          <label className="form-label">Upload Images <small style={{ color: '#94a3b8' }}>(5000×5000 px, max 3 MB)</small></label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {images.map((url, i) => (
              <div key={i} style={{ position: 'relative', width: 72, height: 72, borderRadius: 8, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`image ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button type="button" onClick={() => setImages((p) => p.filter((_, k) => k !== i))}
                  style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,.6)', color: '#fff', border: 'none', borderRadius: '50%', width: 18, height: 18, cursor: 'pointer', lineHeight: '16px' }}>×</button>
              </div>
            ))}
            <label style={{ width: 72, height: 72, border: '2px dashed #cbd5e1', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 28, color: '#94a3b8' }}>
              +
              <input type="file" accept="image/*" multiple hidden onChange={(e) => { handleImages(e.target.files); e.target.value = ''; }} />
            </label>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Upload Video <small style={{ color: '#94a3b8' }}>(max 100 MB, all formats)</small></label>
          <input className="form-input" type="file" accept="video/*" onChange={(e) => handleVideo(e.target.files?.[0] ?? null)} />
          {video && <small style={{ color: '#16a34a' }}>✓ video uploaded</small>}
        </div>

        <hr style={hr} />

        {/* ── Product Information ── */}
        <h4 style={sectionTitle}>Product Information</h4>
        <div className="form-group">
          <label className="form-label">Product Title *</label>
          <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. In-house Composite" />
        </div>
        <div className="form-group">
          <label className="form-label">Descriptive Title</label>
          <input className="form-input" value={descriptiveTitle} onChange={(e) => setDescriptiveTitle(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="form-input" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <hr style={hr} />

        {/* ── Category ── */}
        <h4 style={sectionTitle}>Category</h4>
        <div style={grid2}>
          <div className="form-group">
            <label className="form-label">Product Category</label>
            <input className="form-input" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Free text / tags, e.g. PPE" />
          </div>
          <div className="form-group">
            <label className="form-label">Inventory Type *</label>
            <select className="form-select" value={inventoryType} onChange={(e) => setInventoryType(e.target.value as 'CONSUMABLE' | 'EQUIPMENT')}>
              <option value="CONSUMABLE">Consumable</option>
              <option value="EQUIPMENT">Equipment</option>
            </select>
          </div>
        </div>

        <hr style={hr} />

        {/* ── Product Specification ── */}
        <h4 style={sectionTitle}>Product Specification</h4>
        <div style={grid2}>
          <div className="form-group">
            <label className="form-label">Brand</label>
            <input className="form-input" value={brand} onChange={(e) => setBrand(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Manufacturer</label>
            <input className="form-input" value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Material Type</label>
            <input className="form-input" value={materialType} onChange={(e) => setMaterialType(e.target.value)} placeholder="e.g. plastic, metal, cloth" />
          </div>
        </div>

        <hr style={hr} />

        {/* ── Initial Stock-In (optional) ── */}
        <h4 style={sectionTitle}>Initial Stock-In <small style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</small></h4>
        <div style={grid2}>
          <div className="form-group">
            <label className="form-label">Quantity</label>
            <input className="form-input" type="number" min="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Stock now (leave empty to add later)" />
          </div>
          <div className="form-group">
            <label className="form-label">Unit Price</label>
            <input className="form-input" type="number" min="0" step="0.01" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Office</label>
            <select className="form-select" value={officeId} onChange={(e) => setOfficeId(e.target.value)}>
              <option value="">Select Office</option>
              {(Array.isArray(offices) ? offices : []).map((o) => (
                <option key={o.office_id} value={o.office_id}>{o.office_name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Staff</label>
            <select className="form-select" value={staffId} onChange={(e) => setStaffId(e.target.value)}>
              <option value="">Select Staff</option>
              {(Array.isArray(staff) ? staff : []).map((s) => (
                <option key={s.staff_id} value={s.staff_id}>{s.first_name} {s.last_name}</option>
              ))}
            </select>
          </div>
        </div>

        <hr style={hr} />

        {/* ── Variants ── */}
        <label className="form-checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
          <input type="checkbox" checked={hasVariants} onChange={(e) => setHasVariants(e.target.checked)} />
          This product has variants
        </label>
        {hasVariants && (
          <div style={{ marginTop: 12 }}>
            {variants.map((v, i) => (
              <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <strong>Variant {i + 1}</strong>
                  {variants.length > 1 && (
                    <button type="button" className="modal-close-icon" onClick={() => removeVariantRow(i)} aria-label="Remove variant">&times;</button>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Variant Name</label>
                  <input className="form-input" value={v.name} onChange={(e) => setVariantName(i, e.target.value)} placeholder="e.g. Color, Material" />
                </div>
                <div className="form-group">
                  <label className="form-label">Value(s) <small style={{ color: '#94a3b8' }}>(type and press Enter)</small></label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', border: '1px solid #d1d5db', borderRadius: 6, padding: '6px 8px' }}>
                    {v.values.map((val, vi) => (
                      <span key={vi} style={chip}>
                        {val}
                        <button type="button" onClick={() => removeValue(i, vi)} style={{ border: 'none', background: 'none', color: '#0369a1', cursor: 'pointer', fontSize: 14, lineHeight: 1 }}>×</button>
                      </span>
                    ))}
                    <input
                      value={v.valueInput}
                      onChange={(e) => setVariantInput(i, e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); commitValue(i); } }}
                      onBlur={() => commitValue(i)}
                      placeholder={v.values.length ? 'Add another…' : 'e.g. Red'}
                      style={{ flex: 1, minWidth: 120, border: 'none', outline: 'none', fontSize: 14 }}
                    />
                  </div>
                </div>
              </div>
            ))}
            <button type="button" className="inventory-btn" style={{ background: '#f1f5f9' }} onClick={addVariantRow}>+ Add more variants</button>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22 }}>
          <button type="button" className="inventory-btn" style={{ background: '#e5e7eb' }} onClick={handleClose} disabled={saving || uploading}>Cancel</button>
          <button type="button" className="inventory-btn inventory-btn-primary" onClick={handleSave} disabled={saving || uploading || !name.trim()}>
            {saving ? 'Saving…' : uploading ? 'Uploading…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
