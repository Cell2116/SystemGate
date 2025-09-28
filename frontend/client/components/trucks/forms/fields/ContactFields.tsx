import { ChangeEvent } from "react";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";
import { TruckFormData } from "../../../../types/truck.types";

interface ContactFieldsProps {
  formData: TruckFormData;
  onFieldChange: (field: string, value: string) => void;
}

export function ContactFields({ formData, onFieldChange }: ContactFieldsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label
          htmlFor="nikdriver"
          className="text-sm font-semibold"
        >
          NIK /
          <span className="italic opacity-50 text-xs">
            {" "}
            National ID Number
          </span>
        </Label>
        <Input
          id="nikdriver"
          placeholder="NIK Pengemudi"
          value={formData.nikdriver}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            onFieldChange("nikdriver", e.target.value)
          }
          className="h-9 border-gray-300 focus:border-blue-500 focus:outline-none"
          required
        />
      </div>
      <div>
        <Label
          htmlFor="tlpdriver"
          className="text-sm font-semibold"
        >
          No Telepon /
          <span className="italic opacity-50 text-xs">
            {" "}
            Phone Number
          </span>
        </Label>
        <Input
          id="tlpdriver"
          placeholder="+62"
          value={formData.tlpdriver}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            onFieldChange("tlpdriver", e.target.value)
          }
          className="h-9 border-gray-300 focus:border-blue-500 focus:outline-none"
          required
        />
      </div>
    </div>
  );
}
