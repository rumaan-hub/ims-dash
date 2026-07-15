'use client';

/**
 * app/offices/page.tsx
 * ────────────────────
 * Offices management page.
 *
 * Pattern: mirrors Staff page (useStaffPage + useStaffStore).
 * Data:    lightweight — only office_id, office_name, address, client_id.
 * CRUD:    create, edit/update, delete — all via styled in-page modals.
 */

import React, { useEffect } from 'react';
import { useOfficesPage } from '@/hooks/useOfficesPage';
import { useSystemActivity } from "@/hooks/useSystemActivity";
import './page.css';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns the first two uppercase initials of the office name */
const getInitials = (name: string): string => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function OfficesPage() {
    const {
        offices,
        total,
        loading,
        saving,
        error,
        search,
        setSearch,
        showModal,
        form,
        setForm,
        openAdd,
        openEdit,
        closeModal,
        saveOffice,
        // Delete confirmation
        deleteTarget,
        requestDelete,
        cancelDelete,
        confirmDelete,
    } = useOfficesPage();

    const { trackPageOpen } = useSystemActivity();

    useEffect(() => {
        trackPageOpen("Offices");
    }, [trackPageOpen]);

    const isEditing = Boolean(form.office_id);

    return (
        <div className="offices-page">

            {/* ── Page header ──────────────────────────────────────────── */}
            <div className="offices-header">
                <h1 className="offices-title">
                    Offices
                    <span className="offices-count-badge">{total}</span>
                </h1>
                <p className="offices-subtitle">
                    Manage clinic locations. Each office can be assigned staff and used as a transfer route.
                </p>
            </div>

            {/* ── Error banner ─────────────────────────────────────────── */}
            {error && (
                <div className="offices-error-banner">
                    {error}
                </div>
            )}

            {/* ── Toolbar: search + add button ─────────────────────────── */}
            <div className="offices-card">
                <div className="offices-toolbar">
                    <div className="offices-search-wrap">
                        <span className="offices-search-icon">🔍</span>
                        <input
                            id="officeSearch"
                            type="text"
                            className="offices-search"
                            placeholder="Search by name or address…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            autoComplete="off"
                        />
                    </div>

                    <button
                        id="addOfficeBtn"
                        className="offices-btn offices-btn-primary"
                        onClick={openAdd}
                        disabled={loading}
                    >
                        <span>＋</span> Add Office
                    </button>
                </div>
            </div>

            {/* ── Offices list ─────────────────────────────────────────── */}
            <div className="offices-card">
                {loading ? (
                    <div className="offices-loading">Loading offices…</div>

                ) : offices.length === 0 ? (
                    <div className="offices-empty">
                        <div className="offices-empty-icon">🏢</div>
                        <p>
                            {search
                                ? `No offices match "${search}"`
                                : 'No offices yet. Click "Add Office" to create one.'}
                        </p>
                    </div>

                ) : (
                    <div className="offices-list-container">
                        {/* Desktop Table View */}
                        <div className="offices-table-wrap desktop-only">
                            <table className="offices-table">
                                <thead>
                                    <tr>
                                        <th>Office</th>
                                        <th>Address</th>
                                        <th style={{ textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {offices.map((office) => (
                                        <tr key={office.office_id}>
                                            <td>
                                                <div className="office-name-cell">
                                                    <div className="office-avatar">
                                                        {getInitials(office.office_name)}
                                                    </div>
                                                    <span className="office-name-text">
                                                        {office.office_name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="office-address">
                                                    {office.address || '—'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="offices-row-actions">
                                                    <button
                                                        className="offices-action-btn offices-action-edit"
                                                        onClick={() => openEdit(office)}
                                                        aria-label={`Edit ${office.office_name}`}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        className="offices-action-btn offices-action-delete"
                                                        onClick={() => requestDelete(office.office_id, office.office_name)}
                                                        aria-label={`Delete ${office.office_name}`}
                                                        disabled={saving}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="offices-mobile-grid mobile-only">
                            {offices.map((office) => (
                                <div key={office.office_id} className="office-mobile-card">
                                    <div className="office-mobile-header">
                                        <div className="office-avatar">
                                            {getInitials(office.office_name)}
                                        </div>
                                        <div className="office-mobile-info">
                                            <h3>{office.office_name}</h3>
                                            <span className="office-mobile-address">{office.address}</span>
                                        </div>
                                    </div>
                                    <div className="office-mobile-actions">
                                        <button
                                            className="offices-btn offices-btn-secondary"
                                            onClick={() => openEdit(office)}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className="offices-btn offices-btn-danger"
                                            onClick={() => requestDelete(office.office_id, office.office_name)}
                                            disabled={saving}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Create / Edit Modal ───────────────────────────────────── */}
            {showModal && (
                <div className="offices-modal-bg" onClick={closeModal}>
                    <div className="offices-modal" onClick={(e) => e.stopPropagation()}>

                        {/* Header */}
                        <div className="offices-modal-header">
                            <h2 className="offices-modal-title">
                                {isEditing ? 'Edit Office' : 'Add New Office'}
                            </h2>
                            <button
                                className="offices-modal-close"
                                onClick={closeModal}
                                aria-label="Close modal"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Office Name */}
                        <div className="offices-field">
                            <label className="offices-label" htmlFor="modal-office-name">
                                Office Name <span>*</span>
                            </label>
                            <input
                                id="modal-office-name"
                                className="offices-input"
                                placeholder="e.g. Main Downtown Office"
                                value={form.office_name}
                                onChange={(e) => setForm({ ...form, office_name: e.target.value })}
                                disabled={saving}
                                autoFocus
                            />
                        </div>

                        {/* Address */}
                        <div className="offices-field">
                            <label className="offices-label" htmlFor="modal-office-address">
                                Address <span>*</span>
                            </label>
                            <input
                                id="modal-office-address"
                                className="offices-input"
                                placeholder="e.g. 123 Main St, New York, NY"
                                value={form.address}
                                onChange={(e) => setForm({ ...form, address: e.target.value })}
                                disabled={saving}
                            />
                        </div>

                        {/* Actions */}
                        <div className="offices-modal-actions">
                            {/* Delete — only when editing */}
                            {isEditing && (
                                <button
                                    className="offices-btn offices-btn-danger"
                                    onClick={() => requestDelete(form.office_id, form.office_name)}
                                    disabled={saving}
                                >
                                    Delete Office
                                </button>
                            )}

                            <button
                                className="offices-btn offices-btn-secondary"
                                onClick={closeModal}
                                disabled={saving}
                            >
                                Cancel
                            </button>

                            <button
                                id="saveOfficeBtn"
                                className="offices-btn offices-btn-primary"
                                onClick={saveOffice}
                                disabled={saving}
                            >
                                {saving
                                    ? (isEditing ? 'Updating…' : 'Creating…')
                                    : (isEditing ? 'Update Office' : 'Create Office')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete Confirmation Modal ─────────────────────────────── */}
            {deleteTarget && (
                <div className="offices-modal-bg" onClick={cancelDelete}>
                    <div className="offices-confirm-modal" onClick={(e) => e.stopPropagation()}>

                        {/* Icon */}
                        <div className="offices-confirm-icon">🗑️</div>

                        {/* Text */}
                        <h2 className="offices-confirm-title">Delete Office?</h2>
                        <p className="offices-confirm-body">
                            You are about to permanently delete{' '}
                            <strong>&ldquo;{deleteTarget.name}&rdquo;</strong>.
                            <br />
                            This action <strong>cannot be undone</strong>.
                        </p>

                        {/* Actions */}
                        <div className="offices-confirm-actions">
                            <button
                                className="offices-btn offices-btn-secondary"
                                onClick={cancelDelete}
                                disabled={saving}
                            >
                                Cancel
                            </button>
                            <button
                                id="confirmDeleteOfficeBtn"
                                className="offices-btn offices-btn-danger"
                                onClick={confirmDelete}
                                disabled={saving}
                            >
                                {saving ? 'Deleting…' : 'Yes, Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
