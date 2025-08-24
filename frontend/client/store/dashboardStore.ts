import create from "zustand";
import axios from "axios";

type leavePermissionStatus = 'pending' | ' approved' | 'rejected';
interface Attendance {
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
interface LeavePermission {
  id: string;
  name: string;
  licensePlate: string;
  department: string;
  role: string;
  date: string;    
  exitTime: string;  
  returnTime: string; 
  actual_exittime: string | null;
  actual_returntime: string | null;
  reason: string;
  approval: string;
  statusFromDepartment: string;
  statusFromHR: string;
  statusFromDirector: string;
  submittedAt: string;
}
interface User {
  id: number;
  name: string;
  uid: string;
  licenseplate: string;
  department: string;
  role: string;
}
interface DashboardStore {
  // records: Attendance[];
  records: any[];
  loading: boolean;
  error: string | null;
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
  leavePermissions: LeavePermission[];
  users: User[];
  
  // Actions
  fetchLeavePermission:  () => Promise<LeavePermission[]>;
  addLeavePermission: (entry: Omit<LeavePermission, "id">) => Promise<LeavePermission>;
  updateLeavePermission: (id: string, updates: Partial<LeavePermission>) => Promise<LeavePermission>;
  fetchRecords: () => Promise<Attendance[]>;
  addRecord: (newRecord: Attendance) => void;
  updateRecord: (recordId: number, updates: Partial<Attendance>) => void;
  updateRecordByUid: (uid: string, updates: Partial<Attendance>) => void;
  fetchUsers: () => Promise<User[]>;
  fetchUsersByDepartment: (department: string) => Promise<User[]>;
  setConnectionStatus: (status: 'connected' | 'connecting' | 'disconnected' | 'error') => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearRecords: () => void;
  fetchHistoryRecords: (filters?: {
    searchTerm?: string;
    department?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => Promise<Attendance[]>;
}
function formatToDateTime(date = new Date()) {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

export const useDashboardStore = create<DashboardStore>((set, get) => ({
  records: [],
  loading: false,
  error: null,
  connectionStatus: 'disconnected',
  leavePermissions: [],
  users: [],
  
  fetchLeavePermission: async() =>{
    set({ loading: true, error: null });
    try {
      const res = await axios.get("http://192.168.1.47:3000/leave-permission");
      const mapped = res.data.map((item: any) => {
        const date = item.date ? new Date(item.date).toISOString().split('T')[0] : '';
        const formatDateTime = (dateTimeString: string | null) => {
          if (!dateTimeString) return '';
          return dateTimeString.replace('T', ' ').slice(0, 16);
        };

        const formatTime = (timeString: string | null) => {
          if (!timeString) return '';
          return timeString.slice(11, 16);
        };
        return {
          id: item.id,
          name: item.name,
          uid: item.uid,
          licensePlate: item.licenseplate,
          department: item.department,
          role: item.role,
          date: date,
          exitTime: formatTime(item.exittime),
          returnTime: formatTime(item.returntime),
          reason: item.reason,
          approval: item.approval,
          statusFromDepartment: item.statusfromdept ?? 'pending',
          statusFromHR: item.statusfromhr ?? 'pending',
          statusFromDirector: item.statusfromdirector ?? 'pending',
          submittedAt: formatDateTime(item.submittedat),
        };
      });
      console.log(mapped);
      set({ leavePermissions: mapped, loading: false });
      return mapped;
    } catch (error: any) {
      set({ error: error?.message || "Failed to Fetch Leave Permission", loading: false });
      throw error;
    }
  },

  addLeavePermission: async (entry) =>{
    set({ loading: true, error: null });
    try {
      const formatDateTime = (date: string, time: string) => {
        if (!date || !time) return null;
        return `${date} ${time}`;
      };
      const now = new Date();
      const formatted = now.getFullYear() + '-' +
        String(now.getMonth() + 1).padStart(2, '0') + '-' +
        String(now.getDate()).padStart(2, '0') + ' ' +
        String(now.getHours()).padStart(2, '0') + ':' +
        String(now.getMinutes()).padStart(2, '0') + ':' +
        String(now.getSeconds()).padStart(2, '0');

      const mappedEntry = {
        name: entry.name,
        licensePlate: entry.licensePlate,
        department: entry.department,
        role: entry.role,
        date: entry.date,
        exitTime: formatDateTime(entry.date, entry.exitTime),
        returnTime: formatDateTime(entry.date, entry.returnTime),
        reason: entry.reason,
        approval: entry.approval,
        statusfromdept: entry.statusFromDepartment,
        statusfromhr: entry.statusFromHR,
        statusfromdirector: entry.statusFromDirector,
        submittedAt: formatted,
      };
      console.log(mappedEntry);
      const res = await axios.post("http://192.168.1.47:3000/leave-permission", mappedEntry);
      console.log(res.data);
      set((state) => ({
        leavePermissions: [res.data, ...state.leavePermissions],
        loading: false,
      }));
      return res.data;
    } catch (error: any) {
      set({ error: error?.message || "Failed to Add Leave Permission", loading: false });
      throw error;
    }
  },

  updateLeavePermission: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const mapToSnake = (obj: any) => {
        const mapping: Record<string, string> = {
          statusFromHR: 'statusfromhr',
          statusFromDepartment: 'statusfromdept',
          statusFromDirector: 'statusfromdirector',
          approval: 'approval',
          reason: 'reason',
          returnTime: 'returntime',
          exitTime: 'exittime',
          date: 'date',
          role: 'role',
          department: 'department',
          licensePlate: 'licenseplate',
          name: 'name',
          submittedAt: 'submittedat',
        };
        const result: any = {};
        for (const key in obj) {
          if (mapping[key]) {
            result[mapping[key]] = obj[key];
          }
        }
        return result;
      };
      const mappedUpdates = mapToSnake(updates);
      const res = await axios.put(`http://192.168.1.47:3000/leave-permission/${id}`, mappedUpdates);
      set((state) => ({
        leavePermissions: state.leavePermissions.map(lp => lp.id === id ? { ...lp, ...updates } : lp),
        loading: false,
      }));
      return res.data;
    } catch (error: any) {
      set({ error: error?.message || "Failed to Update Leave Permission", loading: false });
      throw error;
    }
  },

  fetchRecords: async () => {
    console.log("fetchRecords called - starting fetch...");
    set({ loading: true, error: null });
    try {
      console.log("Making API call to http://192.168.1.47:3000/logs");
      const res = await axios.get("http://192.168.1.47:3000/logs");
      console.log("API response received:", res.data.length, "records");
      console.log(res);
      
      const sortedRecords = res.data.sort((a: Attendance, b: Attendance) => 
        new Date(b.datein).getTime() - new Date(a.datein).getTime()
      );
      
      set({ 
        records: sortedRecords, 
        loading: false,
        error: null 
      });
      
      console.log(`Fetched ${sortedRecords.length} records from API`);
      console.log("fetchRecords completed successfully");
      return sortedRecords;
    } catch (error: any) {
      console.error("❌ fetchRecords failed:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to fetch data";
      set({
        error: errorMessage,
        loading: false,
      });
      console.error("❌ Error fetching records:", errorMessage);
      throw error;
    }
  },

  fetchUsers: async () => {
    set({ loading: true, error: null });
    try {
      const res = await axios.get("http://192.168.1.47:3000/users");
      set({ 
        users: res.data, 
        loading: false,
        error: null 
      });
      
      console.log(`Fetched ${res.data.length} users from API`);
      return res.data;
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to fetch users";
      set({
        error: errorMessage,
        loading: false,
      });
      console.error("❌ Error fetching users:", errorMessage);
      throw error;
    }
  },

  fetchUsersByDepartment: async (department: string) => {
    set({ loading: true, error: null });
    try {
      const res = await axios.get(`http://192.168.1.47:3000/users/department/${encodeURIComponent(department)}`);
      set({ 
        loading: false,
        error: null 
      });
      
      console.log(`Fetched ${res.data.length} users for department: ${department}`);
      return res.data;
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to fetch users by department";
      set({
        error: errorMessage,
        loading: false,
      });
      console.error("❌ Error fetching users by department:", errorMessage);
      throw error;
    }
  },

  addRecord: (newRecord) => {
    set((state) => {
      const isDuplicate = state.records.some(
        (rec) =>
          rec.uid === newRecord.uid &&
          new Date(rec.datein).toISOString() === new Date(newRecord.datein).toISOString()
      );

      if (isDuplicate) {
        console.warn("Duplicate record ignored:", newRecord);
        return state;
      }

      const updatedRecords = [newRecord, ...state.records];
      console.log(`Added new record. Total records: ${updatedRecords.length}`);
      
      return {
        ...state,
        records: updatedRecords,
        error: null // Clear any previous errors
      };
    });
  },

  updateRecord: (recordId, updates) => {
    set((state) => {
      const updatedRecords = state.records.map((record) =>
        record.id === recordId
          ? { ...record, ...updates }
          : record
      );

      const wasUpdated = updatedRecords.some(r => r.id === recordId);
      if (wasUpdated) {
        console.log(`Updated record ID ${recordId}:`, updates);
      } else {
        console.warn(`Record ID ${recordId} not found for update`);
      }

      return {
        ...state,
        records: updatedRecords
      };
    });
  },

  updateRecordByUid: (uid, updates) => {
    set((state) => {
      const targetRecord = state.records
        .filter(r => r.uid === uid)
        .sort((a, b) => new Date(b.datein).getTime() - new Date(a.datein).getTime())[0];

      if (!targetRecord) {
        console.warn(`⚠️ No record found for UID ${uid}`);
        return state;
      }

      const updatedRecords = state.records.map((record) =>
        record.id === targetRecord.id
          ? { ...record, ...updates }
          : record
      );

      console.log(`Updated record for UID ${uid}:`, updates);
      
      return {
        ...state,
        records: updatedRecords
      };
    });
  },

  setConnectionStatus: (status) => {
    set({ connectionStatus: status });
    console.log(`Connection status: ${status}`);
  },

  setLoading: (loading) => {
    set({ loading });
  },

  setError: (error) => {
    set({ error });
    if (error) {
      console.error("❌ Store error:", error);
    }
  },

  clearRecords: () => {
    set({ records: [], error: null });
    console.log("Cleared all records");
  },

  fetchHistoryRecords: async (filters = {}) => {
    console.log("fetchHistoryRecords called with filters:", filters);
    set({ loading: true, error: null });
    try {
      const queryParams = new URLSearchParams();
      if (filters.searchTerm) queryParams.append('search', filters.searchTerm);
      if (filters.department && filters.department !== 'all') queryParams.append('department', filters.department);
      if (filters.status && filters.status !== 'all') queryParams.append('status', filters.status);
      if (filters.dateFrom) queryParams.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) queryParams.append('dateTo', filters.dateTo);

      const url = `http://192.168.1.47:3000/logs${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      console.log("Making API call to:", url);
      
      const res = await axios.get(url);
      console.log("API response received:", res.data.length, "history records");
      
      const sortedRecords = res.data.sort((a: Attendance, b: Attendance) => 
        new Date(b.datein).getTime() - new Date(a.datein).getTime()
      );
      
      set({ 
        loading: false,
        error: null 
      });
      
      console.log(`Fetched ${sortedRecords.length} history records from API`);
      return sortedRecords;
    } catch (error: any) {
      console.error("❌ fetchHistoryRecords failed:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to fetch history data";
      set({
        error: errorMessage,
        loading: false,
      });
      throw error;
    }
  },
}));
