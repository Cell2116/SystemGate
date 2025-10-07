// TODO Photo Still not Exist

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useTruckHistory } from "@/hooks/trucks/useTruckHistory";
import { useTruckFilters }  from "@/hooks/trucks/useTruckFilters";
import TruckFilters from "@/components/trucks/tablehistory/TruckFilters";
import TruckTable from "@/components/trucks/tablehistory/TruckTable";
import TruckPagination from "@/components/trucks/tablehistory/TruckPagination";
import TruckModal from "@/components/trucks/tablehistory/TruckModal";
import ExportButton from "@/components/trucks/tablehistory/ExportButton";
import { useDashboardStore } from "@/store/dashboardStore";
import { useState } from "react";
import { TruckHistoryRecord } from "@/types/truck.types";

export default function TruckHistory() {
    const [filterOpen, setFilterOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<TruckHistoryRecord | null>(null);

    // Custom hooks
    const { records, fetchTruckHistory, fetchData, loading, error } = useTruckHistory();
    const {
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
    } = useTruckFilters(records);

    return (
        <>
            <div className="min-h-screen flex flex-col space-y-4 p-3 bg-gray-50">
                {/* Header */}
                <div className="z-10 sticky top-0 pb-2 bg-gray-50">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Truck History</h1>
                            <p className="mt-1 text-sm text-gray-500">
                                View and manage historical truck records and shipment data
                            </p>
                        </div>
                        <div className="mt-4 sm:mt-0 flex items-center gap-2">
                            <ExportButton data={filteredRecords} type="truck" />
                            <button
                                onClick={fetchData}
                                disabled={loading}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
                            >
                                {loading ? "🔄 Loading..." : "🔄 Refresh"}
                            </button>
                            <button
                                onClick={() => setFilterOpen((prev) => !prev)}
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
                <TruckFilters
                    filterOpen={filterOpen}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    selectedDepartment={selectedDepartment}
                    setSelectedDepartment={setSelectedDepartment}
                    selectedJenisMobil={selectedJenisMobil}
                    setSelectedJenisMobil={setSelectedJenisMobil}
                    dateFrom={dateFrom}
                    setDateFrom={setDateFrom}
                    dateTo={dateTo}
                    setDateTo={setDateTo}
                    sortBy={sortBy}
                    setSortBy={setSortBy}
                    sortOrder={sortOrder}
                    setSortOrder={setSortOrder}
                    onClearFilters={clearFilters}
                />

                {/* Records Table */}
                <Card className={`${filterOpen ? 'hidden md:block' : 'block'}`}>
                    <TruckTable
                        loading={loading}
                        filteredRecords={filteredRecords}
                        currentRecords={currentRecords}
                        filterOpen={filterOpen}
                        onViewDetails={setSelectedRecord}
                    />
                </Card>

                {/* Pagination */}
                {totalPages > 1 && (
                    <TruckPagination
                        filterOpen={filterOpen}
                        currentPage={currentPage}
                        totalPages={totalPages}
                        indexOfFirstRecord={indexOfFirstRecord}
                        indexOfLastRecord={indexOfLastRecord}
                        filteredRecordsLength={filteredRecords.length}
                        onPageChange={setCurrentPage}
                    />
                )}
            </div>

            {/* Detail Modal */}
            <TruckModal
                selectedRecord={selectedRecord}
                onClose={() => setSelectedRecord(null)}
            />
        </>
    );
}