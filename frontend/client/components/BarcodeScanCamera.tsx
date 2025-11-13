import { useState, useEffect, useRef } from 'react';
import { Camera, X, Scan } from 'lucide-react';

interface CameraScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onScan: (data: string) => void;
}

// Define Quagga result type to avoid 'any' type error
interface QuaggaResult {
    codeResult?: {
        code: string;
    };
}

const CameraScannerModal: React.FC<CameraScannerModalProps> = ({ isOpen, onClose, onScan }) => {
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState<string>('');
    const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
    const [selectedCamera, setSelectedCamera] = useState<string>('');
    const [hasStarted, setHasStarted] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const isScanningRef = useRef<boolean>(false);

    // Load QuaggaJS dynamically
    const loadQuagga = async () => {
        if ((window as any).Quagga) return (window as any).Quagga;

        try {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@ericblade/quagga2@1.8.1/dist/quagga.min.js';
            document.head.appendChild(script);

            await new Promise((resolve, reject) => {
                script.onload = resolve;
                script.onerror = reject;
                setTimeout(() => reject(new Error('Quagga load timeout')), 5000);
            });
            return (window as any).Quagga;
        } catch (err) {
            console.error('Failed to load Quagga:', err);
            return null;
        }
    };

    // Get available cameras when modal opens
    useEffect(() => {
        if (!isOpen) return;

        const getCameras = async () => {
            try {
                await navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
                    stream.getTracks().forEach(track => track.stop());
                });

                const devices = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = devices.filter(device => device.kind === 'videoinput');
                setCameras(videoDevices);

                if (videoDevices.length > 0) {
                    const backCamera = videoDevices.find(device =>
                        device.label.toLowerCase().includes('back') ||
                        device.label.toLowerCase().includes('rear')
                    );
                    setSelectedCamera(backCamera?.deviceId || videoDevices[0].deviceId);
                }
            } catch (err) {
                console.error('Error getting cameras:', err);
                setError('Could not access camera. Please grant camera permissions.');
            }
        };

        getCameras();
    }, [isOpen]);

    // Start camera stream
    const startCamera = async () => {
        try {
            setError('');
            setHasStarted(true);

            const constraints: MediaStreamConstraints = {
                video: {
                    deviceId: selectedCamera ? { exact: selectedCamera } : undefined,
                    facingMode: selectedCamera ? undefined : { ideal: 'environment' },
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;

                videoRef.current.onloadedmetadata = () => {
                    videoRef.current?.play().then(() => {
                        setIsScanning(true);
                        isScanningRef.current = true;
                        console.log('Camera started successfully');
                    }).catch(err => {
                        console.error('Play error:', err);
                        setError('Could not start video playback');
                    });
                };
            }
        } catch (err: any) {
            console.error('Camera error:', err);
            setError(`Camera access error: ${err.message || 'Unknown error'}`);
            setIsScanning(false);
            setHasStarted(false);
        }
    };

    // One-shot scan function
    const performScan = async () => {
        if (!isScanningRef.current || !videoRef.current || !canvasRef.current) {
            setError('Camera not ready.');
            return;
        }

        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (video.readyState !== video.HAVE_ENOUGH_DATA || video.videoWidth === 0) {
            setError('Video not ready. Please wait and try again.');
            console.log('Video not ready:', video.readyState, video.videoWidth);
            return;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            setError('Canvas not supported.');
            return;
        }

        try {
            console.log('Drawing to canvas...');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            const Quagga = await loadQuagga();
            if (!Quagga) throw new Error('Quagga failed to load');

            console.log('Scanning with Quagga...');
            Quagga.decodeSingle({
                src: canvas.toDataURL('image/png'),
                numOfWorkers: 0,  // Disable workers for simplicity
                inputStream: {
                    size: 800  // Resize for faster processing
                },
                locator: {
                    patchSize: 'medium',
                    halfSample: true
                },
                decoder: {
                    readers: ['code_128_reader', 'ean_reader', 'ean_8_reader', 'code_39_reader', 'code_93_reader', 'codabar_reader', 'upc_reader', 'upc_e_reader', 'i2of5_reader', '2of5_reader', 'code_32_reader']  // Support common barcodes
                }
            }, (result: QuaggaResult) => {  // Added type annotation here
                if (result && result.codeResult) {
                    console.log('Scan success! Decoded:', result.codeResult.code);
                    handleScanSuccess(result.codeResult.code);
                } else {
                    setError('No barcode detected. Ensure the barcode is in frame, well-lit, and try again.');
                }
            });
        } catch (err: any) {
            console.error('Scan error:', err);
            setError(`Scan failed: ${err.message || 'Unknown error'}. Try manual input.`);
        }
    };

    // Stop camera stream
    const stopCamera = () => {
        isScanningRef.current = false;
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsScanning(false);
        setHasStarted(false);
    };

    const handleScanSuccess = (decodedText: string) => {
        stopCamera();
        onScan(decodedText);  // Calls processScan, like portable scanner
        onClose();
    };

    // Cleanup
    useEffect(() => {
        if (!isOpen) {
            stopCamera();
            setError('');
            setCameras([]);
            setSelectedCamera('');
        }
    }, [isOpen]);

    useEffect(() => {
        return () => stopCamera();
    }, []);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center gap-2">
                        <Camera className="w-5 h-5 text-blue-600" />
                        <h2 className="text-lg font-semibold">Scan Barcode with Camera</h2>
                    </div>
                    <button
                        onClick={() => {
                            stopCamera();
                            onClose();
                        }}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4">
                    {/* Camera Selection */}
                    {cameras.length > 1 && !hasStarted && (
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Camera
                            </label>
                            <select
                                value={selectedCamera}
                                onChange={(e) => setSelectedCamera(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                {cameras.map((camera, index) => (
                                    <option key={camera.deviceId} value={camera.deviceId}>
                                        {camera.label || `Camera ${index + 1}`}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Video Preview */}
                    <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
                        <video
                            ref={videoRef}
                            className="w-full h-full object-cover"
                            playsInline
                            muted
                            autoPlay
                        />
                        <canvas ref={canvasRef} className="hidden" />

                        {/* Scanning Overlay */}
                        {isScanning && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="relative w-80 h-32">
                                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-500"></div>
                                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-500"></div>
                                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-500"></div>
                                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-500"></div>
                                    <div className="absolute inset-0 overflow-hidden flex items-center">
                                        <div className="w-full h-0.5 bg-green-500 animate-scan-line-horizontal shadow-lg"></div>
                                    </div>
                                </div>
                                <div className="absolute bottom-4 left-0 right-0 text-center">
                                    <div className="text-white text-xs bg-black bg-opacity-75 px-4 py-2 rounded-full inline-block">
                                        <p className="font-semibold">🔍 Ready to Scan</p>
                                        <p className="text-green-400 mt-1">Press "Scan Now" to capture barcode</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!hasStarted && !error && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-white text-center bg-black bg-opacity-50 p-6 rounded-lg">
                                    <Camera className="w-12 h-12 mx-auto mb-2" />
                                    <p className="font-semibold">Click "Start Camera" to begin</p>
                                    <p className="text-sm text-gray-300 mt-2">Supports barcodes and QR codes</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600 font-semibold">❌ {error}</p>
                        </div>
                    )}

                    {/* Manual Input Fallback */}
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Or enter code manually:
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Type or paste barcode here..."
                                className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                        handleScanSuccess(e.currentTarget.value.trim());
                                    }
                                }}
                            />
                            <button
                                onClick={(e) => {
                                    const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
                                    if (input.value.trim()) {
                                        handleScanSuccess(input.value.trim());
                                    }
                                }}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 p-4 border-t bg-gray-50">
                    <button
                        onClick={() => {
                            stopCamera();
                            onClose();
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        Cancel
                    </button>
                    {!hasStarted && selectedCamera && (
                        <button
                            onClick={startCamera}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 font-semibold"
                        >
                            <Camera className="w-4 h-4" />
                            Start Camera
                        </button>
                    )}
                    {isScanning && (
                        <>
                            <button
                                onClick={performScan}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-semibold"
                            >
                                <Scan className="w-4 h-4" />
                                Scan Now
                            </button>
                            <button
                                onClick={stopCamera}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
                            >
                                Stop Camera
                            </button>
                        </>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes scan-line-horizontal {
                    0% { transform: translateY(-64px); opacity: 0; }
                    50% { opacity: 1; }
                    100% { transform: translateY(64px); opacity: 0; }
                }
                .animate-scan-line-horizontal {
                    animation: scan-line-horizontal 1.5s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
};

export default CameraScannerModal;
