"use client";

import { useEffect } from "react";
import { useAnalyticsStore } from "@/store/reducers/analyticsStore";

export const useAnalyticsSuggestions = (page = 1) => {
    const {
        products,
        totalItems,
        totalPages,
        currentPage,
        chartData,
        loading,
        error,
        fetchAnalyticsSuggestions,
    } = useAnalyticsStore();

    // Trigger fetch when page changes
    useEffect(() => {
        fetchAnalyticsSuggestions(page);
        // fetchAnalyticsSuggestions from zustand store is a stable reference — only re-run on page change
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);

    return {
        products,
        totalItems,
        totalPages,
        currentPage,
        chartData,
        loading,
        error,
    };
};
