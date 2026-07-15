"use client";
import { useTransfer } from "@/hooks/useTransfer";
import { useState, useEffect } from "react";
import { useSystemActivity } from "@/hooks/useSystemActivity";
import "./page.css";

// Data Types - Adjusted to match Backend Product Model
type DBProduct = {
  id: string;
  title: string;
  brand?: string;
  variants?: unknown[];
  stock?: number;
};

type CartItem = {
  id: string;
  name: string;
  qty: number;
  available: number; // Placeholder until inventory API is ready
};

import toast from "react-hot-toast";

export default function TransferPage() {
  // Hook — provides transfers from backend + API actions
  const {
    transfers,
    offices,
    products: dbProducts,
    loadingOffices,
    loadingProducts,
    currentPage,
    totalPages,
    fetchProducts,
    createTransfer,
    changeStatus
  } = useTransfer();

  const { trackPageOpen, trackEditAction } = useSystemActivity();

  useEffect(() => {
    trackPageOpen("Transfer");
  }, [trackPageOpen]);

  // Component UI state
  const [step, setStep] = useState(1);
  const [sourceOfficeId, setSourceOfficeId] = useState("");
  const [destOfficeId, setDestOfficeId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [, setIsSidebarOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);


  // Initialize office selections once offices are loaded
  useEffect(() => {
    if (offices.length > 0 && !sourceOfficeId) {
      setSourceOfficeId(offices[0].office_id);
      if (offices.length > 1) {
        setDestOfficeId(offices[1].office_id);
      }
    }
  }, [offices, sourceOfficeId]);

  // Use hook to fetch products when search term or step changes
  useEffect(() => {
    if (step === 2) {
      const delayDebounceFn = setTimeout(() => {
        fetchProducts(searchTerm, page, 10, sourceOfficeId, true);
      }, 300);
      return () => clearTimeout(delayDebounceFn);
    }
  }, [searchTerm, step, page, fetchProducts, sourceOfficeId]);

  // Reset page to 1 when search term changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  // Auto-update destination when source changes
  useEffect(() => {
    const available = offices.filter((o) => o.office_id !== sourceOfficeId);
    if (available.length > 0 && !available.find((o) => o.office_id === destOfficeId)) {
      setDestOfficeId(available[0].office_id);
    }
  }, [sourceOfficeId, offices, destOfficeId]);

  // Close sidebar when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const sidebar = document.getElementById("sidebar");
      const btn = document.getElementById("menuBtn");
      if (sidebar && btn && !sidebar.contains(e.target as Node) && !btn.contains(e.target as Node)) {
        setIsSidebarOpen(false);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);


  // Helpers
  const getOfficeName = (id: string) =>
    offices.find((o) => o.office_id === id)?.office_name ?? "Selected Office";

  // Cart handlers
  const handleAddToCart = (item: DBProduct) => {
    if (cart.find((i) => i.id === item.id)) {
      toast.error("Item already in cart!");
      return;
    }
    setCart([...cart, {
      id: item.id,
      name: item.title,
      qty: 1,
      available: item.stock ?? 999
    }]);
    toast.success("Added to cart");
  };

  const handleRemoveFromCart = (index: number) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const handleUpdateQty = (index: number, val: number) => {
    const newCart = [...cart];
    const max = newCart[index].available;
    newCart[index].qty = Math.max(1, Math.min(max, val));
    setCart(newCart);
  };

  // Create transfer — sends real office UUIDs to backend
  const handleCreateTransfer = async () => {
    if (!sourceOfficeId || !destOfficeId) {
      toast.error("Please select source and destination offices.");
      return;
    }
    if (sourceOfficeId === destOfficeId) {
      toast.error("Source and destination offices must be different.");
      return;
    }
    if (cart.length === 0) {
      toast.error("Please add at least one item to the cart.");
      return;
    }

    setIsSubmitting(true);


    // Find client_id from source office
    const officeObj = offices.find(o => o.office_id === sourceOfficeId);

    const payload = {
      client_id: officeObj?.client_id,
      source_office_id: sourceOfficeId,
      destination_office_id: destOfficeId,
      transfer_date: new Date().toISOString(),
      status: "Pending",
      details: cart.map((item) => ({
        productId: item.id,
        qty: item.qty,
      })),
    };

    try {
      await createTransfer(payload);

      const srcOfficeName = getOfficeName(sourceOfficeId);
      const destOfficeName = getOfficeName(destOfficeId);
      trackEditAction(`Transfer created from ${srcOfficeName} to ${destOfficeName}`);

      toast.success("Transfer created successfully!");
      setCart([]);
      setStep(1);
      setSearchTerm("");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Failed to create transfer.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (id: string, currentStatus: string) => {
    try {
      await changeStatus(id, currentStatus);
      toast.success("Status updated!");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      toast.error(e?.response?.data?.message || e?.message || "Failed to update status.");
    }
  };


  return (
    <div className="transfer-page-container">
      <h1 className="page-title">Office-to-Office Transfer</h1>


      {/* Create Transfer Card */}
      <div className="transfer-card create-card">
        <h2 style={{ fontSize: "26px", fontWeight: 700, marginBottom: "30px" }}>
          Create New Transfer
        </h2>

        {loadingOffices ? (
          <p style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
            Loading offices...
          </p>
        ) : offices.length === 0 ? (
          <p style={{ textAlign: "center", padding: "40px", color: "#ef4444" }}>
            No offices found. Please create offices first.
          </p>
        ) : (
          <>
            {/* Step 1 — Select Offices */}
            <div className={`step ${step === 1 ? "active" : ""}`}>
              <div className="form-row">
                <div>
                  <label>Source Office</label>
                  <select
                    value={sourceOfficeId}
                    onChange={(e) => setSourceOfficeId(e.target.value)}
                  >
                    {offices.map((o) => (
                      <option key={o.office_id} value={o.office_id}>
                        {o.office_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Destination Office</label>
                  <select
                    value={destOfficeId}
                    onChange={(e) => setDestOfficeId(e.target.value)}
                    disabled={!sourceOfficeId}
                  >
                    {offices
                      .filter((o) => o.office_id !== sourceOfficeId)
                      .map((o) => (
                        <option key={o.office_id} value={o.office_id}>
                          {o.office_name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
              <button className="transfer-btn transfer-btn-primary" onClick={() => setStep(2)}>
                Next → Select Products
              </button>
            </div>

            {/* Step 2 — Select Products */}
            <div className={`step ${step === 2 ? "active" : ""}`}>
              <div className="search">
                <label>
                  Select Products for <strong>{getOfficeName(sourceOfficeId)}</strong>
                </label>

                <div className="product-search-container">
                  <input
                    type="text"
                    id="productSearch"
                    placeholder="Search by name or product ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoComplete="off"
                  />

                  <div className="search-results">
                    {loadingProducts ? (
                      <div className="text-center" style={{ padding: "3rem", color: "#64748b" }}>
                        <div className="animate-pulse">Loading products...</div>
                      </div>
                    ) : dbProducts.length > 0 ? (
                      <>
                        {dbProducts.map((p) => (
                          <div
                            key={p.id}
                            className="result"
                            onClick={() => handleAddToCart(p)}
                          >
                            <div className="result-info">
                              <strong>{p.title}</strong>
                              <small className="product-id-text">ID: {p.id}</small>
                            </div>
                            <button className="add-btn">+ Add</button>
                          </div>
                        ))}
                      </>
                    ) : (
                      <div className="text-center" style={{ padding: "4rem 2rem", background: "#f8fafc", borderRadius: "12px" }}>
                        <p style={{ color: "#94a3b8", fontWeight: 600 }}>No products found</p>
                      </div>
                    )}
                  </div>

                  {totalPages > 1 && (
                    <div className="pagination">
                      <button
                        className="transfer-btn transfer-btn-secondary transfer-btn-sm"
                        disabled={page === 1}
                        onClick={() => setPage(page - 1)}
                      >
                        &larr; Previous
                      </button>
                      <div className="page-info">
                        {currentPage} / {totalPages}
                      </div>
                      <button
                        className="transfer-btn transfer-btn-secondary transfer-btn-sm"
                        disabled={page === totalPages}
                        onClick={() => setPage(page + 1)}
                      >
                        Next &rarr;
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="cart-items-section" style={{ marginTop: "2rem" }}>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem", color: "#334155" }}>
                  Transfer Items ({cart.length})
                </h3>

                <div className="cart-items">
                  {cart.length === 0 ? (
                    <div className="text-center" style={{ padding: "3rem 0" }}>
                      <p style={{ color: "#94a3b8" }}>No products added yet</p>
                    </div>
                  ) : (
                    cart.map((item, idx) => (
                      <div key={item.id} className="cart-item">
                        <div className="cart-item-info">
                          <strong>{item.name}</strong>
                          <div className="product-id-text" style={{ marginTop: "4px" }}>ID: {item.id}</div>
                        </div>
                        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#64748b" }}>Qty:</span>
                            <input
                              type="number"
                              className="qty-input"
                              min={1}
                              max={item.available}
                              value={item.qty}
                              onChange={(e) =>
                                handleUpdateQty(idx, parseInt(e.target.value) || 1)
                              }
                            />
                          </div>
                          <button
                            className="remove-btn"
                            onClick={() => handleRemoveFromCart(idx)}
                            style={{
                              color: "#f43f5e",
                              background: "#fff1f2",
                              border: "1px solid #ffe4e6",
                              width: "32px",
                              height: "32px",
                              borderRadius: "8px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "1.25rem",
                              cursor: "pointer"
                            }}
                          >
                            &times;
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="btn-group">
                <button className="btn btn-secondary" onClick={() => setStep(1)}>
                  &larr; Back
                </button>
                <button
                  className="btn btn-primary"
                  disabled={cart.length === 0 || isSubmitting}
                  onClick={handleCreateTransfer}
                  style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                >
                  {isSubmitting && (
                    <svg className="animate-spin" style={{ height: "18px", width: "18px", color: "white" }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {isSubmitting ? "Creating..." : "Confirm Transfer"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Transfer History Card */}
      <div className="transfer-card history-card">
        <div className="history-header">
          <h3 className="history-title">Transfer History</h3>
          {transfers.length > 0 && (
            <span className="history-count">{transfers.length} record{transfers.length !== 1 ? "s" : ""}</span>
          )}
        </div>

        <div className="table-container">
          {transfers.length === 0 ? (
            <div className="history-empty">
              <div className="history-empty-icon">📦</div>
              <p>No transfer history yet</p>
              <small style={{ color: "#cbd5e1", fontSize: "0.82rem" }}>
                Create your first transfer above to get started
              </small>
            </div>
          ) : (
            <table className="history-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Route</th>
                  <th>Items</th>
                  <th>Date &amp; Time</th>
                  <th>Status</th>
                  <th style={{ textAlign: "center" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {transfers.map((t) => {
                  const dateObj = new Date(t.transfer_date);
                  const datePart = dateObj.toLocaleDateString(undefined, {
                    month: "short", day: "numeric", year: "numeric"
                  });
                  const timePart = dateObj.toLocaleTimeString(undefined, {
                    hour: "2-digit", minute: "2-digit"
                  });
                  const statusClass = t.status.toLowerCase().replace(" ", "");

                  return (
                    <tr key={t.id}>
                      {/* ID */}
                      <td data-label="ID">
                        <span className="transfer-id">#{t.id.slice(0, 8)}</span>
                      </td>

                      {/* Route */}
                      <td data-label="Route">
                        <div className="route-cell">
                          <span className="route-office">{getOfficeName(t.source_office_id)}</span>
                          <span className="route-arrow">→</span>
                          <span className="route-office">{getOfficeName(t.destination_office_id)}</span>
                        </div>
                      </td>

                      {/* Items */}
                      <td data-label="Items">
                        <span className="items-pill">
                          📦 {t.details?.length ?? 0} item{(t.details?.length ?? 0) !== 1 ? "s" : ""}
                        </span>
                      </td>

                      {/* Date & Time */}
                      <td data-label="Date" className="date-cell">
                        <div className="date-primary">{datePart}</div>
                        <div className="date-secondary">{timePart}</div>
                      </td>

                      {/* Status badge */}
                      <td data-label="Status">
                        <span className={`status ${statusClass}`}>
                          {t.status}
                        </span>
                      </td>

                      {/* Action */}
                      <td data-label="Action" className="action-cell">
                        {t.status === "Pending" ? (
                          <button
                            className="btn-approve"
                            onClick={() => handleStatusChange(t.id, "Pending")}
                          >
                            ✓ Approve
                          </button>
                        ) : t.status === "In Transit" ? (
                          <button
                            className="btn-receive"
                            onClick={() => handleStatusChange(t.id, "In Transit")}
                          >
                            ✓ Mark Received
                          </button>
                        ) : (
                          <span className="completed-chip">
                            ✓ Completed
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}