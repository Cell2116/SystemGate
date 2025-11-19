import { create } from 'zustand';
import { getIndonesianDateTime } from '../lib/timezone';
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
// export const API_BASE_URL = "http://192.168.4.108:3000";

const generateAvailableActions = (truck: any): string[] => {
    const actions: string[] = [];
    const operation = truck.operation;
    if (operation === "muat") {
        return generateAvailableActionsMuat(truck);
    } else if (operation === "bongkar") {
        return generateAvailableActionsBongkar(truck);
    }
    // Fallback
    return ['Mulai Timbang Gross'];
}
const generateAvailableActionsMuat = (truck: any): string[] => {
    console.log('🔍 Generate Actions Muat for ticket:', truck.noticket);
    console.log('Truck data:', {
        status: truck.status,
        department: truck.department,
        starttimbang: truck.starttimbang,
        finishtimbang: truck.finishtimbang,
        runtohpc: truck.runtohpc,
        runtopt: truck.runtopt,
        entryhpc: truck.entryhpc,
        entrypt: truck.entrypt,
        startloadingtime: truck.startloadingtime,
        finishloadingtime: truck.finishloadingtime,
        starttimbangneto: truck.starttimbangneto,
        finishtimbangneto: truck.finishtimbangneto,
        loading_cycle: truck.loading_cycle
    });

    const hasValue = (field: any) => {
        return field && field !== '' && field !== null && field !== undefined;
    };

    const actions: string[] = [];

    switch (truck.status) {
        case 'timbang':
            console.log('➡️ Status: timbang -> Selesai Timbang Gross');
            // actions.push('Selesai Timbang Gross');
            if (hasValue(truck.starttimbangneto) && !hasValue(truck.startloadingtime)) {
                actions.push('Selesai Timbang Neto');
            } else if (hasValue(truck.starttimbangneto) && !hasValue(truck.finishtimbangneto)) {
                actions.push('Selesai Timbang Neto');
            } else if (hasValue(truck.starttimbang) && !hasValue(truck.finishtimbang)) {
                actions.push('Selesai Timbang Gross');
            } else if ((truck.loading_cycle || 1) > 1) {
                if (hasValue(truck.starttimbang) && !hasValue(truck.startloadingtime)) {
                    actions.push('Selesai Timbang Gross');
                }
            }
            break;

        case 'waiting':
            console.log('➡️ Status: waiting, checking conditions...');
            // === CYCLE > 1 (Multi-cycle) ===
            if ((truck.loading_cycle || 1) > 1) {
                console.log('🔄 Multi-cycle detected, cycle:', truck.loading_cycle);

                if (hasValue(truck.runtopt) && !hasValue(truck.entrypt)) {
                    console.log('✅ Action: Masuk PT');
                    actions.push('Masuk PT');
                    return actions;
                }

                if (hasValue(truck.runtohpc) && !hasValue(truck.entryhpc)) {
                    console.log('✅ Action: Masuk HPC');
                    actions.push('Masuk HPC');
                    return actions;
                }

                if (hasValue(truck.entrypt) || hasValue(truck.entryhpc)) {
                    if (!hasValue(truck.starttimbangneto) || !hasValue(truck.startloadingtime)) {
                        console.log('Action: Mulai Timbang Gross');
                        actions.push('Mulai Timbang Gross');
                        console.log('Action: Memulai Muat/Bongkar');
                        actions.push('Memulai Muat/Bongkar');
                    } else if (!hasValue(truck.finishloadingtime) || !hasValue(truck.finishtimbangneto)) {
                        console.log('Action: Selesai Muat/Bongkar');
                        actions.push('Selesai Muat/Bongkar');
                    } else {
                        console.log('Action: Keluar');
                        actions.push('Keluar');
                    }
                    return actions;
                }
            }

            // === CYCLE 1 (Normal flow) ===
            console.log('Normal cycle (cycle 1)');
            if (truck.finishtimbangneto && !truck.runtohpc && !truck.runtopt) {
                console.log('CRITICAL: finishtimbang has value:', truck.finishtimbang);
                console.log('runtohpc empty:', truck.runtohpc);
                console.log('runtopt empty:', truck.runtopt);
                console.log('Department:', truck.department);

                if (truck.department === 'HPC' || truck.department === 'PBPG') {
                    console.log('✅ Action: Menuju HPC');
                    actions.push('Menuju HPC');
                } else {
                    console.log('⚠️ Department not set, defaulting to Menuju HPC');
                    actions.push('Menuju HPC');
                }
                return actions;
            }

            if (hasValue(truck.starttimbang) && !hasValue(truck.finishtimbang)) {
                console.log('✓ starttimbang has value, finishtimbang empty');
                console.log('✅ Action: Selesai Timbang Gross');
                actions.push('Selesai Timbang Gross');
                return actions;
            }

            if (hasValue(truck.finishloadingtime)) {
                console.log('✓ finishloadingtime has value:', truck.finishloadingtime);
                if (!hasValue(truck.starttimbangneto)) {
                    console.log('✅ Action: Mulai Timbang Neto');
                    actions.push('Mulai Timbang Neto');
                } else if (!hasValue(truck.finishtimbangneto)) {
                    console.log('✅ Action: Selesai Timbang Neto');
                    actions.push('Selesai Timbang Neto');
                } else {
                    console.log('✅ Action: Keluar');
                    actions.push('Keluar');
                }
                return actions;
            }

            if (hasValue(truck.startloadingtime)) {
                console.log('✓ startloadingtime has value:', truck.startloadingtime);
                console.log('✅ Action: Selesai Muat/Bongkar');
                actions.push('Selesai Muat/Bongkar');
                return actions;
            }

            if (hasValue(truck.entryhpc) || hasValue(truck.entrypt)) {
                console.log('✓ entryhpc or entrypt has value');
                console.log('✅ Action: Memulai Muat/Bongkar');
                actions.push('Memulai Muat/Bongkar');
                return actions;
            }

            if (hasValue(truck.runtopt) && !hasValue(truck.entrypt)) {
                console.log('✓ runtopt has value, entrypt empty');
                console.log('✅ Action: Masuk PT');
                actions.push('Masuk PT');
                return actions;
            }

            if (hasValue(truck.runtohpc) && !hasValue(truck.entryhpc)) {
                console.log('✓ runtohpc has value, entryhpc empty');
                console.log('✅ Action: Masuk HPC');
                actions.push('Masuk HPC');
                return actions;
            }
            console.log('❌ No condition matched:');
            console.log('  - finishloadingtime:', truck.finishloadingtime);
            console.log('  - startloadingtime:', hasValue(truck.startloadingtime));
            console.log('  - entryhpc/entrypt:', hasValue(truck.entryhpc) || hasValue(truck.entrypt));
            console.log('  - runtopt:', hasValue(truck.runtopt));
            console.log('  - runtohpc:', hasValue(truck.runtohpc));
            console.log('  - finishtimbang:', hasValue(truck.finishtimbang));
            console.log('  - starttimbang:', truck.starttimbang);

            console.log('Defaulting to Mulai Timbang Neto');
            actions.push('Mulai Timbang Neto');
            break;

        case 'loading':
        case 'unloading':
            console.log('➡️ Status: loading/unloading -> Selesai Muat/Bongkar');
            actions.push('Selesai Muat/Bongkar');
            break;

        case 'weighing_neto':
            console.log('➡️ Status: weighing_neto -> Selesai Timbang Neto');
            actions.push('Selesai Timbang Neto');
            break;

        case 'weighing_neto_finished':
            console.log('➡️ Status: weighing_neto_finished -> Keluar');
            actions.push('Keluar');
            break;

        case 'finished':
            console.log('➡️ Status: finished');
            if (!hasValue(truck.starttimbanggross)) {
                console.log('✅ Action: Mulai Timbang Gross');
                actions.push('Mulai Timbang Gross');
            } else if (!hasValue(truck.finishtimbanggross)) {
                console.log('✅ Action: Selesai Timbang Gross');
                actions.push('Selesai Timbang Gross');
            } else {
                console.log('✅ Action: Keluar');
                actions.push('Keluar');
            }
            break;

        case 'done':
        case 'exit':
            console.log('➡️ Status: done/exit -> No actions');
            break;

        default:
            console.log('⚠️ Unknown status:', truck.status, '-> Mulai Timbang Gross');
            actions.push('Mulai Timbang Gross');
            break;
    }

    console.log('✅ Final generated actions:', actions);
    return actions;
};

