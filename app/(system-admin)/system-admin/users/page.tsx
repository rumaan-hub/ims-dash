"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { clearAuth } from "@/app/utils/auth";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import "./page.css";
import {
    UsersIcon,
    VideoCameraIcon,
    CalendarIcon,
    XCircleIcon,
    ClockIcon,
    ArrowPathIcon,
    EyeIcon,
    PencilSquareIcon,
    TrashIcon,
    XMarkIcon,
    CheckCircleIcon,
    DocumentArrowUpIcon,
    CurrencyDollarIcon,
    ClipboardDocumentIcon,
    GiftIcon,
    UserPlusIcon,
} from "@heroicons/react/24/outline";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3003";

interface DemoRecord {
    id: string;
    demo_date: string;
    demo_status: string;
    status: string;
    remarks: string | null;
    agreement_status?: string;
    signed_file?: string | null;
    account_status?: "PENDING" | "COMPLETED" | "ACTIVE" | null;
    isComplimentary?: boolean;
    plan_name?: string | null;
    user: {
        client_id: string;
        first_name: string;
        last_name: string;
        email: string;
        company_name: string;
        contact_number: string | null;
        is_deleted?: boolean;
    };
}

interface SubscriptionPlan {
    subscription_plan_id: string;
    plan_name: string;
    price: number;
    duration: number;
    billing_cycle: string;
    user_limit: number;
    description: string | null;
    features: string[];
    is_active: boolean;
}

interface RestoreRequest {
    client_id: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    company_name?: string;
    restore_requested_at?: string;
    restore_request_data?: {
        first_name?: string;
        last_name?: string;
        company_name?: string;
    };
}

interface TimelineEntry {
    status?: string;
    date: string;
    demo_date?: string;
    remark?: string;
}

const STATUS_OPTIONS = ["PENDING", "SCHEDULED", "RESCHEDULED", "SUCCESSFUL", "FAILED", "CANCELLED"];

