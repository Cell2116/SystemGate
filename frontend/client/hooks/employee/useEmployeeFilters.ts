import { useState, useEffect } from "react";
import { HistoryRecord } from "@/types/employee.types";

export const useEmployeeFilters = (records: HistoryRecord[]) => {
    const [filteredRecords, setFilteredRecords] = useState<HistoryRecord[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedDepartment, setSelectedDepartment] = useState("all");
    const [selectedStatus, setSelectedStatus] = useState("all");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [recordsPerPage] = useState(5);
    const [sortBy, setSortBy] = useState("datein");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

    useEffect(() => {
        let filtered = [...records];

        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            filtered = filtered.filter(record =>
                record.name.toLowerCase().includes(search) ||
                record.uid.toLowerCase().includes(search) ||
                record.licenseplate.toLowerCase().includes(search)
            );
        }

        if (selectedDepartment !== "all") {
            filtered = filtered.filter(record => record.department === selectedDepartment);
        }

        if (selectedStatus !== "all") {
            filtered = filtered.filter(record => record.status === selectedStatus);
        }

        if (dateFrom) {
            filtered = filtered.filter(record => {
                const recordDate = new Date(record.datein).toDateString();
                const fromDate = new Date(dateFrom).toDateString();
                return recordDate >= fromDate;
            });
        }

        if (dateTo) {
            filtered = filtered.filter(record => {
                const recordDate = new Date(record.datein).toDateString();
                const toDate = new Date(dateTo).toDateString();
                return recordDate <= toDate;
            });
        }

        // Apply sorting
        filtered.sort((a, b) => {
            let aValue: any, bValue: any;

            switch (sortBy) {
                case "name":
                    aValue = a.name;
                    bValue = b.name;
                    break;
                case "department":
                    aValue = a.department;
                    bValue = b.department;
                    break;
                case "licenseplate":
                    aValue = a.licenseplate;
                    bValue = b.licenseplate;
                    break;
                case "datein":
                default:
                    aValue = new Date(a.datein);
                    bValue = new Date(b.datein);
                    break;
            }

            if (sortOrder === "asc") {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        setFilteredRecords(filtered);
        setCurrentPage(1);
    }, [records, sortBy, sortOrder, searchTerm, selectedDepartment, selectedStatus, dateFrom, dateTo]);

    const clearFilters = () => {
        setSearchTerm("");
        setSelectedDepartment("all");
        setSelectedStatus("all");
        setDateFrom("");
        setDateTo("");
    };

    // Pagination
    const indexOfLastRecord = currentPage * recordsPerPage;
    const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
    const currentRecords = filteredRecords.slice(indexOfFirstRecord, indexOfLastRecord);
    const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);

    return {
        filteredRecords,
        searchTerm,
        setSearchTerm,
        selectedDepartment,
        setSelectedDepartment,
        selectedStatus,
        setSelectedStatus,
        dateFrom,
        setDateFrom,
        dateTo,
        setDateTo,
        currentPage,
        setCurrentPage,
        sortBy,
        setSortBy,
        sortOrder,
        setSortOrder,
        clearFilters,
        currentRecords,
        totalPages,
        indexOfFirstRecord,
        indexOfLastRecord
    };
};