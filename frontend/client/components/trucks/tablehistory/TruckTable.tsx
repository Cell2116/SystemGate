import { TruckHistoryRecord } from "@/types/truck.types";
import { formatDateTime } from "@/lib/utils";
import React from "react";

type CardContentProps = {
    children: React.ReactNode;
    className?: string;
};

const CardContent = ({ children, className = "" }: CardContentProps) => (
    <div className={`p-6 ${className}`}>
        {children}
    </div>
);

interface TruckTableProps {
    loading: boolean;
    filteredRecords: TruckHistoryRecord[];
    currentRecords: TruckHistoryRecord[];
    filterOpen: boolean;
    onViewDetails: (record: TruckHistoryRecord) => void;
}

export default function TruckTable({
    loading,
    filteredRecords,
    currentRecords,
    filterOpen,
    onViewDetails
}: TruckTableProps) {

    const getDisplayRecords = () => {
        if (typeof window !== 'undefined') {
            const isMobile = window.innerWidth < 1024;
            const maxRows = isMobile ? 4 : 5;
            return currentRecords.slice(0, maxRows);
        }
        return currentRecords.slice(0, 5);
    };

    const [displayRecords, setDisplayRecords] = React.useState(getDisplayRecords());

    React.useEffect(() => {
        const handleResize = () => {
            setDisplayRecords(getDisplayRecords());
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [currentRecords]);

    return (
        <CardContent className={`${filterOpen ? 'max-h-[35vh]' : 'max-h-[60vh]'} overflow-y-auto p-0`}>
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <p className="text-gray-500">Loading history records from database...</p>
                    </div>
                </div>
            ) : filteredRecords.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <div className="text-6xl mb-4">📋</div>
                        <p className="text-gray-500 text-lg">No records found</p>
                        <p className="text-gray-400 text-sm">Try adjusting your filters or check your connection</p>
                    </div>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Goods & Vehicle
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Driver & Dept
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Plate Number
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Supplier
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Arrival Time
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Finish Time
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {displayRecords.map((record) => (
                                <tr key={record.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">{record.goods || 'No goods info'}</div>
                                            <div className="text-sm text-gray-500">Jenis: {record.jenismobil || 'Unknown'}</div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <div>
                                            <div className="font-medium">{record.driver || 'Unknown Driver'}</div>
                                            <div className="text-xs text-gray-500">Dept: {record.department || 'No dept'}</div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-mono text-blue-600">
                                        {record.platenumber || 'No plate'}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-mono text-purple-700">
                                        {record.supplier || '-'}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                                        {record.arrivaltime ? formatDateTime(record.arrivaltime) : '-'}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                                        {record.finishloadingtime ? formatDateTime(record.finishloadingtime) : '-'}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${record.status === 'Waiting' ? 'bg-yellow-100 text-yellow-800' :
                                            record.status === 'Loading' ? 'bg-blue-100 text-blue-800' :
                                                record.status === 'Finished' ? 'bg-green-100 text-green-800' :
                                                    record.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                        'bg-gray-100 text-gray-800'
                                            }`}>
                                            {record.status?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                                        <button
                                            onClick={() => onViewDetails(record)}
                                            className="text-blue-600 hover:text-blue-900 mr-3"
                                        >
                                            View Details
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </CardContent>
    );
}