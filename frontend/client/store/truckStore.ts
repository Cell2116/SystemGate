import React from "react";
import { create } from "zustand";
import axios from "axios";

// Interface Surat Jalan
export interface SuratJalan {
    id: string;
    noSuratJalan: string;
    tanggal: string;
    status?: "pending" | "in_progress" | "completed" | "cancelled";
    supplier?: string;
    barang?: string;
    jumlahBarang?: number;
    unit?: string;
    keterangan?: string;
    createdAt?: string;
    updatedAt?: string;
    createdBy?: string;
    updatedBy?: string;
}

// Interface untuk data dari tabel trucks (main truck info)
interface TruckMainData {
    id: string;
    platenumber: string;
    noticket: string;
    department: string;
    nikdriver: string;
    tlpdriver: string;
    nosj: string;
    tglsj: string;
    driver: string;
    supplier: string;
    eta?: string;
    status: "waiting" | "timbang" | "loading" | "unloading" | "done" | "on process" | "finished";
    type: "Inbound" | "Outbound" | "internal" | "external";
    operation: "bongkar" | "muat";
    goods: string;
    descin: string;
    descout: string;
    statustruck: string;
    armada: string;
    kelengkapan: string;
    jenismobil: string;
    date: string;
    exittime: string;
}

// Interface untuk data dari tabel truck_times
interface TruckTimesData {
    id: string;
    truck_id: string;
    arrivaltime: string;
    waitingfortimbang: string;
    starttimbang: string;
    finishtimbang: string;
    totalprocesstimbang: string;
    runtohpc: string;
    waitingforarrivalhpc: string;
    entryhpc: string;
    totalwaitingarrival: string;
    startloadingtime: string;
    finishloadingtime: string;
    totalprocessloadingtime: string;
    actualwaitloadingtime: string;
}

// Interface untuk data dari tabel truck_photos
interface TruckPhotosData {
    id: string;
    truck_id: string;
    driver_photo?: string;
    sim_photo?: string;
    stnk_photo?: string;
}

// Interface Truck Record (gabungan dari 3 tabel)
export interface TruckRecord {
    id: string;
    plateNumber: string;
    noticket: string;
    department: string;
    nikdriver: string;
    tlpdriver: string;
    nosj: string;
    tglsj: string;
    driver: string;
    supplier: string;
    arrivalTime: string;
    eta?: string;
    status: "waiting" | "timbang" | "loading" | "unloading" | "done" | "on process" | "finished";
    type: "Inbound" | "Outbound" | "internal" | "external";
    operation: "bongkar" | "muat";
    goods: string;
    descin: string;
    descout: string;
    statustruck: string;
    // Time fields dari truck_times
    arrivaltime: string;
    waitingfortimbang: string;
    starttimbang: string;
    finishtimbang: string;
    totalprocesstimbang: string;
    runtohpc: string;
    waitingforarrivalhpc: string;
    entryhpc: string;
    totalwaitingarrival: string;
    startloadingtime: string;
    finishloadingtime: string;
    totalprocessloadingtime: string;
    actualwaitloadingtime: string;
    exittime: string;
    date: string;
    armada: string;
    kelengkapan: string;
    jenismobil: string;
    // Photo fields dari truck_photos
    quantity?: string;
    driver_photo?: string;
    sim_photo?: string;
    stnk_photo?: string;
    unit?: string;
}

// Interface API Response
interface ApiResponse<T> {
    success: boolean;
    data: T;
    message: string;
    error?: string;
}

// Interface Truck Store
interface TruckStore {
    trucks: TruckRecord[];
    trucksLoading: boolean;
    trucksError: string | null;
    connectionStatus: "connected" | "connecting" | "disconnected" | "error";
    fetchExistingSuratJalan: () => Promise<any[]>;
    saveSuratJalanToDatabase: (nosj: string) => Promise<void>;

    // Actions Truck Records
    fetchTrucks: (filters?: {
        searchTerm?: string;
        status?: string;
        type?: string;
        dateFrom?: string;
        dateTo?: string;
    }) => Promise<TruckRecord[]>;
    createTruck: (data: Omit<TruckRecord, "id">) => Promise<TruckRecord>;
    updateTruckAPI: (
        id: string,
        updates: Partial<TruckRecord>,
    ) => Promise<TruckRecord>;
    deleteTruck: (id: string) => Promise<void>;
    refreshTrucks: () => Promise<void>;
    addTruck: (truck: TruckRecord) => void;
    updateTruck: (id: string, updates: Partial<TruckRecord>) => void;
    removeTruck: (id: string) => void;
    getTruckById: (id: string) => TruckRecord | undefined;
    getTrucksByStatus: (status: TruckRecord["status"]) => TruckRecord[];
    getTrucksByType: (type: TruckRecord["type"]) => TruckRecord[];

