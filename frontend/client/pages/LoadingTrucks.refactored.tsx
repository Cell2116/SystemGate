// TODO Image Still not Exist
// TODO Make a button print ticket 
import TrucksTableComponent from '@/components/trucks/shared/TruckTableShared';
import { loadingTrucksConfig } from '@/components/trucks/config/trucksConfig';

export default function LoadingTrucks() {
    return <TrucksTableComponent config={loadingTrucksConfig} />;
}