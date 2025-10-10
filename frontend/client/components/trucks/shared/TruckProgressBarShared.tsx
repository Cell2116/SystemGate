// src/components/trucks/shared/TrucksProgressBar.tsx
import { FilterStatus, TrucksTableConfig } from '@/types/truck.types';

interface ProgressBarProps {
    pendingCount: number;
    weighingCount?: number; // Optional weighing count
    loadingCount: number;
    finishedCount: number;
    selectedStatus: FilterStatus;
    onStatusChange: (status: FilterStatus) => void;
    config: TrucksTableConfig; // Add config to determine if weighing should be shown
}

export default function TrucksProgressBar({
    pendingCount,
    weighingCount = 0,
    loadingCount,
    finishedCount,
    selectedStatus,
    onStatusChange,
    config
}: ProgressBarProps) {
    const baseSteps = [
        {
            id: 1,
            label: "Waiting",
            status: "Waiting",
            color: "bg-yellow-500",
            borderColor: "border-yellow-500",
            count: (<span>{pendingCount} <span className="text-sm opacity-70 italic">Truck</span></span>),
            isActive: selectedStatus === "Waiting" || selectedStatus === "waiting"
        }
    ];

    const steps = [...baseSteps];

    // Add weighing step only for bongkar operation
    if (config.statusMapping.weighing) {
        steps.push({
            id: 2,
            label: "Weighing",
            status: "Weighing",
            color: "bg-cyan-500",
            borderColor: "border-cyan-500",
            count: (<span>{weighingCount} <span className="text-sm opacity-70 italic text-cyan-500">Truck</span></span>),
            isActive: selectedStatus === "Weighing" || selectedStatus === "weighing" || selectedStatus === "timbang"
        });
    }

    // Add loading step
    steps.push({
        id: config.statusMapping.weighing ? 3 : 2,
        label: config.operation === 'bongkar' ? "Unloading" : "Loading",
        status: "Loading",
        color: "bg-blue-500",
        borderColor: "border-blue-500",
        count: (<span>{loadingCount} <span className="text-sm opacity-70 italic">Truck</span></span>),
        isActive: selectedStatus === "Loading" || selectedStatus === "loading" || selectedStatus === "unloading"
    });

    // Add finished step
    steps.push({
        id: config.statusMapping.weighing ? 4 : 3,
        label: "Finished",
        status: "Finished",
        color: "bg-green-500",
        borderColor: "border-green-500",
        count: (<span>{finishedCount} <span className="text-sm opacity-70 italic">Truck</span></span>),
        isActive: selectedStatus === "Finished" || selectedStatus === "finished"
    });

    const handleStepClick = (status: "Waiting" | "Weighing" | "Loading" | "Finished") => {
        onStatusChange(selectedStatus === status ? "all" : status);
    };

    return (
        <div className="w-full max-w-2xl mx-auto mb-8">
            <div className="flex items-center justify-between relative">
                {/* Progress line */}
                <div className="absolute top-4 left-0 w-full h-0.5 bg-gray-200 z-0"></div>
                <div className="absolute top-4 left-0 w-full h-0.5 bg-blue-500 z-0"></div>

                {steps.map((step, index) => (
                    <div
                        key={step.id}
                        className="flex flex-col items-center relative z-10 cursor-pointer group"
                        onClick={() => handleStepClick(step.status as "Waiting" | "Weighing" | "Loading" | "Finished")}
                    >
                        {/* Step circle */}
                        <div className={`w-8 h-8 rounded-full ${step.color} border-4 ${step.isActive ? 'border-gray-800' : 'border-white'
                            } shadow-lg flex items-center justify-center transition-all duration-200 group-hover:scale-110 ${step.isActive ? 'ring-2 ring-gray-400' : ''
                            }`}>
                            <span className="text-white font-bold text-sm">{step.id}</span>
                        </div>

                        {/* Step label */}
                        <div className="mt-2 text-center">
                            <p className={`text-sm font-medium ${step.isActive ? 'text-gray-900 font-bold' : 'text-gray-700'
                                }`}>
                                {step.label}
                            </p>
                            <p className={`text-lg font-bold ${step.color.replace('bg-', 'text-')} ${step.isActive ? 'text-xl' : ''
                                }`}>
                                {step.count}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filter indicator */}
            <div className="text-center mt-4">
                {selectedStatus === "all" ? (
                    <p className="text-sm text-gray-500">Showing all trucks</p>
                ) : (
                    <p className="text-sm text-gray-700">
                        Showing <span className="font-semibold">{selectedStatus}</span> trucks
                        <button
                            onClick={() => onStatusChange("all")}
                            className="ml-2 text-blue-600 hover:text-blue-800 text-xs underline"
                        >
                            Show all
                        </button>
                    </p>
                )}
            </div>
        </div>
    );
}
