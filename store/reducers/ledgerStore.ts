import { create } from "zustand";
import { ledgerApi } from "@/_api_/apiCallManager";

// ── Types ──────────────────────────────────────────────────────────────────
export interface LedgerRow {
    id: string;
    date: string;
    product: string;
    batch: string;
    type: string;
    qty: string;
    price: string;
    balance: string;
    office: string;
    user: string;
    remarks: string;
}

export interface LowStockItem {
    product: string;
    batch: string;
    office: string;
    qty: string;
    threshold: string;
    status: string;
}

export interface NearExpiryItem {
    product: string;
    batch: string;
    expiry: string;
    daysLeft: number;
    office: string;
    status: string;
}

// ── Store state & actions ──────────────────────────────────────────────────
interface LedgerState {
    transactions: LedgerRow[];
    lowStock: LowStockItem[];
    nearExpiry: NearExpiryItem[];
    loading: boolean;
    error: string | null;

    fetchTransactions: (params?: {
        officeId?: string;
        type?: string;
        dateFrom?: string;
        dateTo?: string;
    }) => Promise<void>;

    fetchLowStock: () => Promise<void>;
    fetchNearExpiry: (days?: number) => Promise<void>;

    /** Convenience: refresh all three slices at once */
    fetchAll: () => Promise<void>;
}

export const useLedgerStore = create<LedgerState>((set) => ({
    transactions: [],
    lowStock: [],
    nearExpiry: [],
    loading: false,
    error: null,

    fetchTransactions: async (params) => {
        set({ loading: true, error: null });
        try {
            const data = await ledgerApi.getLedgerTransactions(params);
            set({ transactions: data, loading: false });
        } catch (e: unknown) {
            set({ error: e instanceof Error ? e.message : "Failed to load transactions", loading: false });
        }
    },

    fetchLowStock: async () => {
        try {
            const data = await ledgerApi.getLowStockAlerts();
            set({ lowStock: data });
        } catch { /* silently fail — page shows previous data */ }
    },

    fetchNearExpiry: async (days = 60) => {
        try {
            const data = await ledgerApi.getNearExpiryAlerts(days);
            set({ nearExpiry: data });
        } catch { /* silently fail */ }
    },

    fetchAll: async () => {
        set({ loading: true, error: null });
        try {
            const [transactions, lowStock, nearExpiry] = await Promise.all([
                ledgerApi.getLedgerTransactions(),
                ledgerApi.getLowStockAlerts(),
                ledgerApi.getNearExpiryAlerts(60),
            ]);
            set({ transactions, lowStock, nearExpiry, loading: false });
        } catch (e: unknown) {
            set({ error: e instanceof Error ? e.message : "Failed to load ledger data", loading: false });
        }
    },
}));
