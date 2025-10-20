import { Button } from "@/components/ui/button";
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
interface TruckPaginationProps {
    filterOpen: boolean;
    currentPage: number;
    totalPages: number;
    indexOfFirstRecord: number;
    indexOfLastRecord: number;
    filteredRecordsLength: number;
    onPageChange: (page: number) => void;
}
export default function TruckPagination({
    filterOpen,
    currentPage,
    totalPages,
    indexOfFirstRecord,
    indexOfLastRecord,
    filteredRecordsLength,
    onPageChange
}: TruckPaginationProps) {
    return (
        <Card className={`mt-4 ${filterOpen ? 'hidden md:block' : 'block'}`}>
            <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-gray-700 text-center sm:text-left order-2 sm:order-1">
                        Showing {indexOfFirstRecord + 1} to {Math.min(indexOfLastRecord, filteredRecordsLength)} of {filteredRecordsLength} results
                    </div>
                    <div className="flex items-center justify-center gap-1 sm:gap-2 flex-wrap order-1 sm:order-2">
                        <button
                            onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-2 sm:px-3 py-2 border border-gray-300 rounded text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                        >
                            Previous
                        </button>
                        {/* Show page numbers */}
                        {(() => {
                            const maxVisiblePages = 5;
                            const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                            const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
                            const adjustedStartPage = Math.max(1, endPage - maxVisiblePages + 1);
                            const pages = [];
                            // First page if not in range
                            if (adjustedStartPage > 1) {
                                pages.push(
                                    <button
                                        key={1}
                                        onClick={() => onPageChange(1)}
                                        className="px-2 sm:px-3 py-2 border border-gray-300 rounded text-xs sm:text-sm hover:bg-gray-50 transition-colors"
                                    >
                                        1
                                    </button>
                                );
                                if (adjustedStartPage > 2) {
                                    pages.push(<span key="ellipsis1" className="px-1 text-gray-400">...</span>);
                                }
                            }
                            // Visible page range
                            for (let page = adjustedStartPage; page <= endPage; page++) {
                                pages.push(
                                    <button
                                        key={page}
                                        onClick={() => onPageChange(page)}
                                        className={`px-2 sm:px-3 py-2 border rounded text-xs sm:text-sm transition-colors ${currentPage === page
                                                ? 'bg-blue-600 text-white border-blue-600'
                                                : 'border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        {page}
                                    </button>
                                );
                            }
                            // Last page if not in range
                            if (endPage < totalPages) {
                                if (endPage < totalPages - 1) {
                                    pages.push(<span key="ellipsis2" className="px-1 text-gray-400">...</span>);
                                }
                                pages.push(
                                    <button
                                        key={totalPages}
                                        onClick={() => onPageChange(totalPages)}
                                        className="px-2 sm:px-3 py-2 border border-gray-300 rounded text-xs sm:text-sm hover:bg-gray-50 transition-colors"
                                    >
                                        {totalPages}
                                    </button>
                                );
                            }
                            return pages;
                        })()}
                        <button
                            onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="px-2 sm:px-3 py-2 border border-gray-300 rounded text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}