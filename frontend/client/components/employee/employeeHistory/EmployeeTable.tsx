import { ReactNode, CSSProperties } from "react";
import { HistoryRecord } from "@/types/employee.types";
import { formatDateTime } from "@/lib/utils";
import React from "react";

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

interface EmployeeTableProps {
    filterOpen: boolean;
    loading: boolean;
    filteredRecords: HistoryRecord[];
    currentRecords: HistoryRecord[];
    setSelectedRecord: (record: HistoryRecord) => void;
}

export default function EmployeeTable({
    filterOpen,
    loading,
    filteredRecords,
    currentRecords,
    setSelectedRecord
}: EmployeeTableProps) {

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
        <Card className={`${filterOpen ? 'hidden md:block' : 'block'}`}>
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
                                        Employee
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Department
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        License Plate
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Entry Time
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Exit Time
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
                                                <div className="text-sm font-medium text-gray-900">{record.name}</div>
                                                <div className="text-sm text-gray-500">UID: {record.uid}</div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {record.department}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm font-mono text-blue-600">
                                            {record.licenseplate}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                                            {formatDateTime(record.datein)}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                                            {formatDateTime(record.dateout)}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${record.status === 'entry' ? 'bg-green-100 text-green-800' :
                                                    record.status === 'exit' ? 'bg-red-100 text-red-800' :
                                                        record.status === 'leave_exit' ? 'bg-orange-100 text-orange-800' :
                                                            record.status === 'leave_return' ? 'bg-purple-100 text-purple-800' :
                                                                'bg-gray-100 text-gray-800'
                                                }`}>
                                                {record.status?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={() => setSelectedRecord(record)}
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
        </Card>
    );
}