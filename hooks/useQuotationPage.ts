"use client";
import React, { useEffect } from "react";
import { useQuotationStore } from "../store/reducers/quotationStore";
import toast from "react-hot-toast";

export const useQuotationPage = () => {

  const {
    quotations,
    products,
    loading,
    error,
    activeTab,
    selectedOrder,
    productType,
    formData,
    cart,
    currentPage,
    totalPages,
    totalProducts,
    fetchQuotations,
    fetchProducts,
    addQuotation,
    addToCart,
    removeFromCart,
    updateProposal,
    setActiveTab,
    setSelectedOrder,
    setProductType,
    setFormData,
    resetForm,
  } = useQuotationStore();

  // Fetch initial data
  useEffect(() => {
    fetchQuotations();
    fetchProducts();
    // initial-load only — fetchers from zustand store are stable references
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenModal = () => {
    // Sentinel "new" order — only `id` matters here; modal logic uses null vs non-null.
    setSelectedOrder({ id: 'new' } as never);
  };

  const handleCloseModal = () => {
    setSelectedOrder(null);
    resetForm();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type } = target;
    const val = type === 'checkbox' ? target.checked : value;
    setFormData((prev) => ({ ...prev, [name]: val }));
  };

  const handleAddToCart = () => {
    if (!formData.productName) {
      toast.error("Please select a product");
      return;
    }
    addToCart({
      ...formData,
      productType: productType === 'new' ? 'New' : 'Existing'
    });
    // Keep descriptions if needed, but usually clear productName for next item
    setFormData((prev) => ({ ...prev, productName: "", quantity: "1" }));
    toast.success("Added to list");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await addQuotation();
      setActiveTab("quotations");
      handleCloseModal();
      toast.success("Quotations requested!");
    } catch {
      toast.error("Failed to send requests");
    }
  };

  const handleUpdateProposal = async (quoteId: string, proposalId: string, status: string) => {
    try {
      await updateProposal(quoteId, proposalId, status);
      toast.success(`Proposal ${status}`);
    } catch {
      toast.error("Action failed");
    }
  };

  return {
    quotations,
    products,
    loading,
    error,
    activeTab,
    selectedOrder,
    productType,
    formData,
    cart,
    currentPage,
    totalPages,
    totalProducts,
    setActiveTab,
    setProductType,
    setFormData,
    handleOpenModal,
    handleCloseModal,
    handleInputChange,
    handleAddToCart,
    removeFromCart,
    handleSubmit,
    setSelectedOrder,
    fetchProducts,
    handleUpdateProposal
  };
};



