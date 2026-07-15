"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { clearAuth } from "@/app/utils/auth";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { PlusIcon, PencilSquareIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3003";

interface Plan {
    subscription_plan_id: string;
    plan_name: string;
    price: number;
    duration: number;
    description: string | null;
    is_active: boolean;
    features: string[];
    user_limit: number | null;
    billing_cycle: string;
    annual_discount_percentage: number;
}

export default function SuperAdminPlansPage() {
    const router = useRouter();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Create/Edit modal
    const [modalOpen, setModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
    const [formName, setFormName] = useState("");
    const [formPrice, setFormPrice] = useState<number>(0);
    const [formDuration, setFormDuration] = useState<number>(1);
    const [formCycle, setFormCycle] = useState("monthly");
    const [formUserLimit, setFormUserLimit] = useState("");
    const [formDesc, setFormDesc] = useState("");
    const [formFeatures, setFormFeatures] = useState<string[]>([]);
    const [featureInput, setFeatureInput] = useState("");
    const [formDiscount, setFormDiscount] = useState<number>(0);
    const [saving, setSaving] = useState(false);

    // Delete modal
    const [deletePlanModal, setDeletePlanModal] = useState<{ open: boolean; planId: string; planName: string }>({ open: false, planId: "", planName: "" });
    const [deleting, setDeleting] = useState(false);
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    useBodyScrollLock(modalOpen || deletePlanModal.open);

    const getToken = () => {
        if (typeof window === "undefined") return null;
        return localStorage.getItem("accessToken");
    };

    const authHeaders = () => ({
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
    });

    const handleUnauthorized = (status: number) => {
        if (status === 401) {
            clearAuth();
            router.push("/login");
            return true;
        }
        return false;
    };

    const fetchPlans = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch(`${API_BASE}/ims-subscription/plans`);
            if (!res.ok) throw new Error(`Failed to fetch plans (${res.status})`);
            setPlans(await res.json());
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to load plans");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPlans(); }, []);

    // ─── Open modals ───
    const openCreate = () => {
        setEditingPlan(null);
        setFormName(""); setFormPrice(0); setFormDuration(1); setFormCycle("monthly");
        setFormUserLimit(""); setFormDesc(""); setFormFeatures([]); setFeatureInput("");
        setFormDiscount(0); setModalOpen(true);
    };

    const openEdit = (p: Plan) => {
        setEditingPlan(p);
        setFormName(p.plan_name); setFormPrice(p.price); setFormDuration(p.duration);
        setFormCycle(p.billing_cycle); setFormUserLimit(p.user_limit?.toString() || "");
        setFormDesc(p.description || ""); setFormFeatures([...p.features]); setFeatureInput("");
        setFormDiscount(p.annual_discount_percentage || 0); setModalOpen(true);
    };

    const closeModal = () => { setModalOpen(false); setEditingPlan(null); };

    const addFeature = () => {
        const f = featureInput.trim();
        if (f && !formFeatures.includes(f)) setFormFeatures([...formFeatures, f]);
        setFeatureInput("");
    };

    const handleSave = async () => {
        if (!formName.trim()) { toast.error("Plan name is required"); return; }
        setSaving(true);
        const body: Record<string, unknown> = {
            plan_name: formName.trim(),
            price: formPrice,
            duration: formDuration,
            billing_cycle: formCycle,
            features: formFeatures,
            description: formDesc.trim() || null,
            user_limit: formUserLimit ? parseInt(formUserLimit) : null,
            annual_discount_percentage: formDiscount,
        };
        try {
            const url = editingPlan
                ? `${API_BASE}/ims-subscription/plans/${editingPlan.subscription_plan_id}`
                : `${API_BASE}/ims-subscription/plans`;
            const res = await fetch(url, {
                method: editingPlan ? "PATCH" : "POST",
                headers: authHeaders(),
                body: JSON.stringify(body),
            });
            if (handleUnauthorized(res.status)) return;
            if (!res.ok) throw new Error(`Save failed (${res.status})`);
            toast.success(editingPlan ? "Plan updated!" : "Plan created!");
            closeModal();
            fetchPlans();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Failed to save plan");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deletePlanModal.planId) return;
        setDeleting(true);
        try {
            const res = await fetch(`${API_BASE}/ims-subscription/plans/${deletePlanModal.planId}`, {
                method: "DELETE",
                headers: authHeaders(),
            });
            if (handleUnauthorized(res.status)) return;
            if (!res.ok) throw new Error(`Delete failed (${res.status})`);
            toast.success("Plan deleted!");
            setDeletePlanModal({ open: false, planId: "", planName: "" });
            fetchPlans();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Failed to delete plan");
        } finally {
            setDeleting(false);
        }
    };

    // ─── Shared styles ───
    const modalBackdrop: React.CSSProperties = {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        width: '100vw', height: '100vh',
        zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)',
    };
    const modalBox: React.CSSProperties = {
        position: 'relative',
        background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '520px',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', animation: 'slideUp 0.2s ease-out',
        maxHeight: '90vh', overflowY: 'auto', margin: 'auto',
    };
    const labelStyle: React.CSSProperties = {
        display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px',
    };
    const inputStyle: React.CSSProperties = {
        width: '100%', padding: '10px 12px', border: '1px solid #d1d5db',
        borderRadius: '8px', fontSize: '14px', color: '#111827', outline: 'none', boxSizing: 'border-box',
    };

    return (
        <div>
            <Toaster position="top-right" />
            <style>{`@keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }`}</style>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', margin: 0 }}>Subscription Plans</h1>
                    <p style={{ color: '#6b7280', fontSize: '14px', margin: '4px 0 0' }}>Manage pricing and subscription tiers</p>
                </div>
                <button onClick={openCreate} style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    background: '#16a34a', color: 'white', border: 'none',
                    padding: '10px 16px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.2s ease',
                }}>
                    <PlusIcon className="w-5 h-5" />
                    Create New Plan
                </button>
            </div>

            {error && (
                <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px 20px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>{error}</div>
            )}

            {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                    {[1, 2, 3].map(i => (
                        <div key={i} style={{ background: '#fff', borderRadius: '12px', padding: '24px', border: '1px solid #e5e7eb', height: '240px' }}>
                            <div style={{ background: '#f3f4f6', borderRadius: '8px', height: '20px', width: '60%', marginBottom: '12px', animation: 'pulse 1.5s infinite' }} />
                            <div style={{ background: '#f3f4f6', borderRadius: '8px', height: '28px', width: '40%', marginBottom: '20px' }} />
                            <div style={{ background: '#f3f4f6', borderRadius: '8px', height: '14px', width: '80%', marginBottom: '8px' }} />
                            <div style={{ background: '#f3f4f6', borderRadius: '8px', height: '14px', width: '70%' }} />
                            <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                    {plans.map((plan) => (
                        <div key={plan.subscription_plan_id} style={{
                            background: '#fff', borderRadius: '12px', padding: '24px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb',
                            transition: 'all 0.3s ease',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                <div>
                                    <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: 0 }}>{plan.plan_name}</h3>
                                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#3b82f6', marginTop: '8px' }}>
                                        ${plan.price}<span style={{ fontSize: '14px', fontWeight: 400, color: '#6b7280' }}>/{plan.billing_cycle}</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={() => openEdit(plan)} style={{ background: '#f3f4f6', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', color: '#4b5563' }} title="Edit">
                                        <PencilSquareIcon className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => setDeletePlanModal({ open: true, planId: plan.subscription_plan_id, planName: plan.plan_name })} style={{ background: '#fee2e2', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', color: '#ef4444' }} title="Delete">
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                                <div style={{ background: '#f9fafb', padding: '8px 12px', borderRadius: '8px', flex: 1 }}>
                                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>User Limit</span>
                                    <div style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>{plan.user_limit || 'Unlimited'}</div>
                                </div>
                                <div style={{ background: '#f9fafb', padding: '8px 12px', borderRadius: '8px', flex: 1 }}>
                                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Duration</span>
                                    <div style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>{plan.duration} mo</div>
                                </div>
                            </div>

                            {plan.description && (
                                <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px' }}>{plan.description}</p>
                            )}

                            {plan.features.length > 0 && (
                                <div>
                                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#4b5563', marginBottom: '8px' }}>Features:</p>
                                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                        {plan.features.map((f, i) => (
                                            <li key={i} style={{ fontSize: '14px', color: '#4b5563', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                                <span style={{ color: '#10b981' }}>✓</span> {f}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* ════════════ CREATE / EDIT PLAN MODAL ════════════ */}
            {mounted && modalOpen && createPortal(
                <div className="sa-modal-backdrop" style={modalBackdrop} onMouseDown={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
                    <div className="sa-modal-card" style={modalBox}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #e5e7eb' }}>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#111827' }}>
                                {editingPlan ? "Edit Plan" : "Create New Plan"}
                            </h3>
                            <button onClick={closeModal} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af', padding: '4px' }}>
                                <XMarkIcon style={{ width: '20px', height: '20px' }} />
                            </button>
                        </div>
                        <div style={{ padding: '24px' }}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={labelStyle}>Plan Name *</label>
                                <input value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. Standard" style={inputStyle} />
                            </div>
                            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={labelStyle}>Price ($) *</label>
                                    <input type="number" min={0} value={formPrice} onChange={e => setFormPrice(Number(e.target.value))} style={inputStyle} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={labelStyle}>Duration (months) *</label>
                                    <input type="number" min={1} value={formDuration} onChange={e => setFormDuration(Number(e.target.value))} style={inputStyle} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={labelStyle}>Billing Cycle *</label>
                                    <select value={formCycle} onChange={e => setFormCycle(e.target.value)} style={{ ...inputStyle, background: '#fff' }}>
                                        <option value="monthly">Monthly</option>
                                        <option value="annual">Annual</option>
                                    </select>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={labelStyle}>User Limit</label>
                                    <input type="number" min={1} value={formUserLimit} onChange={e => setFormUserLimit(e.target.value)} placeholder="Unlimited" style={inputStyle} />
                                </div>
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={labelStyle}>Description</label>
                                <textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} rows={2} placeholder="Optional description..." style={{ ...inputStyle, resize: 'vertical' }} />
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={labelStyle}>Annual Discount (%)</label>
                                <input
                                    type="number" min={0} max={100} value={formDiscount}
                                    onChange={e => setFormDiscount(Math.min(100, Math.max(0, Number(e.target.value))))}
                                    placeholder="e.g. 10 for 10% off" style={inputStyle}
                                />
                                <span style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px', display: 'block' }}>
                                    Discount applied when client chooses annual billing
                                </span>
                                {formPrice > 0 && (
                                    <div style={{
                                        marginTop: '8px', padding: '10px 12px', background: '#f0fdf4',
                                        borderRadius: '8px', border: '1px solid #bbf7d0', fontSize: '13px', color: '#166534',
                                    }}>
                                        <div>Monthly: <strong>${formPrice.toFixed(2)}/month</strong></div>
                                        <div>
                                            Annual: <strong>${(formPrice * (1 - formDiscount / 100)).toFixed(2)}/month</strong>
                                            {formDiscount > 0 && <span style={{ color: '#22c55e', marginLeft: '6px' }}>(Save {formDiscount}%)</span>}
                                            <span style={{ color: '#6b7280', marginLeft: '6px' }}>
                                                billed ${(formPrice * 12 * (1 - formDiscount / 100)).toFixed(2)}/year
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div style={{ marginBottom: '24px' }}>
                                <label style={labelStyle}>Features</label>
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                    <input
                                        value={featureInput}
                                        onChange={e => setFeatureInput(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addFeature(); } }}
                                        placeholder="Add a feature..."
                                        style={{ ...inputStyle, flex: 1 }}
                                    />
                                    <button onClick={addFeature} style={{ padding: '10px 16px', border: 'none', borderRadius: '8px', background: '#2563eb', color: '#fff', fontSize: '14px', fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' }}>Add</button>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {formFeatures.map((f, i) => (
                                        <span key={i} style={{
                                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                                            background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '9999px',
                                            padding: '4px 10px', fontSize: '13px', color: '#166534',
                                        }}>
                                            {f}
                                            <button
                                                onClick={() => setFormFeatures(formFeatures.filter((_, idx) => idx !== i))}
                                                style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0, lineHeight: 1, fontSize: '16px' }}
                                            >×</button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                style={{
                                    width: '100%', padding: '12px', border: 'none', borderRadius: '8px',
                                    background: saving ? '#86efac' : '#16a34a',
                                    color: '#fff', fontSize: '14px', fontWeight: 600,
                                    cursor: saving ? 'not-allowed' : 'pointer', marginBottom: '8px',
                                }}
                            >
                                {saving ? "Saving..." : (editingPlan ? "Update Plan" : "Create Plan")}
                            </button>
                            <button onClick={closeModal} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px', background: '#fff', color: '#374151', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* ════════════ DELETE PLAN MODAL ════════════ */}
            {mounted && deletePlanModal.open && createPortal(
                <div className="sa-modal-backdrop" style={modalBackdrop} onMouseDown={(e) => { if (e.target === e.currentTarget) { setDeletePlanModal({ open: false, planId: "", planName: "" }); setDeleting(false); } }}>
                    <div className="sa-modal-card" style={{ ...modalBox, maxWidth: '420px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #e5e7eb' }}>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#111827' }}>Delete Plan</h3>
                            <button onClick={() => { setDeletePlanModal({ open: false, planId: "", planName: "" }); setDeleting(false); }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af', padding: '4px' }}>
                                <XMarkIcon style={{ width: '20px', height: '20px' }} />
                            </button>
                        </div>
                        <div style={{ padding: '24px' }}>
                            <div style={{
                                padding: '16px', borderRadius: '8px', marginBottom: '24px',
                                background: '#fef2f2', border: '1px solid #fecaca',
                            }}>
                                <p style={{ margin: 0, fontSize: '14px', color: '#991b1b' }}>
                                    Are you sure you want to delete <strong>{deletePlanModal.planName}</strong>? This action cannot be undone.
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button
                                    onClick={() => { setDeletePlanModal({ open: false, planId: "", planName: "" }); setDeleting(false); }}
                                    disabled={deleting}
                                    style={{
                                        padding: '10px 20px', border: '1px solid #d1d5db', borderRadius: '8px',
                                        background: '#fff', color: '#374151', fontSize: '14px', fontWeight: 500, cursor: 'pointer',
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteConfirm}
                                    disabled={deleting}
                                    style={{
                                        padding: '10px 20px', border: 'none', borderRadius: '8px',
                                        background: deleting ? '#fca5a5' : '#ef4444',
                                        color: '#fff', fontSize: '14px', fontWeight: 600,
                                        cursor: deleting ? 'not-allowed' : 'pointer',
                                    }}
                                >
                                    {deleting ? "Deleting..." : "Delete"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
