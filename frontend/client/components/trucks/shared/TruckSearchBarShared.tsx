// src/components/trucks/shared/TrucksSearchBar.tsx
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilterStatus } from '@/types/truck.types';
interface SearchBarProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    onRefresh: () => void;
    filteredCount: number;
    selectedStatus: FilterStatus;
}
export default function TrucksSearchBar({
    searchTerm,
    onSearchChange,
    onRefresh,
    filteredCount,
    selectedStatus
}: SearchBarProps) {
    return (
        <div className="mb-1">
            <div className="relative max-w-md flex flex-row gap-2 items-center">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Search trucks by plate, driver, goods, department..."
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
                <Button
                    onClick={onRefresh}
                    variant="outline"
                    size="sm"
                    className="bg-slate-200 border border-gray-400 hover:bg-gray-300 transition-opacity ease-in-out"
                >
                    Refresh
                </Button>
                {searchTerm && (
                    <button
                        onClick={() => onSearchChange("")}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                        <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    </button>
                )}
            </div>  
            {/* Search Results Summary */}
            {searchTerm && (
                <div className="mt-2 text-sm text-gray-600">
                    Found {filteredCount} truck{filteredCount !== 1 ? 's' : ''} matching "{searchTerm}"
                    {selectedStatus !== "all" && ` with status "${selectedStatus}"`}
                </div>
            )}
        </div>
    );
}
