"use client";

import React, { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import { useSystemActivity } from "@/hooks/useSystemActivity";
import { usePurchaseStore, type PurchaseOrder } from "@/store/reducers/purchaseStore";
import { useImsUser } from "@/hooks/useImsUser";
import "./page.css";

// Status colors for UI
const statusColors: Record<string, string> = {
  Pending: "#f59e0b",
  Ordered: "#3b82f6",
  Shipped: "#6366f1",
  Delivered: "#10b981",
  Accepted: "#10b981", // Add for converted proposals
  Rejected: "#ef4444"
};

export default function OrderHistory() {
  const { clientId } = useImsUser();
  const { purchaseHistory: orders, fetchPurchaseHistory, loading } = usePurchaseStore();
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);

  const { trackPageOpen } = useSystemActivity();

  useEffect(() => {
    trackPageOpen("Order Tracking");
  }, [trackPageOpen]);

  useEffect(() => {
    if (clientId) {
      fetchPurchaseHistory(clientId);
    }
  }, [clientId, fetchPurchaseHistory]);

  const statuses = ["Pending", "Ordered", "Shipped", "Delivered"] as const;

  const downloadPDF = (order: PurchaseOrder) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("ORDER INVOICE", 105, 20, { align: "center" });
    doc.setFontSize(12);
    doc.text(`Order ID: ${order.id}`, 20, 40);
    doc.text(`Date: ${order.date}`, 20, 50);
    doc.text(`Status: ${order.status}`, 20, 60);
    doc.text(`Tracking No.: ${order.trackingNumber || "N/A"}`, 20, 70);
    doc.text("Items:", 20, 100);
    let y = 110;
    order.items.forEach((item: { name: string; quantity: number }) => {
      doc.text(`- ${item.name} x ${item.quantity}`, 25, y);
      y += 10;
    });
    doc.save(`${order.id}.pdf`);
  };

  return (
    <div className="tracking-page-container">
      {loading && orders.length === 0 && (
        <div className="tracking-loading">Updating history...</div>
      )}
      <div className="tracking-header">
        <h1 className="tracking-page-title">Order History & Tracking</h1>
        <p className="tracking-page-subtitle">Manage and track your procurement orders in real-time.</p>
      </div>

      <div className="tracking-orders-list">
        {orders.map((order: PurchaseOrder) => (
          <div
            key={order.purchase_id}
            className="tracking-order-card"
            onClick={() => setSelectedOrder(order)}
          >
            <div className="tracking-card-header">
              <div className="tracking-id-group">
                <span className="tracking-order-id">ID: {order.id}</span>
                <span className="tracking-order-date">{order.date}</span>
              </div>
              <span
                className="tracking-status-badge"
                style={{ backgroundColor: statusColors[order.status] || '#94a3b8' }}
              >
                {order.status}
              </span>
            </div>

            <div className="tracking-card-body">
              {order.trackingNumber && (
                <div className="tracking-info-row">
                  <span className="info-label">Tracking Number:</span>
                  <span className="info-value">{order.trackingNumber}</span>
                </div>
              )}
              {order.items && order.items.length > 0 && (
                <div className="tracking-info-row">
                  <span className="info-label">Items:</span>
                  <span className="info-value">{order.items[0].name} {order.items.length > 1 ? `(+${order.items.length - 1} more)` : ''}</span>
                </div>
              )}
            </div>

            <div className="tracking-card-footer">
              <button className="tracking-view-details-btn">View Details</button>
              {order.proposalLink && (
                <a
                  href={order.proposalLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tracking-proposal-link"
                  onClick={(e) => e.stopPropagation()}
                >
                  View Proposal
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Popup Modal */}
      {selectedOrder && (
        <div className="tracking-modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="tracking-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="tracking-modal-header">
              <h3>Order Details</h3>
              <button onClick={() => setSelectedOrder(null)} className="tracking-close-btn">&times;</button>
            </div>

            <div className="tracking-modal-body">
              <div className="tracking-order-summary">
                <div className="summary-row">
                  <span>Order ID</span>
                  <strong>{selectedOrder.id}</strong>
                </div>
                <div className="summary-row">
                  <span>Date</span>
                  <strong>{selectedOrder.date}</strong>
                </div>
                <div className="summary-row">
                  <span>Status</span>
                  <strong style={{ color: statusColors[selectedOrder.status] }}>{selectedOrder.status}</strong>
                </div>
              </div>

              <div className="tracking-items-section">
                <h4>Purchased Items</h4>
                <div className="tracking-items-list">
                  {selectedOrder.items.map((item: { name: string; quantity: number }, idx: number) => (
                    <div key={idx} className="tracking-item-row">
                      <span className="item-name">{item.name}</span>
                      <span className="item-qty">Qty: {item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Tracker */}
              <div className="tracking-progress-section">
                <h4>Fulfillment Progress</h4>
                <div className="tracking-progress-stepper">
                  {statuses.map((stage, idx: number) => {
                    const completedIndex = statuses.indexOf(selectedOrder.status as typeof statuses[number]);
                    const isCompleted = idx <= completedIndex;
                    return (
                      <div key={stage} className={`progress-step ${isCompleted ? 'active' : ''}`}>
                        <div className="step-circle" style={{ backgroundColor: isCompleted ? (statusColors[stage] || '#94a3b8') : '#e2e8f0' }} />
                        <span className="step-label">{stage}</span>
                        {idx < statuses.length - 1 && <div className="step-connector" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="tracking-modal-footer">
              <button onClick={() => downloadPDF(selectedOrder)} className="tracking-download-pdf-btn">
                Download Order PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}