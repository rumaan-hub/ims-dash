'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Chart } from 'chart.js/auto';
import { useAnalyticsSuggestions } from '@/hooks/useAnalyticsSuggestions';
import { useSystemActivity } from "@/hooks/useSystemActivity";
import './page.css';

// ── Badge helper ────────────────────────────────────────────────────────────
function priorityBadge(status: string) {
  const classMap: Record<string, string> = {
    'High Risk': 'sa-badge-danger',
    'Medium Risk': 'sa-badge-orange',
    'Low Risk': 'sa-badge-success',
    'No Usage Data': 'sa-badge-muted',
  };
  return <span className={`sa-badge ${classMap[status] ?? 'sa-badge-muted'}`}>{status}</span>;
}

// ═══════════════════════════════════════════════════════════════════════════
export default function DentistryDashboard() {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const [page, setPage] = useState(1);

  const { trackPageOpen } = useSystemActivity();

  useEffect(() => {
    trackPageOpen("Suggestions & Analytics");
  }, [trackPageOpen]);

  const {
    products,
    totalItems,
    totalPages,
    currentPage,
    chartData,
    loading,
    error,
  } = useAnalyticsSuggestions(page);


  // ── Chart.js — daily usage line chart ──────────────────────────────────
  useEffect(() => {
    if (!chartRef.current) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
      chartInstance.current = null;
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    if (!chartData || chartData.labels.length === 0) {
      // Empty state — render placeholder chart with no data
      chartInstance.current = new Chart(ctx, {
        type: 'bar',
        data: { labels: [], datasets: [] },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
          },
        },
      });
      return;
    }

    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: chartData.labels,
        datasets: [
          {
            label: 'Daily Usage (units)',
            data: chartData.values,
            backgroundColor: 'rgba(10, 150, 212, 0.75)',
            borderRadius: 6,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              font: { size: 13, weight: 600 },
              padding: 16,
              usePointStyle: true,
              pointStyle: 'rectRounded',
            },
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                return `${context.parsed.y} units`;
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(0,0,0,0.05)' },
            title: { display: true, text: 'Usage Quantity', font: { weight: 600 } },
          },
          x: {
            grid: { display: false },
            title: { display: true, text: 'Date', font: { weight: 600 } },
          },
        },
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [chartData]);

  // ── Mobile card renderer ───────────────────────────────────────────────
  const renderMobileCards = () => (
    <div className="sa-mobile-card-container">
      {products.map((item) => (
        <div key={item.productId} className="sa-mobile-card">
          <div className="sa-mobile-card-header">
            <span>{item.productName}</span>
            {priorityBadge(item.status)}
          </div>
          <div className="sa-mobile-card-body">
            <div className="sa-mobile-row"><span>Current Stock:</span> <span>{item.currentStock}</span></div>
            <div className="sa-mobile-row"><span>Avg Daily:</span> <span>{item.averageDailyUsage}</span></div>
            <div className="sa-mobile-row"><span>Est. Stock-End:</span> <span>{item.estimatedStockOutDate ?? '—'}</span></div>
            <div className="sa-mobile-row"><span>AI Suggested Qty:</span> <span>{item.suggestedRestockQuantity !== null ? `${item.suggestedRestockQuantity} units` : '—'}</span></div>
          </div>
        </div>
      ))}
    </div>
  );

  // ═════════════════════════════════════════════════════════════════════════
  return (
    <div className="sa-wrapper">
      <div className="sa-container">

        {/* ── PAGE HEADER ───────────────────────────────────────────── */}
        <header className="sa-header">
          <div className="sa-header-left">
            <h1 className="sa-page-title">Smart Suggestions & Analytics</h1>
            <p className="sa-page-subtitle">AI-powered insights based on your clinic&apos;s consumption patterns.</p>
          </div>
          {totalItems > 0 && (
            <span className="sa-count-pill">{totalItems} product{totalItems !== 1 ? 's' : ''} tracked</span>
          )}
        </header>

        {/* ── Global states ────────────────────────────────────────── */}
        {error && (
          <div className="sa-error-banner">{error}</div>
        )}

        {loading ? (
          <div className="sa-loading">Loading analytics…</div>
        ) : products.length === 0 ? (
          <div className="sa-empty">
            <p>No products with usage data found in the ledger.</p>
          </div>
        ) : (
          <>
            {/* ── CHART SECTION ─────────────────────────────────────── */}
            <div className="sa-card">
              <div className="sa-card-header">
                <h3>Daily Usage Trends (Filtered Products)</h3>
              </div>
              <div className="sa-chart-wrapper">
                <canvas ref={chartRef}></canvas>
              </div>
            </div>

            {/* ── PRODUCT LIST (Ledger-style table) ─────────────────── */}
            <div className="sa-card">
              <div className="sa-card-header">
                <h3>Restock Suggestions</h3>
                <span className="sa-count-pill">{totalItems}</span>
              </div>

              {/* Desktop Table */}
              <div className="sa-table-wrapper">
                <table className="sa-table">
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th className="sa-numeric">Current Stock</th>
                      <th className="sa-numeric">Avg Daily Usage</th>
                      <th>Est. Stock-End</th>
                      <th className="sa-numeric">AI Suggested Qty</th>
                      <th>Priority</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((item) => (
                      <tr key={item.productId}>
                        <td><span className="sa-product-name">{item.productName}</span></td>
                        <td className="sa-numeric">{item.currentStock}</td>
                        <td className="sa-numeric">{item.averageDailyUsage}</td>
                        <td>{item.estimatedStockOutDate ?? '—'}</td>
                        <td className="sa-numeric sa-highlight">{item.suggestedRestockQuantity !== null ? `${item.suggestedRestockQuantity} units` : '—'}</td>
                        <td>{priorityBadge(item.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              {renderMobileCards()}

              {/* ── PAGINATION ────────────────────────────────────────── */}
              <div className="sa-pagination">
                <button
                  className="sa-pagination-btn"
                  disabled={currentPage <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  ← Previous
                </button>
                <span className="sa-pagination-info">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  className="sa-pagination-btn"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                >
                  Next →
                </button>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}