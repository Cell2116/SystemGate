import { useEffect } from "react";
import { Button } from "../../ui/button";
import { Label } from "../../ui/label";
import { TruckFormData } from "../../../types/truck.types";
import JsBarcode from "jsbarcode";

interface TicketPreviewProps {
  formData: TruckFormData;
  previewTicketNumber: string;
  onPrintTicket: () => void;
  operationType: "bongkar" | "muat";
}

export function TicketPreview({
  formData,
  previewTicketNumber,
  onPrintTicket,
  operationType
}: TicketPreviewProps) {
  
  useEffect(() => {
    // Generate barcode when component mounts or ticket number changes
    if (previewTicketNumber && formData.department) {
      JsBarcode("#barcode", previewTicketNumber, {
        format: "CODE128",
        lineColor: "#000",
        width: 2,
        height: 60,
        displayValue: true,
        fontSize: 16,
        margin: 10,
      });
    }
  }, [previewTicketNumber, formData.department]);

  return (
    <div className="space-y-4">
      <div>
        <Label
          htmlFor="noticket"
          className="text-sm font-semibold"
        >
          No. Tiket /
          <span className="italic opacity-50 text-xs">
            {" "}
            Ticket Number (Otomatis)
          </span>
        </Label>
        <div className="font-bold text-lg bg-gray-100 p-2 rounded">
          {previewTicketNumber}
        </div>
      </div>
      
      <div>
        <p className="text-xs font-semibold opacity-85 text-slate-600">
          Silahkan tekan <span className="italic">generate</span>{" "}
          untuk mencetak{" "}
          <span className="text-blue-600">Barcode</span> tiket
          masuk truck.
        </p>
      </div>
      
      <div className="flex justify-center items-center">
        <div
          id="print-barcode-area"
          className="bg-white w-[25vw] flex flex-col p-5"
        >
          <div className="flex flex-row">
            <img
              src="../../dist/spa/alkindo-naratama-tbk--600-removebg-preview.png"
              alt="alkindo"
              className="w-7 h-7"
            />
            <p className="font-bold">Gateway System</p>
          </div>
          <div className="flex flex-row text-xs pt-5">
            <p>
              {formData.driver} || {formData.plateNumber} ||{" "}
              {operationType === "muat" ? formData.armada : formData.supplier}
            </p>
          </div>
          <div className="flex flex-row text-xs">
            <p>
              {formData.date} || {formData.arrivalTime}
            </p>
          </div>
          <svg
            id="barcode"
            className="mx-auto my-4"
            style={{ display: "block" }}
          ></svg>
          <p className="text-center text-sm">
            PT. Alkindo Naratama TBK
          </p>
        </div>
      </div>
      
      <div className="justify-center items-center flex text-center">
        <Button
          className="justify-center items-center flex text-center bg-blue-800 hover:bg-blue-500"
          type="button"
          onClick={onPrintTicket}
        >
          Print Ticket
        </Button>
      </div>
      
      <div>
        <p className="text-xs font-semibold opacity-85 text-slate-600">
          <span className="text-red-600">Peringatan!</span> jangan
          melakukan simpan sebelum mencetak{" "}
          <span className="text-blue-600">Barcode</span> ticket.
        </p>
      </div>
    </div>
  );
}