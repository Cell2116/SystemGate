import React, { useState } from "react";
import { TruckHistoryRecord } from "../../../types/truck.types";
import { formatDateTime } from "../../../lib/utils";

interface TruckModalProps {
    selectedRecord: TruckHistoryRecord | null;
    onClose: () => void;
}

export default function TruckModal({ selectedRecord, onClose }: TruckModalProps) {
    const [modalImage, setModalImage] = useState<string | null>(null);

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
                            </div>

                            {/* Shipment & Timing Info - Right Column */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-gray-900">Shipment Information</h3>
                                <div className="space-y-2 text-sm">
                                    <div><span className="font-semibold text-slate-600">Supplier:</span> {selectedRecord.supplier || 'N/A'}</div>
                                    <div><span className="font-semibold text-slate-600">Goods:</span> {selectedRecord.goods || 'N/A'}</div>
                                    <div><span className="font-semibold text-slate-600">No SJ:</span> {selectedRecord.nosj || 'N/A'}</div>
                                    <div><span className="font-semibold text-slate-600">Tanggal SJ:</span> {selectedRecord.tglsj || 'N/A'}</div>
                                    <div><span className="font-semibold text-slate-600">Armada:</span> {selectedRecord.armada || 'N/A'}</div>
                                    <div><span className="font-semibold text-slate-600">Kelengkapan:</span> {selectedRecord.kelengkapan || 'N/A'}</div>
                                </div>

                                <h3 className="font-semibold text-gray-900 pt-4">Timing Information</h3>
                                <div className="space-y-2 text-sm">
                                    <div><span className="font-semibold text-slate-600">Date:</span> {selectedRecord.date || 'N/A'}</div>
                                    <div><span className="font-semibold text-slate-600">Arrival Time:</span> {selectedRecord.arrivaltime ? formatDateTime(selectedRecord.arrivaltime) : 'N/A'}</div>
                                    <div><span className="font-semibold text-slate-600">ETA:</span> {selectedRecord.eta || 'N/A'}</div>
                                    <div><span className="font-semibold text-slate-600">Start Loading:</span> {selectedRecord.startloadingtime ? formatDateTime(selectedRecord.startloadingtime) : 'N/A'}</div>
                                    <div><span className="font-semibold text-slate-600">Finish Time:</span> {selectedRecord.finishloadingtime ? formatDateTime(selectedRecord.finishloadingtime) : 'N/A'}</div>
                                    <div><span className="font-semibold text-slate-600">Estimated Finish:</span> {selectedRecord.estimatedfinish ? formatDateTime(selectedRecord.estimatedfinish) : 'N/A'}</div>
                                </div>

                                <h3 className="font-semibold text-gray-900 pt-4">Additional Information</h3>
                                <div className="space-y-2 text-sm">
                                    <div><span className="font-semibold text-slate-600">Description In:</span> {selectedRecord.descin || 'N/A'}</div>
                                    <div><span className="font-semibold text-slate-600">Description Out:</span> {selectedRecord.descout || 'N/A'}</div>
                                    <div><span className="font-semibold text-slate-600">Status Truck:</span> {selectedRecord.statustruck || 'N/A'}</div>
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