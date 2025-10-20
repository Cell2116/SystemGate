import React from "react";
type CardProps = {
    children: React.ReactNode;
    className?: string;
};
const Card = ({ children, className = "" }: CardProps) => (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
        {children}
    </div>
);
type CardContentProps = {
    children: React.ReactNode;
    className?: string;
};
const CardContent = ({ children, className = "" }: CardContentProps) => (
    <div className={`p-6 ${className}`}>
        {children}
    </div>
);
interface TruckFiltersProps {
    filterOpen: boolean;
    searchTerm: string;
    setSearchTerm: (value: string) => void;
    selectedDepartment: string;
    setSelectedDepartment: (value: string) => void;
    selectedJenisMobil: string;
    setSelectedJenisMobil: (value: string) => void;
    dateFrom: string;
    setDateFrom: (value: string) => void;
    dateTo: string;
    setDateTo: (value: string) => void;
    sortBy: string;
    setSortBy: (value: string) => void;
    sortOrder: "asc" | "desc";
    setSortOrder: (value: "asc" | "desc") => void;
    onClearFilters: () => void;
}
export default function TruckFilters({
    filterOpen,
    searchTerm,
    setSearchTerm,
    selectedDepartment,
    setSelectedDepartment,
    selectedJenisMobil,
    setSelectedJenisMobil,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    onClearFilters
}: TruckFiltersProps) {
    return (
        <div
            className={`transition-all duration-300 overflow-hidden ${filterOpen ? 'max-h-[100vh] mb-2 xl:mb-0 max-w-[100vw]' : 'max-h-0'}  md:mb-0 md:block`}
        >
            <Card className="md:mb-0">
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
                        {/* Search */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Search
                            </label>
                            <input
                                type="text"
                                placeholder="Plate number, driver, supplier, or goods..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        {/* Department Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Department
                            </label>
                            <select
                                aria-label="Department"
                                value={selectedDepartment}
                                onChange={(e) => setSelectedDepartment(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="all">All Departments</option>
                                <option value="HPC">HPC</option>
                                <option value="PT">PT</option>
                            </select>
                        </div>
                        {/* Jenis Mobil Filter */}
                        <div>
                            <label htmlFor="jenismobil-filter" className="block text-sm font-medium text-gray-700 mb-1">
                                Jenis Mobil
                            </label>
                            <select
                                id="jenismobil-filter"
                                value={selectedJenisMobil}
                                onChange={(e) => setSelectedJenisMobil(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="all">All Types</option>
                                <option value="Container">Container</option>
                                <option value="Wingbox">Wingbox</option>
                                <option value="Tronton">Tronton</option>
                                <option value="Dumptruck">Dumptruck</option>
                                <option value="Colt">Colt</option>
                                <option value="Fuso">Fuso</option>
                            </select>
                        </div>
                        {/* Date From */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                From Date
                            </label>
                            <input
                                type="date"
                                placeholder="datefrom"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        {/* Date To */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                To Date
                            </label>
                            <input
                                type="date"
                                placeholder="dateto"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>
                    {/* Sort Options */}
                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center gap-2 flex-wrap">
                            <label className="text-sm font-medium text-gray-700">Sort by:</label>
                            <label htmlFor="sortby-select" className="sr-only">
                                Sort by
                            </label>
                            <select
                                id="sortby-select"
                                aria-label="Sort by"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="px-3 py-1 border border-gray-300 rounded text-sm"
                            >
                                <option value="arrivaltime">Arrival Time</option>
                                <option value="platenumber">Plate Number</option>
                                <option value="driver">Driver Name</option>
                                <option value="department">Department</option>
                                <option value="jenismobil">Jenis Mobil</option>
                                <option value="goods">Goods</option>
                            </select>
                            <button
                                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                                className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
                            >
                                {sortOrder === "asc" ? "↑ Ascending" : "↓ Descending"}
                            </button>
                        </div>
                        <button
                            onClick={onClearFilters}
                            className="px-3 py-1 mt-2 md:mt-0 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 w-full md:w-auto"
                        >
                            Clear Filters
                        </button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}