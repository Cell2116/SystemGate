import React from "react";
import { create } from "zustand";
import axios from "axios";
import { TruckMainData, TruckTimesData, TruckPhotosData, TruckQueueData, TruckExportData } from "@/types/truck.types";

export type CombinedTruckData = TruckMainData & TruckPhotosData & TruckTimesData & TruckQueueData;
interface TruckStore {
    trucks: CombinedTruckData[];
    trucksLoading: boolean;
    trucksError: string | null;
    connectionStatus: "connected" | "connecting" | "disconnected" | "error";
    fetchExistingSuratJalan: () => Promise<any[]>;
    saveSuratJalanToDatabase: (nosj: string) => Promise<void>;
    fetchTrucks: (filters?: {
        searchTerm?: string;
        status?: string;
        type?: string;
        dateFrom?: string;
        dateTo?: string;
    }) => Promise<CombinedTruckData[]>;
    fetchTrucksForExport: (filters?: {
        startDate?: string;
        endDate?: string;
        department?: string;
        status?: string;
    }) => Promise<TruckExportData[]>;
    fetchTruckQueue: (id: string) => Promise<TruckQueueData | null>;
    createTruck: (data: Omit<CombinedTruckData, "id">) => Promise<CombinedTruckData>;
    updateTruckAPI: (
        id: string,
        updates: Partial<CombinedTruckData>,
    ) => Promise<CombinedTruckData>;
    deleteTruck: (id: string) => Promise<void>;
    refreshTrucks: () => Promise<void>;
    addTruck: (truck: CombinedTruckData) => void;
    updateTruck: (id: string, updates: Partial<CombinedTruckData>) => void;
    removeTruck: (id: string) => void;
    getTruckById: (id: string) => CombinedTruckData | undefined;
    getTrucksByStatus: (status: CombinedTruckData["status"]) => CombinedTruckData[];
    getTrucksByType: (type: CombinedTruckData["type"]) => CombinedTruckData[];
    setConnectionStatus: (
        status: "connected" | "connecting" | "disconnected" | "error",
    ) => void;
    setTrucksLoading: (loading: boolean) => void;
    setTrucksError: (error: string | null) => void;
    clearErrors: () => void;
}
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
// const API_BASE_URL = "http://192.168.4.108:8080"
const USE_DUMMY_DATA = false;
const convertIntervalToString = (interval: any): string | null => {
    if (!interval) return null;

    if (typeof interval === 'string') {
        return interval;
    }

    if (typeof interval === 'object' && interval !== null) {
        if (interval.minutes !== undefined || interval.hours !== undefined || interval.seconds !== undefined) {
            const hours = interval.hours || 0;
            const minutes = interval.minutes || 0;
            const seconds = interval.seconds || 0;
            return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(Math.floor(seconds)).padStart(2, '0')}`;
        }

        if (interval.toString && typeof interval.toString === 'function') {
            const stringValue = interval.toString();
            if (stringValue !== '[object Object]') {
                return stringValue;
            }
        }
    }
    return null;
};

const transformTruckFromDB = (dbTruck: any): CombinedTruckData => {
    return {
        id: dbTruck.id?.toString() || "",
        platenumber: dbTruck.platenumber || "",
        noticket: dbTruck.noticket || "",
        department: dbTruck.department || "",
        nikdriver: dbTruck.nikdriver || "",
        tlpdriver: dbTruck.tlpdriver || "",
        nosj: dbTruck.nosj || "",
        tglsj: dbTruck.tglsj || "",
        driver: dbTruck.driver || "",
        supplier: dbTruck.supplier || "",
        eta: dbTruck.eta || "",
        status: dbTruck.status || "waiting",
        type: dbTruck.type || "Inbound",
        operation: dbTruck.operation || "bongkar",
        goods: dbTruck.goods || "",
        descin: dbTruck.descin || "",
        descout: dbTruck.descout || "",
        statustruck: dbTruck.statustruck || "",
        armada: dbTruck.armada || "",
        kelengkapan: dbTruck.kelengkapan || "",
        jenismobil: dbTruck.jenismobil || "",
        jenisbarang: dbTruck.jenisbarang || "",
        date: dbTruck.date || "",

        skipped_steps: dbTruck.skipped_steps || undefined,
        skip_reason: dbTruck.skip_reason || undefined,
        loading_cycle: dbTruck.loading_cycle || 1,
        department_history: dbTruck.department_history || undefined,
        cycle_number: dbTruck.cycle_number || undefined,

        arrivaltime: dbTruck.arrivaltime || dbTruck.arrivalTime || "",
        waitingfortimbang: convertIntervalToString(dbTruck.waitingfortimbang) || "",
        starttimbang: dbTruck.starttimbang || "",
        finishtimbang: dbTruck.finishtimbang || "",
        totalprocesstimbang: convertIntervalToString(dbTruck.totalprocesstimbang) || "",
        runtohpc: dbTruck.runtohpc || "",
        waitingforarrivalhpc: convertIntervalToString(dbTruck.waitingforarrivalhpc) || "",
        entryhpc: dbTruck.entryhpc || "",
        totalwaitingarrival: convertIntervalToString(dbTruck.totalwaitingarrival) || "",
        starttimbangneto: dbTruck.starttimbangneto || "",
        finishtimbangneto: dbTruck.finishtimbangneto || "",
        waitingfortimbangneto: dbTruck.waitingfortimbangneto || "",
        totalprocesstimbangneto: dbTruck.totalprocesstimbangneto || "",
        exittime: dbTruck.exittime || "",

        runtopt: dbTruck.runtopt || "",
        waitingforarrivalpt: convertIntervalToString(dbTruck.waitingforarrivalpt) || "",
        entrypt: dbTruck.entrypt || "",
        startloadingtime: dbTruck.startloadingtime || "",
        finishloadingtime: dbTruck.finishloadingtime || "",
        totalprocessloadingtime: convertIntervalToString(dbTruck.totalprocessloadingtime) || "",
        actualwaitloadingtime: convertIntervalToString(dbTruck.actualwaitloadingtime) || "",
        waitingforexit: dbTruck.waitingforexit || "",
        totaltruckcompletiontime: dbTruck.totaltruckcompletiontime || "",

        truck_id: dbTruck.truck_id || '',
        driver_photo: dbTruck.driver_photo || "",
        sim_photo: dbTruck.sim_photo || "",
        stnk_photo: dbTruck.stnk_photo || "",
        queue_ticket: dbTruck.queue_ticket || undefined,
        queue_position: dbTruck.queue_position || undefined,
    };
};


export const useTruckStore = create<TruckStore>((set, get) => ({
    trucks: [],
    trucksLoading: false,
    trucksError: null,
    connectionStatus: "disconnected",
    fetchExistingSuratJalan: async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/suratjalan`);
            if (!res.ok) {
                console.error(
                    "fetchExistingSuratJalan: network response not ok",
                    res.status,
                );
                return [];
            }
            const json = await res.json();
            if (Array.isArray(json)) {
                return json;
            }
            if (json && Array.isArray((json as any).rows)) {
                return (json as any).rows;
            }
            if (json && Array.isArray((json as any).data)) {
                return (json as any).data;
            }
            console.warn(
                "fetchExistingSuratJalan: unexpected response shape",
                json,
            );
            return [];
        } catch (error) {
            console.error("fetchExistingSuratJalan error:", error);
            return [];
        }
    },
    saveSuratJalanToDatabase: async (nosj: string) => {
        try {
            const response = await axios.post(
                `${API_BASE_URL}/api/suratjalan`,
                {
                    nosj: nosj,
                    tanggal: new Date().toISOString().slice(0, 10),
                },
            );
            const result = response.data;
            if (!response.status.toString().startsWith("2")) {
                if (response.status === 409) {
                    console.log(
                        "Nomor surat jalan sudah ada di database:",
                        nosj,
                    );
                    return;
                }
                throw new Error(
                    result.message || "Gagal menyimpan nomor surat jalan",
                );
            }

        } catch (error) {
            console.error("Error saving surat jalan to database:", error);
        }
    },
    fetchTrucks: async (filters = {}) => {
        set({ trucksLoading: true, trucksError: null });
        try {
            const params = new URLSearchParams();
            if (filters.searchTerm)
                params.append("searchTerm", filters.searchTerm);
            if (filters.status) params.append("status", filters.status);
            if (filters.type) params.append("type", filters.type);
            if (filters.dateFrom) params.append("dateFrom", filters.dateFrom);
            if (filters.dateTo) params.append("dateTo", filters.dateTo);
            const url = `${API_BASE_URL}/api/trucks${params.toString() ? `?${params.toString()}` : ""}`;
            const response = await axios.get(url);
            const transformedTrucks = response.data.map(transformTruckFromDB);
            set({
                trucks: transformedTrucks,
                trucksLoading: false,
            });
            return transformedTrucks;
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : "Unknown error";
            console.error("Error fetching trucks:", error);
            set({
                trucksError: errorMessage,
                trucksLoading: false,
            });
            throw error;
        }
    },
    fetchTruckQueue: async (id: string) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/trucks/actualqueue/${id}`);
            return {
                queue_ticket: response.data.queue_ticket,
                queue_position: response.data.queue_position,
            };
        } catch (error: any) {
            if (error.response?.status === 404) {
                // Truck tidak ada di queue
                return null;
            }
            console.error("Error fetching truck queue:", error);
            throw error;
        }
    },
    refreshTrucks: async () => {
        await get().fetchTrucks();
    },
    fetchTrucksForExport: async (filters = {}) => {
        try {
            const params = new URLSearchParams();
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);
            if (filters.department) params.append('department', filters.department);
            if (filters.status) params.append('status', filters.status);
            const url = `${API_BASE_URL}/api/trucks/export${params.toString() ? `?${params.toString()}` : ''}`;
            console.log('📥 Fetching truck data for export...', url);
            const response = await axios.get(url);
            if (!response.data.success) {
                throw new Error(response.data.error || 'Failed to fetch export data');
            }
            console.log(`✅ Fetched ${response.data.count} records for export`);
            return response.data.data;
        } catch (error) {
            console.error('❌ Error fetching trucks for export:', error);
            throw error;
        }
    },
    createTruck: async (data) => {
        try {
            const truckData = {
                platenumber: data.platenumber,
                noticket: data.noticket,
                department: data.department,
                nikdriver: data.nikdriver,
                tlpdriver: data.tlpdriver,
                nosj: data.nosj,
                tglsj: data.tglsj || new Date().toISOString().split('T')[0],
                driver: data.driver,
                supplier: data.supplier,
                eta: data.eta || null,
                status: data.status,
                type: data.type,
                operation: data.operation,
                goods: data.goods,
                descin: data.descin,
                descout: data.descout,
                statustruck: data.statustruck,
                date: data.date || new Date().toISOString().split('T')[0],
                armada: data.armada,
                kelengkapan: data.kelengkapan,
                jenismobil: data.jenismobil,
                jenisbarang: data.jenisbarang,

                arrivaltime: data.arrivaltime || null,
                waitingfortimbang: null,
                starttimbang: null,
                finishtimbang: null,
                totalprocesstimbang: null,
                runtohpc: null,
                waitingforarrivalhpc: null,
                entryhpc: null,
                totalwaitingarrival: null,
                startloadingtime: data.startloadingtime || null,
                finishloadingtime: data.finishloadingtime || null,
                totalprocessloadingtime: data.totalprocessloadingtime || null,
                actualwaitloadingtime: data.actualwaitloadingtime || null,

                driver_photo: data.driver_photo || null,
                sim_photo: data.sim_photo || null,
                stnk_photo: data.stnk_photo || null,
            };

            const response = await axios.post(
                `${API_BASE_URL}/api/trucks`,
                truckData,
            );
            const newTruck = transformTruckFromDB(response.data);
            get().refreshTrucks();
            return newTruck;
        } catch (error) {
            console.error("Error creating truck:", error);
            throw error;
        }
    },
    updateTruckAPI: async (id: string, updates) => {
        try {
            console.log('🔍 RAW UPDATES RECEIVED:', updates);
            console.log('🔍 loading_cycle type:', typeof updates.loading_cycle);
            console.log('🔍 loading_cycle value:', updates.loading_cycle);
            // if (updates.loading_cycle !== undefined) {
            //     updates.loading_cycle = parseInt(updates.loading_cycle as any, 10) as any;
            // }

            const cleanedUpdates: any = {};
            Object.keys(updates).forEach(key => {
                const value = updates[key as keyof typeof updates];
                if (value !== undefined) {
                    cleanedUpdates[key] = value;
                }
            });
            const dbUpdates: any = {};

            const truckMainFields = ['platenumber', 'noticket', 'department', 'nikdriver', 'tlpdriver',
                'nosj', 'tglsj', 'driver', 'supplier', 'eta', 'status', 'type',
                'operation', 'goods', 'descin', 'descout', 'statustruck', 'armada',
                'kelengkapan', 'jenismobil', 'jenisbarang', 'date', 'exittime,loading_cycle'];

            const truckTimeFields = ['arrivaltime', 'waitingfortimbang', 'starttimbang', 'finishtimbang',
                'totalprocesstimbang', 'runtohpc', 'waitingforarrivalhpc', 'entryhpc',
                'totalwaitingarrival', 'startloadingtime', 'finishloadingtime',
                'totalprocessloadingtime', 'actualwaitloadingtime', 'starttimbangneto',
                'finishtimbangneto', 'waitingfortimbangneto', 'totalprocesstimbangneto'];
            const truckPhotoFields = ['driver_photo', 'sim_photo', 'stnk_photo'];
            const fieldMapping = {
                platenumber: 'platenumber',
                noticket: 'noticket',
                department: 'department',
                nikdriver: 'nikdriver',
                tlpdriver: 'tlpdriver',
                nosj: 'nosj',
                tglsj: 'tglsj',
                driver: 'driver',
                supplier: 'supplier',
                arrivalTime: 'arrivaltime',
                eta: 'eta',
                status: 'status',
                type: 'type',
                operation: 'operation',
                goods: 'goods',
                descin: 'descin',
                descout: 'descout',
                statustruck: 'statustruck',
                armada: 'armada',
                kelengkapan: 'kelengkapan',
                jenisbarang: 'jenisbarang',
                jenismobil: 'jenismobil',
                date: 'date',
                exittime: 'exittime',
                arrivaltime: 'arrivaltime',
                waitingfortimbang: 'waitingfortimbang',
                starttimbang: 'starttimbang',
                finishtimbang: 'finishtimbang',
                totalprocesstimbang: 'totalprocesstimbang',
                runtohpc: 'runtohpc',
                waitingforarrivalhpc: 'waitingforarrivalhpc',
                entryhpc: 'entryhpc',
                totalwaitingarrival: 'totalwaitingarrival',
                startloadingtime: 'startloadingtime',
                finishloadingtime: 'finishloadingtime',
                totalprocessloadingtime: 'totalprocessloadingtime',
                actualwaitloadingtime: 'actualwaitloadingtime',
                starttimbangneto: 'starttimbangneto',
                finishtimbangneto: 'finishtimbangneto',
                waitingfortimbangneto: 'waitingfortimbangneto',
                totalprocesstimbangneto: 'totalprocesstimbangneto',
                loading_cycle: 'loading_cycle',
                driver_photo: 'driver_photo',
                sim_photo: 'sim_photo',
                stnk_photo: 'stnk_photo',
            };
            Object.entries(cleanedUpdates).forEach(([frontendKey, value]) => {
                if (value !== undefined && value !== null) {
                    const dbKey = fieldMapping[frontendKey as keyof typeof fieldMapping] || frontendKey;

                    if (frontendKey === 'operation') {
                        if (value === 'bongkar' || value === 'muat') {
                            dbUpdates[dbKey] = value;

                        } else {
                            console.warn('Invalid operation value:', value, '- skipping field');
                        }
                    }
                    else if (frontendKey === 'status') {
                        dbUpdates[dbKey] = value;

                    }
                    else if (frontendKey === 'startloadingtime') {
                        dbUpdates[dbKey] = value;

                    }
                    else if (frontendKey === 'finishloadingtime') {
                        dbUpdates[dbKey] = value;

                    }
                    else {
                        dbUpdates[dbKey] = value;
                    }
                }
            });
            if (Object.keys(dbUpdates).length === 0) {

                throw new Error('No fields to update');
            }
            const response = await axios.put(
                `${API_BASE_URL}/api/trucks/${id}`,
                dbUpdates,
            );
            const updatedTruck = transformTruckFromDB(response.data);
            set((state) => ({
                trucks: state.trucks.map((truck) =>
                    truck.id === id ? updatedTruck : truck,
                ),
            }));
            return updatedTruck;
        } catch (error: any) {
            console.error("=== UPDATE ERROR ===");
            console.error("Error updating truck:", error);
            console.error("Error message:", error.message);
            console.error("Error response:", error.response?.data);
            console.error("Error status:", error.response?.status);
            console.error("Error headers:", error.response?.headers);
            throw error;
        }
    },
    deleteTruck: async (id: string) => {
        try {
            await axios.delete(`${API_BASE_URL}/api/trucks/${id}`);
            set((state) => ({
                trucks: state.trucks.filter((truck) => truck.id !== id),
            }));
        } catch (error) {
            console.error("Error deleting truck:", error);
            throw error;
        }
    },
    addTruck: (truck) => {
        set((state) => ({
            trucks: [...state.trucks, truck],
        }));
    },
    updateTruck: (id, updates) => {
        set((state) => ({
            trucks: state.trucks.map((truck) =>
                truck.id === id ? { ...truck, ...updates } : truck,
            ),
        }));
    },
    removeTruck: (id) => {
        set((state) => ({
            trucks: state.trucks.filter((truck) => truck.id !== id),
        }));
    },
    getTruckById: (id) => {
        return get().trucks.find((truck) => truck.id === id);
    },
    getTrucksByStatus: (status) => {
        return get().trucks.filter((truck) => truck.status === status);
    },
    getTrucksByType: (type) => {
        return get().trucks.filter((truck) => truck.type === type);
    },
    setConnectionStatus: (status) => {
        set({ connectionStatus: status });
    },
    setTrucksLoading: (loading) => {
        set({ trucksLoading: loading });
    },
    setTrucksError: (error) => {
        set({ trucksError: error });
    },
    clearErrors: () => {
        set({
            trucksError: null,
        });
    },
}));

export const useTrucks = () => {
    const store = useTruckStore();
    return {
        trucks: store.trucks,
        loading: store.trucksLoading,
        error: store.trucksError,
        fetchTrucks: store.fetchTrucks,
        createTruck: store.createTruck,
        updateTruckAPI: store.updateTruckAPI,
        deleteTruck: store.deleteTruck,
        refreshTrucks: store.refreshTrucks,
        addTruck: store.addTruck,
        updateTruck: store.updateTruck,
        removeTruck: store.removeTruck,
        getTruckById: store.getTruckById,
        getTrucksByStatus: store.getTrucksByStatus,
        getTrucksByType: store.getTrucksByType,
    };
};

export const useTrucksWithFetch = (filters?: {
    searchTerm?: string;
    status?: string;
    type?: string;
    dateFrom?: string;
    dateTo?: string;
}) => {
    const store = useTruckStore();
    React.useEffect(() => {
        if (store.trucks.length === 0 && !store.trucksLoading) {
            store.fetchTrucks(filters);
        }
    }, [
        filters?.searchTerm,
        filters?.status,
        filters?.type,
        filters?.dateFrom,
        filters?.dateTo,
    ]);
    return {
        trucks: store.trucks,
        loading: store.trucksLoading,
        error: store.trucksError,
        refetch: () => store.fetchTrucks(filters),
        createTruck: store.createTruck,
        updateTruckAPI: store.updateTruckAPI,
        fetchTruckQueue: store.fetchTruckQueue,
        deleteTruck: store.deleteTruck,
        refreshTrucks: store.refreshTrucks,
        updateTruck: store.updateTruck,
        getTruckById: store.getTruckById,
        getTrucksByStatus: store.getTrucksByStatus,
        getTrucksByType: store.getTrucksByType,
        fetchExistingSuratJalan: store.fetchExistingSuratJalan,
        saveSuratJalanToDatabase: store.saveSuratJalanToDatabase,
    };
};
