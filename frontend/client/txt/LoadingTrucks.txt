// import PlaceholderPage from "./PlaceholderPage";

// export default function LoadingTrucks(){
//     return(
//         <PlaceholderPage
//         title="Loading Trucks"
//         description="This page will be use for seeing Loading Trucks of the Trucks from Internal or External."
//         />
//     )
// }\

// TODO create a button print on detail
// TODO Make it Responsive for mobile 


import Clock2 from "../components/dashboard/clock"
import { PackageOpen, Eye, Edit, Save, X, Search } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { useDashboardStore } from "@/store/dashboardStore"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useTrucksWithFetch, TruckRecord } from "../store/truckStore"
import { useFormatTime } from "@/hooks/trucks/useFormatTime"

export default function LoadingTrucks() {
    // State untuk filtering
    const [selectedStatus, setSelectedStatus] = useState<"all" | "Waiting" | "Loading" | "Finished">("all");
    const { formatTimeForInput, formatTimeForDatabase } = useFormatTime();
    // State untuk search
    const [searchTerm, setSearchTerm] = useState("");

    // State untuk modal dan editing
    const [selectedTruck, setSelectedTruck] = useState<TruckRecord | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editFormData, setEditFormData] = useState<TruckRecord | null>(null);

    // State untuk rekomendasi surat jalan (data dari database)
    const [suratJalanRecommendations, setSuratJalanRecommendations] = useState<string[]>([]);
    const [showSuratJalanDropdown, setShowSuratJalanDropdown] = useState(false);

    const formatIsoForDisplay = (input?: string | null) => {
        if (!input) return '';
        if (typeof input !== 'string') return String(input);
        let s = input.replace('T', ' ');
        s = s.replace(/\.\d+Z?$/, '');
        s = s.replace(/Z$/, '');
        return s;
    };

    // Helper function untuk format INTERVAL data
    const formatIntervalDisplay = (interval?: string | number | null | any) => {
        console.log('formatIntervalDisplay input:', interval, 'type:', typeof interval);
        if (!interval) return '-';
        // Handle object case (PostgreSQL interval objects)
        if (typeof interval === 'object' && interval !== null) {
            console.log('Object detected:', interval);
            // Handle PostgreSQL interval object
            if (interval.minutes !== undefined || interval.hours !== undefined || interval.seconds !== undefined) {
                const hours = interval.hours || 0;
                const minutes = interval.minutes || 0;
                const seconds = interval.seconds || 0;
                return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(Math.floor(seconds)).padStart(2, '0')}`;
            }
            // Handle other object formats
            if (interval.toString && typeof interval.toString === 'function') {
                const stringValue = interval.toString();
                console.log('Object toString:', stringValue);
                if (stringValue !== '[object Object]') {
                    return stringValue;
                }
            }
            return '-';
        }
        if (typeof interval === 'string') {
            if (interval.includes(':')) {
                // Format INTERVAL (HH:MM:SS)
                return interval;
            }
        }

        if (typeof interval === 'number') {
            // Format number (minutes) - legacy data
            return `${interval} minutes`;
        }

        return String(interval);
    };

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

    const trucks = allTrucks.filter(truck => truck.operation === "muat");

    // Efek untuk menutup dropdown surat jalan ketika klik di luar
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            // Jangan tutup dropdown jika klik di dalam dropdown atau input
            if (target && !target.closest('.surat-jalan-dropdown') && !target.closest('.surat-jalan-input')) {
                setShowSuratJalanDropdown(false);
            }
        };

        if (showSuratJalanDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showSuratJalanDropdown]);

    // Load recommendations saat modal edit dibuka
    useEffect(() => {
        if (isEditModalOpen) {
            console.log('📝 Edit modal opened, preloading recommendations');
            loadSuratJalanRecommendations();
        }
    }, [isEditModalOpen]);

    // Calculate counts untuk setiap status
    const pendingCount = trucks.filter(truck =>
        truck.status === "Waiting" || truck.status === "pending"
    ).length;
    const loadingCount = trucks.filter(truck =>
        truck.status === "Loading" || truck.status === "loading"
    ).length;
    const finishedCount = trucks.filter(truck =>
        truck.status === "Finished" || truck.status === "finished"
    ).length;

    // Handler functions
    const handleDetailView = (truck: TruckRecord) => {
        setSelectedTruck(truck);
        setIsDetailModalOpen(true);
    };

    const handleEditTruck = (truck: TruckRecord) => {
        setEditFormData({ ...truck });
        setIsEditModalOpen(true);
        loadSuratJalanRecommendations();
    };

    // Load rekomendasi surat jalan dari database
    const loadSuratJalanRecommendations = async () => {
        try {
            console.log('🔄 Loading surat jalan recommendations...');
            const existingData = await fetchExistingSuratJalan();
            console.log('📊 Raw data from database:', existingData);

            // Normalize possible response shapes
            // - Array of objects
            // - PG Result object { command, rows: [...] }
            // - { data: [...] }
            let dataArray: any[] = [];
            if (!existingData) {
                dataArray = [];
            } else if (Array.isArray(existingData)) {
                dataArray = existingData;
            } else if (existingData && Array.isArray(existingData)) {
                dataArray = existingData;
            } else if (existingData && Array.isArray(existingData)) {
                dataArray = existingData;
            } else {
                // Try to coerce object values to array (defensive)
                try {
                    const maybeRows = (existingData as any).rows || (existingData as any).data;
                    if (Array.isArray(maybeRows)) dataArray = maybeRows;
                    else dataArray = [];
                } catch (e) {
                    dataArray = [];
                }
            }

            console.log('📋 Processed data array:', dataArray);

            // Ambil nomor surat jalan dari database sebagai rekomendasi
            const suratJalanNumbers = dataArray
                .map((item: any) => item.nosj || item.noSuratJalan || item.nomor)
                .filter(Boolean);

            console.log('📋 Processed recommendations:', suratJalanNumbers);

            setSuratJalanRecommendations(suratJalanNumbers);
            console.log('✅ Recommendations set, count:', suratJalanNumbers.length);
        } catch (error) {
            console.error('❌ Error loading surat jalan recommendations:', error);
            setSuratJalanRecommendations([]);
        }
    };

    const handleSaveEdit = async () => {
        if (editFormData) {
            try {
                console.log('=== LOADING TRUCKS SAVE EDIT ===');
                console.log('Edit form data:', editFormData);
                const cleanedEditData = { ...editFormData };
                // delete cleanedEditData.estimatedTime;
                delete cleanedEditData.quantity;
                delete cleanedEditData.unit;

                (['arrivalTime', 'startLoadingTime', 'finishTime', 'eta', 'tglsj', 'date'] as (keyof TruckRecord)[]).forEach(field => {
                    if (cleanedEditData[field] === "") (cleanedEditData as any)[field] = null;
                });

                console.log('Cleaned edit data:', cleanedEditData);

                // Simpan nomor surat jalan baru ke database jika ada
                if (cleanedEditData.nosj && cleanedEditData.nosj.trim()) {
                    console.log('Saving surat jalan:', cleanedEditData.nosj.trim());
                    await saveSuratJalanToDatabase(cleanedEditData.nosj.trim().toUpperCase());
                }

                console.log('Calling updateTruckAPI with ID:', cleanedEditData.id);
                await updateTruckAPI(cleanedEditData.id, cleanedEditData);
                console.log('Update successful!');

                setIsEditModalOpen(false);
                setEditFormData(null);
                setSuratJalanRecommendations([]); // Clear recommendations
                setShowSuratJalanDropdown(false);
            } catch (error) {
                console.error('Error updating truck:', error);
                // console.error('Error details:', error.response?.data);
                // console.error('Error status:', error.response?.status);
                // alert(`Error updating truck: ${error.response?.data?.error || error.message}`);
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
            // if (field === 'arrivalTime' || field === 'startLoadingTime' || field === 'finishTime') {
            //     const existingValue = editFormData[field];
            //     processedValue = formatTimeForDatabase(
            //         safeValue,
            //         String(existingValue ?? '')
            //     );
            // }
            setEditFormData({
                ...editFormData,
                [field]: processedValue
            });
        }
    };

    // Handler untuk memilih rekomendasi surat jalan
    const handleSelectSuratJalanRecommendation = (recommendation: string) => {
        console.log('Selecting recommendation:', recommendation);
        handleFormChange('nosj', recommendation);
        setShowSuratJalanDropdown(false);
    };

    // Handler untuk klik pada item rekomendasi
    const handleRecommendationClick = (e: React.MouseEvent, recommendation: string) => {
        e.preventDefault();
        e.stopPropagation();
        handleSelectSuratJalanRecommendation(recommendation);
    };

    const handleRefresh = () => {
        refetch();
    };

    // Loading and Error states
    if (loading) {
        return (
            <div className="relative h-[calc(80vh-1rem)] p-3">
                <div className="absolute right-1 top-1">
                    <Clock2 />
                </div>
                <div className="flex items-center justify-center h-64">
                    <div className="text-lg">Loading trucks data from database...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="relative h-[calc(80vh-1rem)] p-3">
                <div className="absolute right-1 top-1">
                    <Clock2 />
                </div>
                <div className="flex flex-col items-center justify-center h-64">
                    <div className="text-red-600 mb-4">Error loading trucks: {error}</div>
                    <Button onClick={handleRefresh} variant="outline">
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    // Filter trucks berdasarkan search term dan status
    const filteredTrucks = trucks.filter(truck => {
        // Filter berdasarkan search term
        const matchesSearch = !searchTerm ||
            truck.plateNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            truck.driver?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            truck.goods?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            truck.supplier?.toLowerCase().includes(searchTerm.toLowerCase());


        // Filter berdasarkan status
        const matchesStatus = selectedStatus === "all" ||
            truck.status === selectedStatus ||
            (selectedStatus === "Waiting" && (truck.status === "pending" || truck.status === "Waiting")) ||
            (selectedStatus === "Loading" && (truck.status === "loading" || truck.status === "Loading")) ||
            (selectedStatus === "Finished" && (truck.status === "finished" || truck.status === "Finished"));

        return matchesSearch && matchesStatus;
    });

    const ProgressBar = () => {
        const steps = [
            {
                id: 1,
                label: "Waiting",
                status: "Waiting" as const,
                color: "bg-yellow-500",
                borderColor: "border-yellow-500",
                count: (<span>{pendingCount} <span className="text-sm opacity-70 italic">Truck</span></span>),
                isActive: selectedStatus === "Waiting"
            },
            {
                id: 2,
                label: "Loading",
                status: "Loading" as const,
                color: "bg-blue-500",
                borderColor: "border-blue-500",
                count: (<span>{loadingCount} <span className="text-sm opacity-70 italic">Truck</span></span>),
                isActive: selectedStatus === "Loading"
            },
            {
                id: 3,
                label: "Finished",
                status: "Finished" as const,
                color: "bg-green-500",
                borderColor: "border-green-500",
                count: (<span>{finishedCount} <span className="text-sm opacity-70 italic">Truck</span></span>),
                isActive: selectedStatus === "Finished"
            }
        ];

        const handleStepClick = (status: "Waiting" | "Loading" | "Finished") => {
            setSelectedStatus(selectedStatus === status ? "all" : status);
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
                            onClick={() => handleStepClick(step.status)}
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
                                onClick={() => setSelectedStatus("all")}
                                className="ml-2 text-blue-600 hover:text-blue-800 text-xs underline"
                            >
                                Show all
                            </button>
                        </p>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="relative h-[calc(80vh-1rem)] p-3">
            <div className="absolute right-1 top-1">
                <Clock2 />
            </div>

            {/* Header */}
            <div className="mb-4">
                <div className="flex items-center gap-3 mb-4">
                    <h1 className="text-2xl font-bold text-gray-800">Loading Trucks / <span className="text-green-600 italic opacity-75">Muat</span></h1>
                </div>

                {/* Progress Bar */}
                <ProgressBar />
            </div>

            {/* Search Bar */}
            <div className="mb-1">
                <div className="relative max-w-md flex flex-row gap-2 items-center">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search trucks by plate, driver, goods, department..."
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <Button onClick={handleRefresh} variant="outline" size="sm" className="bg-slate-200 border border-gray-400 hover:bg-gray-300 transition-opacity ease-in-out">
                        Refresh
                    </Button>
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm("")}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                            <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                        </button>
                    )}
                </div>

                {/* Search Results Summary */}
                {searchTerm && (
                    <div className="mt-2 text-sm text-gray-600">
                        Found {filteredTrucks.length} truck{filteredTrucks.length !== 1 ? 's' : ''} matching "{searchTerm}"
                        {selectedStatus !== "all" && ` with status "${selectedStatus}"`}
                    </div>
                )}
            </div>

            {/* Truck Table */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto xl:h-[50vh] sm:h-[50vh] overflow-y-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Plate Number
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Driver
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Goods
                                </th>
                                {/* <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Operation
                                </th> */}
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Supplier
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Vehicle Type
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Arrival Time
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200 h-[20vh]">
                            {filteredTrucks.map((truck) => (
                                <tr key={truck.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {truck.plateNumber}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {truck.driver}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {truck.goods}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                                        <span className="inline-flex text-xs font-semibold text-purple-600">
                                            {truck.supplier}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${truck.status === 'Waiting' ? 'bg-yellow-100 text-yellow-800' :
                                            truck.status === 'Loading' ? 'bg-blue-100 text-blue-800' :
                                                'bg-green-100 text-green-800'
                                            }`}>
                                            {truck.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {truck.jenismobil || '-'}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {formatIsoForDisplay(truck.arrivalTime) || '-'}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                                        <div className="flex space-x-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleDetailView(truck)}
                                                className="h-8 w-8 p-0"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleEditTruck(truck)}
                                                className="h-8 w-8 p-0"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* No data message */}
                {filteredTrucks.length === 0 && (
                    <div className="text-center py-8">
                        {searchTerm ? (
                            <div>
                                <p className="text-gray-500 mb-2">No trucks found matching "{searchTerm}"</p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSearchTerm("")}
                                    className="text-blue-600 hover:text-blue-800"
                                >
                                    Clear search
                                </Button>
                            </div>
                        ) : selectedStatus !== "all" ? (
                            <div>
                                <p className="text-gray-500 mb-2">No trucks found with status "{selectedStatus}"</p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedStatus("all")}
                                    className="text-blue-600 hover:text-blue-800"
                                >
                                    Show all trucks
                                </Button>
                            </div>
                        ) : (
                            <p className="text-gray-500">No unloading trucks found. Only trucks with "bongkar" operation are shown here.</p>
                        )}
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Truck Details - {selectedTruck?.plateNumber}</DialogTitle>
                    </DialogHeader>
                    {selectedTruck && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Plate Number</label>
                                    <p className="text-sm text-gray-900">{selectedTruck.plateNumber}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Ticket Number</label>
                                    <p className="text-sm text-gray-900">{selectedTruck.noticket}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Driver</label>
                                    <p className="text-sm text-gray-900">{selectedTruck.driver}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">NIK Driver</label>
                                    <p className="text-sm text-gray-900">{selectedTruck.nikdriver}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Phone Driver</label>
                                    <p className="text-sm text-gray-900">{selectedTruck.tlpdriver}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Department</label>
                                    <p className="text-sm text-gray-900">{selectedTruck.department}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Supplier</label>
                                    <p className="text-sm text-gray-900">{selectedTruck.supplier}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Goods</label>
                                    <p className="text-sm text-gray-900">{selectedTruck.goods}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Type</label>
                                    <p className="text-sm text-gray-900">{selectedTruck.type}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Status</label>
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${selectedTruck.status === 'Waiting' ? 'bg-yellow-100 text-yellow-800' :
                                        selectedTruck.status === 'Loading' ? 'bg-blue-100 text-blue-800' :
                                            'bg-green-100 text-green-800'
                                        }`}>
                                        {selectedTruck.status.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Arrival Time</label>
                                    <p className="text-sm text-gray-900">{formatIsoForDisplay(selectedTruck.arrivalTime) || '-'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">ETA</label>
                                    <p className="text-sm text-gray-900">{selectedTruck.eta || '-'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Start Loading Time</label>
                                    <p className="text-sm text-gray-900">{formatIsoForDisplay(selectedTruck.startLoadingTime) || '-'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Finish Time</label>
                                    <p className="text-sm text-gray-900">{formatIsoForDisplay(selectedTruck.finishTime) || '-'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Total Process Loading Time</label>
                                    <p className="text-sm text-gray-900">{formatIntervalDisplay(selectedTruck.totalProcessLoadingTime)}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Actual Wait Time</label>
                                    <p className="text-sm text-gray-900">{formatIntervalDisplay(selectedTruck.actualWaitTime)}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Truck Status</label>
                                    <p className="text-sm text-gray-900">{selectedTruck.statustruck}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Armada</label>
                                    <p className="text-sm text-gray-900">{selectedTruck.armada}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Vehicle Type</label>
                                    <p className="text-sm text-gray-900">{selectedTruck.jenismobil}</p>
                                </div>
                            </div>
                            <div className="md:col-span-2 space-y-3">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Description In</label>
                                    <p className="text-sm text-gray-900">{selectedTruck.descin}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Description Out</label>
                                    <p className="text-sm text-gray-900">{selectedTruck.descout}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Surat Jalan Number</label>
                                    <p className="text-sm text-gray-900">{selectedTruck.nosj}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Surat Jalan Date</label>
                                    <p className="text-sm text-gray-900">{formatIsoForDisplay(selectedTruck.tglsj) || '-'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Kelengkapan</label>
                                    <p className="text-sm text-gray-900">{selectedTruck.kelengkapan}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Edit Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Truck - {editFormData?.plateNumber}</DialogTitle>
                    </DialogHeader>
                    {editFormData && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Plate Number</label>
                                    <input
                                        type="text"
                                        value={editFormData.plateNumber}
                                        onChange={(e) => handleFormChange('plateNumber', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Driver</label>
                                    <input
                                        type="text"
                                        value={editFormData.driver}
                                        onChange={(e) => handleFormChange('driver', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">NIK Driver</label>
                                    <input
                                        type="text"
                                        value={editFormData.nikdriver}
                                        onChange={(e) => handleFormChange('nikdriver', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Driver</label>
                                    <input
                                        type="text"
                                        value={editFormData.tlpdriver}
                                        onChange={(e) => handleFormChange('tlpdriver', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="relative">
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Nomor Surat Jalan
                                            {/* <span className="text-blue-600 text-xs ml-1">Rekomendasi dari Database</span> */}
                                        </label>
                                        {/* <button
                                            type="button"
                                            onClick={() => {
                                                console.log('🔄 Manual refresh recommendations');
                                                loadSuratJalanRecommendations();
                                            }}
                                            className="text-xs text-blue-600 hover:text-blue-800 underline"
                                        >
                                            🔄 Refresh
                                        </button> */}
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={editFormData.nosj || ""}
                                            onChange={(e) => {
                                                const value = e.target.value.trim().toUpperCase();
                                                handleFormChange('nosj', value);
                                            }
                                            }
                                            onBlur={(e) => {
                                                const value = e.target.value.trim().toUpperCase();
                                                handleFormChange('nosj', value);
                                            }}
                                            // onFocus={() => {
                                            //     console.log('🎯 Input focused, showing dropdown');
                                            //     console.log('📊 Current recommendations:', suratJalanRecommendations);
                                            //     console.log('🔍 Recommendations count:', suratJalanRecommendations.length);
                                            //     setShowSuratJalanDropdown(true);

                                            //     // Load recommendations if not already loaded
                                            //     if (suratJalanRecommendations.length === 0) {
                                            //         console.log('🔄 No recommendations found, loading...');
                                            //         loadSuratJalanRecommendations();
                                            //     }
                                            // }}
                                            style={{ textTransform: 'uppercase' }}
                                            className="surat-jalan-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Contoh: SJ/VII/2093/UB"
                                        />
                                        {/* {showSuratJalanDropdown && (
                                            <div className="surat-jalan-dropdown absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                                                <div className="p-2 bg-blue-50 border-b text-xs font-medium text-blue-700">
                                                    Rekomendasi:
                                                </div>
                                                {suratJalanRecommendations.length > 0 ? (
                                                    suratJalanRecommendations.map((recommendation, index) => (
                                                        <button
                                                            key={index}
                                                            type="button"
                                                            onClick={(e) => handleRecommendationClick(e, recommendation)}
                                                            className="w-full text-left px-3 py-2 hover:bg-blue-50 hover:text-blue-700 text-sm border-b border-gray-100 last:border-b-0 transition-colors cursor-pointer"
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <span className="font-mono">{recommendation}</span>
                                                                <span className="text-xs text-blue-500">✓ Pilih</span>
                                                            </div>
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="p-3 text-center text-gray-500 text-sm">
                                                        <div className="animate-pulse">Memuat rekomendasi...</div>
                                                    </div>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => setShowSuratJalanDropdown(false)}
                                                    className="w-full text-center px-3 py-2 bg-gray-50 text-xs text-gray-500 hover:bg-gray-100"
                                                >
                                                    ✕ Tutup Rekomendasi
                                                </button>
                                            </div>
                                        )} */}
                                    </div>
                                    {/* <p className="text-xs text-gray-500 mt-1">
                                        Rekomendasi berdasarkan data historis dari database
                                        <span className="ml-2 text-blue-500">
                                            ({suratJalanRecommendations.length} data tersedia)
                                        </span>
                                    </p> */}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                                    <select
                                        value={editFormData.department}
                                        onChange={(e) => handleFormChange('department', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="HPC">HPC</option>
                                        <option value="PT">PT</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <select
                                        value={editFormData.status}
                                        onChange={(e) => handleFormChange('status', e.target.value as "pending" | "loading" | "finished")}
                                        className="w-full px-3 py-2 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="loading">Loading</option>
                                        <option value="finished">Finished</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Goods</label>
                                    <input
                                        type="text"
                                        value={editFormData.goods}
                                        onChange={(e) => handleFormChange('goods', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                                    <input
                                        type="text"
                                        value={editFormData.supplier}
                                        onChange={(e) => handleFormChange('supplier', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Arrival Time</label>
                                    <input
                                        type="time"
                                        value={formatTimeForInput(editFormData?.arrivalTime) || ""}
                                        onChange={(e) => handleFormChange('arrivalTime', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        disabled
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">ETA</label>
                                    <input
                                        type="time"
                                        value={editFormData.eta || ''}
                                        onChange={(e) => handleFormChange('eta', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-30 bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        disabled
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Truck Status</label>
                                    <select
                                        value={editFormData.statustruck}
                                        onChange={(e) => handleFormChange('statustruck', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="kosong">Kosong</option>
                                        <option value="isi">Isi</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Armada</label>
                                    <input
                                        type="text"
                                        value={editFormData.armada}
                                        onChange={(e) => handleFormChange('armada', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
                                    <input
                                        type="text"
                                        value={editFormData.jenismobil}
                                        onChange={(e) => handleFormChange('jenismobil', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                    <select
                                        value={editFormData.type}
                                        onChange={(e) => handleFormChange('type', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="internal">Internal</option>
                                        <option value="external">External</option>
                                    </select>
                                </div>
                            </div>
                            <div className="md:col-span-2 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description In</label>
                                    <textarea
                                        rows={3}
                                        value={editFormData.descin}
                                        onChange={(e) => handleFormChange('descin', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description Out</label>
                                    <textarea
                                        rows={3}
                                        value={editFormData.descout}
                                        onChange={(e) => handleFormChange('descout', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="flex justify-end space-x-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsEditModalOpen(false)}
                                    >
                                        <X className="h-4 w-4 mr-2" />
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleSaveEdit}
                                        className="bg-blue-600 hover:bg-blue-700"
                                    >
                                        <Save className="h-4 w-4 mr-2" />
                                        Save Changes
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}