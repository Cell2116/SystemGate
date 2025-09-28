import { create } from 'zustand';
import { getIndonesianDateTime } from '../lib/timezone';

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

    setScanData: (data: string) => void;
    setScanResult: (result: "loading" | "unloading" | null) => void;
    setIsScanning: (scanning: boolean) => void;
    setScanBuffer: (buffer: string) => void;
    clearScan: () => void;
    addToHistory: (scan: ScanData) => void;
    processScan: (data: string) => void;
    updateTruckStatus: (ticketNumber: string) => Promise<void>;
}

export const useScannerStore = create<ScannerState>((set, get) => ({
    scannedData: "",
    scanResult: null,
    lastScanTime: "",
    isScanning: false,
    scanBuffer: "",
    scanHistory: [],
    lastTruckUpdate: null,

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
            if (truck.status === "Waiting") {
                newStatus = "Loading";
                updates.startLoadingTime = currentTimeForDB;
                updates.status = newStatus;
                console.log('🟡 Status change: Waiting → Loading, startloadingtime:', currentTimeForDB);
            } else if (truck.status === "Loading") {
                newStatus = "Finished";
                updates.finishTime = currentTimeForDB;
                updates.status = newStatus;
                
                // Calculate total processing loading time if startLoadingTime exists
                if (truck.startLoadingTime) {
                    try {
                        const startTime = new Date(truck.startLoadingTime);
                        const finishTime = new Date(currentTimeForDB);
                        const diffMs = finishTime.getTime() - startTime.getTime();
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
                
                console.log('🟢 Status change: Loading → Finished, finishTime:', currentTimeForDB);
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

    processScan: (data) => {
        const timestamp = new Date().toLocaleTimeString();
        let result: "loading" | "unloading" | null = null;
        
        console.log('🔍 Processing scan data:', data);
        
        // Check if scanned data is a ticket number (contains CU or SU)
        if (data.includes("CU") || data.includes("SU")) {
            // Determine operation type from ticket
            result = data.includes("CU") ? "loading" : "unloading";
            console.log('🎯 Ticket detected:', data, 'Operation:', result);
            
            // Update truck status for this ticket
            console.log('📡 Calling updateTruckStatus for:', data);
            get().updateTruckStatus(data);
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
    }
}));