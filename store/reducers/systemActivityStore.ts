import { create } from "zustand";
import { systemActivityApi } from "@/_api_/apiCallManager";

export interface SystemActivityLog {
    id?: string;
    action: string;
    product?: string;
    office?: string;
    user?: string;
    client_id?: string;
    created_at?: string;
    [key: string]: unknown;
}

interface SystemActivityState {
    logs: SystemActivityLog[];
    loadingLogs: boolean;
    errorLogs: string | null;

    fetchLogs: (clientId?: string, limit?: number) => Promise<void>;
    logActivity: (data: {
        action: string;
        product?: string;
        office?: string;
        user?: string;
        client_id?: string;
    }) => Promise<void>;
}

let lastActionInfo = { action: "", time: 0 };

export const useSystemActivityStore = create<SystemActivityState>((set) => ({
    logs: [],
    loadingLogs: false,
    errorLogs: null,

    fetchLogs: async (clientId, limit = 50) => {
        set({ loadingLogs: true, errorLogs: null });
        try {
            const data = await systemActivityApi.getLogs(clientId, limit);
            set({ logs: data, loadingLogs: false });
        } catch (e: unknown) {
            set({ logs: [], loadingLogs: false, errorLogs: e instanceof Error ? e.message : "Failed to load logs" });
        }
    },

    logActivity: async (data) => {
        const now = Date.now();
        if (lastActionInfo.action === data.action && now - lastActionInfo.time < 2000) {
            return; // prevent duplicate log from strict mode within 2 seconds
        }
        lastActionInfo = { action: data.action, time: now };

        try {
            await systemActivityApi.logActivity(data);
        } catch (e) {
            console.error("Failed to log activity", e);
        }
    },
}));
