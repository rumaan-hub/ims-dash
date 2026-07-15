import { useEffect } from "react";
import { useTransferStore } from "@/store/reducers/transferStore";

export const useTransfer = () => {
  const {
    transfers,
    offices,
    products,
    loading,
    loadingOffices,
    loadingProducts,
    currentPage,
    totalPages,
    totalProducts,
    fetchTransfers,
    fetchOffices,
    fetchProducts,
    createTransfer,
    changeStatus,
  } = useTransferStore();

  useEffect(() => {
    fetchTransfers();
    fetchOffices();
    // initial-load only — fetchers from zustand store are stable references
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    transfers,
    offices,
    products,
    loading,
    loadingOffices,
    loadingProducts,
    currentPage,
    totalPages,
    totalProducts,
    fetchProducts,
    createTransfer,
    changeStatus,
  };
};


