// Contoh penggunaan TruckStore dengan API di LoadingTrucks.tsx

import React, { useState, useEffect } from 'react';
import { useTrucksWithFetch, TruckRecord } from '../store/truckStore';
import { Search, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import Clock2 from '../components/dashboard/clock';

export default function LoadingTrucksWithAPI() {
    // State untuk filtering dan search
    const [selectedStatus, setSelectedStatus] = useState<"all" | "Waiting" | "Loading" | "Finished">("all");
    const [searchTerm, setSearchTerm] = useState("");
    
    // State untuk modal
    const [selectedTruck, setSelectedTruck] = useState<TruckRecord | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editFormData, setEditFormData] = useState<TruckRecord | null>(null);

    // Menggunakan API dengan auto-fetch
    const {
        trucks,
        loading,
        error,
        refetch,
        updateTruckAPI,
        createTruck,
        deleteTruck
    } = useTrucksWithFetch({
        searchTerm: searchTerm || undefined,
        status: selectedStatus === "all" ? undefined : selectedStatus
    });

    // Calculate counts untuk setiap status
    const waitingCount = trucks.filter(truck => 
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
    };

    const handleSaveEdit = async () => {
        if (editFormData) {
            try {
                await updateTruckAPI(editFormData.id, editFormData);
                setIsEditModalOpen(false);
                setEditFormData(null);
                // Data akan terupdate otomatis karena menggunakan store
            } catch (error) {
                console.error('Error updating truck:', error);
                // Handle error - bisa show toast notification
            }
        }
    };

    const handleFormChange = (field: keyof TruckRecord, value: string) => {
        if (editFormData) {
            setEditFormData({
                ...editFormData,
                [field]: value
            });
        }
    };

    const handleRefresh = () => {
        refetch();
    };

    const ProgressBar = () => {
        const steps = [
            {
                id: 1,
                label: "Waiting",
                status: "Waiting" as const,
                color: "bg-yellow-500",
                borderColor: "border-yellow-500",
                count: (<span>{waitingCount} <span className="text-sm opacity-70 italic">Truck</span></span>),
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
                            <div className={`w-8 h-8 rounded-full ${step.color} border-4 ${
                                step.isActive ? 'border-gray-800' : 'border-white'
                            } shadow-lg flex items-center justify-center transition-all duration-200 group-hover:scale-110 ${
                                step.isActive ? 'ring-2 ring-gray-400' : ''
                            }`}>
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                            
                            {/* Step label */}
                            <div className="mt-2 text-center">
                                <div className={`text-sm font-medium ${
                                    step.isActive ? 'text-gray-800' : 'text-gray-600'
                                }`}>
                                    {step.label}
                                </div>
                                <div className={`text-xs ${
                                    step.isActive ? 'text-gray-600' : 'text-gray-500'
                                }`}>
                                    {step.count}
                                </div>
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

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-lg">Loading trucks data...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <div className="text-red-600 mb-4">Error loading trucks: {error}</div>
                <Button onClick={handleRefresh} variant="outline">
                    Try Again
                </Button>
            </div>
        );
    }

    return (
        <div className="relative h-[calc(80vh-1rem)] p-3">
            <div className="absolute right-1 top-1">
                <Clock2/>
            </div>
            
            {/* Header */}
            <div className="mb-4">
                <div className="flex items-center gap-3 mb-4">
                    <h1 className="text-2xl font-bold text-gray-800">Loading Trucks (API)</h1>
                    <Button onClick={handleRefresh} variant="outline" size="sm">
                        Refresh
                    </Button>
                </div>
                
                {/* Progress Bar */}
                <ProgressBar />
            </div>

            {/* Search Bar */}
            <div className="mb-1">
                <div className="relative max-w-md">
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
                        Found {trucks.length} truck{trucks.length !== 1 ? 's' : ''} matching "{searchTerm}"
                        {selectedStatus !== "all" && ` with status "${selectedStatus}"`}
                    </div>
                )}
            </div>

            {/* Truck Table */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Plate Number
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Driver
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Goods
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Operation
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Vehicle Type
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Arrival Time
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {trucks.map((truck) => (
                                <tr key={truck.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {truck.plateNumber}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {truck.driver}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {truck.goods}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            truck.operation === 'muat' 
                                                ? 'bg-blue-100 text-blue-800' 
                                                : 'bg-green-100 text-green-800'
                                        }`}>
                                            {truck.operation}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            truck.status === 'Finished' || truck.status === 'finished'
                                                ? 'bg-green-100 text-green-800'
                                                : truck.status === 'Loading' || truck.status === 'loading'
                                                ? 'bg-blue-100 text-blue-800'
                                                : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {truck.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {truck.jenismobil}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {truck.arrivalTime}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button
                                            onClick={() => handleDetailView(truck)}
                                            className="text-indigo-600 hover:text-indigo-900 mr-2"
                                        >
                                            View
                                        </button>
                                        <button
                                            onClick={() => handleEditTruck(truck)}
                                            className="text-green-600 hover:text-green-900"
                                        >
                                            Edit
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                {/* No data message */}
                {trucks.length === 0 && (
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
                                    Show all
                                </Button>
                            </div>
                        ) : (
                            <p className="text-gray-500">No trucks found.</p>
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
                            <div>
                                <strong>Plate Number:</strong> {selectedTruck.plateNumber}
                            </div>
                            <div>
                                <strong>Driver:</strong> {selectedTruck.driver}
                            </div>
                            <div>
                                <strong>Operation:</strong> {selectedTruck.operation}
                            </div>
                            <div>
                                <strong>Vehicle Type:</strong> {selectedTruck.jenismobil}
                            </div>
                            <div>
                                <strong>Status:</strong> {selectedTruck.status}
                            </div>
                            <div>
                                <strong>Department:</strong> {selectedTruck.department}
                            </div>
                            <div>
                                <strong>Goods:</strong> {selectedTruck.goods}
                            </div>
                            <div>
                                <strong>Supplier:</strong> {selectedTruck.supplier}
                            </div>
                            <div>
                                <strong>Arrival Time:</strong> {selectedTruck.arrivalTime}
                            </div>
                            <div>
                                <strong>Date:</strong> {selectedTruck.date}
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
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Status</label>
                                <select
                                    value={editFormData.status}
                                    onChange={(e) => handleFormChange('status', e.target.value)}
                                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                >
                                    <option value="Waiting">Waiting</option>
                                    <option value="Loading">Loading</option>
                                    <option value="Finished">Finished</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Operation</label>
                                <select
                                    value={editFormData.operation}
                                    onChange={(e) => handleFormChange('operation', e.target.value)}
                                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                >
                                    <option value="bongkar">Bongkar</option>
                                    <option value="muat">Muat</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Description Out</label>
                                <textarea
                                    value={editFormData.descout}
                                    onChange={(e) => handleFormChange('descout', e.target.value)}
                                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                    rows={3}
                                />
                            </div>
                            <div className="md:col-span-2 flex justify-end space-x-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsEditModalOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button onClick={handleSaveEdit}>
                                    Save Changes
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}