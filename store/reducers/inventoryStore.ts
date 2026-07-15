import { create } from 'zustand';
import { apiCallManager } from '@/_api_/apiCallManager';
import { Office, Staff } from './staffStore';

export interface LightProductVariant {
    sku?: string;
    barCode?: string;
    price?: number;
    [key: string]: unknown;
}

export interface LightProductCategory {
    id?: string | number;
    name?: string;
    [key: string]: unknown;
}

export interface LightProductBrand {
    id?: string | number;
    name?: string;
    [key: string]: unknown;
}

export interface LightProductMaterial {
    id?: string | number;
    name?: string;
    [key: string]: unknown;
}

export interface LightProductVendor {
    id?: string | number;
    name?: string;
    [key: string]: unknown;
}

export interface LightProduct {
    id: string | number;
    title?: string;
    name?: string;
    brand?: LightProductBrand | string; // Nested objects from backend vary
    category?: string;
    categories?: LightProductCategory[];
    size?: string;
    packaging?: string;
    material?: LightProductMaterial | string;
    batch?: string;
    batch_no?: string;
    expiry?: string;
    expiry_date?: string;
    supplier?: string;
    vendor?: LightProductVendor | string;
    price?: number;
    unit_price?: number;
    quantity?: number;
    sku?: string;
    barCode?: string;
    inventoryType?: string;
    variants?: LightProductVariant[];
    source?: 'catalog' | 'custom';
    customProductId?: string;
    data?: Record<string, unknown>;
    inventory_type?: string;
}

export interface Product {
    id: string | number;
    type: 'Consumable' | 'Equipment' | 'Custom Products';
    name: string;
    category: string;
    size?: string;
    brand?: string;
    material?: string;
    batch: string;
    expiry?: string;
    available: number;
    used: number;
    damaged: number;
    repair: number;
    price?: number;
    supplier?: string;
    staffIn?: string;
    status?: 'Available' | 'In Use' | 'In Repair' | 'Damaged' | 'Discarded';
    assignedTo?: string;
    room?: string;
    productId?: string;
    office_id?: string;
    destination_office_id?: string;
    staff_id?: string;
    transaction_type?: string;
    unit_price?: number;
    _product?: LightProduct;
    office?: Office;
    staff?: Staff;
    source?: 'catalog' | 'custom';
    customProductId?: string;
}

type InventoryStore = {
    products: Product[];
    offices: Office[];
    staff: Staff[];
    allDbProducts: LightProduct[];
    loading: boolean;
    error: string;
    dropdownItems: LightProduct[];
    dropdownTotalPages: number;
    dropdownIsLoading: boolean;

    fetchProducts: (officeId?: string) => Promise<void>;
    fetchOffices: () => Promise<void>;
    fetchStaff: () => Promise<void>;
    fetchAllDbProducts: () => Promise<void>;
    fetchDropdownItems: (search: string, page: number, limit: number, inventoryType?: 'CONSUMABLE' | 'EQUIPMENT') => Promise<void>;
    addProduct: (data: Partial<Product>) => Promise<void>;
    updateProduct: (id: number | string, data: Partial<Product>) => Promise<void>;
    deleteProduct: (id: number | string) => Promise<void>;
    fetchCompleteProductById: (id: string) => Promise<LightProduct | null>;
};

export const useInventoryStore = create<InventoryStore>((set) => ({
    products: [],
    offices: [],
    staff: [],
    allDbProducts: [],
    loading: false,
    error: "",
    dropdownItems: [],
    dropdownTotalPages: 1,
    dropdownIsLoading: false,

    fetchProducts: async (officeId?: string) => {
        set({ loading: true, error: "" });
        try {
            const data = await apiCallManager.getInventory(officeId ? { officeId } : undefined);
            set({ products: data.data || data });
        } catch {
            set({ error: "Failed to load inventory" });
        } finally {
            set({ loading: false });
        }
    },

    fetchOffices: async () => {
        try {
            const res = await apiCallManager.getLightOffices();
            set({ offices: res.data ?? res ?? [] });
        } catch (error) { console.warn("Failed to load offices", error); }
    },

    fetchStaff: async () => {
        try {
            const data = await apiCallManager.getStaff();
            set({ staff: data?.data ?? data ?? [] });
        } catch (error) { console.warn("Failed to load staff", error); }
    },

    fetchAllDbProducts: async () => {
        try {
            const res = await apiCallManager.getLightProducts("", 1, 1000);
            const productsArray = Array.isArray(res) ? res : (res?.data && Array.isArray(res.data) ? res.data : []);
            const catalog: LightProduct[] = productsArray.map((p: LightProduct) => ({ ...p, source: 'catalog' as const }));

            // Merge this client's custom (non-catalog) products so they appear in the picker + scanner.
            let custom: LightProduct[] = [];
            try {
                const cres = await apiCallManager.getCustomProducts("", 1, 1000);
                const carr = Array.isArray(cres) ? cres : (cres?.data && Array.isArray(cres.data) ? cres.data : []);
                custom = carr.map((c: Record<string, any>) => ({
                    id: c.id as string,
                    name: c.name as string,
                    title: c.name as string,
                    brand: (c.data?.brand as string) ?? '',
                    inventoryType: c.inventory_type as string,
                    inventory_type: c.inventory_type as string,
                    barCode: (c.data?.barcode as string) ?? undefined,
                    price: (c.data?.price as number) ?? 0,
                    unit_price: (c.data?.price as number) ?? 0,
                    data: (c.data as Record<string, unknown>) ?? {},
                    customProductId: c.id as string,
                    source: 'custom' as const,
                }));
            } catch (e) {
                console.warn("Failed to load custom products", e);
            }

            console.log(`Fetched ${catalog.length} catalog + ${custom.length} custom products for picker`);
            set({ allDbProducts: [...catalog, ...custom] });
        } catch (error) {
            console.warn("Failed to load all database products", error);
            set({ allDbProducts: [] });
        }
    },

    fetchDropdownItems: async (search: string, page: number, limit: number, inventoryType?: 'CONSUMABLE' | 'EQUIPMENT') => {
        set({ dropdownIsLoading: true });
        try {
            const res = await apiCallManager.getLightProducts(search, page, limit, undefined, false, inventoryType);
            const data = Array.isArray(res) ? res : (res?.data || []);
            const total = res?.totalPages || res?.total_pages || res?.meta?.totalPages || Math.ceil((res?.total || data.length) / limit) || 1;

            set({ dropdownItems: data, dropdownTotalPages: total });
        } catch (error) {
            console.error("Failed to fetch light products", error);
            set({ dropdownItems: [], dropdownTotalPages: 1 });
        } finally {
            set({ dropdownIsLoading: false });
        }
    },

    addProduct: async (data) => {
        await apiCallManager.createInventory(data);
    },

    updateProduct: async (id: string | number, data: Partial<Product>) => {
        await apiCallManager.updateInventory(id, data);
    },

    deleteProduct: async (id: string | number) => {
        await apiCallManager.deleteInventory(id);
    },

    fetchCompleteProductById: async (id: string) => {
        try {
            const res = await apiCallManager.getProductById(id);
            return res?.data || res;
        } catch (error) {
            console.warn("Failed to fetch complete product data", error);
            return null;
        }
    },
}));
