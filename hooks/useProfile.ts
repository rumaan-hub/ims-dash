"use client";

import { useEffect, useMemo, useState } from "react";
import {
    Client,
    License,
    Shipping,
    Billing,
    CreateClientPayload,
    useProfileStore,
} from "@/store/reducers/profileStore";
import toast from "react-hot-toast";

// ─────────────────────────────────────────────────────────────
// Blank form shapes
// ─────────────────────────────────────────────────────────────

const BLANK_CLIENT = {
    client_id: "", company_name: "", first_name: "", last_name: "",
    email: "", contact_number: "", permanent_address: "",
    city: "", state: "", zip_code: "", agree_to_terms: true,
};

const BLANK_LICENSE: Omit<License, "license_id" | "client_id"> = {
    license_type: "", license_number: "", expiry_date: "", state: "", status: "Active",
};

const BLANK_SHIPPING: Omit<Shipping, "shipping_id" | "client_id"> = {
    office_name: "", address: "", city: "", state: "", zip_code: "", phone: "", extension: "",
};

const BLANK_BILLING: Omit<Billing, "billing_id" | "client_id" | "created_at"> = {
    billing_address: "", card_brand: "", expiry_month: 0, expiry_year: 0,
// last4: "",
    stripe_payment_method_id: "",
};

// ─────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────

