import { useState, useMemo, useEffect } from "react";
import { TruckHistoryRecord } from "@/types/truck.types";

export const useTruckFilters = (records: TruckHistoryRecord[]) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedJenisMobil, setSelectedJenisMobil] = useState("all");
    const [selectedDepartment, setSelectedDepartment] = useState("all");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [recordsPerPage] = useState(5);
    const [sortBy, setSortBy] = useState("arrivaltime");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

    const filteredRecords = useMemo(() => {
        let filtered = [...records];

        // Search filter
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            filtered = filtered.filter(record =>
                (record.platenumber && record.platenumber.toLowerCase().includes(search)) ||
                (record.driver && record.driver.toLowerCase().includes(search)) ||
                (record.supplier && record.supplier.toLowerCase().includes(search)) ||
                (record.goods && record.goods.toLowerCase().includes(search))
            );
        }

        // Department filter
        if (selectedDepartment !== "all") {
            filtered = filtered.filter(record => record.department === selectedDepartment);
        }

        // Jenis Mobil filter
        if (selectedJenisMobil !== "all") {
            filtered = filtered.filter(record => record.jenismobil === selectedJenisMobil);
        }

        // Date from filter
        if (dateFrom) {
            filtered = filtered.filter(record => {
                if (!record.date) return false;
                const recordDate = new Date(record.date).toDateString();
                const fromDate = new Date(dateFrom).toDateString();
                return recordDate >= fromDate;
            });
        }

        // Date to filter
        if (dateTo) {
            filtered = filtered.filter(record => {
                if (!record.date) return false;
                const recordDate = new Date(record.date).toDateString();
                const toDate = new Date(dateTo).toDateString();
                return recordDate <= toDate;
            });
        }

        // Apply sorting
        filtered.sort((a, b) => {
            let aValue: any, bValue: any;

            switch (sortBy) {
                case "platenumber":
                    aValue = a.platenumber || "";
                    bValue = b.platenumber || "";
                    break;
                case "driver":
                    aValue = a.driver || "";
                    bValue = b.driver || "";
                    break;
                case "supplier":
                    aValue = a.supplier || "";
                    bValue = b.supplier || "";
                    break;
                case "status":
                    aValue = a.status || "";
                    bValue = b.status || "";
                    break;
                case "date":
                default:
                    aValue = a.date ? new Date(a.date) : new Date(0);
                    bValue = b.date ? new Date(b.date) : new Date(0);
                    break;
            }

            if (sortOrder === "asc") {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        return filtered;
    }, [records, sortBy, sortOrder, searchTerm, selectedJenisMobil, selectedDepartment, dateFrom, dateTo]);

    // Reset current page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [filteredRecords.length]);

    // Pagination
    const indexOfLastRecord = currentPage * recordsPerPage;
    const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
    const currentRecords = filteredRecords.slice(indexOfFirstRecord, indexOfLastRecord);
    const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);

    const clearFilters = () => {
        setSearchTerm("");
        setSelectedDepartment("all");
        setSelectedJenisMobil("all");
        setDateFrom("");
        setDateTo("");
    };

    return {
        filteredRecords,
        currentRecords,
        searchTerm,
        setSearchTerm,
        selectedJenisMobil,
        setSelectedJenisMobil,
        selectedDepartment,
        setSelectedDepartment,
        dateFrom,
        setDateFrom,
        dateTo,
        setDateTo,
        currentPage,
        setCurrentPage,
        recordsPerPage,
        sortBy,
        setSortBy,
        sortOrder,
        setSortOrder,
        totalPages,
        indexOfFirstRecord,
        indexOfLastRecord,
        clearFilters
    };
};