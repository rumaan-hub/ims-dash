import { create } from "zustand";
import { apiCallManager } from "@/_api_/apiCallManager";

// ─────────────────────────────────────────────────────────────
// Types (mirror Prisma schema exactly)
// ─────────────────────────────────────────────────────────────

export type License = {
    license_id: string;
    client_id: string;
    license_type: string;
    license_number: string;
    expiry_date: string;   // ISO string from backend
    state: string;
    status: string;
};

export type Shipping = {
    shipping_id: string;
    client_id: string;
    office_name: string;
    address: string;
    city: string;
    state: string;
    zip_code: string;
    phone?: string;
    extension?: string;
};

export type Billing = {
    billing_id: string;
    client_id: string;
    billing_address: string;
    stripe_customer_id?: string;
    stripe_payment_method_id?: string;
    card_brand?: string;
    /** Decrypted masked card returned by the API, e.g. "**** **** **** 3528" */
    masked_card?: string;
    expiry_month?: number;
    expiry_year?: number;
    created_at?: string;
};

export type ClientSubscription = {
    client_id: string;
    subscription_plan_id: string;
    start_date: string;
    end_date: string;
    final_amount: number;
    payment_status: string;
    active: boolean;
    plan?: {
        subscription_plan_id: string;
        plan_name: string;
        price: number;
        duration: number;
        description?: string;
    };
};

export type Client = {
    client_id: string;
    company_name: string;
    first_name: string;
    last_name: string;
    email: string;
    contact_number?: string;
    permanent_address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    agree_to_terms: boolean;
    created_at?: string;
    // Relations — populated by findById / getCurrentClient
    licenses?: License[];
    shippings?: Shipping[];
    billings?: Billing[];
    subscriptions?: ClientSubscription[];
};

export type CreateClientPayload = Omit<Client, 'client_id' | 'created_at' | 'licenses' | 'shippings' | 'billings' | 'subscriptions'>;

export type MySubscription = {
    plan_name: string;
    billing_cycle: string;
    final_amount: number;
    discount_percentage: number;
    active: boolean;
    payment_status: string;
    start_date: string;
    next_billing_date: string;
};

export type PaymentHistoryEntry = {
    plan_name: string;
    billing_cycle: string;
    final_amount: number;
    discount_percentage: number;
    payment_status: string;
    active: boolean;
    start_date: string;
    end_date: string;
};

export type LoginHistoryEntry = {
    id: string;
    ip_address: string | null;
    browser: string | null;
    device: string | null;
    created_at: string;
};

// ─────────────────────────────────────────────────────────────
// Store shape
// ─────────────────────────────────────────────────────────────

export type Invoice = {
    invoice_id?: string;
    client_id?: string;
    amount?: number;
    status?: string;
    created_at?: string;
    [key: string]: unknown;
};

type ProfileStore = {
    client: Client | null;
    clients: Client[];
    loading: boolean;
    invoices: Invoice[];
    error: string;

    // Subscription
    mySubscription: MySubscription | null;
    mySubscriptionLoading: boolean;
    fetchMySubscription: () => Promise<void>;

    // Payment history
    paymentHistory: PaymentHistoryEntry[];
    paymentHistoryLoading: boolean;
    fetchPaymentHistory: () => Promise<void>;

    // Login history
    loginHistory: LoginHistoryEntry[];
    loginHistoryLoading: boolean;
    fetchLoginHistory: () => Promise<void>;

    // Change password
    changePassword: (currentPassword: string, newPassword: string) => Promise<void>;

    // Forgot password (send reset email)
    forgotPassword: (email: string) => Promise<void>;

    // Client CRUD
    fetchClients: () => Promise<void>;
    fetchClientById: (id: string) => Promise<void>;
    fetchCurrentClient: () => Promise<void>;
    createClient: (data: CreateClientPayload) => Promise<void>;
    updateClient: (id: string, data: Partial<Client>) => Promise<void>;
    deleteClient: (id: string) => Promise<void>;

    // License CRUD
    addLicense: (clientId: string, data: Partial<License>) => Promise<void>;
    updateLicense: (licenseId: string, data: Partial<License>) => Promise<void>;
    deleteLicense: (licenseId: string) => Promise<void>;

    // Shipping CRUD
    addShipping: (clientId: string, data: Partial<Shipping>) => Promise<void>;
    updateShipping: (shippingId: string, data: Partial<Shipping>) => Promise<void>;
    deleteShipping: (shippingId: string) => Promise<void>;

    // Billing CRUD
    addBilling: (clientId: string, data: Partial<Billing>) => Promise<void>;
    updateBilling: (billingId: string, data: Partial<Billing>) => Promise<void>;
    deleteBilling: (billingId: string) => Promise<void>;
    fetchInvoices: (clientId: string) => Promise<void>;
};

// ─────────────────────────────────────────────────────────────
// Store implementation
// ─────────────────────────────────────────────────────────────

