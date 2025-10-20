// src/components/trucks/shared/modals/TruckDetailModal.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CombinedTruckData } from "@/store/truckStore";
import { formatIsoForDisplay, formatIntervalDisplay } from "@/lib/utils";
import { useState } from "react";
import { TicketPreview } from "@/components/trucks/barcode/TicketPreview";
interface TruckDetailModalProps {
    truck: CombinedTruckData | null;
    isOpen: boolean;
    onClose: (open: boolean) => void;
}
export default function TruckDetailModal({ truck, isOpen, onClose }: TruckDetailModalProps) {
    const [zoomImage, setZoomImage] = useState<{
        src: string;
        alt: string;
        label: string;
    } | null>(null);
    const [isPrinting, setIsPrinting] = useState(false);
    if (!truck) return null;
    const handleImageClick = (src: string, alt: string, label: string) => {
        setZoomImage({ src, alt, label });
    };
    const closeZoom = () => {
        setZoomImage(null);
    };
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

    const handlePrintTicket = async () => {
        if (!truck?.noticket) {
            alert('Ticket number tidak tersedia untuk record ini');
            return;
        }
        try {
            setIsPrinting(true);
            const printContents = document.getElementById("print-barcode-area")?.innerHTML;
            if (printContents) {
                const printWindow = window.open("", "", "width=600,height=400");
                if (printWindow) {
                    printWindow.document.write(`
                        <html>
                            <head>
                                <title>Print Ticket - ${truck.noticket}</title>
                                <style>
                                    body { font-family: Arial, sans-serif; margin: 20px; }
                                    .print-content { text-align: center; }
                                </style>
                            </head>
                            <body>
                                <div class="print-content">
                                    ${printContents}
                                </div>
                            </body>
                        </html>
                    `);
                    printWindow.document.close();
                    printWindow.print();
                }
            }

        } catch (error) {
            console.error('Error printing ticket:', error);
            alert('Gagal print ticket. Silakan coba lagi.');
        } finally {
            setIsPrinting(false);
        }
    };
    const convertToFormData = (truck: CombinedTruckData) => {
        return {
            plateNumber: truck.platenumber || '',
            driver: truck.driver || '',
            supplier: truck.supplier || '',
            arrivalTime: truck.arrivaltime || '',
            noticket: truck.noticket || '',
            department: truck.department || '',
            nikdriver: truck.nikdriver || '',
            tlpdriver: truck.tlpdriver || '',
            nosj: truck.nosj || '',
            tglsj: truck.tglsj || '',
            descin: truck.descin || '',
            descout: truck.descout || '',
            statustruck: truck.statustruck || '',
            type: truck.type || '',
            operation: truck.type || '',
            goods: truck.goods || '',
            quantity: '',
            unit: '',
            date: truck.date || '',
            armada: truck.armada || '',
            kelengkapan: truck.kelengkapan || '',
            jenismobil: truck.jenismobil || ''
        };
    };
    const formData = convertToFormData(truck);
    const operationType = truck.type === 'Inbound' ? 'muat' : 'bongkar';
    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <div className="flex justify-between items-center">
                            <DialogTitle>Truck Details - {truck.platenumber}</DialogTitle>
                            {truck.noticket && (
                                <button
                                    onClick={handlePrintTicket}
                                    disabled={isPrinting}
                                    className="px-4 py-2 bg-blue-600 mr-4 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                                >
                                    {isPrinting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Printing...
                                        </>
                                    ) : (
                                        <>
                                            🖨️ Print Ticket
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </DialogHeader>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Basic Info - First Column */}
                        <div className="space-y-3">
                            <h3 className="font-semibold text-gray-900 mb-3">Basic Information</h3>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Plate Number</label>
                                <p className="text-sm text-gray-900">{truck.platenumber}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Ticket Number</label>
                                <p className="text-sm text-gray-900">{truck.noticket}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Driver</label>
                                <p className="text-sm text-gray-900">{truck.driver}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">NIK Driver</label>
                                <p className="text-sm text-gray-900">{truck.nikdriver}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Phone Driver</label>
                                <p className="text-sm text-gray-900">{truck.tlpdriver}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Department</label>
                                <p className="text-sm text-gray-900">{truck.department}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Supplier</label>
                                <p className="text-sm text-gray-900">{truck.supplier}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Goods</label>
                                <p className="text-sm text-gray-900">{truck.goods}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Type</label>
                                <p className="text-sm text-gray-900">{truck.type}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Status</label>
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${truck.status === 'waiting' ? 'bg-yellow-100 text-yellow-800' :
                                        truck.status === 'timbang' ? 'bg-blue-100 text-blue-800' :
                                            truck.status === 'loading' ? 'bg-orange-100 text-orange-800' :
                                                'bg-green-100 text-green-800'
                                    }`}>
                                    {truck.status?.toUpperCase()}
                                </span>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Truck Status</label>
                                <p className="text-sm text-gray-900">{truck.statustruck}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Armada</label>
                                <p className="text-sm text-gray-900">{truck.armada}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Vehicle Type</label>
                                <p className="text-sm text-gray-900">{truck.jenismobil}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Description In</label>
                                <p className="text-sm text-gray-900">{truck.descin}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Description Out</label>
                                <p className="text-sm text-gray-900">{truck.descout}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Surat Jalan Number</label>
                                <p className="text-sm text-gray-900">{truck.nosj}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Surat Jalan Date</label>
                                <p className="text-sm text-gray-900">{formatIsoForDisplay(truck.tglsj) || '-'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Kelengkapan</label>
                                <p className="text-sm text-gray-900">{truck.kelengkapan}</p>
                            </div>
                        </div>
                        {/* Timing & Additional Info - Second Column */}
                        <div className="space-y-3">
                            <h3 className="font-semibold text-gray-900 mb-3">Timing & Details</h3>
                            <div>
                                <label className="text-sm font-medium text-gray-500">ETA</label>
                                <p className="text-sm text-gray-900">{truck.eta || '-'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Arrival Time</label>
                                <p className="text-sm text-gray-900">{formatIsoForDisplay(truck.arrivaltime) || '-'}</p>
                            </div>
                            <div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Waiting for Weighing/Timbang</label>
                                <p className="text-sm text-gray-900">{formatTime(truck.waitingfortimbang) || '-'}</p>
                            </div>
                                <label className="text-sm font-medium text-gray-500">Start Weighing/Timbang</label>
                                <p className="text-sm text-gray-900">{formatTime(truck.starttimbang) || '-'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Finish Weighing/Timbang</label>
                                <p className="text-sm text-gray-900">{formatTime(truck.finishtimbang) || '-'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Total Process Weighing/Timbang</label>
                                <p className="text-sm text-gray-900">{formatTime(truck.totalprocesstimbang) || '-'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Go to HPC</label>
                                <p className="text-sm text-gray-900">{formatTime(truck.runtohpc) || '-'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Entry HPC</label>
                                <p className="text-sm text-gray-900">{formatTime(truck.entryhpc) || '-'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Waiting for Arrival at HPC</label>
                                <p className="text-sm text-gray-900">{formatTime(truck.totalwaitingarrival) || '-'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Start Loading/Unloading Time</label>
                                <p className="text-sm text-gray-900">{formatTime(truck.startloadingtime) || '-'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Waiting For Loading/Unloading</label>
                                <p className="text-sm text-gray-900">{formatTime(truck.actualwaitloadingtime)}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Finish Loading/Unloading Time</label>
                                <p className="text-sm text-gray-900">{formatTime(truck.finishloadingtime) || '-'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Total Process Loading Time</label>
                                <p className="text-sm text-gray-900">{formatTime(truck.totalprocessloadingtime)}</p>
                            </div>
                        </div>
                        {/* Ticket Preview - Third Column */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-gray-900 mb-3">Ticket Preview</h3>
                            {truck.noticket ? (
                                <TicketPreview
                                    formData={formData}
                                    previewTicketNumber={truck.noticket}
                                    onPrintTicket={handlePrintTicket}
                                    operationType={operationType}
                                />
                            ) : (
                                <div className="p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
                                    ⚠️ Ticket number tidak tersedia untuk record ini
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Images Section - Full Width */}
                    <div className="mt-6">
                        <h3 className="font-semibold text-gray-900 mb-3">Captured Images</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="text-center">
                                <label className="text-xs font-medium text-gray-500 block mb-2">Driver Photo</label>
                                {truck.driver_photo ? (
                                    <div className="relative group cursor-pointer" onClick={() => handleImageClick(
                                        truck.driver_photo!.startsWith('data:image')
                                            ? truck.driver_photo!
                                            : `http://192.168.4.108:3000/uploads/trucks/${truck.driver_photo}`,
                                        "Driver",
                                        "Driver Photo"
                                    )}>
                                        <img
                                            src={truck.driver_photo.startsWith('data:image')
                                                ? truck.driver_photo
                                                : `http://192.168.4.108:3000/uploads/trucks/${truck.driver_photo}`}
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
                                {truck.sim_photo ? (
                                    <div className="relative group cursor-pointer" onClick={() => handleImageClick(
                                        truck.sim_photo!.startsWith('data:image')
                                            ? truck.sim_photo!
                                            : `http://192.168.4.108:3000/uploads/trucks/${truck.sim_photo}`,
                                        "SIM",
                                        "SIM Photo"
                                    )}>
                                        <img
                                            src={truck.sim_photo.startsWith('data:image')
                                                ? truck.sim_photo
                                                : `http://192.168.4.108:3000/uploads/trucks/${truck.sim_photo}`}
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
                                {truck.stnk_photo ? (
                                    <div className="relative group cursor-pointer" onClick={() => handleImageClick(
                                        truck.stnk_photo!.startsWith('data:image')
                                            ? truck.stnk_photo!
                                            : `http://192.168.4.108:3000/uploads/trucks/${truck.stnk_photo}`,
                                        "STNK",
                                        "STNK Photo"
                                    )}>
                                        <img
                                            src={truck.stnk_photo.startsWith('data:image')
                                                ? truck.stnk_photo
                                                : `http://192.168.4.108:3000/uploads/trucks/${truck.stnk_photo}`}
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
                </DialogContent>
            </Dialog>
            {/* Image Zoom Modal */}
            <Dialog open={!!zoomImage} onOpenChange={closeZoom}>
                <DialogContent className="max-w-[70vw] max-h-[70vh] w-full h-full p-0 items-center justify-center flex bg-transparent border-none shadow-none">
                    <div className="relative w-full h-full flex items-center justify-center bg-black bg-opacity-90">
                        <button
                            onClick={closeZoom}
                            className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-70 transition-all"
                            aria-label="Close zoom"
                        >
                            ✕
                        </button>
                        {zoomImage && (
                            <img
                                src={zoomImage.src}
                                alt={zoomImage.alt}
                                className="max-w-full max-h-full object-contain"
                                onError={(e) => {
                                    console.error('Failed to load zoomed image:', zoomImage.src);
                                }}
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}