import React, { useState } from "react";
import { TruckHistoryRecord } from "../../../types/truck.types";
import { formatDateTime, formatIsoForDisplay } from "../../../lib/utils";
interface TruckModalProps {
    selectedRecord: TruckHistoryRecord | null;
    onClose: () => void;
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
    if (!selectedRecord) return null;
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
                                <h3 className="font-semibold text-gray-900 pt-4">Timing Information</h3>
                                <div className="space-y-2 text-sm">
                                    <div><span className="font-semibold text-slate-600">Date:</span> {formatDate(selectedRecord.date) || 'N/A'}</div>
                                    <div><span className="font-semibold text-slate-600">ETA:</span> {selectedRecord.eta || 'N/A'}</div>
                                    <div><span className="font-semibold text-slate-600">Arrival Time:</span> {selectedRecord.arrivaltime ? formatIsoForDisplay(selectedRecord.arrivaltime) : 'N/A'}</div>
                                    <div><span className="font-semibold text-slate-600">Waiting For Weighing/Timbang:</span> {selectedRecord.waitingfortimbang ? formatTime(selectedRecord.waitingfortimbang) : 'N/A'}</div>
                                    <div><span className="font-semibold text-slate-600">Start Weighing/Timbang:</span> {selectedRecord.starttimbang ? formatTime(selectedRecord.starttimbang) : 'N/A'}</div>
                                    <div><span className="font-semibold text-slate-600">Finish Weighing/Timbang:</span> {selectedRecord.finishtimbang ? formatTime(selectedRecord.finishtimbang) : 'N/A'}</div>
                                    <div><span className="font-semibold text-slate-600">Total Process Weighing/Timbang:</span> {selectedRecord.totalprocesstimbang ? formatTime(selectedRecord.totalprocesstimbang) : 'N/A'}</div>
                                    <div><span className="font-semibold text-slate-600">Go to HPC:</span> {selectedRecord.runtohpc ? formatTime(selectedRecord.runtohpc) : 'N/A'}</div>
                                    <div><span className="font-semibold text-slate-600">Entry HPC:</span> {selectedRecord.entryhpc ? formatTime(selectedRecord.entryhpc) : 'N/A'}</div>
                                    <div><span className="font-semibold text-slate-600">Waiting For Arrival at HPC:</span> {selectedRecord.waitingforarrivalhpc ? formatTime(selectedRecord.waitingforarrivalhpc) : 'N/A'}</div>
                                    <div><span className="font-semibold text-slate-600">Waiting For Loading/Unloading (Muat/Bongkar) :</span> {selectedRecord.actualwaitloadingtime ? formatTime(selectedRecord.actualwaitloadingtime) : 'N/A'}</div>
                                    <div><span className="font-semibold text-slate-600">Start Loading/Unloading Time :</span> {selectedRecord.startloadingtime ? formatTime(selectedRecord.startloadingtime) : 'N/A'}</div>
                                    <div><span className="font-semibold text-slate-600">Finish Loading/Unloading Time :</span> {selectedRecord.finishloadingtime ? formatTime(selectedRecord.finishloadingtime) : 'N/A'}</div>
                                    <div><span className="font-semibold text-slate-600">Total Process Loading/Unloading :</span> {selectedRecord.totalprocessloadingtime ? formatTime(selectedRecord.totalprocessloadingtime) : 'N/A'}</div>
                                </div>
                            </div>
                        </div>  
                    </div>  
                </div>
            </div>
            {/* Image Modal */}
            {modalImage && (
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
            )}
        </>
    );
}