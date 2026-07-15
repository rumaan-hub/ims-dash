import { useEffect, useCallback } from "react";
import { usePurchaseStore } from "../store/reducers/purchaseStore";
import { useImsUser } from "./useImsUser";

export const usePurchasePage = () => {
    const { clientId, loading: userLoading } = useImsUser();

    const {
        products,
        proposals,
        purchaseHistory,
        purchaseRows,
        remarks,
        loading: storeLoading,
        error,
        dropdownItems,
        dropdownTotalPages,
        dropdownIsLoading,
        fetchProducts,
        fetchDropdownProducts,
        fetchProposals,
        fetchPurchaseHistory,
        createPurchase,
        acceptProposal,
        rejectProposal,
        addRow,
        removeRow,
        updateRow,
        setRemarks,
        resetForm
    } = usePurchaseStore();

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    useEffect(() => {
        if (clientId) {
            fetchProposals(clientId);
            fetchPurchaseHistory(clientId);
        }
    }, [clientId, fetchProposals, fetchPurchaseHistory]);

    const handlePlaceOrder = useCallback(async () => {
        if (!clientId) throw new Error("User NOT identified");

        const validRows = purchaseRows.filter(row => row.productId);
        if (validRows.length === 0) throw new Error("Please select at least one product");

        const payload = {
            client_id: clientId,
            is_quotation: false,
            remarks: remarks || "Direct Purchase from Client IMS",
            details: validRows.map(row => ({
                productId: row.productId,
                quantity: row.quantity,
                unit_price: row.unitPrice,
                description: row.notes
            }))
        };

        await createPurchase(payload);
        resetForm();
    }, [clientId, createPurchase, purchaseRows, remarks, resetForm]);

    const handleAcceptProposal = useCallback(async (id: string) => {
        if (!clientId) return;
        return await acceptProposal(id, clientId);
    }, [clientId, acceptProposal]);

    const handleRejectProposal = useCallback(async (id: string) => {
        if (!clientId) return;
        return await rejectProposal(id, clientId);
    }, [clientId, rejectProposal]);

    const totalAmount = purchaseRows.reduce((sum, row) => sum + (row.amount || 0), 0);

    return {
        products,
        proposals,
        purchaseHistory,
        purchaseRows,
        remarks,
        loading: userLoading || storeLoading,
        error,
        handlePlaceOrder,
        handleAcceptProposal,
        handleRejectProposal,
        addRow,
        removeRow,
        updateRow,
        setRemarks,
        totalAmount,
        clientId,
        dropdownItems,
        dropdownTotalPages,
        dropdownIsLoading,
        fetchDropdownProducts
    };
};
