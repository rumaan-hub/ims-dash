import axios from "axios";

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Add token to every request automatically
axios.interceptors.request.use((config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export const staffApi = {
    // Staff APIs
    getStaff: async () => {
        const res = await axios.get(`${baseURL}/ims/staff`);
        return res.data;
    },

    createStaff: async (data: Record<string, unknown>) => {
        const res = await axios.post(`${baseURL}/ims/staff`, data);
        return res.data;
    },

    updateStaff: async (id: string, data: Record<string, unknown>) => {
        const res = await axios.patch(`${baseURL}/ims/staff/${id}`, data);
        return res.data;
    },

    deleteStaff: async (id: string) => {
        const res = await axios.delete(`${baseURL}/ims/staff/${id}`);
        return res.data;
    },

    // Office APIs
    getOffices: async () => {
        const res = await axios.get(`${baseURL}/ims/offices`);
        return res.data;
    },

    /** Lightweight offices — only office_id, office_name, address, client_id. No user join. */
    getLightOffices: async (search: string = '') => {
        const res = await axios.get(`${baseURL}/ims/offices/light`, {
            params: search ? { search } : {},
        });
        return res.data; // { data: LightOffice[], officeMap: Record<string, LightOffice>, total: number }
    },

    /** Create a new office — client_id comes from useImsUser() hook, never from user input */
    createOffice: async (data: { office_name: string; address: string; client_id: string }) => {
        const res = await axios.post(`${baseURL}/ims/offices`, data);
        return res.data;
    },

    /** Update an existing office */
    updateOffice: async (id: string, data: { office_name?: string; address?: string }) => {
        const res = await axios.patch(`${baseURL}/ims/offices/${id}`, data);
        return res.data;
    },

    /** Delete an office */
    deleteOffice: async (id: string) => {
        const res = await axios.delete(`${baseURL}/ims/offices/${id}`);
        return res.data;
    },



    // Product APIs
    getProducts: async (search: string = "", page: number = 1, limit: number = 20) => {
        const res = await axios.get(`${baseURL}/products`, {
            params: { search, page, limit }
        });
        return res.data;
    },

    getProductById: async (id: string) => {
        const res = await axios.get(`${baseURL}/products/${id}`);
        return res.data;
    },

    getLightProducts: async (search: string = "", page: number = 1, limit: number = 50, officeId?: string, onlyInventory?: boolean, inventoryType?: string) => {
        const res = await axios.get(`${baseURL}/products/lightProducts`, {
            params: {
                search,
                page,
                limit,
                ...(officeId && { officeId }),
                ...(onlyInventory && { onlyInventory: true }),
                ...(inventoryType && { inventoryType })
            }
        });
        return res.data;
    },

    // Quotation APIs
    getQuotations: async () => {
        const res = await axios.get(`${baseURL}/ims/quotation`);
        return res.data;
    },

    createQuotation: async (data: Record<string, unknown>) => {
        const res = await axios.post(`${baseURL}/ims/quotation`, data);
        return res.data;
    },

    updateQuotation: async (id: string, data: Record<string, unknown>) => {
        const res = await axios.patch(`${baseURL}/ims/quotation/${id}`, data);
        return res.data;
    },

    deleteQuotation: async (id: string) => {
        const res = await axios.delete(`${baseURL}/ims/quotation/${id}`);
        return res.data;
    },

    // ─────────────────────────────────────────────────────────────
    // CLIENT APIs
    // ─────────────────────────────────────────────────────────────

    /** GET /ims/clients — lightweight list (no relations) */
    getClients: async () => {
        const res = await axios.get(`${baseURL}/ims/clients`);
        return res.data;
    },

    /** GET /ims/clients/:id — fully hydrated (licenses, shippings, billings, subscriptions) */
    getClientById: async (id: string) => {
        const res = await axios.get(`${baseURL}/ims/clients/${id}`);
        return res.data;
    },

    /**
     * GET /ims/clients/me — fully hydrated current user.
     * NOW:  returns first ImsUser in DB.
     * LATER: backend reads from JWT guard — zero frontend changes.
     */
    getCurrentClient: async () => {
        const res = await axios.get(`${baseURL}/ims/clients/me`);
        return res.data;
    },

    /** POST /ims/clients */
    createClient: async (data: {
        company_name: string;
        first_name: string;
        last_name: string;
        email: string;
        contact_number?: string;
        agree_to_terms: boolean;
    }) => {
        const res = await axios.post(`${baseURL}/ims/clients`, data);
        return res.data;
    },

    /** PATCH /ims/clients/:id — partial update of core client fields */
    updateClient: async (id: string, data: Record<string, unknown>) => {
        const res = await axios.patch(`${baseURL}/ims/clients/${id}`, data);
        return res.data;
    },

    /** DELETE /ims/clients/:id */
    deleteClient: async (id: string) => {
        const res = await axios.delete(`${baseURL}/ims/clients/${id}`);
        return res.data;
    },

    // ─────────────────────────────────────────────────────────────
    // LICENSE sub-resource
    // ─────────────────────────────────────────────────────────────

    /** POST /ims/client-licenses/:clientId */
    addLicense: async (clientId: string, data: {
        license_type: string;
        license_number: string;
        expiry_date: string;
        state: string;
        status?: string;
    }) => {
        const res = await axios.post(`${baseURL}/ims/client-licenses/${clientId}`, data);
        return res.data;
    },

    /** PATCH /ims/client-licenses/:licenseId */
    updateLicense: async (licenseId: string, data: Partial<{
        license_type: string;
        license_number: string;
        expiry_date: string;
        state: string;
        status: string;
    }>) => {
        const res = await axios.patch(`${baseURL}/ims/client-licenses/${licenseId}`, data);
        return res.data;
    },

    /** DELETE /ims/client-licenses/:licenseId */
    deleteLicense: async (licenseId: string) => {
        const res = await axios.delete(`${baseURL}/ims/client-licenses/${licenseId}`);
        return res.data;
    },

    // ─────────────────────────────────────────────────────────────
    // SHIPPING sub-resource
    // ─────────────────────────────────────────────────────────────

    /** POST /ims/client-shippings/:clientId */
    addShipping: async (clientId: string, data: {
        office_name: string;
        address: string;
        city: string;
        state: string;
        zip_code: string;
        phone?: string;
        extension?: string;
    }) => {
        const res = await axios.post(`${baseURL}/ims/client-shippings/${clientId}`, data);
        return res.data;
    },

    /** PATCH /ims/client-shippings/:shippingId */
    updateShipping: async (shippingId: string, data: Record<string, unknown>) => {
        const res = await axios.patch(`${baseURL}/ims/client-shippings/${shippingId}`, data);
        return res.data;
    },

    /** DELETE /ims/client-shippings/:shippingId */
    deleteShipping: async (shippingId: string) => {
        const res = await axios.delete(`${baseURL}/ims/client-shippings/${shippingId}`);
        return res.data;
    },

    // ─────────────────────────────────────────────────────────────
    // BILLING sub-resource
    // ─────────────────────────────────────────────────────────────

    /** POST /ims/client-billings/:clientId */
    addBilling: async (clientId: string, data: Record<string, unknown>) => {
        const res = await axios.post(`${baseURL}/ims/client-billings/${clientId}`, data);
        return res.data;
    },

    /** PATCH /ims/client-billings/:billingId */
    updateBilling: async (billingId: string, data: Record<string, unknown>) => {
        const res = await axios.patch(`${baseURL}/ims/client-billings/${billingId}`, data);
        return res.data;
    },

    /** GET /ims/client-billings/:clientId/invoices */
    getInvoices: async (clientId: string) => {
        const res = await axios.get(`${baseURL}/ims/client-billings/${clientId}/invoices`);
        return res.data;
    },

    /** DELETE /ims/client-billings/:billingId */
    deleteBilling: async (billingId: string) => {
        const res = await axios.delete(`${baseURL}/ims/client-billings/${billingId}`);
        return res.data;
    },

    // Proposal APIs
    updateProposalStatus: async (quoteId: string, proposalId: string, status: string) => {
        const res = await axios.patch(`${baseURL}/ims/quotation/${quoteId}/proposal/${proposalId}`, { status });
        return res.data;
    },
};

// Subscription APIs
export const subscriptionApi = {
    getMySubscription: async () => {
        const res = await axios.get(`${baseURL}/ims-subscription/my-subscription`);
        return res.data;
    },
    getPaymentHistory: async () => {
        const res = await axios.get(`${baseURL}/ims-subscription/payment-history`);
        return res.data;
    },
    getDashboardStats: async (filter?: string) => {
        const res = await axios.get(`${baseURL}/ims-subscription/stats`, { params: filter ? { filter } : {} });
        return res.data;
    },
    getDashboardChartData: async (filter?: string) => {
        const res = await axios.get(`${baseURL}/ims-subscription/chart-data`, { params: filter ? { filter } : {} });
        return res.data;
    },
};

// Purchase APIs
export const purchaseApi = {
    createPurchase: async (data: Record<string, unknown>) => {
        const res = await axios.post(`${baseURL}/ims/purchase`, data);
        return res.data;
    },
    getProposals: async (clientId: string) => {
        const res = await axios.get(`${baseURL}/ims/purchase/proposals/${clientId}`);
        return res.data;
    },
    getPurchases: async (clientId: string) => {
        const res = await axios.get(`${baseURL}/ims/purchase/${clientId}`);
        return res.data;
    },
    acceptProposal: async (id: string) => {
        const res = await axios.patch(`${baseURL}/ims/purchase/proposals/${id}/accept`);
        return res.data;
    },
    rejectProposal: async (id: string) => {
        const res = await axios.patch(`${baseURL}/ims/purchase/proposals/${id}/reject`);
        return res.data;
    },
};

// transfer APIs
export const transferApi = {
    async getTransfers() {
        const res = await axios.get(`${baseURL}/ims/transfer`);
        return res.data;
    },

    async createTransfer(data: Record<string, unknown>) {
        const res = await axios.post(`${baseURL}/ims/transfer`, data);
        return res.data;
    },

    async updateTransferStatus(id: string, status: string) {
        const res = await axios.patch(`${baseURL}/ims/transfer/${id}`, { status });
        return res.data;
    },
};

// Inventory APIs
export const inventoryApi = {
    getInventory: async (params?: { officeId?: string }) => {
        const res = await axios.get(`${baseURL}/ims/inventory`, { params });
        return res.data;
    },

    createInventory: async (data: Record<string, unknown>) => {
        const res = await axios.post(`${baseURL}/ims/inventory`, data);
        return res.data;
    },

    updateInventory: async (id: number | string, data: Record<string, unknown>) => {
        const res = await axios.patch(`${baseURL}/ims/inventory/${id}`, data);
        return res.data;
    },

    deleteInventory: async (id: number | string) => {
        const res = await axios.delete(`${baseURL}/ims/inventory/${id}`);
        return res.data;
    },
};

// Custom (non-catalog) Product APIs
export const customProductApi = {
    createCustomProduct: async (data: Record<string, unknown>) => {
        const res = await axios.post(`${baseURL}/ims/custom-products`, data);
        return res.data;
    },

    getCustomProducts: async (search: string = "", page: number = 1, limit: number = 50, inventory_type?: string) => {
        const res = await axios.get(`${baseURL}/ims/custom-products`, {
            params: { search, page, limit, ...(inventory_type && { inventory_type }) },
        });
        return res.data; // { data, total, page, limit, totalPages }
    },

    updateCustomProduct: async (id: string, data: Record<string, unknown>) => {
        const res = await axios.patch(`${baseURL}/ims/custom-products/${id}`, data);
        return res.data;
    },

    deleteCustomProduct: async (id: string) => {
        const res = await axios.delete(`${baseURL}/ims/custom-products/${id}`);
        return res.data;
    },

    // Generic S3 upload (reuses the backend /upload-file endpoint) → returns { Location, ... }
    uploadFile: async (file: File) => {
        const fd = new FormData();
        fd.append('file', file);
        const res = await axios.post(`${baseURL}/upload-file`, fd);
        return res.data;
    },
};

// Ledger & Alerts APIs
export const ledgerApi = {
    getLedgerTransactions: async (params?: {
        officeId?: string;
        type?: string;
        dateFrom?: string;
        dateTo?: string;
    }) => {
        const res = await axios.get(`${baseURL}/ims/inventory/ledger/transactions`, { params });
        return res.data as Array<{
            id: string; date: string; product: string; batch: string;
            type: string; qty: string; price: string; balance: string;
            office: string; user: string; remarks: string;
        }>;
    },

    getLowStockAlerts: async () => {
        const res = await axios.get(`${baseURL}/ims/inventory/ledger/low-stock`);
        return res.data as Array<{
            product: string; batch: string; office: string;
            qty: string; threshold: string; status: string;
        }>;
    },

    getNearExpiryAlerts: async (days = 60) => {
        const res = await axios.get(`${baseURL}/ims/inventory/ledger/near-expiry`, { params: { days } });
        return res.data as Array<{
            product: string; batch: string; expiry: string;
            daysLeft: number; office: string; status: string;
        }>;
    },

    getNearExpiryCount: async (days = 30) => {
        const res = await axios.get(`${baseURL}/ims/inventory/ledger/near-expiry-count`, { params: { days } });
        return res.data as { count: number; threshold: number };
    },
};

// Analytics APIs
export const analyticsApi = {
    getAnalyticsSuggestions: async (page = 1, limit = 10) => {
        const res = await axios.get(`${baseURL}/ims/inventory/analytics/suggestions`, {
            params: { page, limit },
        });
        return res.data as {
            products: Array<{
                productId: string;
                productName: string;
                currentStock: number;
                totalUsage: number;
                activeDays: number;
                averageDailyUsage: number;
                estimatedDaysRemaining: number | null;
                estimatedStockOutDate: string | null;
                suggestedRestockQuantity: number | null;
                status: string;
            }>;
            totalItems: number;
            currentPage: number;
            totalPages: number;
            chartData: {
                labels: string[];
                values: number[];
            };
        };
    },
};



// System Activity APIs
export const systemActivityApi = {
    logActivity: async (data: {
        action: string;
        product?: string;
        office?: string;
        user?: string;
        client_id?: string;
    }) => {
        const res = await axios.post(`${baseURL}/system-activity/log`, data);
        return res.data;
    },

    getLogs: async (clientId?: string, limit: number = 50) => {
        const res = await axios.get(`${baseURL}/system-activity`, { params: { clientId, limit } });
        return res.data;
    },
};

// RBAC APIs - Corrected with ims/ prefix
export const rbacApi = {
    getRoles: async () => {
        const res = await axios.get(`${baseURL}/ims/rbac/roles`);
        return res.data;
    },
    getPermissions: async () => {
        const res = await axios.get(`${baseURL}/ims/rbac/permissions`);
        return res.data;
    },
    getMyPermissions: async () => {
        const res = await axios.get(`${baseURL}/ims/rbac/my-permissions`);
        return res.data;
    },
    createRole: async (data: { name: string, description?: string }) => {
        const res = await axios.post(`${baseURL}/ims/rbac/roles`, data);
        return res.data;
    },
    togglePermission: async (roleId: string, permissionId: string) => {
        const res = await axios.post(`${baseURL}/ims/rbac/toggle-permission`, { roleId, permissionId });
        return res.data;
    },
    assignRoleToStaff: async (staffId: string, roleId: string) => {
        const res = await axios.post(`${baseURL}/ims/rbac/assign-role`, { staffId, roleId });
        return res.data;
    }
};

// Auth APIs
export interface LoginPayload {
    email: string;
    password: string;
}

export const authApi = {
    login: async (data: LoginPayload) => {
        const res = await axios.post(`${baseURL}/ims/auth/login`, data);
        return res.data;
    },
    getMe: async () => {
        const res = await axios.get(`${baseURL}/ims/auth/me`);
        return res.data;
    },
    getLoginHistory: async () => {
        const res = await axios.get(`${baseURL}/ims/auth/login-history`);
        return res.data;
    },
    forgotPassword: async (email: string) => {
        const res = await axios.post(`${baseURL}/ims/auth/forgot-password`, { email });
        return res.data;
    },
    resetPassword: async (token: string, newPassword: string) => {
        const res = await axios.post(`${baseURL}/ims/auth/reset-password`, { token, newPassword });
        return res.data;
    },
    changePassword: async (currentPassword: string, newPassword: string) => {
        const res = await axios.post(`${baseURL}/ims/auth/change-password`, { currentPassword, newPassword });
        return res.data;
    },
};

// Notification APIs
export const notificationApi = {
    getNotifications: async () => {
        const res = await axios.get(`${baseURL}/ims-notification`);
        return res.data;
    },
    markNotificationRead: async (id: string) => {
        const res = await axios.patch(`${baseURL}/ims-notification/${id}/read`);
        return res.data;
    },
    markAllNotificationsRead: async () => {
        const res = await axios.patch(`${baseURL}/ims-notification/read-all`);
        return res.data;
    },
};

export const apiCallManager = {
    ...authApi,
    ...staffApi,
    ...subscriptionApi,
    ...transferApi,
    ...inventoryApi,
    ...customProductApi,
    ...ledgerApi,
    ...analyticsApi,
    ...purchaseApi,
    ...systemActivityApi,
    ...rbacApi,
    ...notificationApi,
};

export const ApiCallManager = apiCallManager;
