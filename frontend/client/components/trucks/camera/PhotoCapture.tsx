import { useState, useRef, useEffect } from "react";
import { Button } from "../../ui/button";
import { CameraTarget } from "../../../types/truck.types";
import { CAMERA_LABELS } from "../../../constants/truck.constants";
interface PhotoCaptureProps {
    target: CameraTarget;
    onCapture: (target: CameraTarget, imageData: string) => void;
    capturedImage: string | null;
    showCamera: boolean;
    onStartCamera: (target: CameraTarget) => void;
    onStopCamera: () => void;
}
export function PhotoCapture({
    target,
    onCapture,
    capturedImage,
    showCamera,
    onStartCamera,
    onStopCamera,
}: PhotoCaptureProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    
    useEffect(() => {
        if (showCamera && videoRef.current) {
            
            navigator.mediaDevices
                .getUserMedia({
                    video: {
                        facingMode: "environment", 
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    }
                })
                .then((mediaStream) => {
                    setStream(mediaStream);
                    if (videoRef.current) {
                        videoRef.current.srcObject = mediaStream;
                        videoRef.current.play();
                    }
                })
                .catch((err) => {
                    console.error("Error accessing camera:", err);
                    
                    navigator.mediaDevices
                        .getUserMedia({ video: true })
                        .then((mediaStream) => {
                            setStream(mediaStream);
                            if (videoRef.current) {
                                videoRef.current.srcObject = mediaStream;
                                videoRef.current.play();
                            }
                        })
                        .catch((fallbackErr) => {
                            console.error("Error accessing any camera:", fallbackErr);
                            alert("Tidak dapat mengakses kamera. Pastikan browser memiliki izin kamera.");
                        });
                });
        }
        
        return () => {
            if (stream) {
                stream.getTracks().forEach((track) => track.stop());
                setStream(null);
            }
        };
    }, [showCamera]);
    
    useEffect(() => {
        if (!showCamera && stream) {
            stream.getTracks().forEach((track) => track.stop());
            setStream(null);
        }
    }, [showCamera, stream]);
    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const ctx = canvasRef.current.getContext("2d");
            if (ctx) {
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;
                ctx.drawImage(
                    videoRef.current,
                    0,
                    0,
                    canvasRef.current.width,
                    canvasRef.current.height,
                );
                
                const imageData = canvasRef.current.toDataURL("image/jpeg", 0.8);
                
                onCapture(target, imageData);
                
                handleStopCamera();
            }
        }
    };
    const handleStopCamera = () => {
        if (stream) {
            stream.getTracks().forEach((track) => track.stop());
            setStream(null);
        }
        onStopCamera();
    };
    const getTargetLabel = () => {
        return CAMERA_LABELS[target] || "Foto";
    };
    return (
        <div className="space-y-2">
            {/* Tombol untuk mulai camera */}
            {!showCamera && !capturedImage && (
                <Button
                    type="button"
                    onClick={() => onStartCamera(target)}
                    className="bg-blue-600 font-bold h-[2.7em] w-[7em] hover:bg-blue-300 text-[0.8em]"
                >
                    Ambil Foto
                </Button>
            )}
            {/* Camera preview saat sedang aktif */}
            {showCamera && (
                <div className="space-y-2">
                    <div className="flex flex-col items-center">
                        <video
                            ref={videoRef}
                            width={320}
                            height={240}
                            autoPlay
                            playsInline
                            className="rounded border w-full max-w-sm"
                        />
                        <div className="flex gap-2 mt-2">
                            <Button
                                type="button"
                                onClick={capturePhoto}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                Ambil Foto
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleStopCamera}
                            >
                                Batal
                            </Button>
                        </div>
                    </div>
                </div>
            )}
            {/* Preview gambar yang sudah diambil */}
            {capturedImage && (
                <div className="space-y-2">
                    <img
                        src={capturedImage}
                        alt={`Foto ${getTargetLabel()}`}
                        className="rounded border w-32"
                    />
                    <Button
                        type="button"
                        onClick={() => onStartCamera(target)}
                        className="bg-blue-600 font-bold h-[2.7em] w-[7em] hover:bg-blue-300 text-[0.8em]"
                    >
                        Ambil Ulang
                    </Button>
                </div>
            )}
            {/* Hidden canvas untuk capture */}
            <canvas
                ref={canvasRef}
                style={{ display: "none" }}
            />
        </div>
    );
}
