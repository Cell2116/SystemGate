import { create } from 'zustand';
import { getIndonesianDateTime } from '../lib/timezone';

// Centralized API base URL
export const API_BASE_URL = "http://192.168.4.108:3000";

interface ScanData {
    data: string;
    result: "loading" | "unloading" | null;
    timestamp: string;
    truckInfo?: {
        plateNumber?: string;
        status?: string;
        operation?: string;
    };
}

interface TruckStatusUpdate {
    ticketNumber: string;
    plateNumber: string;
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
            "Masuk",
            "Mulai Timbang",
            "Selesai Timbang",
            "Menuju HPC",
            "Masuk HPC",
            "Memulai Muat/Bongkar",
            "Selesai Muat/Bongkar",
            "Keluar",
        ];

        const cuActions = [
            "Masuk",
            "Menuju HPC",
            "Masuk HPC",
            "Memulai Muat/Bongkar",
            "Selesai Muat/Bongkar",
            "Keluar",
        ];
        
        console.log('🔍 Opening action modal:', { ticket, type, actions: type === "SU" ? suActions : cuActions });
        
        // Ensure trucks data is loaded
        try {
            const { useTruckStore } = await import('./truckStore');
            const truckStoreState = useTruckStore.getState();
            
            if (!truckStoreState.trucks || truckStoreState.trucks.length === 0) {
                console.log('🔄 No trucks data found, fetching...');
                await truckStoreState.fetchTrucks();
            }
            
            const foundTruck = truckStoreState.trucks?.find((t: any) => t.noticket === ticket);
            console.log('🔍 Truck search result:', { 
                ticket, 
                found: !!foundTruck,
                totalTrucks: truckStoreState.trucks?.length || 0,
                foundTruckDetails: foundTruck ? {
                    id: foundTruck.id,
                    noticket: foundTruck.noticket,
                    plateNumber: foundTruck.plateNumber,
                    status: foundTruck.status
                } : null
            });
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
            console.log('🔍 Attempting to update truck status for ticket:', ticketNumber);
            
            // Import truck store dynamically to avoid circular dependency
            const { useTruckStore } = await import('./truckStore');
            const truckStoreState = useTruckStore.getState();
            
            // Find truck by ticket number
            const truck = truckStoreState.trucks?.find((t: any) => t.noticket === ticketNumber);
            if (!truck) {
                console.log('❌ Truck not found for ticket:', ticketNumber);
                return;
            }

            console.log('✅ Truck found:', { id: truck.id, plate: truck.plateNumber, currentStatus: truck.status });

            // Use Indonesian timezone for all timestamps
            const currentTimeForDB = getIndonesianDateTime(); // Format: YYYY-MM-DD HH:mm:ss
            console.log('🕐 Current Indonesian time for DB:', currentTimeForDB);
            
            let newStatus = truck.status;
            let updates: any = {};

            // Status transition logic with proper timestamp
            if (truck.status === "waiting") {
                newStatus = "loading";
                updates.startLoadingTime = currentTimeForDB;
                updates.status = newStatus;
                console.log('🟡 Status change: Waiting → Loading, startloadingtime:', currentTimeForDB);
            } else if (truck.status === "loading") {
                newStatus = "finished";
                updates.finishloadingtime = currentTimeForDB;
                updates.status = newStatus;
                
                // Calculate total processing loading time if startLoadingTime exists
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
                        console.log('⏱️ Total processing time calculated:', totalTime);
                    } catch (timeError) {
                        console.error('⚠️ Error calculating processing time:', timeError);
                    }
                }
                
                console.log('🟢 Status change: Loading → Finished, finishloadingtime:', currentTimeForDB);
            } else {
                console.log('⚠️ Truck status cannot be updated. Current status:', truck.status);
                return;
            }

            console.log('📤 Sending updates to database:', updates);

            await truckStoreState.updateTruckAPI(truck.id, updates);
            
            // Refresh trucks to get latest data
            await truckStoreState.refreshTrucks();
            
            console.log('✅ Database update successful');            
            const truckUpdate: TruckStatusUpdate = {
                ticketNumber,
                plateNumber: truck.plateNumber,
                newStatus,
                operation: truck.operation,
                timestamp: new Date().toISOString()
            };
            
            set({ lastTruckUpdate: truckUpdate });
            console.log('🎯 Truck status updated successfully:', truckUpdate);
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
        
        console.log('🔍 Processing scan data:', data);
        
        // Check if scanned data is a ticket number (contains CU or SU)
        if (data.includes("CU") || data.includes("SU")) {
            // result = data.includes("CU") ? "loading" : "unloading";
            // console.log('🎯 Ticket detected:', data, 'Operation:', result);            
            // console.log('📡 Calling updateTruckStatus for:', data);
            // get().updateTruckStatus(data);
            const type = data.includes("SU") ? "SU" : "CU";
            await get().openActionModal(data, type);
        } else {
            console.log('Not a ticket number, skipping truck update');
        }
        
        set({ 
            scannedData: data,
            scanResult: result,
            lastScanTime: timestamp,
            isScanning: true,
            scanBuffer: ""
        });
        
        // Add to history with truck info if available
        const historyEntry: ScanData = {
            data,
            result,
            timestamp
        };
        
        get().addToHistory(historyEntry);
        
        setTimeout(() => {
            set({ isScanning: false });
        }, 500);
        
        console.log('✅ Global scan processed:', { data, result, timestamp });
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
        console.log('✅ Truck updated successfully:', result);
        return result;
    }
}));