export const useProfileStore = create<ProfileStore>((set) => ({
    client: null,
    clients: [],
    invoices: [],
    loading: false,
    error: "",
    mySubscription: null,
    mySubscriptionLoading: false,
    paymentHistory: [],
    paymentHistoryLoading: false,
    loginHistory: [],
    loginHistoryLoading: false,

    // ── MY SUBSCRIPTION ─────────────────────────────────────────
    fetchMySubscription: async () => {
        set({ mySubscriptionLoading: true });
        try {
            const data = await apiCallManager.getMySubscription();
            set({ mySubscription: data });
        } catch {
            set({ mySubscription: null });
        } finally {
            set({ mySubscriptionLoading: false });
        }
    },

    // ── PAYMENT HISTORY ─────────────────────────────────────────
    fetchPaymentHistory: async () => {
        set({ paymentHistoryLoading: true });
        try {
            const data = await apiCallManager.getPaymentHistory();
            set({ paymentHistory: data });
        } catch {
            set({ paymentHistory: [] });
        } finally {
            set({ paymentHistoryLoading: false });
        }
    },

    // ── LOGIN HISTORY ─────────────────────────────────────────
    fetchLoginHistory: async () => {
        set({ loginHistoryLoading: true });
        try {
            const data = await apiCallManager.getLoginHistory();
            set({ loginHistory: data });
        } catch {
            set({ loginHistory: [] });
        } finally {
            set({ loginHistoryLoading: false });
        }
    },

    // ── FORGOT PASSWORD ─────────────────────────────────────
    forgotPassword: async (email: string) => {
        set({ loading: true, error: "" });
        try {
            await apiCallManager.forgotPassword(email);
        } catch (err: unknown) {
            const errorObj = err as { response?: { data?: { message?: string } } };
            const msg = errorObj?.response?.data?.message || "Failed to send reset email";
            set({ error: msg });
            throw new Error(msg);
        } finally {
            set({ loading: false });
        }
    },

    // ── CHANGE PASSWORD ─────────────────────────────────────
    changePassword: async (currentPassword: string, newPassword: string) => {
        set({ loading: true, error: "" });
        try {
            await apiCallManager.changePassword(currentPassword, newPassword);
        } catch (err: unknown) {
            const errorObj = err as { response?: { data?: { message?: string } } };
            const msg = errorObj?.response?.data?.message || "Failed to change password";
            set({ error: msg });
            throw new Error(msg);
        } finally {
            set({ loading: false });
        }
    },

    // ── CLIENT ───────────────────────────────────────────────
    // ...
    fetchInvoices: async (clientId: string) => {
        set({ loading: true, error: "" });
        try {
            const data = await apiCallManager.getInvoices(clientId);
            set({ invoices: data.data || [] });
        } catch {
            set({ error: "Failed to fetch invoices" });
        } finally {
            set({ loading: false });
        }
    },

    fetchClients: async () => {
        set({ loading: true, error: "" });
        try {
            const data = await apiCallManager.getClients();
            set({ clients: data });
        } catch {
            set({ error: "Failed to load clients" });
        } finally {
            set({ loading: false });
        }
    },

    fetchClientById: async (id) => {
        set({ loading: true, error: "" });
        try {
            const data = await apiCallManager.getClientById(id);
            set({ client: data });
        } catch {
            set({ error: "Failed to load client" });
        } finally {
            set({ loading: false });
        }
    },

    fetchCurrentClient: async () => {
        set({ loading: true, error: "" });
        try {
            const data = await apiCallManager.getCurrentClient();
            // getCurrentClient now returns fully hydrated client
            set({ client: data });
        } catch {
            set({ error: "Failed to load current client" });
        } finally {
            set({ loading: false });
        }
    },

    createClient: async (data) => {
        set({ loading: true, error: "" });
        try {
            const newClient = await apiCallManager.createClient(data);
            set((state) => ({ clients: [newClient, ...state.clients] }));
        } catch {
            set({ error: "Failed to create client" });
            throw new Error("Failed to create client");
        } finally {
            set({ loading: false });
        }
    },

    updateClient: async (id, data) => {
        set({ loading: true, error: "" });
        try {
            const updated = await apiCallManager.updateClient(id, data);
            set((state) => ({
                clients: state.clients.map((c) => c.client_id === id ? { ...c, ...updated } : c),
                client: state.client?.client_id === id ? { ...state.client, ...updated } : state.client,
            }));
        } catch {
            set({ error: "Failed to update client" });
            throw new Error("Failed to update client");
        } finally {
            set({ loading: false });
        }
    },

    deleteClient: async (id) => {
        set({ loading: true, error: "" });
        try {
            await apiCallManager.deleteClient(id);
            set((state) => ({
                clients: state.clients.filter((c) => c.client_id !== id),
                client: state.client?.client_id === id ? null : state.client,
            }));
        } catch {
            set({ error: "Failed to delete client" });
            throw new Error("Failed to delete client");
        } finally {
            set({ loading: false });
        }
    },

    // ── LICENSE ──────────────────────────────────────────────

    addLicense: async (clientId, data) => {
        set({ loading: true, error: "" });
        try {
            const newLicense = await apiCallManager.addLicense(clientId, data as Required<Pick<License, "license_type" | "license_number" | "expiry_date" | "state">> & { status?: string });
            set((state) => ({
                client: state.client ? {
                    ...state.client,
                    licenses: [...(state.client.licenses ?? []), newLicense],
                } : state.client,
            }));
        } catch {
            set({ error: "Failed to add license" });
            throw new Error("Failed to add license");
        } finally {
            set({ loading: false });
        }
    },

    updateLicense: async (licenseId, data) => {
        set({ loading: true, error: "" });
        try {
            const updated = await apiCallManager.updateLicense(licenseId, data);
            set((state) => ({
                client: state.client ? {
                    ...state.client,
                    licenses: (state.client.licenses ?? []).map((l) =>
                        l.license_id === licenseId ? { ...l, ...updated } : l
                    ),
                } : state.client,
            }));
        } catch {
            set({ error: "Failed to update license" });
            throw new Error("Failed to update license");
        } finally {
            set({ loading: false });
        }
    },

    deleteLicense: async (licenseId) => {
        set({ loading: true, error: "" });
        try {
            await apiCallManager.deleteLicense(licenseId);
            set((state) => ({
                client: state.client ? {
                    ...state.client,
                    licenses: (state.client.licenses ?? []).filter((l) => l.license_id !== licenseId),
                } : state.client,
            }));
        } catch {
            set({ error: "Failed to delete license" });
            throw new Error("Failed to delete license");
        } finally {
            set({ loading: false });
        }
    },

    // ── SHIPPING ─────────────────────────────────────────────

    addShipping: async (clientId, data) => {
        set({ loading: true, error: "" });
        try {
            const newShipping = await apiCallManager.addShipping(clientId, data as Required<Pick<Shipping, "office_name" | "address" | "city" | "state" | "zip_code">> & { phone?: string; extension?: string });
            set((state) => ({
                client: state.client ? {
                    ...state.client,
                    shippings: [...(state.client.shippings ?? []), newShipping],
                } : state.client,
            }));
        } catch {
            set({ error: "Failed to add shipping address" });
            throw new Error("Failed to add shipping address");
        } finally {
            set({ loading: false });
        }
    },

    updateShipping: async (shippingId, data) => {
        set({ loading: true, error: "" });
        try {
            const updated = await apiCallManager.updateShipping(shippingId, data);
            set((state) => ({
                client: state.client ? {
                    ...state.client,
                    shippings: (state.client.shippings ?? []).map((s) =>
                        s.shipping_id === shippingId ? { ...s, ...updated } : s
                    ),
                } : state.client,
            }));
        } catch {
            set({ error: "Failed to update shipping address" });
            throw new Error("Failed to update shipping address");
        } finally {
            set({ loading: false });
        }
    },

    deleteShipping: async (shippingId) => {
        set({ loading: true, error: "" });
        try {
            await apiCallManager.deleteShipping(shippingId);
            set((state) => ({
                client: state.client ? {
                    ...state.client,
                    shippings: (state.client.shippings ?? []).filter((s) => s.shipping_id !== shippingId),
                } : state.client,
            }));
        } catch {
            set({ error: "Failed to delete shipping address" });
            throw new Error("Failed to delete shipping address");
        } finally {
            set({ loading: false });
        }
    },

    // ── BILLING ──────────────────────────────────────────────

    addBilling: async (clientId, data) => {
        set({ loading: true, error: "" });
        try {
            const newBilling = await apiCallManager.addBilling(clientId, data);
            set((state) => ({
                client: state.client ? {
                    ...state.client,
                    billings: [...(state.client.billings ?? []), newBilling],
                } : state.client,
            }));
        } catch {
            set({ error: "Failed to add billing record" });
            throw new Error("Failed to add billing record");
        } finally {
            set({ loading: false });
        }
    },

    updateBilling: async (billingId, data) => {
        set({ loading: true, error: "" });
        try {
            const updated = await apiCallManager.updateBilling(billingId, data);
            set((state) => ({
                client: state.client ? {
                    ...state.client,
                    billings: (state.client.billings ?? []).map((b) =>
                        b.billing_id === billingId ? { ...b, ...updated } : b
                    ),
                } : state.client,
            }));
        } catch {
            set({ error: "Failed to update billing record" });
            throw new Error("Failed to update billing record");
        } finally {
            set({ loading: false });
        }
    },

    deleteBilling: async (billingId) => {
        set({ loading: true, error: "" });
        try {
            await apiCallManager.deleteBilling(billingId);
            set((state) => ({
                client: state.client ? {
                    ...state.client,
                    billings: (state.client.billings ?? []).filter((b) => b.billing_id !== billingId),
                } : state.client,
            }));
        } catch {
            set({ error: "Failed to delete billing record" });
            throw new Error("Failed to delete billing record");
        } finally {
            set({ loading: false });
        }
    },
}));
