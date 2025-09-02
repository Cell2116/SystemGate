import React from 'react';
import { create } from "zustand";
// import axios from "axios"; // Uncomment ketika API sudah siap

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
    status: "pending" | "loading" | "finished";
    type: "internal" | "external";
    goods: string;
    descin: string;
    descout: string;
    statustruck: string;
    estimatedFinish?: string;
    estimatedWaitTime: number; // in minutes
    actualWaitTime?: number; // in minutes
    startLoadingTime?: string;
    finishTime?: string;
    date: string;
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
    // State untuk Surat Jalan
    suratJalanList: SuratJalan[];
    suratJalanLoading: boolean;
    suratJalanError: string | null;

  // State untuk Truck Records
    trucks: TruckRecord[];
    trucksLoading: boolean;
    trucksError: string | null;
    
  // Connection status
    connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';

  // Actions untuk Surat Jalan
    fetchSuratJalan: (status?: string) => Promise<SuratJalan[]>;
    fetchSuratJalanById: (id: string) => Promise<SuratJalan | null>;
    createSuratJalan: (data: Omit<SuratJalan, 'id' | 'createdAt' | 'updatedAt'>) => Promise<SuratJalan>;
    updateSuratJalanStatus: (id: string, status: SuratJalan['status']) => Promise<void>;
    refreshSuratJalan: () => Promise<void>;

  // Actions untuk Truck Records
    addTruck: (truck: TruckRecord) => void;
    updateTruck: (id: string, updates: Partial<TruckRecord>) => void;
    removeTruck: (id: string) => void;
    getTruckById: (id: string) => TruckRecord | undefined;
    getTrucksByStatus: (status: TruckRecord['status']) => TruckRecord[];
    getTrucksByType: (type: TruckRecord['type']) => TruckRecord[];

  // Utility actions
    setConnectionStatus: (status: 'connected' | 'connecting' | 'disconnected' | 'error') => void;
    setSuratJalanLoading: (loading: boolean) => void;
    setSuratJalanError: (error: string | null) => void;
    setTrucksLoading: (loading: boolean) => void;
    setTrucksError: (error: string | null) => void;
    clearErrors: () => void;
}

// Base URL untuk API - saat ini menggunakan dummy data
const API_BASE_URL = 'http://192.168.4.62:3000';
const USE_DUMMY_DATA = true; // Set false ketika API sudah siap

// Dummy data untuk development - 5 sample surat jalan siap pakai

// Dummy data untuk development
const DUMMY_SURAT_JALAN: SuratJalan[] = [
    { 
    id: "SJ001", 
    noSuratJalan: "SJ001/2025/HPC", 
    tanggal: "2025-09-01", 
    status: "pending",
    supplier: "PT Alkindo Naratama",
    barang: "Raw Material Paper",
    jumlahBarang: 100,
    unit: "Ton",
    keterangan: "Pengiriman rutin bulanan"
    },
    { 
    id: "SJ002", 
    noSuratJalan: "SJ002/2025/LOG", 
    tanggal: "2025-09-01", 
    status: "pending",
    supplier: "PT Logistik Prima",
    barang: "Chemical Additives",
    jumlahBarang: 50,
    unit: "Drum",
    keterangan: "Bahan kimia untuk produksi"
    },
    { 
    id: "SJ003", 
    noSuratJalan: "SJ003/2025/PRD", 
    tanggal: "2025-09-02", 
    status: "completed",
    supplier: "PT Production Supply",
    barang: "Packaging Material",
    jumlahBarang: 200,
    unit: "Roll",
    keterangan: "Material kemasan produk jadi"
    },
    { 
    id: "SJ004", 
    noSuratJalan: "SJ004/2025/QUA", 
    tanggal: "2025-09-02", 
    status: "pending",
    supplier: "PT Quality Materials",
    barang: "Testing Equipment",
    jumlahBarang: 5,
    unit: "Unit",
    keterangan: "Peralatan testing kualitas"
    },
    {     
    id: "SJ005", 
    noSuratJalan: "SJ005/2025/HPC", 
    tanggal: "2025-09-03", 
    status: "pending",
    supplier: "PT Heavy Paper Corp",
    barang: "Heavy Duty Paper",
    jumlahBarang: 150,
    unit: "Ton",
    keterangan: "Paper grade khusus untuk industrial"
    },
];

