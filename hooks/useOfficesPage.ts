'use client';

/**
 * useOfficesPage.ts
 * ─────────────────
 * Page-level hook for the Offices management page.
 *
 * client_id flow:
 *   useImsUser() → clientId → staffApi.createOffice({ ..., client_id: clientId })
 *
 * Delete flow (no native confirm()):
 *   requestDelete(id, name) → sets deleteTarget (opens custom confirmation modal)
 *   confirmDelete()         → calls API, clears deleteTarget
 *   cancelDelete()          → clears deleteTarget (dismisses modal)
 */

import { useEffect, useMemo, useState } from 'react';
import { useOfficeStore, LightOffice } from '@/store/reducers/officeStore';
import { staffApi } from '@/_api_/apiCallManager';
import { useImsUser } from '@/hooks/useImsUser';
import toast from 'react-hot-toast';

// ─── Types ────────────────────────────────────────────────────────────────────

export type OfficeForm = {
    office_id: string;   // empty string = creating new
    office_name: string;
    address: string;
};

/** Holds the identity of the office pending deletion confirmation */
export type DeleteTarget = {
    id: string;
    name: string;
};

const EMPTY_FORM: OfficeForm = {
    office_id: '',
    office_name: '',
    address: '',
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useOfficesPage = () => {
    // ── Active IMS User (client) ─────────────────────────────────────────────
    const { clientId, loading: loadingUser, error: userError } = useImsUser();

    // ── Offices store ────────────────────────────────────────────────────────
    const {
        offices,
        loading: loadingOffices,
        error: officeError,
        fetchLightOffices,
    } = useOfficeStore();

    // ── UI state ─────────────────────────────────────────────────────────────
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState<OfficeForm>(EMPTY_FORM);
    const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

    // ── Initial fetch ────────────────────────────────────────────────────────
    useEffect(() => {
        fetchLightOffices(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Client-side search filter ─────────────────────────────────────────────
    const filtered = useMemo(() => {
        if (!search.trim()) return offices;
        const q = search.toLowerCase();
        return offices.filter(
            (o) =>
                o.office_name.toLowerCase().includes(q) ||
                o.address.toLowerCase().includes(q),
        );
    }, [offices, search]);

    // ── Modal helpers (create / edit) ─────────────────────────────────────────
    const openAdd = () => {
        setForm(EMPTY_FORM);
        setShowModal(true);
    };

    const openEdit = (office: LightOffice) => {
        setForm({
            office_id: office.office_id,
            office_name: office.office_name,
            address: office.address,
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setForm(EMPTY_FORM);
    };

    // ── Delete confirmation modal helpers ─────────────────────────────────────
    /** Opens the styled in-page delete confirmation modal */
    const requestDelete = (id: string, name: string) => {
        setDeleteTarget({ id, name });
    };

    /** Cancels the pending delete without doing anything */
    const cancelDelete = () => {
        setDeleteTarget(null);
    };

    /** Executes the delete after the user confirms in the custom modal */
    const confirmDelete = async () => {
        if (!deleteTarget) return;

        setSaving(true);
        try {
            await staffApi.deleteOffice(deleteTarget.id);
            await fetchLightOffices(true);
            toast.success(`"${deleteTarget.name}" deleted.`);
            setDeleteTarget(null);
            // Also close the edit modal if it was open for this office
            if (form.office_id === deleteTarget.id) closeModal();
        } catch (err: unknown) {
            const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to delete office.';
            toast.error(message);
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    // ── Save (create or update) ───────────────────────────────────────────────
    const saveOffice = async () => {
        if (!form.office_name.trim()) {
            toast.error('Office name is required.');
            return;
        }
        if (!form.address.trim()) {
            toast.error('Address is required.');
            return;
        }

        setSaving(true);
        try {
            if (form.office_id) {
                // UPDATE — client_id is immutable, never sent on updates
                await staffApi.updateOffice(form.office_id, {
                    office_name: form.office_name.trim(),
                    address: form.address.trim(),
                });
                toast.success('Office updated successfully!');
            } else {
                // CREATE — clientId comes from useImsUser() → GET /ims/clients/me
                if (!clientId) {
                    toast.error('Could not resolve IMS User. Please refresh and try again.');
                    return;
                }
                await staffApi.createOffice({
                    office_name: form.office_name.trim(),
                    address: form.address.trim(),
                    client_id: clientId,
                });
                toast.success('Office created successfully!');
            }

            await fetchLightOffices(true);
            closeModal();
        } catch (err: unknown) {
            const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to save office.';
            toast.error(message);
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    return {
        // Data
        offices: filtered,
        allOffices: offices,
        total: offices.length,

        // Active IMS User
        clientId,
        loadingUser,

        // Status
        loading: loadingOffices,
        saving,
        error: officeError ?? userError ?? null,

        // Search
        search,
        setSearch,

        // Create / Edit modal
        showModal,
        form,
        setForm,
        openAdd,
        openEdit,
        closeModal,

        // Delete confirmation modal
        deleteTarget,
        requestDelete,
        cancelDelete,
        confirmDelete,

        // Save
        saveOffice,
    };
};
