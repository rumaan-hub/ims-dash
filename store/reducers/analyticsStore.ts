import { create } from "zustand";
import { analyticsApi } from "@/_api_/apiCallManager";

// ── Types ──────────────────────────────────────────────────────────────────
export interface AnalyticsSuggestion {
    productId: string;
    productName: string;
    currentStock: number;
    totalUsage: number;
    activeDays: number;
    averageDailyUsage: number;
    estimatedDaysRemaining: number | null;
    estimatedStockOutDate: string | null;
    suggestedRestockQuantity: number | null;
    status: string;
}

export interface ChartData {
    labels: string[];
    values: number[];
}

// ── Store state & actions ──────────────────────────────────────────────────
interface AnalyticsState {
    products: AnalyticsSuggestion[];
    totalItems: number;
    totalPages: number;
    currentPage: number;
    chartData: ChartData;
    loading: boolean;
    error: string | null;

    fetchAnalyticsSuggestions: (page?: number, limit?: number) => Promise<void>;
}

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
    products: [],
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
    chartData: { labels: [], values: [] },
    loading: false,
    error: null,

    fetchAnalyticsSuggestions: async (page = 1, limit = 10) => {
        set({ loading: true, error: null });
        try {
            const response = await analyticsApi.getAnalyticsSuggestions(page, limit);
            set({
                products: response.products,
                totalItems: response.totalItems,
                currentPage: response.currentPage,
                totalPages: response.totalPages,
                chartData: response.chartData,
                loading: false,
            });
        } catch (e: unknown) {
            set({
                error: e instanceof Error ? e.message : "Failed to load analytics suggestions",
                loading: false,
            });
        }
    },
}));
