// TODO Image Still not Exist
// TODO Make a button print ticket 
// TODO Make a Weighing Menu before unloading

import TrucksTableComponent from '@/components/trucks/shared/TruckTableShared';
import { unloadingTrucksConfig } from '@/components/trucks/config/trucksConfig';

export default function UnloadingTrucks() {
    return <TrucksTableComponent config={unloadingTrucksConfig} />;
}