const generateAvailableActionsBongkar = (truck: any): string[] => {
    console.log('🔍 Generate Actions Muat for ticket:', truck.noticket);
    console.log('Truck data:', {
        status: truck.status,
        department: truck.department,
        starttimbang: truck.starttimbang,
        finishtimbang: truck.finishtimbang,
        runtohpc: truck.runtohpc,
        runtopt: truck.runtopt,
        entryhpc: truck.entryhpc,
        entrypt: truck.entrypt,
        startloadingtime: truck.startloadingtime,
        finishloadingtime: truck.finishloadingtime,
        starttimbangneto: truck.starttimbangneto,
        finishtimbangneto: truck.finishtimbangneto,
        loading_cycle: truck.loading_cycle
    });

    // Helper function untuk cek apakah field time ada nilai
    const hasValue = (field: any) => {
        return field && field !== '' && field !== null && field !== undefined;
    };

    const actions: string[] = [];

    switch (truck.status) {
        case 'timbang':
            console.log('➡️ Status: timbang -> Selesai Timbang gross');
            if(hasValue(truck.starttimbang) && !hasValue(truck.startloadingtime)){
                actions.push('Selesai Timbang Gross');
            } else if(hasValue(truck.starttimbang) && !hasValue(truck.startloadingtime)){
                actions.push('Selesai Timbang Gross');
            } else if (hasValue(truck.starttimbangneto) && !hasValue(truck.finishtimbangneto)) {
                actions.push('Selesai Timbang Neto');
            } else if ((truck.loading_cycle || 1) > 1){
                if (hasValue(truck.starttimbangneto) && !hasValue(truck.startloadingtime)) {
                    actions.push('Selesai Timbang Neto');
                }
            }
            break;

        case 'waiting':
            console.log('➡️ Status: waiting, checking conditions...');
            // === CYCLE > 1 (Multi-cycle) ===
            if ((truck.loading_cycle || 1) > 1) {
                console.log('🔄 Multi-cycle detected, cycle:', truck.loading_cycle);
                if (hasValue(truck.runtopt) && !hasValue(truck.entrypt)) {
                    console.log('✅ Action: Masuk PT');
                    actions.push('Masuk PT');
                    return actions;
                }

                if (hasValue(truck.runtohpc) && !hasValue(truck.entryhpc)) {
                    console.log('✅ Action: Masuk HPC');
                    actions.push('Masuk HPC');
                    return actions;
                }

                if (hasValue(truck.entrypt) || hasValue(truck.entryhpc)) {
                    if (!hasValue(truck.starttimbangneto) || !hasValue(truck.startloadingtime)) {
                        console.log('Action: Mulai Timbang Neto');
                        actions.push('Mulai Timbang Neto');
                        console.log('Action: Memulai Muat/Bongkar');
                        actions.push('Memulai Muat/Bongkar');
                    } else if (!hasValue(truck.starttimbang) || !hasValue(truck.finishtimbang)) {
                        console.log('Action: Mulai Timbang gross');
                        actions.push('Mulai Timbang Gross');
                        console.log('Action: Memulai Muat/Bongkar');
                        actions.push('Memulai Muat/Bongkar');
                    } else if (!hasValue(truck.finishloadingtime) || !hasValue(truck.finishtimbang)) {
                        console.log('Action: Selesai Muat/Bongkar');
                        actions.push('Selesai Muat/Bongkar');
                    } else {
                        console.log('Action: Keluar');
                        actions.push('Keluar');
                    }
                    return actions;
                }
            }

            // === CYCLE 1 (Normal flow) ===
            console.log('Normal cycle (cycle 1)');
            if (truck.finishtimbang && !truck.runtohpc && !truck.runtopt) {
                console.log('CRITICAL: finishtimbang has value:', truck.finishtimbang);
                console.log('runtohpc empty:', truck.runtohpc);
                console.log('runtopt empty:', truck.runtopt);
                console.log('Department:', truck.department);

                if (truck.department === 'PT') {
                    console.log('✅ Action: Mulai Bongkar');
                    actions.push('Memulai Muat/Bongkar');
                }
                else if (truck.department === 'HPC' || truck.department === 'PBPG') {
                    console.log('✅ Action: Menuju HPC');
                    actions.push('Menuju HPC');
                } else {
                    console.log('⚠️ Department not set, defaulting to Menuju HPC');
                    actions.push('Menuju HPC');
                }
                return actions;
            }

            if (hasValue(truck.starttimbang) && !hasValue(truck.finishtimbang)) {
                console.log('✓ starttimbang has value, finishtimbang empty');
                console.log('✅ Action: Selesai Timbang Gross');
                actions.push('Selesai Timbang Gross');
                return actions;
            }

            if (hasValue(truck.finishloadingtime)) {
                console.log('✓ finishloadingtime has value:', truck.finishloadingtime);
                if (!hasValue(truck.starttimbangneto)) {
                    console.log('✅ Action: Mulai Timbang Neto');
                    actions.push('Mulai Timbang Neto');
                } else if (!hasValue(truck.finishtimbangneto)) {
                    console.log('✅ Action: Selesai Timbang Neto');
                    actions.push('Selesai Timbang Neto');
                } else {
                    console.log('✅ Action: Keluar');
                    actions.push('Keluar');
                }
                return actions;
            }

            if (hasValue(truck.startloadingtime)) {
                console.log('✓ startloadingtime has value:', truck.startloadingtime);
                console.log('✅ Action: Selesai Muat/Bongkar');
                actions.push('Selesai Muat/Bongkar');
                return actions;
            }

            if (hasValue(truck.entryhpc) || hasValue(truck.entrypt)) {
                console.log('✓ entryhpc or entrypt has value');
                console.log('✅ Action: Memulai Muat/Bongkar');
                actions.push('Memulai Muat/Bongkar');
                return actions;
            }

            if (hasValue(truck.runtopt) && !hasValue(truck.entrypt)) {
                console.log('✓ runtopt has value, entrypt empty');
                console.log('✅ Action: Masuk PT');
                actions.push('Masuk PT');
                return actions;
            }

            if (hasValue(truck.runtohpc) && !hasValue(truck.entryhpc)) {
                console.log('✓ runtohpc has value, entryhpc empty');
                console.log('✅ Action: Masuk HPC');
                actions.push('Masuk HPC');
                return actions;
            }
            console.log('❌ No condition matched:');
            console.log('  - finishloadingtime:', truck.finishloadingtime);
            console.log('  - startloadingtime:', hasValue(truck.startloadingtime));
            console.log('  - entryhpc/entrypt:', hasValue(truck.entryhpc) || hasValue(truck.entrypt));
            console.log('  - runtopt:', hasValue(truck.runtopt));
            console.log('  - runtohpc:', hasValue(truck.runtohpc));
            console.log('  - finishtimbang:', hasValue(truck.finishtimbang));
            console.log('  - starttimbang:', truck.starttimbang);

            // Default: Belum mulai apapun
            console.log('⚠️ Defaulting to Mulai Timbang Gross');
            actions.push('Mulai Timbang Gross');
            break;

        case 'loading':
        case 'unloading':
            console.log('➡️ Status: loading/unloading -> Selesai Muat/Bongkar');
            actions.push('Selesai Muat/Bongkar');
            break;

        case 'weighing_neto':
            console.log('➡️ Status: weighing_neto -> Selesai Timbang Neto');
            actions.push('Selesai Timbang Neto');
            break;

        case 'weighing_neto_finished':
            console.log('➡️ Status: weighing_neto_finished -> Mulai Bongkar/Muat');
            actions.push('Mulai Muat/Bongkar');
            break;

        case 'finished':
            console.log('➡️ Status: finished');
            if (!hasValue(truck.starttimbangneto)) {
                console.log('✅ Action: Mulai Timbang Neto');
                actions.push('Mulai Timbang Neto');
            } else if (!hasValue(truck.finishtimbangneto)) {
                console.log('✅ Action: Selesai Timbang Neto');
                actions.push('Selesai Timbang Neto');
            } else {
                console.log('✅ Action: Keluar');
                actions.push('Keluar');
            }
            break;

        case 'done':
        case 'exit':
            console.log('➡️ Status: done/exit -> No actions');
            break;

        default:
            console.log('⚠️ Unknown status:', truck.status, '-> Mulai Timbang Gross');
            actions.push('Mulai Timbang Gross');
            break;
    }

    console.log('✅ Final generated actions:', actions);
    return actions;
};
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
        console.log('🚪 Opening action modal for ticket:', ticket);

        try {
            const { useTruckStore } = await import('./truckStore');
            const truckStoreState = useTruckStore.getState();
            console.log('🔄 Force refreshing trucks data...');
            await truckStoreState.fetchTrucks();

            const updatedState = useTruckStore.getState();
            const currentTruck = updatedState.trucks?.find(truck => truck.noticket === ticket);

            console.log('📋 Current truck found:', {
                ticket,
                found: !!currentTruck,
                status: currentTruck?.status,
                operation: currentTruck?.operation,
                department: currentTruck?.department,
                starttimbang: currentTruck?.starttimbang,
                finishtimbang: currentTruck?.finishtimbang,
                runtohpc: currentTruck?.runtohpc,
                runtopt: currentTruck?.runtopt
            });
            let availableActionsForTruck: string[] = [];

            if (currentTruck) {
                console.log('🎯 Generating actions for truck...');
                availableActionsForTruck = generateAvailableActions(currentTruck);
            } else {
                console.log('⚠️ Truck not found, using default actions');
                availableActionsForTruck = [
                    "Mulai Timbang Gross",
                    "Selesai Timbang Gross",
                    "Menuju HPC",
                    "Masuk HPC",
                    "Memulai Muat/Bongkar",
                    "Selesai Muat/Bongkar",
                    "Keluar"
                ];
            }
            console.log('📝 Final available actions:', availableActionsForTruck);
            set({
                isActionModalOpen: true,
                selectedTicket: ticket,
                availableActions: availableActionsForTruck,
            });
        } catch (error) {
            console.error('Error ensuring trucks data:', error);
            set({
                isActionModalOpen: true,
                selectedTicket: ticket,
                availableActions: [
                    "Mulai Timbang Gross",
                    "Selesai Timbang Gross",
                    "Menuju HPC",
                    "Masuk HPC",
                    "Memulai Muat/Bongkar",
                    "Selesai Muat/Bongkar",
                    "Keluar"
                ],
            });
        }
    },
    closeActionModal: () => set({ isActionModalOpen: false, selectedTicket: null, availableActions: [] }),
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
                        console.error('Error calculating processing time:', timeError);
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
            console.error('Error updating truck status:', error);
            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as any;
                console.error('Error details:', axiosError.response?.data);
                console.error('Error status:', axiosError.response?.status);
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
        console.log('Sending update to backend:', {
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
            console.error('Backend error response:', {
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