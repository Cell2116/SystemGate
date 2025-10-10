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

    // Determine step status based on truck's actual status
    const getStepStatus = (stepAction: string, index: number): StepStatus => {
        if (!currentTruck) {
            // Fallback to available actions if no truck data
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

        // Map truck status to determine which step is currently active
        switch (truckStatus) {
            case "waiting":
                // Determine which waiting stage based on available data
                if (currentTruck.startloadingtime) {
                    // Has started loading, so waiting for completion
                    if (stepActionLower.includes('selesai muat/bongkar')) {
                        return 'in-progress';
                    } else if (stepActionLower.includes('keluar')) {
                        return 'pending';
                    } else {
                        return 'completed';
                    }
                } else if (currentTruck.entryhpc) {
                    // Has entered HPC, waiting to start loading
                    if (stepActionLower.includes('memulai muat/bongkar')) {
                        return 'in-progress';
                    } else if (stepActionLower.includes('selesai muat/bongkar') || stepActionLower.includes('keluar')) {
                        return 'pending';
                    } else {
                        return 'completed';
                    }
                } else if (currentTruck.runtohpc) {
                    // Heading to HPC, waiting to enter
                    if (stepActionLower.includes('masuk hpc')) {
                        return 'in-progress';
                    } else if (stepActionLower.includes('muat/bongkar') || stepActionLower.includes('keluar')) {
                        return 'pending';
                    } else {
                        return 'completed';
                    }
                } else if (currentTruck.finishtimbang) {
                    // Finished weighing, waiting for next step
                    if (stepActionLower.includes('menuju hpc')) {
                        return 'in-progress';
                    } else if (stepActionLower.includes('masuk hpc') || stepActionLower.includes('muat/bongkar') || stepActionLower.includes('keluar')) {
                        return 'pending';
                    } else {
                        return 'completed';
                    }
                } else if (currentTruck.starttimbang) {
                    // Started weighing, waiting to finish
                    if (stepActionLower.includes('selesai timbang')) {
                        return 'in-progress';
                    } else if (stepActionLower.includes('menuju hpc') || stepActionLower.includes('masuk hpc') || stepActionLower.includes('muat/bongkar') || stepActionLower.includes('keluar')) {
                        return 'pending';
                    } else {
                        return 'completed';
                    }
                } else {
                    // Just entered, waiting to start weighing or other process
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
                // Truck is loading/unloading
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
            case "done":
                // All steps completed except exit
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
                plateNumber: currentTruck.plateNumber,
                status: currentTruck.status,
                operation: currentTruck.operation,
                department: currentTruck.department
            } : null,
            trucksLength: trucks?.length || 0
        });

        if (!currentTruck || !selectedTicket) {
            console.error('❌ Missing data:', { 
                hasCurrentTruck: !!currentTruck, 
                selectedTicket,
                trucksAvailable: trucks?.length || 0,
                trucks: trucks?.map(t => ({ id: t.id, noticket: t.noticket, plateNumber: t.plateNumber })) || []
            });
            closeActionModal();
            return;
        }

        // Validate truck ID
        if (!currentTruck.id || isNaN(Number(currentTruck.id))) {
            console.error('❌ Invalid truck ID:', currentTruck.id);
            alert('Error: Invalid truck ID');
            closeActionModal();
            return;
        }

        try {
            console.log(`🔄 Processing action: ${action} for ticket: ${selectedTicket}`);
            
            const currentTime = new Date();
            const currentTimeOnly = currentTime.toTimeString().split(' ')[0]; // HH:MM:SS format
            
            // Ensure time is in proper HH:MM:SS format for SQL Server
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
            console.log('🕐 Time formats:', { currentTimeOnly, sqlTimeFormat });
            
            let updateData: any = {};

            switch (action) {
                case 'Mulai Timbang':
                    updateData = {
                        starttimbang: sqlTimeFormat,
                        status: 'waiting'
                    };
                    console.log('📊 Starting weighing process');
                    break;

                case 'Selesai Timbang':
                    // Calculate waitingfortimbang if starttimbang exists
                    if (currentTruck.starttimbang) {
                        const startTime = new Date(`1970-01-01T${currentTruck.starttimbang}Z`);
                        const endTime = new Date(`1970-01-01T${sqlTimeFormat}Z`);
                        const diffMs = endTime.getTime() - startTime.getTime();
                        const waitingTime = new Date(diffMs).toISOString().substr(11, 8);
                        
                        updateData = {
                            finishtimbang: sqlTimeFormat,
                            waitingfortimbang: waitingTime,
                            status: 'waiting'
                        };
                        console.log('✅ Finished weighing process, calculated waiting time:', waitingTime);
                    } else {
                        updateData = {
                            finishtimbang: sqlTimeFormat,
                            status: 'waiting'
                        };
                        console.log('⚠️ No start time found for weighing');
                    }
                    break;

                case 'Menuju HPC':
                    updateData = {
                        runtohpc: sqlTimeFormat,
                        status: 'waiting'
                    };
                    console.log('🚚 Truck heading to HPC');
                    break;

                case 'Masuk HPC':
                    // Calculate waitingforarrivalhpc if runtohpc exists
                    if (currentTruck.runtohpc) {
                        const runTime = new Date(`1970-01-01T${currentTruck.runtohpc}Z`);
                        const entryTime = new Date(`1970-01-01T${sqlTimeFormat}Z`);
                        const diffMs = entryTime.getTime() - runTime.getTime();
                        const waitingForArrival = new Date(diffMs).toISOString().substr(11, 8);
                        
                        updateData = {
                            entryhpc: sqlTimeFormat,
                            waitingforarrivalhpc: waitingForArrival,
                            status: 'waiting'
                        };
                        console.log('🏢 Entered HPC, calculated waiting for arrival:', waitingForArrival);
                    } else {
                        updateData = {
                            entryhpc: sqlTimeFormat,
                            status: 'waiting'
                        };
                        console.log('⚠️ No run time found for HPC');
                    }
                    break;

                case 'Memulai Muat/Bongkar':
                    // Calculate actualwaitloadingtime if entryhpc exists
                    let additionalData = {};
                    if (currentTruck.entryhpc) {
                        const entryTime = new Date(`1970-01-01T${currentTruck.entryhpc}Z`);
                        const startLoadingTime = new Date(`1970-01-01T${sqlTimeFormat}Z`);
                        const diffMs = startLoadingTime.getTime() - entryTime.getTime();
                        const actualWaitTime = new Date(diffMs).toISOString().substr(11, 8);
                        
                        additionalData = {
                            actualwaitloadingtime: actualWaitTime
                        };
                        console.log('⏱️ Calculated actual wait loading time:', actualWaitTime);
                    }

                    updateData = {
                        startloadingtime: sqlTimeFormat,
                        status: currentTruck.operation === 'muat' ? 'loading' : 'unloading',
                        ...additionalData
                    };
                    console.log(`📦 Started ${currentTruck.operation} process`);
                    break;

                case 'Selesai Muat/Bongkar':
                    // Calculate totalprocessloadingtime if startloadingtime exists
                    if (currentTruck.startloadingtime) {
                        const startTime = new Date(`1970-01-01T${currentTruck.startloadingtime}Z`);
                        const endTime = new Date(`1970-01-01T${sqlTimeFormat}Z`);
                        const diffMs = endTime.getTime() - startTime.getTime();
                        const totalProcessTime = new Date(diffMs).toISOString().substr(11, 8);
                        
                        updateData = {
                            finishloadingtime: sqlTimeFormat,
                            totalprocessloadingtime: totalProcessTime,
                            status: 'finished'
                        };
                        console.log('✅ Finished loading/unloading, total process time:', totalProcessTime);
                    } else {
                        updateData = {
                            finishloadingtime: sqlTimeFormat,
                            status: 'finished'
                        };
                        console.log('⚠️ No start loading time found');
                    }
                    break;

                case 'Keluar':
                    updateData = {
                        exittime: sqlTimeFormat,
                        status: 'done'
                    };
                    console.log('🚪 Truck exiting');
                    break;

                default:
                    console.log('⚠️ Unknown action:', action);
                    closeActionModal();
                    return;
            }

            // Send update to backend
            console.log('📡 Updating truck via scannerStore:', { 
                truckId: currentTruck.id,
                updateData
            });
            
            const updatedTruck = await updateTruckAPI(Number(currentTruck.id), updateData);
            console.log('✅ Truck updated successfully:', updatedTruck);

            // Update local store if needed
            const { useTruckStore } = await import('@/store/truckStore');
            const { fetchTrucks } = useTruckStore.getState();
            await fetchTrucks();
            
            console.log('🔄 Local store refreshed');

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
                            <span className="font-medium">{currentTruck.plateNumber}</span>
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