import { ReactNode, CSSProperties } from "react";
import { HistoryRecord } from "@/types/employee.types";

type CardProps = {
    children: ReactNode;
    className?: string;
    style?: CSSProperties;
};

const Card = ({ children, className = "", style = {} }: CardProps) => (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`} style={style}>
        {children}
    </div>
);

type CardContentProps = {
    children: ReactNode;
    className?: string;
};

const CardContent = ({ children, className = "" }: CardContentProps) => (
    <div className={`p-6 ${className}`}>
        {children}
    </div>
);

interface EmployeeFiltersProps {
    filterOpen: boolean;
    setFilterOpen: (open: boolean) => void;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    selectedDepartment: string;
    setSelectedDepartment: (dept: string) => void;
    selectedStatus: string;
    setSelectedStatus: (status: string) => void;
    dateFrom: string;
    setDateFrom: (date: string) => void;
    dateTo: string;
    setDateTo: (date: string) => void;
    sortBy: string;
    setSortBy: (sort: string) => void;
    sortOrder: "asc" | "desc";
    setSortOrder: (order: "asc" | "desc") => void;
    clearFilters: () => void;
    records: HistoryRecord[];
}

export default function EmployeeFilters({
    filterOpen,
    setFilterOpen,
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
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    clearFilters,
    records
}: EmployeeFiltersProps) {
    const predefinedDepartments = [
        "IT", "QC-RND", "Production", "Finance", "HRD", "GA",
        "Invoicing", "Purchasing", "Accounting", "Corporate Secretary",
        "Collector", "Audit Internal", "Administration", "PPIC",
        "Designer", "Costing", "CSD", "Marketing"
    ];
    const dynamicDepartments = Array.from(new Set(records.map(record => record.department)));
    const allDepartments = Array.from(new Set([...predefinedDepartments, ...dynamicDepartments])).sort();

    return (
        <>

            <div className={`transition-all duration-300 overflow-hidden ${filterOpen ? 'max-h-[100vh] mb-2 xl:mb-0 max-w-[100vw]' : 'max-h-0'}  md:mb-0 md:block`}>
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
                                    placeholder="Name, license plate, or UID..."
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
                                    {allDepartments.map(dept => (
                                        <option key={dept} value={dept}>{dept}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Status Filter */}
                            <div>
                                <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                                    Status
                                </label>
                                <select
                                    id="status-filter"
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="all">All Status</option>
                                    <option value="entry">Entry</option>
                                    <option value="exit">Exit</option>
                                    <option value="leave_exit">Leave Exit</option>
                                    <option value="leave_return">Leave Return</option>
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
                                    <option value="datein">Entry Time</option>
                                    <option value="name">Name</option>
                                    <option value="department">Department</option>
                                    <option value="licenseplate">License Plate</option>
                                </select>
                                <button
                                    onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                                    className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
                                >
                                    {sortOrder === "asc" ? "↑ Ascending" : "↓ Descending"}
                                </button>
                            </div>
                            <button
                                onClick={clearFilters}
                                className="px-3 py-1 mt-2 md:mt-0 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 w-full md:w-auto"
                            >
                                Clear Filters
                            </button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}