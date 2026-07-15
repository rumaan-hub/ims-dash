"use client";

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import './page.css';
import { useLedger } from '@/hooks/useLedger';
import { useSystemActivity } from '@/hooks/useSystemActivity';


// ── Badge helpers (unchanged) ──────────────────────────────────────────────
function stockBadge(status: string) {
  const cls = status === 'Critical' ? 'badge-danger' : 'badge-warning';
  return <span className={`badge ${cls}`}>{status}</span>;
}

function expiryBadge(status: string) {
  const map: Record<string, string> = {
    'Urgent': 'badge-danger',
    'High Risk': 'badge-orange',
    'Warning': 'badge-warning',
    'Monitor': 'badge-yellow',
    'Info': 'badge-info',
  };
  return <span className={`badge ${map[status] ?? 'badge-info'}`}>{status}</span>;
}

function typeBadge(type: string) {
  const map: Record<string, string> = {
    'Received': 'badge-success',
    'Used': 'badge-danger',
    'Transferred': 'badge-primary',
    'TRANSFER IN': 'badge-primary',
    'TRANSFER OUT': 'badge-primary',
  };
  return <span className={`badge ${map[type] ?? 'badge-info'}`}>{type}</span>;
}

function daysClass(d: number) {
  if (d <= 15) return 'days-critical';
  if (d <= 30) return 'days-high';
  if (d <= 60) return 'days-warning';
  return 'days-info';
}

function sortArrow(col: string, activeCol: string, dir: 'asc' | 'desc') {
  if (col !== activeCol) return <span style={{ opacity: 0.3, marginLeft: 4 }}>↕</span>;
  return <span style={{ marginLeft: 4 }}>{dir === 'asc' ? '↑' : '↓'}</span>;
}

