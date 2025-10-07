export interface HistoryRecord {
    id: number;
    uid: string;
    name: string;
    department: string;
    licenseplate: string;
    image_path?: string;
    image_path_out?: string;
    image_path_leave_exit?: string;
    image_path_leave_return?: string;
    datein: string;
    dateout?: string | null;
    status?: string;
    leave_permission_id?: number | null;
    leave_reason?: string | null;
    planned_exit_time?: string | null;
    planned_return_time?: string | null;
    actual_exittime?: string | null;
    actual_returntime?: string | null;
}

export interface FilterParams {
    searchTerm?: string;
    department?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
}