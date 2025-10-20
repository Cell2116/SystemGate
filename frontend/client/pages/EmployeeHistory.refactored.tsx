
import { useState, useEffect } from "react";
import { useEmployeeHistory } from "@/hooks/employee/useEmployeeHistory";
import { useEmployeeFilters } from "@/hooks/employee/useEmployeeFilters";
import { HistoryRecord } from "@/types/employee.types";
import EmployeeFilters from "@/components/employee/employeeHistory/EmployeeFilters";
import EmployeeTable from "@/components/employee/employeeHistory/EmployeeTable";
import EmployeePagination from "@/components/employee/employeeHistory/EmployeePagination";
import EmployeeModal from "@/components/employee/employeeHistory/EmployeeModal";
import ExportButton from "@/components/employee/employeeHistory/ExportButton";

export default function EmployeeHistory() {
    
    const { records, loading, error, fetchData } = useEmployeeHistory();
    const [filterOpen, setFilterOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<HistoryRecord | null>(null);
    
    const {
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
    } = useEmployeeFilters(records);
    
    useEffect(() => {
        fetchData({});
    }, []);
    
    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            fetchData({
                searchTerm,
                department: selectedDepartment,
                status: selectedStatus,
                dateFrom,
                dateTo
            });
        }, 500);
        return () => clearTimeout(debounceTimer);
    }, [searchTerm, selectedDepartment, selectedStatus, dateFrom, dateTo]);
    return (
        <>
            <div className="min-h-screen flex flex-col space-y-4 p-3 bg-gray-50">
                {/* Header */}
                <div className="z-10 sticky top-0 pb-2 bg-gray-50">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Employee History</h1>
                            <p className="mt-1 text-sm text-gray-500">
                                View and manage historical employee attendance records
                            </p>
                        </div>
                        <div className="mt-4 sm:mt-0 flex items-center gap-2">
                            <ExportButton filteredRecords={filteredRecords} />
                            <button
                                onClick={() => fetchData({})}
                                disabled={loading}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
                            >
                                {loading ? "🔄 Loading..." : "🔄 Refresh"}
                            </button>
                            <button
                                onClick={() => setFilterOpen(!filterOpen)}
                                className="px-4 py-2 md:px-2 md:py-1 md:mr-4 bg-blue-600 text-white rounded-lg font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all hover:bg-blue-500"
                            >
                                {filterOpen ? 'Hide Filter ▲' : 'Show Filter ▼'}
                            </button>
                        </div>
                    </div>
                    {error && (
                        <div className="mt-2 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                            <p className="text-sm">⚠️ {error}</p>
                        </div>
                    )}
                </div>
                <div className="flex justify-center items-center xl:items-end xl:justify-end">
                    <div className="text-xs text-gray-500">
                        {filteredRecords.length} of {records.length} records
                    </div>
                </div>
                {/* Filters */}
                <EmployeeFilters
                    filterOpen={filterOpen}
                    setFilterOpen={setFilterOpen}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    selectedDepartment={selectedDepartment}
                    setSelectedDepartment={setSelectedDepartment}
                    selectedStatus={selectedStatus}
                    setSelectedStatus={setSelectedStatus}
                    dateFrom={dateFrom}
                    setDateFrom={setDateFrom}
                    dateTo={dateTo}
                    setDateTo={setDateTo}
                    sortBy={sortBy}
                    setSortBy={setSortBy}
                    sortOrder={sortOrder}
                    setSortOrder={setSortOrder}
                    clearFilters={clearFilters}
                    records={records}
                />
                {/* Records Table */}
                <EmployeeTable
                    filterOpen={filterOpen}
                    loading={loading}
                    filteredRecords={filteredRecords}
                    currentRecords={currentRecords}
                    setSelectedRecord={setSelectedRecord}
                />
                {/* Pagination */}
                <EmployeePagination
                    filterOpen={filterOpen}
                    totalPages={totalPages}
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    indexOfFirstRecord={indexOfFirstRecord}
                    indexOfLastRecord={indexOfLastRecord}
                    filteredRecords={filteredRecords}
                />
            </div>
            {/* Detail Modal */}
            <EmployeeModal
                selectedRecord={selectedRecord}
                setSelectedRecord={setSelectedRecord}
            />
        </>
    );
}