import TrucksTableComponent from '@/components/trucks/shared/TruckTableShared';
import { weighingTrucksConfig } from '@/components/trucks/config/trucksConfig';

export default function WeighingTrucks() {
    return <TrucksTableComponent config={weighingTrucksConfig} />;
}