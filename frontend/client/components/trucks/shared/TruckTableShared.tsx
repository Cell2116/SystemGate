// src/components/trucks/shared/TrucksTableComponent.tsx
import { Eye, Edit } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useTrucksWithFetch, TruckRecord } from "@/store/truckStore";
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
    const [selectedTruck, setSelectedTruck] = useState<TruckRecord | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editFormData, setEditFormData] = useState<TruckRecord | null>(null);
    const [suratJalanRecommendations, setSuratJalanRecommendations] = useState<string[]>([]);

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
        status: selectedStatus === "all" ? undefined : selectedStatus
    });

    // Filter trucks by operation
    const trucks = allTrucks.filter(truck => truck.operation === config.operation);

    // Load recommendations when edit modal opens (only for loading trucks)
    useEffect(() => {
        if (isEditModalOpen && config.features.suratJalanRecommendations) {
            loadSuratJalanRecommendations();
        }
    }, [isEditModalOpen]);

    // Calculate counts for each status
    console.log('🔍 Debug Counts Calculation:');
    console.log('Total trucks:', trucks.length);
    console.log('Config status mapping:', config.statusMapping);
    console.log('Truck statuses:', trucks.map(t => t.status));
    
    const pendingCount = trucks.filter(truck =>
        config.statusMapping.waiting.includes(truck.status as any)
    ).length;
    console.log('Pending count:', pendingCount, 'for statuses:', config.statusMapping.waiting);

    const weighingCount = trucks.filter(truck =>
        config.statusMapping.weighing?.includes(truck.status as any) || false
    ).length;
    console.log('Weighing count:', weighingCount, 'for statuses:', config.statusMapping.weighing);

    const loadingCount = trucks.filter(truck =>
        config.statusMapping.loading.includes(truck.status as any)
    ).length;
    console.log('Loading count:', loadingCount, 'for statuses:', config.statusMapping.loading);

    const finishedCount = trucks.filter(truck =>
        config.statusMapping.finished.includes(truck.status as any)
    ).length;
    console.log('Finished count:', finishedCount, 'for statuses:', config.statusMapping.finished);

    // Filter trucks based on search and status
    console.log('🔍 Debug Filter Logic:');
    console.log('Selected status:', selectedStatus);
    console.log('Selected status type:', typeof selectedStatus);
    
    const filteredTrucks = trucks.filter(truck => {
        const matchesSearch = !searchTerm ||
            truck.plateNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            truck.driver?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            truck.goods?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            truck.supplier?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = selectedStatus === "all" || 
            truck.status === selectedStatus ||
            // Handle "Waiting" from progress bar and "waiting" from other sources
            ((selectedStatus === "Waiting" || selectedStatus === "waiting") && config.statusMapping.waiting.includes(truck.status as any)) ||
            // Handle "Weighing" from progress bar and "weighing"/"timbang" from other sources  
            ((selectedStatus === "Weighing" || selectedStatus === "weighing" || selectedStatus === "timbang") && config.statusMapping.weighing?.includes(truck.status as any)) ||
            // Handle "Loading" from progress bar and "loading"/"unloading" from other sources
            ((selectedStatus === "Loading" || selectedStatus === "loading" || selectedStatus === "unloading") && config.statusMapping.loading.includes(truck.status as any)) ||
            // Handle "Finished" from progress bar and "finished" from other sources
            ((selectedStatus === "Finished" || selectedStatus === "finished") && config.statusMapping.finished.includes(truck.status as any)) ||
            // Legacy support for "pending"
            (selectedStatus === "pending" && config.statusMapping.waiting.includes(truck.status as any));

        if (selectedStatus !== "all") {
            console.log(`Truck ${truck.plateNumber} (${truck.status}): matchesStatus = ${matchesStatus}`);
        }

        return matchesSearch && matchesStatus;
    });
    
    console.log('Filtered trucks count:', filteredTrucks.length);

    const loadSuratJalanRecommendations = async () => {
        if (!config.features.suratJalanRecommendations) return;

        try {
            console.log('🔄 Loading surat jalan recommendations...');
            const existingData = await fetchExistingSuratJalan();
            console.log('📊 Raw data from database:', existingData);

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

            console.log('📋 Processed recommendations:', suratJalanNumbers);
            setSuratJalanRecommendations(suratJalanNumbers);
        } catch (error) {
            console.error('❌ Error loading surat jalan recommendations:', error);
            setSuratJalanRecommendations([]);
        }
    };

    const handleDetailView = (truck: TruckRecord) => {
        setSelectedTruck(truck);
        setIsDetailModalOpen(true);
    };

    const handleEditTruck = (truck: TruckRecord) => {
        setEditFormData({ ...truck });
        setIsEditModalOpen(true);
        if (config.features.suratJalanRecommendations) {
            loadSuratJalanRecommendations();
        }
    };

    const handleSaveEdit = async () => {
        if (editFormData) {
            try {
                console.log('=== SAVE EDIT ===');
                console.log('Edit form data:', editFormData);
                const cleanedEditData = { ...editFormData };
                delete cleanedEditData.quantity;
                delete cleanedEditData.unit;

                (['arrivalTime', 'startLoadingTime', 'finishloadingtime', 'eta', 'tglsj', 'date'] as (keyof TruckRecord)[]).forEach(field => {
                    if (cleanedEditData[field] === "") (cleanedEditData as any)[field] = null;
                });

                console.log('Cleaned edit data:', cleanedEditData);

                // Save surat jalan if feature enabled
                if (config.features.suratJalanRecommendations && cleanedEditData.nosj && cleanedEditData.nosj.trim()) {
                    console.log('Saving surat jalan:', cleanedEditData.nosj.trim());
                    await saveSuratJalanToDatabase(cleanedEditData.nosj.trim().toUpperCase());
                }

                console.log('Calling updateTruckAPI with ID:', cleanedEditData.id);
                await updateTruckAPI(cleanedEditData.id, cleanedEditData);
                console.log('Update successful!');

                setIsEditModalOpen(false);
                setEditFormData(null);
                setSuratJalanRecommendations([]);
            } catch (error) {
                console.error('Error updating truck:', error);
            }
        }
    };

    const handleFormChange = (field: keyof TruckRecord, value: string | null | undefined) => {
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

    // Loading state
    if (loading) {
        return (
            <div className="relative h-[calc(80vh-1rem)] p-2 sm:p-3">
                <div className="flex items-center justify-center h-64 pt-8 sm:pt-4">
                    <div className="text-sm sm:text-lg text-center px-4">Loading trucks data from database...</div>
                </div>
            </div>
        );
    }

    // Error state
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
                    selectedStatus={selectedStatus}
                    onStatusChange={setSelectedStatus}
                    config={config}
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
                                        <div className="font-mono">{truck.plateNumber}</div>
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
                                            truck.status === 'timbang' ? 'bg-blue-100 text-blue-800' :
                                            truck.status === 'loading' ? 'bg-orange-100 text-orange-800' :
                                            'bg-green-100 text-green-800'
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
                                        <div className="font-mono text-xs">{formatIsoForDisplay(truck.arrivalTime) || '-'}</div>
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

                {/* No data message */}
                {/* {filteredTrucks.length === 0 && (
                    <div className="text-center py-6 sm:py-8 px-4">
                        {searchTerm ? (
                            <div>
                                <p className="text-gray-500 mb-2 text-sm sm:text-base">No trucks found matching "{searchTerm}"</p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSearchTerm("")}
                                    className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm"
                                >
                                    Clear search
                                </Button>
                            </div>
                        ) : selectedStatus !== "all" ? (
                            <div>
                                <p className="text-gray-500 mb-2 text-sm sm:text-base">No trucks found with status "{selectedStatus}"</p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedStatus("all")}
                                    className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm"
                                >
                                    Show all trucks
                                </Button>
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm sm:text-base">{config.emptyMessage}</p>
                        )}
                    </div>
                )} */}
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
