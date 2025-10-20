import { ChangeEvent } from "react";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";
import { TruckFormData } from "../../../../types/truck.types";
interface TimeFieldsProps {
  formData: TruckFormData;
  onFieldChange: (field: string, value: string) => void;
  showArrivalTime?: boolean;
  showDate?: boolean;
}
export function TimeFields({ 
  formData, 
  onFieldChange, 
  showArrivalTime = true, 
  showDate = true 
}: TimeFieldsProps) {
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };
  return (
    <div className="space-y-4">
      {showArrivalTime && (
        <div className="space-y-2">
          <Label
            htmlFor="arrivalTime"
            className="text-sm font-semibold"
          >
            Jam Kedatangan
            <span className="opacity-60"> (24H)</span> /
            <span className="italic opacity-50 text-xs">
              {" "}
              Arrival Time (24H)
            </span>
          </Label>
          <Input
            id="arrivalTime"
            type="time"
            value={formData.arrivalTime}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              onFieldChange("arrivalTime", e.target.value)
            }
            className="h-9 border-gray-300 focus:border-blue-500 focus:outline-none"
            required
          />
        </div>
      )}
      
      {showDate && (
        <div>
          <Label
            htmlFor="date"
            className="text-sm font-semibold"
          >
            Tanggal /
            <span className="italic opacity-50 text-xs">
              {" "}
              Date
            </span>
          </Label>
          <Input
            id="date"
            type="date"
            value={formData.date || getTodayDate()}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              onFieldChange("date", e.target.value)
            }
            className="h-9 border-gray-300 focus:border-blue-500 focus:outline-none"
            required
          />
        </div>
      )}
    </div>
  );
}