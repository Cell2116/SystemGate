import { ChangeEvent } from "react";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";
import { TruckFormData } from "../../../../types/truck.types";
interface DocumentFieldsProps {
  formData: TruckFormData;
  onFieldChange: (field: string, value: string) => void;
}
export function DocumentFields({ formData, onFieldChange }: DocumentFieldsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label htmlFor="nosj" className="text-sm font-semibold">
          No. Surat Jalan /
          <span className="italic opacity-50 text-xs">
            {" "}
            Delivery Note Number
          </span>
        </Label>
        <Input
          id="nosj"
          placeholder="SJ001"
          value={formData.nosj}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            onFieldChange("nosj", e.target.value)
          }
          className="h-9 uppercase border-gray-300 focus:border-blue-500 focus:outline-none"
          required
        />
      </div>
      <div>
        <Label
          htmlFor="tglsj"
          className="text-sm font-semibold"
        >
          Tanggal Surat Jalan /
          <span className="italic opacity-50 text-xs">
            {" "}
            Delivery Note Date
          </span>
        </Label>
        <Input
          id="tglsj"
          type="date"
          value={formData.tglsj}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            onFieldChange("tglsj", e.target.value)
          }
          className="h-9 border-gray-300 focus:border-blue-500 focus:outline-none"
          required
        />
      </div>
    </div>
  );
}