// ═══════════════════════════════════════════════════════════════════════════
export default function LedgerAndAlerts() {
  const { trackPageOpen } = useSystemActivity();

  useEffect(() => {
    trackPageOpen('Ledger');
  }, [trackPageOpen]);

  const searchParams = useSearchParams();
  const nearExpiryRef = useRef<HTMLDivElement>(null);
  const lowStockRef = useRef<HTMLDivElement>(null);
  const section = searchParams.get('section');

  // ── Real data from backend via store → hook ───────────────────────────
  const {
    lowStock,
    nearExpiry,
    filteredRows,
    paginatedRows,
    totalPages,
    loading,
    error,
    filters,
    currentPage,
    sortCol,
    sortDir,
    setCurrentPage,
    handleSortChange,
    handleFilterChange,
  } = useLedger();

  // Auto-scroll to Near Expiry section when navigated from KPI card
  useEffect(() => {
    if (section === 'near-expiry' && !loading && nearExpiryRef.current) {
      const timer = setTimeout(() => {
        if (!nearExpiryRef.current) return;
        const y = nearExpiryRef.current.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }, 300);
      return () => clearTimeout(timer);
    }
    if (section === 'low-stock' && !loading && lowStockRef.current) {
      const timer = setTimeout(() => {
        if (!lowStockRef.current) return;
        const y = lowStockRef.current.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [section, loading]);

  // ── Export CSV ────────────────────────────────────────────────────────
  const exportToCSV = () => {
    const headers = ['Date', 'Product', 'Batch', 'Type', 'Qty', 'Unit Price', 'Balance', 'Office', 'User', 'Remarks'];
    const rows = filteredRows.map(r =>
      [r.date, r.product, r.batch, r.type, r.qty, r.price, r.balance, r.office, r.user, r.remarks]
    );
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Dentistry99_Ledger_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  // ── Pagination ────────────────────────────────────────────────────────
  const renderPagination = () => {
    const pages = [];
    pages.push(
      <button key="prev" onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
        disabled={currentPage === 1} className="pagination-btn">
        ← Prev
      </button>
    );
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <button key={i} onClick={() => setCurrentPage(i)}
          className={`pagination-btn ${currentPage === i ? 'active' : ''}`}>
          {i}
        </button>
      );
    }
    pages.push(
      <button key="next" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
        disabled={currentPage === totalPages || totalPages === 0} className="pagination-btn">
        Next →
      </button>
    );
    return pages;
  };

  // ── Mobile card renderers (structure unchanged) ───────────────────────
  const renderLowStockCards = () => (
    <div className="mobile-card-container">
      {lowStock.map((item, i) => (
        <div key={i} className="mobile-card">
          <div className="mobile-card-header">
            <span>{item.product}</span>
            <span className={`mobile-badge ${item.status === 'Critical' ? 'danger' : 'warning'}`}>{item.status}</span>
          </div>
          <div className="mobile-card-body">
            <div className="mobile-row"><span>Batch:</span>     <span>{item.batch}</span></div>
            <div className="mobile-row"><span>Office:</span>    <span>{item.office}</span></div>
            <div className="mobile-row"><span>Qty:</span>       <span>{item.qty}</span></div>
            <div className="mobile-row"><span>Threshold:</span> <span>{item.threshold}</span></div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderExpiryCards = () => (
    <div className="mobile-card-container">
      {nearExpiry.map((item, i) => (
        <div key={i} className="mobile-card">
          <div className="mobile-card-header">
            <span>{item.product}</span>
            <span className={`mobile-badge ${item.status === 'Urgent' || item.status === 'High Risk' ? 'danger' :
              item.status === 'Warning' ? 'warning' : 'info'
              }`}>{item.status}</span>
          </div>
          <div className="mobile-card-body">
            <div className="mobile-row"><span>Batch:</span>     <span>{item.batch}</span></div>
            <div className="mobile-row"><span>Expiry:</span>    <span>{item.expiry}</span></div>
            <div className="mobile-row"><span>Days Left:</span> <span className={daysClass(item.daysLeft)}>{item.daysLeft}</span></div>
            <div className="mobile-row"><span>Office:</span>    <span>{item.office}</span></div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderLedgerCards = () => (
    <div className="mobile-card-container">
      {paginatedRows.map((row, i) => (
        <div key={row.id ?? i} className="mobile-card">
          <div className="mobile-card-header">
            <span>{row.product}</span>
            <span className={`mobile-badge ${row.type === 'Received' ? 'success' : row.type === 'Used' ? 'danger' : 'info'
              }`}>{row.type}</span>
          </div>
          <div className="mobile-card-body">
            <div className="mobile-row"><span>Date:</span>    <span>{row.date}</span></div>
            <div className="mobile-row"><span>Batch:</span>   <span>{row.batch}</span></div>
            <div className="mobile-row"><span>Qty:</span>     <span>{row.qty}</span></div>
            <div className="mobile-row"><span>Price:</span>   <span>{row.price}</span></div>
            <div className="mobile-row"><span>Balance:</span> <span>{row.balance}</span></div>
            <div className="mobile-row"><span>Office:</span>  <span>{row.office}</span></div>
          </div>
        </div>
      ))}
    </div>
  );

  // ═════════════════════════════════════════════════════════════════════════
  return (
    <div className="ledger-wrapper">
      <div className="ledger-container">

        {/* ── PAGE HEADER ─────────────────────────────────────────────── */}
        <header className="ledger-header">
          <div className="ledger-header-left">
            <h1 className="page-title">Ledger &amp; Alerts</h1>
            <p className="page-subtitle">Monitor stock levels, expiry alerts and transaction history.</p>
          </div>

          <div className="search-box">
            <span className="search-box-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              className="search-input"
              placeholder="Search product, batch, user…"
              value={filters.search}
              onChange={e => handleFilterChange('search', e.target.value)}
            />
          </div>
        </header>

        {/* Global error */}
        {error && (
          <div style={{
            background: '#fef2f2', color: '#dc2626', padding: '0.875rem 1.25rem',
            borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid #fecaca',
            fontWeight: 600, fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}

        <div className="content-grid">

          {/* ── 1. LOW STOCK CARD ───────────────────────────────────────── */}
          {lowStock.length > 0 && (
            <div className="card" ref={lowStockRef}>
              <div className="card-header">
                <div className="card-title-group">
                  <span className="card-icon card-icon-red">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                  </span>
                  <h3>Low Stock Items</h3>
                  <span className="card-count-pill pill-danger">{lowStock.length}</span>
                </div>
              </div>

              {loading ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading…</div>
              ) : (
                <>
                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>Product</th><th>Batch</th><th>Office</th>
                          <th className="numeric">Qty</th><th className="numeric">Threshold</th><th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lowStock.length === 0 ? (
                          <tr><td colSpan={6} style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>✅ All items are above threshold</td></tr>
                        ) : lowStock.map((item, i) => (
                          <tr key={i}>
                            <td><span className="product-name">{item.product}</span></td>
                            <td><span style={{ color: 'var(--ld-muted)', fontSize: '13px' }}>{item.batch}</span></td>
                            <td>{item.office}</td>
                            <td className="numeric">
                              <span className={item.status === 'Critical' ? 'qty-negative' : 'days-warning'}>{item.qty}</span>
                            </td>
                            <td className="numeric">{item.threshold}</td>
                            <td>{stockBadge(item.status)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {renderLowStockCards()}
                </>
              )}
            </div>
          )}

          {/* ── 2. NEAR EXPIRY CARD ─────────────────────────────────────── */}
          <div className="card" ref={nearExpiryRef}>
            <div className="card-header">
              <div className="card-title-group">
                <span className="card-icon card-icon-amber">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                  </svg>
                </span>
                <h3>Near Expiry <span style={{ fontWeight: 400, color: '#64748b', fontSize: '0.85rem' }}>(Next 60 Days)</span></h3>
                <span className="card-count-pill pill-amber">{nearExpiry.length}</span>
              </div>
            </div>

            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading…</div>
            ) : (
              <>
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Product</th><th>Batch</th><th>Expiry Date</th>
                        <th className="numeric">Days Left</th><th>Office</th><th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {nearExpiry.length === 0 ? (
                        <tr><td colSpan={6} style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>✅ No items expiring in the next 60 days</td></tr>
                      ) : nearExpiry.map((item, i) => (
                        <tr key={i}>
                          <td><span className="product-name">{item.product}</span></td>
                          <td><span style={{ color: 'var(--ld-muted)', fontSize: '13px' }}>{item.batch}</span></td>
                          <td>{item.expiry}</td>
                          <td className="numeric">
                            <span className={daysClass(item.daysLeft)}>{item.daysLeft}</span>
                          </td>
                          <td>{item.office}</td>
                          <td>{expiryBadge(item.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {renderExpiryCards()}
              </>
            )}
          </div>

          {/* ── 3. COMPLETE TRANSACTION LEDGER ──────────────────────────── */}
          <div className="card">
            <div className="card-header">
              <div className="card-title-group">
                <span className="card-icon card-icon-blue">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#0369a1" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                </span>
                <h3>Complete Transaction Ledger</h3>
                <span className="card-count-pill pill-primary">{filteredRows.length}</span>
              </div>
            </div>

            {/* Filters */}
            <div className="controls-bar">
              <select className="control-select" value={filters.office}
                onChange={e => handleFilterChange('office', e.target.value)}>
                <option value="">All Offices</option>
                {/* Dynamic options from actual data */}
                {[...new Set(filteredRows.map(r => r.office))].filter(Boolean).map(o => (
                  <option key={o}>{o}</option>
                ))}
              </select>

              <select className="control-select" value={filters.type}
                onChange={e => handleFilterChange('type', e.target.value)}>
                <option value="">All Types</option>
                <option>Received</option>
                <option>Used</option>
                <option>Transferred</option>
              </select>

              <input type="date" className="control-input"
                value={filters.dateFrom}
                onChange={e => handleFilterChange('dateFrom', e.target.value)} />

              <input type="date" className="control-input"
                value={filters.dateTo}
                onChange={e => handleFilterChange('dateTo', e.target.value)} />

              <button className="btn-export" onClick={exportToCSV}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Export CSV
              </button>
            </div>

            {/* Desktop Table */}
            {loading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Loading transactions…</div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th onClick={() => handleSortChange('date')}>Date &amp; Time{sortArrow('date', sortCol, sortDir)}</th>
                      <th onClick={() => handleSortChange('product')}>Product{sortArrow('product', sortCol, sortDir)}</th>
                      <th onClick={() => handleSortChange('batch')}>Batch{sortArrow('batch', sortCol, sortDir)}</th>
                      <th onClick={() => handleSortChange('type')}>Type{sortArrow('type', sortCol, sortDir)}</th>
                      <th className="numeric" onClick={() => handleSortChange('qty')}>Qty{sortArrow('qty', sortCol, sortDir)}</th>
                      <th className="numeric" onClick={() => handleSortChange('price')}>Unit Price{sortArrow('price', sortCol, sortDir)}</th>
                      <th className="numeric" onClick={() => handleSortChange('balance')}>Balance{sortArrow('balance', sortCol, sortDir)}</th>
                      <th onClick={() => handleSortChange('office')}>Office{sortArrow('office', sortCol, sortDir)}</th>
                      <th>User</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRows.length === 0 ? (
                      <tr><td colSpan={10} style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem' }}>No transactions found.</td></tr>
                    ) : paginatedRows.map((row, i) => {
                      const isNeg = row.qty.startsWith('-');
                      const isPos = row.qty.startsWith('+');
                      return (
                        <tr key={row.id ?? i}>
                          <td style={{ color: 'var(--ld-muted)', fontSize: '13px', whiteSpace: 'nowrap' }}>{row.date}</td>
                          <td><span className="product-name">{row.product}</span></td>
                          <td><span style={{ color: 'var(--ld-muted)', fontSize: '13px' }}>{row.batch}</span></td>
                          <td>{typeBadge(row.type)}</td>
                          <td className="numeric">
                            <span className={isNeg ? 'qty-negative' : isPos ? 'qty-positive' : ''}>{row.qty}</span>
                          </td>
                          <td className="numeric">{row.price}</td>
                          <td className="numeric" style={{ fontWeight: 600 }}>{row.balance}</td>
                          <td>{row.office}</td>
                          <td style={{ color: 'var(--ld-muted)' }}>{row.user}</td>
                          <td style={{ color: 'var(--ld-subtle)', fontSize: '13px' }}>{row.remarks}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Mobile Cards */}
            {renderLedgerCards()}

            {/* Pagination */}
            <div className="pagination">
              {renderPagination()}
            </div>
          </div>

        </div>{/* /content-grid */}
      </div>{/* /ledger-container */}
    </div>
  );
}