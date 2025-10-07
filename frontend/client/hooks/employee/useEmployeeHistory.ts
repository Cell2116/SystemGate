import { useState, useEffect } from "react";
import { useDashboardStore } from "@/store/dashboardStore";
import { HistoryRecord, FilterParams } from "@/types/employee.types";

export const useEmployeeHistory = () => {
    const { fetchHistoryRecords, loading, error } = useDashboardStore();
    const [records, setRecords] = useState<HistoryRecord[]>([]);

    const fetchData = async (filters: FilterParams) => {
        try {
            const cleanFilters = {
                searchTerm: filters.searchTerm || undefined,
                department: filters.department !== "all" ? filters.department : undefined,
                status: filters.status !== "all" ? filters.status : undefined,
                dateFrom: filters.dateFrom || undefined,
                dateTo: filters.dateTo || undefined,
            };

            const data = await fetchHistoryRecords(cleanFilters);
            setRecords(data);
        } catch (err) {
            console.error("Failed to fetch history records:", err);
        }
    };

    return {
        records,
        setRecords,
        loading,
        error,
        fetchData
    };
};