"use client";
import React, { useEffect, useState } from "react";
import { useStaffPage } from "@/hooks/useStaff";
import { useSystemActivity } from "@/hooks/useSystemActivity";
import { usePermissions } from "@/hooks/usePermissions";
import "./page.css";

export default function StaffPage() {
  const {
    staff,
    offices,
    loading,
    error,
    formError,
    search,
    setSearch,
    filterOffice,
    setFilterOffice,
    showModal,
    showConfirm,
    form,
    setForm,
    openAdd,
    openEdit,
    closeModal,
    saveStaff,
    removeStaff,
    confirmDelete,
    cancelConfirm,
    rolesList,
  } = useStaffPage();

  const { trackPageOpen } = useSystemActivity();
  const { hasPermission, loading: permsLoading } = usePermissions();
  const canManage = hasPermission('staff.manage');

  useEffect(() => {
    trackPageOpen("Staff");
  }, [trackPageOpen]);

  const [width, setWidth] = useState(1200);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = width < 640;

  const getInitials = (first: string, last: string) =>
    `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase();

  return (
    <div className="staff-page">

      {/* ── PAGE HEADER ──────────────────────────── */}
      <div className="staff-header">
        <h1 className="staff-title">Staff &amp; Task Tracking</h1>
        <p className="staff-subtitle">Manage clinic staff and their assigned tasks.</p>
      </div>

      {/* ── ERROR BANNER ─────────────────────────── */}
      {error && !showModal && (
        <div className="staff-error-banner">{error}</div>
      )}

      {/* ── TOOLBAR CARD ──────────────────────────── */}
      <div className="staff-card">
        <div className="staff-toolbar">

          {/* Search */}
          <div className="staff-search-wrap">
            <span className="staff-search-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              className="staff-search"
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Office filter */}
          <select
            className="staff-filter-select"
            value={filterOffice}
            onChange={(e) => setFilterOffice(e.target.value)}
          >
            <option value="">All Offices</option>
            {offices.map((o) => (
              <option key={o.office_id} value={o.office_name}>{o.office_name}</option>
            ))}
          </select>

          {/* Count badge */}
          <span className="staff-count-badge">{staff.length} Staff</span>

          {/* Add button */}
          {!permsLoading && canManage && (
            <button className="staff-btn-primary" onClick={openAdd} disabled={loading}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add New Staff
            </button>
          )}

        </div>
      </div>

      {/* ── STAFF TABLE CARD ──────────────────────── */}
      <div className="staff-card">

        {loading && !showModal ? (
          <div className="staff-empty">
            <div className="staff-empty-text">Loading staff…</div>
          </div>

        ) : !isMobile ? (
          /* Desktop table */
          <div className="staff-table-wrap">
            <table className="staff-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Designation</th>
                  <th>Office</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {staff.map((s) => (
                  <tr key={s.staff_id}>
                    <td>
                      <div className="staff-name-cell">
                        <div className="staff-avatar">
                          {getInitials(s.first_name, s.last_name)}
                        </div>
                        <span className="staff-name-text">
                          {s.first_name} {s.last_name}
                        </span>
                      </div>
                    </td>
                    <td className="staff-td-muted">{s.email}</td>
                    <td className="staff-td-muted">{s.phone || "—"}</td>
                    <td>
                      <span className="staff-designation-pill">{s.designation}</span>
                    </td>
                    <td>{s.office?.office_name || "—"}</td>
                    <td>
                      {!permsLoading && canManage && (
                        <button className="staff-action-edit" onClick={() => openEdit(s)}>
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        ) : (
          /* Mobile cards */
          <div className="staff-mobile-grid">
            {staff.map((s) => (
              <div key={s.staff_id} className="staff-mobile-card">
                <div className="staff-mobile-header">
                  <div className="staff-avatar">{getInitials(s.first_name, s.last_name)}</div>
                  <p className="staff-mobile-name">{s.first_name} {s.last_name}</p>
                </div>
                <div className="staff-mobile-body">
                  <div className="staff-mobile-row"><span>Email</span><span>{s.email}</span></div>
                  <div className="staff-mobile-row"><span>Phone</span><span>{s.phone || "—"}</span></div>
                  <div className="staff-mobile-row"><span>Designation</span><span>{s.designation}</span></div>
                  <div className="staff-mobile-row"><span>Office</span><span>{s.office?.office_name || "—"}</span></div>
                </div>
                <div className="staff-mobile-actions">
                  <button className="staff-btn-secondary" onClick={() => openEdit(s)}>Edit</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {staff.length === 0 && !loading && (
          <div className="staff-empty">
            <div className="staff-empty-icon">👥</div>
            <div className="staff-empty-text">No staff found.</div>
          </div>
        )}
      </div>

      {/* ── ADD / EDIT MODAL ──────────────────────── */}
      {showModal && (
        <div className="staff-modal-bg" onClick={closeModal}>
          <div className="staff-modal" onClick={(e) => e.stopPropagation()}>

            <div className="staff-modal-header">
              <h2 className="staff-modal-title">
                {form.staff_id ? "Edit Staff Member" : "Add New Staff"}
              </h2>
              <button className="staff-modal-close" onClick={closeModal}>✕</button>
            </div>

            {formError && (
              <div className="staff-form-error">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
                  style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {formError}
              </div>
            )}

            <div className="staff-form-grid">
              <div className="staff-field">
                <label className="staff-label">First Name *</label>
                <input className="staff-modal-input" placeholder="e.g. John"
                  value={form.first_name}
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
              </div>
              <div className="staff-field">
                <label className="staff-label">Last Name *</label>
                <input className="staff-modal-input" placeholder="e.g. Smith"
                  value={form.last_name}
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
              </div>
            </div>

            <div className="staff-field">
              <label className="staff-label">Email *</label>
              <input className="staff-modal-input" type="email" placeholder="john@clinic.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>

            <div className="staff-form-grid">
              <div className="staff-field">
                <label className="staff-label">Phone</label>
                <input className="staff-modal-input" placeholder="Optional"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="staff-field">
                <label className="staff-label">Designation *</label>
                <input className="staff-modal-input" placeholder="e.g. Dental Assistant"
                  value={form.designation}
                  onChange={(e) => setForm({ ...form, designation: e.target.value })} />
              </div>
            </div>

            <div className="staff-field">
              <label className="staff-label">Address</label>
              <input className="staff-modal-input" placeholder="Optional"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>

            <div className="staff-field">
              <label className="staff-label">Login Password</label>
              <input className="staff-modal-input" type="password" placeholder="Min 6 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} />
              <p className="text-[10px] text-gray-400 mt-1">Leave empty to keep current or use default (Staff@123)</p>
            </div>

            <div className="staff-form-grid">
              <div className="staff-field">
                <label className="staff-label">Office</label>
                <select className="staff-modal-input"
                  value={form.officeOffice_id}
                  onChange={(e) => setForm({ ...form, officeOffice_id: e.target.value })}>
                  <option value="">Select Office (optional)</option>
                  {offices.map((o) => (
                    <option key={o.office_id} value={o.office_id}>{o.office_name}</option>
                  ))}
                </select>
              </div>

              <div className="staff-field">
                <label className="staff-label">Assign Role</label>
                <select className="staff-modal-input"
                  value={form.role_id}
                  onChange={(e) => setForm({ ...form, role_id: e.target.value })}>
                  <option value="">Select Role</option>
                  {rolesList.map((r) => (
                    <option key={r.role_id} value={r.role_id}>{r.role_name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="staff-modal-actions">
              {form.staff_id && (
                <button className="staff-btn-danger" onClick={removeStaff} disabled={loading}>
                  Delete Staff
                </button>
              )}
              <div className="staff-modal-btn-group">
                <button className="staff-btn-secondary" onClick={closeModal} disabled={loading}>
                  Cancel
                </button>
                <button className="staff-btn-primary" onClick={saveStaff} disabled={loading}>
                  {loading ? "Saving…" : form.staff_id ? "Update Staff" : "Add Staff"}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── CONFIRM DELETE MODAL ──────────────────── */}
      {showConfirm && (
        <div className="staff-modal-bg" onClick={cancelConfirm}>
          <div className="staff-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="staff-confirm-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <h3 className="staff-confirm-title">Delete Staff Member?</h3>
            <p className="staff-confirm-body">
              You are about to permanently delete{" "}
              <strong>{form.first_name} {form.last_name}</strong>.
              This action cannot be undone.
            </p>
            <div className="staff-confirm-actions">
              <button className="staff-btn-secondary" onClick={cancelConfirm}>Cancel</button>
              <button className="staff-btn-delete" onClick={confirmDelete} disabled={loading}>
                {loading ? "Deleting…" : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}