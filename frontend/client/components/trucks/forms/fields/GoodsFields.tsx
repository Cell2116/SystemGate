import { ChangeEvent } from "react";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";
import { TruckFormData } from "../../../../types/truck.types";
interface GoodsFieldsProps {
  formData: TruckFormData;
  onFieldChange: (field: string, value: string) => void;
  operationType?: "bongkar" | "muat";
}
export function GoodsFields({ formData, onFieldChange, operationType = "bongkar" }: GoodsFieldsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label
          htmlFor="goods"
          className="text-sm font-semibold"
        >
          Nama Barang /
          <span className="italic opacity-50 text-xs">
            {" "}
            Name of Goods
          </span>
        </Label>
        <Input
          id="goods"
          placeholder={`Jenis barang yang ${operationType === "bongkar" ? "dibongkar" : "dimuat"}`}
          value={formData.goods}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            onFieldChange("goods", e.target.value)
          }
          className="h-9 border-gray-300 focus:border-blue-500 focus:outline-none"
          required
        />
      </div>
      <div>
        <Label
          htmlFor="descin"
          className="text-sm font-semibold"
        >
          Jumlah Barang /
          <span className="italic opacity-50 text-xs">
            {" "}
            Goods Quantity
          </span>
        </Label>
        <Input
          id="descin"
          placeholder={`Jumlah barang yang ${operationType === "bongkar" ? "dibongkar" : "dimuat"}`}
          value={formData.descin}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            onFieldChange("descin", e.target.value)
          }
          className="h-9 border-gray-300 focus:border-blue-500 focus:outline-none"
          required
        />
      </div>
      <div>
        <Label
          htmlFor="descin"
          className="text-sm font-semibold"
        >
          Jenis Barang /
          <span className="italic opacity-50 text-xs">
            {" "}
            Goods Type
          </span>
        </Label>
        <select
          id="jenisbarang"
          value={formData.jenisbarang}
          onChange={(e) => onFieldChange("jenisbarang", e.target.value)}
          className="h-9 border border-gray-300 rounded-md px-3 py-2 bg-background text-gray-500 text-sm focus:border-blue-500 focus:outline-none w-full"
          required
        >
          <option value="">Pilih Jenis Barang</option>
          <option value="BB">Bahan Baku</option>
          <option value="BP">Bahan Pembantu</option>
          <option value="Mesin">Mesin</option>
          <option value="Lainnya">Lainnya</option>
        </select>
      </div>
    </div>
  );
}