    // Utility actions
    setConnectionStatus: (
        status: "connected" | "connecting" | "disconnected" | "error",
    ) => void;
    setTrucksLoading: (loading: boolean) => void;
    setTrucksError: (error: string | null) => void;
    clearErrors: () => void;
}

// Base URL API (Not in ENV Yet, SOON....)
const API_BASE_URL = "http://192.168.4.108:3000";
const USE_DUMMY_DATA = false;

// Helper function untuk mengkonversi PostgreSQL INTERVAL object ke string
const convertIntervalToString = (interval: any): string | null => {
    if (!interval) return null;
    
    // Jika sudah string, return as is
    if (typeof interval === 'string') {
        return interval;
    }
    
    // Jika object PostgreSQL interval
    if (typeof interval === 'object' && interval !== null) {
        // PostgreSQL node driver mengembalikan interval sebagai object
        if (interval.minutes !== undefined || interval.hours !== undefined || interval.seconds !== undefined) {
            const hours = interval.hours || 0;
            const minutes = interval.minutes || 0;
            const seconds = interval.seconds || 0;
            return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(Math.floor(seconds)).padStart(2, '0')}`;
        }
        
        // Jika object punya toString method yang berguna
        if (interval.toString && typeof interval.toString === 'function') {
            const stringValue = interval.toString();
            if (stringValue !== '[object Object]') {
                return stringValue;
            }
        }
    }
    
    return null;
};

const transformTruckFromDB = (dbTruck: any): TruckRecord => {
    // Debug logging untuk INTERVAL fields
    console.log('=== TRANSFORM TRUCK FROM DB ===');
    console.log('Raw dbTruck data:', dbTruck);
    console.log('Status from DB:', dbTruck.status);
    
    // Transform data dari JOIN query 3 tabel
    const result: TruckRecord = {
        // Main truck data (dari tabel trucks)
        id: dbTruck.id?.toString() || "",
        plateNumber: dbTruck.platenumber || "",
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
        date: dbTruck.date || "",
        exittime: dbTruck.exittime || "",
        
        // Time data (dari tabel truck_times dengan fallback)
        arrivalTime: dbTruck.arrivaltime || dbTruck.arrivalTime || "",
        arrivaltime: dbTruck.arrivaltime || "",
        waitingfortimbang: convertIntervalToString(dbTruck.waitingfortimbang) || "",
        starttimbang: dbTruck.starttimbang || "",
        finishtimbang: dbTruck.finishtimbang || "",
        totalprocesstimbang: convertIntervalToString(dbTruck.totalprocesstimbang) || "",
        runtohpc: dbTruck.runtohpc || "",
        waitingforarrivalhpc: convertIntervalToString(dbTruck.waitingforarrivalhpc) || "",
        entryhpc: dbTruck.entryhpc || "",
        totalwaitingarrival: convertIntervalToString(dbTruck.totalwaitingarrival) || "",
        startloadingtime: dbTruck.startloadingtime || "",
        finishloadingtime: dbTruck.finishloadingtime || "",
        totalprocessloadingtime: convertIntervalToString(dbTruck.totalprocessloadingtime) || "",
        actualwaitloadingtime: convertIntervalToString(dbTruck.actualwaitloadingtime) || "",
        
        // Photo data (dari tabel truck_photos)
        driver_photo: dbTruck.driver_photo || "",
        sim_photo: dbTruck.sim_photo || "",
        stnk_photo: dbTruck.stnk_photo || "",
        
        // Optional fields (backward compatibility)
        quantity: dbTruck.quantity || "",
        unit: dbTruck.unit || "",
    };
    
    // console.log('Transformed result:', result);
    // console.log('=== END TRANSFORM DEBUG ===');
    
    return result;
};

// Create Zustand store
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

            console.log("Nomor surat jalan berhasil disimpan:", result);
        } catch (error) {
            console.error("Error saving surat jalan to database:", error);
        }
    },
    // Actions untuk Truck Records
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

    refreshTrucks: async () => {
        await get().fetchTrucks();
    },

    createTruck: async (data) => {
        try {
            // Prepare data yang akan dikirim ke backend
            // Backend akan menangani penyimpanan ke 3 tabel (trucks, truck_times, truck_photos)
            const truckData = {
                // Main truck data (untuk tabel trucks)
                platenumber: data.plateNumber,
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
                exittime: null,
                
                // Time data (untuk tabel truck_times)
                arrivaltime: data.arrivalTime || null,
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
                
                // Photo data (untuk tabel truck_photos)
                driver_photo: data.driver_photo || null,
                sim_photo: data.sim_photo || null,
                stnk_photo: data.stnk_photo || null,
            };

            console.log("=== STORE SENDING TO BACKEND (3-TABLE STRUCTURE) ===", truckData);

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
            console.log('=== UPDATE TRUCK API START ===');
            console.log('ID:', id);
            console.log('Raw updates received:', updates);
            
            // Clean updates - only remove undefined values, allow empty strings and nulls
            const cleanedUpdates: any = {};
            
            Object.keys(updates).forEach(key => {
                const value = updates[key as keyof typeof updates];
                // Only exclude undefined values
                if (value !== undefined) {
                    cleanedUpdates[key] = value;
                }
            });
            
            console.log('Cleaned updates:', cleanedUpdates);

            const dbUpdates: any = {};
            
            // Pisahkan field berdasarkan tabel target
            const truckMainFields = ['platenumber', 'noticket', 'department', 'nikdriver', 'tlpdriver', 
                                    'nosj', 'tglsj', 'driver', 'supplier', 'eta', 'status', 'type', 
                                    'operation', 'goods', 'descin', 'descout', 'statustruck', 'armada', 
                                    'kelengkapan', 'jenismobil', 'date', 'exittime'];
            
            const truckTimeFields = ['arrivaltime', 'waitingfortimbang', 'starttimbang', 'finishtimbang', 
                                    'totalprocesstimbang', 'runtohpc', 'waitingforarrivalhpc', 'entryhpc', 
                                    'totalwaitingarrival', 'startloadingtime', 'finishloadingtime', 
                                    'totalprocessloadingtime', 'actualwaitloadingtime'];
            
            const truckPhotoFields = ['driver_photo', 'sim_photo', 'stnk_photo'];

            // Map frontend field names to database field names untuk semua field
            const fieldMapping = {
                plateNumber: 'platenumber',
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
                jenismobil: 'jenismobil',
                date: 'date',
                exittime: 'exittime',
                // Time fields
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
                // Photo fields
                driver_photo: 'driver_photo',
                sim_photo: 'sim_photo',
                stnk_photo: 'stnk_photo',
            };

            // Process each field update
            Object.entries(cleanedUpdates).forEach(([frontendKey, value]) => {
                if (value !== undefined && value !== null) {
                    const dbKey = fieldMapping[frontendKey as keyof typeof fieldMapping] || frontendKey;
                    
                    // Validasi khusus operation
                    if (frontendKey === 'operation') {
                        if (value === 'bongkar' || value === 'muat') {
                            dbUpdates[dbKey] = value;
                            console.log('🔥 OPERATION UPDATE:', value);
                        } else {
                            console.warn('Invalid operation value:', value, '- skipping field');
                        }
                    }
                    // Validasi khusus status
                    else if (frontendKey === 'status') {
                        dbUpdates[dbKey] = value;
                        console.log('🔥 STATUS UPDATE DETECTED:', value);
                    }
                    // Validasi khusus time fields
                    else if (frontendKey === 'startloadingtime') {
                        dbUpdates[dbKey] = value;
                        console.log('🔥 START LOADING TIME UPDATE:', value);
                    }
                    else if (frontendKey === 'finishloadingtime') {
                        dbUpdates[dbKey] = value;
                        console.log('🔥 FINISH LOADING TIME UPDATE:', value);
                    }
                    // Field lainnya
                    else {
                        dbUpdates[dbKey] = value;
                    }
                }
            });

            // Jangan kirim quantity dan unit ke backend (tidak ada di database)
            delete dbUpdates.quantity;
            delete dbUpdates.unit;
            // Note: quantity and unit fields don't exist in database schema
            
            console.log('=== FINAL DB UPDATES ===');
            console.log('DB updates to send:', dbUpdates);
            console.log('Number of fields to update:', Object.keys(dbUpdates).length);

            if (Object.keys(dbUpdates).length === 0) {
                console.log('No fields to update!');
                throw new Error('No fields to update');
            }

            const response = await axios.put(
                `${API_BASE_URL}/api/trucks/${id}`,
                dbUpdates,
            );
            
            console.log('=== UPDATE SUCCESS ===');
            console.log('Response data:', response.data);
            console.log('Status:', response.status);
            
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
