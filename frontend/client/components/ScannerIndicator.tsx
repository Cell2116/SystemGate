import { useScannerStore } from '../store/scannerStore';

export const ScannerIndicator = () => {
    const { scanBuffer, scannedData, lastScanTime } = useScannerStore();

    if (!scanBuffer && !scannedData) return null;

    return (
        <div className="fixed top-4 right-4 z-50 max-w-sm">
            {/* Scanning Buffer Indicator */}
            {scanBuffer && (
                <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-3 py-2 rounded-lg shadow-lg mb-2 animate-pulse">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-yellow-600 rounded-full animate-bounce"></div>
                        <span className="text-sm font-medium">Scanning...</span>
                    </div>
                    <div className="text-xs font-mono mt-1">{scanBuffer}</div>
                </div>
            )}
            
            {/* Last Scan Result */}
            {scannedData && !scanBuffer && (
                <div className="bg-green-100 border border-green-400 text-green-800 px-3 py-2 rounded-lg shadow-lg">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                        <span className="text-sm font-medium">Last Scan</span>
                    </div>
                    <div className="text-xs font-mono mt-1 truncate">{scannedData}</div>
                    <div className="text-xs text-green-600 mt-1">{lastScanTime}</div>
                </div>
            )}
        </div>
    );
};

export default ScannerIndicator;