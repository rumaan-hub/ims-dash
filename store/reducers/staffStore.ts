import { create } from "zustand";
import { apiCallManager } from "@/_api_/apiCallManager";

export type Staff = {
    staff_id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    address?: string;
    designation: string;
    officeOffice_id?: string;
    office?: {
        office_id: string;
        office_name: string;
        address: string;
    };
};

//Office selecting Attributes
export type Office = {
    office_id: string;
    office_name: string;
    address: string;
};

type StaffStore = {
    staff: Staff[];
    offices: Office[];
    loading: boolean;
    error: string;

    fetchStaff: () => Promise<void>;
    fetchOffices: () => Promise<void>;
    addStaff: (data: Partial<Staff>) => Promise<void>;
    updateStaff: (id: string, data: Partial<Staff>) => Promise<void>;
    deleteStaff: (id: string) => Promise<void>;
};

export const useStaffStore = create<StaffStore>((set) => ({
    staff: [],
    offices: [],
    loading: false,
    error: "",

    fetchStaff: async () => {
        set({ loading: true, error: "" });
        try {
            const data = await apiCallManager.getStaff();
            set({ staff: data });
        } catch {
            set({ error: "Failed to load staff" });
        } finally {
            set({ loading: false });
        }
    },

    fetchOffices: async () => {
        try {
            // Light endpoint — no nested user join, only essential fields
            const res = await apiCallManager.getLightOffices();
            const data = res.data ?? res; // handles both { data: [] } and plain []
            set({ offices: data });
        } catch {
            set({ error: 'Failed to load offices' });
        }
    },


    addStaff: async (data) => {
        await apiCallManager.createStaff(data);
    },

    updateStaff: async (id, data) => {
        await apiCallManager.updateStaff(id, data);
    },

    deleteStaff: async (id) => {
        await apiCallManager.deleteStaff(id);
    },
}));
