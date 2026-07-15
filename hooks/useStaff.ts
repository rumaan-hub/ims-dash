"use client";

import { useEffect, useMemo, useState } from "react";
import { Staff, useStaffStore } from "@/store/reducers/staffStore";
import toast from "react-hot-toast";
import { apiCallManager } from "@/_api_/apiCallManager";

export const useStaffPage = () => {
    const {
        staff,
        offices,
        loading,
        error,
        fetchStaff,
        fetchOffices,
        updateStaff,
        deleteStaff,
    } = useStaffStore();

    // Backend role payload — `role_id`/`role_name` fields are what the staff page consumes.
    type Role = {
        id?: string;
        role_id?: string;
        name?: string;
        role_name?: string;
        description?: string;
    };
    const [rolesList, setRolesList] = useState<Role[]>([]);
    const [search, setSearch] = useState("");
    const [filterOffice, setFilterOffice] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    // Inline form-level error shown inside the modal
    const [formError, setFormError] = useState("");

    const [form, setForm] = useState({
        staff_id: "",
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        address: "",
        designation: "",
        officeOffice_id: "",
        role_id: "",
        password: ""
    });

    const fetchRoles = async () => {
        try {
            const data = await apiCallManager.getRoles();
            setRolesList(data);
        } catch (err) {
            console.error("Failed to fetch roles", err);
        }
    };

    useEffect(() => {
        fetchStaff();
        fetchOffices();
        fetchRoles();
        // initial-load only — fetchers from zustand store are stable references
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const filtered = useMemo(() => {
        return staff.filter(
            (s) =>
                (s.first_name.toLowerCase().includes(search.toLowerCase()) ||
                    s.last_name.toLowerCase().includes(search.toLowerCase()) ||
                    s.email.toLowerCase().includes(search.toLowerCase())) &&
                (!filterOffice || s.office?.office_name === filterOffice)
        );
    }, [staff, search, filterOffice]);

    const openAdd = () => {
        setFormError("");
        setForm({
            staff_id: "",
            first_name: "",
            last_name: "",
            email: "",
            phone: "",
            address: "",
            designation: "",
            officeOffice_id: "",
            role_id: "",
            password: ""
        });
        setShowModal(true);
    };

    const openEdit = (s: Staff) => {
        setFormError("");
        setForm({
            staff_id: s.staff_id,
            first_name: s.first_name,
            last_name: s.last_name,
            email: s.email,
            phone: s.phone || "",
            address: s.address || "",
            designation: s.designation,
            officeOffice_id: s.officeOffice_id || "",
            role_id: "", // We will handle fetching current role if needed, or just let them re-assign
            password: ""
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setFormError("");
        setShowModal(false);
    };

    // Helper: extract real message from NestJS/Axios error
    const extractError = (err: unknown, fallback: string): string => {
        const errObj = err as { response?: { data?: { message?: string | string[] } }; message?: string };
        const msg = errObj?.response?.data?.message ?? errObj?.message ?? fallback;
        return Array.isArray(msg) ? msg.join(", ") : String(msg);
    };

    const saveStaff = async () => {
        // Frontend validation — catch before hitting the API
        if (!form.first_name.trim()) return setFormError("First name is required.");
        if (!form.last_name.trim()) return setFormError("Last name is required.");
        if (!form.email.trim()) return setFormError("Email is required.");
        if (!form.designation.trim()) return setFormError("Designation is required.");

        // Check for duplicate email on the frontend first (only for new staff)
        if (!form.staff_id) {
            const duplicate = staff.find(
                (s) => s.email.toLowerCase() === form.email.trim().toLowerCase()
            );
            if (duplicate) {
                return setFormError(
                    `A staff member with this email already exists: ${duplicate.first_name} ${duplicate.last_name}`
                );
            }
        }

        setFormError("");

        const payload = {
            first_name: form.first_name.trim(),
            last_name: form.last_name.trim(),
            email: form.email.trim(),
            designation: form.designation.trim(),
            phone: form.phone.trim() || undefined,
            address: form.address.trim() || undefined,
            officeOffice_id: form.officeOffice_id || undefined,
            password: form.password.trim() || undefined,
        };

        try {
            if (form.staff_id) {
                await updateStaff(form.staff_id, payload);
                if (form.role_id) {
                    await apiCallManager.assignRoleToStaff(form.staff_id, form.role_id);
                }
                toast.success("Staff updated successfully!");
            } else {
                const response = await apiCallManager.createStaff(payload);
                const newStaffId = response.staff_id;
                if (form.role_id && newStaffId) {
                    await apiCallManager.assignRoleToStaff(newStaffId, form.role_id);
                }
                toast.success("Staff added successfully!");
            }
            await fetchStaff();
            setShowModal(false);
        } catch (err: unknown) {
            const msg = extractError(err, "Failed to save staff.");
            // Show inline in the modal — much more visible than a toast
            setFormError(msg);
        }
    };

    // Opens the in-page confirm modal
    const removeStaff = () => setShowConfirm(true);

    // Performs the actual deletion
    const confirmDelete = async () => {
        setShowConfirm(false);
        try {
            await deleteStaff(form.staff_id);
            await fetchStaff();
            setShowModal(false);
            toast.success("Staff deleted successfully!");
        } catch (err: unknown) {
            const msg = extractError(err, "Failed to delete staff.");
            toast.error(msg);
        }
    };

    const cancelConfirm = () => setShowConfirm(false);

    return {
        staff: filtered,
        offices,
        rolesList,
        loading,
        error,
        formError,
        search,
        setSearch,
        filterOffice,
        setFilterOffice,
        showModal,
        showConfirm,
        form,
        setForm,
        openAdd,
        openEdit,
        closeModal,
        saveStaff,
        removeStaff,
        confirmDelete,
        cancelConfirm,
    };
};
