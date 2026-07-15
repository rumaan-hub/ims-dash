import { create } from "zustand";
import { apiCallManager } from "@/_api_/apiCallManager";
import type { LightProduct } from "./inventoryStore";

export interface PurchaseItem {
    productId: string;
    productName: string;
    unitPrice: number;
    quantity: number;
    amount: number;
    notes: string;
}

export interface PurchaseDetail {
    productId: string;
    quantity: number;
    unit_price?: number;
    product?: { title?: string };
    [key: string]: unknown;
}

export interface CreatePurchasePayload {
    client_id: string;
    items?: Array<Partial<PurchaseItem>>;
    remarks?: string;
    [key: string]: unknown;
}

export interface PurchaseApiItem {
    purchase_id: string;
    purchase_date: string;
    status: string;
    remarks?: string;
    details: PurchaseDetail[];
}

export interface Proposal {
    purchase_id: string;
    created_at: string;
    status: string;
    remarks: string;
    details: {
        productId: string;
        product: {
            title: string;
        };
        quantity: number;
        unit_price: number;
    }[];
}

export interface PurchaseOrder {
    purchase_id: string;
    id: string;
    date: string;
    status: "Pending" | "Ordered" | "Shipped" | "Delivered" | string;
    items: { name: string; quantity: number }[];
    trackingNumber?: string;
    proposalLink?: string;
    remarks?: string;
    details: PurchaseDetail[];
}

interface PurchaseStore {
    // Data State
    products: LightProduct[];
    proposals: Proposal[];
    purchaseHistory: PurchaseOrder[];
    loading: boolean;
    error: string | null;

    dropdownItems: LightProduct[];
    dropdownTotalPages: number;
    dropdownIsLoading: boolean;

    // Form State
    purchaseRows: PurchaseItem[];
    remarks: string;

    // Actions
    fetchProducts: () => Promise<void>;
    fetchProposals: (clientId: string) => Promise<void>;
    fetchPurchaseHistory: (clientId: string) => Promise<void>;
    fetchDropdownProducts: (search: string, page: number, limit: number) => Promise<void>;

    // Form Actions
    addRow: () => void;
    removeRow: (id: string | number) => void;
    updateRow: (index: number, data: Partial<PurchaseItem>) => void;
    setRemarks: (remarks: string) => void;

    createPurchase: (payload: CreatePurchasePayload) => Promise<void>;
    acceptProposal: (id: string, clientId: string) => Promise<void>;
    rejectProposal: (id: string, clientId: string) => Promise<void>;
    resetForm: () => void;
}

const initialRow: PurchaseItem = { productId: '', productName: '', unitPrice: 0, quantity: 1, amount: 0, notes: '' };

export const usePurchaseStore = create<PurchaseStore>((set, get) => ({
    products: [],
    proposals: [],
    purchaseHistory: [],
    loading: false,
    error: null,

    dropdownItems: [],
    dropdownTotalPages: 1,
    dropdownIsLoading: false,

    // Initial Form State
    purchaseRows: [{ ...initialRow }],
    remarks: '',

    addRow: () => {
        set((state) => ({ purchaseRows: [...state.purchaseRows, { ...initialRow }] }));
    },

    removeRow: (indexToDrop: string | number) => {
        set((state) => {
            const newRows = state.purchaseRows.filter((_, idx) => idx !== Number(indexToDrop));
            return { purchaseRows: newRows.length === 0 ? [{ ...initialRow }] : newRows };
        });
    },

    updateRow: (index, data) => {
        set((state) => {
            const productData = state.products.find(p => p.id === data.productId) || state.dropdownItems.find(p => String(p.id) === String(data.productId));
            const rows = [...state.purchaseRows];
            const row = { ...rows[index], ...data };

            if (data.productId && productData) {
                row.productName = productData.title || productData.name || "";
                row.unitPrice = productData.variants?.[0]?.price || productData.price || productData.unit_price || 0;
            }

            row.amount = (row.quantity || 0) * (row.unitPrice || 0);
            rows[index] = row;
            return { purchaseRows: rows };
        });
    },

    setRemarks: (remarks) => set({ remarks }),

    resetForm: () => set({ purchaseRows: [{ ...initialRow }], remarks: '' }),

    fetchProducts: async () => {
        try {
            const res = await apiCallManager.getLightProducts("", 1, 100);
            if (res && res.data) {
                set({ products: res.data });
            }
        } catch (err) {
            console.error("Failed to fetch products:", err);
        }
    },

    fetchDropdownProducts: async (search: string, page: number, limit: number) => {
        set({ dropdownIsLoading: true });
        try {
            const res = await apiCallManager.getLightProducts(search, page, limit);
            const data = Array.isArray(res) ? res : (res?.data || []);
            const total = res?.totalPages || res?.total_pages || res?.meta?.totalPages || Math.ceil((res?.total || data.length) / limit) || 1;

            set({ dropdownItems: data, dropdownTotalPages: total });
        } catch (error) {
            console.error("Failed to fetch dropdown light products", error);
            set({ dropdownItems: [], dropdownTotalPages: 1 });
        } finally {
            set({ dropdownIsLoading: false });
        }
    },

    fetchProposals: async (clientId: string) => {
        if (!clientId) return;
        set({ loading: true });
        try {
            const data = await apiCallManager.getProposals(clientId);
            set({ proposals: data, loading: false });
        } catch (err) {
            console.error("Failed to fetch proposals:", err);
            set({ loading: false });
        }
    },

    fetchPurchaseHistory: async (clientId: string) => {
        if (!clientId) return;
        try {
            const data = await apiCallManager.getPurchases(clientId);
            if (data && Array.isArray(data)) {
                const mappedData: PurchaseOrder[] = data.map((item: PurchaseApiItem) => ({
                    purchase_id: item.purchase_id,
                    id: item.purchase_id.split('-')[0].toUpperCase(),
                    date: new Date(item.purchase_date).toISOString().split('T')[0],
                    status: item.status.charAt(0).toUpperCase() + item.status.slice(1).toLowerCase(),
                    items: item.details.map((d: PurchaseDetail) => ({
                        name: d.product?.title || 'Unknown Product',
                        quantity: d.quantity
                    })),
                    details: item.details,
                    remarks: item.remarks
                }));
                set({ purchaseHistory: mappedData });
            }
        } catch (err) {
            console.error("Failed to fetch purchase history:", err);
        }
    },

    createPurchase: async (payload: CreatePurchasePayload) => {
        set({ loading: true, error: null });
        try {
            await apiCallManager.createPurchase(payload);
            // Refresh history
            await get().fetchPurchaseHistory(payload.client_id);
            set({ loading: false });
        } catch (err: unknown) {
            set({ loading: false, error: err instanceof Error ? err.message : "Failed to place order" });
            throw err;
        }
    },

    acceptProposal: async (id: string, clientId: string) => {
        try {
            set({ loading: true });
            await apiCallManager.acceptProposal(id);
            await get().fetchProposals(clientId);
            await get().fetchPurchaseHistory(clientId);
            set({ loading: false });
        } catch (err: unknown) {
            set({ loading: false, error: err instanceof Error ? err.message : "Failed to accept proposal" });
            throw err;
        }
    },

    rejectProposal: async (id: string, clientId: string) => {
        try {
            set({ loading: true });
            await apiCallManager.rejectProposal(id);
            await get().fetchProposals(clientId);
            set({ loading: false });
        } catch (err: unknown) {
            set({ loading: false, error: err instanceof Error ? err.message : "Failed to reject proposal" });
            throw err;
        }
    }
}));
