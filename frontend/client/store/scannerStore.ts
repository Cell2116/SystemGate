import { create } from 'zustand';
import { getIndonesianDateTime } from '../lib/timezone';
export const API_BASE_URL = "http://192.168.4.108:3000";

interface ScanData {
    data: string;
    result: "loading" | "unloading" | null;
    timestamp: string;
    truckInfo?: {
        platenumber?: string;
        status?: string;
        operation?: string;
    };
}

interface TruckStatusUpdate {
    ticketNumber: string;
    platenumber: string;
    newStatus: string;
    operation: string;
    timestamp: string;
}

interface ScannerState {
    scannedData: string;
    scanResult: "loading" | "unloading" | null;
    lastScanTime: string;
    isScanning: boolean;
    scanBuffer: string;
    scanHistory: ScanData[];
    lastTruckUpdate: TruckStatusUpdate | null;
    isActionModalOpen: boolean;
    selectedTicket: string | null;
    availableActions: string[];
    
    openActionModal: (ticket: string, type: "SU" | "CU") => Promise<void>
    closeActionModal: () => void;
    setScanData: (data: string) => void;
    setScanResult: (result: "loading" | "unloading" | null) => void;
    setIsScanning: (scanning: boolean) => void;
    setScanBuffer: (buffer: string) => void;
    clearScan: () => void;
    addToHistory: (scan: ScanData) => void;
    processScan: (data: string) => Promise<void>;
    updateTruckStatus: (ticketNumber: string) => Promise<void>;
    updateTruckAPI: (truckId: number, updateData: any) => Promise<any>;
}

