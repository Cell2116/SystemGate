import { useState } from "react";
import { HistoryRecord } from "@/types/employee.types";
import { formatDateTime, formatCustomDateTime } from "@/lib/utils";

interface EmployeeModalProps {
    selectedRecord: HistoryRecord | null;
    setSelectedRecord: (record: HistoryRecord | null) => void;
}

export default function EmployeeModal({
    selectedRecord,
    setSelectedRecord
}: EmployeeModalProps) {
    const [modalImage, setModalImage] = useState<string | null>(null);

    if (!selectedRecord) return null;

    return (
        <>
            {/* Detail Modal */}
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
                onClick={() => setSelectedRecord(null)}
            >
                <div
                    className="bg-white rounded-lg shadow-xl max-w-4xl max-h-[90vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900">Record Details</h2>
                            <button
                                onClick={() => setSelectedRecord(null)}
                                className="text-gray-400 hover:text-gray-600 text-2xl"
                            >
                                ×
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Basic Info */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-gray-900">Basic Information</h3>
                                <div className="space-y-2 text-sm">
                                    <div><span className="font-medium">Name:</span> {selectedRecord.name}</div>
                                    <div><span className="font-medium">UID:</span> {selectedRecord.uid}</div>
                                    <div><span className="font-medium">Department:</span> {selectedRecord.department}</div>
                                    <div><span className="font-medium">License Plate:</span> {selectedRecord.licenseplate}</div>
                                    <div><span className="font-medium">Entry:</span> {formatDateTime(selectedRecord.datein)}</div>
                                    <div><span className="font-medium">Exit:</span> {formatDateTime(selectedRecord.dateout)}</div>
                                </div>
                            </div>

                            {/* Leave Permission Info */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-gray-900">Leave Permission</h3>
                                {selectedRecord.leave_permission_id ? (
                                    <div className="space-y-2 text-sm">
                                        <div><span className="font-medium">Reason:</span> {selectedRecord.leave_reason}</div>
                                        <div><span className="font-medium">Planned Exit:</span> {formatCustomDateTime(selectedRecord.planned_exit_time)}</div>
                                        <div><span className="font-medium">Planned Return:</span> {formatCustomDateTime(selectedRecord.planned_return_time)}</div>
                                        <div><span className="font-medium">Actual Exit:</span> {formatDateTime(selectedRecord.actual_exittime)}</div>
                                        <div><span className="font-medium">Actual Return:</span> {formatDateTime(selectedRecord.actual_returntime)}</div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500">No leave permission for this record</p>
                                )}
                            </div>
                        </div>

                        {/* Images */}
                        <div className="mt-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Photos</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {selectedRecord.image_path && (
                                    <div className="text-center">
                                        <p className="text-sm font-medium mb-2">Entry</p>
                                        <img
                                            src={`http://192.168.4.108:3000/uploads/${selectedRecord.image_path}`}
                                            alt="Entry"
                                            className="w-full h-24 object-cover rounded border cursor-pointer"
                                            onClick={() => setModalImage(`http://192.168.4.108:3000/uploads/${selectedRecord.image_path}`)}
                                        />
                                    </div>
                                )}
                                {selectedRecord.image_path_out && (
                                    <div className="text-center">
                                        <p className="text-sm font-medium mb-2">Exit</p>
                                        <img
                                            src={`http://192.168.4.108:3000/uploads/${selectedRecord.image_path_out}`}
                                            alt="Exit"
                                            className="w-full h-24 object-cover rounded border cursor-pointer"
                                            onClick={() => setModalImage(`http://192.168.4.108:3000/uploads/${selectedRecord.image_path_out}`)}
                                        />
                                    </div>
                                )}
                                {selectedRecord.image_path_leave_exit && (
                                    <div className="text-center">
                                        <p className="text-sm font-medium mb-2">Leave Exit</p>
                                        <img
                                            src={`http://192.168.4.108:3000/uploads/${selectedRecord.image_path_leave_exit}`}
                                            alt="Leave Exit"
                                            className="w-full h-24 object-cover rounded border cursor-pointer"
                                            onClick={() => setModalImage(`http://192.168.4.108:3000/uploads/${selectedRecord.image_path_leave_exit}`)}
                                        />
                                    </div>
                                )}
                                {selectedRecord.image_path_leave_return && (
                                    <div className="text-center">
                                        <p className="text-sm font-medium mb-2">Leave Return</p>
                                        <img
                                            src={`http://192.168.4.108:3000/uploads/${selectedRecord.image_path_leave_return}`}
                                            alt="Leave Return"
                                            className="w-full h-24 object-cover rounded border cursor-pointer"
                                            onClick={() => setModalImage(`http://192.168.4.108:3000/uploads/${selectedRecord.image_path_leave_return}`)}
                                        />
                                    </div>
                                )}
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