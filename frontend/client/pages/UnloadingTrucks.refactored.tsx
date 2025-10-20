import TrucksTableComponent from '@/components/trucks/shared/TruckTableShared';
import { unloadingTrucksConfig } from '@/components/trucks/config/trucksConfig';

export default function UnloadingTrucks() {
    return <TrucksTableComponent config={unloadingTrucksConfig} />;
}