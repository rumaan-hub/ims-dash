"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Chart, registerables } from "chart.js";
import { useSystemActivity } from "@/hooks/useSystemActivity";
import { useDashboard } from "@/hooks/useDashboard";
import { getToken } from "@/app/utils/auth";
import {
  CubeIcon,
  UsersIcon,
  ClipboardDocumentCheckIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ShoppingBagIcon,
  ArrowsRightLeftIcon,
  CheckCircleIcon
} from "@heroicons/react/24/outline";
import type { LedgerRow } from "@/store/reducers/ledgerStore";
import type { SystemActivityLog } from "@/store/reducers/systemActivityStore";
import "./page.css";

// Register Chart.js components
Chart.register(...registerables);

export default function Dashboard() {
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);
  const { trackPageOpen, fetchLogs, logs: sysLogs } = useSystemActivity();

  // Redirect system admins to their dashboard
  useEffect(() => {
    const token = getToken();
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (
        payload.is_system_admin === true ||
        payload.role === "SYSTEM_ADMIN" ||
        payload.role === "SUPER_ADMIN"
      ) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setRedirecting(true);
        router.replace("/system-admin/home");
      }
    } catch {}
  }, [router]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const stockChartRef = useRef<HTMLCanvasElement>(null);
  const categoryChartRef = useRef<HTMLCanvasElement>(null);
  const stockChartInstance = useRef<Chart | null>(null);
  const categoryChartInstance = useRef<Chart | null>(null);

  // ── Dynamic KPI state ─────────────────────────────────────────────────
  const {
    totalProducts,
    staffCount,
    nearExpiryCount,
    lowStockCount,
    lowStockItems,
    categoryData,
    allTransactions,
    fetchDashboardData,
    fetchDataForCsvExport
  } = useDashboard();

  // ── Dynamic widget data ───────────────────────────────────────────────
  type Activity = {
    id: string;
    text: string;
    time: string;
    icon: React.ReactNode;
    color: string;
    timestamp: number;
    raw: LedgerRow | SystemActivityLog;
  };
  const [activities, setActivities] = useState<Activity[]>([]);

  // ── Dynamic chart data ───────────────────────────────────────────────
  const [trendData, setTrendData] = useState<{ labels: string[]; values: number[] }>({
    labels: [], values: [],
  });

  // ── Chart Filters ──────────────────────────────────────────────────
  const [trendFilter, setTrendFilter] = useState("Last 12 Months");
  const [customTrendDates, setCustomTrendDates] = useState({ start: '', end: '' });

  // ── Fetch all dashboard data & Track open ──────────────────────────────
  useEffect(() => {
    fetchDashboardData();
    trackPageOpen('Dashboard');
  }, [fetchDashboardData, trackPageOpen]);

  // Combine logs and transactions into activities feed
  useEffect(() => {
    const formattedLedger = allTransactions.map((tx: LedgerRow, i: number) => {
      let icon, color, text;
      const q = tx.qty ?? '';
      const prod = tx.product ?? 'Unknown';
      const office = tx.office ?? '';

      switch (tx.type) {
        case 'Received':
          icon = <ShoppingBagIcon className="w-5 h-5" />;
          color = '#3b82f6';
          text = `${prod} received (${q}) at ${office}`;
          break;
        case 'Used':
          icon = <ExclamationTriangleIcon className="w-5 h-5" />;
          color = '#ef4444';
          text = `${prod} used (${q}) at ${office}`;
          break;
        case 'TRANSFER IN':
        case 'TRANSFER OUT':
          icon = <ArrowsRightLeftIcon className="w-5 h-5" />;
          color = '#0A96D4';
          text = `${prod} transferred (${q}) — ${office}`;
          break;
        default:
          icon = <CheckCircleIcon className="w-5 h-5" />;
          color = '#10b981';
          text = `${prod}: ${tx.type} (${q}) at ${office}`;
      }
      return {
        id: `ledger-${i}`,
        text,
        time: tx.date ?? '',
        icon,
        color,
        timestamp: new Date(tx.date || Date.now()).getTime(),
        raw: tx
      };
    });

    const formattedSys = sysLogs.map((sa: SystemActivityLog) => ({
      id: `sys-${(sa as { activity_id?: string | number }).activity_id ?? sa.id ?? ''}`,
      text: `${sa.action}${sa.product ? `: ${sa.product}` : ''}${sa.office ? ` at ${sa.office}` : ''}`,
      time: new Date(sa.created_at ?? Date.now()).toLocaleString(),
      icon: <CheckCircleIcon className="w-5 h-5" />,
      color: '#6366f1',
      timestamp: new Date(sa.created_at ?? Date.now()).getTime(),
      raw: sa
    }));

    const merged = [...formattedLedger, ...formattedSys]
      .sort((a, b) => b.timestamp - a.timestamp);

    // TODO: Replace with `useMemo`. Currently kept as setState because the
    // pagination handler also writes `activities` independently of derived data.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActivities(merged.slice(0, 10));
  }, [allTransactions, sysLogs]);

  // ── CSV Export ──────────────────────────────────────────────────────
  const downloadCSV = async () => {
    try {
      const { allLedger, allSysLogs } = await fetchDataForCsvExport();

      type LedgerExportRow = LedgerRow & { transaction_id?: string | number; description?: string };
      const formattedLedger = (allLedger || []).map((tx: LedgerExportRow) => ({
        id: `ledger-${tx.transaction_id || Math.random()}`,
        text: tx.description ?? '',
        time: tx.date ?? '',
        timestamp: new Date(tx.date || Date.now()).getTime(),
        raw: tx
      }));

      const formattedSys = ((allSysLogs as SystemActivityLog[]) || []).map((sa: SystemActivityLog) => ({
        id: `sys-${(sa as { activity_id?: string | number }).activity_id ?? sa.id ?? ''}`,
        text: `${sa.action}${sa.product ? `: ${sa.product}` : ''}${sa.office ? ` at ${sa.office}` : ''}`,
        time: new Date(sa.created_at ?? Date.now()).toLocaleString(),
        timestamp: new Date(sa.created_at ?? Date.now()).getTime(),
        raw: sa
      }));

      const mergedAll = [...formattedLedger, ...formattedSys]
        .sort((a, b) => b.timestamp - a.timestamp);

      const headers = ['Timestamp', 'Action', 'Product', 'Office', 'User'];
      const rows = mergedAll.map(a => {
        const r = a.raw;
        if (a.id.startsWith('ledger')) {
          const lr = r as LedgerExportRow;
          return [lr.date, a.text, lr.product, lr.office, lr.user];
        } else {
          const sr = r as SystemActivityLog;
          return [new Date(sr.created_at ?? Date.now()).toLocaleString(), a.text, sr.product || '-', sr.office || '-', sr.user || '-'];
        }
      });

      const csvContent = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `system_activity_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to download CSV', err);
    }
  };

  // ── Compute Trend Chart Data based on Filter ────────────────────────
  useEffect(() => {
    if (!allTransactions || allTransactions.length === 0) return;

    const now = new Date();
    let startDate: Date | null = null;
    let endDate: Date | null = now;
    let aggType = 'month';

    if (trendFilter === "Last 1 Day") {
      startDate = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
      aggType = 'day';
    } else if (trendFilter === "Last 7 Days") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      aggType = 'day';
    } else if (trendFilter === "Last 30 Days") {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      aggType = 'day';
    } else if (trendFilter === "Last 12 Months") {
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 12);
      aggType = 'month';
    } else if (trendFilter === "Custom") {
      startDate = customTrendDates.start ? new Date(customTrendDates.start + 'T00:00:00') : new Date("2000-01-01");
      endDate = customTrendDates.end ? new Date(customTrendDates.end + 'T23:59:59') : new Date();
      if ((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24) <= 90) {
        aggType = 'day';
      } else {
        aggType = 'month';
      }
    }

    const groupedNet = new Map<string, number>();
    for (const tx of allTransactions) {
      if (!tx.date) continue;
      const key = aggType === 'day' ? tx.date.substring(0, 10) : tx.date.substring(0, 7);
      const raw = String(tx.qty ?? '0').replace(/[^\d\-+]/g, '');
      const qty = parseInt(raw, 10) || 0;
      groupedNet.set(key, (groupedNet.get(key) || 0) + qty);
    }

    const sortedKeys = Array.from(groupedNet.keys()).sort();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let cumulative = 0;
    const labels: string[] = [];
    const values: number[] = [];

    for (const k of sortedKeys) {
      cumulative += groupedNet.get(k)!;
      const txDate = aggType === 'day' ? new Date(k + 'T12:00:00') : new Date(k + '-15T12:00:00');

      if (startDate && txDate < startDate) continue;
      if (endDate && txDate > endDate) continue;

      if (aggType === 'day') {
        labels.push(`${monthNames[txDate.getMonth()]} ${txDate.getDate()}`);
      } else {
        labels.push(`${monthNames[txDate.getMonth()]} ${txDate.getFullYear().toString().slice(-2)}`);
      }
      values.push(Math.max(0, cumulative));
    }

    // Default to a flat line of the current standing if no activity in window
    if (labels.length === 0) {
      labels.push('Current');
      values.push(Math.max(0, cumulative));
    }

    // TODO: Replace with `useMemo` once chart effects below also depend on memo'd value.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTrendData({ labels, values });
  }, [allTransactions, trendFilter, customTrendDates]);

  // ── Charts: re-render when dynamic data arrives ─────────────────────
  useEffect(() => {
    // Inventory Growth Trends (line chart)
    if (stockChartRef.current) {
      if (stockChartInstance.current) stockChartInstance.current.destroy();

      const ctx = stockChartRef.current.getContext("2d");
      if (ctx && trendData.labels.length > 0) {
        stockChartInstance.current = new Chart(ctx, {
          type: "line",
          data: {
            labels: trendData.labels,
            datasets: [
              {
                label: "Inventory Level",
                data: trendData.values,
                borderColor: "#0A96D4",
                backgroundColor: "rgba(10, 150, 212, 0.1)",
                fill: true,
                tension: 0.4,
                borderWidth: 3,
                pointRadius: 4,
                pointBackgroundColor: "#fff",
                pointBorderColor: "#0A96D4",
                pointBorderWidth: 2,
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: "#1e293b",
                padding: 12,
                titleFont: { size: 14, weight: 'bold' },
                bodyFont: { size: 13 },
                displayColors: false
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                grid: { color: "rgba(0,0,0,0.03)" },
                ticks: { color: "#94a3b8", font: { size: 11 } }
              },
              x: {
                grid: { display: false },
                ticks: { color: "#94a3b8", font: { size: 11 } }
              }
            }
          }
        });
      }
    }

    // Category Distribution (doughnut) — Consumable vs Equipment
    if (categoryChartRef.current) {
      if (categoryChartInstance.current) categoryChartInstance.current.destroy();

      const ctx = categoryChartRef.current.getContext("2d");
      if (ctx && (categoryData[0] > 0 || categoryData[1] > 0)) {
        categoryChartInstance.current = new Chart(ctx, {
          type: "doughnut",
          data: {
            labels: ["Consumables", "Equipment"],
            datasets: [
              {
                data: categoryData,
                backgroundColor: ["#0A96D4", "#0eccd8"],
                borderWidth: 0,
                hoverOffset: 15
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "75%",
            plugins: {
              legend: {
                position: "bottom",
                labels: {
                  usePointStyle: true,
                  padding: 20,
                  font: { size: 12, weight: 600, family: "'Inter', sans-serif" },
                  color: "#64748b"
                }
              },
              tooltip: {
                backgroundColor: "#1e293b",
                padding: 12,
                displayColors: true
              }
            }
          }
        });
      }
    }

    return () => {
      if (stockChartInstance.current) stockChartInstance.current.destroy();
      if (categoryChartInstance.current) categoryChartInstance.current.destroy();
    };
  }, [trendData, categoryData]);

  if (redirecting) return null;

  return (
    <div className="dashboard-container max-w-full overflow-hidden">
      {/* --- HEADER --- */}
      <div className="dashboard-header">
        <h1 className="dashboard-title">IMS Analytics Overview</h1>
        <p className="dashboard-subtitle">Real-time performance metrics and inventory insights.</p>
      </div>

      {/* --- KPI CARDS --- */}
      <div className="dashboard-kpi-grid">
        <KPICard
          label="Total Products"
          value={totalProducts}
          trend=""
          trendUp={true}
          icon={<CubeIcon className="w-6 h-6" />}
          onClick={() => router.push('/inventory')}
        />
        <KPICard
          label="Staff Members"
          value={staffCount}
          trend=""
          trendUp={true}
          icon={<UsersIcon className="w-6 h-6" />}
          onClick={() => router.push('/staff')}
        />
        <KPICard
          label="Near Expiry Batches"
          value={nearExpiryCount}
          trend=""
          trendUp={false}
          icon={<ClipboardDocumentCheckIcon className="w-6 h-6" />}
          onClick={() => router.push('/ledger?section=near-expiry')}
        />
        <KPICard
          label="Low Stock Alerts"
          value={lowStockCount}
          trend=""
          trendUp={false}
          icon={<ExclamationTriangleIcon className="w-6 h-6" />}
          onClick={() => router.push('/ledger?section=low-stock')}
        />
      </div>

      {/* --- MAIN GRID (Charts + Activity) --- */}
      <div className="dashboard-main-grid max-w-full">
        {/* Main Chart Column */}
        <div className="dashboard-chart-card max-w-full overflow-hidden">
          <div className="chart-card-header">
            <h2 className="chart-card-title">Inventory Growth Trends</h2>
            <div className="chart-filters-container">
              {trendFilter === 'Custom' && (
                <div className="custom-date-filters">
                  <input
                    type="date"
                    className="date-input-field"
                    value={customTrendDates.start}
                    onChange={e => setCustomTrendDates({ ...customTrendDates, start: e.target.value })}
                  />
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>to</span>
                  <input
                    type="date"
                    className="date-input-field"
                    value={customTrendDates.end}
                    onChange={e => setCustomTrendDates({ ...customTrendDates, end: e.target.value })}
                  />
                </div>
              )}
              <select
                className="filter-select"
                value={trendFilter}
                onChange={(e) => setTrendFilter(e.target.value)}
              >
                <option value="Last 12 Months">Last 12 Months</option>
                <option value="Last 30 Days">Last 30 Days</option>
                <option value="Last 7 Days">Last 7 Days</option>
                <option value="Last 1 Day">Last 1 Day</option>
                <option value="Custom">Custom</option>
              </select>
            </div>
          </div>
          <div className="chart-wrapper">
            <canvas ref={stockChartRef}></canvas>
          </div>
        </div>

        {/* Right Column (Category + Low Stock) */}
        <div className="dashboard-side-grid max-w-full">
          <div className="mini-widget-card max-w-full overflow-hidden">
            <h2 className="text-lg font-extrabold mb-6 text-slate-800">Category Mix</h2>
            <div className="pie-chart-wrapper">
              <canvas ref={categoryChartRef}></canvas>
            </div>
          </div>

          <div className="mini-widget-card max-w-full overflow-hidden">
            <h2 className="text-lg font-extrabold mb-4 text-slate-800">Critical Stock</h2>
            <div className="low-stock-list">
              {lowStockItems.map((item, i) => (
                <div key={i} className="low-stock-item">
                  <div className="low-stock-info">
                    <span>{item.name}</span>
                    <small>{item.stock} {item.unit} remaining</small>
                  </div>
                  <button
                    className="low-stock-badge"
                    onClick={() => router.push(`/inventory?product=${item.id}&action=reorder`)}
                  >
                    REORDER
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* --- BOTTOM SECTION (Activity Feed) --- */}
      <div className="dashboard-chart-card">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-lg font-extrabold text-slate-800">System Activity Log</h2>
          <button onClick={downloadCSV} className="download-btn">
            <ShoppingBagIcon className="w-4 h-4" />
            Download CSV
          </button>
        </div>
        <div className="activity-feed">
          {activities.map((activity) => (
            <div key={activity.id} className="activity-item">
              <div className="activity-icon" style={{ color: activity.color }}>
                {activity.icon}
              </div>
              <div className="activity-content">
                <p className="activity-text">{activity.text}</p>
                <span className="activity-time">{activity.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

interface KPICardProps {
  label: string;
  value: string | number;
  trend: string;
  trendUp: boolean;
  icon: React.ReactNode;
  onClick?: () => void;
}

function KPICard({ label, value, trend, trendUp, icon, onClick }: KPICardProps) {
  return (
    <div className="dashboard-kpi-card" onClick={onClick} style={onClick ? { cursor: 'pointer' } : undefined}>
      <div className="kpi-card-header">
        <span className="kpi-card-label">{label}</span>
        <div className="kpi-card-icon">{icon}</div>
      </div>
      <div>
        <h2 className="kpi-card-value">{value}</h2>
        <div className={`kpi-card-trend ${trendUp ? 'trend-up' : 'trend-down'}`}>
          {trendUp ? <ArrowTrendingUpIcon className="w-4 h-4" /> : <ArrowTrendingDownIcon className="w-4 h-4" />}
          <span>{trend} vs last month</span>
        </div>
      </div>
    </div>
  );
}
