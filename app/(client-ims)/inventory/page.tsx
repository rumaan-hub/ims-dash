"use client";
import React, { useState, useEffect, useRef } from 'react';

import { useInventoryPage } from '@/hooks/useInventory';
import { useSystemActivity } from '@/hooks/useSystemActivity';
import { usePermissions } from '@/hooks/usePermissions';
import AddCustomProductModal from '@/app/components/inventory/AddCustomProductModal';
import type { Office } from '@/store/reducers/staffStore';
import './page.css';

export default function InventoryManagement() {
  const { trackPageOpen } = useSystemActivity();

  useEffect(() => {
    trackPageOpen('Inventory');
  }, [trackPageOpen]);

  const { hasPermission, loading: permsLoading } = usePermissions();
  const canCreate = hasPermission('inventory.create');
  const canEdit = hasPermission('inventory.edit');
  const canDelete = hasPermission('inventory.delete');

  const {
    isLoggedIn, handleLogin,
    loading, error,
    searchTerm, setSearchTerm,
    typeFilter, setTypeFilter,
    vendorFilter, setVendorFilter,
    officeFilter, setOfficeFilter,
    isAddModalOpen, openAddModal,
    isScannerModalOpen, startScanner, closeAllModals,
    scanMode,
    formData, handleFormChange, handleFormSubmit, setFormData,
    videoRef, handleScan,
    groupedProducts, uniqueVendors, offices, staff, allDbProducts,
    dropdownItems, dropdownTotalPages, dropdownIsLoading, fetchDropdownItems,
    isNearExpiry, getFEFOItem,
    handleDeleteItem, fetchProducts, fetchAllDbProducts
  } = useInventoryPage();

  const [productSearch, setProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [dropdownPage, setDropdownPage] = useState(1);
  const itemsPerPage = 8;
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showCustomModal, setShowCustomModal] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProductDropdown(false);
      }
    }

    if (showProductDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProductDropdown]);

  // Sync search text when product changes or edit modal opens.
  // setState-in-effect is intentional — productSearch is a controlled input
  // the user can type into freely, so it can't be a pure derived value.
  useEffect(() => {
    if (formData.productId && Array.isArray(allDbProducts)) {
      const p = allDbProducts.find((p) => String(p.id) === String(formData.productId));
      const productName = p ? (p.title || p.name || '') : '';
      if (p && productSearch !== String(productName)) {
        setProductSearch(String(productName));
      }
    } else if (!formData.productId && !showProductDropdown) {
      setProductSearch('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- productSearch/showProductDropdown intentionally omitted; productSearch is the value being synced and showProductDropdown is read for clearing only.
  }, [formData.productId, allDbProducts]);

  // Filter products for the searchable dropdown via backend using the Hook and Store
  useEffect(() => {
    if (!showProductDropdown) return;

    const delayDebounceFn = setTimeout(async () => {
      const inventoryType = formData.type === 'Consumable' ? 'CONSUMABLE' : 'EQUIPMENT';
      await fetchDropdownItems(productSearch, dropdownPage, itemsPerPage, inventoryType);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchDropdownItems is a stable store fetcher
  }, [productSearch, dropdownPage, formData.type, showProductDropdown]);

  // Render login screen
  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-2xl text-center w-full max-w-md login-box">
          <h1 className="text-4xl md:text-5xl font-bold text-cyan-600 mb-8">Medistry99</h1>
          <input type="text" className="w-full p-4 border-2 rounded-2xl mb-5 text-lg md:text-xl" placeholder="Username" defaultValue="smile" />
          <input type="password" className="w-full p-4 border-2 rounded-2xl mb-8 text-lg md:text-xl" placeholder="Password" defaultValue="123" />
          <button onClick={handleLogin} className="w-full bg-cyan-600 text-white py-4 md:py-6 rounded-2xl text-2xl md:text-3xl font-bold hover:bg-cyan-700">LOGIN</button>
          <p className="mt-6 text-gray-600 text-sm md:text-base">Demo: smile / 123</p>
        </div>
      </div>
    );
  }

  // Render main app
  return (
    <div className="inventory-page-container">
      {/* Content Area */}
      <div className="content-area">
        <div className="search-filter-container">
          <input
            type="text"
            className="search-input"
            placeholder="Search item, batch, brand..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="filter-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All Types</option>
            <option value="Consumable">Consumable</option>
            <option value="Equipment">Equipment</option>
          </select>
          <select
            className="filter-select"
            value={vendorFilter}
            onChange={(e) => setVendorFilter(e.target.value)}
          >
            <option value="">All Vendors</option>
            {uniqueVendors.map(vendor => (
              <option key={vendor} value={vendor}>{vendor}</option>
            ))}
          </select>
          <select
            className="filter-select"
            value={officeFilter}
            onChange={(e) => setOfficeFilter(e.target.value)}
          >
            <option value="">All Offices</option>
            {Array.isArray(offices) && offices.map((o) => (
              <option key={o.office_id} value={o.office_id}>{o.office_name}</option>
            ))}
          </select>
          {!permsLoading && canCreate && (
            <button onClick={() => openAddModal()} className="inventory-btn inventory-btn-primary">
              Update Item
            </button>
          )}
          {!permsLoading && canCreate && (
            <button onClick={() => startScanner('in')} className="inventory-btn inventory-btn-success">
              Scan In
            </button>
          )}
          {!permsLoading && canEdit && (
            <button onClick={() => startScanner('out')} className="inventory-btn inventory-btn-primary">
              Scan Out
            </button>
          )}
          {!permsLoading && canCreate && (
            <button onClick={() => setShowCustomModal(true)} className="inventory-btn inventory-btn-primary">
              + Add Custom Product
            </button>
          )}
        </div>

        <AddCustomProductModal
          isOpen={showCustomModal}
          onClose={() => setShowCustomModal(false)}
          onSuccess={() => { fetchProducts(officeFilter); fetchAllDbProducts(); }}
          offices={offices}
          staff={staff}
        />

        {loading && <div className="loading-state">Loading...</div>}
        {error && <div className="error-state">{error}</div>}

        <div className="inventory-grid">
          {Object.entries(groupedProducts).map(([key, items]) => {
            // ── Compute net stock: IN adds, OUT/TRANSFER/ADJUSTMENT subtracts ──
            const netTotal = items.reduce((acc, item) => {
              const txType = (item.transaction_type || 'IN').toUpperCase();
              const qty = Number(item.available) || 0;
              if (txType === 'IN') return acc + qty;
              if (txType === 'OUT' || txType === 'TRANSFER' || txType === 'ADJUSTMENT') return acc - qty;
              return acc + qty;
            }, 0);

            const first = items[0];
            const fefeItem = getFEFOItem(items);
            const isLowStockGroup = netTotal <= 10;
            const isNearExpiryGroup = items.some(item => isNearExpiry(item));

            // Quantity display colour
            const qtyColor = netTotal <= 0 ? '#ff4d4f' : netTotal <= 10 ? '#faad14' : '#52c41a';

            return (
              <div key={key} className={`inventory-card ${isLowStockGroup ? 'low-stock' : ''} ${isNearExpiryGroup ? 'near-expiry' : ''}`}>
                {fefeItem && fefeItem.id === first.id && (
                  <div className="fefe-badge"></div>
                )}
                <div className="card-header">
                  <h3 className="card-title">{first.name}</h3>
                  <span className={`card-type ${first.type === 'Consumable' ? 'type-consumable' : 'type-equipment'}`}>
                    {first.type}
                  </span>
                </div>

                <div className="card-details">
                  {first.size && (
                    <div className="detail-row">
                      <span className="detail-label">Size:</span>
                      <span className="detail-value">{first.size}</span>
                    </div>
                  )}
                  {first.brand && (
                    <div className="detail-row">
                      <span className="detail-label">Brand:</span>
                      <span className="detail-value">{first.brand}</span>
                    </div>
                  )}
                  {first.material && (
                    <div className="detail-row">
                      <span className="detail-label">Material:</span>
                      <span className="detail-value">{first.material}</span>
                    </div>
                  )}
                </div>

                {/* Net stock quantity with dynamic colour */}
                <div className="card-quantity" style={{ marginTop: '16px', marginBottom: '16px' }}>
                  <div className="quantity-number" style={{ color: qtyColor }}>
                    {netTotal}
                  </div>
                  <span className="quantity-label">Net Stock</span>
                </div>

                {/* Added Vendor/Supplier field */}
                {first.supplier && (
                  <div className="detail-row">
                    <span className="detail-label">Vendor:</span>
                    <span className="detail-value">{first.supplier}</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="card-actions">
                  {!permsLoading && canEdit && (
                    <button onClick={() => openAddModal(first)} className="inventory-btn inventory-btn-edit">Edit</button>
                  )}
                  {!permsLoading && canDelete && (
                    <button
                      onClick={() => handleDeleteItem(first)}
                      disabled={netTotal > 0 || String(first.id).startsWith('virtual-')}
                      title={String(first.id).startsWith('virtual-') ? 'No inventory record to delete' : netTotal > 0 ? 'Quantity must be 0 to delete' : 'Delete item'}
                      className="inventory-btn inventory-btn-delete"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {Object.keys(groupedProducts).length === 0 && !loading && (
          <div className="no-items">
            <p>No items found</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <div className={`inventory-modal ${isAddModalOpen ? 'active' : ''}`} onMouseDown={closeAllModals}>
        <div className="inventory-modal-content" onMouseDown={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2 className="modal-title">Update Item</h2>
            <button type="button" className="modal-close-icon" onClick={closeAllModals} aria-label="Close modal">&times;</button>
          </div>

          <form onSubmit={handleFormSubmit}>
            {/* 1. Transaction Type */}
            <div className="form-group">
              <label className="form-label">Transaction *</label>
              <select
                className="form-select"
                name="transaction_type"
                value={formData.transaction_type || 'IN'}
                onChange={handleFormChange}
                required
              >
                <option value="IN">Received (In)</option>
                <option value="OUT">Used (Out)</option>
                <option value="ADJUSTMENT">Adjustment</option>
              </select>
            </div>

            {/* 2. Office Selection */}
            <div className="form-group">
              <div className={`responsive-grid ${formData.transaction_type === 'TRANSFER' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                <div>
                  <label className="form-label">{formData.transaction_type === 'TRANSFER' ? 'Source Office *' : 'Office *'}</label>
                  <select
                    className="form-select"
                    name="office_id"
                    value={formData.office_id || ''}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">Select an Office</option>
                    {(Array.isArray(offices) ? offices : []).map((o) => (
                      <option key={o.office_id} value={o.office_id}>{o.office_name}</option>
                    ))}
                  </select>
                </div>
                {formData.transaction_type === 'TRANSFER' && (
                  <div>
                    <label className="form-label">Destination Office *</label>
                    <select
                      className="form-select"
                      name="destination_office_id"
                      value={formData.destination_office_id || ''}
                      onChange={handleFormChange}
                      required={formData.transaction_type === 'TRANSFER'}
                    >
                      <option value="">Select Destination</option>
                      {(Array.isArray(offices) ? offices : []).map((o) => (
                        <option key={o.office_id} value={o.office_id}>{o.office_name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* 3. Staff ID */}
            <div className="form-group">
              <label className="form-label">Staff *</label>
              <select
                className="form-select"
                name="staff_id"
                value={formData.staff_id || ''}
                onChange={handleFormChange}
                required
              >
                <option value="">Select a Staff Member</option>
                {(Array.isArray(staff) ? staff : []).map((s) => (
                  <option key={s.staff_id} value={s.staff_id}>{s.first_name} {s.last_name}</option>
                ))}
              </select>
            </div>

            {/* 4. Type */}
            <div className="form-group">
              <label className="form-label">Type *</label>
              <select
                className="form-select"
                name="type"
                value={formData.type}
                onChange={handleFormChange}
                required
              >
                <option value="Consumable">Consumable</option>
                <option value="Equipment">Equipment</option>
                <option value="Custom Products">Custom Products</option>
              </select>
            </div>

            {/* 5. Product Search */}
            <div
              className="form-group"
              ref={dropdownRef}
            >
              <label className="form-label">Search / Select Product *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Search products..."
                value={productSearch}
                onChange={(e) => {
                  setProductSearch(e.target.value);
                  setShowProductDropdown(true);
                  setDropdownPage(1);
                  if (formData.productId) {
                    setFormData({ ...formData, productId: '' });
                  }
                }}
                onFocus={() => setShowProductDropdown(true)}
              />
              {showProductDropdown && (() => {
                if (formData.type === 'Custom Products') {
                  const term = productSearch.trim().toLowerCase();
                  const customItems = (Array.isArray(allDbProducts) ? allDbProducts : [])
                    .filter((p) => p.source === 'custom')
                    .filter((p) => !term || String(p.name || p.title || '').toLowerCase().includes(term));
                  return (
                    <ul className="product-dropdown">
                      {customItems.length > 0 ? customItems.map((p) => (
                        <li
                          key={p.id}
                          className="product-dropdown-item"
                          onClick={() => {
                            setProductSearch(String(p.name || p.title || ''));
                            setFormData({ ...formData, productId: String(p.id) });
                            setShowProductDropdown(false);
                          }}
                        >
                          <div className="product-result-info">
                            <strong>{String(p.name || p.title)}</strong>
                            <small>{String(p.brand || 'No Brand')} • Custom{p.inventory_type ? ` • ${String(p.inventory_type)}` : ''}</small>
                          </div>
                          <button type="button" className="product-result-select-btn">Select</button>
                        </li>
                      )) : (
                        <li className="product-dropdown-empty">No custom products yet — use &ldquo;+ Add Custom Product&rdquo; to create one.</li>
                      )}
                    </ul>
                  );
                }
                return (
                  <ul className="product-dropdown">
                    {dropdownIsLoading ? (
                      <li className="product-dropdown-loading">Loading products...</li>
                    ) : dropdownItems.length > 0 ? (
                      <>
                        {dropdownItems.map((p) => (
                          <li
                            key={p.id}
                            className="product-dropdown-item"
                            onClick={() => {
                              setProductSearch(String(p.title || p.name || ''));
                              setFormData({ ...formData, productId: String(p.id) });
                              setShowProductDropdown(false);
                            }}
                          >
                            <div className="product-result-info">
                              <strong>{String(p.title || p.name)}</strong>
                              <small>{String(p.brand || 'No Brand')} {p.sku ? `• ${p.sku}` : ''}</small>
                            </div>
                            <button type="button" className="product-result-select-btn">Select</button>
                          </li>
                        ))}
                        {dropdownTotalPages > 1 && (
                          <li className="product-mini-pagination" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              disabled={dropdownPage === 1}
                              onClick={(e) => { e.stopPropagation(); setDropdownPage(dropdownPage - 1); }}
                              className="product-mini-page-btn"
                            >
                              Previous
                            </button>
                            <span className="product-mini-page-info">
                              {dropdownPage} / {dropdownTotalPages}
                            </span>
                            <button
                              type="button"
                              disabled={dropdownPage === dropdownTotalPages}
                              onClick={(e) => { e.stopPropagation(); setDropdownPage(dropdownPage + 1); }}
                              className="product-mini-page-btn"
                            >
                              Next
                            </button>
                          </li>
                        )}
                      </>
                    ) : (
                      <li className="product-dropdown-empty">No products found for this type</li>
                    )}
                  </ul>
                );
              })()}
            </div>

            {formData.productId && (
              <>
                {/* Dynamically Populated Read-Only Details */}
                <div className="readonly-details-grid">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Name *</label>
                    <input type="text" className="form-input bg-gray-100 cursor-not-allowed" name="name" value={formData.name || ''} disabled />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Category</label>
                    <input type="text" className="form-input bg-gray-100 cursor-not-allowed" name="category" value={formData.category || ''} disabled />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Size</label>
                    <input type="text" className="form-input bg-gray-100 cursor-not-allowed" name="size" value={formData.size || ''} disabled />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Brand</label>
                    <input type="text" className="form-input bg-gray-100 cursor-not-allowed" name="brand" value={formData.brand || ''} disabled />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Material</label>
                    <input type="text" className="form-input bg-gray-100 cursor-not-allowed" value={formData.material || ''} disabled />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Batch *</label>
                    <input type="text" className="form-input bg-gray-100 cursor-not-allowed" name="batch" value={formData.batch || ''} disabled />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Expiry</label>
                    <input type="date" className="form-input bg-gray-100 cursor-not-allowed" name="expiry" value={formData.expiry || ''} disabled />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Vendor/Supplier *</label>
                    <input type="text" className="form-input bg-gray-100 cursor-not-allowed" name="supplier" value={formData.supplier || ''} disabled />
                  </div>
                </div>

                {/* Editable Fields */}
                <div className="form-group">
                  <label className="form-label">Quantity *</label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    name="available"
                    value={formData.available || 0}
                    onChange={handleFormChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Price</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    name="price"
                    value={formData.price || ''}
                    onChange={handleFormChange}
                  />
                </div>

                <div className={`responsive-grid split-grid ${formData.transaction_type === 'TRANSFER' ? 'grid-cols-3' : 'grid-cols-2'}`}>
                  <div className="form-group">
                    <label className="form-label">{formData.transaction_type === 'TRANSFER' ? 'Source Office *' : 'Office *'}</label>
                    <select
                      className="form-select"
                      name="office_id"
                      value={formData.office_id || ''}
                      onChange={handleFormChange}
                      required
                    >
                      <option value="">Select Office</option>
                      {offices.map((o) => (
                        <option key={o.office_id} value={o.office_id}>{o.office_name}</option>
                      ))}
                    </select>
                  </div>

                  {formData.transaction_type === 'TRANSFER' && (
                    <div className="form-group">
                      <label className="form-label">Destination Office *</label>
                      <select
                        className="form-select"
                        name="destination_office_id"
                        value={formData.destination_office_id || ''}
                        onChange={handleFormChange}
                        required={formData.transaction_type === 'TRANSFER'}
                      >
                        <option value="">Select Destination</option>
                        {offices.map((o: Office) => (
                          <option key={o.office_id} value={o.office_id}>{o.office_name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">Assign To Staff *</label>
                    <select
                      className="form-select"
                      name="staff_id"
                      value={formData.staff_id || ''}
                      onChange={handleFormChange}
                      required
                    >
                      <option value="">Select Staff</option>
                      {staff.map((s) => (
                        <option key={s.staff_id} value={s.staff_id}>{s.first_name} {s.last_name}</option>
                      ))}
                    </select>
                  </div>

                  {formData.type === 'Equipment' && (
                    <div className="form-group">
                      <label className="form-label">Status</label>
                      <select
                        className="form-select"
                        name="status"
                        value={formData.status || 'Available'}
                        onChange={handleFormChange}
                      >
                        <option value="Available">Available</option>
                        <option value="In Use">In Use</option>
                        <option value="In Repair">In Repair</option>
                        <option value="Damaged">Damaged</option>
                        <option value="Discarded">Discarded</option>
                      </select>
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="form-actions">
              <button type="button" onClick={closeAllModals} className="inventory-btn inventory-btn-cancel">Cancel</button>
              <button type="submit" className="inventory-btn inventory-btn-primary">
                Update
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Scanner Modal */}
      <div className={`inventory-modal ${isScannerModalOpen ? 'active' : ''}`} onMouseDown={closeAllModals}>
        <div className="inventory-modal-content" onMouseDown={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2 className="modal-title">
              {scanMode === 'in' ? '📥 Scan In (Add to Inventory)' : '📤 Scan Out (Remove from Inventory)'}
            </h2>
            <button type="button" className="modal-close-icon" onClick={closeAllModals} aria-label="Close modal">&times;</button>
          </div>

          <div style={{
            padding: '8px 16px',
            borderRadius: '8px',
            backgroundColor: scanMode === 'in' ? '#e6f7e9' : '#fff1f0',
            color: scanMode === 'in' ? '#389e0d' : '#cf1322',
            fontWeight: 600,
            fontSize: '13px',
            textAlign: 'center',
            marginBottom: '12px'
          }}>
            {scanMode === 'in' ? 'Mode: RECEIVING — Scanned items will be added to stock' : 'Mode: DISPATCHING — Scanned items will be removed from stock'}
          </div>

          <div className="scanner-container" id="html5qr-scanner-anchor">
            {/* html5-qrcode mounts its own video here */}
            <video ref={videoRef} autoPlay playsInline muted id="scannerVideo" style={{ display: 'none' }} />
            <div className="scanner-overlay">
              <div className="scanner-box">
                <div className="scanner-line"></div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '20px' }}>
            <label className="form-label" style={{ fontSize: '11px', color: '#64748b' }}>Simulate Scan (Enter ID or SKU)</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Type here..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleScan((e.target as HTMLInputElement).value);
                    (e.target as HTMLInputElement).value = '';
                  }
                }}
              />
              <button
                type="button"
                className="inventory-btn inventory-btn-primary"
                onClick={(e) => {
                  const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                  handleScan(input.value);
                  input.value = '';
                }}
              >
                Go
              </button>
            </div>
          </div>

          <div className="form-actions">
            <button onClick={closeAllModals} className="inventory-btn inventory-btn-cancel">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}