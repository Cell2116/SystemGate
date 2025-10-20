import { useEffect, useRef, useMemo } from "react";
import { useScannerStore } from "@/store/scannerStore";
import { useTruckStore } from "@/store/truckStore";
import { LogIn, Scale, CheckCircle, Navigation, DoorOpen, PackageOpen, PackageCheck, LogOut } from 'lucide-react';

type StepStatus = 'completed' | 'in-progress' | 'pending';

interface FlowStep {
    icon: any;
    label: string;
    color: string;
    action: string;
}

export default function ActionDialog() {
    const {
        isActionModalOpen,
        selectedTicket,
        availableActions,
        closeActionModal,
        updateTruckAPI,
    } = useScannerStore();
    
    const { trucks } = useTruckStore();
    const dialogRef = useRef<HTMLDialogElement>(null);
    const currentTruck = useMemo(() => {
        if (!selectedTicket || !trucks) return null;
        return trucks.find(truck => truck.noticket === selectedTicket);
    }, [selectedTicket, trucks]);
    const flowSteps: FlowStep[] = useMemo(() => {
        if (!currentTruck) {
            return [
                { icon: LogIn, label: 'Masuk', color: 'bg-blue-500', action: 'Masuk' },
                { icon: Scale, label: 'Mulai Timbang', color: 'bg-green-500', action: 'Mulai Timbang' },
                { icon: CheckCircle, label: 'Selesai Timbang', color: 'bg-emerald-500', action: 'Selesai Timbang' },
                { icon: Navigation, label: 'Menuju HPC', color: 'bg-yellow-500', action: 'Menuju HPC' },
                { icon: DoorOpen, label: 'Masuk HPC', color: 'bg-orange-500', action: 'Masuk HPC' },
                { icon: PackageOpen, label: 'Memulai Muat/Bongkar', color: 'bg-purple-500', action: 'Memulai Muat/Bongkar' },
                { icon: PackageCheck, label: 'Selesai Muat/Bongkar', color: 'bg-pink-500', action: 'Selesai Muat/Bongkar' },
                { icon: LogOut, label: 'Keluar', color: 'bg-red-500', action: 'Keluar' },
            ];
        }
        const { operation, department } = currentTruck;
        const steps = [];
        steps.push({ icon: LogIn, label: 'Masuk', color: 'bg-blue-500', action: 'Masuk' });
        if (operation === 'muat' && (department === 'PT' || department === 'HPC')) {
            steps.push({ icon: Scale, label: 'Mulai Timbang', color: 'bg-green-500', action: 'Mulai Timbang' });
            steps.push({ icon: CheckCircle, label: 'Selesai Timbang', color: 'bg-emerald-500', action: 'Selesai Timbang' });
            steps.push({ icon: Navigation, label: 'Menuju HPC', color: 'bg-yellow-500', action: 'Menuju HPC' });
            steps.push({ icon: DoorOpen, label: 'Masuk HPC', color: 'bg-orange-500', action: 'Masuk HPC' });
        } else {
            steps.push({ icon: Scale, label: 'Mulai Timbang', color: 'bg-green-500', action: 'Mulai Timbang' });
            steps.push({ icon: CheckCircle, label: 'Selesai Timbang', color: 'bg-emerald-500', action: 'Selesai Timbang' });
        }
        if (operation === 'bongkar' && department === 'PT') {
        } else if (operation === 'muat') {
        } else if (operation === 'bongkar' && department === 'HPC') {
            steps.push({ icon: Navigation, label: 'Menuju HPC', color: 'bg-yellow-500', action: 'Menuju HPC' });
            steps.push({ icon: DoorOpen, label: 'Masuk HPC', color: 'bg-orange-500', action: 'Masuk HPC' });
        } else {
            steps.push({ icon: Navigation, label: 'Menuju HPC', color: 'bg-yellow-500', action: 'Menuju HPC' });
            steps.push({ icon: DoorOpen, label: 'Masuk HPC', color: 'bg-orange-500', action: 'Masuk HPC' });
        }
        steps.push({ icon: PackageOpen, label: 'Memulai Muat/Bongkar', color: 'bg-purple-500', action: 'Memulai Muat/Bongkar' });
        steps.push({ icon: PackageCheck, label: 'Selesai Muat/Bongkar', color: 'bg-pink-500', action: 'Selesai Muat/Bongkar' });
        steps.push({ icon: LogOut, label: 'Keluar', color: 'bg-red-500', action: 'Keluar' });
        return steps;
    }, [currentTruck]);
    
    const getStepStatus = (stepAction: string, index: number): StepStatus => {
        if (!currentTruck) {
            const currentStepIndex = flowSteps.findIndex(step =>
                availableActions.includes(step.action)
            );
            
            if (currentStepIndex === -1) return 'pending';
            if (index === currentStepIndex) return 'in-progress';
            if (index < currentStepIndex) return 'completed';
            return 'pending';
        }
        const truckStatus = currentTruck.status;
        const stepActionLower = stepAction.toLowerCase();
        
        // Debug log for Selesai Timbang
        if (stepActionLower.includes('selesai timbang')) {
            console.log('🔍 Debug Selesai Timbang status:', {
                stepAction,
                truckStatus,
                starttimbang: currentTruck.starttimbang,
                finishtimbang: currentTruck.finishtimbang,
                hasStartTimbang: !!currentTruck.starttimbang,
                shouldBeInProgress: !!currentTruck.starttimbang && !currentTruck.finishtimbang
            });
        }
        
        switch (truckStatus) {
            case "waiting":
                if (currentTruck.startloadingtime) {
                    if (stepActionLower.includes('selesai muat/bongkar')) {
                        return 'in-progress';
                    } else if (stepActionLower.includes('keluar')) {
                        return 'pending';
                    } else {
                        return 'completed';
                    }
                } else if (currentTruck.entryhpc) {
                    
                    if (stepActionLower.includes('memulai muat/bongkar')) {
                        return 'in-progress';
                    } else if (stepActionLower.includes('selesai muat/bongkar') || stepActionLower.includes('keluar')) {
                        return 'pending';
                    } else {
                        return 'completed';
                    }
                } else if (currentTruck.runtohpc) {
                    
                    if (stepActionLower.includes('masuk hpc')) {
                        return 'in-progress';
                    } else if (stepActionLower.includes('muat/bongkar') || stepActionLower.includes('keluar')) {
                        return 'pending';
                    } else {
                        return 'completed';
                    }
                } else if (currentTruck.finishtimbang) {
                    
                    if (stepActionLower.includes('menuju hpc')) {
                        return 'in-progress';
                    } else if (stepActionLower.includes('masuk hpc') || stepActionLower.includes('muat/bongkar') || stepActionLower.includes('keluar')) {
                        return 'pending';
                    } else {
                        return 'completed';
                    }
                } else if (currentTruck.starttimbang) {
                    
                    if (stepActionLower.includes('selesai timbang')) {
                        return 'in-progress';
                    } else if (stepActionLower.includes('menuju hpc') || stepActionLower.includes('masuk hpc') || stepActionLower.includes('muat/bongkar') || stepActionLower.includes('keluar')) {
                        return 'pending';
                    } else {
                        return 'completed';
                    }
                } else {
                    
                    if (stepActionLower.includes('masuk') && !stepActionLower.includes('hpc')) {
                        return 'completed';
                    } else if (stepActionLower.includes('mulai timbang')) {
                        return 'in-progress';
                    } else {
                        return 'pending';
                    }
                }
            case "loading":
            case "unloading":
                
                if (stepActionLower.includes('keluar')) {
                    return 'pending';
                } else if (stepActionLower.includes('memulai muat/bongkar')) {
                    return 'completed';
                } else if (stepActionLower.includes('selesai muat/bongkar')) {
                    return 'in-progress';
                } else {
                    return 'completed';
                }
            case "finished":
                if (stepActionLower.includes('keluar')) {
                    return 'pending';
                } else if (stepActionLower.includes('selesai muat/bongkar')) {
                    return 'completed';
                } else if (stepActionLower.includes('selesih')) {
                    return 'in-progress';
                } else {
                    return 'completed';
                }
            case "done":
                
                if (stepActionLower.includes('keluar')) {
                    return 'in-progress';
                } else {
                    return 'completed';
                }
            default:
                return 'pending';
        }
    };
    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        if (isActionModalOpen) {
            if (!dialog.open) dialog.showModal();
        } else {
            if (dialog.open) dialog.close();
        }
    }, [isActionModalOpen]);
    const handleAction = async (action: string) => {
        console.log('🔍 DEBUG handleAction called with:', { 
            action, 
            selectedTicket, 
            currentTruck: currentTruck ? {
                id: currentTruck.id,
                noticket: currentTruck.noticket,
                plateNumber: currentTruck.platenumber,
                status: currentTruck.status,
                operation: currentTruck.operation,
                department: currentTruck.department,
                // Time fields debug
                starttimbang: currentTruck.starttimbang,
                finishtimbang: currentTruck.finishtimbang,
                totalprocesstimbang: currentTruck.totalprocesstimbang,
                runtohpc: currentTruck.runtohpc,
                entryhpc: currentTruck.entryhpc,
                startloadingtime: currentTruck.startloadingtime,
                finishloadingtime: currentTruck.finishloadingtime,
                totalprocessloadingtime: currentTruck.totalprocessloadingtime
            } : null,
            trucksLength: trucks?.length || 0
        });
        if (!currentTruck || !selectedTicket) {
            console.error('❌ Missing data:', { 
                hasCurrentTruck: !!currentTruck, 
                selectedTicket,
                trucksAvailable: trucks?.length || 0,
                trucks: trucks?.map(t => ({ id: t.id, noticket: t.noticket, plateNumber: t.platenumber })) || []
            });
            closeActionModal();
            return;
        }
        
        if (!currentTruck.id || isNaN(Number(currentTruck.id))) {
            console.error('❌ Invalid truck ID:', currentTruck.id);
            alert('Error: Invalid truck ID');
            closeActionModal();
            return;
        }
        try {
            // Use Indonesian time consistently
            const { getIndonesianTime } = await import('@/lib/timezone');
            const currentTimeOnly = getIndonesianTime();
            
            const formatTimeForSQL = (timeString: string) => {
                const parts = timeString.split(':');
                if (parts.length === 3) {
                    const hours = parts[0].padStart(2, '0');
                    const minutes = parts[1].padStart(2, '0');
                    const seconds = parts[2].padStart(2, '0');
                    return `${hours}:${minutes}:${seconds}`;
                }
                return timeString;
            };
            
            const sqlTimeFormat = formatTimeForSQL(currentTimeOnly);
            console.log('🕒 Time format debug:', {
                currentTimeOnly,
                sqlTimeFormat,
                action
            });
            let updateData: any = {};
            switch (action) {
                case 'Mulai Timbang':
                    updateData = {
                        starttimbang: sqlTimeFormat,
                        status: 'timbang'
                    };
                    console.log('📤 Sending update data:', updateData);
                    break;
                case 'Selesai Timbang':
                    console.log('🔍 Current truck starttimbang:', currentTruck.starttimbang);
                    
                    if (currentTruck.starttimbang) {
                        try {
                            // Validate starttimbang format
                            const startTimeStr = currentTruck.starttimbang.toString().trim();
                            console.log('🔍 Processing starttimbang:', startTimeStr);
                            
                            // Create date objects for calculation
                            const startTime = new Date(`1970-01-01T${startTimeStr}`);
                            const endTime = new Date(`1970-01-01T${sqlTimeFormat}`);
                            
                            console.log('🔍 Start time object:', startTime);
                            console.log('🔍 End time object:', endTime);
                            
                            // Check if dates are valid
                            if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
                                throw new Error(`Invalid time format: start=${startTimeStr}, end=${sqlTimeFormat}`);
                            }
                            
                            const diffMs = endTime.getTime() - startTime.getTime();
                            console.log('🔍 Diff in ms:', diffMs);
                            
                            if (diffMs < 0) {
                                throw new Error('End time cannot be before start time');
                            }
                            
                            // Convert milliseconds to HH:mm:ss format
                            const totalSeconds = Math.floor(diffMs / 1000);
                            const hours = Math.floor(totalSeconds / 3600);
                            const minutes = Math.floor((totalSeconds % 3600) / 60);
                            const seconds = totalSeconds % 60;
                            
                            const waitingTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                            console.log('🔍 Calculated waiting time:', waitingTime);
                            
                            updateData = {
                                finishtimbang: sqlTimeFormat,
                                totalprocesstimbang: waitingTime,
                                status: 'waiting'
                            };
                            
                        } catch (error) {
                            console.error('❌ Error calculating time difference:', error);
                            // Fallback: just set finish time without calculation
                            updateData = {
                                finishtimbang: sqlTimeFormat,
                                status: 'waiting'
                            };
                        }
                    } else {
                        updateData = {
                            finishtimbang: sqlTimeFormat,
                            status: 'waiting'
                        };
                    }
                    console.log('📤 Sending update data:', updateData);
                    break;
                case 'Menuju HPC':
                    updateData = {
                        runtohpc: sqlTimeFormat,
                        status: 'waiting'
                    };
                    
                    break;
                case 'Masuk HPC':
                    console.log('🔍 Current truck runtohpc:', currentTruck.runtohpc);
                    
                    if (currentTruck.runtohpc) {
                        try {
                            const runTimeStr = currentTruck.runtohpc.toString().trim();
                            console.log('🔍 Processing runtohpc:', runTimeStr);
                            
                            const runTime = new Date(`1970-01-01T${runTimeStr}`);
                            const entryTime = new Date(`1970-01-01T${sqlTimeFormat}`);
                            
                            console.log('🔍 Run time object:', runTime);
                            console.log('🔍 Entry time object:', entryTime);
                            
                            if (isNaN(runTime.getTime()) || isNaN(entryTime.getTime())) {
                                throw new Error(`Invalid time format: run=${runTimeStr}, entry=${sqlTimeFormat}`);
                            }
                            
                            const diffMs = entryTime.getTime() - runTime.getTime();
                            console.log('🔍 Diff in ms:', diffMs);
                            
                            if (diffMs < 0) {
                                throw new Error('Entry time cannot be before run time');
                            }
                            
                            const totalSeconds = Math.floor(diffMs / 1000);
                            const hours = Math.floor(totalSeconds / 3600);
                            const minutes = Math.floor((totalSeconds % 3600) / 60);
                            const seconds = totalSeconds % 60;
                            
                            const waitingForArrival = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                            console.log('🔍 Calculated waiting for arrival:', waitingForArrival);
                            
                            updateData = {
                                entryhpc: sqlTimeFormat,
                                waitingforarrivalhpc: waitingForArrival,
                                status: 'waiting'
                            };
                            
                        } catch (error) {
                            console.error('❌ Error calculating arrival time difference:', error);
                            updateData = {
                                entryhpc: sqlTimeFormat,
                                status: 'waiting'
                            };
                        }
                    } else {
                        updateData = {
                            entryhpc: sqlTimeFormat,
                            status: 'waiting'
                        };
                    }
                    console.log('📤 Sending update data:', updateData);
                    break;
                case 'Memulai Muat/Bongkar':
                    console.log('🔍 Current truck entryhpc:', currentTruck.entryhpc);
                    
                    let additionalData = {};
                    if (currentTruck.entryhpc) {
                        try {
                            const entryTimeStr = currentTruck.entryhpc.toString().trim();
                            console.log('🔍 Processing entryhpc:', entryTimeStr);
                            
                            const entryTime = new Date(`1970-01-01T${entryTimeStr}`);
                            const startLoadingTime = new Date(`1970-01-01T${sqlTimeFormat}`);
                            
                            console.log('🔍 Entry time object:', entryTime);
                            console.log('🔍 Start loading time object:', startLoadingTime);
                            
                            if (isNaN(entryTime.getTime()) || isNaN(startLoadingTime.getTime())) {
                                throw new Error(`Invalid time format: entry=${entryTimeStr}, startLoading=${sqlTimeFormat}`);
                            }
                            
                            const diffMs = startLoadingTime.getTime() - entryTime.getTime();
                            console.log('🔍 Diff in ms:', diffMs);
                            
                            if (diffMs < 0) {
                                throw new Error('Start loading time cannot be before entry time');
                            }
                            
                            const totalSeconds = Math.floor(diffMs / 1000);
                            const hours = Math.floor(totalSeconds / 3600);
                            const minutes = Math.floor((totalSeconds % 3600) / 60);
                            const seconds = totalSeconds % 60;
                            
                            const actualWaitTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                            console.log('🔍 Calculated actual wait time:', actualWaitTime);
                            
                            additionalData = {
                                actualwaitloadingtime: actualWaitTime
                            };
                            
                        } catch (error) {
                            console.error('❌ Error calculating loading wait time difference:', error);
                            additionalData = {};
                        }
                    }
                    
                    updateData = {
                        startloadingtime: sqlTimeFormat,
                        status: currentTruck.operation === 'muat' ? 'loading' : 'unloading',
                        ...additionalData
                    };
                    console.log('📤 Sending update data:', updateData);
                    break;
                case 'Selesai Muat/Bongkar':
                    console.log('🔍 Current truck startloadingtime:', currentTruck.startloadingtime);
                    
                    if (currentTruck.startloadingtime) {
                        try {
                            const startTimeStr = currentTruck.startloadingtime.toString().trim();
                            console.log('🔍 Processing startloadingtime:', startTimeStr);
                            
                            const startTime = new Date(`1970-01-01T${startTimeStr}`);
                            const endTime = new Date(`1970-01-01T${sqlTimeFormat}`);
                            
                            console.log('🔍 Start loading time object:', startTime);
                            console.log('🔍 End loading time object:', endTime);
                            
                            if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
                                throw new Error(`Invalid time format: start=${startTimeStr}, end=${sqlTimeFormat}`);
                            }
                            
                            const diffMs = endTime.getTime() - startTime.getTime();
                            console.log('🔍 Diff in ms:', diffMs);
                            
                            if (diffMs < 0) {
                                throw new Error('End loading time cannot be before start loading time');
                            }
                            
                            const totalSeconds = Math.floor(diffMs / 1000);
                            const hours = Math.floor(totalSeconds / 3600);
                            const minutes = Math.floor((totalSeconds % 3600) / 60);
                            const seconds = totalSeconds % 60;
                            
                            const totalProcessTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                            console.log('🔍 Calculated total process time:', totalProcessTime);
                            
                            updateData = {
                                finishloadingtime: sqlTimeFormat,
                                totalprocessloadingtime: totalProcessTime,
                                status: 'finished'
                            };
                            
                        } catch (error) {
                            console.error('❌ Error calculating loading process time difference:', error);
                            updateData = {
                                finishloadingtime: sqlTimeFormat,
                                status: 'finished'
                            };
                        }
                    } else {
                        updateData = {
                            finishloadingtime: sqlTimeFormat,
                            status: 'finished'
                        };
                    }
                    console.log('📤 Sending update data:', updateData);
                    break;
                case 'Keluar':
                    updateData = {
                        exittime: sqlTimeFormat,
                        status: 'done'
                    };
                    
                    break;
                default:
                    
                    closeActionModal();
                    return;
            }
            
            console.log('📡 Updating truck via scannerStore:', { 
                truckId: currentTruck.id,
                updateData
            });
            const updatedTruck = await updateTruckAPI(Number(currentTruck.id), updateData);
            
            // Refresh truck data
            const { useTruckStore } = await import('@/store/truckStore');
            const { fetchTrucks } = useTruckStore.getState();
            await fetchTrucks();
            
            // Debug: Log the updated truck data
            const updatedTruckState = useTruckStore.getState();
            const refreshedTruck = updatedTruckState.trucks?.find(t => t.id === currentTruck.id);
            console.log('🔍 Truck data after refresh:', {
                original: currentTruck,
                refreshed: refreshedTruck,
                starttimbang: refreshedTruck?.starttimbang,
                finishtimbang: refreshedTruck?.finishtimbang,
                totalprocesstimbang: refreshedTruck?.totalprocesstimbang
            });
        } catch (error) {
            console.error('❌ Error updating truck:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            alert(`Error updating truck: ${errorMessage}`);
        } finally {
            closeActionModal();
        }
    };
    return (
        <dialog
            ref={dialogRef}
            className="rounded-2xl shadow-2xl p-4 sm:p-6 w-[95vw] sm:w-[90vw] md:w-[85vw] lg:w-[80vw] xl:w-[75vw] max-w-6xl backdrop:bg-black/50 open:animate-fadeIn"
        >
            <div className="mb-4">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 text-center">
                    Pilih Aksi untuk Tiket {selectedTicket}
                </h2>
                {currentTruck && (
                    <div className="text-center text-sm text-gray-600 mt-2 space-y-1">
                        <span className="inline-flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
                            <span className="font-medium">{currentTruck.platenumber}</span>
                            <span className="text-gray-400">•</span>
                            <span className="capitalize">{currentTruck.operation}</span>
                            <span className="text-gray-400">•</span>
                            <span className="font-medium">{currentTruck.department}</span>
                        </span>
                        <div className="text-xs">
                            <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                                Status: <span className="font-medium capitalize">{currentTruck.status}</span>
                            </span>
                        </div>
                    </div>
                )}
            </div>
            {/* Main Content Layout - Flow diagram on left, Action buttons on right */}
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Flow Diagram */}
                <div className="lg:w-2/3 bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 rounded-xl">
                    <div className="relative flex flex-wrap justify-center items-start gap-2 sm:gap-3 md:gap-4">
                        {flowSteps.map((step, index) => {
                            const Icon = step.icon;
                            const isLastInRow = (index + 1) % 4 === 0;
                            const isLast = index === flowSteps.length - 1;
                            const status = getStepStatus(step.action, index);
                            const cardColor = status === 'pending'
                                ? 'bg-gray-300'
                                : step.color;
                            const iconColor = status === 'pending'
                                ? 'text-gray-400'
                                : 'text-white';
                            const pulseClass = status === 'in-progress'
                                ? 'animate-pulse ring-2 ring-blue-400 ring-opacity-50'
                                : '';
                            return (
                                <div key={index} className="contents">
                                    {/* Step Card */}
                                    <div className="flex flex-col items-center relative z-10">
                                        <div className={`${cardColor} ${pulseClass} rounded-lg sm:rounded-xl p-2 sm:p-3 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105`}>
                                            <Icon className={`w-4 h-4 sm:w-6 sm:h-6 md:w-8 md:h-8 ${iconColor}`} strokeWidth={2} />
                                        </div>
                                        <p className="mt-1 text-xs font-semibold text-slate-700 text-center max-w-[60px] sm:max-w-[80px]">
                                            {step.label}
                                        </p>
                                        {status === 'in-progress' && (
                                            <span className="mt-1 text-xs text-blue-600 font-medium">Aktif</span>
                                        )}
                                        {status === 'completed' && (
                                            <span className="mt-1 text-xs text-green-600 font-medium">✓ Selesai</span>
                                        )}
                                    </div>
                                    {/* Arrow Lines */}
                                    {!isLast && (
                                        <>
                                            {/* Horizontal arrow for same row */}
                                            {!isLastInRow && (
                                                <div className="flex items-center mt-4 sm:mt-6">
                                                    <div className={`arrow-line horizontal ${status === 'completed' ? 'completed' : 'pending'}`}></div>
                                                </div>
                                            )}
                                            {/* Vertical arrow for row transition */}
                                            {isLastInRow && (
                                                <div className="w-full flex justify-center relative" style={{ order: index + 0.5 }}>
                                                    <div className={`arrow-line vertical ${status === 'completed' ? 'completed' : 'pending'}`}></div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
                {/* Action Buttons */}
                <div className="lg:w-1/3 flex flex-col gap-3 sm:gap-4 mb-4">
                    <div className="flex-1 space-y-2">
                        <p className="font-semibold text-gray-700 mb-2">Aksi Tersedia:</p>
                        {availableActions.length > 0 ? (
                            availableActions.map((action) => (
                                <button
                                    key={action}
                                    onClick={() => handleAction(action)}
                                    className="w-full bg-blue-500 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition"
                                >
                                    {action}
                                </button>
                            ))
                        ) : (
                            <p className="text-gray-500 text-sm">Tidak ada aksi tersedia</p>
                        )}
                    </div>
                </div>
            </div>
            <form method="dialog">
                <button
                    onClick={closeActionModal}
                    className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium"
                >
                    Batal
                </button>
            </form>
            <style>{`
                .arrow-line {
                    position: relative;
                    transition: background 0.3s ease;
                }
                .arrow-line.completed {
                    background: linear-gradient(to right, #3b82f6, #8b5cf6);
                }
                .arrow-line.pending {
                    background: #d1d5db;
                }
                .arrow-line.horizontal {
                    width: 20px;
                    height: 2px;
                    border-radius: 1px;
                }
                @media (min-width: 640px) {
                    .arrow-line.horizontal {
                        width: 25px;
                        height: 2px;
                    }
                }
                @media (min-width: 768px) {
                    .arrow-line.horizontal {
                        width: 30px;
                        height: 3px;
                    }
                }
                @media (min-width: 1024px) {
                    .arrow-line.horizontal {
                        width: 35px;
                        height: 3px;
                    }
                }
                .arrow-line.horizontal::after {
                    content: '';
                    position: absolute;
                    right: -6px;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 0;
                    height: 0;
                    border-top: 4px solid transparent;
                    border-bottom: 4px solid transparent;
                    transition: border-left-color 0.3s ease;
                }
                @media (min-width: 768px) {
                    .arrow-line.horizontal::after {
                        right: -8px;
                        border-top: 6px solid transparent;
                        border-bottom: 6px solid transparent;
                        border-left: 10px solid;
                    }
                }
                .arrow-line.horizontal.completed::after {
                    border-left: 8px solid #8b5cf6;
                }
                .arrow-line.horizontal.pending::after {
                    border-left: 8px solid #d1d5db;
                }
                .arrow-line.vertical {
                    width: 2px;
                    height: 30px;
                    border-radius: 1px;
                    margin: 4px 0;
                }
                @media (min-width: 640px) {
                    .arrow-line.vertical {
                        width: 2px;
                        height: 35px;
                        margin: 6px 0;
                    }
                }
                @media (min-width: 768px) {
                    .arrow-line.vertical {
                        width: 3px;
                        height: 40px;
                        margin: 8px 0;
                    }
                }
                .arrow-line.vertical::after {
                    content: '';
                    position: absolute;
                    bottom: -6px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 0;
                    height: 0;
                    border-left: 4px solid transparent;
                    border-right: 4px solid transparent;
                    transition: border-top-color 0.3s ease;
                }
                @media (min-width: 768px) {
                    .arrow-line.vertical::after {
                        bottom: -8px;
                        border-left: 6px solid transparent;
                        border-right: 6px solid transparent;
                        border-top: 10px solid;
                    }
                }
                .arrow-line.vertical.completed::after {
                    border-top: 8px solid #8b5cf6;
                }
                .arrow-line.vertical.pending::after {
                    border-top: 8px solid #d1d5db;
                }
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
                .open\:animate-fadeIn[open] {
                    animation: fadeIn 0.2s ease-out;
                }
            `}</style>
        </dialog>
    );
}