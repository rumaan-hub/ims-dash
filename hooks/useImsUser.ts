'use client';

/**
 * useImsUser.ts
 * ─────────────
 * Provides the currently active IMS User (client) to any component that needs it.
 *
 * ── NOW ──────────────────────────────────────────────────────────────────────
 * Fetches GET /ims/clients/me → returns the first ImsUser in the DB.
 * Safe while only one IMS User exists.
 *
 * ── WHEN AUTH IS CONNECTED ───────────────────────────────────────────────────
 * The backend /me route will be protected by JwtAuthGuard and will return the
 * authenticated user's profile. ZERO changes needed here or in any consumer —
 * the hook already reads from /me, so it will automatically return the right user.
 *
 * ── USAGE IN COMPONENTS ──────────────────────────────────────────────────────
 *   const { clientId, client, loading } = useImsUser();
 *   // clientId → string | null  (null while loading or on error)
 *   // client   → full ImsUser object
 */

import { useEffect, useState } from 'react';
import { apiCallManager } from '@/_api_/apiCallManager';

// ─── Type ─────────────────────────────────────────────────────────────────────

export type ImsUser = {
    client_id: string;
    company_name: string;
    first_name: string;
    last_name: string;
    email: string;
    ims_role?: string;
    contact_number?: string;
    permanent_address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    agree_to_terms: boolean;
    created_at?: string;
};

// ─── Singleton cache (module-level, shared across all hook instances) ─────────
// Prevents duplicate /me calls when multiple components mount simultaneously.
let _cachedClient: ImsUser | null = null;
let _fetchPromise: Promise<ImsUser> | null = null;

const fetchCurrentClient = (): Promise<ImsUser> => {
    if (_cachedClient) return Promise.resolve(_cachedClient);
    if (_fetchPromise) return _fetchPromise;

    _fetchPromise = apiCallManager.getMe().then((res: ImsUser | { data: ImsUser }) => {
        // Handle { data: ... } structure from NestJS controller
        const data = ('data' in res ? res.data : res) as ImsUser;
        _cachedClient = data;
        _fetchPromise = null;
        return data;
    });

    return _fetchPromise || Promise.reject('No fetch in progress');
};

/** Call this on logout to clear the cached identity */
export const clearImsUserCache = () => {
    _cachedClient = null;
    _fetchPromise = null;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useImsUser = () => {
    const [client, setClient] = useState<ImsUser | null>(_cachedClient);
    const [loading, setLoading] = useState<boolean>(!_cachedClient);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Initial state already reflects _cachedClient via useState(_cachedClient).
        // If cache is already populated, nothing to do here.
        if (_cachedClient) {
            return;
        }

        let cancelled = false;

        fetchCurrentClient()
            .then((data) => {
                if (!cancelled) {
                    setClient(data);
                    setError(null);
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    setError(err?.response?.data?.message ?? 'Failed to load IMS User.');
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => { cancelled = true; };
    }, []);

    return {
        /** The full ImsUser object — null while loading */
        client,

        /** Convenience shortcut to the client's PK — used when creating offices, staff, etc. */
        clientId: client?.client_id ?? null,

        /** True on first load only */
        loading,

        /** Non-null if the /me call failed */
        error,
    };
};
