'use client';

/**
 * useOffices.ts
 * ─────────────
 * Drop-in hook for consuming the lightweight office store.
 * Mirrors the lightProducts pattern used in useTransfer and useQuotationPage.
 *
 * Usage:
 *   const { offices, officeMap, loading } = useOffices();
 *   const name = officeMap[someId]?.office_name ?? '';
 */

import { useEffect } from 'react';
import { useOfficeStore, getOfficeName, getOfficeById, LightOffice } from '@/store/reducers/officeStore';

export const useOffices = (search: string = '') => {
    const {
        offices,
        officeMap,
        total,
        loading,
        error,
        fetchLightOffices,
        reset,
    } = useOfficeStore();

    // Auto-fetch on mount — respects cache, no double-fetch
    useEffect(() => {
        fetchLightOffices(false, search);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    return {
        /** Ordered array — use for <select> options, list rendering, dropdowns */
        offices,

        /** Keyed by office_id — use for instant name/address lookups */
        officeMap,

        /** Total count returned by the server */
        total,

        loading,
        error,

        /** Re-fetch, bypassing cache (e.g. after creating a new office) */
        refetch: (s?: string) => fetchLightOffices(true, s ?? search),

        /** Clear store on logout or unmount if needed */
        reset,

        // ── Inline helpers so consumers don't need to import from officeStore ──

        /** Resolve an office name from its id instantly */
        getOfficeName: (id: string) => getOfficeName(officeMap, id),

        /** Resolve a full LightOffice object from its id instantly */
        getOfficeById: (id: string) => getOfficeById(officeMap, id),
    };
};

export type { LightOffice };
