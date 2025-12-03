import { useEffect, useRef, useMemo } from "react";
import { useScannerStore } from "@/store/scannerStore";
import { useTruckStore } from "@/store/truckStore";
import { LogIn, Scale, CheckCircle, Navigation, DoorOpen, PackageOpen, PackageCheck, LogOut, SkipForward, RotateCcw, AlertCircle, Lightbulb, MapPin, Weight } from 'lucide-react';
import { format } from 'date-fns';
import { calculateTimeDifference, deviationTime } from "@/hooks/trucks/useDeviationTime";

type StepStatus = 'completed' | 'in-progress' | 'pending' | 'skipped';
type ActionType = 'normal' | 'skip' | 'continue';
interface FlowStep {
    icon: any;
    label: string;
    color: string;
    action: string;
}
interface SmartActions {
    normalActions: string[];
    skipActions: string[];
    continueActions: string[];
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
        const truck = trucks.find(truck => truck.noticket === selectedTicket);
        // Debug log to check if neto weighing fields are present
        if (truck) {
        }
        return truck;
    }, [selectedTicket, trucks]);
    const flowSteps: FlowStep[] = useMemo(() => {
        if (!currentTruck) {
            return [
                { icon: LogIn, label: 'Masuk', color: 'bg-blue-500', action: 'Masuk' },
                { icon: Scale, label: 'Mulai Timbang Gross', color: 'bg-green-500', action: 'Mulai Timbang Gross' },
                { icon: CheckCircle, label: 'Selesai Timbang Gross', color: 'bg-emerald-500', action: 'Selesai Timbang Gross' },
                { icon: Navigation, label: 'Menuju HPC', color: 'bg-yellow-500', action: 'Menuju HPC' },
                { icon: DoorOpen, label: 'Masuk HPC', color: 'bg-orange-500', action: 'Masuk HPC' },
                { icon: PackageOpen, label: 'Memulai Muat/Bongkar', color: 'bg-purple-500', action: 'Memulai Muat/Bongkar' },
                { icon: PackageCheck, label: 'Selesai Muat/Bongkar', color: 'bg-pink-500', action: 'Selesai Muat/Bongkar' },
                { icon: Weight, label: 'Mulai Timbang Neto', color: 'bg-green-700', action: 'Mulai Timbang Neto' },
                { icon: CheckCircle, label: 'Selesai Timbang Neto', color: 'bg-emerald-700', action: 'Selesai Timbang Neto' },
                { icon: LogOut, label: 'Keluar', color: 'bg-red-500', action: 'Keluar' },
            ];
        }
        const { operation, department, loading_cycle } = currentTruck;

        const steps = [];
        const skiploadingcycle = currentTruck.skipped_steps?.includes('Memulai Muat/Bongkar') ||
            currentTruck.skipped_steps?.includes('Selesai Muat/Bongkar');

        // Cycle 2 if clicking the button lanjut muat di pt 
        if ((loading_cycle || 1) > 1) {
            if (department === 'HPC' || department === 'PBPG') {
                steps.push({ icon: DoorOpen, label: 'Masuk HPC', color: 'bg-orange-500', action: 'Masuk HPC' });
            } else if (department === 'PT') {
                steps.push({ icon: DoorOpen, label: 'Masuk PT', color: 'bg-purple-600', action: 'Masuk PT' });
            }
            if (!skiploadingcycle) {
                steps.push({ icon: PackageOpen, label: 'Memulai Muat/Bongkar', color: 'bg-purple-500', action: 'Memulai Muat/Bongkar' });
                steps.push({ icon: PackageCheck, label: 'Selesai Muat/Bongkar', color: 'bg-pink-500', action: 'Selesai Muat/Bongkar' });
            }
            if (operation === "muat") {
                steps.push({ icon: Weight, label: 'Mulai Timbang Gross', color: 'bg-green-700', action: 'Mulai Timbang Gross' });
                steps.push({ icon: CheckCircle, label: 'Selesai Timbang Gross', color: 'bg-emerald-700', action: 'Selesai Timbang Gross' });
            } else if (operation === "bongkar") {
                steps.push({ icon: Weight, label: 'Mulai Timbang Neto', color: 'bg-green-700', action: 'Mulai Timbang Neto' });
                steps.push({ icon: CheckCircle, label: 'Selesai Timbang Neto', color: 'bg-emerald-700', action: 'Selesai Timbang Neto' });
            }
            steps.push({ icon: LogOut, label: 'Keluar', color: 'bg-red-500', action: 'Keluar' });
            return steps;
        }
        // Cycle 2 if clicking the button timbang ke pt
        steps.push({ icon: LogIn, label: 'Masuk', color: 'bg-blue-500', action: 'Masuk' });
        if (operation === "muat") {
            steps.push({ icon: Weight, label: 'Mulai Timbang Neto', color: 'bg-green-700', action: 'Mulai Timbang Neto' });
            steps.push({ icon: CheckCircle, label: 'Selesai Timbang Neto', color: 'bg-emerald-700', action: 'Selesai Timbang Neto' });
        } else if (operation === "bongkar") {
            steps.push({ icon: Weight, label: 'Mulai Timbang Gross', color: 'bg-green-700', action: 'Mulai Timbang Gross' });
            steps.push({ icon: CheckCircle, label: 'Selesai Timbang Gross', color: 'bg-emerald-700', action: 'Selesai Timbang Gross' });
        }
        if (department === 'HPC' || department === 'PBPG') {
            steps.push({ icon: Navigation, label: 'Menuju HPC', color: 'bg-yellow-500', action: 'Menuju HPC' });
            steps.push({ icon: DoorOpen, label: 'Masuk HPC', color: 'bg-orange-500', action: 'Masuk HPC' });
        }
        // else if (department === 'PT') {
        //     steps.push({ icon: MapPin, label: 'Menuju PT', color: 'bg-indigo-500', action: 'Menuju PT' });
        //     steps.push({ icon: DoorOpen, label: 'Masuk PT', color: 'bg-purple-600', action: 'Masuk PT' });
        // }
        steps.push({ icon: PackageOpen, label: 'Memulai Muat/Bongkar', color: 'bg-purple-500', action: 'Memulai Muat/Bongkar' });
        steps.push({ icon: PackageCheck, label: 'Selesai Muat/Bongkar', color: 'bg-pink-500', action: 'Selesai Muat/Bongkar' });
        if (operation === "muat") {
            steps.push({ icon: Scale, label: 'Mulai Timbang Gross', color: 'bg-green-500', action: 'Mulai Timbang Gross' });
            steps.push({ icon: CheckCircle, label: 'Selesai Timbang Gross', color: 'bg-emerald-500', action: 'Selesai Timbang Gross' });
        } else if (operation === "bongkar") {
            steps.push({ icon: Scale, label: 'Mulai Timbang Neto', color: 'bg-green-500', action: 'Mulai Timbang Neto' });
            steps.push({ icon: CheckCircle, label: 'Selesai Timbang Neto', color: 'bg-emerald-500', action: 'Selesai Timbang Neto' });
        }
        // steps.push({ icon: Weight, label: 'Mulai Timbang Neto', color: 'bg-green-700', action: 'Mulai Timbang Neto' });
        // steps.push({ icon: CheckCircle, label: 'Selesai Timbang Neto', color: 'bg-emerald-700', action: 'Selesai Timbang Neto' });
        steps.push({ icon: LogOut, label: 'Keluar', color: 'bg-red-500', action: 'Keluar' });
        return steps;
    }, [currentTruck]);
    const smartActions: SmartActions = useMemo(() => {
        if (!currentTruck) {
            return {
                normalActions: availableActions,
                skipActions: [],
                continueActions: []
            };
        }
        const normalActions: string[] = [];
        const skipActions: string[] = [];
        const continueActions: string[] = [];
        availableActions.forEach(action => {
            if (!action.startsWith('Lewat') && !action.startsWith('Lanjut')) {
                normalActions.push(action);
            }
        });
        const currentStep = availableActions[0];
        const operation = currentTruck.operation;
        if (operation === "muat") {
            if (currentStep === 'Mulai Timbang Neto' ||
                currentStep === 'Selesai Timbang Neto' ||
                currentStep === 'Menuju HPC' ||
                currentStep === 'Masuk HPC' ||
                currentStep === 'Menuju PT' ||
                currentStep === 'Masuk PT') {
                skipActions.push('Lewat ke Mulai Muat/Bongkar');
            }
            if (currentTruck.type === 'internal' && currentStep === 'Mulai Timbang Gross') {
                skipActions.push('Lewat ke Mulai Muat/Bongkar');
            }
            if (currentTruck.status === 'finished') {
                if (!normalActions.includes('Keluar')) {
                    normalActions.push('Keluar')
                }
                if (currentTruck.department === 'HPC' || currentTruck.department === 'PBPG') {
                    continueActions.push('Lanjut Muat/Bongkar di PT');
                    continueActions.push('Timbang Gross ke PT');
                } else if (currentTruck.department === 'PT') {
                    continueActions.push('Lanjut Muat/Bongkar di HPC');
                }
                // const sameDeptAction = `Lanjut Muat/Bongkar di ${currentTruck.department}`;
                // if (!continueActions.includes(sameDeptAction)) {
                //     continueActions.push(sameDeptAction);
                // }
            }
        } else if (operation === "bongkar") {
            if (currentStep === 'Mulai Timbang Gross' ||
                currentStep === 'Selesai Timbang Gross' ||
                currentStep === 'Menuju HPC' ||
                currentStep === 'Masuk HPC' ||
                currentStep === 'Menuju PT' ||
                currentStep === 'Masuk PT') {
                skipActions.push('Lewat ke Mulai Muat/Bongkar');
            }
            if (currentTruck.type === 'internal' && currentStep === 'Mulai Timbang Gross') {
                skipActions.push('Lewat ke Mulai Muat/Bongkar');
            }
            if (currentTruck.status === 'finished') {
                if (!normalActions.includes('Keluar')) {
                    normalActions.push('Keluar')
                }
                if (currentTruck.department === 'HPC' || currentTruck.department === 'PBPG') {
                    continueActions.push('Lanjut Muat/Bongkar di PT');
                    continueActions.push('Timbang Neto ke PT');
                } else if (currentTruck.department === 'PT') {
                    continueActions.push('Lanjut Muat/Bongkar di HPC');
                }
            }
        }
        return { normalActions, skipActions, continueActions };
    }, [currentTruck, availableActions]);
    const getStepStatus = (stepAction: string, index: number): StepStatus => {
        if (currentTruck?.skipped_steps) {
            const normalizedAction = stepAction.toLowerCase().replace(/\s+/g, '_').replace(/\//g, '_');
            const skippedList = currentTruck.skipped_steps.split(',').map(s => s.trim().toLowerCase().replace(/\s+/g, '_').replace(/\//g, '_'));
            const isSkipped = skippedList.includes(normalizedAction);

            if (isSkipped) {
                return 'skipped';
            }
        }
        if (!currentTruck) {
            const currentStepIndex = flowSteps.findIndex(step =>
                availableActions.includes(step.action)
            );
            if (currentStepIndex === -1) {
                return 'pending';
            }
            if (index === currentStepIndex) {
                return 'in-progress';
            }
            if (index < currentStepIndex) {
                return 'completed';
            }
            return 'pending';
        }
        const operation = currentTruck.operation;
        if (operation === "muat") {
            return getStepStatusMuat(stepAction, currentTruck);
        } else if (operation === "bongkar") {
            return getStepStatusBongkar(stepAction, currentTruck);
        }
        return 'pending';
    };

    const getStepStatusMuat = (stepAction: string, currentTruck: any): StepStatus => {
        const truckStatus = currentTruck.status;
        const stepActionLower = stepAction.toLowerCase();
        switch (truckStatus) {
            case "timbang":
                if (currentTruck.starttimbang) {
                    if (stepActionLower.includes('selesai timbang gross')) {
                        return 'in-progress';
                    } else if (stepActionLower.includes('keluar')) {
                        return 'pending';
                    } else {
                        return 'completed';
                    }
                } if (currentTruck.starttimbangneto) {
                    if (stepActionLower.includes('selesai timbang neto')) {
                        return 'in-progress'
                    }
                    else if (stepActionLower.includes('hpc') || stepActionLower.includes('muat/bongkar') || stepActionLower.includes('pt') || stepActionLower.includes('timbang gross') || stepActionLower.includes('keluar')) {
                        return 'pending'
                    }
                    else {
                        return 'completed'
                    }
                }
                else if ((currentTruck.loading_cycle || 1) > 1 && currentTruck.starttimbang && !currentTruck.finishtimbang) {
                    if (stepActionLower.includes('selesai timbang gross')) {
                        return 'in-progress';
                    } else if (stepActionLower.includes('keluar')) {
                        return 'pending';
                    } else {
                        return 'completed';
                    }
                }
            case "waiting":
                if ((currentTruck.loading_cycle || 1) > 1 && currentTruck.runtopt && !currentTruck.entrypt) {
                    if (stepActionLower.includes('masuk pt')) {
                        return 'in-progress';
                    } else if (stepActionLower.includes('muat/bongkar') || stepActionLower.includes('keluar') || stepActionLower.includes('timbang gross')) {
                        return 'pending';
                    } else {
                        return 'completed';
                    }
                } else if ((currentTruck.loading_cycle || 1) > 1 && currentTruck.runtohpc && !currentTruck.entryhpc) {
                    if (stepActionLower.includes('masuk hpc')) {
                        return 'in-progress';
                    } else if (stepActionLower.includes('muat/bongkar') || stepActionLower.includes('keluar') || stepActionLower.includes('timbang gross')) {
                        return 'pending';
                    } else {
                        return 'completed';
                    }
                } else if ((currentTruck.loading_cycle || 1) > 1 && currentTruck.entryhpc && !currentTruck.startloadingtime) {
                    if (stepActionLower.includes('memulai muat/bongkar')) {
                        return 'in-progress';
                    } else if (stepActionLower.includes('selesai muat/bongkar') || stepActionLower.includes('keluar') || stepActionLower.includes('timbang gross')) {
                        return 'pending';
                    } else {
                        return 'completed';
                    }
                } else if ((currentTruck.loading_cycle || 1) > 1 && currentTruck.entrypt && !currentTruck.startloadingtime) {
                    if (stepActionLower.includes('memulai muat/bongkar')) {
                        return 'in-progress';
                    } else if (stepActionLower.includes('selesai muat/bongkar') || stepActionLower.includes('keluar') || stepActionLower.includes('timbang gross')) {
                        return 'pending';
                    } else {
                        return 'completed';
                    }
                } else if ((currentTruck.loading_cycle || 1) > 1 && currentTruck.startloadingtime && !currentTruck.finishloadingtime) {
                    if (stepActionLower.includes('selesai muat/bongkar')) {
                        return 'in-progress';
                    } else if (stepActionLower.includes('keluar') || stepActionLower.includes('timbang neto')) {
                        return 'pending';
                    } else {
                        return 'completed';
                    }
                } else if ((currentTruck.loading_cycle || 1) > 1 && currentTruck.finishloadingtime && !currentTruck.starttimbangneto) {
                    if (stepActionLower.includes('mulai timbang neto')) {
                        return 'in-progress';
                    } else if (stepActionLower.includes('keluar') || stepActionLower.includes('selesai timbang neto')) {
                        return 'pending';
                    } else {
                        return 'completed';
                    }
                } else if ((currentTruck.loading_cycle || 1) > 1 && currentTruck.starttimbang && !currentTruck.finishtimbang) {
                    if (stepActionLower.includes('selesai timbang gross')) {
                        return 'in-progress';
                    } else if (stepActionLower.includes('keluar')) {
                        return 'pending';
                    } else {
                        return 'completed';
                    }
                } else if (currentTruck.finishtimbang) {
                    if (stepActionLower.includes('keluar')) {
                        return 'in-progress';
                    } else {
                        return 'completed';
                    }
                } else if (currentTruck.finishloadingtime) {
                    if (stepActionLower.includes('mulai timbang gross')) {
                        return 'in-progress';
                    } else if (stepActionLower.includes('selesai timbang gross') || stepActionLower.includes('keluar')) {
                        return 'pending';
                    } else if (stepActionLower.includes('selesai muat/bongkar') ||
                        stepActionLower.includes('memulai muat/bongkar') ||
                        stepActionLower.includes('masuk hpc') ||
                        stepActionLower.includes('masuk pt') ||
                        stepActionLower.includes('menuju hpc') ||
                        stepActionLower.includes('menuju pt') ||
                        stepActionLower.includes('selesai timbang neto') ||
                        stepActionLower.includes('mulai timbang neto')) {
                        return 'completed';
                    } else {
                        return 'pending';
                    }
                } else if (currentTruck.startloadingtime) {
                    if (stepActionLower.includes('selesai muat/bongkar')) {
                        return 'in-progress';
                    } else if (stepActionLower.includes('timbang gross') || stepActionLower.includes('keluar')) {
                        return 'pending';
                    } else {
                        return 'completed';
                    }
                } else if (currentTruck.entryhpc || currentTruck.entrypt) {
                    if (stepActionLower.includes('memulai muat/bongkar')) {
                        return 'in-progress';
                    } else if (stepActionLower.includes('selesai muat/bongkar') || stepActionLower.includes('timbang gross') || stepActionLower.includes('keluar')) {
                        return 'pending';
                    } else {
                        return 'completed';
                    }
                } else if (currentTruck.runtohpc) {
                    if (stepActionLower.includes('masuk hpc')) {
                        return 'in-progress';
                    } else if (stepActionLower.includes('muat/bongkar') || stepActionLower.includes('timbang gross') || stepActionLower.includes('keluar')) {
                        return 'pending';
                    } else {
                        return 'completed';
                    }
                } else if (currentTruck.runtopt) {
                    if (stepActionLower.includes('masuk pt')) {
                        return 'in-progress';
                    } else if (stepActionLower.includes('muat/bongkar') || stepActionLower.includes('timbang neto') || stepActionLower.includes('keluar')) {
                        return 'pending';
                    } else {
                        return 'completed';
                    }
                } else if (currentTruck.finishtimbangneto) {
                    if (stepActionLower.includes('menuju hpc') || stepActionLower.includes('menuju pt')) {
                        return 'in-progress';
                    } else if (stepActionLower.includes('masuk hpc') || stepActionLower.includes('masuk pt') || stepActionLower.includes('muat/bongkar') || stepActionLower.includes('timbang gross') || stepActionLower.includes('keluar')) {
                        return 'pending';
                    } else {
                        return 'completed';
                    }
                } else if (currentTruck.starttimbang) {
                    if (stepActionLower.includes('selesai timbang gross')) {
                        return 'in-progress';
                    } else if (stepActionLower.includes('menuju') || stepActionLower.includes('masuk') || stepActionLower.includes('muat/bongkar') || stepActionLower.includes('timbang neto') || stepActionLower.includes('keluar')) {
                        return 'pending';
                    } else {
                        return 'completed';
                    }
                } else {
                    if (stepActionLower.includes('masuk') && !stepActionLower.includes('hpc') && !stepActionLower.includes('pt')) {
                        return 'completed';
                    } else if (stepActionLower.includes('mulai timbang neto')) {
                        return 'in-progress';
                    } else {
                        return 'pending';
                    }
                }
            case "loading":
            case "unloading":
                if (stepActionLower.includes('selesai muat/bongkar')) {
                    return 'in-progress';
                } else if (stepActionLower.includes('keluar') || stepActionLower.includes('timbang gross')) {
                    return 'pending';
                } else {
                    return 'completed';
                }
            case "weighing_neto":
                if (stepActionLower.includes('selesai timbang neto')) {
                    return 'in-progress';
                } else if (stepActionLower.includes('keluar')) {
                    return 'pending';
                } else {
                    return 'completed';
                }
            case "weighing_neto_finished":
                if (stepActionLower.includes('keluar')) {
                    return 'in-progress';
                } else {
                    return 'completed';
                }
            case "finished":
                if (currentTruck.finishtimbang) {
                    if (stepActionLower.includes('keluar')) {
                        return 'in-progress';
                    } else {
                        return 'completed';
                    }
                } else if (currentTruck.starttimbang) {
                    if (stepActionLower.includes('selesai timbang neto')) {
                        return 'in-progress';
                    } else if (stepActionLower.includes('keluar')) {
                        return 'pending';
                    } else if (stepActionLower.includes('mulai timbang neto')) {
                        return 'completed';
                    } else {
                        return 'completed';
                    }
                } else {
                    if (stepActionLower.includes('mulai timbang gross')) {
                        return 'in-progress';
                    } else if (stepActionLower.includes('selesai timbang gross') || stepActionLower.includes('keluar')) {
                        return 'pending';
                    } else {
                        return 'completed';
                    }
                }
            case "exit":
                return 'completed';
            default:
                return 'pending';
        }
    }
    const getStepStatusBongkar = (stepAction: string, currentTruck: any): StepStatus => {
        const truckStatus = currentTruck.status;
        const stepActionLower = stepAction.toLowerCase();
        switch (truckStatus) {
            case "timbang":
                if (currentTruck.starttimbangneto) {
                    if (stepActionLower.includes('selesai timbang neto')) {
                        return 'in-progress';
                    } else if (stepActionLower.includes('keluar')) {
                        return 'pending';
                    } else {
                        return 'completed';
                    }
                } else if (currentTruck.starttimbang) {
                    if (stepActionLower.includes('selesai timbang gross')) {
                        return 'in-progress';
                    } else if (stepActionLower.includes('mulai timbang gross') ||
                        (stepActionLower.includes('masuk') && !stepActionLower.includes('hpc') && !stepActionLower.includes('pt'))) {
                        return 'completed';
                    } else {
                        return 'pending';
                    }
                } else if (currentTruck.finishtimbang) {
                    if (stepActionLower.includes('selesai timbang gross')) {
                        return 'in-progress';
                    } else if (stepActionLower.includes('keluar')) {
                        return 'pending';
                    } else {
                        return 'completed';
                    }
                } else if (currentTruck.finishtimbangneto) {
                    if (stepActionLower.includes('keluar')) {
                        return 'in-progress';
                    } else {
                        return 'completed';
                    }
                } else if (currentTruck.starttimbangneto) {
                    if (stepActionLower.includes('selesai timbang neto')) {
                        return 'in-progress';
                    } else if (stepActionLower.includes('keluar')) {
                        return 'pending';
                    } else {
                        return 'completed';
                    }
                }
            case "waiting":
                if ((currentTruck.loading_cycle || 1) > 1 && currentTruck.runtopt && !currentTruck.entrypt) {
                    if (stepActionLower.includes('masuk pt')) {
                        return 'in-progress';
                    } else if (stepActionLower.includes('muat/bongkar') || stepActionLower.includes('keluar') || stepActionLower.includes('timbang neto')) {
                        return 'pending';
                    } else {
                        return 'completed';
                    }
                } else if ((currentTruck.loading_cycle || 1) > 1 && currentTruck.runtohpc && !currentTruck.entryhpc) {
                    if (stepActionLower.includes('masuk hpc')) {
                        return 'in-progress';
                    } else if (stepActionLower.includes('muat/bongkar') || stepActionLower.includes('keluar') || stepActionLower.includes('timbang neto')) {
                        return 'pending';
                    } else {
                        return 'completed';
                    }
                } else if ((currentTruck.loading_cycle || 1) > 1 && currentTruck.entryhpc && !currentTruck.startloadingtime) {
                    if (stepActionLower.includes('memulai muat/bongkar')) {
                        return 'in-progress';
                    } else if (stepActionLower.includes('selesai muat/bongkar') || stepActionLower.includes('keluar') || stepActionLower.includes('timbang neto')) {
                        return 'pending';
                    } else {
                        return 'completed';
                    }
                } else if ((currentTruck.loading_cycle || 1) > 1 && currentTruck.entrypt && !currentTruck.startloadingtime) {
                    if (stepActionLower.includes('memulai muat/bongkar')) {
                        return 'in-progress';
                    } else if (stepActionLower.includes('selesai muat/bongkar') || stepActionLower.includes('keluar') || stepActionLower.includes('timbang neto')) {
                        return 'pending';
                    } else {
                        return 'completed';
                    }
                } else if ((currentTruck.loading_cycle || 1) > 1 && currentTruck.startloadingtime && !currentTruck.finishloadingtime) {
                    if (stepActionLower.includes('selesai muat/bongkar')) {
                        return 'in-progress';
                    } else if (stepActionLower.includes('keluar') || stepActionLower.includes('timbang neto')) {
                        return 'pending';
                    } else {
                        return 'completed';
                    }
                } else if ((currentTruck.loading_cycle || 1) > 1 && currentTruck.entrypt && !currentTruck.starttimbangneto) {
                    if (stepActionLower.includes('mulai timbang neto')) {
                        return 'in-progress';
                    } else if (stepActionLower.includes('keluar') || stepActionLower.includes('selesai timbang neto')) {
                        return 'pending';
                    } else {
                        return 'completed';
                    }
                } else if ((currentTruck.loading_cycle || 1) > 1 && currentTruck.starttimbangneto && !currentTruck.finishtimbangneto) {
                    if (stepActionLower.includes('selesai timbang neto')) {
                        return 'in-progress';
                    } else if (stepActionLower.includes('keluar')) {
                        return 'pending';
                    } else {
                        return 'completed';
                    }
                } else if (currentTruck.finishtimbangneto) {
                    if (stepActionLower.includes('menuju pt') || stepActionLower.includes('menuju hpc')) {
                        return 'in-progress';
                    } else if (stepActionLower.includes('timbang gross') ||
                        (stepActionLower.includes('keluar')) ||
                        (stepActionLower.includes('muat/bongkar')) ||
                        (stepActionLower.includes('masuk pt')) ||
                        (stepActionLower.includes('masuk hpc'))) {
                        return 'pending';
                    } else {
                        return 'completed';
                    }
                } else if (currentTruck.finishloadingtime) {
                    if (stepActionLower.includes('mulai timbang neto')) {
                        return 'in-progress';
                    } else if (stepActionLower.includes('selesai timbang neto') || stepActionLower.includes('keluar')) {
                        return 'pending';
                    } else if (stepActionLower.includes('selesai muat/bongkar') ||
                        stepActionLower.includes('memulai muat/bongkar') ||
                        stepActionLower.includes('masuk hpc') ||
                        stepActionLower.includes('masuk pt') ||
                        stepActionLower.includes('menuju hpc') ||
                        stepActionLower.includes('menuju pt') ||
                        stepActionLower.includes('selesai timbang gross') ||
                        stepActionLower.includes('mulai timbang gross')) {
                        return 'completed';
                    } else {
                        return 'pending';
                    }
                } else if (currentTruck.startloadingtime) {
                    if (stepActionLower.includes('selesai muat/bongkar')) {
                        return 'in-progress';
                    } else if (stepActionLower.includes('timbang neto') || stepActionLower.includes('keluar')) {
                        return 'pending';
                    } else {
                        return 'completed';
                    }
                } else if (currentTruck.entryhpc || currentTruck.entrypt) {
                    if (currentTruck.entryhpc && !currentTruck.starttimbangneto) {
                        if (stepActionLower.includes('mulai muat/bongkar')) {
                            return 'in-progress';
                        } else if (stepActionLower.includes('selesai muat/bongkar') || stepActionLower.includes('timbang neto') || stepActionLower.includes('keluar')) {
                            return 'pending';
                        } else {
                            return 'completed';
                        }
                    } else if (currentTruck.entrypt && !currentTruck.starttimbangneto) {
                        if (stepActionLower.includes('mulai muat/bongkar')) {
                            return 'in-progress';
                        } else if (stepActionLower.includes('selesai muat/bongkar') || stepActionLower.includes('timbang gross') || stepActionLower.includes('keluar')) {
                            return 'pending';
                        } else {
                            return 'completed';
                        }
                    }
                } else if (currentTruck.runtohpc) {
                    if (stepActionLower.includes('masuk hpc')) {
                        return 'in-progress';
                    } else if (stepActionLower.includes('timbang neto') || stepActionLower.includes('muat/bongkar') || stepActionLower.includes('keluar')) {
                        return 'pending';
                    } else {
                        return 'completed'
                    }
                } else if (currentTruck.runtopt) {
                    if (stepActionLower.includes('masuk pt')) {
                        return 'in-progress';
                    } else if (stepActionLower.includes('muat/bongkar') || stepActionLower.includes('timbang neto') || stepActionLower.includes('keluar')) {
                        return 'pending';
                    } else {
                        return 'completed';
                    }
                } else if (currentTruck.finishtimbang) {
                    if (currentTruck.department === "PT") {
                        if (stepActionLower.includes('menuju hpc') || stepActionLower.includes('menuju pt') || stepActionLower.includes('mulai muat/bongkar')) {
                            return 'in-progress';
                        } else if (stepActionLower.includes('masuk hpc') || stepActionLower.includes('masuk pt') || stepActionLower.includes('muat/bongkar') || stepActionLower.includes('timbang neto') || stepActionLower.includes('keluar')) {
                            return 'pending';
                        } else {
                            return 'completed';
                        }
                    }
                    else {
                        if (stepActionLower.includes('menuju hpc') || stepActionLower.includes('menuju pt')) {
                            return 'in-progress';
                        } else if (stepActionLower.includes('masuk hpc') || stepActionLower.includes('masuk pt') || stepActionLower.includes('muat/bongkar') || stepActionLower.includes('timbang neto') || stepActionLower.includes('keluar')) {
                            return 'pending';
                        } else {
                            return 'completed';
                        }
                    }
                } else if (currentTruck.starttimbang) {
                    if (stepActionLower.includes('selesai timbang gross')) {
                        return 'in-progress';
                    } else if (stepActionLower.includes('menuju') || stepActionLower.includes('masuk') || stepActionLower.includes('muat/bongkar') || stepActionLower.includes('timbang neto') || stepActionLower.includes('keluar')) {
                        return 'pending';
                    } else {
                        return 'completed';
                    }
                } else {
                    if (stepActionLower.includes('masuk') && !stepActionLower.includes('hpc') && !stepActionLower.includes('pt')) {
                        return 'completed';
                    } else if (stepActionLower.includes('mulai timbang gross')) {
                        return 'in-progress';
                    } else {
                        return 'pending';
                    }
                }
            case "loading":
            case "unloading":
                if (stepActionLower.includes('selesai muat/bongkar')) {
                    return 'in-progress';
                } else if (stepActionLower.includes('keluar') || stepActionLower.includes('timbang neto')) {
                    return 'pending';
                } else {
                    return 'completed';
                }
            case "weighing_neto":
                if (stepActionLower.includes('selesai timbang neto')) {
                    return 'in-progress';
                } else if (stepActionLower.includes('keluar') || (stepActionLower.includes('menuju hpc')) || (stepActionLower.includes('menuju pt')) || (stepActionLower.includes('masuk hpc')) || (stepActionLower.includes('muat/bongkar')) || (stepActionLower.includes('timbang gross'))) {
                    return 'pending';
                } else {
                    return 'completed';
                }
            case "weighing_neto_finished":
                if (stepActionLower.includes('menuju hpc') || stepActionLower.includes('menuju pt')) {
                    return 'in-progress';
                } else if (stepActionLower.includes('masuk hpc') || stepActionLower.includes('masuk pt') || stepActionLower.includes('muat/bongkar') || stepActionLower.includes('keluar')) {
                    return 'pending';
                } else {
                    return 'completed';
                }
            case "finished":
                if (currentTruck.finishtimbangneto) {
                    if (stepActionLower.includes('keluar')) {
                        return 'in-progress';
                    } else {
                        return 'completed';
                    }
                } else if (currentTruck.finishloadingtime) {
                    if (stepActionLower.includes('mulai timbang neto')) {
                        return 'in-progress';
                    } else if (stepActionLower.includes('keluar') || (stepActionLower.includes('timbang neto'))) {
                        return 'pending';
                    } else {
                        return 'completed';
                    }
                } else if ((currentTruck.loading_cycle || 1) > 1 && currentTruck.finishtimbangneto && !currentTruck.exittime) {
                    if (stepActionLower.includes('keluar')) {
                        return 'in-progress';
                    } else {
                        return 'completed';
                    }
                }
                else {
                    if (stepActionLower.includes('mulai timbang neto')) {
                        return 'in-progress';
                    } else if (stepActionLower.includes('selesai timbang neto') || stepActionLower.includes('keluar')) {
                        return 'pending';
                    } else {
                        return 'completed';
                    }
                }
            case "exit":
                return 'completed';
            default:
                return 'pending';
        }
    }

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
        if (!currentTruck || !selectedTicket) {
            console.error('Missing data:', {
                hasCurrentTruck: !!currentTruck,
                selectedTicket,
                trucksAvailable: trucks?.length || 0,
            });
            closeActionModal();
            return;
        }

        if (!currentTruck.id || isNaN(Number(currentTruck.id))) {
            console.error('Invalid truck ID:', currentTruck.id);
            alert('Error: Invalid truck ID');
            closeActionModal();
            return;
        }

        try {
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
            const formatDateTimeForSQL = () => {
                const now = new Date();
                const year = now.getFullYear();
                const month = String(now.getMonth() + 1).padStart(2, '0');
                const day = String(now.getDate()).padStart(2, '0');
                const hours = String(now.getHours()).padStart(2, '0');
                const minutes = String(now.getMinutes()).padStart(2, '0');
                const seconds = String(now.getSeconds()).padStart(2, '0');
                return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
            };

            const sqlTimeFormat = formatTimeForSQL(currentTimeOnly);
            let updateData: any = {};

            switch (action) {
                case 'Mulai Timbang Gross':
                    if (currentTruck.operation === "muat") {
                        if (currentTruck.finishloadingtime) {
                            try {
                                const waitingTime = deviationTime(currentTruck.finishloadingtime)
                                updateData = {
                                    starttimbang: sqlTimeFormat,
                                    waitingfortimbang: waitingTime,
                                    status: 'timbang'
                                };
                            } catch (error) {
                                console.error('Error Calculating time difference: ', error);
                            }
                        } else {
                            updateData = {
                                starttimbang: sqlTimeFormat,
                                status: 'timbang'
                            };
                        }
                    }
                    else if (currentTruck.operation === "bongkar") {
                        if (currentTruck.arrivaltime) {
                            try {
                                const waitingTime = deviationTime(currentTruck.arrivaltime)
                                updateData = {
                                    starttimbang: sqlTimeFormat,
                                    waitingfortimbang: waitingTime,
                                    status: 'timbang'
                                };
                            } catch (error) {
                                console.error('Error Calculating time difference: ', error);
                            }
                        } else {
                            updateData = {
                                starttimbang: sqlTimeFormat,
                                status: 'timbang'
                            };
                        }
                    }
                    break;

                case 'Selesai Timbang Gross':
                    if (currentTruck.operation === 'bongkar') {
                        if (currentTruck.starttimbang) {
                            try {
                                const waitingTime = deviationTime(currentTruck.starttimbang);
                                updateData = {
                                    finishtimbang: sqlTimeFormat,
                                    totalprocesstimbang: waitingTime,
                                    status: 'waiting',
                                };
                            } catch (error) {
                                console.error('Error calculating time difference:', error);
                                updateData = {
                                    finishtimbang: sqlTimeFormat,
                                    status: 'waiting'
                                };
                            }
                        } else {
                            updateData = {
                                finishtimbang: sqlTimeFormat,
                                status: 'waiting',
                            };
                        }
                    }
                    else if (currentTruck.operation === 'muat') {
                        if (currentTruck.starttimbang) {
                            try {
                                const waitingTime = deviationTime(currentTruck.starttimbang);
                                updateData = {
                                    finishtimbang: sqlTimeFormat,
                                    totalprocesstimbang: waitingTime,
                                    status: 'finished',
                                };
                            } catch (error) {
                                console.error('Error calculating time difference:', error);
                                updateData = {
                                    finishtimbang: sqlTimeFormat,
                                    status: 'finished'
                                };
                            }
                        } else {
                            updateData = {
                                finishtimbang: sqlTimeFormat,
                                status: 'finished',
                            };
                        }
                    }
                    break;

                case 'Menuju HPC':
                    if (currentTruck.operation === 'bongkar') {
                        if (currentTruck.finishtimbang) {
                            const waitingTime = deviationTime(currentTruck.finishtimbang)
                            updateData = {
                                runtohpc: sqlTimeFormat,
                                status: 'waiting'
                            };
                            // console.log(updateData)
                        }
                    } else if (currentTruck.operation === 'muat') {
                        if (currentTruck.finishtimbangneto) {
                            const waitingTime = deviationTime(currentTruck.finishtimbangneto)
                            updateData = {
                                runtohpc: sqlTimeFormat,
                                status: 'waiting'
                            };
                            // console.log(updateData)
                        }
                    }
                    break;
                case 'Masuk HPC':
                    if (currentTruck.runtohpc) {
                        try {
                            const waitingTime = deviationTime(currentTruck.runtohpc, sqlTimeFormat)
                            updateData = {
                                entryhpc: sqlTimeFormat,
                                waitingforarrivalhpc: waitingTime,
                                status: 'waiting'
                            };
                        } catch (error) {
                            console.error('Error calculating arrival time difference:', error);
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
                    break;
                case 'Menuju PT':
                    if (currentTruck.operation === 'bongkar') {
                        if (currentTruck.finishtimbang) {
                            const waitingTime = deviationTime(currentTruck.finishtimbang)
                            updateData = {
                                runtohpc: sqlTimeFormat,
                                status: 'waiting'
                            };
                            // console.log(updateData)
                        }
                    } else if (currentTruck.operation === 'muat') {
                        if (currentTruck.finishtimbangneto) {
                            const waitingTime = deviationTime(currentTruck.finishtimbangneto)
                            updateData = {
                                runtohpc: sqlTimeFormat,
                                status: 'waiting'
                            };
                            // console.log(updateData)
                        }
                    }
                    // updateData = {
                    //     runtopt: sqlTimeFormat,
                    //     // This one is like menuju HPC waiting for Pa Maks
                    //     status: 'waiting'
                    // };
                    break;
                case 'Masuk PT':
                    if (currentTruck.runtopt) {
                        try {
                            const waitingTime = deviationTime(currentTruck.runtopt)
                            updateData = {
                                entrypt: sqlTimeFormat,
                                waitingforarrivalpt: waitingTime,
                                status: 'waiting'
                            };
                        } catch (error) {
                            console.error('Error calculating PT arrival time difference:', error);
                            updateData = {
                                entrypt: sqlTimeFormat,
                                status: 'waiting'
                            };
                        }
                    } else {
                        updateData = {
                            entrypt: sqlTimeFormat,
                            status: 'waiting'
                        };
                    }
                    break;
                case 'Memulai Muat/Bongkar':
                    let additionalData = {};
                    if (currentTruck.entryhpc) {
                        try {
                            const waitingTime = deviationTime(currentTruck.entryhpc)
                            additionalData = {
                                actualwaitloadingtime: waitingTime
                            };
                        } catch (error) {
                            console.error('Error calculating loading wait time difference:', error);
                            additionalData = {};
                        }
                    } else if (currentTruck.entrypt) {
                        try {
                            const waitingTime = deviationTime(currentTruck.entrypt)
                            additionalData = {
                                actualwaitloadingtime: waitingTime
                            };
                        } catch (error) {
                            console.error('Error calculating loading wait time difference:', error);
                            additionalData = {};
                        }
                    } else if (currentTruck.arrivaltime) {
                        try {
                            const waitingTime = deviationTime(currentTruck.arrivaltime)
                            additionalData = {
                                actualwaitloadingtime: waitingTime
                            };
                        } catch (error) {
                            console.error('Error calculating loading wait time difference:', error);
                            additionalData = {};
                        }
                    } else if (currentTruck.finishtimbang) {
                        try {
                            const waitingTime = deviationTime(currentTruck.finishtimbang)
                            additionalData = {
                                actualwaitloadingtime: waitingTime
                            };
                        } catch (error) {
                            console.error('Error calculating loading wait time difference:', error);
                            additionalData = {};
                        }
                    } else if (currentTruck.finishtimbangneto) {
                        try {
                            const waitingTime = deviationTime(currentTruck.finishtimbangneto)
                            additionalData = {
                                actualwaitloadingtime: waitingTime
                            };
                        } catch (error) {
                            console.error('Error calculating loading wait time difference:', error);
                            additionalData = {};
                        }
                    }
                    updateData = {
                        startloadingtime: sqlTimeFormat,
                        status: currentTruck.operation === 'muat' ? 'loading' : 'unloading',
                        ...additionalData
                    };
                    break;
                case 'Selesai Muat/Bongkar':
                    if (currentTruck.startloadingtime) {
                        try {
                            const waitingTime = deviationTime(currentTruck.startloadingtime, sqlTimeFormat)
                            updateData = {
                                finishloadingtime: sqlTimeFormat,
                                totalprocessloadingtime: waitingTime,
                                status: 'finished'
                            };
                        } catch (error) {
                            console.error('Error calculating loading process time difference:', error);
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
                    break;
                case 'Mulai Timbang Neto':
                    if (currentTruck.operation === "bongkar") {
                        if (currentTruck.finishloadingtime || currentTruck.arrivaltime) {
                            try {
                                const waitingTime = deviationTime(currentTruck.finishloadingtime || currentTruck.arrivaltime)
                                updateData = {
                                    starttimbangneto: sqlTimeFormat,
                                    waitingfortimbangneto: waitingTime,
                                    status: 'timbang'
                                };
                                console.log(updateData)
                            } catch (error) {
                                console.error('Error calculating neto waiting time:', error);
                                updateData = {
                                    starttimbangneto: sqlTimeFormat,
                                    status: 'timbang'
                                };
                            }
                        }
                    }
                    else if (currentTruck.operation === "muat") {
                        if (currentTruck.arrivaltime) {
                            try {
                                const waitingTime = deviationTime(currentTruck.arrivaltime)
                                updateData = {
                                    starttimbangneto: sqlTimeFormat,
                                    waitingfortimbangneto: waitingTime,
                                    status: 'timbang'
                                };
                            } catch (error) {
                                console.error('Error calculating neto waiting time:', error);
                                updateData = {
                                    starttimbangneto: sqlTimeFormat,
                                    status: 'timbang'
                                };
                            }
                        } else {
                            updateData = {
                                starttimbangneto: sqlTimeFormat,
                                status: 'timbang'
                            };
                        }
                    }
                    break;
                case 'Selesai Timbang Neto':
                    if (currentTruck.operation === "muat") {
                        if (currentTruck.starttimbangneto) {
                            try {
                                const waitingTime = deviationTime(currentTruck.starttimbangneto)
                                updateData = {
                                    finishtimbangneto: sqlTimeFormat,
                                    totalprocesstimbangneto: waitingTime,
                                    status: 'waiting'
                                };
                            } catch (error) {
                                console.error('Error calculating neto weighing process time difference:', error);
                                updateData = {
                                    finishtimbangneto: sqlTimeFormat,
                                    status: 'waiting'
                                };
                            }
                        }
                        else {
                            updateData = {
                                finishtimbangneto: sqlTimeFormat,
                                status: 'waiting'
                            };
                        }
                    }
                    else if (currentTruck.operation === "bongkar") {
                        if (currentTruck.starttimbangneto) {
                            try {
                                const waitingTime = deviationTime(currentTruck.starttimbangneto)
                                updateData = {
                                    finishtimbangneto: sqlTimeFormat,
                                    totalprocesstimbangneto: waitingTime,
                                    status: 'finished'
                                };
                            } catch (error) {
                                console.error('Error calculating neto weighing process time difference:', error);
                                updateData = {
                                    finishtimbangneto: sqlTimeFormat,
                                    status: 'finished'
                                };
                            }
                        } else {
                            updateData = {
                                finishtimbangneto: sqlTimeFormat,
                                status: 'finished'
                            };
                        }
                    }
                    break;
                case 'Keluar':
                    if (currentTruck.finishloadingtime) {
                        try {
                            const waitingTime = deviationTime(currentTruck.finishloadingtime)
                            const completionTime = calculateTimeDifference(currentTruck.arrivaltime, formatDateTimeForSQL())
                            updateData = {
                                exittime: formatDateTimeForSQL(),
                                totaltruckcompletiontime: completionTime,
                                waitingforexit: waitingTime,
                                status: 'exit'
                            };
                            console.log(`arrival Time: ${currentTruck.arrivaltime} || Exit Time: ${formatDateTimeForSQL()}`);
                        } catch (error) {
                            console.error('Error calculating total truck completion time difference:', error)
                            updateData = {
                                exittime: formatDateTimeForSQL(),
                                status: 'exit'
                            }
                        }
                    } else if (currentTruck.finishtimbangneto) {
                        try {
                            const waitingTime = deviationTime(currentTruck.finishtimbangneto)
                            const timediff = calculateTimeDifference(currentTruck.arrivaltime, formatDateTimeForSQL())
                            const completionTime = timediff;
                            console.log(`arrival Time: ${currentTruck.arrivaltime} || Exit Time: ${formatDateTimeForSQL()}`);
                            updateData = {
                                exittime: formatDateTimeForSQL(),
                                waitingforexit: waitingTime,
                                totaltruckcompletiontime: completionTime,
                                status: 'exit'
                            };
                        } catch (error) {
                            console.error('Error calculating total truck completion time difference:', error)
                            updateData = {
                                exittime: formatDateTimeForSQL(),
                                status: 'exit'
                            }
                        }
                    } else if (currentTruck.finishtimbang) {
                        try {
                            const waitingTime = deviationTime(currentTruck.finishtimbang)
                            const completionTime = calculateTimeDifference(currentTruck.arrivaltime, formatDateTimeForSQL())
                            updateData = {
                                exittime: formatDateTimeForSQL(),
                                waitingforexit: waitingTime,
                                totaltruckcompletiontime: completionTime,
                                status: 'exit'
                            };
                        } catch (error) {
                            console.error('Error calculating total truck completion time difference:', error)
                            updateData = {
                                exittime: formatDateTimeForSQL(),
                                status: 'exit'
                            }
                        }
                    }
                    break;
                default:
                    closeActionModal();
                    return;
            }
            const updatedTruck = await updateTruckAPI(Number(currentTruck.id), updateData);
            const { useTruckStore } = await import('@/store/truckStore');
            const { fetchTrucks } = useTruckStore.getState();
            await fetchTrucks();
            const updatedTruckState = useTruckStore.getState();
            const refreshedTruck = updatedTruckState.trucks?.find(t => t.id === currentTruck.id);
            console.log('📦 Final update data:', updateData);
            console.log('🚀 Calling updateTruckAPI for truck ID:', currentTruck.id);

            console.log('🔄 Fetching latest trucks data...');
            await fetchTrucks();
            console.log('🔍 Truck state after refresh:', {
                id: refreshedTruck?.id,
                noticket: refreshedTruck?.noticket,
                status: refreshedTruck?.status,
                department: refreshedTruck?.department,
                starttimbang: refreshedTruck?.starttimbang,
                finishtimbang: refreshedTruck?.finishtimbang,
                runtohpc: refreshedTruck?.runtohpc,
                runtopt: refreshedTruck?.runtopt
            });
        } catch (error) {
            console.error('Error updating truck:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            alert(`Error updating truck: ${errorMessage}`);
        } finally {
            closeActionModal();
        }
    };
    const handleSmartAction = async (action: string, actionType: ActionType) => {
        try {
            switch (actionType) {
                case 'normal':
                    return await handleAction(action);
                case 'skip':
                    return await handleSkipAction(action);
                case 'continue':
                    return await handleContinueAction(action);
            }
        } catch (error) {
            console.error(`Error in ${actionType} action:`, error);
            alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            closeActionModal();
        }
    };
    const handleSkipAction = async (action: string) => {
        if (!currentTruck) return;
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
        let updateData: any = {};
        let skippedSteps: string[] = [];
        if (action === 'Lewat ke Mulai Muat/Bongkar') {
            if (availableActions.includes('Mulai Timbang Gross')) {
                if (currentTruck.department === 'PT') {
                    skippedSteps = ['Mulai Timbang Gross', 'Selesai Timbang Gross', 'Menuju PT', 'Masuk PT'];
                } else {
                    skippedSteps = ['Mulai Timbang Neto', 'Selesai Timbang Neto', 'Menuju HPC', 'Masuk HPC'];
                }
            } else if (availableActions.includes('Selesai Timbang Gross')) {
                if (currentTruck.department === 'PT') {
                    skippedSteps = ['Menuju PT', 'Masuk PT'];
                } else {
                    skippedSteps = ['Menuju HPC', 'Masuk HPC'];
                }
            } else if (availableActions.includes('Menuju HPC')) {
                skippedSteps = ['Menuju HPC', 'Masuk HPC'];
            } else if (availableActions.includes('Masuk HPC')) {
                skippedSteps = ['Masuk HPC'];
            } else if (availableActions.includes('Menuju PT')) {
                skippedSteps = ['Menuju PT', 'Masuk PT'];
            } else if (availableActions.includes('Masuk PT')) {
                skippedSteps = ['Masuk PT'];
            }
            updateData = {
                startloadingtime: sqlTimeFormat,
                status: currentTruck.operation === 'muat' ? 'loading' : 'unloading',
                skipped_steps: skippedSteps.join(','),
                skip_reason: `Skipped via ${action}`
            };
        }
        await updateTruckAPI(Number(currentTruck.id), updateData);
        const { useTruckStore } = await import('@/store/truckStore');
        const { fetchTrucks } = useTruckStore.getState();
        await fetchTrucks();
        closeActionModal();
    };
    // const handleContinueAction = async (action: string) => {
    //     if (!currentTruck) return;
    //     const targetDepartment = action.includes('PT') ? 'PT' : 'HPC';
    //     const currentHistory = currentTruck.department_history || currentTruck.department;
    //     const sqlTimeFormat = format(new Date(), 'HH:mm:ss');
    //     const updateData = {
    //         department: targetDepartment,
    //         status: 'waiting',
    //         runtohpc: null,
    //         entryhpc: null,
    //         runtopt: targetDepartment === 'PT' ? sqlTimeFormat : null,
    //         entrypt: null,
    //         waitingforarrivalhpc: null,
    //         waitingforarrivalpt: null,
    //         startloadingtime: null,
    //         finishloadingtime: null,
    //         totalprocessloadingtime: null,
    //         actualwaitloadingtime: null,
    //         loading_cycle: String((currentTruck.loading_cycle || 1) + 1),
    //         department_history: `${currentHistory},${targetDepartment}`
    //     };
    //     await updateTruckAPI(Number(currentTruck.id), updateData);
    //     const { useTruckStore } = await import('@/store/truckStore');
    //     const { fetchTrucks } = useTruckStore.getState();
    //     await fetchTrucks();
    //     closeActionModal();
    // };


    // const handleContinueAction = async (action: string) => {
    //     if (!currentTruck) return;
    //     const targetDepartment = action.includes('PT') ? 'PT' : 'HPC';
    //     const currentHistory = currentTruck.department_history || currentTruck.department;
    //     const sqlTimeFormat = format(new Date(), 'HH:mm:ss');
    //     const isTimbangAction = action.includes('Timbang Neto ke');
    //     let updateData: any = {
    //         department: targetDepartment,
    //         status: 'waiting',
    //         runtohpc: targetDepartment === 'HPC' ? sqlTimeFormat : null,
    //         entryhpc: null,
    //         runtopt: targetDepartment === 'PT' ? sqlTimeFormat : null,
    //         entrypt: null,
    //         waitingforarrivalhpc: null,
    //         waitingforarrivalpt: null,
    //         startloadingtime: null,
    //         finishloadingtime: null,
    //         totalprocessloadingtime: null,
    //         actualwaitloadingtime: null,
    //         loading_cycle: String((currentTruck.loading_cycle || 1) + 1),
    //         department_history: `${currentHistory},${targetDepartment}`
    //     };
    //     if (isTimbangAction) {
    //         updateData.skipped_steps = 'Memulai Muat/Bongkar,Selesai Muat/Bongkar';
    //         updateData.skip_reason = `Timbang langsung ke ${targetDepartment}`;
    //     } else {
    //         updateData.skipped_steps = null;
    //         updateData.skip_reason = null;
    //     }

    //     await updateTruckAPI(Number(currentTruck.id), updateData);
    //     const { useTruckStore } = await import('@/store/truckStore');
    //     const { fetchTrucks } = useTruckStore.getState();
    //     await fetchTrucks();
    //     closeActionModal();
    // };
    const handleContinueAction = async (action: string) => {
        if (!currentTruck) return;

        // Tentukan department berdasarkan action
        let targetDepartment = 'HPC'; // default
        if (action.includes('PT')) {
            targetDepartment = 'PT';
        } else if (action.includes('PBPG')) {
            targetDepartment = 'PBPG';
        } else if (action.includes('HPC')) {
            targetDepartment = 'HPC';
        }

        const currentHistory = currentTruck.department_history || currentTruck.department;
        const sqlTimeFormat = format(new Date(), 'HH:mm:ss');
        const isTimbangAction = action.includes('Timbang Neto ke');

        let updateData: any = {
            department: targetDepartment,
            status: 'waiting',

            // if HPC OR PBPG →  runtohpc
            runtohpc: (targetDepartment === 'HPC' || targetDepartment === 'PBPG') ? sqlTimeFormat : null,
            entryhpc: null,

            // if PT →  runtopt
            runtopt: targetDepartment === 'PT' ? sqlTimeFormat : null,
            entrypt: null,

            waitingforarrivalhpc: null,
            waitingforarrivalpt: null,
            startloadingtime: null,
            finishloadingtime: null,
            totalprocessloadingtime: null,
            actualwaitloadingtime: null,
            loading_cycle: String((currentTruck.loading_cycle || 1) + 1),
            department_history: `${currentHistory},${targetDepartment}`
        };

        if (isTimbangAction) {
            updateData.skipped_steps = 'Memulai Muat/Bongkar,Selesai Muat/Bongkar';
            updateData.skip_reason = `Timbang langsung ke ${targetDepartment}`;
        } else {
            updateData.skipped_steps = null;
            updateData.skip_reason = null;
        }

        await updateTruckAPI(Number(currentTruck.id), updateData);
        const { useTruckStore } = await import('@/store/truckStore');
        const { fetchTrucks } = useTruckStore.getState();
        await fetchTrucks();
        closeActionModal();
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
                    <div className="text-center text-sm text-gray-600 mt-2 space-y-2">
                        <div className="flex flex-wrap justify-center gap-2">
                            <span className="inline-flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
                                <span className="font-medium">{currentTruck.platenumber}</span>
                                <span className="text-gray-400">•</span>
                                <span className="capitalize">{currentTruck.operation}</span>
                                <span className="text-gray-400">•</span>
                                <span className="font-medium">{currentTruck.department}</span>
                            </span>
                            {/* Loading cycle indicator */}
                            {(currentTruck.loading_cycle || 1) > 1 && (
                                <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                    <RotateCcw className="w-3 h-3" />
                                    <span className="text-xs">Cycle #{currentTruck.loading_cycle}</span>
                                </span>
                            )}
                        </div>
                        <div className="flex justify-center gap-2">
                            <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                                Status: <span className="font-medium capitalize">{currentTruck.status}</span>
                            </span>
                            {/* Skip indicator */}
                            {currentTruck.skipped_steps && (
                                <span className="inline-flex items-center gap-1 bg-orange-50 text-orange-700 px-2 py-1 rounded-full">
                                    <SkipForward className="w-3 h-3" />
                                    <span className="text-xs">Ada Step Dilewati</span>
                                </span>
                            )}
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
                            const cardColor = status === 'skipped'
                                ? 'bg-gray-200 border-2 border-dashed border-orange-400'
                                : status === 'pending'
                                    ? 'bg-gray-300'
                                    : step.color;
                            const iconColor = status === 'skipped'
                                ? 'text-orange-500'
                                : status === 'pending'
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
                                            {status === 'skipped' ? (
                                                <SkipForward className={`w-4 h-4 sm:w-6 sm:h-6 md:w-8 md:h-8 ${iconColor}`} strokeWidth={2} />
                                            ) : (
                                                <Icon className={`w-4 h-4 sm:w-6 sm:h-6 md:w-8 md:h-8 ${iconColor}`} strokeWidth={2} />
                                            )}
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
                                        {status === 'skipped' && (
                                            <span className="mt-1 text-xs text-orange-600 font-medium">Lewat</span>
                                        )}
                                    </div>
                                    {/* Arrow Lines */}
                                    {!isLast && (
                                        <>
                                            {/* Horizontal arrow for same row */}
                                            {!isLastInRow && (
                                                <div className="flex items-center mt-4 sm:mt-6">
                                                    <div className={`arrow-line horizontal ${status === 'completed' ? 'completed' : status === 'skipped' ? 'skipped' : 'pending'}`}></div>
                                                </div>
                                            )}
                                            {/* Vertical arrow for row transition */}
                                            {isLastInRow && (
                                                <div className="w-full flex justify-center relative" style={{ order: index + 0.5 }}>
                                                    <div className={`arrow-line vertical ${status === 'completed' ? 'completed' : status === 'skipped' ? 'skipped' : 'pending'}`}></div>
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
                    <div className="flex-1 space-y-4">
                        {/* Normal Actions Section */}
                        {smartActions.normalActions.length > 0 && (
                            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                    <p className="font-semibold text-blue-800 text-sm">Aksi Normal</p>
                                </div>
                                <div className="space-y-2">
                                    {smartActions.normalActions.map((action) => (
                                        <button
                                            key={action}
                                            onClick={() => handleSmartAction(action, 'normal')}
                                            className="w-full bg-blue-500 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 hover:scale-[1.02] hover:shadow-lg flex items-center justify-center gap-2"
                                        >
                                            <span>{action}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        {/* Skip Actions Section */}
                        {smartActions.skipActions.length > 0 && (
                            <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                                    <p className="font-semibold text-orange-800 text-sm">Lewati Step</p>
                                </div>
                                <div className="space-y-2">
                                    {smartActions.skipActions.map((action) => (
                                        <button
                                            key={action}
                                            onClick={() => handleSmartAction(action, 'skip')}
                                            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 hover:scale-[1.02] hover:shadow-lg flex items-center justify-center gap-2"
                                        >
                                            <SkipForward className="w-4 h-4" />
                                            <span>{action}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        {/* Continue Actions Section */}
                        {smartActions.continueActions.length > 0 && (
                            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                    <p className="font-semibold text-green-800 text-sm">Lanjut Muat/Bongkar</p>
                                </div>
                                <div className="space-y-2">
                                    {smartActions.continueActions.map((action) => (
                                        <button
                                            key={action}
                                            onClick={() => handleSmartAction(action, 'continue')}
                                            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 hover:scale-[1.02] hover:shadow-lg flex items-center justify-center gap-2"
                                        >
                                            <RotateCcw className="w-4 h-4" />
                                            <span>{action}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        {/* No Actions Available */}
                        {smartActions.normalActions.length === 0 && smartActions.skipActions.length === 0 && smartActions.continueActions.length === 0 && (
                            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 text-center">
                                <div className="text-gray-400 mb-2">
                                    <AlertCircle className="w-8 h-8 mx-auto" />
                                </div>
                                <p className="text-gray-500 text-sm">Tidak ada aksi tersedia</p>
                            </div>
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
                .arrow-line.skipped {
                    background: linear-gradient(to right, #fb923c, #f97316);
                    opacity: 0.7;
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
                .arrow-line.horizontal.skipped::after {
                    border-left: 8px solid #f97316;
                    opacity: 0.7;
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
                .arrow-line.vertical.skipped::after {
                    border-top: 8px solid #f97316;
                    opacity: 0.7;
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
