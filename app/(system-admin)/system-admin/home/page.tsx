"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
    UsersIcon,
    VideoCameraIcon,
    CheckBadgeIcon,
    ClockIcon,
    XCircleIcon,
    DocumentTextIcon,
    ChartPieIcon,
    ChartBarIcon,
    ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { useSuperAdminDashboard } from "@/hooks/useSuperAdminDashboard";
import type { ChartDataItem, RevenueItem } from "@/store/reducers/superAdminDashboardStore";

// Dynamic imports — Chart.js never loads during SSR
const DoughnutChart = dynamic(() => import("@/app/components/DoughnutChart"), {
    ssr: false,
    loading: () => <div style={{ height: "300px" }} />,
});
const BarChart = dynamic(() => import("@/app/components/BarChart"), {
    ssr: false,
    loading: () => <div style={{ height: "300px" }} />,
});
const LineChart = dynamic(() => import("@/app/components/LineChart"), {
    ssr: false,
    loading: () => <div style={{ height: "300px" }} />,
});

const filters = [
    { label: "Overall", value: "overall" },
    { label: "12 Months", value: "12months" },
    { label: "30 Days", value: "30days" },
    { label: "7 Days", value: "7days" },
    { label: "24 Hours", value: "24hours" },
];

export default function SuperAdminDashboard() {
    const { stats, chartData, statsLoading, fetchStats, fetchChartData } = useSuperAdminDashboard();
    const [mounted, setMounted] = useState(false);
    const [activeFilter, setActiveFilter] = useState("overall");

    // The classic post-mount flag — must be set in an effect for SSR safety.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => setMounted(true), []);

    const handleFilterClick = (value: string) => {
        setActiveFilter(value);
        fetchStats(value);
        fetchChartData(value);
    };

    const s = stats;

    const kpis = [
        { title: "Total Subscribers", value: s?.totalSubscribers ?? 0, icon: <UsersIcon className="w-6 h-6" style={{ color: '#3b82f6' }} />, iconBg: '#dbeafe' },
        { title: "Demo's", value: s?.demos ?? 0, icon: <VideoCameraIcon className="w-6 h-6" style={{ color: '#8b5cf6' }} />, iconBg: '#ede9fe' },
        { title: "Standard Subscription", value: s?.standardSubscription ?? 0, icon: <CheckBadgeIcon className="w-6 h-6" style={{ color: '#22c55e' }} />, iconBg: '#dcfce7' },
        { title: "Premium Subscription", value: s?.premiumSubscription ?? 0, icon: <CheckBadgeIcon className="w-6 h-6" style={{ color: '#eab308' }} />, iconBg: '#fef9c3' },
        { title: "Active Demo's", value: s?.activeDemos ?? 0, icon: <ClockIcon className="w-6 h-6" style={{ color: '#f97316' }} />, iconBg: '#ffedd5' },
        { title: "Pending Demo's", value: s?.pendingDemos ?? 0, icon: <DocumentTextIcon className="w-6 h-6" style={{ color: '#6b7280' }} />, iconBg: '#f3f4f6' },
        { title: "Failed Demo's", value: s?.failedDemos ?? 0, icon: <XCircleIcon className="w-6 h-6" style={{ color: '#ef4444' }} />, iconBg: '#fee2e2' },
        { title: "Agreements", value: s?.agreements ?? 0, icon: <DocumentTextIcon className="w-6 h-6" style={{ color: '#6366f1' }} />, iconBg: '#e0e7ff' },
        { title: "Pending Activations", value: s?.pendingActivations ?? 0, icon: <ExclamationTriangleIcon className="w-6 h-6" style={{ color: '#f59e0b' }} />, iconBg: '#fef3c7' },
    ];

    return (
        <div>
            <style>{`
                .sa-kpi-grid {
                    display: grid;
                    gap: 12px;
                    margin-bottom: 32px;
                    grid-template-columns: repeat(1, 1fr);
                    overflow: visible;
                }
                @media (min-width: 400px) {
                    .sa-kpi-grid { grid-template-columns: repeat(2, 1fr); }
                }
                @media (min-width: 640px) {
                    .sa-kpi-grid { grid-template-columns: repeat(3, 1fr); gap: 16px; }
                }
                @media (min-width: 1024px) {
                    .sa-kpi-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); }
                }
                .sa-kpi-label {
                    font-size: 10px;
                    color: #6b7280;
                    font-weight: 600;
                    margin: 0;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    white-space: normal;
                    word-break: break-word;
                    overflow: visible;
                    line-height: 1.3;
                    display: block;
                    width: 100%;
                }
                @media (min-width: 640px) {
                    .sa-kpi-label { font-size: 11px; }
                }
                .sa-charts-grid {
                    display: grid;
                    gap: 24px;
                    grid-template-columns: 1fr;
                }
                @media (min-width: 1024px) {
                    .sa-charts-grid { grid-template-columns: 1fr 1fr; }
                }
                .sa-chart-card {
                    background: #ffffff;
                    border-radius: 16px;
                    padding: 24px;
                    border: 1px solid #e5e7eb;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
                    min-width: 0;
                    overflow: hidden;
                    transition: all 0.3s ease;
                }
                .sa-chart-card:hover {
                    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
                }
                .sa-chart-icon {
                    width: 20px; height: 20px;
                    color: #6b7280;
                    transition: color 0.2s ease;
                }
                .sa-chart-card:hover .sa-chart-icon {
                    color: #2563eb;
                }
                .sa-revenue-chart-container {
                    position: relative;
                    width: 100%;
                    height: 250px;
                }
                @media (min-width: 768px) {
                    .sa-revenue-chart-container { height: 280px; }
                }
                @media (min-width: 1024px) {
                    .sa-revenue-chart-container { height: 300px; }
                }
            `}</style>

            <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px', color: '#111827' }}>
                Dashboard Overview
            </h1>
            <p style={{ color: '#6b7280', marginBottom: '16px' }}>
                Welcome back, Super Admin. Here is what&apos;s happening today.
            </p>

            {/* DATE FILTER */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
                {filters.map((f) => (
                    <button
                        key={f.value}
                        onClick={() => handleFilterClick(f.value)}
                        style={{
                            background: activeFilter === f.value ? '#2563eb' : '#ffffff',
                            color: activeFilter === f.value ? '#ffffff' : '#374151',
                            border: activeFilter === f.value ? 'none' : '1px solid #e5e7eb',
                            borderRadius: '6px',
                            padding: '6px 16px',
                            fontWeight: activeFilter === f.value ? 600 : 400,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            fontSize: '14px',
                        }}
                        onMouseEnter={(e) => {
                            if (activeFilter !== f.value) {
                                (e.target as HTMLButtonElement).style.background = '#eff6ff';
                                (e.target as HTMLButtonElement).style.color = '#2563eb';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (activeFilter !== f.value) {
                                (e.target as HTMLButtonElement).style.background = '#ffffff';
                                (e.target as HTMLButtonElement).style.color = '#374151';
                            }
                        }}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* KPI GRID */}
            <div className="sa-kpi-grid">
                {kpis.map((kpi, i) => (
                    <div key={i} className="sa-kpi-card" style={{
                        background: '#ffffff',
                        borderRadius: '12px',
                        padding: '12px',
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        gap: '8px',
                        minWidth: 0,
                        minHeight: '100px',
                        overflow: 'visible',
                        transition: 'all 0.3s ease',
                        cursor: 'default',
                    }}>
                        <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: kpi.iconBg,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        }}>
                            {kpi.icon}
                        </div>
                        <div style={{ minWidth: 0, width: '100%' }}>
                            <p className="sa-kpi-label">{kpi.title}</p>
                            <h3 style={{ fontSize: '28px', fontWeight: 700, color: '#111827', margin: '2px 0 0' }}>
                                {statsLoading ? "—" : kpi.value}
                            </h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* CHARTS SECTION */}
            <div className="sa-charts-grid" style={{ marginTop: '32px' }}>

                {/* Subscriptions Status Chart */}
                <div className="sa-chart-card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: 0 }}>Subscriptions Status</h3>
                        <ChartPieIcon className="sa-chart-icon" />
                    </div>
                    <div style={{ position: 'relative', height: '300px', width: '100%', overflow: 'hidden' }}>
                        {mounted && chartData?.subscriptionStatus ? (
                            <DoughnutChart
                                labels={chartData.subscriptionStatus.map((d: ChartDataItem) => d.name)}
                                data={chartData.subscriptionStatus.map((d: ChartDataItem) => d.value)}
                                colors={['#3b82f6', '#22d3ee', '#60a5fa']}
                            />
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9ca3af', fontSize: '14px' }}>
                                Loading chart...
                            </div>
                        )}
                    </div>
                </div>

                {/* Demo Status Chart */}
                <div className="sa-chart-card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: 0 }}>Demo Status Overview</h3>
                        <ChartBarIcon className="sa-chart-icon" />
                    </div>
                    <div style={{ position: 'relative', height: '300px', width: '100%', overflow: 'hidden' }}>
                        {mounted && chartData?.demoStatus ? (
                            <BarChart
                                labels={chartData.demoStatus.map((d: ChartDataItem) => d.name)}
                                data={chartData.demoStatus.map((d: ChartDataItem) => d.value)}
                                colors={['#60a5fa', '#93c5fd', '#22d3ee', '#fca5a5', '#fcd34d', '#c4b5fd']}
                            />
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9ca3af', fontSize: '14px' }}>
                                Loading chart...
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* REVENUE LINE CHART */}
            {mounted && chartData?.revenueByMonth && (
                <div className="sa-chart-card" style={{ marginTop: '24px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '16px' }}>
                        <div>
                            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: 0 }}>Revenue Trend</h3>
                            <p style={{ fontSize: '13px', color: '#9ca3af', margin: '4px 0 0' }}>Monthly revenue over last 12 months</p>
                        </div>
                        <div style={{ fontSize: '20px', fontWeight: 700, color: '#2563eb' }}>
                            Total: ${chartData.revenueByMonth.reduce((sum: number, r: RevenueItem) => sum + r.revenue, 0).toFixed(2)}
                        </div>
                    </div>
                    <div className="sa-revenue-chart-container">
                        <LineChart
                            labels={chartData.revenueByMonth.map((r: RevenueItem) => r.month)}
                            data={chartData.revenueByMonth.map((r: RevenueItem) => r.revenue)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
