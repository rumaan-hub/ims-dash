/**
 * officeStore.ts
 * ──────────────
 * Lightweight Zustand store for office data.
 * Mirrors the lightProducts pattern — minimal fields, local cache, O(1) map.
 *
 * LightOffice shape: { office_id, office_name, address, client_id }
 * No nested user/company objects stored here.
 * Heavy detail is fetched on-demand (lazy) by a separate call when needed.
 */

import { create } from 'zustand';
import { staffApi } from '@/_api_/apiCallManager';

// ─── Types ────────────────────────────────────────────────────────────────────

export type LightOffice = {
    office_id: string;
    office_name: string;
    address: string;
    client_id: string;
};

type OfficeState = {
    // ── Data ──────────────────────────────────────────────────────────────────
    /** Ordered array — use for dropdowns, lists, transfer route selectors */
    offices: LightOffice[];

    /** Keyed by office_id — use for instant O(1) lookups (e.g. resolving a route) */
    officeMap: Record<string, LightOffice>;

    total: number;

    // ── Status ────────────────────────────────────────────────────────────────
    loading: boolean;
    error: string | null;

    /** Timestamp of last successful fetch — used to avoid redundant API calls */
    lastFetched: number | null;

    // ── Actions ───────────────────────────────────────────────────────────────
    /**
     * Fetch light offices from the server.
     * @param force  - Set true to bypass the local cache and always refetch.
     * @param search - Optional search string to filter by name/address.
     */
    fetchLightOffices: (force?: boolean, search?: string) => Promise<void>;

    /** Clear the store (e.g. on logout) */
    reset: () => void;
};

// ─── Cache TTL (5 minutes) ────────────────────────────────────────────────────
const CACHE_TTL_MS = 5 * 60 * 1000;

// ─── Store ────────────────────────────────────────────────────────────────────
export const useOfficeStore = create<OfficeState>((set, get) => ({
    offices: [],
    officeMap: {},
    total: 0,
    loading: false,
    error: null,
    lastFetched: null,

    fetchLightOffices: async (force = false, search = '') => {
        const { lastFetched, loading } = get();

        // ── Cache check ───────────────────────────────────────────────────────
        // Skip fetch if data is fresh (<5 min) and no force flag and no active search
        const isCacheFresh =
            !force &&
            !search &&
            lastFetched !== null &&
            Date.now() - lastFetched < CACHE_TTL_MS;

        if (isCacheFresh || loading) return;

        set({ loading: true, error: null });

        try {
            const res = await staffApi.getLightOffices(search);

            set({
                offices: res.data ?? [],
                officeMap: res.officeMap ?? {},
                total: res.total ?? 0,
                lastFetched: Date.now(),
            });
        } catch (err: unknown) {
            set({ error: err instanceof Error ? err.message : 'Failed to fetch offices' });
        } finally {
            set({ loading: false });
        }
    },

    reset: () =>
        set({
            offices: [],
            officeMap: {},
            total: 0,
            loading: false,
            error: null,
            lastFetched: null,
        }),
}));

// ─── Convenience selector helpers ─────────────────────────────────────────────

/** Get an office name by id — returns '' if not found */
export const getOfficeName = (
    officeMap: Record<string, LightOffice>,
    id: string,
): string => officeMap[id]?.office_name ?? '';

/** Get full LightOffice by id — returns undefined if not found */
export const getOfficeById = (
    officeMap: Record<string, LightOffice>,
    id: string,
): LightOffice | undefined => officeMap[id];
