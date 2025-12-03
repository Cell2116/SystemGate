import React, { useState } from "react";
import { TruckHistoryRecord } from "../../../types/truck.types";
import { formatDateTime, formatIsoForDisplay } from "../../../lib/utils";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogOverlay, DialogPortal } from "@/components/ui/dialog";
interface TruckModalProps {
    selectedRecord: TruckHistoryRecord | null;
    onClose: () => void;
}

interface QueueData {
    queue_ticket?: number;
    queue_position?: number;
}
export default function TruckModal({ selectedRecord, onClose }: TruckModalProps) {
    const [modalImage, setModalImage] = useState<string | null>(null);
    const formatTime = (isoString: string): string => {
        if (!isoString) return 'Not set';
        const dateTimeStr = isoString.replace('T', ' ').split('.')[0];
        if (dateTimeStr.includes(' ')) {
            const timePart = dateTimeStr.split(' ')[1];
            return timePart || 'Not set';
        }
        const date = new Date(isoString);
        if (!isNaN(date.getTime())) {
            const pad = (n: number) => String(n).padStart(2, "0");
            return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
        }
        return isoString;
    };
    const formatDate = (isoString: string): string => {
        const date = new Date(isoString);
        const pad = (n: number) => String(n).padStart(2, "0");
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} `;
    };
    const [queueData, setQueueData] = useState<QueueData | null>(null);
    const [queueLoading, setQueueLoading] = useState<boolean>(false);
    const [currentCycle, setCurrentCycle] = useState<number>(1);
    const [cycleData, setCycleData] = useState<TruckHistoryRecord | null>(selectedRecord);
    const [zoomImage, setZoomImage] = useState<{
        src: string;
        alt: string;
        label: string;
    } | null>(null);
    const baseurl = import.meta.env.VITE_API_BASE_URL;

    React.useEffect(() => {
        const fetchQueueData = async () => {
            if (!selectedRecord?.id) return;

            setQueueLoading(true);
            // const baseurl = "${baseurl}";

            try {
                const response = await fetch(`${baseurl}/api/trucks/actualqueue/${selectedRecord.id}`);

                if (response.ok) {
                    const data = await response.json();
                    setQueueData({
                        queue_ticket: data.queue_ticket,
                        queue_position: data.queue_position
                    });
                } else if (response.status === 404) {
                    // Truck not in queue
                    setQueueData(null);
                } else {
                    console.error("Failed to fetch queue data:", response.status);
                }
            } catch (error) {
                console.error("Error fetching queue data:", error);
            } finally {
                setQueueLoading(false);
            }
        };

        fetchQueueData();
    }, [selectedRecord?.id]);

    React.useEffect(() => {
        if (selectedRecord) {
            const fetchCycleData = async () => {
                // const baseurl = "${baseurl}";
                try {
                    const response = await fetch(`${baseurl}/api/trucks/history?offset=0`);
                    const data = await response.json();

                    if (data && Array.isArray(data)) {
                        const defaultRecord = data.find(
                            (r: TruckHistoryRecord) => r.id === selectedRecord?.id
                        );
                        if (defaultRecord) {
                            console.log("Found default cycle record:", defaultRecord);
                            setCycleData(defaultRecord);
                            setCurrentCycle(1);
                        }
                    }
                } catch (error) {
                    console.error("Failed to fetch default cycle data:", error);
                }
            };
            fetchCycleData();
        }
    }, [selectedRecord]);
    const handleImageClick = (src: string, alt: string, label: string) => {
        setZoomImage({ src, alt, label });
    };
    const closeZoom = () => {
        setZoomImage(null);
    };
    const TOTAL_CYCLE = 3;

    const handleCycleButton = async () => {
        try {
            const nextCycle = currentCycle % TOTAL_CYCLE + 1;
            const nextOffset = nextCycle - 1;
            console.log("Current Cycle:", currentCycle);
            console.log("Next Cycle:", nextCycle);
            console.log("Offset:", nextOffset);

            const response = await fetch(`${baseurl}/api/trucks/history?offset=${nextOffset}`);
            const data = await response.json();
            if (Array.isArray(data)) {
                const updatedRecord = data.find(
                    (r: TruckHistoryRecord) => r.id === selectedRecord?.id
                );
                if (updatedRecord) {
                    setCycleData(updatedRecord);
                    setCurrentCycle(nextCycle); 
                } else {
                    console.warn("No record found with ID:", selectedRecord?.id);
                }
            } else {
                console.warn("Invalid API format:", data);
            }
        } catch (error) {
            console.error("Failed to load next cycle:", error);
        }
    };

    if (!selectedRecord) return null;
    console.log("Record SelectedRecord: ", selectedRecord);
    return (
        <>
            {/* Detail Modal */}
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
                onClick={onClose}
            >
                <div
                    className="bg-white rounded-lg shadow-xl max-w-6xl max-h-[90vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900">Record Details</h2>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-600 text-2xl"
                            >
                                ×
                            </button>
                        </div>
                        {queueLoading ? (
                            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-sm text-blue-600">Loading queue information...</p>
                            </div>
                        ) : queueData ? (
                            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold text-green-900 mb-2">Queue Information</h3>
                                        <div className="space-y-1 text-sm">
                                            <div>
                                                <span className="font-semibold text-green-700">Queue Ticket:</span>
                                                <span className="ml-2 text-green-900">{queueData.queue_ticket || 'N/A'}</span>
                                            </div>
                                            <div>
                                                <span className="font-semibold text-green-700">Queue Position (Actual Queue):</span>
                                                <span className="ml-2 text-green-900 font-bold text-lg">#{queueData.queue_position || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-4xl font-bold text-green-600">
                                        #{queueData.queue_position}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                <p className="text-sm text-gray-600">This truck is not currently in queue</p>
                            </div>
                        )}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Basic Info - Left Column */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-gray-900">Truck Information</h3>
                                <div className="space-y-2 text-sm">
                                    <div><span className="font-semibold text-slate-600">Plate Number:</span> {selectedRecord.platenumber || 'N/A'}</div>
                                    <div><span className="font-semibold text-slate-600">Ticket Number:</span> {selectedRecord.noticket || 'N/A'}</div>
                                    <div><span className="font-semibold text-slate-600">Driver:</span> {selectedRecord.driver || 'N/A'}</div>
                                    <div><span className="font-semibold text-slate-600">NIK Driver:</span> {selectedRecord.nikdriver || 'N/A'}</div>
                                    <div><span className="font-semibold text-slate-600">Telp Driver:</span> {selectedRecord.tlpdriver || 'N/A'}</div>
                                    <div><span className="font-semibold text-slate-600">Department:</span> {selectedRecord.department || 'N/A'}</div>
                                    <div><span className="font-semibold text-slate-600">Jenis Mobil:</span> {selectedRecord.jenismobil || 'N/A'}</div>
                                    <div><span className="font-semibold text-slate-600">Type:</span> {selectedRecord.type || 'N/A'}</div>
                                    <div><span className="font-semibold text-slate-600">Status:</span> {selectedRecord.status || 'N/A'}</div>
                                </div>
                                <h3 className="font-semibold text-gray-900">Shipment Information</h3>
                                <div className="space-y-2 text-sm">
                                    <div><span className="font-semibold text-slate-600">Supplier:</span> {selectedRecord.supplier || 'N/A'}</div>
                                    <div><span className="font-semibold text-slate-600">Goods:</span> {selectedRecord.goods || 'N/A'}</div>
                                    <div><span className="font-semibold text-slate-600">No SJ:</span> {selectedRecord.nosj || 'N/A'}</div>
                                    <div><span className="font-semibold text-slate-600">Tanggal SJ:</span> {selectedRecord.tglsj || 'N/A'}</div>
                                    <div><span className="font-semibold text-slate-600">Armada:</span> {selectedRecord.armada || 'N/A'}</div>
                                    <div><span className="font-semibold text-slate-600">Kelengkapan:</span> {selectedRecord.kelengkapan || 'N/A'}</div>
                                </div>
                                <h3 className="font-semibold text-gray-900 pt-4">Additional Information</h3>
                                <div className="space-y-2 text-sm">
                                    <div><span className="font-semibold text-slate-600">Description In:</span> {selectedRecord.descin || 'N/A'}</div>
                                    <div><span className="font-semibold text-slate-600">Description Out:</span> {selectedRecord.descout || 'N/A'}</div>
                                    <div><span className="font-semibold text-slate-600">Status Truck:</span> {selectedRecord.statustruck || 'N/A'}</div>
                                </div>
                            </div>
                            {/* Shipment & Timing Info - Right Column */}
                            <div className="space-y-4">
                                <div className="flex flex-row gap-4 items-center">
                                    <h3 className="font-semibold text-gray-900 pt-4">Timing Information</h3>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="text-xs font-bold h-7 mt-2 bg-gray-300 hover:bg-gray-200"
                                        onClick={handleCycleButton}
                                    >
                                        Cycle {currentCycle}
                                    </Button>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div><span className="font-semibold text-slate-600">Date:</span> {formatDate(selectedRecord.date) || 'N/A'}</div>
                                    <div><span className="font-semibold text-slate-600">ETA:</span> {selectedRecord.eta || 'N/A'}</div>
                                    <div><span className="font-semibold text-slate-600">Arrival Time:</span> {cycleData?.arrivaltime ? formatIsoForDisplay(cycleData?.arrivaltime) : 'N/A'}</div>
                                    <div><span className="font-semibold text-slate-600">Waiting For Weighing/Timbang:</span> {cycleData?.waitingfortimbang ? formatTime(cycleData?.waitingfortimbang) : 'N/A'}</div>
                                    <div><span className="font-semibold text-slate-600">Start Weighing/Timbang Gross:</span> {cycleData?.starttimbang ? formatTime(cycleData?.starttimbang) : 'N/A'}</div>
                                    <div><span className="font-semibold text-slate-600">Finish Weighing/Timbang Gross:</span> {cycleData?.finishtimbang ? formatTime(cycleData?.finishtimbang) : 'N/A'}</div>
                                    <div><span className="font-semibold text-slate-600">Total Process Weighing/Timbang:</span> {cycleData?.totalprocesstimbang ? formatTime(cycleData?.totalprocesstimbang) : 'N/A'}</div>
                                    <div><span className="font-semibold text-slate-600">Go to HPC:</span> {cycleData?.runtohpc ? formatTime(cycleData?.runtohpc) : 'N/A'}</div>
                                    <div><span className="font-semibold text-slate-600">Entry HPC:</span> {cycleData?.entryhpc ? formatTime(cycleData?.entryhpc) : 'N/A'}</div>
                                    <div><span className="font-semibold text-slate-600">Waiting For Arrival at HPC:</span> {cycleData?.waitingforarrivalhpc ? formatTime(cycleData?.waitingforarrivalhpc) : 'N/A'}</div>
                                    <div><span className="font-semibold text-slate-600">Go to PT:</span> {cycleData?.runtopt ? formatTime(cycleData?.runtopt) : 'N/A'}</div>
                                    <div><span className="font-semibold text-slate-600">Waiting For Arrival at PT:</span> {cycleData?.waitingforarrivalpt ? formatTime(cycleData?.waitingforarrivalpt) : 'N/A'}</div>
                                    <div><span className="font-semibold text-slate-600">Entry PT:</span> {cycleData?.entrypt ? formatTime(cycleData?.entrypt) : 'N/A'}</div>
                                    <div><span className="font-semibold text-slate-600">Waiting For Loading/Unloading (Muat/Bongkar) :</span> {cycleData?.actualwaitloadingtime ? formatTime(cycleData?.actualwaitloadingtime) : 'N/A'}</div>
                                    <div><span className="font-semibold text-slate-600">Start Loading/Unloading Time :</span> {cycleData?.startloadingtime ? formatTime(cycleData?.startloadingtime) : 'N/A'}</div>
                                    <div><span className="font-semibold text-slate-600">Finish Loading/Unloading Time :</span> {cycleData?.finishloadingtime ? formatTime(cycleData?.finishloadingtime) : 'N/A'}</div>
                                    <div><span className="font-semibold text-slate-600">Total Process Loading/Unloading :</span> {cycleData?.totalprocessloadingtime ? formatTime(cycleData?.totalprocessloadingtime) : 'N/A'}</div>
                                    <div><span className="font-semibold text-slate-600">Start Weighing/Timbang Neto :</span> {cycleData?.starttimbangneto ? formatTime(cycleData?.starttimbangneto) : 'N/A'}</div>
                                    <div><span className="font-semibold text-slate-600">Finish Weighing/Timbang Neto :</span> {cycleData?.finishtimbangneto ? formatTime(cycleData?.finishtimbangneto) : 'N/A'}</div>
                                    <div><span className="font-semibold text-slate-600">Waiting for Weighing/Timbang Neto :</span> {cycleData?.waitingfortimbangneto ? formatTime(cycleData?.waitingfortimbangneto) : 'N/A'}</div>
                                    <div><span className="font-semibold text-slate-600">Total Process Weighing/Timbang Neto :</span> {cycleData?.totalprocesstimbangneto ? formatTime(cycleData?.totalprocesstimbangneto) : 'N/A'}</div>
                                    <div><span className="font-semibold text-slate-600">Waiting for Exit :</span> {cycleData?.waitingforexit ? formatTime(cycleData?.waitingforexit) : 'N/A'}</div>
                                    <div><span className="font-semibold text-slate-600">Exit :</span> {cycleData?.exittime ? formatTime(cycleData?.exittime) : 'N/A'}</div>
                                    <div><span className="font-semibold text-slate-600">Total Truck Completion Time :</span> <span className="text-green-900 font-bold bg-green-300 border rounded-sm p-1">{cycleData?.totaltruckcompletiontime ? formatTime(cycleData?.totaltruckcompletiontime) : 'N/A'}</span></div>
                                </div>
                            </div>
                        </div>
                        <div className="mt-6">
                            <h3 className="font-semibold text-gray-900 mb-3">Captured Images</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="text-center">
                                    <label className="text-xs font-medium text-gray-500 block mb-2">Driver Photo</label>
                                    {selectedRecord.driver_photo ? (
                                        <div className="relative group cursor-pointer" onClick={() => handleImageClick(
                                            selectedRecord.driver_photo!.startsWith('data:image')
                                                ? selectedRecord.driver_photo!
                                                : `${baseurl}/backend/uploads/trucks/${selectedRecord.driver_photo}`,
                                            "Driver",
                                            "Driver Photo"
                                        )}>
                                            <img
                                                src={selectedRecord.driver_photo.startsWith('data:image')
                                                    ? selectedRecord.driver_photo
                                                    : `${baseurl}/backend/uploads/trucks/${selectedRecord.driver_photo}`}
                                                alt="Driver"
                                                className="w-full h-32 object-cover rounded-lg border mx-auto transition-transform group-hover:scale-105"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                    const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                                                    if (nextElement) {
                                                        nextElement.style.display = 'block';
                                                    }
                                                }}
                                            />
                                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                                                <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-sm font-medium">
                                                    Click to zoom
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="w-full h-32 bg-gray-100 rounded-lg border flex items-center justify-center">
                                            <span className="text-gray-400 text-sm">No image</span>
                                        </div>
                                    )}
                                </div>

                                <div className="text-center">
                                    <label className="text-xs font-medium text-gray-500 block mb-2">SIM Photo</label>
                                    {selectedRecord.sim_photo ? (
                                        <div className="relative group cursor-pointer" onClick={() => handleImageClick(
                                            selectedRecord.sim_photo!.startsWith('data:image')
                                                ? selectedRecord.sim_photo!
                                                : `${baseurl}/backend/uploads/trucks/${selectedRecord.sim_photo}`,
                                            "SIM",
                                            "SIM Photo"
                                        )}>
                                            <img
                                                src={selectedRecord.sim_photo.startsWith('data:image')
                                                    ? selectedRecord.sim_photo
                                                    : `${baseurl}/backend/uploads/trucks/${selectedRecord.sim_photo}`}
                                                alt="SIM"
                                                className="w-full h-32 object-cover rounded-lg border mx-auto transition-transform group-hover:scale-105"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                    const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                                                    if (nextElement) {
                                                        nextElement.style.display = 'block';
                                                    }
                                                }}
                                            />
                                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                                                <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-sm font-medium">
                                                    Click to zoom
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="w-full h-32 bg-gray-100 rounded-lg border flex items-center justify-center">
                                            <span className="text-gray-400 text-sm">No image</span>
                                        </div>
                                    )}
                                </div>

                                <div className="text-center">
                                    <label className="text-xs font-medium text-gray-500 block mb-2">STNK Photo</label>
                                    {selectedRecord.stnk_photo ? (
                                        <div className="relative group cursor-pointer" onClick={() => handleImageClick(
                                            selectedRecord.stnk_photo!.startsWith('data:image')
                                                ? selectedRecord.stnk_photo!
                                                : `${baseurl}/backend/uploads/trucks/${selectedRecord.stnk_photo}`,
                                            "STNK",
                                            "STNK Photo"
                                        )}>
                                            <img
                                                src={selectedRecord.stnk_photo.startsWith('data:image')
                                                    ? selectedRecord.stnk_photo
                                                    : `${baseurl}/backend/uploads/trucks/${selectedRecord.stnk_photo}`}
                                                alt="STNK"
                                                className="w-full h-32 object-cover rounded-lg border mx-auto transition-transform group-hover:scale-105"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                    const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                                                    if (nextElement) {
                                                        nextElement.style.display = 'block';
                                                    }
                                                }}
                                            />
                                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                                                <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-sm font-medium">
                                                    Click to zoom
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="w-full h-32 bg-gray-100 rounded-lg border flex items-center justify-center">
                                            <span className="text-gray-400 text-sm">No image</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Dialog open={!!zoomImage} onOpenChange={closeZoom}>
                {/* <DialogPortal> */}
                <DialogOverlay className="fixed inset-0 bg-black/80" />
                <DialogContent className="max-w-[70vw] max-h-[70vh] w-full h-full p-0 items-center justify-center flex bg-transparent border-none shadow-none">
                    <div className="relative w-full h-full flex items-center justify-center">
                        <button
                            onClick={closeZoom}
                            className="absolute top-4 right-4 z-50 bg-black/50 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-black/70 transition-all"
                            aria-label="Close zoom"
                        >
                            ✕
                        </button>
                        {zoomImage && (
                            <img
                                src={zoomImage.src}
                                alt={zoomImage.alt}
                                className="max-w-full max-h-full object-contain rounded-lg"
                                onError={(e) => {
                                    console.error('Failed to load zoomed image:', zoomImage.src);
                                }}
                            />
                        )}
                    </div>
                </DialogContent>
                {/* </DialogPortal> */}
            </Dialog>
            {/* Image Modal */}
            {/* {modalImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80"
                    onClick={() => setModalImage(null)}
                >
                    <img
                        src={modalImage}
                        alt="Full Preview"
                        className="max-h-[90vh] max-w-[90vw] rounded-lg shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    />
                    <button
                        className="absolute top-4 right-4 text-white text-3xl font-bold bg-black bg-opacity-50 rounded-full px-3 py-1"
                        onClick={() => setModalImage(null)}
                    >
                        ×
                    </button>
                </div>
            )} */}
        </>
    );
}
