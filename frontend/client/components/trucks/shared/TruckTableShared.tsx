
import { Eye, Edit } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useTrucksWithFetch, CombinedTruckData } from "@/store/truckStore";
import TrucksProgressBar from "./TruckProgressBarShared";
import TrucksSearchBar from "./TruckSearchBarShared";
import TruckDetailModal from "../shared/modal/TruckDetailModal";
import TruckEditModal from "../shared/modal/TruckEditModal";
import { TrucksTableConfig, FilterStatus } from '@/types/truck.types';
import { formatIsoForDisplay } from "@/lib/utils";
interface TrucksTableComponentProps {
    config: TrucksTableConfig;
}
export default function TrucksTableComponent({ config }: TrucksTableComponentProps) {
    const [selectedStatus, setSelectedStatus] = useState<FilterStatus>("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedTruck, setSelectedTruck] = useState<CombinedTruckData | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editFormData, setEditFormData] = useState<CombinedTruckData | null>(null);
    const [suratJalanRecommendations, setSuratJalanRecommendations] = useState<string[]>([]);
    const handleStatusChange = (status: FilterStatus) => {
        setSelectedStatus(status);
    }
    const {
        trucks: allTrucks,
        loading,
        error,
        refetch,
        updateTruckAPI,
        fetchExistingSuratJalan,
        saveSuratJalanToDatabase
    } = useTrucksWithFetch({
        searchTerm: searchTerm || undefined,
    });
    const trucks = allTrucks.filter(truck => truck.operation === config.operation);
    useEffect(() => {
        if (isEditModalOpen && config.features.suratJalanRecommendations) {
            loadSuratJalanRecommendations();
        }
    }, [isEditModalOpen]);
    const pendingCount = trucks.filter(truck =>
        config.statusMapping.waiting.includes(truck.status as any)
    ).length;
    
    const weighingCount = trucks.filter(truck =>
        config.statusMapping.weighing?.includes(truck.status as any) || false
    ).length;
    const loadingCount = trucks.filter(truck =>
        config.statusMapping.loading.includes(truck.status as any)
    ).length;
    
    const finishedCount = trucks.filter(truck =>
        config.statusMapping.finished.includes(truck.status as any)
    ).length;
    const exitCount = trucks.filter(truck =>
        config.statusMapping.exit.includes(truck.status as any)
    ).length;
    const filteredTrucks = trucks.filter(truck => {
        // First apply search filter
        const matchesSearch = !searchTerm ||
            truck.platenumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            truck.driver?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            truck.goods?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            truck.supplier?.toLowerCase().includes(searchTerm.toLowerCase());
        if (selectedStatus === "all") {
            return matchesSearch;
        }        
        const matchesStatus = 
            truck.status === selectedStatus ||
            ((selectedStatus === "Waiting" || selectedStatus === "waiting") && config.statusMapping.waiting.includes(truck.status as any)) ||
            ((selectedStatus === "Weighing" || selectedStatus === "weighing" || selectedStatus === "timbang") && config.statusMapping.weighing?.includes(truck.status as any)) ||
            ((selectedStatus === "Loading" || selectedStatus === "loading" || selectedStatus === "unloading") && config.statusMapping.loading.includes(truck.status as any)) ||
            ((selectedStatus === "Finished" || selectedStatus === "finished") && config.statusMapping.finished.includes(truck.status as any)) ||
            ((selectedStatus === "exit" || selectedStatus === 'Exit' ) && config.statusMapping.exit.includes(truck.status as any)) ||
            (selectedStatus === "pending" && config.statusMapping.waiting.includes(truck.status as any));
            
        return matchesSearch && matchesStatus;
    });    
    const loadSuratJalanRecommendations = async () => {
        if (!config.features.suratJalanRecommendations) return;
        try {
            const existingData = await fetchExistingSuratJalan();
            let dataArray: any[] = [];
            if (!existingData) {
                dataArray = [];
            } else if (Array.isArray(existingData)) {
                dataArray = existingData;
            } else {
                try {
                    const maybeRows = (existingData as any).rows || (existingData as any).data;
                    if (Array.isArray(maybeRows)) dataArray = maybeRows;
                    else dataArray = [];
                } catch (e) {
                    dataArray = [];
                }
            }
            const suratJalanNumbers = dataArray
                .map((item: any) => item.nosj || item.noSuratJalan || item.nomor)
                .filter(Boolean);
            
            setSuratJalanRecommendations(suratJalanNumbers);
        } catch (error) {
            console.error('❌ Error loading surat jalan recommendations:', error);
            setSuratJalanRecommendations([]);
        }
    };
    const handleDetailView = (truck: CombinedTruckData) => {
        setSelectedTruck(truck);
        setIsDetailModalOpen(true);
    };
    const handleEditTruck = (truck: CombinedTruckData) => {
        setEditFormData({ ...truck });
        setIsEditModalOpen(true);
        if (config.features.suratJalanRecommendations) {
            loadSuratJalanRecommendations();
        }
    };
    // const handleSaveEdit = async () => {
    //     if (editFormData) {
    //         try {
    //             const cleanedEditData = { ...editFormData };
    //             if (cleanedEditData.loading_cycle !== undefined) {
    //                 const cycle = parseInt(cleanedEditData.loading_cycle as any, 10);
    //                 if (!isNaN(cycle) && cycle > 0) {
    //                     cleanedEditData.loading_cycle = cycle as any;
    //                 } else {
    //                     delete (cleanedEditData as any).loading_cycle;
    //                 }
    //             }
    //             // delete (cleanedEditData as any).loading_cycle;
    //             // delete (cleanedEditData as any).cycle_number;
    //             (['arrivalTime', 'startLoadingTime', 'finishloadingtime', 'eta', 'tglsj', 'date'] as (keyof CombinedTruckData)[]).forEach(field => {
    //                 if (cleanedEditData[field] === "") (cleanedEditData as any)[field] = null;
    //             });
    //             if (config.features.suratJalanRecommendations && cleanedEditData.nosj && cleanedEditData.nosj.trim()) {
    //                 await saveSuratJalanToDatabase(cleanedEditData.nosj.trim().toUpperCase());
    //             }
    //             await updateTruckAPI(cleanedEditData.id, cleanedEditData);
    //             setIsEditModalOpen(false);
    //             setEditFormData(null);
    //             setSuratJalanRecommendations([]);
    //         } catch (error) {
    //             console.error('Error updating truck:', error);
    //         }
    //     }
    // };
    const handleSaveEdit = async () => {
        if (editFormData) {
            try {
                // ✅ HANYA kirim field yang ada di form modal
                const updatePayload = {
                    id: editFormData.id,
                    platenumber: editFormData.platenumber,
                    driver: editFormData.driver,
                    nikdriver: editFormData.nikdriver,
                    tlpdriver: editFormData.tlpdriver,
                    department: editFormData.department,
                    status: editFormData.status,
                    goods: editFormData.goods,
                    supplier: editFormData.supplier,
                    statustruck: editFormData.statustruck,
                    armada: editFormData.armada,
                    jenismobil: editFormData.jenismobil,
                    type: editFormData.type,
                    descin: editFormData.descin,
                    descout: editFormData.descout,
                };

                if (config.features.suratJalanRecommendations) {
                    (updatePayload as any).nosj = editFormData.nosj || '';

                    if (editFormData.nosj && editFormData.nosj.trim()) {
                        await saveSuratJalanToDatabase(editFormData.nosj.trim().toUpperCase());
                    }
                }

                console.log('📤 Update payload (only form fields):', updatePayload);

                await updateTruckAPI(editFormData.id, updatePayload as any);
                setIsEditModalOpen(false);
                setEditFormData(null);
                setSuratJalanRecommendations([]);
            } catch (error) {
                console.error('Error updating truck:', error);
            }
        }
    };
    
    const handleFormChange = (field: keyof CombinedTruckData, value: string | null | undefined) => {
        if (editFormData) {
            const safeValue = typeof value === 'string' ? value : '';
            let processedValue = safeValue;
            if (field === 'nosj') {
                processedValue = safeValue.trim().toUpperCase();
            }
            setEditFormData({
                ...editFormData,
                [field]: processedValue
            });
        }
    };
    const handleRefresh = () => {
        refetch();
    };
    
    if (loading) {
        return (
            <div className="relative h-[calc(80vh-1rem)] p-2 sm:p-3">
                <div className="flex items-center justify-center h-64 pt-8 sm:pt-4">
                    <div className="text-sm sm:text-lg text-center px-4">Loading trucks data from database...</div>
                </div>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="relative h-[calc(80vh-1rem)] p-2 sm:p-3">
                <div className="flex flex-col items-center justify-center h-64 pt-8 sm:pt-4">
                    <div className="text-red-600 mb-4 text-sm sm:text-base text-center px-4">Error loading trucks: {error}</div>
                    <Button onClick={handleRefresh} variant="outline" size="sm">
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }
    return (
        <div className="relative h-[calc(80vh-1rem)] p-2 sm:p-3">
            {/* <div className="absolute right-1 top-1 scale-75 sm:scale-100">
                <Clock2 />
            </div> */}
            {/* Header */}
            <div className="mb-3">
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                    <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800">
                        {config.title}
                        <span className={`${config.subtitleColor} italic opacity-75 text-sm sm:text-base lg:text-lg`}>{config.subtitle}</span>
                    </h1>
                </div>
                {/* Progress Bar */}
                <TrucksProgressBar
                    pendingCount={pendingCount}
                    weighingCount={weighingCount}
                    loadingCount={loadingCount}
                    finishedCount={finishedCount}
                    exitCount={exitCount}
                    selectedStatus={selectedStatus}
                    onStatusChange={handleStatusChange}
                    config={config}
                    // trucks={filteredTrucks}
                />
            </div>
            {/* Search Bar */}
            <TrucksSearchBar
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onRefresh={handleRefresh}
                filteredCount={filteredTrucks.length}
                selectedStatus={selectedStatus}
            />
            {/* Truck Table */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto xl:h-[50vh] sm:h-[50vh] h-[60vh] overflow-y-auto">
                    <table className="w-full min-w-[800px]">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                            <tr>
                                <th className="px-2 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                                    Plate Number
                                </th>
                                <th className="px-2 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                                    Driver
                                </th>
                                <th className="px-2 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                                    Goods
                                </th>
                                <th className="px-2 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                                    Supplier
                                </th>
                                <th className="px-2 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">
                                    Status
                                </th>
                                <th className="px-2 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                                    Vehicle Type
                                </th>
                                <th className="px-2 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[130px]">
                                    Arrival Time
                                </th>
                                <th className="px-2 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredTrucks.map((truck) => (
                                <tr key={truck.id} className="hover:bg-gray-50">
                                    <td className="px-2 py-2 sm:px-4 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                                        <div className="font-mono">{truck.platenumber}</div>
                                    </td>
                                    <td className="px-2 py-2 sm:px-4 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600">
                                        {truck.driver}
                                    </td>
                                    <td className="px-2 py-2 sm:px-4 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600">
                                        {truck.goods}
                                    </td>
                                    <td className="px-2 py-2 sm:px-4 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600">
                                        <span className="inline-flex text-xs font-semibold text-purple-600">
                                            {truck.supplier}
                                        </span>
                                    </td>
                                    <td className="px-2 py-2 sm:px-4 sm:py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-1 py-1 sm:px-2 text-xs font-semibold rounded-full ${
                                            truck.status === 'waiting' ? 'bg-yellow-100 text-yellow-800' :
                                            truck.status === 'timbang' ? 'bg-cyan-100 text-cyan-800' :
                                            truck.status === 'loading' ? 'bg-blue-100 text-blue-800' :
                                            truck.status === 'unloading' ? 'bg-blue-100 text-blue-800' :
                                            truck.status === 'finished' ? 'bg-green-100 text-green-800' :
                                            'bg-red-100 text-red-800'
                                        }`}>
                                            {truck.status === 'loading' && config.operation === 'bongkar' 
                                                ? 'UNLOADING' 
                                                : truck.status.toUpperCase()
                                            }
                                        </span>
                                    </td>
                                    <td className="px-2 py-2 sm:px-4 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600">
                                        {truck.jenismobil || '-'}
                                    </td>
                                    <td className="px-2 py-2 sm:px-4 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600">
                                        <div className="font-mono text-xs">{formatIsoForDisplay(truck.arrivaltime) || '-'}</div>
                                    </td>
                                    <td className="px-2 py-2 sm:px-4 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600">
                                        <div className="flex space-x-1 sm:space-x-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleDetailView(truck)}
                                                className="h-6 w-6 sm:h-8 sm:w-8 p-0"
                                            >
                                                <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleEditTruck(truck)}
                                                className="h-6 w-6 sm:h-8 sm:w-8 p-0"
                                            >
                                                <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {/* Detail Modal */}
            <TruckDetailModal
                truck={selectedTruck}
                isOpen={isDetailModalOpen}
                onClose={setIsDetailModalOpen}
            />
            {/* Edit Modal */}
            <TruckEditModal
                truck={editFormData}
                isOpen={isEditModalOpen}
                onClose={setIsEditModalOpen}
                onSave={handleSaveEdit}
                onChange={handleFormChange}
                showSuratJalanRecommendations={config.features.suratJalanRecommendations}
                suratJalanRecommendations={suratJalanRecommendations}
            />
        </div>
        
    );
}
