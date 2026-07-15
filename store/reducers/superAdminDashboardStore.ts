import { create } from "zustand";
import { subscriptionApi } from "@/_api_/apiCallManager";

export type DashboardStats = {
    totalSubscribers: number;
    demos: number;
    basicSubscription: number;
    standardSubscription: number;
    premiumSubscription: number;
    activeDemos: number;
    pendingDemos: number;
    failedDemos: number;
    rescheduledDemos: number;
    successfulDemos: number;
    agreements: number;
    signedAgreements: number;
    pendingActivations: number;
    activeSubscriptions: number;
    totalRevenue: number;
};

export type ChartDataItem = { name: string; value: number };
export type RevenueItem = { month: string; revenue: number };

export type DashboardChartData = {
    subscriptionStatus: ChartDataItem[];
    demoStatus: ChartDataItem[];
    revenueByMonth: RevenueItem[];
};

interface SuperAdminDashboardState {
    stats: DashboardStats | null;
    chartData: DashboardChartData | null;
    statsLoading: boolean;
    fetchStats: (filter?: string) => Promise<void>;
    fetchChartData: (filter?: string) => Promise<void>;
}

export const useSuperAdminDashboardStore = create<SuperAdminDashboardState>((set) => ({
    stats: null,
    chartData: null,
    statsLoading: false,

    fetchStats: async (filter?: string) => {
        set({ statsLoading: true });
        try {
            const data = await subscriptionApi.getDashboardStats(filter);
            set({ stats: data });
        } catch {
            set({ stats: null });
        } finally {
            set({ statsLoading: false });
        }
    },

    fetchChartData: async (filter?: string) => {
        try {
            const data = await subscriptionApi.getDashboardChartData(filter);
            set({ chartData: data });
        } catch {
            set({ chartData: null });
        }
    },
}));
