import React from 'react';
import { create } from "zustand";
import axios from "axios";

// Interface untuk Surat Jalan
export interface SuratJalan {
    id: string; 
    noSuratJalan: string;
    tanggal: string;
    status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
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

// Interface untuk Truck Record
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
    status: "Waiting" | "Loading" | "Finished" | "pending" | "loading" | "finished";
    type: "Inbound" | "Outbound" | "internal" | "external";
    operation: "bongkar" | "muat";
    goods: string;
    descin: string;
    descout: string;
    statustruck: string;
    estimatedFinish?: string;
    estimatedWaitTime: number | string; // in minutes or timestamp
    actualWaitTime?: number | string; // in minutes or timestamp
    startLoadingTime?: string;
    finishTime?: string;
    date: string;
    armada: string;
    kelengkapan: string;
    jenismobil: string;
    quantity?: string;
    unit?: string;
}

// Interface untuk API Response
interface ApiResponse<T> {
    success: boolean;
    data: T;
    message: string;
    error?: string;
}

// Interface untuk Truck Store
interface TruckStore {
  // State untuk Truck Records
    trucks: TruckRecord[];
    trucksLoading: boolean;
    trucksError: string | null;
    
  // Connection status
    connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';

  // Actions untuk Surat Jalan Database
    fetchExistingSuratJalan: () => Promise<any[]>;
    saveSuratJalanToDatabase: (nosj: string) => Promise<void>;

  // Actions untuk Truck Records
    fetchTrucks: (filters?: {
        searchTerm?: string;
        status?: string;
        type?: string;
        dateFrom?: string;
        dateTo?: string;
    }) => Promise<TruckRecord[]>;
    createTruck: (data: Omit<TruckRecord, 'id'>) => Promise<TruckRecord>;
    updateTruckAPI: (id: string, updates: Partial<TruckRecord>) => Promise<TruckRecord>;
    deleteTruck: (id: string) => Promise<void>;
    refreshTrucks: () => Promise<void>;
    addTruck: (truck: TruckRecord) => void;
    updateTruck: (id: string, updates: Partial<TruckRecord>) => void;
    removeTruck: (id: string) => void;
    getTruckById: (id: string) => TruckRecord | undefined;
    getTrucksByStatus: (status: TruckRecord['status']) => TruckRecord[];
    getTrucksByType: (type: TruckRecord['type']) => TruckRecord[];

  // Utility actions
    setConnectionStatus: (status: 'connected' | 'connecting' | 'disconnected' | 'error') => void;
    setTrucksLoading: (loading: boolean) => void;
    setTrucksError: (error: string | null) => void;
    clearErrors: () => void;
}

// Base URL untuk API
const API_BASE_URL = 'http://192.168.4.62:3000';
const USE_DUMMY_DATA = false; // Using real API from database

// Helper function untuk transform data dari database ke frontend interface
const transformTruckFromDB = (dbTruck: any): TruckRecord => {
    return {
        id: dbTruck.id?.toString() || '',
        plateNumber: dbTruck.platenumber || '',
        noticket: dbTruck.noticket || '',
        department: dbTruck.department || '',
        nikdriver: dbTruck.nikdriver || '',
        tlpdriver: dbTruck.tlpdriver || '',
        nosj: dbTruck.nosj || '',
        tglsj: dbTruck.tglsj || '',
        driver: dbTruck.driver || '',
        supplier: dbTruck.supplier || '',
        arrivalTime: dbTruck.arrivaltime || '',
        eta: dbTruck.eta || '',
        status: dbTruck.status || 'Waiting',
        type: dbTruck.type || 'Inbound',
        operation: dbTruck.operation || 'bongkar',
        goods: dbTruck.goods || '',
        descin: dbTruck.descin || '',
        descout: dbTruck.descout || '',
        statustruck: dbTruck.statustruck || '',
        estimatedFinish: dbTruck.estimatedfinish || '',
        estimatedWaitTime: dbTruck.estimatedwaittime || 0,
        actualWaitTime: dbTruck.actualwaittime || 0,
        startLoadingTime: dbTruck.startloadingtime || '',
        finishTime: dbTruck.finishtime || '',
        date: dbTruck.date || '',
        armada: dbTruck.armada || '',
        kelengkapan: dbTruck.kelengkapan || '',
        jenismobil: dbTruck.jenismobil || ''
    };
};

