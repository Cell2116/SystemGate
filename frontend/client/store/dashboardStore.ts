

// src/store/dashboardStore.ts
import create from "zustand";
import axios from "axios";

interface Attendance {
  id: number;
  uid: string;
  name: string;
  department: string;
  licenseplate: string;
  image_path: string | null;
  image_path_in?: string | null;
  image_path_out?: string | null;
  datein: string;
  dateout: string | null;
  status: string;
  type?: 'entry' | 'exit' | 'image_update'; // For WebSocket message types
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
  reason: string;
  approval: string;
  statusFromDepartment: string;
  statusFromHR: string;
  statusFromDirector: string;
  submittedAt: string;
}


interface DashboardStore {
  records: Attendance[];
  loading: boolean;
  error: string | null;
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
  leavePermissions: LeavePermission[];
  
  // Actions
  fetchLeavePermission:  () => Promise<LeavePermission[]>;
  addLeavePermission: (entry: Omit<LeavePermission, "id">) => Promise<LeavePermission>;
  updateLeavePermission: (id: string, updates: Partial<LeavePermission>) => Promise<LeavePermission>;
  fetchRecords: () => Promise<Attendance[]>;
  addRecord: (newRecord: Attendance) => void;
  updateRecord: (recordId: number, updates: Partial<Attendance>) => void;
  updateRecordByUid: (uid: string, updates: Partial<Attendance>) => void;
  setConnectionStatus: (status: 'connected' | 'connecting' | 'disconnected' | 'error') => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearRecords: () => void;
}

export const useDashboardStore = create<DashboardStore>((set, get) => ({
  records: [],
  loading: false,
  error: null,
  connectionStatus: 'disconnected',
  leavePermissions: [],

  fetchLeavePermission: async() =>{
    set({ loading: true, error: null });
    try {
      const res = await axios.get("http://localhost:3000/leave-permission");
      // Map backend snake_case to frontend camelCase
      const mapped = res.data.map((item: any) => {
        // Format date to YYYY-MM-DD
        const date = item.date ? new Date(item.date).toISOString().split('T')[0] : '';
        
        // Format times to HH:mm
        const formatTime = (timestamp: string | null) => {
          if (!timestamp) return '';
          const date = new Date(timestamp);
          return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
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
          submittedAt: item.submittedat,
        };
      });
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

      const mappedEntry = {
        name: entry.name,
        licenseplate: entry.licensePlate,
        department: entry.department,
        role: entry.role,
        date: entry.date,
        exittime: formatDateTime(entry.date, entry.exitTime),
        returntime: formatDateTime(entry.date, entry.returnTime),
        reason: entry.reason,
        approval: entry.approval,
        statusfromdept: entry.statusFromDepartment,
        statusfromhr: entry.statusFromHR,
        statusfromdirector: entry.statusFromDirector,
        submittedat: new Date().toISOString(),
      };
      const res = await axios.post("http://localhost:3000/leave-permission", mappedEntry);
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
      // Map camelCase update fields to snake_case for backend
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
      const res = await axios.put(`http://localhost:3000/leave-permission/${id}`, mappedUpdates);
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
    set({ loading: true, error: null });
    try {
      const res = await axios.get("http://localhost:3000/logs");
      const sortedRecords = res.data.sort((a: Attendance, b: Attendance) => 
        new Date(b.datein).getTime() - new Date(a.datein).getTime()
      );
      
      set({ 
        records: sortedRecords, 
        loading: false,
        error: null 
      });
      
      console.log(`📥 Fetched ${sortedRecords.length} records from API`);
      return sortedRecords;
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to fetch data";
      set({
        error: errorMessage,
        loading: false,
      });
      console.error("❌ Error fetching records:", errorMessage);
      throw error;
    }
  },

  addRecord: (newRecord) => {
    set((state) => {
      // Check for exact duplicates (same UID and same entry time)
      const isDuplicate = state.records.some(
        (rec) =>
          rec.uid === newRecord.uid &&
          new Date(rec.datein).toISOString() === new Date(newRecord.datein).toISOString()
      );

      if (isDuplicate) {
        console.warn("🛑 Duplicate record ignored:", newRecord);
        return state;
      }

      // Add the new record at the beginning (most recent first)
      const updatedRecords = [newRecord, ...state.records];
      console.log(`➕ Added new record. Total records: ${updatedRecords.length}`);
      
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
        console.log(`📝 Updated record ID ${recordId}:`, updates);
      } else {
        console.warn(`⚠️ Record ID ${recordId} not found for update`);
      }

      return {
        ...state,
        records: updatedRecords
      };
    });
  },

  updateRecordByUid: (uid, updates) => {
    set((state) => {
      // Find the most recent record for this UID (usually the one without dateout)
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

      console.log(`📝 Updated record for UID ${uid}:`, updates);
      
      return {
        ...state,
        records: updatedRecords
      };
    });
  },

  setConnectionStatus: (status) => {
    set({ connectionStatus: status });
    console.log(`🔌 Connection status: ${status}`);
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
    console.log("🧹 Cleared all records");
  }
}));
