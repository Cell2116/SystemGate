// TODO Add Select Option For Action Scan ( use Modal Dialog )

import Clock2 from "../components/dashboard/clock"
import { PackageOpen, Scan as ScanIcon, Truck, Package } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { useDashboardStore } from "@/store/dashboardStore"
import { useScannerStore } from "../store/scannerStore"
import ActionModal from "@/components/trucks/actionModal"

export default function Scan() {
    const openActionModal = useScannerStore((state) => state.openActionModal);
    // useEffect(() => {
    //     openActionModal("SUPT12345", "SU");
    // }, [openActionModal]);
    const scanInputRef = useRef<HTMLInputElement>(null);
    const [countdown, setCountdown] = useState<number | null>(null);
    
    const {
        scannedData,
        scanResult,
        lastScanTime,
        isScanning,
        scanBuffer,
        scanHistory,
        lastTruckUpdate,
        clearScan,
        processScan
    } = useScannerStore();
    useEffect(() => {
        if (scanInputRef.current) {
            scanInputRef.current.focus();
        }
    }, []);
    
    useEffect(() => {
        let countdownInterval: NodeJS.Timeout;
        let autoClearTimeout: NodeJS.Timeout;
        if (scannedData && (scanResult || lastTruckUpdate)) {
            
            setCountdown(5);
            
            countdownInterval = setInterval(() => {
                setCountdown(prev => {
                    if (prev === null || prev <= 1) {
                        return null;
                    }
                    return prev - 1;
                });
            }, 1000);
            
            autoClearTimeout = setTimeout(() => {

                clearScan();
                setCountdown(null);
            }, 5000);
        }
        return () => {
            if (countdownInterval) {
                clearInterval(countdownInterval);
            }
            if (autoClearTimeout) {
                clearTimeout(autoClearTimeout);
            }
        };
    }, [scannedData, scanResult, lastTruckUpdate, clearScan]);
    return (
        <div className="relative min-h-screen bg-gray-50">
            {/* Clock - Fixed position, responsive sizing */}
            {/* <div className="fixed right-1 mt-1">
                <div className="scale-75 sm:scale-100">
                    <Clock2 />
                </div>
            </div> */}
            {/* Main Content - Proper spacing and responsive padding */}
            <div className="px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
                {/* Header - Responsive spacing */}
                <div className="text-center mb-6">
                    <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800">
                        Truck Scanning Station
                    </h1>
                    <p className="text-xs sm:text-sm text-green-600">
                        Scan truck QR code using Ultron scanner
                    </p>
                    <ActionModal/>
                </div>
                {/* Main Scan Area - Better mobile spacing */}
                <div className="flex flex-col items-center space-y-4 sm:space-y-6 pb-6">
                    {/* Large Scan Box - Responsive sizing */}
                    <div className="w-full max-w-sm sm:max-w-2xl lg:max-w-4xl">
                        <div className={`
                            relative bg-white border-2 sm:border-3 rounded-xl p-3 sm:p-4 lg:p-6 shadow-lg transition-all duration-300
                            ${isScanning ? 'border-blue-500 bg-blue-50' :
                                scanResult === 'loading' ? 'border-blue-500 bg-blue-50' :
                                    scanResult === 'unloading' ? 'border-green-500 bg-green-50' :
                                        'border-gray-300 hover:border-gray-400'}
                        `}>
                            {/* Scan Icon - Responsive sizing */}
                            <div className="text-center mb-3">
                                <div className={`
                                    inline-flex p-2 sm:p-3 rounded-full transition-all duration-300
                                    ${isScanning ? 'bg-blue-200 animate-pulse' :
                                        scanResult === 'loading' ? 'bg-blue-200' :
                                            scanResult === 'unloading' ? 'bg-green-200' :
                                                'bg-gray-200'}
                                `}>
                                    <ScanIcon className={`
                                        w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 transition-colors duration-300
                                        ${isScanning ? 'text-blue-600' :
                                            scanResult === 'loading' ? 'text-blue-600' :
                                                scanResult === 'unloading' ? 'text-green-600' :
                                                    'text-gray-600'}
                                    `} />
                                </div>
                            </div>
                            {/* Status Text - Responsive typography */}
                            <div className="text-center mb-3 sm:mb-4">
                                {isScanning ? (
                                    <p className="text-base sm:text-lg font-semibold text-blue-600">Processing scan...</p>
                                ) : scanResult || lastTruckUpdate ? (
                                    <div className="space-y-1 sm:space-y-2">
                                        <p className="text-base sm:text-lg font-bold text-gray-800">Scan Successful!</p>
                                        {scanResult && (
                                            <p className={`text-sm sm:text-base font-semibold ${scanResult === 'loading' ? 'text-blue-600' : 'text-green-600'
                                                }`}>
                                                Operation: {scanResult === 'loading' ? 'LOADING (CU)' : 'UNLOADING (SU)'}
                                            </p>
                                        )}
                                        {lastTruckUpdate && (
                                            <p className="text-sm font-semibold text-purple-600">
                                                Truck Status Updated: {lastTruckUpdate.newStatus}
                                            </p>
                                        )}
                                        <p className="text-xs text-gray-500">Scanned at: {lastScanTime}</p>
                                        {countdown !== null && (
                                            <p className="text-xs text-blue-600 animate-pulse">
                                                Auto-clearing in {countdown} seconds...
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div>
                                        <p className="text-sm sm:text-base font-semibold text-gray-600 mb-1">Ready to Scan</p>
                                    </div>
                                )}
                            </div>
                            {/* Scanner Input Display - Responsive sizing */}
                            <div className="w-full mb-3">
                                <input
                                    ref={scanInputRef}
                                    type="text"
                                    value={scannedData || ""}
                                    placeholder="Waiting for scanner input..."
                                    className="w-full p-2 sm:p-3 text-center text-xs sm:text-sm border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                                    readOnly
                                    disabled
                                />
                                <p className="text-xs text-gray-500 mt-1 text-center">
                                    🔒 Scanner Only - Manual input disabled
                                </p>
                            </div>
                            {/* Display scanned data - Responsive text */}
                            {scannedData && countdown !== null && (
                                <div className="mt-2 p-2 bg-gray-100 rounded text-xs sm:text-sm text-center">
                                    Last Scan: <span className="font-mono font-semibold break-all">{scannedData}</span>
                                </div>
                            )}
                            {/* Clear Button - Responsive sizing */}
                            {(scannedData || scanResult || lastTruckUpdate) && (
                                <div className="text-center mt-3">
                                    <button
                                        onClick={() => {
                                            clearScan();
                                            setCountdown(null);
                                        }}
                                        className="px-3 py-2 sm:px-4 sm:py-2 border border-gray-300 rounded-lg text-xs sm:text-sm hover:bg-gray-50 transition-colors"
                                    >
                                        {countdown !== null ? `Clear Now (${countdown}s)` : 'Clear & Scan Again'}
                                    </button>
                                </div>
                            )}
                        </div>
                    <ActionModal/>
                    </div>
                    {/* Two Result Boxes - Responsive grid and spacing */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 w-full max-w-sm sm:max-w-2xl lg:max-w-4xl">
                        {/* Loading Box (CU) - Responsive padding and text */}
                        <div className={`
                            bg-white border-2 rounded-lg p-3 sm:p-4 shadow-md transition-all duration-300
                            ${(scanResult === 'loading' || (lastTruckUpdate && lastTruckUpdate.operation === 'muat'))
                                ? 'border-blue-500 bg-blue-50 transform scale-105 shadow-lg'
                                : 'border-gray-300 hover:border-blue-300'}
                        `}>
                            <div className="text-center">
                                <div className={`
                                    inline-flex p-2 rounded-full mb-2
                                    ${(scanResult === 'loading' || (lastTruckUpdate && lastTruckUpdate.operation === 'muat'))
                                        ? 'bg-blue-200' : 'bg-gray-200'}
                                `}>
                                    <Truck className={`
                                        w-4 h-4 sm:w-5 sm:h-5
                                        ${(scanResult === 'loading' || (lastTruckUpdate && lastTruckUpdate.operation === 'muat'))
                                            ? 'text-blue-600' : 'text-gray-600'}
                                    `} />
                                </div>
                                <h3 className={`
                                    text-sm sm:text-base font-bold mb-1
                                    ${(scanResult === 'loading' || (lastTruckUpdate && lastTruckUpdate.operation === 'muat'))
                                        ? 'text-blue-600' : 'text-gray-600'}
                                `}>
                                    LOADING
                                </h3>
                                <p className="text-xs sm:text-sm text-gray-600 mb-1">Code: CU</p>
                                <p className="text-xs text-gray-500 mb-2 px-2">
                                    Truck is being loaded with goods
                                </p>
                                {scanResult === 'loading' && !lastTruckUpdate && (
                                    <div className="p-2 bg-blue-100 rounded text-xs">
                                        <p className="text-blue-800 font-semibold">✓ Loading Detected</p>
                                        <p className="text-blue-600 truncate">Truck: {scannedData}</p>
                                    </div>
                                )}
                                {lastTruckUpdate && lastTruckUpdate.operation === 'muat' && (
                                    <div className="p-2 bg-blue-100 rounded text-xs space-y-1">
                                        <p className="text-blue-800 font-semibold">🚛 Truck Status Updated</p>
                                        <div className="space-y-1">
                                            <p className="text-blue-700 truncate">
                                                <span className="font-medium">Ticket:</span> {lastTruckUpdate.ticketNumber}
                                            </p>
                                            <p className="text-blue-700 truncate">
                                                <span className="font-medium">Plate:</span> {lastTruckUpdate.platenumber}
                                            </p>
                                            <p className="text-blue-700">
                                                <span className="font-medium">Status:</span>
                                                <span className={`ml-1 px-2 py-1 rounded text-xs font-semibold ${lastTruckUpdate.newStatus === 'Loading' ? 'bg-yellow-100 text-yellow-800' :
                                                        lastTruckUpdate.newStatus === 'Finished' ? 'bg-green-100 text-green-800' :
                                                            'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {lastTruckUpdate.newStatus}
                                                </span>
                                            </p>
                                            <p className="text-blue-600 text-xs truncate">
                                                Updated: {new Date(lastTruckUpdate.timestamp).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        {/* Unloading Box (SU) - Responsive padding and text */}
                        <div className={`
                            bg-white border-2 rounded-lg p-3 sm:p-4 shadow-md transition-all duration-300
                            ${(scanResult === 'unloading' || (lastTruckUpdate && lastTruckUpdate.operation === 'bongkar'))
                                ? 'border-green-500 bg-green-50 transform scale-105 shadow-lg'
                                : 'border-gray-300 hover:border-green-300'}
                        `}>
                            <div className="text-center">
                                <div className={`
                                    inline-flex p-2 rounded-full mb-2
                                    ${(scanResult === 'unloading' || (lastTruckUpdate && lastTruckUpdate.operation === 'bongkar'))
                                        ? 'bg-green-200' : 'bg-gray-200'}
                                `}>
                                    <Package className={`
                                        w-4 h-4 sm:w-5 sm:h-5
                                        ${(scanResult === 'unloading' || (lastTruckUpdate && lastTruckUpdate.operation === 'bongkar'))
                                            ? 'text-green-600' : 'text-gray-600'}
                                    `} />
                                </div>
                                <h3 className={`
                                    text-sm sm:text-base font-bold mb-1
                                    ${(scanResult === 'unloading' || (lastTruckUpdate && lastTruckUpdate.operation === 'bongkar'))
                                        ? 'text-green-600' : 'text-gray-600'}
                                `}>
                                    UNLOADING
                                </h3>
                                <p className="text-xs sm:text-sm text-gray-600 mb-1">Code: SU</p>
                                <p className="text-xs text-gray-500 mb-2 px-2">
                                    Truck is being unloaded of goods
                                </p>
                                {scanResult === 'unloading' && !lastTruckUpdate && (
                                    <div className="p-2 bg-green-100 rounded text-xs">
                                        <p className="text-green-800 font-semibold">✓ Unloading Detected</p>
                                        <p className="text-green-600 truncate">Truck: {scannedData}</p>
                                    </div>
                                )}
                                {lastTruckUpdate && lastTruckUpdate.operation === 'bongkar' && (
                                    <div className="p-2 bg-green-100 rounded text-xs space-y-1">
                                        <p className="text-green-800 font-semibold">🚛 Truck Status Updated</p>
                                        <div className="space-y-1">
                                            <p className="text-green-700 truncate">
                                                <span className="font-medium">Ticket:</span> {lastTruckUpdate.ticketNumber}
                                            </p>
                                            <p className="text-green-700 truncate">
                                                <span className="font-medium">Plate:</span> {lastTruckUpdate.platenumber}
                                            </p>
                                            <p className="text-green-700">
                                                <span className="font-medium">Status:</span>
                                                <span className={`ml-1 px-2 py-1 rounded text-xs font-semibold ${lastTruckUpdate.newStatus === 'Loading' ? 'bg-yellow-100 text-yellow-800' :
                                                        lastTruckUpdate.newStatus === 'Finished' ? 'bg-green-100 text-green-800' :
                                                            'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {lastTruckUpdate.newStatus}
                                                </span>
                                            </p>
                                            <p className="text-green-600 text-xs truncate">
                                                Updated: {new Date(lastTruckUpdate.timestamp).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}