export const useProfilePage = () => {
    const {
        client, clients, invoices, loading, error,
        fetchClients, fetchCurrentClient, fetchClientById,
        createClient, updateClient, deleteClient,
        addLicense, updateLicense, deleteLicense,
        addShipping, updateShipping, deleteShipping,
        addBilling, updateBilling, deleteBilling, fetchInvoices,
        mySubscription, mySubscriptionLoading, fetchMySubscription,
        paymentHistory, paymentHistoryLoading, fetchPaymentHistory,
        loginHistory, loginHistoryLoading, fetchLoginHistory,
        changePassword, forgotPassword,
    } = useProfileStore();

    // ── Tab ──────────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState("personal-info");

    useEffect(() => {
        if (activeTab === "billing-info" && client?.client_id) {
            fetchInvoices(client.client_id);
        }
        if (activeTab === "subscription") {
            fetchMySubscription();
            fetchPaymentHistory();
        }
        if (activeTab === "security-settings") {
            fetchLoginHistory();
        }
        // fetchers from zustand store are stable references — only re-run on tab/client change
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, client?.client_id]);

    // ── Search (client table) ────────────────────────────────
    const [search, setSearch] = useState("");

    // ── Client modal ─────────────────────────────────────────
    const [showModal, setShowModal] = useState(false);
    const [clientForm, setClientForm] = useState({ ...BLANK_CLIENT });

    // ── License modal ────────────────────────────────────────
    const [showLicenseModal, setShowLicenseModal] = useState(false);
    const [licenseForm, setLicenseForm] = useState<(typeof BLANK_LICENSE) & { license_id?: string }>({ ...BLANK_LICENSE });

    // ── Shipping modal ───────────────────────────────────────
    const [showShippingModal, setShowShippingModal] = useState(false);
    const [shippingForm, setShippingForm] = useState<(typeof BLANK_SHIPPING) & { shipping_id?: string }>({ ...BLANK_SHIPPING });

    // ── Billing modal ────────────────────────────────────────
    const [showBillingModal, setShowBillingModal] = useState(false);
    const [billingForm, setBillingForm] = useState<(typeof BLANK_BILLING) & { billing_id?: string }>({ ...BLANK_BILLING });

    // ── Personal-info form ────────────────────────────────────
    const [personalForm, setPersonalForm] = useState({
        company_name: "", first_name: "", last_name: "", email: "",
        contact_number: "", permanent_address: "", city: "", state: "", zip_code: "",
    });

    // ── Bootstrap ────────────────────────────────────────────
    useEffect(() => {
        // fetchCurrentClient returns the fully hydrated client (with relations)
        fetchCurrentClient();
        fetchClients();
        // initial-load only — fetchers from zustand store are stable references
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Sync personal form when client loads ──────────────────
    useEffect(() => {
        if (client) {
            // Sync editable form snapshot from server-fetched client; user can override via inputs.
            setPersonalForm({
                company_name: client.company_name ?? "",
                first_name: client.first_name ?? "",
                last_name: client.last_name ?? "",
                email: client.email ?? "",
                contact_number: client.contact_number ?? "",
                permanent_address: client.permanent_address ?? "",
                city: client.city ?? "",
                state: client.state ?? "",
                zip_code: client.zip_code ?? "",
            });
        }
    }, [client]);

    // ── Filtered client list ──────────────────────────────────
    const filteredClients = useMemo(() => {
        const q = search.toLowerCase();
        if (!q) return clients;
        return clients.filter((c) =>
            c.first_name.toLowerCase().includes(q) ||
            c.last_name.toLowerCase().includes(q) ||
            c.email.toLowerCase().includes(q) ||
            c.company_name.toLowerCase().includes(q)
        );
    }, [clients, search]);

    // ─────────────────────────────────────────────────────────
    // CLIENT CRUD helpers
    // ─────────────────────────────────────────────────────────

    const openAddClient = () => { setClientForm({ ...BLANK_CLIENT }); setShowModal(true); };
    const openEditClient = (c: Client) => {
        setClientForm({
            client_id: c.client_id,
            company_name: c.company_name,
            first_name: c.first_name,
            last_name: c.last_name,
            email: c.email,
            contact_number: c.contact_number ?? "",
            permanent_address: c.permanent_address ?? "",
            city: c.city ?? "",
            state: c.state ?? "",
            zip_code: c.zip_code ?? "",
            agree_to_terms: c.agree_to_terms,
        });
        setShowModal(true);
    };
    const closeModal = () => { setShowModal(false); setClientForm({ ...BLANK_CLIENT }); };

    const saveClient = async () => {
        if (!clientForm.company_name || !clientForm.first_name || !clientForm.last_name || !clientForm.email) {
            toast.error("Company name, first name, last name and email are required.");
            return;
        }
        const payload = {
            company_name: clientForm.company_name,
            first_name: clientForm.first_name,
            last_name: clientForm.last_name,
            email: clientForm.email,
            contact_number: clientForm.contact_number || undefined,
            permanent_address: clientForm.permanent_address || undefined,
            city: clientForm.city || undefined,
            state: clientForm.state || undefined,
            zip_code: clientForm.zip_code || undefined,
        };
        try {
            if (clientForm.client_id) {
                await updateClient(clientForm.client_id, payload);
                toast.success("Client updated!");
            } else {
                await createClient({ ...payload, agree_to_terms: clientForm.agree_to_terms } as CreateClientPayload);
                toast.success("Client created!");
            }
            await fetchClients();
            setShowModal(false);
        } catch (err) {
            toast.error("Failed to save client.");
            console.error(err);
        }
    };

    const removeClient = async () => {
        if (!clientForm.client_id) return;
        if (!confirm("Permanently delete this client? Cannot be undone.")) return;
        try {
            await deleteClient(clientForm.client_id);
            await fetchClients();
            setShowModal(false);
            toast.success("Client deleted.");
        } catch (err) {
            toast.error("Failed to delete client.");
            console.error(err);
        }
    };

    // ─────────────────────────────────────────────────────────
    // PERSONAL INFO save
    // ─────────────────────────────────────────────────────────

    const handlePersonalFormChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setPersonalForm((prev) => ({ ...prev, [name]: value }));
    };

    const savePersonalInfo = async () => {
        const targetId = client?.client_id;
        if (!targetId) { toast.error("No client record found."); return; }
        try {
            await updateClient(targetId, personalForm);
            await fetchCurrentClient();
            toast.success("Personal information saved!");
        } catch (err) {
            toast.error("Failed to save personal information.");
            console.error(err);
        }
    };

    // ─────────────────────────────────────────────────────────
    // LICENSE CRUD helpers
    // ─────────────────────────────────────────────────────────

    const openAddLicense = () => { setLicenseForm({ ...BLANK_LICENSE }); setShowLicenseModal(true); };
    const openEditLicense = (l: License) => {
        setLicenseForm({
            license_id: l.license_id,
            license_type: l.license_type,
            license_number: l.license_number,
            expiry_date: l.expiry_date?.substring(0, 10) ?? "",
            state: l.state,
            status: l.status,
        });
        setShowLicenseModal(true);
    };
    const closeLicenseModal = () => { setShowLicenseModal(false); setLicenseForm({ ...BLANK_LICENSE }); };

    const saveLicense = async () => {
        const clientId = client?.client_id;
        if (!clientId) { toast.error("No active client found."); return; }
        if (!licenseForm.license_type || !licenseForm.license_number || !licenseForm.expiry_date || !licenseForm.state) {
            toast.error("All license fields are required.");
            return;
        }
        try {
            if (licenseForm.license_id) {
                const { license_id, ...payload } = licenseForm;
                await updateLicense(license_id, payload);
                toast.success("License updated!");
            } else {
                const { license_id: _license_id, ...payload } = licenseForm;
                void _license_id;
                await addLicense(clientId, payload);
                toast.success("License added!");
            }
            await fetchCurrentClient(); // re-sync relations
            setShowLicenseModal(false);
        } catch (err) {
            toast.error("Failed to save license.");
            console.error(err);
        }
    };

    const removeLicense = async (licenseId: string) => {
        if (!confirm("Delete this license?")) return;
        try {
            await deleteLicense(licenseId);
            await fetchCurrentClient();
            toast.success("License deleted.");
        } catch (err) {
            toast.error("Failed to delete license.");
            console.error(err);
        }
    };

    // ─────────────────────────────────────────────────────────
    // SHIPPING CRUD helpers
    // ─────────────────────────────────────────────────────────

    const openAddShipping = () => { setShippingForm({ ...BLANK_SHIPPING }); setShowShippingModal(true); };
    const openEditShipping = (s: Shipping) => {
        setShippingForm({
            shipping_id: s.shipping_id,
            office_name: s.office_name,
            address: s.address,
            city: s.city,
            state: s.state,
            zip_code: s.zip_code,
            phone: s.phone ?? "",
            extension: s.extension ?? "",
        });
        setShowShippingModal(true);
    };
    const closeShippingModal = () => { setShowShippingModal(false); setShippingForm({ ...BLANK_SHIPPING }); };

    const saveShipping = async () => {
        const clientId = client?.client_id;
        if (!clientId) { toast.error("No active client found."); return; }
        if (!shippingForm.office_name || !shippingForm.address || !shippingForm.city || !shippingForm.state || !shippingForm.zip_code) {
            toast.error("Office name, address, city, state and zip are required.");
            return;
        }
        try {
            if (shippingForm.shipping_id) {
                const { shipping_id, ...payload } = shippingForm;
                await updateShipping(shipping_id, payload);
                toast.success("Shipping address updated!");
            } else {
                const { shipping_id: _shipping_id, ...payload } = shippingForm;
                void _shipping_id;
                await addShipping(clientId, payload);
                toast.success("Shipping address added!");
            }
            await fetchCurrentClient();
            setShowShippingModal(false);
        } catch (err) {
            toast.error("Failed to save shipping address.");
            console.error(err);
        }
    };

    const removeShipping = async (shippingId: string) => {
        if (!confirm("Delete this shipping address?")) return;
        try {
            await deleteShipping(shippingId);
            await fetchCurrentClient();
            toast.success("Shipping address deleted.");
        } catch (err) {
            toast.error("Failed to delete shipping address.");
            console.error(err);
        }
    };

    // ─────────────────────────────────────────────────────────
    // BILLING CRUD helpers
    // ─────────────────────────────────────────────────────────

    const openAddBilling = () => { setBillingForm({ ...BLANK_BILLING }); setShowBillingModal(true); };
    const openEditBilling = (b: Billing) => {
        setBillingForm({
            billing_id: b.billing_id,
            billing_address: b.billing_address,
            card_brand: b.card_brand ?? "",
            // last4: b.last4 ?? "",
            expiry_month: b.expiry_month ?? 0,
            expiry_year: b.expiry_year ?? 0,
        });
        setShowBillingModal(true);
    };
    const closeBillingModal = () => { setShowBillingModal(false); setBillingForm({ ...BLANK_BILLING }); };

    const saveBilling = async () => {
        const clientId = client?.client_id;
        if (!clientId) { toast.error("No active client found."); return; }
        if (!billingForm.billing_address) {
            toast.error("Billing address is required.");
            return;
        }
        try {
            if (billingForm.billing_id) {
                const { billing_id, ...payload } = billingForm;
                await updateBilling(billing_id, payload);
                toast.success("Billing record updated!");
            } else {
                const { billing_id: _billing_id, ...payload } = billingForm;
                void _billing_id;
                await addBilling(clientId, payload);
                toast.success("Billing record added!");
            }
            await fetchCurrentClient();
            setShowBillingModal(false);
        } catch (err) {
            toast.error("Failed to save billing record.");
            console.error(err);
        }
    };

    const removeBilling = async (billingId: string) => {
        if (!confirm("Delete this billing record?")) return;
        try {
            await deleteBilling(billingId);
            await fetchCurrentClient();
            toast.success("Billing record deleted.");
        } catch (err) {
            toast.error("Failed to delete billing record.");
            console.error(err);
        }
    };

    // ─────────────────────────────────────────────────────────
    // Derived helpers
    // ─────────────────────────────────────────────────────────

    const licenses = client?.licenses ?? [];
    const shippings = client?.shippings ?? [];
    const billings = client?.billings ?? [];
    const subscriptions = client?.subscriptions ?? [];
    const activeSubscription = subscriptions.find((s) => s.active) ?? null;

    // ─────────────────────────────────────────────────────────
    // Return — use `form` as an alias for clientForm (backward compat with page)
    // ─────────────────────────────────────────────────────────

    return {
        // Store state
        client, clients, filteredClients, loading, error,

        // Tab
        activeTab, setActiveTab,

        // Search
        search, setSearch,

        // ── Client modal (backward-compatible aliases) ──
        showModal,
        form: clientForm, setForm: setClientForm,
        openAdd: openAddClient, openEdit: openEditClient, closeModal,
        saveClient, removeClient,

        // ── Personal info ──
        personalForm, handlePersonalFormChange, savePersonalInfo,

        // ── License tab ──
        licenses,
        showLicenseModal,
        licenseForm, setLicenseForm,
        openAddLicense, openEditLicense, closeLicenseModal,
        saveLicense, removeLicense,

        // ── Shipping tab ──
        shippings,
        showShippingModal,
        shippingForm, setShippingForm,
        openAddShipping, openEditShipping, closeShippingModal,
        saveShipping, removeShipping,

        // ── Billing tab ──
        billings,
        invoices,
        showBillingModal,
        billingForm, setBillingForm,
        openAddBilling, openEditBilling, closeBillingModal,
        saveBilling, removeBilling, fetchInvoices,

        // ── Subscription ──
        subscriptions, activeSubscription,
        mySubscription, mySubscriptionLoading,
        paymentHistory, paymentHistoryLoading,

        // ── Security / Login History ──
        loginHistory, loginHistoryLoading, changePassword, forgotPassword,

        // Raw store actions (advanced usage)
        fetchClients, fetchCurrentClient, fetchClientById,
        updateClient, deleteClient,
    };
};
