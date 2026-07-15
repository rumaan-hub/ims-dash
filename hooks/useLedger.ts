"use client";

import { useEffect, useMemo, useState } from "react";
import { useLedgerStore } from "@/store/reducers/ledgerStore";

export interface LedgerFilters {
    office: string;
    product: string;
    type: string;
    dateFrom: string;
    dateTo: string;
    search: string;
}

const DEFAULT_FILTERS: LedgerFilters = {
    office: "", product: "", type: "",
    dateFrom: "", dateTo: "", search: "",
};

export const useLedger = () => {
    const {
        transactions,
        lowStock,
        nearExpiry,
        loading,
        error,
        fetchAll,
    } = useLedgerStore();

    const [filters, setFilters] = useState<LedgerFilters>(DEFAULT_FILTERS);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortCol, setSortCol] = useState("date");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

    const rowsPerPage = 10;

    // Initial fetch on mount — no polling, no setInterval
    // initial-load only — fetchAll from zustand store is a stable reference
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { fetchAll(); }, []);

    // ── Filter + Sort ────────────────────────────────────────────────────────
    const filteredRows = useMemo(() => {
        let rows = transactions.filter(r =>
            (!filters.office || r.office.toLowerCase().includes(filters.office.toLowerCase())) &&
            (!filters.product || r.product.toLowerCase().includes(filters.product.toLowerCase())) &&
            (!filters.type || r.type === filters.type) &&
            (!filters.dateFrom || r.date >= filters.dateFrom) &&
            (!filters.dateTo || r.date <= filters.dateTo) &&
            (!filters.search ||
                r.product.toLowerCase().includes(filters.search.toLowerCase()) ||
                r.batch.toLowerCase().includes(filters.search.toLowerCase()) ||
                r.office.toLowerCase().includes(filters.search.toLowerCase()) ||
                r.user.toLowerCase().includes(filters.search.toLowerCase()) ||
                r.remarks.toLowerCase().includes(filters.search.toLowerCase()))
        );

        rows = [...rows].sort((a, b) => {
            let av: number | string = (a as unknown as Record<string, unknown>)[sortCol] as number | string ?? "";
            let bv: number | string = (b as unknown as Record<string, unknown>)[sortCol] as number | string ?? "";
            if (sortCol === "date") {
                av = new Date(String(av)).getTime();
                bv = new Date(String(bv)).getTime();
            } else if (sortCol === "qty" || sortCol === "balance" || sortCol === "price") {
                av = parseFloat(String(av).replace(/[^\d.-]/g, ""));
                bv = parseFloat(String(bv).replace(/[^\d.-]/g, ""));
            }
            if (av > bv) return sortDir === "asc" ? 1 : -1;
            if (av < bv) return sortDir === "asc" ? -1 : 1;
            return 0;
        });

        return rows;
    }, [transactions, filters, sortCol, sortDir]);

    const paginatedRows = useMemo(() => {
        const start = (currentPage - 1) * rowsPerPage;
        return filteredRows.slice(start, start + rowsPerPage);
    }, [filteredRows, currentPage]);

    const totalPages = Math.ceil(filteredRows.length / rowsPerPage);

    const handleSortChange = (col: string) => {
        if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
        else { setSortCol(col); setSortDir("asc"); }
        setCurrentPage(1);
    };

    const handleFilterChange = (key: keyof LedgerFilters, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setCurrentPage(1);
    };

    // Public refresh — called by inventory hooks after any IN/OUT/TRANSFER
    const refreshLedger = () => fetchAll();

    return {
        // data
        lowStock,
        nearExpiry,
        filteredRows,
        paginatedRows,
        totalPages,
        // state
        loading,
        error,
        filters,
        currentPage,
        sortCol,
        sortDir,
        rowsPerPage,
        // actions
        setCurrentPage,
        handleSortChange,
        handleFilterChange,
        refreshLedger,
    };
};