// Helper function untuk simulasi delay API
const simulateApiDelay = (ms: number = 1000) => 
    new Promise(resolve => setTimeout(resolve, ms));

// Helper function untuk simulasi error (5% chance)
const simulateApiError = () => {
  if (Math.random() < 0.05) { // 5% chance of error
    throw new Error('Simulasi error jaringan - coba lagi');
    }
};

// Create Zustand store
export const useTruckStore = create<TruckStore>((set, get) => ({
    // Initial state untuk Surat Jalan
    suratJalanList: [],
    suratJalanLoading: false,
    suratJalanError: null,

    // Initial state untuk Truck Records
    trucks: [],
    trucksLoading: false,
    trucksError: null,
    
    // Connection status
    connectionStatus: 'disconnected',

    // Actions untuk Surat Jalan
    fetchSuratJalan: async (status?: string) => {
        set({ suratJalanLoading: true, suratJalanError: null });
        
        try {
        if (USE_DUMMY_DATA) {
        // Simulasi delay API
        await simulateApiDelay(500);
        
        // Simulasi kemungkinan error
        simulateApiError();
        
        // Filter data berdasarkan status jika ada
        let filteredData = DUMMY_SURAT_JALAN;
        if (status) {
            filteredData = DUMMY_SURAT_JALAN.filter(sj => sj.status === status);
        }
        
        set({ 
            suratJalanList: filteredData,
            suratJalanLoading: false 
        });
        
        return filteredData;
        } else {
        // Real API call - akan digunakan nanti
        /* 
        const url = new URL(`${API_BASE_URL}/api/surat-jalan`);
        if (status) {
            url.searchParams.append('status', status);
        }

        const response = await axios.get(url.toString());
        const result: ApiResponse<SuratJalan[]> = response.data;
        
        if (!result.success) {
            throw new Error(result.message || 'Gagal mengambil data surat jalan');
        }

        set({ 
            suratJalanList: result.data,
            suratJalanLoading: false 
        });
        
        return result.data;
        */
        throw new Error('API belum diimplementasi');
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error fetching surat jalan:', error);
        
        set({ 
        suratJalanError: errorMessage,
        suratJalanLoading: false 
        });

        throw error;
    }
    },

    fetchSuratJalanById: async (id: string) => {
    try {
        if (USE_DUMMY_DATA) {
        // Simulasi delay API
        await simulateApiDelay(300);
        
        // Simulasi kemungkinan error
        simulateApiError();
        
        const found = DUMMY_SURAT_JALAN.find(sj => sj.id === id);
        return found || null;
        } else {
        // Real API call - akan digunakan nanti
        /*
        const response = await axios.get(`${API_BASE_URL}/api/surat-jalan/${id}`);
        const result: ApiResponse<SuratJalan> = response.data;
        
        if (!result.success) {
            throw new Error(result.message || 'Gagal mengambil detail surat jalan');
        }

        return result.data;
        */
        throw new Error('API belum diimplementasi');
        }
    } catch (error) {
        console.error('Error fetching surat jalan detail:', error);
        return null;
    }
    },

    createSuratJalan: async (data) => {
    try {
        if (USE_DUMMY_DATA) {
        // Simulasi delay API
        await simulateApiDelay(800);
        
        // Simulasi kemungkinan error
        simulateApiError();
        
        // Create new surat jalan dengan ID unik
        const newSuratJalan: SuratJalan = {
            ...data,
            id: `SJ${Date.now()}`,
            status: data.status || 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // Update dummy data
        DUMMY_SURAT_JALAN.push(newSuratJalan);
        
        // Refresh store
        get().refreshSuratJalan();
        
        return newSuratJalan;
        } else {
        // Real API call - akan digunakan nanti
        /*
        const response = await axios.post(`${API_BASE_URL}/api/surat-jalan`, data);
        const result: ApiResponse<SuratJalan> = response.data;
        
        if (!result.success) {
            throw new Error(result.message || 'Gagal membuat surat jalan');
        }

        // Refresh list setelah create
        get().refreshSuratJalan();
        
        return result.data;
        */
        throw new Error('API belum diimplementasi');
        }
    } catch (error) {
        console.error('Error creating surat jalan:', error);
        throw error;
    }
    },

    updateSuratJalanStatus: async (id: string, status) => {
    try {
        if (USE_DUMMY_DATA) {
        // Simulasi delay API
        await simulateApiDelay(400);
        
        // Simulasi kemungkinan error
        simulateApiError();
        
        // Update dummy data
        const index = DUMMY_SURAT_JALAN.findIndex(sj => sj.id === id);
        if (index !== -1) {
            DUMMY_SURAT_JALAN[index] = {
            ...DUMMY_SURAT_JALAN[index],
            status,
            updatedAt: new Date().toISOString()
            };
        }
        
        // Update local state
        const currentList = get().suratJalanList;
        const updatedList = currentList.map(sj => 
            sj.id === id ? { ...sj, status, updatedAt: new Date().toISOString() } : sj
        );
        
        set({ suratJalanList: updatedList });
        } else {
        // Real API call - akan digunakan nanti
        /*
        const response = await axios.patch(`${API_BASE_URL}/api/surat-jalan/${id}/status`, {
            status
        });
        const result: ApiResponse<any> = response.data;
        
        if (!result.success) {
            throw new Error(result.message || 'Gagal mengupdate status surat jalan');
        }

        // Update local state
        const currentList = get().suratJalanList;
        const updatedList = currentList.map(sj => 
            sj.id === id ? { ...sj, status } : sj
        );
        
        set({ suratJalanList: updatedList });
        */
        throw new Error('API belum diimplementasi');
        }
    }catch (error) {
        console.error('Error updating surat jalan status:', error);
        throw error;
    }
    },

    refreshSuratJalan: async () => {
    const currentState = get();
    // Refresh dengan filter status yang sama jika ada
    const currentStatus = currentState.suratJalanList.length > 0 ? 
        currentState.suratJalanList[0].status : undefined;
    
    await get().fetchSuratJalan(currentStatus);
    },

  // Actions untuk Truck Records
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

    setSuratJalanLoading: (loading) => {
    set({ suratJalanLoading: loading });
    },

    setSuratJalanError: (error) => {
    set({ suratJalanError: error });
    },

    setTrucksLoading: (loading) => {
    set({ trucksLoading: loading });
    },

    setTrucksError: (error) => {
    set({ trucksError: error });
    },

    clearErrors: () => {
    set({ 
        suratJalanError: null, 
        trucksError: null 
    });
    },
}));

// Hook untuk menggunakan hanya bagian surat jalan
export const useSuratJalan = (status?: string) => {
    const store = useTruckStore();
  // Effect untuk auto-fetch saat hook digunakan
    React.useEffect(() => {
    if (store.suratJalanList.length === 0 && !store.suratJalanLoading) {
        store.fetchSuratJalan(status);
    }
    }, [status]);

    return {
    data: store.suratJalanList,
    loading: store.suratJalanLoading,
    error: store.suratJalanError,
    refetch: () => store.fetchSuratJalan(status),
    createSuratJalan: store.createSuratJalan,
    updateStatus: store.updateSuratJalanStatus
    };
};

// Hook untuk menggunakan hanya bagian truck
export const useTrucks = () => {
    const store = useTruckStore();
    
    return {
    trucks: store.trucks,
    loading: store.trucksLoading,
    error: store.trucksError,
    addTruck: store.addTruck,
    updateTruck: store.updateTruck,
    removeTruck: store.removeTruck,
    getTruckById: store.getTruckById,
    getTrucksByStatus: store.getTrucksByStatus,
    getTrucksByType: store.getTrucksByType
    };
};
