import { create } from "zustand";
import { inventoryApi, staffApi, ledgerApi, systemActivityApi } from "@/_api_/apiCallManager";
import type { LedgerRow, LowStockItem } from "./ledgerStore";

export interface DashboardLowStockItem {
    id?: string;
    name: string;
    stock: number;
    unit: string;
}

interface DashboardState {
    totalProducts: number;
    staffCount: number;
    nearExpiryCount: number;
    lowStockCount: number;
    lowStockItems: DashboardLowStockItem[];
    categoryData: number[]; // [consumable, equipment]
    allTransactions: LedgerRow[];
    loading: boolean;
    error: string | null;

    fetchDashboardData: () => Promise<void>;
    fetchDataForCsvExport: () => Promise<{ allLedger: LedgerRow[], allSysLogs: unknown[] }>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
    totalProducts: 0,
    staffCount: 0,
    nearExpiryCount: 0,
    lowStockCount: 0,
    lowStockItems: [],
    categoryData: [0, 0],
    allTransactions: [],
    loading: false,
    error: null,

    fetchDashboardData: async () => {
        set({ loading: true, error: null });
        try {
            const [
                invRes,
                staffRes,
                expiryRes,
                lowRes,
                txRes,
                consumRes,
                equipRes
            ] = await Promise.allSettled([
                inventoryApi.getInventory(),
                staffApi.getStaff(),
                ledgerApi.getNearExpiryAlerts(30),
                ledgerApi.getLowStockAlerts(),
                ledgerApi.getLedgerTransactions(),
                staffApi.getLightProducts("", 1, 1, undefined, true, "CONSUMABLE"),
                staffApi.getLightProducts("", 1, 1, undefined, true, "EQUIPMENT"),
            ]);

            let totalProducts = 0;
            if (invRes.status === 'fulfilled') {
                totalProducts = invRes.value?.totalProducts ?? 0;
            }

            let staffCount = 0;
            if (staffRes.status === 'fulfilled') {
                const list = Array.isArray(staffRes.value) ? staffRes.value : [];
                staffCount = list.length;
            }

            let nearExpiryCount = 0;
            if (expiryRes.status === 'fulfilled') {
                const alerts = Array.isArray(expiryRes.value) ? expiryRes.value : [];
                // Some APIs might return { count: number } or an array
                nearExpiryCount = (expiryRes.value as { count?: number })?.count ?? alerts.length;
            }

            let lowStockCount = 0;
            let lowStockItems: DashboardLowStockItem[] = [];
            if (lowRes.status === 'fulfilled') {
                const alerts: LowStockItem[] = Array.isArray(lowRes.value) ? lowRes.value : [];
                lowStockCount = alerts.length;
                lowStockItems = alerts.slice(0, 5).map((a) => ({
                    name: a.product ?? 'Unknown',
                    stock: parseInt(a.qty, 10) || 0,
                    unit: 'units',
                }));
            }

            let cCount = 0;
            if (consumRes.status === 'fulfilled') {
                cCount = consumRes.value?.totalProducts ?? 0;
            }

            let eCount = 0;
            if (equipRes.status === 'fulfilled') {
                eCount = equipRes.value?.totalProducts ?? 0;
            }

            let allTransactions: LedgerRow[] = [];
            if (txRes.status === 'fulfilled') {
                allTransactions = Array.isArray(txRes.value) ? txRes.value : [];
            }

            set({
                totalProducts,
                staffCount,
                nearExpiryCount,
                lowStockCount,
                lowStockItems,
                categoryData: [cCount, eCount],
                allTransactions,
                loading: false,
            });

        } catch (e: unknown) {
            set({ error: e instanceof Error ? e.message : "Failed to fetch dashboard data", loading: false });
        }
    },

    fetchDataForCsvExport: async () => {
        try {
            const [allLedger, allSysLogs] = await Promise.all([
                ledgerApi.getLedgerTransactions(),
                systemActivityApi.getLogs('', 10000)
            ]);
            return { allLedger, allSysLogs };
        } catch (e) {
            console.error("Failed to fetch CSV data", e);
            throw e;
        }
    }
}));
