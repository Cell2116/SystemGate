// Komponen untuk mengubah status truck secara manual
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TruckOperation } from '@/types/truck.types';
interface StatusSelectorProps {
    currentStatus: string;
    operation: TruckOperation;
    onStatusChange: (newStatus: string) => void;
    disabled?: boolean;
}
export default function StatusSelector({ 
    currentStatus, 
    operation, 
    onStatusChange, 
    disabled = false 
}: StatusSelectorProps) {
    
    const getStatusOptions = () => {
        if (operation === 'bongkar') {
            return [
                { value: 'Waiting', label: 'Waiting (Menunggu)' },
                { value: 'Weighing', label: 'Weighing (Sedang Timbang)' },
                { value: 'Loading', label: 'Loading (Sedang Bongkar)' },
                { value: 'Finished', label: 'Finished (Selesai)' }
            ];
        } else {
            return [
                { value: 'Waiting', label: 'Waiting (Menunggu)' },
                { value: 'Loading', label: 'Loading (Sedang Muat)' },
                { value: 'Finished', label: 'Finished (Selesai)' }
            ];
        }
    };
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Waiting': return 'text-yellow-600';
            case 'Weighing': return 'text-blue-600';
            case 'Loading': return 'text-orange-600';
            case 'Finished': return 'text-green-600';
            default: return 'text-gray-600';
        }
    };
    return (
        <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
                Status Truck
            </label>
            <Select 
                value={currentStatus} 
                onValueChange={onStatusChange}
                disabled={disabled}
            >
                <SelectTrigger className="w-full">
                    <SelectValue>
                        <span className={getStatusColor(currentStatus)}>
                            {getStatusOptions().find(opt => opt.value === currentStatus)?.label || currentStatus}
                        </span>
                    </SelectValue>
                </SelectTrigger>
                <SelectContent>
                    {getStatusOptions().map(option => (
                        <SelectItem key={option.value} value={option.value}>
                            <span className={getStatusColor(option.value)}>
                                {option.label}
                            </span>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {operation === 'bongkar' && (
                <p className="text-xs text-gray-500">
                    Workflow: Waiting → Weighing → Loading (Bongkar) → Finished
                </p>
            )}
            {operation === 'muat' && (
                <p className="text-xs text-gray-500">
                    Workflow: Waiting → Loading (Muat) → Finished
                </p>
            )}
        </div>
    );
}