import { useState } from "react";
import { CameraTarget, CapturedImages } from "../types/truck.types";
export function useCameraCapture() {
  const [showCamera, setShowCamera] = useState(false);
  const [cameraTarget, setCameraTarget] = useState<CameraTarget | null>(null);
  const [capturedImages, setCapturedImages] = useState<CapturedImages>({
    driver: null,
    sim: null,
    stnk: null,
  });
  const startCamera = (target: CameraTarget) => {
    setCameraTarget(target);
    setShowCamera(true);
  };
  const stopCamera = () => {
    setShowCamera(false);
    setCameraTarget(null);
  };
  const handlePhotoCapture = (target: CameraTarget, imageData: string) => {
    setCapturedImages(prev => ({
      ...prev,
      [target]: imageData,
    }));
    setShowCamera(false);
    setCameraTarget(null);
  };
  const clearCapturedImage = (target: CameraTarget) => {
    setCapturedImages(prev => ({
      ...prev,
      [target]: null,
    }));
  };
  const clearAllImages = () => {
    setCapturedImages({
      driver: null,
      sim: null,
      stnk: null,
    });
  };
  const hasRequiredImages = (operation: "bongkar" | "muat", step: number) => {
    switch (operation) {
      case "bongkar":
        if (step === 1) {
          return !!capturedImages.driver;
        }
        if (step === 2) {
          return !!capturedImages.driver && !!capturedImages.sim && !!capturedImages.stnk;
        }
        return true;
      
      case "muat":
        if (step === 1) {
          return !!capturedImages.driver;
        }
        if (step === 2) {
          return !!capturedImages.driver && !!capturedImages.sim && !!capturedImages.stnk;
        }
        return true;
      
      default:
        return true;
    }
  };
  return {
    // States
    showCamera,
    cameraTarget,
    capturedImages,
    
    // Actions
    startCamera,
    stopCamera,
    handlePhotoCapture,
    clearCapturedImage,
    clearAllImages,
    
    // Utilities
    hasRequiredImages,
  };
}
