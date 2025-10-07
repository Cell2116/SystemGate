import { HistoryRecord } from "@/types/employee.types";
import { TruckHistoryRecord } from "@/types/truck.types";
import { exportEmployeeHistoryToXLSX, exportTruckHistoryToXLSX } from "@/lib/export";

interface ExportButtonProps {
    data: HistoryRecord[] | TruckHistoryRecord[];
    type: 'employee' | 'truck';
    className?: string;
}

export default function ExportButton({ data, type, className = "" }: ExportButtonProps) {
    const handleExport = () => {
        if (type === 'employee') {
            exportEmployeeHistoryToXLSX(data as HistoryRecord[]);
        } else if (type === 'truck') {
            exportTruckHistoryToXLSX(data as TruckHistoryRecord[]);
        }
    };

    const defaultClassName = "px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium";

    return (
        <button
            onClick={handleExport}
            className={className || defaultClassName}
        >
            📊 Export Excel
        </button>
    );
}