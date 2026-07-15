import { useDashboardStore } from "@/store/reducers/dashboardStore";

export const useDashboard = () => {
    const {
        totalProducts,
        staffCount,
        nearExpiryCount,
        lowStockCount,
        lowStockItems,
        categoryData,
        allTransactions,
        loading,
        error,
        fetchDashboardData,
        fetchDataForCsvExport
    } = useDashboardStore();

    return {
        totalProducts,
        staffCount,
        nearExpiryCount,
        lowStockCount,
        lowStockItems,
        categoryData,
        allTransactions,
        loading,
        error,
        fetchDashboardData,
        fetchDataForCsvExport
    };
};
