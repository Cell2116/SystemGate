// src/components/trucks/shared/modals/TruckDetailModal.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogOverlay } from "@/components/ui/dialog";
import { CombinedTruckData } from "@/store/truckStore";
import { formatIsoForDisplay, formatIntervalDisplay } from "@/lib/utils";
import { useState } from "react";
import { TicketPreview } from "@/components/trucks/barcode/TicketPreview";
import JsBarcode from "jsbarcode";

import React from 'react'
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
    const [currentCycle, setCurrentCycle] = useState<number>(1);
    const [cycleData, setCycleData] = useState<CombinedTruckData | null>(truck);
    const [hasCycle2, setHasCycle2] = useState<boolean>(false);
    const baseurl = import.meta.env.VITE_API_BASE_URL

    React.useEffect(() => {
        if (truck) {
            const fetchCycleData = async () => {
                // const baseurl = "http://192.168.4.108:3000";
                try {
                    // Check for cycle 2
                    const cycle2Response = await fetch(`${baseurl}/api/trucks/history?offset=0`);
                    const cycle2Data = await cycle2Response.json();

                    if (cycle2Data && Array.isArray(cycle2Data)) {
                        const targetId = String(truck.id);
                        const hasCycle2Record = cycle2Data.some(
                            (r: CombinedTruckData) => String(r.id) === targetId
                        );
                        setHasCycle2(hasCycle2Record);
                        console.log("Cycle 2 availability:", hasCycle2Record);
                    }

                    // Fetch cycle 1 data
                    const response = await fetch(`${baseurl}/api/trucks?offset=0`);
                    const data = await response.json();

                    if (data && Array.isArray(data)) {
                        const targetId = String(truck.id);
                        const defaultRecord = data.find(
                            (r: CombinedTruckData) => String(r.id) === targetId
                        );
                        if (defaultRecord) {
                            console.log("Found default cycle record:", defaultRecord);
                            setCycleData(defaultRecord);
                        } else {
                            console.warn("No initial record found for truck ID:", truck.id);
                            setCycleData(truck);
                        }
                    }
                } catch (error) {
                    console.error("Failed to fetch default cycle data:", error);
                }
            };
            fetchCycleData();
        }
    }, [truck]);
    if (!truck) return null;
    const handleImageClick = (src: string, alt: string, label: string) => {
        setZoomImage({ src, alt, label });
    };
    const closeZoom = () => {
        setZoomImage(null);
    };
    // const baseurl = "http://192.168.4.108:3000";

    // const handleCycleButton = async () => {
    //     if (!hasCycle2) return;

    //     const nextCycle = currentCycle === 1 ? 2 : 1;
    //     setCurrentCycle(nextCycle);
    //     try {
    //         const currentOffset = currentCycle === 1 ? 0 : 1;
    //         const nextOffset = currentOffset === 0 ? 1 : 0;
    //         const nextCycle = nextOffset === 0 ? 1 : 2;

    //         const response = await fetch(`${baseurl}/api/trucks/history?offset=${nextOffset}`);
    //         const data = await response.json();

    //         if (data && Array.isArray(data)) {
    //             // Convert IDs to strings for comparison
    //             const targetId = String(truck?.id);
    //             const updatedRecord = data.find(
    //                 (r: CombinedTruckData) => String(r.id) === targetId
    //             );
    //             if (updatedRecord) {
    //                 console.log("Found matching record:", updatedRecord);
    //                 setCycleData(updatedRecord);
    //                 setCurrentCycle(nextCycle);
    //             } else {
    //                 console.warn("No matching record found for ID:", truck?.id);
    //                 // Debug: Log all IDs from the response
    //                 console.log("Available IDs in response:", data.map(r => r.id));
    //             }
    //         } else {
    //             console.warn("Invalid data format received:", data);
    //         }
    //     } catch (error) {
    //         console.error("Failed to fetch next cycle data:", error);
    //     }
    // };
    const handleCycleButton = async () => {
        if (!hasCycle2) return;

        try {
            const TOTAL_CYCLE = 3;

            const newCycle = currentCycle % TOTAL_CYCLE + 1;
            const offset = newCycle - 1;
            console.log("Switching cycle:", currentCycle, "→", newCycle);
            console.log("Using offset:", offset);
            const response = await fetch(`${baseurl}/api/trucks/history?offset=${offset}`);
            const data = await response.json();
            if (Array.isArray(data)) {
                const targetId = String(truck?.id);
                const updatedRecord = data.find(
                    (r: CombinedTruckData) => String(r.id) === targetId
                );
                if (updatedRecord) {
                    setCycleData(updatedRecord);
                    setCurrentCycle(newCycle);  // set ONCE
                } else {
                    console.warn("Record not found for ID:", truck?.id);
                    console.log("IDs in response:", data.map(r => r.id));
                }
            } else {
                console.warn("Invalid API data:", data);
            }

        } catch (error) {
            console.error("Failed to fetch next cycle:", error);
        }
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

            const formatDate = (isoString: string): string => {
                if (!isoString) return '-';
                const date = new Date(isoString);
                const pad = (n: number) => String(n).padStart(2, "0");
                return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`;
            };

            const formatTime = (isoString: string): string => {
                if (!isoString) return '-';
                const date = new Date(isoString);
                if (isNaN(date.getTime())) return '-';
                const pad = (n: number) => String(n).padStart(2, "0");
                return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
            };

            // Tentukan label Supplier / Customer dari kode tiket
            const ticketCode = truck.noticket.toUpperCase();
            const supplierLabel = ticketCode.startsWith("SU")
                ? "Supplier"
                : ticketCode.startsWith("CU")
                    ? "Customer"
                    : "Supplier";

            // Generate barcode ke canvas
            const canvas = document.createElement("canvas");
            JsBarcode(canvas, truck.noticket, {
                format: "CODE128",
                lineColor: "#000",
                width: 2.2,
                height: 50,
                displayValue: true,
                fontSize: 12,
                margin: 2,
            });
            const barcodeDataUrl = canvas.toDataURL("image/png");

            // Jenis barang readable text
            const jenisBarangText =
                truck.jenisbarang === "BP"
                    ? "Bahan Pembantu"
                    : truck.jenisbarang === "BB"
                        ? "Bahan Baku"
                        : truck.jenisbarang === "MESIN"
                            ? "Mesin"
                            : "Lainnya";

            // Buka jendela print
            const printWindow = window.open("", "_blank", "width=600,height=600");
            if (!printWindow) {
                alert("Popup diblokir! Harap izinkan pop-up untuk mencetak tiket.");
                return;
            }

            printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Print Ticket - ${truck.noticket}</title>
                <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                body {
                    margin: 0;
                    padding: 0;
                    background: white;
                    font-family: Arial, sans-serif;
                }
                .ticket {
                    width: 80mm;
                    padding: 4mm;
                    box-sizing: border-box;
                    font-size: 10px;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                }
                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding-bottom: 3mm;
                    border-bottom: 1px solid #ccc;
                }
                .title {
                    font-weight: bold;
                    font-size: 12px;
                }
                .queue {
                    text-align: right;
                }
                .queue small {
                    display: block;
                    font-size: 7px;
                    font-weight: 600;
                }   
                .queue strong {
                    display: block;
                    font-size: 16px;
                    font-weight: bold;
                }
                .info {
                    display: flex;
                    justify-content: space-between;
                    padding: 3mm 0;
                    flex-grow: 1;
                }
                .left, .right {
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    line-height: 1.5;
                }
                .right {
                    text-align: right;
                }
                .barcode {
                    text-align: center;
                    margin: 3mm 0;
                }
                .barcode img {
                    max-width: 100%;
                    height: auto;
                }
                .footer {
                    text-align: center;
                    font-size: 9px;
                    padding-top: 2mm;
                    border-top: 1px solid #ccc;
                }
                @media print {
                    @page {
                    size: 80mm auto;
                    margin: 0;
                    }
                    body {
                    margin: 0;
                    padding: 0;
                    }
                    .ticket {
                    border: none;
                    }
                }
                </style>
            </head>
            <body>
                <div class="ticket">
                <div class="header">
                    <span class="title">Gateway System</span>
                    <div class="queue">
                    <small>No. Antrean</small>
                    <strong>${truck.noticket.slice(-2)}</strong>
                    </div>
                </div>
                
                <div class="info">
                    <div class="left">
                    <div><strong>Driver:</strong> ${truck.driver || '-'}</div>
                    <div><strong>Plat:</strong> ${truck.platenumber || '-'}</div>
                    <div><strong>Armada:</strong> ${truck.armada || '-'}</div>
                    <div><strong>Tanggal:</strong> ${formatDate(truck.date)}</div>
                    <div><strong>Waktu:</strong> ${formatTime(truck.arrivaltime)}</div>
                    <div><strong>Dept:</strong> ${truck.department || '-'}</div>
                    </div>
                    <div class="right">
                    <div><strong>${supplierLabel}:</strong> ${truck.supplier || '-'}</div>
                    <div><strong>Jenis:</strong> ${jenisBarangText}</div>
                    <div><strong>Jumlah:</strong> ${truck.descin || '-'}</div>
                    </div>
                </div>
                
                <div class="barcode">
                    <img src="${barcodeDataUrl}" alt="Barcode">
                </div>
                
                <div class="footer">
                    PT. Alkindo Naratama TBK
                </div>
                </div>
                
                <script>
                window.onload = function() {
                    setTimeout(function() {
                    window.print();
                    window.onafterprint = function() {
                        window.close();
                    };
                    }, 200);
                };
                </script>
            </body>
            </html>
    `);
            printWindow.document.close();
        } catch (error) {
            console.error("Error printing ticket:", error);
            alert("Gagal print ticket. Silakan coba lagi.");
        } finally {
            setIsPrinting(false);
        }
    };


    // const handlePrintTicket = async () => {
    //         if (!truck?.noticket) {
    //             alert('Ticket number tidak tersedia untuk record ini');
    //             return;
    //         }
    //         try {
    //             setIsPrinting(true);
    //             const formatDate = (isoString: string): string => {
    //                 if (!isoString) return '-';
    //                 const date = new Date(isoString);
    //                 const pad = (n: number) => String(n).padStart(2, "0");
    //                 return `${date.getDate()}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`;
    //             };
    //             const formatTime = (isoString: string): string => {
    //                 if (!isoString) return 'Not set';
    //                 const dateTimeStr = isoString.replace('T', ' ').split('.')[0];
    //                 if (dateTimeStr.includes(' ')) {
    //                     const timePart = dateTimeStr.split(' ')[1];
    //                     return timePart || 'Not set';
    //                 }
    //                 const date = new Date(isoString);
    //                 if (!isNaN(date.getTime())) {
    //                     const pad = (n: number) => String(n).padStart(2, "0");
    //                     return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    //                 }
    //                 return isoString;
    //             };
    //             const canvas = document.createElement('canvas');
    //             JsBarcode(canvas, truck.noticket, {
    //                 format: "CODE128",
    //                 lineColor: "#000",
    //                 width: 2,
    //                 height: 60,
    //                 displayValue: true,
    //                 fontSize: 16,
    //                 margin: 10,
    //             });
    //             const barcodeDataUrl = canvas.toDataURL('image/png');
    //             const jenisBarangText = truck.jenisbarang === "BP"
    //                 ? "Bahan Pembantu"
    //                 : truck.jenisbarang === "BB"
    //                     ? "Bahan Baku"
    //                     : truck.jenisbarang === "mesin"
    //                         ? "Mesin"
    //                         : "Lainnya";
    //             const printWindow = window.open("", "", "width=800,height=600");
    //             if (printWindow) {
    //                 printWindow.document.write(`
    //             <!DOCTYPE html>
    //             <html>
    //                 <head>
    //                     <title>Print Ticket - ${truck.noticket}</title>
    //                     <style>
    //                         * {
    //                             margin: 0;
    //                             padding: 0;
    //                             box-sizing: border-box;
    //                         }
    //                         body { 
    //                             font-family: Arial, sans-serif;
    //                             padding: 20px;
    //                             display: flex;
    //                             justify-content: center;
    //                             align-items: center;
    //                             // min-height: 100vh;
    //                         }
    //                         .ticket-container {
    //                             background: white;
    //                             width: 700px;
    //                             padding: 10px;
    //                             border: 2px solid #000;
    //                         }
    //                         .header {
    //                             display: flex;
    //                             justify-content: space-between;
    //                             align-items: center;
    //                             margin-bottom: 15px;
    //                             padding-bottom: 10px;
    //                             border-bottom: 1px solid #ccc;
    //                         }
    //                         .logo-section {
    //                             display: flex;
    //                             align-items: center;
    //                             gap: 8px;
    //                         }
    //                         .logo {
    //                             width: 32px;
    //                             height: 32px;
    //                             font-weight: bold;
    //                         }
    //                         .company-name {
    //                             font-weight: bold;
    //                             font-size: 16px;
    //                         }
    //                         .queue-section {
    //                             text-align: right;
    //                         }
    //                         .queue-label {
    //                             font-size: 12px;
    //                             font-weight: 600;
    //                         }
    //                         .queue-number {
    //                             font-size: 24px;
    //                             font-weight: bold;
    //                         }
    //                         .info-section {
    //                             display: flex;
    //                             justify-content: space-between;
    //                             margin-bottom: 1px;
    //                             font-size: 13px;
    //                         }
    //                         .info-left, .info-right {
    //                             line-height: 1.6;
    //                         }
    //                         .info-right {
    //                             text-align: right;
    //                             font-weight: 600;
    //                         }
    //                         .barcode-section {
    //                             text-align: center;
    //                             font-weight: 900;
    //                             margin: 1px 0;
    //                         }
    //                         .barcode-image {
    //                             max-width: 100%;
    //                             height: auto;
    //                         }
    //                         .footer {
    //                             text-align: center;
    //                             font-size: 14px;
    //                             margin-top: 1px;
    //                             padding-top: 1px;
    //                             border-top: 1px solid #ccc;
    //                         }
    //                         @media print {
    //                             body {
    //                                 padding: 0;
    //                             }
    //                             .ticket-container {
    //                                 border: none;
    //                             }
    //                         }
    //                     </style>
    //                 </head>
    //                 <body>
    //                     <div class="ticket-container">
    //                         <!-- Header -->
    //                         <div class="header">
    //                             <div class="logo-section">
    //                                 <img src="../../dist/spa/alkindo-naratama-tbk--600-removebg-preview.png" 
    //                                     alt="Alkindo Logo" 
    //                                     class="logo"
    //                                     onerror="this.style.display='none'">
    //                                 <span class="company-name">Gateway System</span>
    //                             </div>
    //                             <div class="queue-section">
    //                                 <div class="queue-label">No. Antrean</div>
    //                                 <div class="queue-number">${truck.noticket.slice(-2)}</div>
    //                             </div>
    //                         </div>

    //                         <!-- Info Section -->
    //                         <div class="info-section">
    //                             <div class="info-left">
    //                                 <div>${truck.driver || '-'}</div>
    //                                 <div>${truck.platenumber || '-'}</div>
    //                                 <div>${truck.armada || '-'}</div>
    //                                 <div style="margin-top: 8px;">${formatDate(truck.date)}</div>
    //                                 <div>${formatTime(truck.arrivaltime)}</div>
    //                                 <div>${truck.department || '-'}</div>
    //                             </div>
    //                             <div class="info-right">
    //                                 <div>${truck.supplier || '-'}</div>
    //                                 <div>${jenisBarangText}</div>
    //                                 <div>${truck.descin || '-'}</div>
    //                             </div>
    //                         </div>

    //                         <!-- Barcode -->
    //                         <div class="barcode-section">
    //                             <img src="${barcodeDataUrl}" alt="Barcode" class="barcode-image">
    //                         </div>

    //                         <!-- Footer -->
    //                         <div class="footer">
    //                             PT. Alkindo Naratama TBK
    //                         </div>
    //                     </div>

    //                     <script>
    //                         window.onload = function() {
    //                             setTimeout(function() {
    //                                 window.print();
    //                                 window.onafterprint = function() {
    //                                     window.close();
    //                                 };
    //                             }, 250);
    //                         };
    //                     </script>
    //                 </body>
    //             </html>
    //         `);
    //                 printWindow.document.close();
    //             }
    //         } catch (error) {
    //             console.error('Error printing ticket:', error);
    //             alert('Gagal print ticket. Silakan coba lagi.');
    //         } finally {
    //             setIsPrinting(false);
    //         }
    //     };
    const convertToFormData = (truck: CombinedTruckData) => {
        return {
            // plateNumber: truck.platenumber || '',
            platenumber: truck.platenumber || '',
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
            jenisbarang: truck.jenisbarang || '',
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
                                <label className="text-sm font-medium text-gray-500">Goods Type</label>
                                <p className="text-sm text-gray-900">{truck.jenisbarang}</p>
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
                            <div className="flex flex-row gap-4 items-center">
                                <h3 className="font-semibold text-gray-900">Timing & Details</h3>
                                <button
                                    type="button"
                                    className={`px-3 py-1 text-xs font-bold h-7 rounded transition-colors ${hasCycle2
                                        ? 'bg-gray-300 hover:bg-gray-200 cursor-pointer'
                                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                        }`}
                                    onClick={handleCycleButton}
                                    disabled={!hasCycle2}
                                    title={!hasCycle2 ? "No cycle 2 data available" : "Switch cycle"}
                                >
                                    Cycle {currentCycle} {!hasCycle2 && '(Only)'}
                                </button>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">ETA</label>
                                <p className="text-sm text-gray-900">{cycleData?.eta || '-'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Arrival Time</label>
                                <p className="text-sm text-gray-900">{formatIsoForDisplay(cycleData?.arrivaltime) || '-'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Waiting For Weighing/Timbang</label>
                                <p className="text-sm text-gray-900">{cycleData?.waitingfortimbang ? formatTime(cycleData.waitingfortimbang) : '-'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Start Weighing/Timbang Gross</label>
                                <p className="text-sm text-gray-900">{cycleData?.starttimbang ? formatTime(cycleData.starttimbang) : '-'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Finish Weighing/Timbang Gross</label>
                                <p className="text-sm text-gray-900">{cycleData?.finishtimbang ? formatTime(cycleData.finishtimbang) : '-'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Total Process Weighing/Timbang</label>
                                <p className="text-sm text-gray-900">{cycleData?.totalprocesstimbang ? formatTime(cycleData.totalprocesstimbang) : '-'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Go to HPC</label>
                                <p className="text-sm text-gray-900">{cycleData?.runtohpc ? formatTime(cycleData.runtohpc) : '-'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Entry HPC</label>
                                <p className="text-sm text-gray-900">{cycleData?.entryhpc ? formatTime(cycleData.entryhpc) : '-'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Waiting For Arrival at HPC</label>
                                <p className="text-sm text-gray-900">{cycleData?.waitingforarrivalhpc ? formatTime(cycleData.waitingforarrivalhpc) : '-'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Go to PT</label>
                                <p className="text-sm text-gray-900">{cycleData?.runtopt ? formatTime(cycleData.runtopt) : '-'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Waiting For Arrival at PT</label>
                                <p className="text-sm text-gray-900">{cycleData?.waitingforarrivalpt ? formatTime(cycleData.waitingforarrivalpt) : '-'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Entry PT</label>
                                <p className="text-sm text-gray-900">{cycleData?.entrypt ? formatTime(cycleData.entrypt) : '-'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Waiting For Loading/Unloading</label>
                                <p className="text-sm text-gray-900">{cycleData?.actualwaitloadingtime ? formatTime(cycleData.actualwaitloadingtime) : '-'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Start Loading/Unloading Time</label>
                                <p className="text-sm text-gray-900">{cycleData?.startloadingtime ? formatTime(cycleData.startloadingtime) : '-'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Finish Loading/Unloading Time</label>
                                <p className="text-sm text-gray-900">{cycleData?.finishloadingtime ? formatTime(cycleData.finishloadingtime) : '-'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Total Process Loading/Unloading</label>
                                <p className="text-sm text-gray-900">{cycleData?.totalprocessloadingtime ? formatTime(cycleData.totalprocessloadingtime) : '-'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Start Weighing/Timbang Neto</label>
                                <p className="text-sm text-gray-900">{cycleData?.starttimbangneto ? formatTime(cycleData.starttimbangneto) : '-'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Finish Weighing/Timbang Neto</label>
                                <p className="text-sm text-gray-900">{cycleData?.finishtimbangneto ? formatTime(cycleData.finishtimbangneto) : '-'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Waiting for Weighing/Timbang Neto</label>
                                <p className="text-sm text-gray-900">{cycleData?.waitingfortimbangneto ? formatTime(cycleData.waitingfortimbangneto) : '-'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Total Process Weighing/Timbang Neto</label>
                                <p className="text-sm text-gray-900">{cycleData?.totalprocesstimbangneto ? formatTime(cycleData.totalprocesstimbangneto) : '-'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Waiting for Exit</label>
                                <p className="text-sm text-gray-900">{cycleData?.waitingforexit ? formatTime(cycleData.waitingforexit) : '-'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Exit</label>
                                <p className="text-sm text-gray-900">{cycleData?.exittime ? formatTime(cycleData.exittime) : '-'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Total Truck Completion Time</label>
                                <p className="text-sm font-bold bg-green-300 text-green-900 p-1 rounded inline-block">
                                    {cycleData?.totaltruckcompletiontime ? formatTime(cycleData.totaltruckcompletiontime) : '-'}
                                </p>
                            </div>
                            {/* <div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Waiting for Weighing/Timbang</label>
                                    <p className="text-sm text-gray-900">{formatTime(truck.waitingfortimbang) || '-'}</p>
                                </div>
                                <label className="text-sm font-medium text-gray-500">Start Weighing/Timbang</label>
                                <p className="text-sm text-gray-900">{formatTime(truck.starttimbang) || '-'}</p>
                            </div> */}
                            {/* <div>
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
                            </div> */}
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
                                            // : `http://192.168.4.108:3000/uploads/trucks/${truck.driver_photo}`,
                                            : `${baseurl}/uploads/trucks/${truck.driver_photo}`,
                                        "Driver",
                                        "Driver Photo"
                                    )}>
                                        <img
                                            src={truck.driver_photo.startsWith('data:image')
                                                ? truck.driver_photo
                                                // : `http://192.168.4.108:3000/uploads/trucks/${truck.driver_photo}`}
                                                : `${baseurl}/uploads/trucks/${truck.driver_photo}`}
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
                                            : `${baseurl}/uploads/trucks/${truck.sim_photo}`,
                                        // : `http://192.168.4.108:3000/uploads/trucks/${truck.sim_photo}`,
                                        "SIM",
                                        "SIM Photo"
                                    )}>
                                        <img
                                            src={truck.sim_photo.startsWith('data:image')
                                                ? truck.sim_photo
                                                : `${baseurl}/uploads/trucks/${truck.sim_photo}`}
                                            // : `http://192.168.4.108:3000/uploads/trucks/${truck.sim_photo}`}
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
                                            : `${baseurl}/uploads/trucks/${truck.stnk_photo}`,
                                        // : `http://192.168.4.108:3000/uploads/trucks/${truck.stnk_photo}`,
                                        "STNK",
                                        "STNK Photo"
                                    )}>
                                        <img
                                            src={truck.stnk_photo.startsWith('data:image')
                                                ? truck.stnk_photo
                                                : `${baseurl}/uploads/trucks/${truck.stnk_photo}`}
                                            // : `http://192.168.4.108:3000/uploads/trucks/${truck.stnk_photo}`}
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
        </>
    );
}