export const useScannerStore = create<ScannerState>((set, get) => ({
    scannedData: "",
    scanResult: null,
    lastScanTime: "",
    isScanning: false,
    scanBuffer: "",
    scanHistory: [],
    lastTruckUpdate: null,
    isActionModalOpen: false,
    selectedTicket: null,
    availableActions: [],
    
    openActionModal: async (ticket, type) => {
        const suActions = [
            // "Masuk",
            "Mulai Timbang",
            "Selesai Timbang",
            "Menuju HPC",
            "Masuk HPC",
            "Memulai Muat/Bongkar",
            "Selesai Muat/Bongkar",
            "Keluar",
        ];
        const cuActions = [
            // "Masuk",
            "Mulai Timbang",
            "Selesai Timbang",
            "Menuju HPC",
            "Masuk HPC",
            "Memulai Muat/Bongkar",
            "Selesai Muat/Bongkar",
            "Keluar",
        ];
        try {
            const { useTruckStore } = await import('./truckStore');
            const truckStoreState = useTruckStore.getState();
            
            console.log('🔍 Initial trucks state:', {
                hasTrucks: !!truckStoreState.trucks,
                trucksLength: truckStoreState.trucks?.length || 0,
                trucksType: typeof truckStoreState.trucks
            });
            
            if (!truckStoreState.trucks || truckStoreState.trucks.length === 0) {
                console.log('📡 Fetching trucks data...');
                await truckStoreState.fetchTrucks();
                const updatedState = useTruckStore.getState();
                // console.log('📡 After fetchTrucks:', {
                //     hasTrucks: !!updatedState.trucks,
                //     trucksLength: updatedState.trucks?.length || 0,
                //     trucksType: typeof updatedState.trucks,
                //     firstTruck: updatedState.trucks?.[0] || null
                // });
            }            
            const finalTruckState = useTruckStore.getState();
            // console.log('🔍 Debug before search:', {
            //     ticket: ticket,
            //     ticketType: typeof ticket,
            //     ticketLength: ticket?.length,
            //     totalTrucks: finalTruckState.trucks?.length || 0,
            //     sampleTrucks: finalTruckState.trucks?.slice(0, 3).map(t => ({
            //         id: t.id,
            //         noticket: t.noticket,
            //         noticketType: typeof t.noticket,
            //         exactMatch: t.noticket === ticket,
            //         stringMatch: String(t.noticket).trim() === String(ticket).trim()
            //     })),
            //     allNotickets: finalTruckState.trucks?.map(t => t.noticket)
            // });
            
            const foundTruck = finalTruckState.trucks?.find((t: any) =>
                String(t.noticket).trim() === String(ticket).trim()
            );
            // console.log(foundTruck)
            // console.log('🔍 Truck search result:', { 
            //     ticket, 
            //     found: !!foundTruck,
            //     totalTrucks: truckStoreState.trucks?.length || 0,
            //     foundTruckDetails: foundTruck ? {
            //         id: foundTruck.id,
            //         noticket: foundTruck.noticket,
            //         platenumber: foundTruck.platenumber,
            //         status: foundTruck.status
            //     } : null
            // });
        } catch (error) {
            console.error('❌ Error ensuring trucks data:', error);
        }
        
        set({
            isActionModalOpen: true,
            selectedTicket: ticket,
            availableActions: type === "SU" ? suActions : cuActions,
        });
    },
    closeActionModal: () => set({ isActionModalOpen: false, selectedTicket: null, availableActions: []}),
    setScanData: (data) => set({ scannedData: data }),
    setScanResult: (result) => set({ scanResult: result }),
    setIsScanning: (scanning) => set({ isScanning: scanning }),
    setScanBuffer: (buffer) => set({ scanBuffer: buffer }), 
    clearScan: () => set({ 
        scannedData: "", 
        scanResult: null, 
        lastScanTime: "", 
        isScanning: false,
        scanBuffer: "",
        lastTruckUpdate: null
    }),
    addToHistory: (scan) => set((state) => ({
        scanHistory: [scan, ...state.scanHistory.slice(0, 9)] 
    })),
    updateTruckStatus: async (ticketNumber: string) => {
        try {
            const { useTruckStore } = await import('./truckStore');
            const truckStoreState = useTruckStore.getState();
            const truck = truckStoreState.trucks?.find((t: any) => t.noticket === ticketNumber);
            if (!truck) {
                return;
            }
            
            const currentTimeForDB = getIndonesianDateTime();
            let newStatus = truck.status;
            let updates: any = {};
            if (truck.status === "waiting") {
                newStatus = "loading";
                updates.startLoadingTime = currentTimeForDB;
                updates.status = newStatus;
                
            } else if (truck.status === "loading") {
                newStatus = "finished";
                updates.finishloadingtime = currentTimeForDB;
                updates.status = newStatus;
                
                if (truck.startloadingtime) {
                    try {
                        const startTime = new Date(truck.startloadingtime);
                        const finishloadingtime = new Date(currentTimeForDB);
                        const diffMs = finishloadingtime.getTime() - startTime.getTime();
                        const diffMinutes = Math.floor(diffMs / (1000 * 60));
                        const hours = Math.floor(diffMinutes / 60);
                        const minutes = diffMinutes % 60;
                        const totalTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
                        updates.totalProcessLoadingTime = totalTime;
                        
                    } catch (timeError) {
                        console.error('⚠️ Error calculating processing time:', timeError);
                    }
                }
            } else {
                
                return;
            }
            await truckStoreState.updateTruckAPI(truck.id, updates);            
            await truckStoreState.refreshTrucks();
            const truckUpdate: TruckStatusUpdate = {
                ticketNumber,
                platenumber: truck.platenumber,
                newStatus,
                operation: truck.operation,
                timestamp: new Date().toISOString()
            };
            
            set({ lastTruckUpdate: truckUpdate });
            
        } catch (error) {
            console.error('💥 Error updating truck status:', error);
            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as any;
                console.error('💥 Error details:', axiosError.response?.data);
                console.error('💥 Error status:', axiosError.response?.status);
            }
        }
    },
    processScan: async (data) => {
        const timestamp = new Date().toLocaleTimeString();
        let result: "loading" | "unloading" | null = null;
        
        if (data.includes("CU") || data.includes("SU")) {
            const type = data.includes("SU") ? "SU" : "CU";
            await get().openActionModal(data, type);
        } else {
            
        }
        set({ 
            scannedData: data,
            scanResult: result,
            lastScanTime: timestamp,
            isScanning: true,
            scanBuffer: ""
        });
        
        const historyEntry: ScanData = {
            data,
            result,
            timestamp
        };
        get().addToHistory(historyEntry);
        setTimeout(() => {
            set({ isScanning: false });
        }, 500);
        
        
    },
    updateTruckAPI: async (truckId: number, updateData: any) => {
        console.log('📡 Sending update to backend:', { 
            truckId,
            updateData,
            url: `${API_BASE_URL}/api/trucks/${truckId}`
        });
        
        const response = await fetch(`${API_BASE_URL}/api/trucks/${truckId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData)
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Backend error response:', {
                status: response.status,
                statusText: response.statusText,
                errorText
            });
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }
        const result = await response.json();
        
        return result;
    }
}));