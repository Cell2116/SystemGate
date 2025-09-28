// import PlaceholderPage from "./PlaceholderPage";

// export default function Scan(){
//     return(
//         <PlaceholderPage
//         title="Scan"
//         description="This page will be use for scanning the actual time of loading and unloading of the Trucks from Internal or External."
//         />
//     )
// }

// TODO Make it Responsive for mobile 
// TODO Fix Resize the component
import Clock2 from "../components/dashboard/clock"
import { PackageOpen, Scan as ScanIcon, Truck, Package } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { useDashboardStore } from "@/store/dashboardStore"
import { useScannerStore } from "../store/scannerStore"

export default function Scan(){
    const scanInputRef = useRef<HTMLInputElement>(null);
    const [countdown, setCountdown] = useState<number | null>(null);
    
    // Use global scanner store
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

    // Focus on input when component mounts for better UX with scanner
    useEffect(() => {
        if (scanInputRef.current) {
            scanInputRef.current.focus();
        }
    }, []);

    // Auto-clear functionality after successful scan
    useEffect(() => {
        let countdownInterval: NodeJS.Timeout;
        let autoClearTimeout: NodeJS.Timeout;

        if (scannedData && (scanResult || lastTruckUpdate)) {
            // Start countdown from 5 seconds
            setCountdown(5);
            
            // Update countdown every second
            countdownInterval = setInterval(() => {
                setCountdown(prev => {
                    if (prev === null || prev <= 1) {
                        return null;
                    }
                    return prev - 1;
                });
            }, 1000);

            // Clear scan data after 5 seconds
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

    return(
        <div className="relative min-h-screen p-3 overflow-y-auto">
            <div className="absolute right-3 top-3 z-10">
                <Clock2/>   
            </div>
            
            {/* Header */}
            <div className="text-center mb-4 pt-2">
                <h1 className="text-xl font-bold text-gray-800 mb-1">Truck Scanning Station</h1>
                <p className="text-sm text-gray-600">Scan truck QR code using Ultron scanner</p>
                {scanBuffer && (
                    <div className="mt-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs inline-block">
                        🔍 Scanning: {scanBuffer}...
                    </div>
                )}
                {/* {countdown !== null && (
                    <div className="mt-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs inline-block animate-pulse">
                        🕒 Auto-clear in {countdown}s
                    </div>
                )} */}
                <div className="mt-1">
                    <span className="text-xs text-green-600 font-medium">
                        ✓ Global Scanner Active - Works from any page
                    </span>
                </div>
            </div>

            {/* Main Scan Area */}
            <div className="flex flex-col items-center space-y-4 pb-6">
                {/* Large Scan Box */}
                <div className="w-full max-w-4xl">
                    <div className={`
                        relative bg-white border-3 rounded-xl p-4 shadow-lg transition-all duration-300
                        ${isScanning ? 'border-blue-500 bg-blue-50' : 
                            scanResult === 'loading' ? 'border-blue-500 bg-blue-50' :
                            scanResult === 'unloading' ? 'border-green-500 bg-green-50' :
                            'border-gray-300 hover:border-gray-400'}
                    `}>
                        {/* Scan Icon */}
                        <div className="text-center mb-3">
                            <div className={`
                                inline-flex p-2 rounded-full transition-all duration-300
                                ${isScanning ? 'bg-blue-200 animate-pulse' :
                                    scanResult === 'loading' ? 'bg-blue-200' :
                                    scanResult === 'unloading' ? 'bg-green-200' :
                                    'bg-gray-200'}
                            `}>
                                <ScanIcon className={`
                                    w-6 h-6 transition-colors duration-300
                                    ${isScanning ? 'text-blue-600' :
                                        scanResult === 'loading' ? 'text-blue-600' :
                                        scanResult === 'unloading' ? 'text-green-600' :
                                        'text-gray-600'}
                                `} />
                            </div>
                        </div>

                        {/* Status Text */}
                        <div className="text-center mb-3">
                            {isScanning ? (
                                <p className="text-lg font-semibold text-blue-600">Processing scan...</p>
                            ) : scanResult || lastTruckUpdate ? (
                                <div>
                                    <p className="text-lg font-bold text-gray-800 mb-1">Scan Successful!</p>
                                    {scanResult && (
                                        <p className={`text-sm font-semibold ${
                                            scanResult === 'loading' ? 'text-blue-600' : 'text-green-600'
                                        }`}>
                                            Operation: {scanResult === 'loading' ? 'LOADING (CU)' : 'UNLOADING (SU)'}
                                        </p>
                                    )}
                                    {lastTruckUpdate && (
                                        <p className="text-sm font-semibold text-purple-600">
                                            Truck Status Updated: {lastTruckUpdate.newStatus}
                                        </p>
                                    )}
                                    <p className="text-xs text-gray-500 mt-1">Scanned at: {lastScanTime}</p>
                                    {countdown !== null && (
                                        <p className="text-xs text-blue-600 mt-1 animate-pulse">
                                            Auto-clearing in {countdown} seconds...
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    <p className="text-base font-semibold text-gray-600 mb-1">Ready to Scan</p>
                                    {/* <p className="text-sm text-gray-500">Point Ultron scanner at truck QR code</p> */}
                                </div>
                            )}
                        </div>

                        {/* Scanner Input Display - Read Only */}
                        <div className="w-full">
                            <input
                                ref={scanInputRef}
                                type="text"
                                value={scannedData || ""}
                                placeholder="Waiting for scanner input..."
                                className="w-full p-2 text-center text-sm border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                                readOnly
                                disabled
                            />
                            <p className="text-xs text-gray-500 mt-1 text-center">
                                🔒 Scanner Only - Manual input disabled
                            </p>
                        </div>
                        
                        {/* Display scanned data if available */}
                        {scannedData && (
                            <div className="mt-2 p-2 bg-gray-100 rounded text-sm text-center">
                                Last Scan: <span className="font-mono font-semibold">{scannedData}</span>
                            </div>
                        )}

                        {/* Clear Button */}
                        {(scannedData || scanResult || lastTruckUpdate) && (
                            <div className="text-center mt-2">
                                <button 
                                    onClick={() => {
                                        clearScan();
                                        setCountdown(null);
                                    }}
                                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                                >
                                    {countdown !== null ? `Clear Now (${countdown}s)` : 'Clear & Scan Again'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Scan History */}
                {/* {scanHistory.length > 0 && (
                    <div className="w-full max-w-4xl">
                        <h3 className="text-base font-semibold text-gray-700 mb-2 text-center">Recent Scans</h3>
                        <div className="space-y-1 max-h-24 overflow-y-auto">
                            {scanHistory.slice(0, 5).map((scan, index) => (
                                <div key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded text-sm">
                                    <span className="font-mono text-gray-600">{scan.data}</span>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                            scan.result === 'loading' ? 'bg-blue-100 text-blue-800' :
                                            scan.result === 'unloading' ? 'bg-green-100 text-green-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                            {scan.result ? scan.result.toUpperCase() : 'UNKNOWN'}
                                        </span>
                                        <span className="text-xs text-gray-500">{scan.timestamp}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )} */}

                {/* Two Result Boxes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
                    {/* Loading Box (CU) */}
                    <div className={`
                        bg-white border-2 rounded-lg p-3 shadow-md transition-all duration-300
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
                                    w-5 h-5
                                    ${(scanResult === 'loading' || (lastTruckUpdate && lastTruckUpdate.operation === 'muat'))
                                        ? 'text-blue-600' : 'text-gray-600'}
                                `} />
                            </div>
                            <h3 className={`
                                text-base font-bold mb-1
                                ${(scanResult === 'loading' || (lastTruckUpdate && lastTruckUpdate.operation === 'muat'))
                                    ? 'text-blue-600' : 'text-gray-600'}
                            `}>
                                LOADING
                            </h3>
                            <p className="text-sm text-gray-600 mb-1">Code: CU</p>
                            <p className="text-xs text-gray-500 mb-2">
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
                                        <p className="text-blue-700"><span className="font-medium">Ticket:</span> {lastTruckUpdate.ticketNumber}</p>
                                        <p className="text-blue-700"><span className="font-medium">Plate:</span> {lastTruckUpdate.plateNumber}</p>
                                        <p className="text-blue-700">
                                            <span className="font-medium">Status:</span> 
                                            <span className={`ml-1 px-2 py-1 rounded text-xs font-semibold ${
                                                lastTruckUpdate.newStatus === 'Loading' ? 'bg-yellow-100 text-yellow-800' :
                                                lastTruckUpdate.newStatus === 'Finished' ? 'bg-green-100 text-green-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                                {lastTruckUpdate.newStatus}
                                            </span>
                                        </p>
                                        <p className="text-blue-600 text-xs">Updated: {new Date(lastTruckUpdate.timestamp).toLocaleString()}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Unloading Box (SU) */}
                    <div className={`
                        bg-white border-2 rounded-lg p-3 shadow-md transition-all duration-300
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
                                    w-5 h-5
                                    ${(scanResult === 'unloading' || (lastTruckUpdate && lastTruckUpdate.operation === 'bongkar'))
                                        ? 'text-green-600' : 'text-gray-600'}
                                `} />
                            </div>
                            <h3 className={`
                                text-base font-bold mb-1
                                ${(scanResult === 'unloading' || (lastTruckUpdate && lastTruckUpdate.operation === 'bongkar'))
                                    ? 'text-green-600' : 'text-gray-600'}
                            `}>
                                UNLOADING
                            </h3>
                            <p className="text-sm text-gray-600 mb-1">Code: SU</p>
                            <p className="text-xs text-gray-500 mb-2">
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
                                        <p className="text-green-700"><span className="font-medium">Ticket:</span> {lastTruckUpdate.ticketNumber}</p>
                                        <p className="text-green-700"><span className="font-medium">Plate:</span> {lastTruckUpdate.plateNumber}</p>
                                        <p className="text-green-700">
                                            <span className="font-medium">Status:</span> 
                                            <span className={`ml-1 px-2 py-1 rounded text-xs font-semibold ${
                                                lastTruckUpdate.newStatus === 'Loading' ? 'bg-yellow-100 text-yellow-800' :
                                                lastTruckUpdate.newStatus === 'Finished' ? 'bg-green-100 text-green-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                                {lastTruckUpdate.newStatus}
                                            </span>
                                        </p>
                                        <p className="text-green-600 text-xs">Updated: {new Date(lastTruckUpdate.timestamp).toLocaleString()}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

