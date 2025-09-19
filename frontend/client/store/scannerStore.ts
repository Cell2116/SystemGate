import { create } from 'zustand';

interface ScanData {
    data: string;
    result: "loading" | "unloading" | null;
    timestamp: string;
}

interface ScannerState {
    // Current scan data
    scannedData: string;
    scanResult: "loading" | "unloading" | null;
    lastScanTime: string;
    isScanning: boolean;
    scanBuffer: string;
    
    // Scan history
    scanHistory: ScanData[];
    
    // Actions
    setScanData: (data: string) => void;
    setScanResult: (result: "loading" | "unloading" | null) => void;
    setIsScanning: (scanning: boolean) => void;
    setScanBuffer: (buffer: string) => void;
    clearScan: () => void;
    addToHistory: (scan: ScanData) => void;
    
    // Global scanner processing
    processScan: (data: string) => void;
}

export const useScannerStore = create<ScannerState>((set, get) => ({
    // Initial state
    scannedData: "",
    scanResult: null,
    lastScanTime: "",
    isScanning: false,
    scanBuffer: "",
    scanHistory: [],
    
    // Actions
    setScanData: (data) => set({ scannedData: data }),
    setScanResult: (result) => set({ scanResult: result }),
    setIsScanning: (scanning) => set({ isScanning: scanning }),
    setScanBuffer: (buffer) => set({ scanBuffer: buffer }),
    
    clearScan: () => set({ 
        scannedData: "", 
        scanResult: null, 
        lastScanTime: "", 
        isScanning: false,
        scanBuffer: ""
    }),
    
    addToHistory: (scan) => set((state) => ({
        scanHistory: [scan, ...state.scanHistory.slice(0, 9)] // Keep last 10 scans
    })),
    
    // Main scan processing function
    processScan: (data) => {
        const timestamp = new Date().toLocaleTimeString();
        let result: "loading" | "unloading" | null = null;
        
        // Process the scanned data
        if (data.includes("SU")) {
            result = "unloading";
        } else if (data.includes("CU")) {
            result = "loading";
        }
        
        // Update current scan state
        set({ 
            scannedData: data,
            scanResult: result,
            lastScanTime: timestamp,
            isScanning: true,
            scanBuffer: ""
        });
        
        // Add to history
        get().addToHistory({
            data,
            result,
            timestamp
        });
        
        // Show visual feedback for 500ms
        setTimeout(() => {
            set({ isScanning: false });
        }, 500);
        
        console.log('Global scan processed:', { data, result, timestamp });
    }
}));