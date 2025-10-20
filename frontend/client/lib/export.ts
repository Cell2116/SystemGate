import * as XLSX from "xlsx";
import { HistoryRecord } from "@/types/employee.types";
import { TruckHistoryRecord } from "@/types/truck.types";
import { formatDateTime, formatCustomDateTime } from "@/lib/utils";
// Employee History Export
export const exportEmployeeHistoryToXLSX = (filteredRecords: HistoryRecord[]) => {
    const exportData = filteredRecords.map(record => ({
        'UID': record.uid,
        'Name': record.name,
        'Department': record.department,
        'License Plate': record.licenseplate,
        'Entry Time': formatDateTime(record.datein),
        'Exit Time': record.dateout ? formatDateTime(record.dateout) : '',
        'Status': record.status?.replace('_', ' ').toUpperCase() || 'UNKNOWN',
        'Leave Permission ID': record.leave_permission_id || '',
        'Leave Reason': record.leave_reason || '',
        'Planned Exit Time': record.planned_exit_time ? formatCustomDateTime(record.planned_exit_time) : '',
        'Planned Return Time': record.planned_return_time ? formatCustomDateTime(record.planned_return_time) : '',
        'Actual Exit Time': record.actual_exittime ? formatDateTime(record.actual_exittime) : '',
        'Actual Return Time': record.actual_returntime ? formatDateTime(record.actual_returntime) : '',
        'Approver Level 1 ': record.approval_level1_name || '',
        'Approver Level 2': record.approval_level2_name || ''
    }));
    const columnWidths = [
        { wch: 15 },
        { wch: 25 },
        { wch: 20 },
        { wch: 15 },
        { wch: 20 },
        { wch: 20 },
        { wch: 15 },
        { wch: 20 },
        { wch: 30 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 30 },
        { wch: 30 },
    ];
    const fileName = `employee_history_${new Date().toISOString().split('T')[0]}.xlsx`;
    const sheetName = 'Employee History';
    exportToExcel(exportData, columnWidths, fileName, sheetName);
};
// Truck History Export
export const exportTruckHistoryToXLSX = (filteredRecords: TruckHistoryRecord[]) => {
    const exportData = filteredRecords.map(record => ({
        'Plate Number': record.platenumber || '',
        'Ticket Number': record.noticket || '',
        'Driver': record.driver || '',
        'NIK Driver': record.nikdriver || '',
        'Telp Driver': record.tlpdriver || '',
        'Supplier': record.supplier || '',
        'No SJ': record.nosj || '',
        'Tanggal SJ': record.tglsj || '',
        'Arrival Time': record.arrivaltime ? formatDateTime(record.arrivaltime) : '',
        'Start Loading': record.startloadingtime ? formatDateTime(record.startloadingtime) : '',
        'Finish Time': record.finishloadingtime ? formatDateTime(record.finishloadingtime) : '',
        'Status': record.status || '',
        'Type': record.type || '',
        'Goods': record.goods || '',
        'Actual Wait Time': record.actualwaitloadingtime || '',
        'Description In': record.descin || '',
        'Description Out': record.descout || '',
        'Status Truck': record.statustruck || '',
        'Armada': record.armada || '',
        'Kelengkapan': record.kelengkapan || '',
        'Jenis Mobil': record.jenismobil || ''
    }));
    const columnWidths = [
        { wch: 15 },
        { wch: 25 },
        { wch: 20 },
        { wch: 15 },
        { wch: 20 },
        { wch: 20 },
        { wch: 15 },
        { wch: 20 },
        { wch: 30 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 25 },
        { wch: 25 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 }
    ];
    const fileName = `truck_history_${new Date().toISOString().split('T')[0]}.xlsx`;
    const sheetName = 'Truck History';
    exportToExcel(exportData, columnWidths, fileName, sheetName);
};
// Generic export function
const exportToExcel = (
    data: any[],
    columnWidths: { wch: number }[],
    fileName: string,
    sheetName: string
) => {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);
    worksheet['!cols'] = columnWidths;
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, fileName);
};
// Backward compatibility - keeping the old function name for existing code
export const exportToXLSX = exportEmployeeHistoryToXLSX;