// Create Zustand store
export const useTruckStore = create<TruckStore>((set, get) => ({
    // Initial state untuk Truck Records
    trucks: [],
    trucksLoading: false,
    trucksError: null,
    
    // Connection status
    connectionStatus: 'disconnected',

    // Actions untuk Surat Jalan Database
    fetchExistingSuratJalan: async () => {
        try {
            // Try to fetch from API endpoint and normalize the response shape.
            const res = await fetch(`${API_BASE_URL}/api/suratjalan`);
            if (!res.ok) {
                console.error('fetchExistingSuratJalan: network response not ok', res.status);
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
            console.warn('fetchExistingSuratJalan: unexpected response shape', json);
            return [];
        } catch (error) {
            console.error('fetchExistingSuratJalan error:', error);
            return [];
        }
    },

    saveSuratJalanToDatabase: async (nosj: string) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/api/suratjalan`, {
                nosj: nosj,
                tanggal: new Date().toISOString().slice(0, 10)
            });

            const result = response.data;
            
            if (!response.status.toString().startsWith('2')) {
                // Jika nomor surat jalan sudah ada, tidak perlu error karena itu normal
                if (response.status === 409) {
                    console.log('Nomor surat jalan sudah ada di database:', nosj);
                    return;
                }
                throw new Error(result.message || 'Gagal menyimpan nomor surat jalan');
            }

            console.log('Nomor surat jalan berhasil disimpan:', result);
        } catch (error) {
            console.error('Error saving surat jalan to database:', error);
            // Don't throw error to prevent blocking truck update
        }
    },
  // Actions untuk Truck Records
    fetchTrucks: async (filters = {}) => {
        set({ trucksLoading: true, trucksError: null });
        
        try {
            // Real API call
            const params = new URLSearchParams();
            
            if (filters.searchTerm) params.append('searchTerm', filters.searchTerm);
            if (filters.status) params.append('status', filters.status);
            if (filters.type) params.append('type', filters.type);
            if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
            if (filters.dateTo) params.append('dateTo', filters.dateTo);
            
            const url = `${API_BASE_URL}/api/trucks${params.toString() ? `?${params.toString()}` : ''}`;
            const response = await axios.get(url);
            
            // Transform data dari database ke frontend interface
            const transformedTrucks = response.data.map(transformTruckFromDB);
            
            set({ 
                trucks: transformedTrucks,
                trucksLoading: false 
            });
            
            return transformedTrucks;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('Error fetching trucks:', error);
            
            set({ 
                trucksError: errorMessage,
                trucksLoading: false 
            });

            throw error;
        }
    },

    refreshTrucks: async () => {
        // Refresh dengan filter yang sama jika ada
        await get().fetchTrucks();
    },

    createTruck: async (data) => {
        try {
            // Transform data ke format database
            const dbData = {
                platenumber: data.plateNumber,
                noticket: data.noticket,
                department: data.department,
                nikdriver: data.nikdriver,
                tlpdriver: data.tlpdriver,
                nosj: data.nosj,
                tglsj: data.tglsj,
                driver: data.driver,
                supplier: data.supplier,
                arrivaltime: data.arrivalTime,
                eta: data.eta,
                status: data.status,
                type: data.type,
                operation: data.operation,
                goods: data.goods,
                descin: data.descin,
                descout: data.descout,
                statustruck: data.statustruck,
                estimatedfinish: data.estimatedFinish,
                estimatedwaittime: data.estimatedWaitTime,
                actualwaittime: data.actualWaitTime,
                startloadingtime: data.startLoadingTime,
                finishtime: data.finishTime,
                date: data.date,
                armada: data.armada,
                kelengkapan: data.kelengkapan,
                jenismobil: data.jenismobil
            };
            
            const response = await axios.post(`${API_BASE_URL}/api/trucks`, dbData);
            const newTruck = transformTruckFromDB(response.data);
            
            // Refresh list setelah create
            get().refreshTrucks();
            
            return newTruck;
        } catch (error) {
            console.error('Error creating truck:', error);
            throw error;
        }
    },

    updateTruckAPI: async (id: string, updates) => {
        try {
            // Transform updates ke format database
            const dbUpdates: any = {};
            if (updates.plateNumber !== undefined) dbUpdates.platenumber = updates.plateNumber;
            if (updates.noticket !== undefined) dbUpdates.noticket = updates.noticket;
            if (updates.department !== undefined) dbUpdates.department = updates.department;
            if (updates.nikdriver !== undefined) dbUpdates.nikdriver = updates.nikdriver;
            if (updates.tlpdriver !== undefined) dbUpdates.tlpdriver = updates.tlpdriver;
            if (updates.nosj !== undefined) dbUpdates.nosj = updates.nosj;
            if (updates.tglsj !== undefined) dbUpdates.tglsj = updates.tglsj;
            if (updates.driver !== undefined) dbUpdates.driver = updates.driver;
            if (updates.supplier !== undefined) dbUpdates.supplier = updates.supplier;
            if (updates.arrivalTime !== undefined) dbUpdates.arrivaltime = updates.arrivalTime;
            if (updates.eta !== undefined) dbUpdates.eta = updates.eta;
            if (updates.status !== undefined) dbUpdates.status = updates.status;
            if (updates.type !== undefined) dbUpdates.type = updates.type;
            if (updates.operation !== undefined) dbUpdates.operation = updates.operation;
            if (updates.goods !== undefined) dbUpdates.goods = updates.goods;
            if (updates.descin !== undefined) dbUpdates.descin = updates.descin;
            if (updates.descout !== undefined) dbUpdates.descout = updates.descout;
            if (updates.statustruck !== undefined) dbUpdates.statustruck = updates.statustruck;
            if (updates.estimatedFinish !== undefined) dbUpdates.estimatedfinish = updates.estimatedFinish;
            if (updates.estimatedWaitTime !== undefined) dbUpdates.estimatedwaittime = updates.estimatedWaitTime;
            if (updates.actualWaitTime !== undefined) dbUpdates.actualwaittime = updates.actualWaitTime;
            if (updates.startLoadingTime !== undefined) dbUpdates.startloadingtime = updates.startLoadingTime;
            if (updates.finishTime !== undefined) dbUpdates.finishtime = updates.finishTime;
            if (updates.date !== undefined) dbUpdates.date = updates.date;
            if (updates.armada !== undefined) dbUpdates.armada = updates.armada;
            if (updates.kelengkapan !== undefined) dbUpdates.kelengkapan = updates.kelengkapan;
            if (updates.jenismobil !== undefined) dbUpdates.jenismobil = updates.jenismobil;
            
            const response = await axios.put(`${API_BASE_URL}/api/trucks/${id}`, dbUpdates);
            const updatedTruck = transformTruckFromDB(response.data);
            
            // Update local state
            set((state) => ({
                trucks: state.trucks.map(truck => 
                    truck.id === id ? updatedTruck : truck
                )
            }));
            
            return updatedTruck;
        } catch (error) {
            console.error('Error updating truck:', error);
            throw error;
        }
    },

    deleteTruck: async (id: string) => {
        try {
            await axios.delete(`${API_BASE_URL}/api/trucks/${id}`);
            
            // Update local state
            set((state) => ({
                trucks: state.trucks.filter(truck => truck.id !== id)
            }));
        } catch (error) {
            console.error('Error deleting truck:', error);
            throw error;
        }
    },
    addTruck: (truck) => {
    set((state) => ({
        trucks: [...state.trucks, truck]
    }));
    },

    updateTruck: (id, updates) => {
    set((state) => ({
        trucks: state.trucks.map(truck => 
        truck.id === id ? { ...truck, ...updates } : truck
        )
    }));
    },

    removeTruck: (id) => {
    set((state) => ({
        trucks: state.trucks.filter(truck => truck.id !== id)
    }));
    },

    getTruckById: (id) => {
    return get().trucks.find(truck => truck.id === id);
    },

    getTrucksByStatus: (status) => {
    return get().trucks.filter(truck => truck.status === status);
    },

    getTrucksByType: (type) => {
    return get().trucks.filter(truck => truck.type === type);
    },

  // Utility actions
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
        trucksError: null 
    });
    },
}));

// Hook untuk menggunakan hanya bagian truck
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
        getTrucksByType: store.getTrucksByType
    };
};

// Hook untuk menggunakan truck data dengan auto-fetch
export const useTrucksWithFetch = (filters?: {
    searchTerm?: string;
    status?: string;
    type?: string;
    dateFrom?: string;
    dateTo?: string;
}) => {
    const store = useTruckStore();
    
    // Effect untuk auto-fetch saat hook digunakan
    React.useEffect(() => {
        if (store.trucks.length === 0 && !store.trucksLoading) {
            store.fetchTrucks(filters);
        }
    }, [filters?.searchTerm, filters?.status, filters?.type, filters?.dateFrom, filters?.dateTo]);

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
        // Surat Jalan database functions
        fetchExistingSuratJalan: store.fetchExistingSuratJalan,
        saveSuratJalanToDatabase: store.saveSuratJalanToDatabase
    };
};
