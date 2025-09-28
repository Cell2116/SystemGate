import { TruckFormData, CameraTarget } from "../../../../types/truck.types";
import { 
  DriverInfoFields, 
  ContactFields, 
  CompanyFields, 
  TimeFields, 
  PhotoFields,
  VehicleSelectFields 
} from "../fields";

interface MuatStep1Props {
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

export function MuatStep1({
  formData,
  onFieldChange,
  capturedImages,
  showCamera,
  cameraTarget,
  onStartCamera,
  onStopCamera,
  onPhotoCapture,
  validationError
}: MuatStep1Props) {
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        <CompanyFields 
          formData={formData} 
          onFieldChange={onFieldChange} 
          showArmada={true}
        />
        <CompanyFields
          formData={formData}
          onFieldChange={onFieldChange}
          showArmada={false}
          showSupplier={true}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TimeFields 
          formData={formData} 
          onFieldChange={onFieldChange} 
          showArrivalTime={true}
          showDate={false}
        />
        {/* <VehicleSelectFields
          formData={formData}
          onFieldChange={onFieldChange}
          showDepartment={false}
          showVehicleType={false}
          showCondition={true}
          showTransporter={false}
        /> */}
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