import { Button } from "../../../ui/button";
import { TruckFormData, CameraTarget } from "../../../../types/truck.types";
import { 
  GoodsFields, 
  VehicleSelectFields, 
  TimeFields, 
  PhotoFields 
} from "../fields";
interface MuatStep2Props {
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
export function MuatStep2({
  formData,
  onFieldChange,
  capturedImages,
  showCamera,
  cameraTarget,
  onStartCamera,
  onStopCamera,
  onPhotoCapture,
  validationError
}: MuatStep2Props) {
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };
  return (
    <div className="space-y-4">
      <GoodsFields 
        formData={formData} 
        onFieldChange={onFieldChange} 
        operationType="muat"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        <VehicleSelectFields 
          formData={formData} 
          onFieldChange={onFieldChange}
          showDepartment={true}
          showVehicleType={false}
          showCondition={false}
          showTransporter={false}
        />
        <VehicleSelectFields 
          formData={formData} 
          onFieldChange={onFieldChange}
          showDepartment={false}
          showVehicleType={false}
          showCondition={false}
          showTransporter={true}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        <div>
          <TimeFields 
            formData={formData} 
            onFieldChange={onFieldChange} 
            showArrivalTime={false}
            showDate={true}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs h-7 mt-2"
            onClick={() => onFieldChange("date", getTodayDate())}
          >
            Today
          </Button>
        </div>
        <VehicleSelectFields 
          formData={formData} 
          onFieldChange={onFieldChange}
          showDepartment={false}
          showVehicleType={true}
          showCondition={false}
          showTransporter={false}
        />
      </div>
      <PhotoFields
        capturedImages={capturedImages}
        showCamera={showCamera}
        cameraTarget={cameraTarget}
        onStartCamera={onStartCamera}
        onStopCamera={onStopCamera}
        onPhotoCapture={onPhotoCapture}
        showDriver={false}
        showSim={true}
        showStnk={true}
      />
      {validationError && (
        <div className="text-red-500 text-xs mb-2 text-left">
          {validationError}
        </div>
      )}
    </div>
  );
}