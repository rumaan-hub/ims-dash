// src/store/quotationStore.ts

import { create } from "zustand";
import { apiCallManager } from "@/_api_/apiCallManager";

export interface Proposal {
    proposal_id: string;
    quotation_id: string;
    title: string;
    amount: string;
    description?: string;
    status: "Approved" | "Rejected" | "Pending";
    created_at: string;
}

export interface Quotation {
    quotation_id?: string;
    id?: string; // fallback for UI
    product_name: string;
    product_type: string;
    quantity: number;
    budget: string;
    description?: string;
    status: "Approved" | "Rejected" | "Pending" | string;
    created_at?: string;
    proposals?: Proposal[];

    // UI mapping fields
    product?: string;
    type?: string;
    date?: string;
}

interface Product {
    id: string;
    title: string;
    brand?: string;
    sku?: string;
}

interface FormData {
    productName: string;
    description: string;
    quantity: string;
    budget: string;
    notes: string;
    termsAccepted: boolean;
}

export interface CartItem {
    id?: string;
    productName: string;
    productType: string;
    quantity: number | string;
    budget: string;
    description?: string;
    [key: string]: unknown;
}

export interface QuotationApiItem {
    quotation_id: string;
    product_name: string;
    product_type: string;
    quantity: number;
    budget: string;
    description?: string;
    status: string;
    created_at: string;
    proposals?: Proposal[];
    [key: string]: unknown;
}

interface QuotationStore {
    // Data State
    quotations: Quotation[];
    products: Product[];
    loading: boolean;
    error: string | null;

    // Pagination for products
    currentPage: number;
    totalPages: number;
    totalProducts: number;

    // UI State
    activeTab: "proposals" | "quotations";
    selectedOrder: Quotation | null;
    productType: "new" | "existing" | "";
    formData: FormData;
    cart: CartItem[];

    // Actions
    fetchQuotations: () => Promise<void>;
    fetchProducts: (search?: string, page?: number, limit?: number) => Promise<void>;
    addQuotation: () => Promise<void>;
    addToCart: (item: CartItem) => void;
    removeFromCart: (id: string) => void;
    updateQuotation: (id: string, data: Partial<Quotation>) => Promise<void>;
    deleteQuotation: (id: string) => Promise<void>;
    updateProposal: (quoteId: string, proposalId: string, status: string) => Promise<void>;

    // UI Actions
    setActiveTab: (tab: "proposals" | "quotations") => void;
    setSelectedOrder: (order: Quotation | null) => void;
    setProductType: (type: "new" | "existing" | "") => void;
    setFormData: (data: Partial<FormData> | ((prev: FormData) => FormData)) => void;
    resetForm: () => void;
}

const initialFormData: FormData = {
    productName: "",
    description: "",
    quantity: "",
    budget: "",
    notes: "",
    termsAccepted: false,
};

export const useQuotationStore = create<QuotationStore>((set, get) => ({
    // Initial Data State
    quotations: [],
    products: [],
    loading: false,
    error: null,

    currentPage: 1,
    totalPages: 1,
    totalProducts: 0,

    // Initial UI State
    activeTab: "proposals",
    selectedOrder: null,
    productType: "",
    formData: initialFormData,
    cart: [], // Initial cart state

    // Actions
    async fetchQuotations() {
        try {
            set({ loading: true, error: null });
            const data = await apiCallManager.getQuotations();
            if (data && Array.isArray(data)) {
                // Map backend fields to UI fields if necessary
                const mappedData = data.map((item: QuotationApiItem) => ({
                    ...item,
                    id: item.quotation_id,
                    product: item.product_name,
                    type: item.product_type,
                    date: new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                }));
                set({ quotations: mappedData, loading: false });
            } else {
                set({ loading: false });
            }
        } catch (err: unknown) {
            console.error("Error fetching quotations:", err);
            set({ loading: false, error: err instanceof Error ? err.message : "Failed to fetch quotations" });
        }
    },

    async fetchProducts(search = "", page = 1, limit = 50) {
        try {
            const data = await apiCallManager.getLightProducts(search, page, limit);
            if (data && data.data) {
                set({
                    products: data.data,
                    currentPage: data.currentPage || 1,
                    totalPages: data.totalPages || 1,
                    totalProducts: data.totalProducts || 0,
                });
            }
        } catch (err: unknown) {
            console.error("Error fetching products:", err);
        }
    },

    addToCart(item) {
        set((state) => ({
            cart: [...state.cart, { ...item, id: Date.now().toString() }]
        }));
    },

    removeFromCart(id) {
        set((state) => ({
            cart: state.cart.filter(item => item.id !== id)
        }));
    },

    async addQuotation() { // Modified signature
        const { cart } = get();
        if (cart.length === 0) return;

        try {
            set({ loading: true });

            // Send each item as a separate quotation (Logic for multiple products)
            const promises = cart.map(item => {
                const payload = {
                    product_name: item.productName,
                    product_type: item.productType,
                    quantity: parseInt(item.quantity.toString()) || 1,
                    budget: item.budget,
                    description: item.description,
                    status: "Pending"
                };
                return apiCallManager.createQuotation(payload);
            });

            await Promise.all(promises);
            await get().fetchQuotations();
            set({ cart: [], loading: false, productType: "", selectedOrder: null }); // Clear cart and reset UI state
        } catch (err: unknown) {
            console.error("Error adding quotations:", err);
            set({ error: err instanceof Error ? err.message : "Failed to add quotations", loading: false });
        }
    },

    async updateQuotation(id, data) {
        try {
            set({ loading: true });
            await apiCallManager.updateQuotation(id, data);
            await get().fetchQuotations();
        } catch (err: unknown) {
            set({ error: err instanceof Error ? err.message : "Failed to update quotation", loading: false });
        }
    },

    async deleteQuotation(id) {
        try {
            set({ loading: true });
            await apiCallManager.deleteQuotation(id);
            await get().fetchQuotations();
        } catch (err: unknown) {
            set({ error: err instanceof Error ? err.message : "Failed to delete quotation", loading: false });
        }
    },

    async updateProposal(quoteId, proposalId, status) {
        try {
            set({ loading: true });
            await apiCallManager.updateProposalStatus(quoteId, proposalId, status);
            await get().fetchQuotations();
        } catch (err: unknown) {
            set({ error: err instanceof Error ? err.message : "Failed to update proposal", loading: false });
        }
    },

    // UI Actions
    setActiveTab: (tab) => set({ activeTab: tab }),
    setSelectedOrder: (order) => set({ selectedOrder: order }),
    setProductType: (type) => set({ productType: type }),
    setFormData: (update) => set((state) => ({
        formData: typeof update === 'function' ? update(state.formData) : { ...state.formData, ...update }
    })),
    resetForm: () => set({ formData: initialFormData, productType: "" }),
}));
