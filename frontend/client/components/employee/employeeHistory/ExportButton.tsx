import { HistoryRecord } from "@/types/employee.types";
import { exportToXLSX } from "@/lib/export";

interface ExportButtonProps {
    filteredRecords: HistoryRecord[];
}

export default function ExportButton({ filteredRecords }: ExportButtonProps) {
    const handleExport = () => {
        exportToXLSX(filteredRecords);
    };

    return (
        <button
            onClick={handleExport}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
        >
            📊 Export Excel
        </button>
    );
}