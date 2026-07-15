"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import toast, { Toaster } from "react-hot-toast";
import {
    UserCircleIcon,
    LockClosedIcon,
    EnvelopeIcon,
    PhoneIcon,
    BuildingOfficeIcon,
    MapPinIcon,
    EyeIcon,
    EyeSlashIcon,
    ShieldCheckIcon,
    KeyIcon,
} from "@heroicons/react/24/outline";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3003";

interface Profile {
    client_id: string;
    first_name: string;
    last_name: string;
    email: string;
    company_name: string;
    contact_number: string | null;
    permanent_address: string | null;
    city: string | null;
    state: string | null;
    zip_code: string | null;
    is_system_admin: boolean;
}

export default function SettingsPage() {
    const [mounted, setMounted] = useState(false);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form fields
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [contactNumber, setContactNumber] = useState("");
    const [address, setAddress] = useState("");
    const [city, setCity] = useState("");
    const [state, setState] = useState("");
    const [zipCode, setZipCode] = useState("");

    // Password modal
    const [pwModalOpen, setPwModalOpen] = useState(false);
    const [currentPw, setCurrentPw] = useState("");
    const [newPw, setNewPw] = useState("");
    const [confirmPw, setConfirmPw] = useState("");
    const [pwSaving, setPwSaving] = useState(false);
    const [showCurrentPw, setShowCurrentPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);
    const [showConfirmPw, setShowConfirmPw] = useState(false);

    // Reset password
    const [resetSending, setResetSending] = useState(false);

    useEffect(() => setMounted(true), []);

    const getToken = () =>
        localStorage.getItem("accessToken");

    const authHeaders = () => ({
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
    });

    // Fetch profile
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch(`${API_BASE}/ims/auth/me`, { headers: authHeaders() });
                if (!res.ok) throw new Error("Failed to load profile");
                const data = await res.json();
                const p = data.data || data;
                setProfile(p);
                setFirstName(p.first_name || "");
                setLastName(p.last_name || "");
                setEmail(p.email || "");
                setCompanyName(p.company_name || "");
                setContactNumber(p.contact_number || "");
                setAddress(p.permanent_address || "");
                setCity(p.city || "");
                setState(p.state || "");
                setZipCode(p.zip_code || "");
            } catch {
                toast.error("Failed to load profile");
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Save personal info
    const handleSaveProfile = async () => {
        if (!firstName.trim() || !lastName.trim() || !email.trim() || !companyName.trim()) {
            toast.error("Please fill all required fields");
            return;
        }
        setSaving(true);
        try {
            const res = await fetch(`${API_BASE}/ims/clients/${profile?.client_id}`, {
                method: "PATCH",
                headers: authHeaders(),
                body: JSON.stringify({
                    first_name: firstName.trim(),
                    last_name: lastName.trim(),
                    email: email.trim(),
                    company_name: companyName.trim(),
                    contact_number: contactNumber.trim() || null,
                    permanent_address: address.trim() || null,
                    city: city.trim() || null,
                    state: state.trim() || null,
                    zip_code: zipCode.trim() || null,
                }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || "Failed to update");
            }
            toast.success("Profile updated successfully");
            // Refresh profile
            const updated = await fetch(`${API_BASE}/ims/auth/me`, { headers: authHeaders() });
            if (updated.ok) {
                const d = await updated.json();
                setProfile(d.data || d);
            }
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : "Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    // Change password
    const handleChangePassword = async () => {
        if (!currentPw || !newPw || !confirmPw) {
            toast.error("All fields are required");
            return;
        }
        if (newPw !== confirmPw) {
            toast.error("New passwords do not match");
            return;
        }
        if (newPw.length < 8) {
            toast.error("Password must be at least 8 characters");
            return;
        }
        setPwSaving(true);
        try {
            const res = await fetch(`${API_BASE}/ims/auth/change-password`, {
                method: "POST",
                headers: authHeaders(),
                body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || "Failed to change password");
            }
            toast.success("Password changed successfully");
            setPwModalOpen(false);
            setCurrentPw("");
            setNewPw("");
            setConfirmPw("");
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : "Failed to change password");
        } finally {
            setPwSaving(false);
        }
    };

    // Reset password email
    const handleResetPassword = async () => {
        if (!email) return;
        setResetSending(true);
        try {
            const res = await fetch(`${API_BASE}/ims/auth/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            if (!res.ok) throw new Error("Failed to send reset email");
            toast.success("Password reset email sent");
        } catch {
            toast.error("Failed to send reset email");
        } finally {
            setResetSending(false);
        }
    };

    // ─── Styles ───
    const cardStyle: React.CSSProperties = {
        background: '#fff', borderRadius: '16px', border: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    };
    const inputStyle: React.CSSProperties = {
        width: '100%', padding: '10px 14px', border: '1px solid #e5e7eb',
        borderRadius: '8px', fontSize: '14px', color: '#111827', outline: 'none',
        boxSizing: 'border-box', transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        fontFamily: 'inherit',
    };
    const labelStyle: React.CSSProperties = {
        display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px',
    };
    const btnPrimary: React.CSSProperties = {
        background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px',
        padding: '10px 24px', fontWeight: 600, fontSize: '14px', cursor: 'pointer',
        transition: 'all 0.2s ease', fontFamily: 'inherit',
    };
    const btnOutline: React.CSSProperties = {
        background: '#fff', color: '#2563eb', border: '1px solid #2563eb', borderRadius: '8px',
        padding: '10px 24px', fontWeight: 600, fontSize: '14px', cursor: 'pointer',
        transition: 'all 0.2s ease', fontFamily: 'inherit',
    };

    if (loading) {
        return (
            <div style={{ background: '#f1f5f9', minHeight: '100%', padding: '24px' }}>
                <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                    <div style={{ height: '32px', width: '200px', background: '#e5e7eb', borderRadius: '8px', marginBottom: '8px' }} />
                    <div style={{ height: '20px', width: '280px', background: '#e5e7eb', borderRadius: '6px', marginBottom: '32px' }} />
                    <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                        <div style={{ ...cardStyle, width: '300px', height: '360px', padding: '32px' }} />
                        <div style={{ flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div style={{ ...cardStyle, height: '320px', padding: '28px' }} />
                            <div style={{ ...cardStyle, height: '180px', padding: '28px' }} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const initials = `${(profile?.first_name || "S")[0]}${(profile?.last_name || "A")[0]}`.toUpperCase();

    return (
        <div style={{ background: '#f1f5f9', minHeight: '100%' }}>
            <Toaster position="top-right" />
            <style>{`
                @keyframes sa-slideLeft { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
                @keyframes sa-slideRight { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
                @keyframes sa-fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
                .sa-settings-left { animation: sa-slideLeft 0.4s ease both; }
                .sa-settings-right-1 { animation: sa-slideRight 0.4s ease both; animation-delay: 100ms; }
                .sa-settings-right-2 { animation: sa-slideRight 0.4s ease both; animation-delay: 200ms; }
                .sa-settings-input:focus {
                    border-color: #2563eb !important;
                    box-shadow: 0 0 0 3px rgba(37,99,235,0.1) !important;
                }
                .sa-settings-grid {
                    display: grid; gap: 24px;
                    grid-template-columns: 1fr;
                }
                @media (min-width: 1024px) {
                    .sa-settings-grid { grid-template-columns: 320px 1fr; }
                }
                .sa-form-grid {
                    display: grid; gap: 16px;
                    grid-template-columns: 1fr;
                }
                @media (min-width: 640px) {
                    .sa-form-grid { grid-template-columns: 1fr 1fr; }
                }
                .sa-form-full { grid-column: 1 / -1; }
                .sa-form-three {
                    display: grid; gap: 16px;
                    grid-template-columns: 1fr;
                }
                @media (min-width: 640px) {
                    .sa-form-three { grid-template-columns: 1fr 1fr 1fr; }
                }
                @media (prefers-reduced-motion: reduce) {
                    .sa-settings-left, .sa-settings-right-1, .sa-settings-right-2 {
                        animation: none !important;
                    }
                }
            `}</style>

            <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '12px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>
                    Account Settings
                </h1>
                <p style={{ fontSize: '14px', color: '#6b7280', marginTop: 0, marginBottom: '24px' }}>
                    Manage your profile and security
                </p>

                <div className="sa-settings-grid">
                    {/* ════════════ LEFT: Profile Card ════════════ */}
                    <div className="sa-settings-left" style={{ ...cardStyle, padding: '32px 24px', textAlign: 'center' }}>
                        {/* Avatar */}
                        <div style={{
                            width: '80px', height: '80px', borderRadius: '50%',
                            background: '#2563eb', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', margin: '0 auto',
                            color: '#fff', fontSize: '28px', fontWeight: 700,
                        }}>
                            {initials}
                        </div>
                        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', marginTop: '16px', marginBottom: '4px' }}>
                            {profile?.first_name} {profile?.last_name}
                        </h2>
                        <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>System Admin</p>
                        <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>{profile?.email}</p>

                        {/* Divider */}
                        <div style={{ height: '1px', background: '#f3f4f6', margin: '20px 0' }} />

                        {/* Info rows */}
                        <div style={{ textAlign: 'left' }}>
                            {[
                                { icon: <BuildingOfficeIcon style={{ width: '16px', height: '16px', color: '#6b7280' }} />, label: 'Company', value: profile?.company_name || '—' },
                                { icon: <PhoneIcon style={{ width: '16px', height: '16px', color: '#6b7280' }} />, label: 'Phone', value: profile?.contact_number || '—' },
                                { icon: <MapPinIcon style={{ width: '16px', height: '16px', color: '#6b7280' }} />, label: 'City', value: profile?.city || '—' },
                            ].map((row, i) => (
                                <div key={i} style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    padding: '8px 0', fontSize: '14px',
                                }}>
                                    {row.icon}
                                    <span style={{ color: '#6b7280', minWidth: '70px' }}>{row.label}</span>
                                    <span style={{ color: '#111827', fontWeight: 500 }}>{row.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ════════════ RIGHT: Form Cards ════════════ */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                        {/* ── Personal Information ── */}
                        <div className="sa-settings-right-1" style={{ ...cardStyle, padding: '28px' }}>
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '10px',
                                paddingBottom: '16px', marginBottom: '24px', borderBottom: '1px solid #f3f4f6',
                            }}>
                                <UserCircleIcon style={{ width: '22px', height: '22px', color: '#2563eb' }} />
                                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: 0 }}>Personal Information</h3>
                            </div>

                            <div className="sa-form-grid">
                                <div>
                                    <label style={labelStyle}>First Name *</label>
                                    <input className="sa-settings-input" style={inputStyle} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Last Name *</label>
                                    <input className="sa-settings-input" style={inputStyle} value={lastName} onChange={(e) => setLastName(e.target.value)} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Email *</label>
                                    <input className="sa-settings-input" style={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Company Name *</label>
                                    <input className="sa-settings-input" style={inputStyle} value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Contact Number</label>
                                    <input className="sa-settings-input" style={inputStyle} value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} />
                                </div>
                                <div className="sa-form-full">
                                    <label style={labelStyle}>Permanent Address</label>
                                    <input className="sa-settings-input" style={inputStyle} value={address} onChange={(e) => setAddress(e.target.value)} />
                                </div>
                            </div>

                            <div className="sa-form-three" style={{ marginTop: '16px' }}>
                                <div>
                                    <label style={labelStyle}>City</label>
                                    <input className="sa-settings-input" style={inputStyle} value={city} onChange={(e) => setCity(e.target.value)} />
                                </div>
                                <div>
                                    <label style={labelStyle}>State</label>
                                    <input className="sa-settings-input" style={inputStyle} value={state} onChange={(e) => setState(e.target.value)} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Zip Code</label>
                                    <input className="sa-settings-input" style={inputStyle} value={zipCode} onChange={(e) => setZipCode(e.target.value)} />
                                </div>
                            </div>

                            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                                <button
                                    onClick={handleSaveProfile}
                                    disabled={saving}
                                    style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }}
                                    onMouseEnter={(e) => { if (!saving) { e.currentTarget.style.background = '#1d4ed8'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = '#2563eb'; e.currentTarget.style.transform = 'translateY(0)'; }}
                                >
                                    {saving ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </div>

                        {/* ── Security Settings ── */}
                        <div className="sa-settings-right-2" style={{ ...cardStyle, padding: '28px' }}>
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '10px',
                                paddingBottom: '16px', marginBottom: '24px', borderBottom: '1px solid #f3f4f6',
                            }}>
                                <ShieldCheckIcon style={{ width: '22px', height: '22px', color: '#2563eb' }} />
                                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: 0 }}>Security Settings</h3>
                            </div>

                            {/* Change Password */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                                <div>
                                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: 0 }}>Change Password</p>
                                    <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0' }}>Update your password regularly for security</p>
                                </div>
                                <button
                                    onClick={() => setPwModalOpen(true)}
                                    style={btnOutline}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.transform = 'translateY(0)'; }}
                                >
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <KeyIcon style={{ width: '16px', height: '16px' }} />
                                        Change Password
                                    </span>
                                </button>
                            </div>

                            {/* Divider */}
                            <div style={{ height: '1px', background: '#f3f4f6', margin: '20px 0' }} />

                            {/* Reset Password */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                                <div>
                                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: 0 }}>Reset Password</p>
                                    <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0' }}>Send a password reset link to your email</p>
                                </div>
                                <button
                                    onClick={handleResetPassword}
                                    disabled={resetSending}
                                    style={{ ...btnOutline, color: '#374151', borderColor: '#d1d5db', opacity: resetSending ? 0.7 : 1 }}
                                    onMouseEnter={(e) => { if (!resetSending) { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.transform = 'translateY(0)'; }}
                                >
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <EnvelopeIcon style={{ width: '16px', height: '16px' }} />
                                        {resetSending ? "Sending..." : "Reset Password"}
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ════════════ CHANGE PASSWORD MODAL ════════════ */}
            {mounted && pwModalOpen && createPortal(
                <div
                    style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        width: '100vw', height: '100vh', zIndex: 9999,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)',
                        padding: '16px', boxSizing: 'border-box',
                    }}
                    onMouseDown={(e) => { if (e.target === e.currentTarget) { setPwModalOpen(false); setCurrentPw(""); setNewPw(""); setConfirmPw(""); } }}
                >
                    <div style={{
                        background: '#fff', borderRadius: '12px',
                        width: 'min(90vw, 440px)', maxHeight: '90vh', overflowY: 'auto',
                        padding: '28px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
                        animation: 'sa-fadeUp 0.2s ease',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                            <LockClosedIcon style={{ width: '22px', height: '22px', color: '#2563eb' }} />
                            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: 0 }}>Change Password</h3>
                        </div>

                        {/* Current Password */}
                        <div style={{ marginBottom: '16px' }}>
                            <label style={labelStyle}>Current Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    className="sa-settings-input"
                                    type={showCurrentPw ? "text" : "password"}
                                    style={{ ...inputStyle, paddingRight: '40px' }}
                                    value={currentPw}
                                    onChange={(e) => setCurrentPw(e.target.value)}
                                    placeholder="Enter current password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: '2px' }}
                                >
                                    {showCurrentPw ? <EyeSlashIcon style={{ width: '18px', height: '18px' }} /> : <EyeIcon style={{ width: '18px', height: '18px' }} />}
                                </button>
                            </div>
                        </div>

                        {/* New Password */}
                        <div style={{ marginBottom: '16px' }}>
                            <label style={labelStyle}>New Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    className="sa-settings-input"
                                    type={showNewPw ? "text" : "password"}
                                    style={{ ...inputStyle, paddingRight: '40px' }}
                                    value={newPw}
                                    onChange={(e) => setNewPw(e.target.value)}
                                    placeholder="Min 8 characters"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPw(!showNewPw)}
                                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: '2px' }}
                                >
                                    {showNewPw ? <EyeSlashIcon style={{ width: '18px', height: '18px' }} /> : <EyeIcon style={{ width: '18px', height: '18px' }} />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div style={{ marginBottom: '24px' }}>
                            <label style={labelStyle}>Confirm New Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    className="sa-settings-input"
                                    type={showConfirmPw ? "text" : "password"}
                                    style={{ ...inputStyle, paddingRight: '40px' }}
                                    value={confirmPw}
                                    onChange={(e) => setConfirmPw(e.target.value)}
                                    placeholder="Re-enter new password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPw(!showConfirmPw)}
                                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: '2px' }}
                                >
                                    {showConfirmPw ? <EyeSlashIcon style={{ width: '18px', height: '18px' }} /> : <EyeIcon style={{ width: '18px', height: '18px' }} />}
                                </button>
                            </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => { setPwModalOpen(false); setCurrentPw(""); setNewPw(""); setConfirmPw(""); }}
                                style={{ ...btnOutline, color: '#374151', borderColor: '#d1d5db' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleChangePassword}
                                disabled={pwSaving}
                                style={{ ...btnPrimary, opacity: pwSaving ? 0.7 : 1 }}
                            >
                                {pwSaving ? "Saving..." : "Update Password"}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
