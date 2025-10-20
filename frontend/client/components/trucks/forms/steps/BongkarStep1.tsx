import { TruckFormData, CameraTarget } from "../../../../types/truck.types";
import {
  DriverInfoFields,
  ContactFields,
  CompanyFields,
  TimeFields,
  PhotoFields
} from "../fields";
interface BongkarStep1Props {
  formData: TruckFormData;
  onFieldChange: (field: string, value: string) => void;
  capturedImages: Record<CameraTarget, string | null>;
  showCamera: boolean;
  cameraTarget: CameraTarget | null;
  onStartCamera: (target: CameraTarget) => void;
  onStopCamera: () => void;
  onPhotoCapture: (target: CameraTarget, imageData: string) => void;
  validationError?: string;
}
export function BongkarStep1({
  formData,
  onFieldChange,
  capturedImages,
  showCamera,
  cameraTarget,
  onStartCamera,
  onStopCamera,
  onPhotoCapture,
  validationError
}: BongkarStep1Props) {
  return (
    <div className="space-y-4">
      <DriverInfoFields
        formData={formData}
        onFieldChange={onFieldChange}
      />
      <ContactFields
        formData={formData}
        onFieldChange={onFieldChange}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CompanyFields
          formData={formData}
          onFieldChange={onFieldChange}
          showSupplier={true}
        />
        <TimeFields
          formData={formData}
          onFieldChange={onFieldChange}
          showArrivalTime={true}
          showDate={false}
        />
      </div>
      <PhotoFields
        capturedImages={capturedImages}
        showCamera={showCamera}
        cameraTarget={cameraTarget}
        onStartCamera={onStartCamera}
        onStopCamera={onStopCamera}
        onPhotoCapture={onPhotoCapture}
        showDriver={true}
        showSim={false}
        showStnk={false}
      />
      {validationError && (
        <div className="text-red-500 text-xs mb-2 text-left">
          {validationError}
        </div>
      )}
    </div>
  );
}