import { Label } from "../../../ui/label";
import { PhotoCapture } from "../../camera/PhotoCapture";
import { CameraTarget } from "../../../../types/truck.types";

interface PhotoFieldsProps {
  capturedImages: Record<CameraTarget, string | null>;
  showCamera: boolean;
  cameraTarget: CameraTarget | null;
  onStartCamera: (target: CameraTarget) => void;
  onStopCamera: () => void;
  onPhotoCapture: (target: CameraTarget, imageData: string) => void;
  showDriver?: boolean;
  showSim?: boolean;
  showStnk?: boolean;
}

export function PhotoFields({
  capturedImages,
  showCamera,
  cameraTarget,
  onStartCamera,
  onStopCamera,
  onPhotoCapture,
  showDriver = true,
  showSim = true,
  showStnk = true
}: PhotoFieldsProps) {
  return (
    <div className="space-y-4">
      {showDriver && (
        <div className="grid grid-cols-1 gap-4">
          <Label
            htmlFor="fotoDriver"
            className="text-sm font-semibold"
          >
            Foto Pengemudi /
            <span className="italic opacity-50 text-xs">
              Driver's Photo
            </span>
          </Label>
          <PhotoCapture
            target="driver"
            onCapture={onPhotoCapture}
            capturedImage={capturedImages.driver}
            showCamera={showCamera && cameraTarget === "driver"}
            onStartCamera={onStartCamera}
            onStopCamera={onStopCamera}
          />
        </div>
      )}

      {showSim && (
        <div className="grid grid-cols-1 gap-4">
          <Label
            htmlFor="fotoSim"
            className="text-sm font-semibold"
          >
            Foto SIM Pengemudi
          </Label>
          <PhotoCapture
            target="sim"
            onCapture={onPhotoCapture}
            capturedImage={capturedImages.sim}
            showCamera={showCamera && cameraTarget === "sim"}
            onStartCamera={onStartCamera}
            onStopCamera={onStopCamera}
          />
        </div>
      )}

      {showStnk && (
        <div className="grid grid-cols-1 gap-4">
          <Label
            htmlFor="fotoStnk"
            className="text-sm font-semibold"
          >
            Foto STNK Kendaraan
          </Label>
          <PhotoCapture
            target="stnk"
            onCapture={onPhotoCapture}
            capturedImage={capturedImages.stnk}
            showCamera={showCamera && cameraTarget === "stnk"}
            onStartCamera={onStartCamera}
            onStopCamera={onStopCamera}
          />
        </div>
      )}
    </div>
  );
}