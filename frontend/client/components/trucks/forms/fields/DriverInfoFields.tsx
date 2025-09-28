import { ChangeEvent } from "react";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";
import { TruckFormData } from "../../../../types/truck.types";

interface DriverInfoFieldsProps {
  formData: TruckFormData;
  onFieldChange: (field: string, value: string) => void;
}

export function DriverInfoFields({ formData, onFieldChange }: DriverInfoFieldsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label
          htmlFor="driver"
          className="text-sm font-semibold"
        >
          Pengemudi /
          <span className="italic opacity-50 text-xs">
            {" "}
            Driver
          </span>
        </Label>
        <Input
          id="driver"
          placeholder="Nama Pengemudi"
          value={formData.driver}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            onFieldChange("driver", e.target.value)
          }
          className="h-9 border-gray-300 focus:border-blue-500 focus:outline-none"
          required
        />
      </div>
      <div>
        <Label
          htmlFor="plateNumber"
          className="text-sm font-semibold"
        >
          Plat Nomor /
          <span className="italic opacity-50 text-xs">
            {" "}
            License Plate
          </span>
        </Label>
        <Input
          id="plateNumber"
          placeholder="ABC-123"
          value={formData.plateNumber}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            onFieldChange("plateNumber", e.target.value)
          }
          className="h-9 border-gray-300 focus:border-blue-500 focus:outline-none"
          required
        />
      </div>
    </div>
  );
}
