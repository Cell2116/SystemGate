import { ChangeEvent } from "react";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";
import { TruckFormData } from "../../../../types/truck.types";

interface CompanyFieldsProps {
  formData: TruckFormData;
  onFieldChange: (field: string, value: string) => void;
  showSupplier?: boolean;
  showArmada?: boolean;
}

export function CompanyFields({ 
  formData, 
  onFieldChange, 
  showSupplier = false, 
  showArmada = false 
}: CompanyFieldsProps) {
  return (
    <div className="space-y-4">
      {showSupplier && (
        <div className="space-y-2">
          <Label
            htmlFor="supplier"
            className="text-sm font-semibold"
          >
            Perusahaan Asal /
            <span className="italic opacity-50 text-xs">
              {" "}
              Origin Company
            </span>
          </Label>
          <Input
            id="supplier"
            placeholder="Nama Perusahaan"
            value={formData.supplier}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              onFieldChange("supplier", e.target.value)
            }
            className="h-9 border-gray-300 focus:border-blue-500 focus:outline-none w-full"
            required
          />
        </div>
      )}
      
      {showArmada && (
        <div className="space-y-2">
          <Label
            htmlFor="armada"
            className="text-sm font-semibold"
          >
            Armada /
            <span className="italic opacity-50 text-xs">
              {" "}
              Fleet
            </span>
          </Label>
          <Input
            id="armada"
            placeholder="Nama Armada"
            value={formData.armada}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              onFieldChange("armada", e.target.value)
            }
            className="h-9 border-gray-300 focus:border-blue-500 focus:outline-none w-full"
            required
          />
        </div>
      )}
    </div>
  );
}