"use client";

import { useEffect } from "react";
import { useSuperAdminDashboardStore } from "@/store/reducers/superAdminDashboardStore";

export const useSuperAdminDashboard = () => {
    const { stats, chartData, statsLoading, fetchStats, fetchChartData } =
        useSuperAdminDashboardStore();

    useEffect(() => {
        fetchStats();
        fetchChartData();
        // initial-load only — fetchers from zustand store are stable references
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return { stats, chartData, statsLoading, fetchStats, fetchChartData };
};
