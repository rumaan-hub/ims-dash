"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ShoppingBagIcon,
  PlusIcon,
  TrashIcon,
  CheckIcon,
  ArchiveBoxIcon as OrderIcon,
  CreditCardIcon
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { usePurchasePage } from "@/hooks/usePurchasePage";
import { useProfileStore } from "@/store/reducers/profileStore";
import { useSystemActivity } from "@/hooks/useSystemActivity";
import './page.css';

export default function DirectPurchasePage() {
  const {
    products,
    proposals,
    purchaseRows,
    loading,
    handlePlaceOrder,
    handleAcceptProposal,
    handleRejectProposal,
    addRow,
    removeRow,
    updateRow,
    totalAmount,
    dropdownItems,
    dropdownTotalPages,
    dropdownIsLoading,
    fetchDropdownProducts
  } = usePurchasePage();

  const [activeDropdownRow, setActiveDropdownRow] = useState<number | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [dropdownPage, setDropdownPage] = useState(1);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdownRow(null);
      }
    }
    if (activeDropdownRow !== null) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activeDropdownRow]);

  useEffect(() => {
    if (activeDropdownRow === null) return;
    const delayDebounceFn = setTimeout(() => {
      fetchDropdownProducts(productSearch, dropdownPage, 8);
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [productSearch, dropdownPage, activeDropdownRow, fetchDropdownProducts]);
  const { client, fetchCurrentClient } = useProfileStore();
  const billings = client?.billings || [];

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState("");

  useEffect(() => {
    fetchCurrentClient();
  }, [fetchCurrentClient]);

  const { trackPageOpen, trackEditAction } = useSystemActivity();
  useEffect(() => {
    trackPageOpen('Direct Purchase');
  }, [trackPageOpen]);

  const onPlaceOrderClick = () => {
    if (billings.length === 0) {
      toast.error("Please add a billing method in your profile first.");
      return;
    }
    // Auto-select the first card
    if (!selectedCardId && billings.length > 0) {
      setSelectedCardId(billings[0].billing_id);
    }
    setShowPaymentModal(true);
  };

  const confirmOrder = async () => {
    if (!selectedCardId) {
      toast.error("Please select a valid payment method.");
      return;
    }
    setShowPaymentModal(false);
    try {
      await handlePlaceOrder();
      toast.success("Purchase order placed & payment deducted successfully!");
      trackEditAction(`Placed direct purchase order`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to place order");
    }
  };

  const onAccept = async (id: string) => {
    try {
      await handleAcceptProposal(id);
      toast.success("Proposal accepted and order created!");
      trackEditAction(`Accepted purchase proposal #${id.split('-')[0].toUpperCase()}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to accept proposal");
    }
  };

  const onReject = async (id: string) => {
    if (!confirm("Reject this proposal?")) return;
    try {
      await handleRejectProposal(id);
      toast.success("Proposal rejected successfully");
      trackEditAction(`Rejected purchase proposal #${id.split('-')[0].toUpperCase()}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to reject proposal");
    }
  };

  if (loading && products.length === 0) {
    return (
      <div className="purchase-loader-container">
        <div className="purchase-spinner"></div>
        <p>Initializing Purchase System...</p>
      </div>
    );
  }

  return (
    <div className="purchase-page-container page-transition-wrapper">
      {/* --- HEADER --- */}
      <div className="purchase-header-row">
        <div className="purchase-title-section">
          <h1 className="purchase-header-title">Direct Purchase</h1>
        </div>
      </div>

      <div className="purchase-main-section">
        {/* --- FORM CARD --- */}
        <div className="purchase-card main-form">
          <div className="purchase-card-header">
            <div className="card-icon">
              <ShoppingBagIcon />
            </div>
            <div>
              <h2 className="purchase-card-title">New Purchase Order</h2>
              <p className="purchase-card-subtitle">Fill in details to place a direct stock request.</p>
            </div>
          </div>

          <div className="purchase-table-wrapper">
            <table className="purchase-table">
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>Sr#</th>
                  <th>Product Details</th>
                  <th style={{ width: '130px' }}>Unit Price</th>
                  <th style={{ width: '100px' }}>QTY</th>
                  <th style={{ width: '140px' }}>Sub-Total</th>
                  <th>Additional Notes</th>
                  <th style={{ width: '50px' }}></th>
                </tr>
              </thead>
              <tbody>
                {purchaseRows.map((row, index) => (
                  <tr key={index} className="purchase-form-row">
                    <td data-label="#"><span className="sr-num">{index + 1}</span></td>
                    <td data-label="Product">
                      <div className="product-select-wrapper" ref={activeDropdownRow === index ? dropdownRef : null} style={{ position: 'relative' }}>
                        <input
                          type="text"
                          className="purchase-input-text"
                          style={{ width: '100%' }}
                          placeholder={row.productName || "Search Product..."}
                          value={activeDropdownRow === index ? productSearch : (row.productName || "")}
                          onChange={(e) => {
                            setProductSearch(e.target.value);
                            setActiveDropdownRow(index);
                            setDropdownPage(1);
                            if (row.productId) {
                              updateRow(index, { productId: '' });
                            }
                          }}
                          onFocus={() => {
                            setActiveDropdownRow(index);
                            setProductSearch(row.productName || "");
                          }}
                        />
                        {activeDropdownRow === index && (
                          <ul className="product-dropdown" style={{ top: '100%', left: 0, width: '100%', zIndex: 50 }}>
                            {dropdownIsLoading ? (
                              <li className="product-dropdown-loading">Loading products...</li>
                            ) : dropdownItems.length > 0 ? (
                              <>
                                {dropdownItems.map((p) => (
                                  <li
                                    key={p.id}
                                    className="product-dropdown-item"
                                    onClick={() => {
                                      updateRow(index, { productId: String(p.id) });
                                      setActiveDropdownRow(null);
                                    }}
                                  >
                                    <div className="product-result-info">
                                      <strong>{p.title || p.name}</strong>
                                      <small>{p.brand ? (typeof p.brand === 'string' ? p.brand : p.brand.name) : 'No Brand'} {p.sku ? `• ${p.sku}` : ''}</small>
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
                              <li className="product-dropdown-empty">No products found</li>
                            )}
                          </ul>
                        )}
                      </div>
                    </td>
                    <td data-label="Unit Price">
                      <div className="price-tag">
                        ${row.unitPrice.toFixed(2)}
                      </div>
                    </td>
                    <td data-label="Quantity">
                      <input
                        type="number"
                        className="purchase-input-number"
                        min="1"
                        value={row.quantity}
                        onChange={(e) => updateRow(index, { quantity: parseInt(e.target.value) || 0 })}
                      />
                    </td>
                    <td data-label="Sub-Total">
                      <div className="amount-total">
                        ${row.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </td>
                    <td data-label="Notes">
                      <input
                        type="text"
                        className="purchase-input-text"
                        placeholder="Add notes..."
                        value={row.notes}
                        onChange={(e) => updateRow(index, { notes: e.target.value })}
                      />
                    </td>
                    <td>
                      <button
                        className="purchase-action-btn delete"
                        onClick={() => removeRow(index)}
                        disabled={purchaseRows.length === 1 && !row.productId}
                      >
                        <TrashIcon />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="purchase-form-footer">
            <button className="purchase-add-btn" onClick={addRow}>
              <PlusIcon /> Add Item
            </button>
          </div>

          <div className="purchase-summary-bar">
            <div className="summary-info">
              <span className="label">Grand Estimated Total</span>
              <span className="value">${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <button
              className="purchase-submit-btn"
              onClick={onPlaceOrderClick}
              disabled={loading || purchaseRows.every(r => !r.productId)}
            >
              {loading ? 'Processing...' : 'Place Order'}
              <CheckIcon />
            </button>
          </div>
        </div>

        {/* --- PROPOSALS CARD --- */}
        <div className="purchase-card proposals-card">
          <div className="purchase-card-header">
            <div className="card-icon alt">
              <OrderIcon />
            </div>
            <div>
              <h2 className="purchase-card-title">Received Proposals</h2>
              <p className="purchase-card-subtitle">Vetted vendor offers awaiting your review.</p>
            </div>
          </div>

          <div className="proposals-content">
            {proposals.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📂</div>
                <p>No new proposals at the moment.</p>
              </div>
            ) : (
              <div className="proposals-grid">
                {proposals.map((prop) => (
                  <div key={prop.purchase_id} className="proposal-item-card">
                    <div className="proposal-header">
                      <span className="prop-id">ID: #{prop.purchase_id.split('-')[0].toUpperCase()}</span>
                      <span className={`status-pill ${prop.status.toLowerCase()}`}>{prop.status}</span>
                    </div>

                    <div className="proposal-body">
                      <ul className="prop-items-list">
                        {prop.details.map((d, i) => (
                          <li key={i}>
                            <span className="item-name">{d.product.title}</span>
                            <span className="item-qty">x{d.quantity}</span>
                            <span className="item-price">${(d.unit_price * d.quantity).toFixed(2)}</span>
                          </li>
                        ))}
                      </ul>
                      {prop.remarks && <p className="prop-remarks">&ldquo;{prop.remarks}&rdquo;</p>}
                    </div>

                    <div className="proposal-footer">
                      <div className="total-proposed">
                        <span className="label">Offer Total</span>
                        <span className="val">${prop.details.reduce((s, d) => s + (d.unit_price * d.quantity), 0).toFixed(2)}</span>
                      </div>
                      {prop.status === 'PENDING' && (
                        <div className="prop-actions">
                          <button className="reject-btn" onClick={() => onReject(prop.purchase_id)}>Reject</button>
                          <button className="accept-btn" onClick={() => onAccept(prop.purchase_id)}>Accept Offer</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- PAYMENT MODAL --- */}
      {showPaymentModal && (
        <div className="payment-modal-overlay">
          <div className="payment-modal">
            <h3 className="payment-modal-title">Select Payment Method</h3>
            <p className="payment-modal-subtitle">Choose a card to deduct the grand total from your account.</p>

            <div className="billing-options-list">
              {billings.map((card) => (
                <div
                  key={card.billing_id}
                  className={`billing-card-option ${selectedCardId === card.billing_id ? 'selected' : ''}`}
                  onClick={() => setSelectedCardId(card.billing_id)}
                >
                  <div className="card-icon-box">
                    <CreditCardIcon />
                  </div>
                  <div className="card-details">
                    <span className="card-number">
                      {card.masked_card || `**** **** **** ${card.card_brand ? '????' : '....'}`}
                    </span>
                    <span className="card-expiry">
                      {card.card_brand ? `${card.card_brand} • ` : ''}
                      Expires {card.expiry_month && card.expiry_year ? `${String(card.expiry_month).padStart(2, '0')}/${card.expiry_year}` : '--/--'}
                    </span>
                  </div>
                  <div className="card-radio">
                    <div style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      border: `2px solid ${selectedCardId === card.billing_id ? 'var(--ims-primary)' : '#cbd5e1'}`,
                      background: selectedCardId === card.billing_id ? 'var(--ims-primary)' : 'transparent',
                      boxShadow: selectedCardId === card.billing_id ? 'inset 0 0 0 3px white' : 'none'
                    }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="modal-actions">
              <button className="modal-btn-cancel" onClick={() => setShowPaymentModal(false)}>
                Cancel
              </button>
              <button
                className="modal-btn-confirm"
                onClick={confirmOrder}
                disabled={!selectedCardId}
              >
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