export default function SuperAdminUsersPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [demos, setDemos] = useState<DemoRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    // Edit demo modal state
    const [editModal, setEditModal] = useState<DemoRecord | null>(null);
    const [editStatus, setEditStatus] = useState("");
    const [editDate, setEditDate] = useState("");
    const [editRemarks, setEditRemarks] = useState("");
    const [editSaving, setEditSaving] = useState(false);

    // Update agreement status modal state
    const [updateAgrModal, setUpdateAgrModal] = useState<DemoRecord | null>(null);
    const [updateAgrStatus, setUpdateAgrStatus] = useState("");
    const [updateAgrRemarks, setUpdateAgrRemarks] = useState("");
    const [updateAgrSaving, setUpdateAgrSaving] = useState(false);
    const [updateAgrFile, setUpdateAgrFile] = useState<File | null>(null);
    const signedFileInputRef = useRef<HTMLInputElement>(null);

    // Send subscription link modal state
    const [subModal, setSubModal] = useState<DemoRecord | null>(null);
    const [subPlans, setSubPlans] = useState<SubscriptionPlan[]>([]);
    const [subPlansLoading, setSubPlansLoading] = useState(false);
    const [subSelectedPlan, setSubSelectedPlan] = useState<SubscriptionPlan | null>(null);
    const [subBillingCycle, setSubBillingCycle] = useState<"monthly" | "annual">("monthly");
    const [subDiscount, setSubDiscount] = useState(0);
    const [subSending, setSubSending] = useState(false);
    const [subResultUrl, setSubResultUrl] = useState("");
    const [subCopied, setSubCopied] = useState(false);

    // Timeline modal state
    const [timelineOpen, setTimelineOpen] = useState(false);
    const [selectedTimelineDemo, setSelectedTimelineDemo] = useState<DemoRecord | null>(null);
    const [timelineLog, setTimelineLog] = useState<TimelineEntry[]>([]);
    const [timelineLoading, setTimelineLoading] = useState(false);

    // Activate/Deactivate modal state
    const [accountActionModal, setAccountActionModal] = useState<{ demo: DemoRecord; action: "activate" | "deactivate" } | null>(null);
    const [accountActionLoading, setAccountActionLoading] = useState(false);

    // Delete user modal state
    const [deleteModal, setDeleteModal] = useState<DemoRecord | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Show deleted users toggle
    const [showDeleted, setShowDeleted] = useState(false);
    const [searchQuery, setSearchQuery] = useState(() => searchParams.get('search') || '');
    const [selectedPlan, setSelectedPlan] = useState('all');

    // Sync URL ?search= param to state
    useEffect(() => {
        const q = searchParams.get('search');
        if (q) setSearchQuery(q);
    }, [searchParams]);

    // Restore requests state
    const [restoreRequests, setRestoreRequests] = useState<RestoreRequest[]>([]);
    const [restoreActionLoading, setRestoreActionLoading] = useState<string | null>(null);

    // Grant Free Access modal state
    const [giftModal, setGiftModal] = useState<DemoRecord | null>(null);
    const [giftPlans, setGiftPlans] = useState<SubscriptionPlan[]>([]);
    const [giftPlansLoading, setGiftPlansLoading] = useState(false);
    const [giftSelectedPlan, setGiftSelectedPlan] = useState("");
    const [giftDurationType, setGiftDurationType] = useState<"LIMITED" | "UNLIMITED">("LIMITED");
    const [giftDurationDays, setGiftDurationDays] = useState(30);
    const [giftReason, setGiftReason] = useState("");
    const [giftSaving, setGiftSaving] = useState(false);

    // Add User + Free Access modal state
    const [addUserModal, setAddUserModal] = useState(false);
    const [addUserPlans, setAddUserPlans] = useState<SubscriptionPlan[]>([]);
    const [addUserPlansLoading, setAddUserPlansLoading] = useState(false);
    const [addUserForm, setAddUserForm] = useState({ firstName: "", lastName: "", email: "", companyName: "", contactNumber: "" });
    const [addUserPlan, setAddUserPlan] = useState("");
    const [addUserDurationType, setAddUserDurationType] = useState<"LIMITED" | "UNLIMITED">("LIMITED");
    const [addUserDurationDays, setAddUserDurationDays] = useState(30);
    const [addUserReason, setAddUserReason] = useState("");
    const [addUserSaving, setAddUserSaving] = useState(false);
    const [addUserDeletedInfo, setAddUserDeletedInfo] = useState<{ clientId: string } | null>(null);
    const [addUserRestoring, setAddUserRestoring] = useState(false);

    // Revoke Free Access modal state
    const [revokeModal, setRevokeModal] = useState<DemoRecord | null>(null);
    const [revokeLoading, setRevokeLoading] = useState(false);

    // Lock body scroll when any modal is open
    useBodyScrollLock(
        !!(editModal || updateAgrModal || subModal || accountActionModal || deleteModal || giftModal || addUserModal || revokeModal)
    );

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

    // ─── Fetch demos + agreement status ───
    const fetchDemos = async (includeDeleted = false, silent = false) => {
        if (!silent) { setLoading(true); setError(""); }
        try {
            const url = includeDeleted ? `${API_BASE}/ims-demo/all?includeDeleted=true` : `${API_BASE}/ims-demo/all`;
            const res = await fetch(url, { headers: authHeaders() });
            if (handleUnauthorized(res.status)) return;
            if (!res.ok) throw new Error(`Failed to fetch demos (${res.status})`);
            const data: DemoRecord[] = await res.json();

            // Fetch agreement status + subscription status for each client in parallel
            const enriched = await Promise.all(
                data.map(async (demo) => {
                    let agreement_status = "Pending";
                    let signed_file: string | null = null;
                    let account_status: "PENDING" | "COMPLETED" | "ACTIVE" | null = null;
                    let isComplimentary = false;
                    let plan_name: string | null = null;
                    try {
                        const agrRes = await fetch(
                            `${API_BASE}/ims-agreement/client/${demo.user.client_id}`,
                            { headers: authHeaders() },
                        );
                        if (agrRes.ok) {
                            const agr = await agrRes.json();
                            agreement_status = agr.status;
                            signed_file = agr.signed_file || null;
                        }
                    } catch { /* ignore */ }
                    try {
                        const subRes = await fetch(
                            `${API_BASE}/ims-subscription/client-status/${demo.user.client_id}`,
                            { headers: authHeaders() },
                        );
                        if (subRes.ok) {
                            const sub = await subRes.json();
                            if (sub.active) account_status = "ACTIVE";
                            else if (sub.payment_status === "COMPLETED") account_status = "COMPLETED";
                            else if (sub.payment_status) account_status = "PENDING";
                            if (sub.payment_status === "COMPLIMENTARY" && sub.active) isComplimentary = true;
                            if (sub.plan_name) plan_name = sub.plan_name;
                            else if (sub.payment_status === "COMPLIMENTARY") plan_name = "Complimentary";
                        }
                    } catch { /* ignore */ }
                    return { ...demo, agreement_status, signed_file, account_status, isComplimentary, plan_name };
                }),
            );
            setDemos(enriched);
        } catch (err: unknown) {
            if (!silent) setError(err instanceof Error ? err.message : "Failed to load demos");
        } finally {
            if (!silent) setLoading(false);
            if (isInitialLoad) setIsInitialLoad(false);
        }
    };

    // Silent background refresh — no spinner, no flicker
    const silentRefresh = () => {
        setTimeout(() => fetchDemos(showDeleted, true), 500);
    };

    useEffect(() => {
        fetchDemos(showDeleted);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchDemos is a stable in-component function; redeclaring it in deps would loop.
    }, [showDeleted]);

    // ─── Fetch restore requests ───
    const fetchRestoreRequests = async () => {
        try {
            const res = await fetch(`${API_BASE}/ims-demo/restore-requests`, { headers: authHeaders() });
            if (res.ok) {
                const data = await res.json();
                setRestoreRequests(data);
            }
        } catch { /* ignore */ }
    };

    useEffect(() => {
        fetchRestoreRequests();
        // eslint-disable-next-line react-hooks/exhaustive-deps -- initial-load only; fetchRestoreRequests is a stable in-component function.
    }, []);

    const handleRestoreAllow = async (clientId: string) => {
        setRestoreActionLoading(clientId);
        try {
            const res = await fetch(`${API_BASE}/ims-demo/restore-allow/${clientId}`, {
                method: "PATCH",
                headers: authHeaders(),
            });
            if (handleUnauthorized(res.status)) return;
            if (!res.ok) throw new Error("Restore failed");
            toast.success("Account restored successfully");
            setRestoreRequests(prev => prev.filter(r => r.client_id !== clientId));
            // Update demos list — mark user as not deleted
            setDemos(prev => prev.map(d =>
                d.user.client_id === clientId
                    ? { ...d, user: { ...d.user, is_deleted: false } }
                    : d
            ));
            silentRefresh();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Failed to restore account");
        } finally {
            setRestoreActionLoading(null);
        }
    };

    const handleRestoreReject = async (clientId: string) => {
        setRestoreActionLoading(clientId);
        try {
            const res = await fetch(`${API_BASE}/ims-demo/restore-reject/${clientId}`, {
                method: "PATCH",
                headers: authHeaders(),
            });
            if (handleUnauthorized(res.status)) return;
            if (!res.ok) throw new Error("Reject failed");
            toast.success("Request rejected");
            setRestoreRequests(prev => prev.filter(r => r.client_id !== clientId));
            silentRefresh();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Failed to reject request");
        } finally {
            setRestoreActionLoading(null);
        }
    };

    // ─── Delete user (soft) ───
    const handleDeleteConfirm = async () => {
        if (!deleteModal) return;
        setDeleteLoading(true);
        try {
            const res = await fetch(`${API_BASE}/ims-demo/${deleteModal.id}`, {
                method: "DELETE",
                headers: authHeaders(),
            });
            if (handleUnauthorized(res.status)) return;
            if (!res.ok) throw new Error(`Delete failed (${res.status})`);
            toast.success("User marked as deleted");
            setDemos(prev => prev.map(d =>
                d.id === deleteModal.id
                    ? { ...d, user: { ...d.user, is_deleted: true } }
                    : d
            ));
            setDeleteModal(null);
            silentRefresh();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Failed to delete user");
        } finally {
            setDeleteLoading(false);
        }
    };

    // ─── Edit demo modal ───
    const openEditModal = (demo: DemoRecord) => {
        setEditModal(demo);
        setEditStatus(demo.demo_status);
        setEditDate(demo.demo_date ? new Date(demo.demo_date).toISOString().slice(0, 16) : "");
        setEditRemarks(demo.remarks || "");
    };

    const closeEditModal = () => {
        setEditModal(null);
        setEditStatus("");
        setEditDate("");
        setEditRemarks("");
        setEditSaving(false);
    };

    const handleEditSave = async () => {
        if (!editModal) return;
        setEditSaving(true);
        try {
            const body: Record<string, unknown> = { demo_status: editStatus };
            if (editDate) body.demo_date = new Date(editDate).toISOString();
            if (editRemarks.trim()) body.remarks = editRemarks.trim();

            const res = await fetch(`${API_BASE}/ims-demo/${editModal.id}/status`, {
                method: "PATCH",
                headers: authHeaders(),
                body: JSON.stringify(body),
            });
            if (handleUnauthorized(res.status)) return;
            if (!res.ok) throw new Error(`Update failed (${res.status})`);

            toast.success("Demo updated successfully");
            setDemos(prev => prev.map(d =>
                d.id === editModal.id
                    ? {
                        ...d,
                        demo_status: editStatus,
                        demo_date: editDate ? new Date(editDate).toISOString() : d.demo_date,
                        remarks: editRemarks.trim() || d.remarks,
                    }
                    : d
            ));
            closeEditModal();
            silentRefresh();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Failed to update demo");
        } finally {
            setEditSaving(false);
        }
    };

    // ─── Update Agreement Status modal ───
    const openUpdateAgrModal = (demo: DemoRecord) => {
        setUpdateAgrModal(demo);
        setUpdateAgrStatus("SIGNED");
        setUpdateAgrRemarks("");
        setUpdateAgrSaving(false);
    };

    const closeUpdateAgrModal = () => {
        setUpdateAgrModal(null);
        setUpdateAgrStatus("");
        setUpdateAgrRemarks("");
        setUpdateAgrFile(null);
    };

    const handleUpdateAgreement = async () => {
        if (!updateAgrModal) return;
        setUpdateAgrSaving(true);
        try {
            // Upload signed PDF if selected
            let signedFileUrl: string | undefined;
            if (updateAgrStatus === "SIGNED" && updateAgrFile) {
                const formData = new FormData();
                formData.append("file", updateAgrFile);
                const uploadRes = await fetch(`${API_BASE}/ims-agreement/upload`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${getToken()}` },
                    body: formData,
                });
                if (!uploadRes.ok) throw new Error("Failed to upload signed PDF");
                const uploadData = await uploadRes.json();
                signedFileUrl = uploadData.url;
            }

            const body: Record<string, unknown> = {
                status: updateAgrStatus,
                remarks: updateAgrRemarks.trim() || undefined,
            };
            if (signedFileUrl) body.signed_file = signedFileUrl;

            // Check if agreement exists
            const agrRes = await fetch(
                `${API_BASE}/ims-agreement/client/${updateAgrModal.user.client_id}`,
                { headers: authHeaders() },
            );

            const agrText = await agrRes.text();
            const agr = agrText ? JSON.parse(agrText) : null;

            if (agrRes.ok && agr) {
                // Agreement exists — update it
                const res = await fetch(`${API_BASE}/ims-agreement/${agr.agreement_id}/status`, {
                    method: "PATCH",
                    headers: authHeaders(),
                    body: JSON.stringify(body),
                });
                if (handleUnauthorized(res.status)) return;
                if (!res.ok) throw new Error(`Update failed (${res.status})`);
            } else {
                // No agreement — create one
                const res = await fetch(
                    `${API_BASE}/ims-agreement/create/${updateAgrModal.user.client_id}`,
                    {
                        method: "POST",
                        headers: authHeaders(),
                        body: JSON.stringify(body),
                    },
                );
                if (handleUnauthorized(res.status)) return;
                if (!res.ok) throw new Error(`Create failed (${res.status})`);
            }

            // Update local state
            setDemos(prev => prev.map(d =>
                d.id === updateAgrModal.id
                    ? { ...d, agreement_status: updateAgrStatus, signed_file: signedFileUrl || d.signed_file }
                    : d
            ));

            toast.success("Agreement status updated!");
            closeUpdateAgrModal();
            silentRefresh();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Failed to update agreement");
        } finally {
            setUpdateAgrSaving(false);
        }
    };

    // ─── Agreement badge click handler ───
    const handleAgreementBadgeClick = (demo: DemoRecord) => {
        if (demo.demo_status !== "SUCCESSFUL") return;
        const agrStatus = demo.agreement_status || "Pending";
        if (agrStatus === "SIGNED") return;
        if (agrStatus === "SENT") {
            openUpdateAgrModal(demo);
        }
    };

    // ─── Send Subscription Link modal ───
    const openSubModal = async (demo: DemoRecord) => {
        setSubModal(demo);
        setSubSelectedPlan(null);
        setSubBillingCycle("monthly");
        setSubDiscount(0);
        setSubSending(false);
        setSubResultUrl("");
        setSubCopied(false);

        // Fetch plans
        setSubPlansLoading(true);
        try {
            const res = await fetch(`${API_BASE}/ims-subscription/plans`);
            if (res.ok) {
                const plans: SubscriptionPlan[] = await res.json();
                setSubPlans(plans);
            } else {
                toast.error("Failed to load plans");
            }
        } catch {
            toast.error("Failed to load plans");
        } finally {
            setSubPlansLoading(false);
        }
    };

    const closeSubModal = () => {
        setSubModal(null);
        setSubSelectedPlan(null);
        setSubResultUrl("");
    };

    const getSubFinalPrice = () => {
        if (!subSelectedPlan) return 0;
        const discounted = subSelectedPlan.price * (1 - subDiscount / 100);
        return subBillingCycle === "annual" ? discounted * 12 * 0.9 : discounted;
    };

    const handleSendSubLink = async () => {
        if (!subModal || !subSelectedPlan) return;
        setSubSending(true);
        try {
            const res = await fetch(`${API_BASE}/ims-subscription/send-link`, {
                method: "POST",
                headers: authHeaders(),
                body: JSON.stringify({
                    client_id: subModal.user.client_id,
                    subscription_plan_id: subSelectedPlan.subscription_plan_id,
                    discount_percentage: subDiscount,
                    billing_cycle: subBillingCycle,
                }),
            });
            if (handleUnauthorized(res.status)) return;
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || `Failed (${res.status})`);
            }
            const data = await res.json();
            setSubResultUrl(data.checkoutUrl);
            toast.success("Subscription link sent!");
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Failed to send link");
        } finally {
            setSubSending(false);
        }
    };

    const handleCopySubLink = () => {
        navigator.clipboard.writeText(subResultUrl);
        setSubCopied(true);
        toast.success("Link copied!");
        setTimeout(() => setSubCopied(false), 2000);
    };

    // ─── Grant Free Access ───
    const openGiftModal = async (demo: DemoRecord) => {
        setGiftModal(demo);
        setGiftSelectedPlan("");
        setGiftDurationType("LIMITED");
        setGiftDurationDays(30);
        setGiftReason("");
        setGiftSaving(false);
        setGiftPlansLoading(true);
        try {
            const res = await fetch(`${API_BASE}/ims-subscription/plans`);
            if (res.ok) setGiftPlans(await res.json());
        } catch { /* ignore */ }
        finally { setGiftPlansLoading(false); }
    };

    const closeGiftModal = () => { setGiftModal(null); };

    const handleGrantFreeAccess = async () => {
        if (!giftModal || !giftSelectedPlan) return;
        setGiftSaving(true);
        try {
            const res = await fetch(`${API_BASE}/ims-subscription/grant-free-access`, {
                method: "POST",
                headers: authHeaders(),
                body: JSON.stringify({
                    clientId: giftModal.user.client_id,
                    planId: giftSelectedPlan,
                    durationType: giftDurationType,
                    durationDays: giftDurationType === "LIMITED" ? giftDurationDays : undefined,
                    reason: giftReason.trim() || undefined,
                }),
            });
            if (handleUnauthorized(res.status)) return;
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || `Failed (${res.status})`);
            }
            toast.success("Free access granted successfully");
            setDemos(prev => prev.map(d =>
                d.id === giftModal.id ? { ...d, account_status: "ACTIVE" } : d
            ));
            closeGiftModal();
            silentRefresh();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Failed to grant access");
        } finally { setGiftSaving(false); }
    };

    // ─── Add User with Free Access ───
    const openAddUserModal = async () => {
        setAddUserModal(true);
        setAddUserForm({ firstName: "", lastName: "", email: "", companyName: "", contactNumber: "" });
        setAddUserPlan("");
        setAddUserDurationType("LIMITED");
        setAddUserDurationDays(30);
        setAddUserReason("");
        setAddUserSaving(false);
        setAddUserDeletedInfo(null);
        setAddUserRestoring(false);
        setAddUserPlansLoading(true);
        try {
            const res = await fetch(`${API_BASE}/ims-subscription/plans`);
            if (res.ok) setAddUserPlans(await res.json());
        } catch { /* ignore */ }
        finally { setAddUserPlansLoading(false); }
    };

    const closeAddUserModal = () => { setAddUserModal(false); };

    const handleCreateUserWithAccess = async () => {
        if (!addUserForm.firstName || !addUserForm.lastName || !addUserForm.email || !addUserForm.companyName || !addUserPlan) {
            toast.error("Please fill all required fields");
            return;
        }
        setAddUserSaving(true);
        try {
            const res = await fetch(`${API_BASE}/ims-subscription/create-user-with-access`, {
                method: "POST",
                headers: authHeaders(),
                body: JSON.stringify({
                    firstName: addUserForm.firstName,
                    lastName: addUserForm.lastName,
                    email: addUserForm.email,
                    companyName: addUserForm.companyName,
                    contactNumber: addUserForm.contactNumber || undefined,
                    planId: addUserPlan,
                    durationType: addUserDurationType,
                    durationDays: addUserDurationType === "LIMITED" ? addUserDurationDays : undefined,
                    reason: addUserReason.trim() || undefined,
                }),
            });
            if (handleUnauthorized(res.status)) return;
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                // Check if deleted user conflict — show restore option
                const msg = errData.message || '';
                if (res.status === 409 && errData.clientId && (msg.toLowerCase().includes('deleted') || msg.toLowerCase().includes('restore'))) {
                    setAddUserDeletedInfo({ clientId: errData.clientId });
                    setAddUserSaving(false);
                    return;
                }
                throw new Error(msg || `Failed (${res.status})`);
            }
            toast.success("User created and access granted");
            closeAddUserModal();
            silentRefresh();
            // Full refresh to get new user in list
            setTimeout(() => fetchDemos(showDeleted), 1000);
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Failed to create user");
        } finally { setAddUserSaving(false); }
    };

    const handleRestoreAndGrant = async () => {
        if (!addUserDeletedInfo) return;
        setAddUserRestoring(true);
        try {
            // Step 1: Restore the user
            const restoreRes = await fetch(`${API_BASE}/ims-demo/restore-allow/${addUserDeletedInfo.clientId}`, {
                method: "PATCH",
                headers: authHeaders(),
            });
            if (handleUnauthorized(restoreRes.status)) return;
            if (!restoreRes.ok) throw new Error("Failed to restore user");

            // Step 2: Grant free access
            if (addUserPlan) {
                const grantRes = await fetch(`${API_BASE}/ims-subscription/grant-free-access`, {
                    method: "POST",
                    headers: authHeaders(),
                    body: JSON.stringify({
                        clientId: addUserDeletedInfo.clientId,
                        planId: addUserPlan,
                        durationType: addUserDurationType,
                        durationDays: addUserDurationType === "LIMITED" ? addUserDurationDays : undefined,
                        reason: addUserReason.trim() || undefined,
                    }),
                });
                if (!grantRes.ok) {
                    const errData = await grantRes.json().catch(() => ({}));
                    throw new Error(errData.message || "Failed to grant access");
                }
            }

            toast.success("Account restored and access granted");
            closeAddUserModal();
            silentRefresh();
            setTimeout(() => fetchDemos(showDeleted), 1000);
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Failed to restore");
        } finally { setAddUserRestoring(false); }
    };

    // ─── Revoke Free Access ───
    const handleRevokeConfirm = async () => {
        if (!revokeModal) return;
        setRevokeLoading(true);
        try {
            const res = await fetch(`${API_BASE}/ims-subscription/revoke-free-access/${revokeModal.user.client_id}`, {
                method: "DELETE",
                headers: authHeaders(),
            });
            if (handleUnauthorized(res.status)) return;
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || `Failed (${res.status})`);
            }
            const data = await res.json();
            if (data.restoredPlan) {
                toast.success(`Free access revoked. ${data.restoredPlan} plan restored.`);
            } else {
                toast.success("Free access revoked. User has been deactivated.");
            }
            setDemos(prev => prev.map(d =>
                d.id === revokeModal.id
                    ? { ...d, isComplimentary: false }
                    : d
            ));
            setRevokeModal(null);
            silentRefresh();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Failed to revoke access");
        } finally { setRevokeLoading(false); }
    };

    // ─── Activate / Deactivate Account ───
    const openAccountActionModal = (demo: DemoRecord, action: "activate" | "deactivate") => {
        setAccountActionModal({ demo, action });
        setAccountActionLoading(false);
    };

    const closeAccountActionModal = () => {
        setAccountActionModal(null);
        setAccountActionLoading(false);
    };

    const handleAccountActionConfirm = async () => {
        if (!accountActionModal) return;
        const { demo, action } = accountActionModal;
        setAccountActionLoading(true);
        try {
            const endpoint = action === "activate"
                ? `${API_BASE}/ims-subscription/activate/${demo.user.client_id}`
                : `${API_BASE}/ims-subscription/deactivate/${demo.user.client_id}`;
            const res = await fetch(endpoint, {
                method: "PATCH",
                headers: authHeaders(),
            });
            if (handleUnauthorized(res.status)) return;
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || `${action} failed (${res.status})`);
            }
            toast.success(action === "activate" ? "Account activated! Email sent to client." : "Account deactivated.");
            setDemos(prev => prev.map(d =>
                d.id === demo.id
                    ? { ...d, account_status: action === "activate" ? "ACTIVE" : "COMPLETED" }
                    : d
            ));
            closeAccountActionModal();
            silentRefresh();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : `Failed to ${action} account`);
            setAccountActionLoading(false);
        }
    };

    // ─── Timeline Modal ───
    const openTimelineModal = async (demo: DemoRecord) => {
        setSelectedTimelineDemo(demo);
        setTimelineOpen(true);
        setTimelineLoading(true);
        setTimelineLog([]);
        try {
            const token = getToken();
            const res = await fetch(
                `${API_BASE}/ims-demo/my/${demo.user?.client_id}`,
                { headers: { Authorization: `Bearer ${token}` } },
            );
            const data = await res.json();
            const log = data?.remarks_log || data?.[0]?.remarks_log || [];
            setTimelineLog(Array.isArray(log) ? log : []);
        } catch {
            setTimelineLog([]);
        } finally {
            setTimelineLoading(false);
        }
    };

    // ─── Stats (always exclude deleted users) ───
    const activeDemos = demos.filter(d => !d.user.is_deleted);
    const stats = [
        { title: "Register Users List", value: activeDemos.length.toLocaleString(), icon: <UsersIcon className="w-6 h-6" style={{ color: '#3b82f6' }} />, iconBg: '#dbeafe' },
        { title: "Total Demos", value: activeDemos.length.toLocaleString(), icon: <VideoCameraIcon className="w-6 h-6" style={{ color: '#8b5cf6' }} />, iconBg: '#ede9fe' },
        { title: "Scheduled", value: activeDemos.filter(d => d.demo_status === "SCHEDULED").length.toString(), icon: <CalendarIcon className="w-6 h-6" style={{ color: '#22c55e' }} />, iconBg: '#dcfce7' },
        { title: "Failed Demo's", value: activeDemos.filter(d => d.demo_status === "FAILED").length.toString(), icon: <XCircleIcon className="w-6 h-6" style={{ color: '#ef4444' }} />, iconBg: '#fee2e2' },
        { title: "Pending Demo's", value: activeDemos.filter(d => d.demo_status === "PENDING").length.toString(), icon: <ClockIcon className="w-6 h-6" style={{ color: '#f97316' }} />, iconBg: '#ffedd5' },
        { title: "Rescheduled", value: activeDemos.filter(d => d.demo_status === "CANCELLED").length.toString(), icon: <ArrowPathIcon className="w-6 h-6" style={{ color: '#6366f1' }} />, iconBg: '#e0e7ff' },
    ];

    // ─── Search + Plan filter ───
    const filteredDemos = demos.filter(demo => {
        // Plan filter
        if (selectedPlan !== 'all') {
            if (selectedPlan === 'none') {
                if (demo.plan_name) return false;
            } else if (selectedPlan === 'complimentary') {
                if (!demo.isComplimentary && demo.plan_name?.toLowerCase() !== 'complimentary') return false;
            } else {
                if (!demo.plan_name?.toLowerCase().includes(selectedPlan.toLowerCase())) return false;
            }
        }
        // Search filter
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            demo.user?.first_name?.toLowerCase().includes(q) ||
            demo.user?.last_name?.toLowerCase().includes(q) ||
            (demo.user?.first_name + ' ' + demo.user?.last_name).toLowerCase().includes(q) ||
            demo.user?.company_name?.toLowerCase().includes(q) ||
            demo.user?.email?.toLowerCase().includes(q) ||
            demo.user?.contact_number?.includes(q)
        );
    }).sort((a, b) => {
        const priority: Record<string, number> = {
            'PENDING': 0, 'SCHEDULED': 1, 'RESCHEDULED': 2,
            'SUCCESSFUL': 3, 'FAILED': 4, 'CANCELLED': 5,
        };
        const ap = priority[a.demo_status] ?? 3;
        const bp = priority[b.demo_status] ?? 3;
        if (ap !== bp) return ap - bp;
        return new Date(b.demo_date).getTime() - new Date(a.demo_date).getTime();
    });

    // ─── Export CSV ───
    const exportCSV = () => {
        const headers = ['Name', 'Email', 'Company', 'Phone', 'Request Date', 'Demo Status', 'Agreement Status', 'Account Status'];
        const rows = filteredDemos.map(demo => [
            `${demo.user?.first_name || ''} ${demo.user?.last_name || ''}`.trim(),
            demo.user?.email || '',
            demo.user?.company_name || '',
            demo.user?.contact_number || '',
            new Date(demo.demo_date).toLocaleDateString(),
            demo.demo_status || '',
            demo.agreement_status || 'Pending',
            demo.account_status || '',
        ]);
        const csv = [headers, ...rows].map(row => row.map(cell => `"${(cell ?? '').toString().replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ims-users-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'SCHEDULED': return { bg: '#dbeafe', text: '#2563eb' };
            case 'SUCCESSFUL': return { bg: '#d1fae5', text: '#059669' };
            case 'FAILED': return { bg: '#fee2e2', text: '#dc2626' };
            case 'PENDING': return { bg: '#e0e7ff', text: '#4f46e5' };
            case 'CANCELLED': return { bg: '#f3f4f6', text: '#6b7280' };
            case 'RESCHEDULED': return { bg: '#ede9fe', text: '#7c3aed' };
            case 'Signed': case 'SIGNED': return { bg: '#d1fae5', text: '#059669' };
            case 'SENT': return { bg: '#dbeafe', text: '#2563eb' };
            case 'Rejected': case 'REJECTED': return { bg: '#fee2e2', text: '#dc2626' };
            case 'Pending': return { bg: '#fef3c7', text: '#d97706' };
            default: return { bg: '#fef3c7', text: '#d97706' };
        }
    };

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleString("en-US", {
                year: "numeric", month: "short", day: "2-digit",
                hour: "2-digit", minute: "2-digit",
            });
        } catch {
            return dateStr;
        }
    };

    // ─── Shared modal styles ───
    const modalBackdrop: React.CSSProperties = {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        width: '100vw', height: '100vh',
        zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px', boxSizing: 'border-box',
        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)',
    };
    const modalBox: React.CSSProperties = {
        position: 'relative', background: '#fff', borderRadius: '12px',
        width: 'min(90vw, 480px)', maxHeight: '90vh', overflowY: 'auto',
        margin: '16px auto',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', animation: 'slideUp 0.2s ease-out',
    };
    const modalHeader: React.CSSProperties = {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '20px 24px', borderBottom: '1px solid #e5e7eb',
    };
    const labelStyle: React.CSSProperties = {
        display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px',
    };
    const inputStyle: React.CSSProperties = {
        width: '100%', padding: '10px 12px', border: '1px solid #d1d5db',
        borderRadius: '8px', fontSize: '14px', color: '#111827', outline: 'none', boxSizing: 'border-box',
    };

    return (
        <div className="sa-users-page">
            <Toaster position="top-right" />
            <style>{`@keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }`}</style>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <style>{`
                .sa-users-page {
                    padding: 12px;
                    background: #f1f5f9;
                    min-height: 100%;
                }
                @media (min-width: 1024px) {
                    .sa-users-page { padding: 24px; }
                }
                .sa-stats-grid {
                    display: grid;
                    gap: 12px;
                    margin-bottom: 32px;
                    grid-template-columns: repeat(1, 1fr);
                    overflow: visible;
                }
                @media (min-width: 400px) {
                    .sa-stats-grid { grid-template-columns: repeat(2, 1fr); }
                }
                @media (min-width: 640px) {
                    .sa-stats-grid { grid-template-columns: repeat(3, 1fr); gap: 16px; }
                }
                @media (min-width: 1024px) {
                    .sa-stats-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); }
                }
                .sa-stat-card {
                    background: #fff;
                    border-radius: 12px;
                    padding: 12px;
                    border: 1px solid #e5e7eb;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 8px;
                    min-width: 0;
                    transition: all 0.3s ease;
                    cursor: default;
                    overflow: visible;
                }
                @media (min-width: 768px) {
                    .sa-stat-card { padding: 20px; gap: 10px; }
                }
                .sa-stat-card:hover {
                    box-shadow: 0 4px 16px rgba(0,0,0,0.1);
                    transform: translateY(-2px);
                }
                .sa-stat-label {
                    font-size: 11px;
                    color: #6b7280;
                    font-weight: 600;
                    margin: 0;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    white-space: normal;
                    word-break: break-word;
                    line-height: 1.3;
                    display: block;
                    width: 100%;
                }
                .sa-stat-value {
                    font-size: 28px;
                    font-weight: 700;
                    color: #111827;
                    margin: 0;
                }
                .sa-users-table-wrap {
                    background: #fff;
                    border-radius: 12px;
                    border: 1px solid #e5e7eb;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
                    overflow: visible;
                }
                .sa-users-table-wrap table thead tr {
                    background: #f9fafb;
                }
                .sa-users-table-wrap table thead th {
                    text-transform: uppercase;
                    font-size: 11px;
                    letter-spacing: 0.05em;
                    color: #6b7280;
                    font-weight: 600;
                }
                .sa-users-table-wrap table tbody tr {
                    transition: background 0.2s ease;
                }
                .sa-users-table-wrap table tbody tr:hover {
                    background: #f9fafb;
                }
                .sa-table-actions {
                    display: flex;
                    gap: 6px;
                    justify-content: center;
                    flex-wrap: nowrap;
                    white-space: nowrap;
                }
                .sa-table-actions button {
                    transition: transform 0.2s ease;
                }
                .sa-table-actions button:hover {
                    transform: scale(1.1);
                }
                @media (max-width: 639px) {
                    .sa-table-actions { gap: 4px; }
                    .sa-table-actions button { padding: 4px !important; }
                }
                @media (prefers-reduced-motion: reduce) {
                    .sa-stat-card,
                    .sa-users-table-wrap table tbody tr,
                    .sa-table-actions button {
                        transition: none !important;
                        animation: none !important;
                    }
                    .sa-stat-card:hover {
                        transform: none !important;
                    }
                }
            `}</style>

            <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px', color: '#111827' }}>
                User & Demo Management
            </h1>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px', marginTop: 0 }}>
                Manage registered users and demos
            </p>

            {/* STATS STRIP */}
            <div className="sa-stats-grid">
                {stats.map((stat, i) => (
                    <div key={i} className="sa-stat-card">
                        <div style={{
                            width: '36px', height: '36px', borderRadius: '50%',
                            background: stat.iconBg, display: 'flex',
                            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                            {stat.icon}
                        </div>
                        <div style={{ minWidth: 0, width: '100%' }}>
                            <p className="sa-stat-label">{stat.title}</p>
                            <h4 className="sa-stat-value">{stat.value}</h4>
                        </div>
                    </div>
                ))}
            </div>

            {/* ERROR */}
            {error && (
                <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px 20px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
                    {error}
                </div>
            )}

            {/* RESTORE REQUESTS */}
            {restoreRequests.length > 0 && (
                <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'visible', marginBottom: '24px' }}>
                    <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Restore Requests</h3>
                        <span style={{
                            background: '#fef3c7', color: '#92400e',
                            padding: '2px 10px', borderRadius: '9999px',
                            fontSize: '12px', fontWeight: 600,
                        }}>
                            {restoreRequests.length}
                        </span>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', minWidth: '750px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                            <thead>
                                <tr style={{ background: '#fffbeb', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>
                                    <th style={{ padding: '12px 20px', fontWeight: 500 }}>Name</th>
                                    <th style={{ padding: '12px 20px', fontWeight: 500 }}>Email</th>
                                    <th style={{ padding: '12px 20px', fontWeight: 500 }}>Previous Company</th>
                                    <th style={{ padding: '12px 20px', fontWeight: 500 }}>New Company</th>
                                    <th style={{ padding: '12px 20px', fontWeight: 500 }}>Requested Date</th>
                                    <th style={{ padding: '12px 20px', fontWeight: 500, textAlign: 'center' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {restoreRequests.map((req) => {
                                    const rData = req.restore_request_data || {};
                                    return (
                                        <tr key={req.client_id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                            <td style={{ padding: '14px 20px', fontWeight: 500, color: '#111827' }}>
                                                {rData.first_name || req.first_name} {rData.last_name || req.last_name}
                                            </td>
                                            <td style={{ padding: '14px 20px', color: '#4b5563' }}>{req.email}</td>
                                            <td style={{ padding: '14px 20px', color: '#9ca3af' }}>{req.company_name}</td>
                                            <td style={{ padding: '14px 20px', color: '#111827', fontWeight: 500 }}>{rData.company_name || '—'}</td>
                                            <td style={{ padding: '14px 20px', color: '#4b5563' }}>
                                                {req.restore_requested_at ? formatDate(req.restore_requested_at) : '—'}
                                            </td>
                                            <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                    <button
                                                        onClick={() => handleRestoreAllow(req.client_id)}
                                                        disabled={restoreActionLoading === req.client_id}
                                                        style={{
                                                            padding: '6px 16px', border: 'none', borderRadius: '6px',
                                                            background: restoreActionLoading === req.client_id ? '#86efac' : '#16a34a',
                                                            color: '#fff', fontSize: '13px', fontWeight: 600,
                                                            cursor: restoreActionLoading === req.client_id ? 'not-allowed' : 'pointer',
                                                        }}
                                                    >
                                                        Allow
                                                    </button>
                                                    <button
                                                        onClick={() => handleRestoreReject(req.client_id)}
                                                        disabled={restoreActionLoading === req.client_id}
                                                        style={{
                                                            padding: '6px 16px', border: 'none', borderRadius: '6px',
                                                            background: restoreActionLoading === req.client_id ? '#fca5a5' : '#ef4444',
                                                            color: '#fff', fontSize: '13px', fontWeight: 600,
                                                            cursor: restoreActionLoading === req.client_id ? 'not-allowed' : 'pointer',
                                                        }}
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* USERS TABLE */}
            <div className="sa-users-table-wrap">
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Registered Users</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        {/* Plan Filter */}
                        <select
                            value={selectedPlan}
                            onChange={(e) => setSelectedPlan(e.target.value)}
                            style={{
                                padding: '7px 12px', fontSize: '13px', border: '1px solid #e5e7eb',
                                borderRadius: '8px', outline: 'none', background: '#f9fafb',
                                cursor: 'pointer', color: '#374151',
                            }}
                        >
                            <option value="all">All Plans</option>
                            <option value="basic">Basic</option>
                            <option value="standard">Standard</option>
                            <option value="premium">Premium</option>
                            <option value="complimentary">Complimentary</option>
                            <option value="none">No Plan</option>
                        </select>
                        {/* Search */}
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <input
                                type="text"
                                placeholder="Search by name, email, company..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    padding: '7px 32px 7px 12px', fontSize: '13px', border: '1px solid #e5e7eb',
                                    borderRadius: '8px', outline: 'none', width: '260px', background: '#f9fafb',
                                    transition: 'border-color 0.2s',
                                }}
                                onFocus={(e) => { e.currentTarget.style.borderColor = '#2563eb'; }}
                                onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }}
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    style={{
                                        position: 'absolute', right: '8px', background: 'none', border: 'none',
                                        cursor: 'pointer', color: '#9ca3af', padding: '2px', display: 'flex',
                                    }}
                                >
                                    <XMarkIcon style={{ width: '16px', height: '16px' }} />
                                </button>
                            )}
                        </div>
                        {/* Add User */}
                        <button
                            onClick={openAddUserModal}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '7px 14px', fontSize: '13px', fontWeight: 600,
                                background: '#2563eb', color: '#fff', border: 'none',
                                borderRadius: '8px', cursor: 'pointer', transition: 'background 0.2s',
                                whiteSpace: 'nowrap',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#1d4ed8'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = '#2563eb'; }}
                        >
                            <UserPlusIcon style={{ width: '16px', height: '16px' }} />
                            Add User
                        </button>
                        {/* Export CSV */}
                        <button
                            onClick={exportCSV}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '7px 14px', fontSize: '13px', fontWeight: 600,
                                background: '#059669', color: '#fff', border: 'none',
                                borderRadius: '8px', cursor: 'pointer', transition: 'background 0.2s',
                                whiteSpace: 'nowrap',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#047857'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = '#059669'; }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            Export CSV
                        </button>
                        {/* Show Deleted */}
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6b7280', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                            <input
                                type="checkbox"
                                checked={showDeleted}
                                onChange={(e) => setShowDeleted(e.target.checked)}
                                style={{ width: '16px', height: '16px', accentColor: '#ef4444' }}
                            />
                            Show Deleted
                        </label>
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', minWidth: '800px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                                <th style={{ padding: '12px 20px' }}>User Name</th>
                                <th style={{ padding: '12px 20px' }}>Request Date & Time</th>
                                <th style={{ padding: '12px 20px' }}>Company Name</th>
                                <th style={{ padding: '12px 20px' }}>Email Address</th>
                                <th style={{ padding: '12px 20px' }}>Phone</th>
                                <th style={{ padding: '12px 20px' }}>Demo Status</th>
                                <th style={{ padding: '12px 20px' }}>Agreement Status</th>
                                <th style={{ padding: '12px 20px', textAlign: 'center' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && isInitialLoad ? (
                                <tr>
                                    <td colSpan={8} style={{ padding: '40px 20px', textAlign: 'center', color: '#6b7280' }}>
                                        <div style={{ display: 'inline-block', width: '24px', height: '24px', border: '3px solid #e5e7eb', borderTop: '3px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                                        <p style={{ marginTop: '8px' }}>Loading demos...</p>
                                    </td>
                                </tr>
                            ) : filteredDemos.length === 0 ? (
                                <tr>
                                    <td colSpan={8} style={{ padding: '40px 20px', textAlign: 'center', color: '#6b7280' }}>
                                        {searchQuery ? 'No users matching your search.' : 'No demos found.'}
                                    </td>
                                </tr>
                            ) : filteredDemos.map((demo) => {
                                const agrStatus = demo.agreement_status || "Pending";
                                const isClickable = demo.demo_status === "SUCCESSFUL" && agrStatus !== "SIGNED";
                                const isDeleted = demo.user.is_deleted === true;
                                return (
                                    <tr key={demo.id} style={{ borderBottom: '1px solid #f3f4f6', background: isDeleted ? '#f9fafb' : undefined, opacity: isDeleted ? 0.7 : 1 }}>
                                        <td style={{ padding: '16px 20px', fontWeight: 500, color: '#111827' }}>
                                            <span style={{ textDecoration: isDeleted ? 'line-through' : 'none' }}>
                                                {demo.user.first_name} {demo.user.last_name}
                                            </span>
                                            {isDeleted && (
                                                <span style={{
                                                    marginLeft: '8px', background: '#fee2e2', color: '#dc2626',
                                                    padding: '4px 10px', borderRadius: '9999px',
                                                    fontSize: '12px', fontWeight: 600,
                                                }}>
                                                    Deleted
                                                </span>
                                            )}
                                        </td>
                                        <td style={{ padding: '16px 20px', color: '#4b5563' }}>{formatDate(demo.demo_date)}</td>
                                        <td style={{ padding: '16px 20px', color: '#4b5563' }}>{demo.user.company_name}</td>
                                        <td style={{ padding: '16px 20px', color: '#4b5563' }}>{demo.user.email}</td>
                                        <td style={{ padding: '16px 20px', color: '#4b5563' }}>{demo.user.contact_number || '—'}</td>
                                        <td style={{ padding: '16px 20px' }}>
                                            <span style={{
                                                background: getStatusColor(demo.demo_status).bg,
                                                color: getStatusColor(demo.demo_status).text,
                                                padding: '4px 12px', borderRadius: '20px',
                                                fontSize: '12px', fontWeight: 600,
                                            }}>
                                                {demo.demo_status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 20px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <span
                                                    onClick={() => isClickable && handleAgreementBadgeClick(demo)}
                                                    title={demo.demo_status !== "SUCCESSFUL" ? "Complete demo first" : (agrStatus === "SIGNED" ? "Already signed" : "Click to manage")}
                                                    style={{
                                                        background: getStatusColor(agrStatus).bg,
                                                        color: getStatusColor(agrStatus).text,
                                                        padding: '4px 12px', borderRadius: '20px',
                                                        fontSize: '12px', fontWeight: 600,
                                                        cursor: isClickable ? 'pointer' : 'not-allowed',
                                                        opacity: isClickable ? 1 : 0.7,
                                                        transition: 'opacity 0.15s',
                                                    }}
                                                >
                                                    {agrStatus}
                                                </span>
                                                {agrStatus === "SIGNED" && demo.signed_file && (
                                                    <a
                                                        href={demo.signed_file}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        title="View Signed PDF"
                                                        style={{ color: '#ef4444', display: 'flex', alignItems: 'center' }}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                                            <path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2zM9.5 3A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5v2z" />
                                                            <path d="M4.603 14.087a.81.81 0 0 1-.438-.42c-.195-.388-.13-.776.08-1.102.198-.307.526-.568.897-.787a7.68 7.68 0 0 1 1.482-.645 19.7 19.7 0 0 0 1.062-2.227 7.269 7.269 0 0 1-.43-1.295c-.086-.4-.119-.796-.046-1.136.075-.354.274-.672.65-.823.192-.077.4-.12.602-.077a.7.7 0 0 1 .477.365c.088.164.12.356.127.538.007.188-.012.396-.047.614-.084.51-.27 1.134-.52 1.794a10.954 10.954 0 0 0 .98 1.686 5.753 5.753 0 0 1 1.334.05c.364.066.734.195.96.465.12.144.193.32.2.518.007.192-.047.382-.138.563a1.04 1.04 0 0 1-.354.416.856.856 0 0 1-.51.138c-.331-.014-.654-.196-.933-.417a6.12 6.12 0 0 1-.911-.95 11.7 11.7 0 0 0-1.997.406 11.307 11.307 0 0 1-1.02 1.51c-.292.35-.609.656-.927.787a.793.793 0 0 1-.58.029z" />
                                                        </svg>
                                                    </a>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 20px' }}><div className="sa-table-actions" style={{ alignItems: 'center' }}>
                                            {/* Eye/View button — always visible, grayed for deleted */}
                                            <button
                                                style={{ border: 'none', background: 'none', cursor: 'pointer', color: isDeleted ? '#9ca3af' : '#2563eb', opacity: isDeleted ? 0.6 : 1 }}
                                                title="View History"
                                                onClick={() => openTimelineModal(demo)}
                                            >
                                                <EyeIcon className="w-5 h-5" />
                                            </button>
                                            {/* All other buttons hidden for deleted users */}
                                            {!isDeleted && (
                                                <>
                                                    <button
                                                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#6b7280' }}
                                                        title="Edit Demo"
                                                        onClick={() => openEditModal(demo)}
                                                    >
                                                        <PencilSquareIcon className="w-5 h-5" />
                                                    </button>
                                                    {demo.isComplimentary ? (
                                                        <button
                                                            style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#dc2626' }}
                                                            title="Revoke Free Access"
                                                            onClick={() => setRevokeModal(demo)}
                                                        >
                                                            <XCircleIcon className="w-5 h-5" />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#7c3aed' }}
                                                            title="Grant Free Access"
                                                            onClick={() => openGiftModal(demo)}
                                                        >
                                                            <GiftIcon className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                    {agrStatus !== "SIGNED" && demo.demo_status !== "PENDING" && demo.demo_status !== "FAILED" && demo.demo_status !== "CANCELLED" && (
                                                        <button
                                                            style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#6366f1' }}
                                                            title="Update Agreement"
                                                            onClick={() => openUpdateAgrModal(demo)}
                                                        >
                                                            <ClipboardDocumentIcon className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                    <button
                                                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444' }}
                                                        title="Delete"
                                                        onClick={() => setDeleteModal(demo)}
                                                    >
                                                        <TrashIcon className="w-5 h-5" />
                                                    </button>
                                                    {agrStatus === "SIGNED" && (
                                                        <button
                                                            style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#16a34a' }}
                                                            title="Send Subscription Link"
                                                            onClick={() => openSubModal(demo)}
                                                        >
                                                            <CurrencyDollarIcon className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                    {(demo.account_status === "ACTIVE" || demo.account_status === "COMPLETED") && (
                                                        <>
                                                            {demo.account_status === "ACTIVE" && (
                                                                <span style={{
                                                                    background: '#d1fae5', color: '#059669',
                                                                    padding: '4px 10px', borderRadius: '20px',
                                                                    fontSize: '12px', fontWeight: 600,
                                                                }}>
                                                                    Active
                                                                </span>
                                                            )}
                                                            <button
                                                                title={demo.account_status === "ACTIVE" ? "Click to Deactivate" : "Click to Activate"}
                                                                onClick={() => openAccountActionModal(demo, demo.account_status === "ACTIVE" ? "deactivate" : "activate")}
                                                                style={{
                                                                    position: 'relative', width: '44px', height: '24px',
                                                                    borderRadius: '12px', border: 'none', cursor: 'pointer', padding: 0,
                                                                    background: demo.account_status === "ACTIVE" ? '#16a34a' : '#ef4444',
                                                                    transition: 'background 0.3s ease',
                                                                }}
                                                            >
                                                                <span style={{
                                                                    position: 'absolute', top: '3px',
                                                                    left: demo.account_status === "ACTIVE" ? '23px' : '3px',
                                                                    width: '18px', height: '18px', borderRadius: '50%',
                                                                    background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                                                                    transition: 'left 0.2s ease',
                                                                }} />
                                                            </button>
                                                        </>
                                                    )}
                                                </>
                                            )}
                                        </div></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ════════════ EDIT DEMO MODAL ════════════ */}
            {mounted && editModal && createPortal(
                <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) closeEditModal(); }}>
                    <div className="modal-card">
                        <div className="modal-header">
                            <div>
                                <h3 className="modal-title">Edit Demo</h3>
                                <p className="modal-subtitle">
                                    {editModal.user.first_name} {editModal.user.last_name} — {editModal.user.company_name}
                                </p>
                            </div>
                            <button onClick={closeEditModal} className="modal-close-btn">
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Demo Date & Time</label>
                                <input type="datetime-local" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="form-input" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Demo Status</label>
                                <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className="form-select">
                                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div className="form-group-last">
                                <label className="form-label">Remarks <span className="form-label-hint">(optional)</span></label>
                                <textarea value={editRemarks} onChange={(e) => setEditRemarks(e.target.value)} rows={3} placeholder="Add any notes about this demo..." className="form-textarea" />
                            </div>
                            <div className="modal-actions">
                                <button onClick={closeEditModal} disabled={editSaving} className="btn-cancel">Cancel</button>
                                <button onClick={handleEditSave} disabled={editSaving} className="btn-save">
                                    {editSaving ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* ════════════ UPDATE AGREEMENT STATUS MODAL ════════════ */}
            {mounted && updateAgrModal && createPortal(
                <div className="sa-modal-backdrop" style={modalBackdrop} onMouseDown={(e) => { if (e.target === e.currentTarget) closeUpdateAgrModal(); }}>
                    <div className="sa-modal-card" style={modalBox}>
                        <div style={modalHeader}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#111827' }}>Update Agreement Status</h3>
                                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>
                                    {updateAgrModal.user.first_name} {updateAgrModal.user.last_name} — {updateAgrModal.user.email}
                                </p>
                            </div>
                            <button onClick={closeUpdateAgrModal} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af', padding: '4px' }}>
                                <XMarkIcon style={{ width: '20px', height: '20px' }} />
                            </button>
                        </div>
                        <div style={{ padding: '24px' }}>
                            {/* Current Status */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={labelStyle}>Current Status</label>
                                <span style={{
                                    display: 'inline-block', background: '#dbeafe', color: '#1e40af',
                                    padding: '4px 12px', borderRadius: '9999px', fontSize: '13px', fontWeight: 500,
                                }}>
                                    SENT
                                </span>
                            </div>

                            {/* New Status */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={labelStyle}>New Status</label>
                                <select
                                    value={updateAgrStatus}
                                    onChange={(e) => setUpdateAgrStatus(e.target.value)}
                                    style={{ ...inputStyle, background: '#fff' }}
                                >
                                    <option value="SIGNED">SIGNED</option>
                                    <option value="REJECTED">REJECTED</option>
                                </select>
                            </div>

                            {/* Remarks */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={labelStyle}>Remarks <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span></label>
                                <textarea value={updateAgrRemarks} onChange={(e) => setUpdateAgrRemarks(e.target.value)} rows={3} placeholder="Any notes..." style={{ ...inputStyle, resize: 'vertical' }} />
                            </div>

                            {/* Upload Signed PDF — only when SIGNED */}
                            {updateAgrStatus === "SIGNED" && (
                                <div style={{ marginBottom: '24px' }}>
                                    <label style={labelStyle}>Upload Signed Agreement <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span></label>
                                    <input
                                        ref={signedFileInputRef}
                                        type="file"
                                        accept=".pdf"
                                        style={{ display: 'none' }}
                                        onChange={(e) => {
                                            const file = e.target.files?.[0] || null;
                                            if (file && file.type !== 'application/pdf') {
                                                toast.error("Only PDF files allowed");
                                                return;
                                            }
                                            setUpdateAgrFile(file);
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => signedFileInputRef.current?.click()}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '8px',
                                            padding: '10px 16px', border: '1px dashed #d1d5db', borderRadius: '8px',
                                            background: '#f9fafb', color: '#4b5563', fontSize: '14px',
                                            cursor: 'pointer', width: '100%', justifyContent: 'center',
                                        }}
                                    >
                                        <DocumentArrowUpIcon style={{ width: '18px', height: '18px' }} />
                                        {updateAgrFile ? updateAgrFile.name : "Choose signed PDF..."}
                                    </button>
                                    {updateAgrFile && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', fontSize: '13px', color: '#166534' }}>
                                            <CheckCircleIcon style={{ width: '16px', height: '16px' }} />
                                            {updateAgrFile.name} ({(updateAgrFile.size / 1024).toFixed(1)} KB)
                                            <button onClick={() => { setUpdateAgrFile(null); if (signedFileInputRef.current) signedFileInputRef.current.value = ''; }} style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '13px', padding: 0 }}>Remove</button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {updateAgrStatus !== "SIGNED" && <div style={{ marginBottom: '8px' }} />}

                            {/* Buttons */}
                            <button
                                onClick={handleUpdateAgreement}
                                disabled={updateAgrSaving}
                                style={{
                                    width: '100%', padding: '12px', border: 'none', borderRadius: '8px',
                                    background: updateAgrSaving ? '#93c5fd' : '#2563eb',
                                    color: '#fff', fontSize: '14px', fontWeight: 600,
                                    cursor: updateAgrSaving ? 'not-allowed' : 'pointer',
                                    marginBottom: '8px',
                                }}
                            >
                                {updateAgrSaving ? "Updating..." : "Update Status"}
                            </button>
                            <button onClick={closeUpdateAgrModal} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px', background: '#fff', color: '#374151', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* ════════════ SEND SUBSCRIPTION LINK MODAL ════════════ */}
            {mounted && subModal && createPortal(
                <div className="sa-modal-backdrop" style={modalBackdrop} onMouseDown={(e) => { if (e.target === e.currentTarget) closeSubModal(); }}>
                    <div className="sa-modal-card" style={{ ...modalBox, maxWidth: '520px' }}>
                        <div style={modalHeader}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#111827' }}>Send Subscription Link</h3>
                                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>
                                    {subModal.user.first_name} {subModal.user.last_name} — {subModal.user.email}
                                </p>
                            </div>
                            <button onClick={closeSubModal} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af', padding: '4px' }}>
                                <XMarkIcon style={{ width: '20px', height: '20px' }} />
                            </button>
                        </div>
                        <div style={{ padding: '24px' }}>
                            {subResultUrl ? (
                                /* ── Success: show link ── */
                                <div>
                                    <div style={{
                                        textAlign: 'center', marginBottom: '20px',
                                    }}>
                                        <CheckCircleIcon style={{ width: '48px', height: '48px', color: '#22c55e', margin: '0 auto 12px' }} />
                                        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#111827' }}>Link Sent Successfully!</h4>
                                        <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>
                                            An email has been sent to {subModal.user.email}
                                        </p>
                                    </div>

                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={labelStyle}>Checkout URL</label>
                                        <div style={{
                                            display: 'flex', gap: '8px', alignItems: 'center',
                                        }}>
                                            <input
                                                readOnly
                                                value={subResultUrl}
                                                style={{ ...inputStyle, background: '#f9fafb', fontSize: '12px', flex: 1 }}
                                            />
                                            <button
                                                onClick={handleCopySubLink}
                                                style={{
                                                    padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '8px',
                                                    background: subCopied ? '#dcfce7' : '#fff', cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px',
                                                    color: subCopied ? '#166534' : '#374151', fontWeight: 500, whiteSpace: 'nowrap',
                                                }}
                                            >
                                                <ClipboardDocumentIcon style={{ width: '16px', height: '16px' }} />
                                                {subCopied ? "Copied!" : "Copy"}
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        onClick={closeSubModal}
                                        style={{
                                            width: '100%', padding: '12px', border: 'none', borderRadius: '8px',
                                            background: '#16a34a', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                                        }}
                                    >
                                        Done
                                    </button>
                                </div>
                            ) : (
                                /* ── Form: select plan, billing, discount ── */
                                <div>
                                    {/* Plan Select */}
                                    <div style={{ marginBottom: '16px' }}>
                                        <label style={labelStyle}>Subscription Plan</label>
                                        {subPlansLoading ? (
                                            <div style={{ padding: '10px', fontSize: '13px', color: '#6b7280' }}>Loading plans...</div>
                                        ) : (
                                            <select
                                                value={subSelectedPlan?.subscription_plan_id || ""}
                                                onChange={(e) => {
                                                    const plan = subPlans.find(p => p.subscription_plan_id === e.target.value);
                                                    setSubSelectedPlan(plan || null);
                                                }}
                                                style={{ ...inputStyle, background: '#fff' }}
                                            >
                                                <option value="">Select a plan...</option>
                                                {subPlans.map(plan => (
                                                    <option key={plan.subscription_plan_id} value={plan.subscription_plan_id}>
                                                        {plan.plan_name} — ${plan.price}/mo (up to {plan.user_limit} users)
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    </div>

                                    {/* Plan Details Card */}
                                    {subSelectedPlan && (
                                        <div style={{
                                            marginBottom: '16px', padding: '12px 16px', background: '#f0fdf4',
                                            border: '1px solid #bbf7d0', borderRadius: '8px',
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                <span style={{ fontSize: '14px', fontWeight: 600, color: '#166534' }}>{subSelectedPlan.plan_name}</span>
                                                <span style={{ fontSize: '14px', fontWeight: 600, color: '#166534' }}>${subSelectedPlan.price}/mo</span>
                                            </div>
                                            {subSelectedPlan.description && (
                                                <p style={{ margin: '4px 0 8px', fontSize: '12px', color: '#4b5563' }}>{subSelectedPlan.description}</p>
                                            )}
                                            {subSelectedPlan.features && subSelectedPlan.features.length > 0 && (
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                    {subSelectedPlan.features.map((f, i) => (
                                                        <span key={i} style={{
                                                            fontSize: '11px', background: '#dcfce7', color: '#166534',
                                                            padding: '2px 8px', borderRadius: '9999px',
                                                        }}>
                                                            {f}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Billing Cycle */}
                                    <div style={{ marginBottom: '16px' }}>
                                        <label style={labelStyle}>Billing Cycle</label>
                                        <div style={{ display: 'flex', gap: '12px' }}>
                                            {(["monthly", "annual"] as const).map(cycle => (
                                                <label
                                                    key={cycle}
                                                    style={{
                                                        flex: 1, display: 'flex', alignItems: 'center', gap: '8px',
                                                        padding: '10px 14px', border: `2px solid ${subBillingCycle === cycle ? '#22c55e' : '#e5e7eb'}`,
                                                        borderRadius: '8px', cursor: 'pointer',
                                                        background: subBillingCycle === cycle ? '#f0fdf4' : '#fff',
                                                        transition: 'all 0.15s',
                                                    }}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="billing-cycle"
                                                        checked={subBillingCycle === cycle}
                                                        onChange={() => setSubBillingCycle(cycle)}
                                                        style={{ accentColor: '#22c55e' }}
                                                    />
                                                    <div>
                                                        <div style={{ fontSize: '14px', fontWeight: 500, color: '#111827', textTransform: 'capitalize' }}>
                                                            {cycle}
                                                        </div>
                                                        {cycle === "annual" && (
                                                            <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: 500 }}>Save 10%</div>
                                                        )}
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Discount */}
                                    <div style={{ marginBottom: '16px' }}>
                                        <label style={labelStyle}>Discount % <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span></label>
                                        <input
                                            type="number"
                                            min={0}
                                            max={100}
                                            value={subDiscount}
                                            onChange={(e) => setSubDiscount(Math.min(100, Math.max(0, Number(e.target.value))))}
                                            style={inputStyle}
                                            placeholder="0"
                                        />
                                    </div>

                                    {/* Price Summary */}
                                    {subSelectedPlan && (
                                        <div style={{
                                            marginBottom: '24px', padding: '16px', background: '#f9fafb',
                                            borderRadius: '8px', border: '1px solid #e5e7eb',
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#6b7280', marginBottom: '6px' }}>
                                                <span>Base Price</span>
                                                <span>${subSelectedPlan.price.toFixed(2)}/mo</span>
                                            </div>
                                            {subDiscount > 0 && (
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#dc2626', marginBottom: '6px' }}>
                                                    <span>Discount ({subDiscount}%)</span>
                                                    <span>-${(subSelectedPlan.price * subDiscount / 100).toFixed(2)}</span>
                                                </div>
                                            )}
                                            {subBillingCycle === "annual" && (
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#16a34a', marginBottom: '6px' }}>
                                                    <span>Annual discount (10%)</span>
                                                    <span>Applied to 12 months</span>
                                                </div>
                                            )}
                                            <div style={{
                                                display: 'flex', justifyContent: 'space-between', fontSize: '16px',
                                                fontWeight: 700, color: '#111827', paddingTop: '8px',
                                                borderTop: '1px solid #e5e7eb',
                                            }}>
                                                <span>Total</span>
                                                <span style={{ color: '#22c55e' }}>
                                                    ${getSubFinalPrice().toFixed(2)}
                                                    <span style={{ fontSize: '12px', fontWeight: 400, color: '#6b7280' }}>
                                                        /{subBillingCycle === "annual" ? "yr" : "mo"}
                                                    </span>
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Send Button */}
                                    <button
                                        onClick={handleSendSubLink}
                                        disabled={!subSelectedPlan || subSending}
                                        style={{
                                            width: '100%', padding: '12px', border: 'none', borderRadius: '8px',
                                            background: !subSelectedPlan || subSending ? '#86efac' : '#16a34a',
                                            color: '#fff', fontSize: '14px', fontWeight: 600,
                                            cursor: !subSelectedPlan || subSending ? 'not-allowed' : 'pointer',
                                            marginBottom: '8px',
                                        }}
                                    >
                                        {subSending ? "Generating & Sending..." : "Generate & Send Link"}
                                    </button>
                                    <button
                                        onClick={closeSubModal}
                                        style={{
                                            width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px',
                                            background: '#fff', color: '#374151', fontSize: '14px', fontWeight: 500, cursor: 'pointer',
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* ════════════ ACTIVATE/DEACTIVATE MODAL ════════════ */}
            {mounted && accountActionModal && createPortal(
                <div className="sa-modal-backdrop" style={modalBackdrop} onMouseDown={(e) => { if (e.target === e.currentTarget) closeAccountActionModal(); }}>
                    <div className="sa-modal-card" style={modalBox}>
                        <div style={modalHeader}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#111827' }}>
                                    {accountActionModal.action === "activate" ? "Activate Account" : "Deactivate Account"}
                                </h3>
                                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>
                                    {accountActionModal.demo.user.first_name} {accountActionModal.demo.user.last_name} — {accountActionModal.demo.user.email}
                                </p>
                            </div>
                            <button onClick={closeAccountActionModal} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af', padding: '4px' }}>
                                <XMarkIcon style={{ width: '20px', height: '20px' }} />
                            </button>
                        </div>
                        <div style={{ padding: '24px' }}>
                            <div style={{
                                padding: '16px', borderRadius: '8px', marginBottom: '24px',
                                background: accountActionModal.action === "activate" ? '#f0fdf4' : '#fef2f2',
                                border: `1px solid ${accountActionModal.action === "activate" ? '#bbf7d0' : '#fecaca'}`,
                            }}>
                                <p style={{
                                    margin: 0, fontSize: '14px',
                                    color: accountActionModal.action === "activate" ? '#166534' : '#991b1b',
                                }}>
                                    {accountActionModal.action === "activate"
                                        ? "This will send login credentials to the client."
                                        : "Client will lose access to IMS dashboard."}
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button
                                    onClick={closeAccountActionModal}
                                    disabled={accountActionLoading}
                                    style={{
                                        padding: '10px 20px', border: '1px solid #d1d5db', borderRadius: '8px',
                                        background: '#fff', color: '#374151', fontSize: '14px', fontWeight: 500, cursor: 'pointer',
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAccountActionConfirm}
                                    disabled={accountActionLoading}
                                    style={{
                                        padding: '10px 20px', border: 'none', borderRadius: '8px',
                                        background: accountActionLoading
                                            ? (accountActionModal.action === "activate" ? '#86efac' : '#fca5a5')
                                            : (accountActionModal.action === "activate" ? '#22c55e' : '#ef4444'),
                                        color: '#fff', fontSize: '14px', fontWeight: 600,
                                        cursor: accountActionLoading ? 'not-allowed' : 'pointer',
                                    }}
                                >
                                    {accountActionLoading
                                        ? (accountActionModal.action === "activate" ? "Activating..." : "Deactivating...")
                                        : "Confirm"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* ════════════ DELETE USER MODAL ════════════ */}
            {mounted && deleteModal && createPortal(
                <div className="sa-modal-backdrop" style={modalBackdrop} onMouseDown={(e) => { if (e.target === e.currentTarget) { setDeleteModal(null); setDeleteLoading(false); } }}>
                    <div className="sa-modal-card" style={modalBox}>
                        <div style={modalHeader}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#111827' }}>Delete User</h3>
                                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>
                                    {deleteModal.user.first_name} {deleteModal.user.last_name} — {deleteModal.user.email}
                                </p>
                            </div>
                            <button onClick={() => { setDeleteModal(null); setDeleteLoading(false); }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af', padding: '4px' }}>
                                <XMarkIcon style={{ width: '20px', height: '20px' }} />
                            </button>
                        </div>
                        <div style={{ padding: '24px' }}>
                            <div style={{
                                padding: '16px', borderRadius: '8px', marginBottom: '24px',
                                background: '#fef2f2', border: '1px solid #fecaca',
                            }}>
                                <p style={{ margin: 0, fontSize: '14px', color: '#991b1b' }}>
                                    This user will be marked as deleted. All their data (subscriptions, agreements, demos) will be preserved in records.
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button
                                    onClick={() => { setDeleteModal(null); setDeleteLoading(false); }}
                                    disabled={deleteLoading}
                                    style={{
                                        padding: '10px 20px', border: '1px solid #d1d5db', borderRadius: '8px',
                                        background: '#fff', color: '#374151', fontSize: '14px', fontWeight: 500, cursor: 'pointer',
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteConfirm}
                                    disabled={deleteLoading}
                                    style={{
                                        padding: '10px 20px', border: 'none', borderRadius: '8px',
                                        background: deleteLoading ? '#fca5a5' : '#ef4444',
                                        color: '#fff', fontSize: '14px', fontWeight: 600,
                                        cursor: deleteLoading ? 'not-allowed' : 'pointer',
                                    }}
                                >
                                    {deleteLoading ? "Deleting..." : "Delete"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* ════════════ REVOKE FREE ACCESS MODAL ════════════ */}
            {mounted && revokeModal && createPortal(
                <div className="sa-modal-backdrop" style={modalBackdrop} onMouseDown={(e) => { if (e.target === e.currentTarget) { setRevokeModal(null); setRevokeLoading(false); } }}>
                    <div className="sa-modal-card" style={modalBox}>
                        <div style={modalHeader}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#111827' }}>Revoke Free Access</h3>
                                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>
                                    {revokeModal.user.first_name} {revokeModal.user.last_name} — {revokeModal.user.email}
                                </p>
                            </div>
                            <button onClick={() => { setRevokeModal(null); setRevokeLoading(false); }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af', padding: '4px' }}>
                                <XMarkIcon style={{ width: '20px', height: '20px' }} />
                            </button>
                        </div>
                        <div style={{ padding: '24px' }}>
                            <div style={{
                                padding: '16px', borderRadius: '8px', marginBottom: '24px',
                                background: '#fef2f2', border: '1px solid #fecaca',
                            }}>
                                <p style={{ margin: 0, fontSize: '14px', color: '#991b1b' }}>
                                    This will remove complimentary access for <strong>{revokeModal.user.first_name} {revokeModal.user.last_name}</strong>. Their previous paid plan will be restored if available.
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button
                                    onClick={() => { setRevokeModal(null); setRevokeLoading(false); }}
                                    disabled={revokeLoading}
                                    style={{
                                        padding: '10px 20px', border: '1px solid #d1d5db', borderRadius: '8px',
                                        background: '#fff', color: '#374151', fontSize: '14px', fontWeight: 500, cursor: 'pointer',
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRevokeConfirm}
                                    disabled={revokeLoading}
                                    style={{
                                        padding: '10px 20px', border: 'none', borderRadius: '8px',
                                        background: revokeLoading ? '#fca5a5' : '#ef4444',
                                        color: '#fff', fontSize: '14px', fontWeight: 600,
                                        cursor: revokeLoading ? 'not-allowed' : 'pointer',
                                    }}
                                >
                                    {revokeLoading ? "Revoking..." : "Revoke"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* ════════════ GRANT FREE ACCESS MODAL ════════════ */}
            {mounted && giftModal && createPortal(
                <div className="sa-modal-backdrop" style={modalBackdrop} onMouseDown={(e) => { if (e.target === e.currentTarget) closeGiftModal(); }}>
                    <div className="sa-modal-card" style={modalBox}>
                        <div style={modalHeader}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#111827' }}>Grant Free Access</h3>
                                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>
                                    {giftModal.user.first_name} {giftModal.user.last_name} — {giftModal.user.email}
                                </p>
                            </div>
                            <button onClick={closeGiftModal} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af', padding: '4px' }}>
                                <XMarkIcon style={{ width: '20px', height: '20px' }} />
                            </button>
                        </div>
                        <div style={{ padding: '24px' }}>
                            {/* Plan */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={labelStyle}>Subscription Plan</label>
                                {giftPlansLoading ? (
                                    <div style={{ padding: '10px', fontSize: '13px', color: '#6b7280' }}>Loading plans...</div>
                                ) : (
                                    <select value={giftSelectedPlan} onChange={(e) => setGiftSelectedPlan(e.target.value)} style={{ ...inputStyle, background: '#fff' }}>
                                        <option value="">Select a plan...</option>
                                        {giftPlans.map(p => (
                                            <option key={p.subscription_plan_id} value={p.subscription_plan_id}>
                                                {p.plan_name} — ${p.price}/mo
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>
                            {/* Duration Type */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={labelStyle}>Duration Type</label>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    {(["LIMITED", "UNLIMITED"] as const).map(dt => (
                                        <label key={dt} style={{
                                            flex: 1, display: 'flex', alignItems: 'center', gap: '8px',
                                            padding: '10px 14px', border: `2px solid ${giftDurationType === dt ? '#7c3aed' : '#e5e7eb'}`,
                                            borderRadius: '8px', cursor: 'pointer',
                                            background: giftDurationType === dt ? '#f5f3ff' : '#fff',
                                            transition: 'all 0.15s',
                                        }}>
                                            <input type="radio" name="gift-duration" checked={giftDurationType === dt} onChange={() => setGiftDurationType(dt)} style={{ accentColor: '#7c3aed' }} />
                                            <span style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>
                                                {dt === "LIMITED" ? "Limited Duration" : "Unlimited"}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            {/* Duration Days */}
                            {giftDurationType === "LIMITED" && (
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={labelStyle}>Duration</label>
                                    <select value={giftDurationDays} onChange={(e) => setGiftDurationDays(Number(e.target.value))} style={{ ...inputStyle, background: '#fff' }}>
                                        <option value={30}>30 Days</option>
                                        <option value={90}>3 Months</option>
                                        <option value={180}>6 Months</option>
                                        <option value={365}>1 Year</option>
                                    </select>
                                </div>
                            )}
                            {/* Reason */}
                            <div style={{ marginBottom: '24px' }}>
                                <label style={labelStyle}>Reason <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span></label>
                                <textarea value={giftReason} onChange={(e) => setGiftReason(e.target.value)} rows={2} placeholder="e.g. Internal use, Testing..." style={{ ...inputStyle, resize: 'vertical' }} />
                            </div>
                            {/* Buttons */}
                            <button
                                onClick={handleGrantFreeAccess}
                                disabled={!giftSelectedPlan || giftSaving}
                                style={{
                                    width: '100%', padding: '12px', border: 'none', borderRadius: '8px',
                                    background: !giftSelectedPlan || giftSaving ? '#c4b5fd' : '#7c3aed',
                                    color: '#fff', fontSize: '14px', fontWeight: 600,
                                    cursor: !giftSelectedPlan || giftSaving ? 'not-allowed' : 'pointer',
                                    marginBottom: '8px',
                                }}
                            >
                                {giftSaving ? "Granting..." : "Grant Access"}
                            </button>
                            <button onClick={closeGiftModal} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px', background: '#fff', color: '#374151', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* ════════════ ADD USER + FREE ACCESS MODAL ════════════ */}
            {mounted && addUserModal && createPortal(
                <div className="sa-modal-backdrop" style={modalBackdrop} onMouseDown={(e) => { if (e.target === e.currentTarget) closeAddUserModal(); }}>
                    <div className="sa-modal-card" style={{ ...modalBox, maxWidth: '540px' }}>
                        <div style={modalHeader}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#111827' }}>Add New User</h3>
                                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>Create user with complimentary access</p>
                            </div>
                            <button onClick={closeAddUserModal} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af', padding: '4px' }}>
                                <XMarkIcon style={{ width: '20px', height: '20px' }} />
                            </button>
                        </div>
                        <div style={{ padding: '24px' }}>
                            {addUserDeletedInfo ? (
                                /* ── Deleted user warning ── */
                                <div>
                                    <div style={{
                                        padding: '16px', borderRadius: '8px', marginBottom: '20px',
                                        background: '#fffbeb', border: '1px solid #fde68a',
                                        display: 'flex', gap: '12px', alignItems: 'flex-start',
                                    }}>
                                        <span style={{ fontSize: '20px', lineHeight: 1 }}>&#9888;&#65039;</span>
                                        <div>
                                            <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#92400e' }}>
                                                This email belongs to a deleted user.
                                            </p>
                                            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#a16207' }}>
                                                You can restore their account and grant free access, or cancel and use a different email.
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleRestoreAndGrant}
                                        disabled={addUserRestoring}
                                        style={{
                                            width: '100%', padding: '12px', border: 'none', borderRadius: '8px',
                                            background: addUserRestoring ? '#86efac' : '#16a34a',
                                            color: '#fff', fontSize: '14px', fontWeight: 600,
                                            cursor: addUserRestoring ? 'not-allowed' : 'pointer',
                                            marginBottom: '8px',
                                        }}
                                    >
                                        {addUserRestoring ? "Restoring..." : "Restore & Grant Access"}
                                    </button>
                                    <button
                                        onClick={closeAddUserModal}
                                        style={{
                                            width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px',
                                            background: '#fff', color: '#374151', fontSize: '14px', fontWeight: 500, cursor: 'pointer',
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            ) : (
                                /* ── Normal form ── */
                                <div>
                                {/* User Info Section */}
                            <p style={{ fontSize: '13px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px', marginTop: 0 }}>User Info</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                                <div>
                                    <label style={labelStyle}>First Name *</label>
                                    <input value={addUserForm.firstName} onChange={(e) => setAddUserForm(f => ({ ...f, firstName: e.target.value }))} style={inputStyle} placeholder="John" />
                                </div>
                                <div>
                                    <label style={labelStyle}>Last Name *</label>
                                    <input value={addUserForm.lastName} onChange={(e) => setAddUserForm(f => ({ ...f, lastName: e.target.value }))} style={inputStyle} placeholder="Doe" />
                                </div>
                            </div>
                            <div style={{ marginBottom: '12px' }}>
                                <label style={labelStyle}>Email *</label>
                                <input type="email" value={addUserForm.email} onChange={(e) => setAddUserForm(f => ({ ...f, email: e.target.value }))} style={inputStyle} placeholder="john@company.com" />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                                <div>
                                    <label style={labelStyle}>Company Name *</label>
                                    <input value={addUserForm.companyName} onChange={(e) => setAddUserForm(f => ({ ...f, companyName: e.target.value }))} style={inputStyle} placeholder="Acme Dental" />
                                </div>
                                <div>
                                    <label style={labelStyle}>Contact Number</label>
                                    <input value={addUserForm.contactNumber} onChange={(e) => setAddUserForm(f => ({ ...f, contactNumber: e.target.value }))} style={inputStyle} placeholder="+1 234 567 8900" />
                                </div>
                            </div>

                            {/* Free Access Section */}
                            <p style={{ fontSize: '13px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px', marginTop: 0, paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>Free Access</p>
                            <div style={{ marginBottom: '12px' }}>
                                <label style={labelStyle}>Subscription Plan</label>
                                {addUserPlansLoading ? (
                                    <div style={{ padding: '10px', fontSize: '13px', color: '#6b7280' }}>Loading plans...</div>
                                ) : (
                                    <select value={addUserPlan} onChange={(e) => setAddUserPlan(e.target.value)} style={{ ...inputStyle, background: '#fff' }}>
                                        <option value="">Select a plan...</option>
                                        {addUserPlans.map(p => (
                                            <option key={p.subscription_plan_id} value={p.subscription_plan_id}>
                                                {p.plan_name} — ${p.price}/mo
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>
                            <div style={{ marginBottom: '12px' }}>
                                <label style={labelStyle}>Duration Type</label>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    {(["LIMITED", "UNLIMITED"] as const).map(dt => (
                                        <label key={dt} style={{
                                            flex: 1, display: 'flex', alignItems: 'center', gap: '8px',
                                            padding: '10px 14px', border: `2px solid ${addUserDurationType === dt ? '#2563eb' : '#e5e7eb'}`,
                                            borderRadius: '8px', cursor: 'pointer',
                                            background: addUserDurationType === dt ? '#eff6ff' : '#fff',
                                            transition: 'all 0.15s',
                                        }}>
                                            <input type="radio" name="adduser-duration" checked={addUserDurationType === dt} onChange={() => setAddUserDurationType(dt)} style={{ accentColor: '#2563eb' }} />
                                            <span style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>
                                                {dt === "LIMITED" ? "Limited" : "Unlimited"}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            {addUserDurationType === "LIMITED" && (
                                <div style={{ marginBottom: '12px' }}>
                                    <label style={labelStyle}>Duration</label>
                                    <select value={addUserDurationDays} onChange={(e) => setAddUserDurationDays(Number(e.target.value))} style={{ ...inputStyle, background: '#fff' }}>
                                        <option value={30}>30 Days</option>
                                        <option value={90}>3 Months</option>
                                        <option value={180}>6 Months</option>
                                        <option value={365}>1 Year</option>
                                    </select>
                                </div>
                            )}
                            <div style={{ marginBottom: '24px' }}>
                                <label style={labelStyle}>Reason <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span></label>
                                <textarea value={addUserReason} onChange={(e) => setAddUserReason(e.target.value)} rows={2} placeholder="e.g. Internal use, Testing..." style={{ ...inputStyle, resize: 'vertical' }} />
                            </div>
                            {/* Buttons */}
                            <button
                                onClick={handleCreateUserWithAccess}
                                disabled={!addUserForm.firstName || !addUserForm.lastName || !addUserForm.email || !addUserForm.companyName || !addUserPlan || addUserSaving}
                                style={{
                                    width: '100%', padding: '12px', border: 'none', borderRadius: '8px',
                                    background: addUserSaving ? '#93c5fd' : '#2563eb',
                                    color: '#fff', fontSize: '14px', fontWeight: 600,
                                    cursor: addUserSaving ? 'not-allowed' : 'pointer',
                                    opacity: (!addUserForm.firstName || !addUserForm.lastName || !addUserForm.email || !addUserForm.companyName || !addUserPlan) ? 0.6 : 1,
                                    marginBottom: '8px',
                                }}
                            >
                                {addUserSaving ? "Creating..." : "Create & Grant Access"}
                            </button>
                            <button onClick={closeAddUserModal} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px', background: '#fff', color: '#374151', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>
                                Cancel
                            </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* ════════════ TIMELINE MODAL ════════════ */}
            {mounted && timelineOpen && selectedTimelineDemo && createPortal(
                <div className="timeline-overlay" onClick={(e) => { if (e.target === e.currentTarget) setTimelineOpen(false); }}>
                    <div className="timeline-card">
                        {/* Header */}
                        <div className="timeline-header">
                            <div>
                                <h3 className="timeline-title">Demo History</h3>
                                <p className="timeline-subtitle">
                                    {selectedTimelineDemo.user?.first_name} {selectedTimelineDemo.user?.last_name} &middot; {selectedTimelineDemo.user?.email}
                                </p>
                            </div>
                            <button onClick={() => setTimelineOpen(false)} className="modal-close-btn">
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Timeline Content */}
                        <div className="timeline-body">
                            {timelineLoading ? (
                                <div className="timeline-spinner">
                                    <div className="spinner" />
                                </div>
                            ) : timelineLog.length === 0 ? (
                                <div className="timeline-empty">
                                    <div className="timeline-empty-icon">
                                        <ClockIcon className="w-6 h-6" />
                                    </div>
                                    <p className="timeline-empty-title">No history recorded yet</p>
                                    <p className="timeline-empty-hint">Status changes will appear here</p>
                                </div>
                            ) : (
                                <div className="timeline-line">
                                    {timelineLog.map((entry: TimelineEntry, index: number) => {
                                        const dotClass = `timeline-dot timeline-dot-${entry.status?.toLowerCase() || 'pending'}`;
                                        const badgeClass = `timeline-badge badge-${entry.status?.toLowerCase() || 'pending'}`;
                                        return (
                                            <div key={index} className="timeline-entry">
                                                <div className={dotClass} />
                                                <p className="timeline-date">
                                                    {new Date(entry.date).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                                </p>
                                                <span className={badgeClass}>
                                                    {entry.status}
                                                </span>
                                                {entry.demo_date && (
                                                    <p className="timeline-scheduled-date">
                                                        &#x1F4C5; Scheduled for: {new Date(entry.demo_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                                    </p>
                                                )}
                                                {entry.remark && (
                                                    <p className="timeline-remark">
                                                        &ldquo;{entry.remark}&rdquo;
                                                    </p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
