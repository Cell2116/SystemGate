import { Label } from "../../../ui/label";
import { TruckFormData } from "../../../../types/truck.types";

interface VehicleSelectFieldsProps {
  formData: TruckFormData;
  onFieldChange: (field: string, value: string) => void;
  showDepartment?: boolean;
  showVehicleType?: boolean;
  showCondition?: boolean;
  showTransporter?: boolean;
}

export function VehicleSelectFields({ 
  formData, 
  onFieldChange, 
  showDepartment = true,
  showVehicleType = true,
  showCondition = true,
  showTransporter = false
}: VehicleSelectFieldsProps) {
  return (
    <div className="space-y-4">
      {showDepartment && (
        <div className="space-y-2">
          <Label
            htmlFor="department"
            className="text-sm font-semibold"
          >
            Departemen Tujuan /
            <span className="italic opacity-50 text-xs">
              {" "}
              Destination Department
            </span>
          </Label>
          <select
            id="department"
            value={formData.department}
            onChange={(e) => onFieldChange("department", e.target.value)}
            className="h-9 border border-gray-300 rounded-md px-3 py-2 bg-background text-gray-500 text-sm focus:border-blue-500 focus:outline-none w-full"
            required
          >
            <option value="">Pilih Departemen</option>
            <option value="HPC">HPC</option>
            <option value="PT">PT</option>
          </select>
        </div>
      )}

      {showVehicleType && (
        <div className="flex flex-col space-y-2">
          <Label
            htmlFor="jenismobil"
            className="text-sm font-semibold"
          >
            Jenis Mobil /
            <span className="italic opacity-50 text-xs">
              {" "}
              Truck Type
            </span>
          </Label>
          <select
            id="jenismobil"
            value={formData.jenismobil}
            onChange={(e) => onFieldChange("jenismobil", e.target.value)}
            className="h-9 border border-gray-300 rounded-md px-3 py-2 bg-background text-gray-500 text-sm focus:border-blue-500 focus:outline-none w-full"
            required
          >
            <option value="">Pilih Jenis Mobil</option>
            <option value="Container">Container</option>
            <option value="Wingbox">Wingbox</option>
            <option value="Tronton">Tronton</option>
            <option value="Dumptruck">Dumptruck</option>
            <option value="Colt">Colt</option>
            <option value="Fuso">Fuso</option>
          </select>
        </div>
      )}

      {showCondition && (
        <div className="flex flex-col space-y-2">
          <Label
            htmlFor="statustruck"
            className="text-sm font-semibold"
          >
            Kondisi Truck /
            <span className="italic opacity-50 text-xs">
              {" "}
              Truck Condition
            </span>
          </Label>
          <select
            id="statustruck"
            value={formData.statustruck}
            onChange={(e) => onFieldChange("statustruck", e.target.value)}
            className="h-9 border border-gray-300 rounded-md px-3 py-2 bg-background text-gray-500 text-sm focus:border-blue-500 focus:outline-none w-full"
            required
          >
            <option value="">Pilih Status</option>
            <option value="isi">Isi (Ada Barang)</option>
            <option value="kosong">Kosong</option>
          </select>
        </div>
      )}

      {showTransporter && (
        <div className="flex flex-col space-y-2">
          <Label
            htmlFor="type"
            className="text-sm font-semibold"
          >
            Transporter /
            <span className="italic opacity-50 text-xs">
              {" "}
              Transportation Type
            </span>
          </Label>
          <select
            id="type"
            value={formData.type}
            onChange={(e) => onFieldChange("type", e.target.value)}
            className="h-9 border border-gray-300 rounded-md px-3 py-2 bg-background text-gray-500 text-sm focus:border-blue-500 focus:outline-none w-full"
            required
          >
            <option value="">Pilih Transporter</option>
            <option value="internal">Internal</option>
            <option value="external">External</option>
          </select>
        </div>
      )}
    </div>
  );
}