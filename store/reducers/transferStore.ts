import { create } from "zustand";
import { apiCallManager } from "@/_api_/apiCallManager";

// Matches the backend Transfer model response
export type TransferItem = {
  id: string;
  client_id?: string;
  source_office_id: string;
  destination_office_id: string;
  status: "Pending" | "In Transit" | "Completed";
  transfer_date: string;
  created_at: string;
  details: { productId: string; qty: number; product?: Record<string, unknown> }[];
};

export type Office = {
  office_id: string;
  office_name: string;
  client_id: string;
};

export type DBProduct = {
  id: string;
  title: string;
  brand?: string;
  variants?: { sku?: string; barCode?: string }[];
  stock?: number;
};

type TransferState = {
  transfers: TransferItem[];
  offices: Office[];
  products: DBProduct[];
  loading: boolean;
  loadingOffices: boolean;
  loadingProducts: boolean;
  error: string | null;

  // Pagination for products
  currentPage: number;
  totalPages: number;
  totalProducts: number;

  fetchTransfers: () => Promise<void>;
  fetchOffices: () => Promise<Office[] | void>;
  fetchProducts: (searchTerm: string, page?: number, limit?: number, officeId?: string, onlyInventory?: boolean) => Promise<void>;
  createTransfer: (payload: Record<string, unknown>) => Promise<TransferItem | void>;
  changeStatus: (id: string, currentStatus: string) => Promise<void>;

  // Setters (keeping if needed for direct state manipulation)
  setTransfers: (data: TransferItem[]) => void;
  setOffices: (data: Office[]) => void;
  setProducts: (data: DBProduct[]) => void;
  addTransfer: (item: TransferItem) => void;
  updateStatus: (id: string, status: TransferItem["status"]) => void;
};

export const useTransferStore = create<TransferState>((set, get) => ({
  transfers: [],
  offices: [],
  products: [],
  loading: false,
  loadingOffices: false,
  loadingProducts: false,
  error: null,

  currentPage: 1,
  totalPages: 1,
  totalProducts: 0,

  setTransfers: (data) => set({ transfers: data }),
  setOffices: (data) => set({ offices: data }),
  setProducts: (data) => set({ products: data }),
  addTransfer: (item) => set((state) => ({ transfers: [item, ...state.transfers] })),
  updateStatus: (id, status) => set((state) => ({
    transfers: state.transfers.map((t) => t.id === id ? { ...t, status } : t),
  })),

  fetchTransfers: async () => {
    set({ loading: true, error: null });
    try {
      const data = await apiCallManager.getTransfers();
      set({ transfers: data });
    } catch (err: unknown) {
      set({ error: (err as Error).message || "Failed to fetch transfers" });
    } finally {
      set({ loading: false });
    }
  },

  fetchOffices: async () => {
    set({ loadingOffices: true, error: null });
    try {
      // Uses the light endpoint — no nested user join, only essential fields
      const res = await apiCallManager.getLightOffices();
      const data = res.data ?? res; // support both { data: [] } and plain [] shapes
      set({ offices: data });
      return data;
    } catch (err: unknown) {
      set({ error: (err as Error).message || 'Failed to fetch offices' });
    } finally {
      set({ loadingOffices: false });
    }
  },


  fetchProducts: async (searchTerm: string, page: number = 1, limit: number = 50, officeId?: string, onlyInventory?: boolean) => {
    set({ loadingProducts: true, error: null });
    try {
      const data = await apiCallManager.getLightProducts(searchTerm, page, limit, officeId, onlyInventory);
      set({
        products: data.data || [],
        currentPage: data.currentPage || 1,
        totalPages: data.totalPages || 1,
        totalProducts: data.totalProducts || 0,
      });
    } catch (err: unknown) {
      set({ error: (err as Error).message || "Failed to fetch products" });
    } finally {
      set({ loadingProducts: false });
    }
  },

  createTransfer: async (payload: Record<string, unknown>) => {
    set({ loading: true, error: null });
    try {
      const data = await apiCallManager.createTransfer(payload);
      set((state) => ({ transfers: [data, ...state.transfers] }));
      return data;
    } catch (err: unknown) {
      set({ error: (err as Error).message || "Failed to create transfer" });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  changeStatus: async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "Pending" ? "In Transit" : "Completed";
    set({ loading: true, error: null });
    try {
      await apiCallManager.updateTransferStatus(id, newStatus);
      get().updateStatus(id, newStatus);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      const msg = errorObj.response?.data?.message || errorObj.message || "Failed to update status";
      set({ error: msg });
      throw new Error(msg);
    } finally {
      set({ loading: false });
    }
  },
}));


