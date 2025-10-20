import { TruckFormData } from "../../../../types/truck.types";
import { DocumentFields } from "../fields";
interface BongkarStep3Props {
  formData: TruckFormData;
  onFieldChange: (field: string, value: string) => void;
  validationError?: string;
}
export function BongkarStep3({
  formData,
  onFieldChange,
  validationError
}: BongkarStep3Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-slate-600">
          Masukan Nomor{" "}
          <span className="text-blue-700">Surat Jalan</span>.
        </p>
      </div>
      <DocumentFields 
        formData={formData} 
        onFieldChange={onFieldChange} 
      />
      {validationError && (
        <div className="text-red-500 text-xs mb-2 text-left">
          {validationError}
        </div>
      )}
    </div>
  );
}