import * as XLSX from "xlsx";
import { HistoryRecord } from "@/types/employee.types";
import { TruckHistoryRecord } from "@/types/truck.types";
import { formatDateTime, formatCustomDateTime } from "@/lib/utils";
import { useTruckStore } from "@/store/truckStore";
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

export const exportTruckHistoryToXLSX = async (filters?: {
    startDate?: string;
    endDate?: string;
    department?: string;
    status?: string;
}) => {
    try {
        console.log('Starting export process...');

        const fetchTrucksForExport = useTruckStore.getState().fetchTrucksForExport;
        const records = await fetchTrucksForExport(filters);

        console.log(`Processing ${records.length} records...`);

        if (records.length === 0) {
            alert('No data to export');
            return { success: false, message: 'No data to export' };
        }

        // Transform data untuk Excel
        const exportData = records.map(record => {
            const baseData: any = {
                // Trucks table
                'Plate Number': record.platenumber || '',
                'Ticket Number': record.noticket || '',
                'Driver': record.driver || '',
                'NIK Driver': record.nikdriver || '',
                'Telp Driver': record.tlpdriver || '',
                'Supplier': record.supplier || '',
                'No SJ': record.nosj || '',
                'Tanggal SJ': record.tglsj || '',
                'Department': record.department || '',
                'Status': record.status || '',
                'Type': record.type || '',
                'Operation': record.operation || '',
                'Goods': record.goods || '',
                'Description In (QTY)': record.descin || '',
                'Description Out': record.descout || '',
                'Status Truck (Isi/Non-Isi)': record.statustruck || '',
                'Armada': record.armada || '',
                'Kelengkapan': record.kelengkapan || '',
                'Jenis Mobil': record.jenismobil || '',
                'Jenis Barang': record.jenisbarang || '',
                'Date': record.date || '',
                'Loading Cycle': record.loading_cycle || '',

                // Queue info
                'Queue Position': record.queue_position || '',
                'Queue Ticket': record.queue_ticket || '',

                // Photos
                'Driver Photo': record.driver_photo || '',
                'STNK Photo': record.stnk_photo || '',
                'SIM Photo': record.sim_photo || '',

                // Cycle 1 times (sudah format HH:MM:SS dari backend)
                'Arrival Time': record.arrivaltime || '',
                'Waiting For Timbang Gross': record.waitingfortimbang || '',
                'Start Timbang Gross': record.starttimbang || '',
                'Finish Timbang Gross': record.finishtimbang || '',
                'Total Process Timbang Gross': record.totalprocesstimbang || '',
                'Run to HPC': record.runtohpc || '',
                'Waiting For Arrival HPC': record.waitingforarrivalhpc || '',
                'Entry HPC': record.entryhpc || '',
                'Run to PT': record.runtopt || '',
                'Waiting For Arrival PT': record.waitingforarrivalpt || '',
                'Entry PT': record.entrypt || '',
                'Total Waiting Arrival': record.totalwaitingarrival || '',
                'Start Loading Time': record.startloadingtime || '',
                'Finish Loading Time': record.finishloadingtime || '',
                'Total Process Loading Time': record.totalprocessloadingtime || '',
                'Actual Wait Loading Time': record.actualwaitloadingtime || '',
                'Start Timbang Neto': record.starttimbangneto || '',
                'Finish Timbang Neto': record.finishtimbangneto || '',
                'Total Process Timbang Neto': record.totalprocesstimbangneto || '',
                'Waiting For Timbang Neto': record.waitingfortimbangneto || '',
                'Exit Time': record.exittime || '',
                'Total Truck Completion Time': record.totaltruckcompletiontime || '',
                'Waiting For Exit': record.waitingforexit || '',
            };

            // Tambahkan data cycle 2 jika ada
            if (record.arrivaltime_cycle2 || record.startloadingtime_cycle2) {
                baseData['--- CYCLE 2 ---'] = '';
                baseData['Arrival Time Cycle 2'] = record.arrivaltime_cycle2 || '';
                baseData['Waiting For Timbang Gross Cycle 2'] = record.waitingfortimbang_cycle2 || '';
                baseData['Start Timbang Cycle Gross 2'] = record.starttimbang_cycle2 || '';
                baseData['Finish Timbang Gross Cycle 2'] = record.finishtimbang_cycle2 || '';
                baseData['Total Process Timbang Gross Cycle 2'] = record.totalprocesstimbang_cycle2 || '';
                baseData['Run to HPC Cycle 2'] = record.runtohpc_cycle2 || '';
                baseData['Waiting For Arrival HPC Cycle 2'] = record.waitingforarrivalhpc_cycle2 || '';
                baseData['Entry HPC Cycle 2'] = record.entryhpc_cycle2 || '';
                baseData['Run to PT Cycle 2'] = record.runtopt_cycle2 || '';
                baseData['Waiting For Arrival PT Cycle 2'] = record.waitingfoarrivalpt_cycle2 || '';
                baseData['Entry PT Cycle 2'] = record.entrypt_cycle2 || '';
                baseData['Total Waiting Arrival Cycle 2'] = record.totalwaitingarrival_cycle2 || '';
                baseData['Start Loading Time Cycle 2'] = record.startloadingtime_cycle2 || '';
                baseData['Finish Loading Time Cycle 2'] = record.finishloadingtime_cycle2 || '';
                baseData['Total Process Loading Time Cycle 2'] = record.totalprocessloadingtime_cycle2 || '';
                baseData['Actual Wait Loading Time Cycle 2'] = record.actualwaitloadingtime_cycle2 || '';
                baseData['Start Timbang Neto Cycle 2'] = record.starttimbangneto_cycle2 || '';
                baseData['Finish Timbang Neto Cycle 2'] = record.finishtimbangneto_cycle2 || '';
                baseData['Total Process Timbang Neto Cycle 2'] = record.totalprocesstimbangneto_cycle2 || '';
                baseData['Waiting For Timbang Neto Cycle 2'] = record.waitingfortimbangneto_cycle2 || '';
                baseData['Exit Time Cycle 2'] = record.exittime_cycle2 || '';
                baseData['Total Truck Completion Time Cycle 2'] = record.totaltruckcompletiontime_cycle2 || '';
                baseData['Waiting For Exit Cycle 2'] = record.waitingforexit_cycle2 || '';
            }

            return baseData;
        });

        const ws = XLSX.utils.json_to_sheet(exportData);
        const columnCount = Object.keys(exportData[0] || {}).length;
        ws['!cols'] = Array(columnCount).fill({ wch: 20 });
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Truck History');
        const fileName = `truck_history_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);
        console.log(`Export completed: ${fileName}`);
        return { success: true, fileName, recordCount: records.length };

    } catch (error) {
        console.error('Export failed:', error);
        alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        throw error;
    }
};
// Truck History Export
// export const exportTruckHistoryToXLSX = (filteredRecords: TruckHistoryRecord[]) => {
//     const exportData = filteredRecords.map(record => ({
//         'Plate Number': record.platenumber || '',
//         'Ticket Number': record.noticket || '',
//         'Driver': record.driver || '',
//         'NIK Driver': record.nikdriver || '',
//         'Telp Driver': record.tlpdriver || '',
//         'Supplier': record.supplier || '',
//         'No SJ': record.nosj || '',
//         'Tanggal SJ': record.tglsj || '',
//         'Arrival Time': record.arrivaltime ? formatDateTime(record.arrivaltime) : '',
//         'Start Loading': record.startloadingtime ? formatDateTime(record.startloadingtime) : '',
//         'Finish Time': record.finishloadingtime ? formatDateTime(record.finishloadingtime) : '',
//         'Status': record.status || '',
//         'Type': record.type || '',
//         'Goods': record.goods || '',
//         'Actual Wait Time': record.actualwaitloadingtime || '',
//         'Description In': record.descin || '',
//         'Description Out': record.descout || '',
//         'Status Truck': record.statustruck || '',
//         'Armada': record.armada || '',
//         'Kelengkapan': record.kelengkapan || '',
//         'Jenis Mobil': record.jenismobil || ''
//     }));
//     const columnWidths = [
//         { wch: 15 },
//         { wch: 25 },
//         { wch: 20 },
//         { wch: 15 },
//         { wch: 20 },
//         { wch: 20 },
//         { wch: 15 },
//         { wch: 20 },
//         { wch: 30 },
//         { wch: 20 },
//         { wch: 20 },
//         { wch: 20 },
//         { wch: 20 },
//         { wch: 20 },
//         { wch: 20 },
//         { wch: 25 },
//         { wch: 25 },
//         { wch: 20 },
//         { wch: 20 },
//         { wch: 20 },
//         { wch: 20 }
//     ];
//     const fileName = `truck_history_${new Date().toISOString().split('T')[0]}.xlsx`;
//     const sheetName = 'Truck History';
//     exportToExcel(exportData, columnWidths, fileName, sheetName);
//     };
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