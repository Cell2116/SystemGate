import { useState, useEffect, useMemo } from "react";
import { TruckFormData, OperationType } from "../../types/truck.types";
import { TruckRecord } from "../../store/truckStore";
import JsBarcode from "jsbarcode";

interface UseTicketGenerationProps {
  formData: TruckFormData;
  operationType: OperationType;
  formStep: number;
  trucks: TruckRecord[];
}

export function useTicketGeneration({ 
  formData, 
  operationType, 
  formStep, 
  trucks 
}: UseTicketGenerationProps) {
  const [previewTicketNumber, setPreviewTicketNumber] = useState<string>("");

  // Helper function untuk generate nomor tiket
  const generateTicketNumber = (
    operation: string,
    department: string,
    isPreview: boolean = false,
  ) => {
    const today = new Date().toISOString().slice(2, 10).replace(/-/g, "");
    const ticketPrefix =
      operation === "bongkar"
        ? `SU${department}${today}`
        : `CU${department}${today}`;
        
    if (isPreview) {
      // Untuk preview barcode, gunakan nomor berikutnya yang akan diasSsign
      const existingTicketsToday = trucks.filter(
        (truck) => truck.noticket && truck.noticket.startsWith(ticketPrefix),
      );

      let nextNumber = 1;
      if (existingTicketsToday.length > 0) {
        const existingNumbers = existingTicketsToday.map((truck) => {
          const ticketNumber = truck.noticket;
          const numberPart = ticketNumber.slice(ticketPrefix.length);
          return parseInt(numberPart) || 0;
        });
        nextNumber = Math.max(...existingNumbers) + 1;
      }

      const formattedNumber = nextNumber.toString().padStart(2, "0");
      return `${ticketPrefix}${formattedNumber}`;
    }

    return ticketPrefix; 
  };

  // Generate ticket prefix for actual database storage
  const ticketPrefix = useMemo(() => {
    if (!operationType || !formData.department) return "";
    
    const today = new Date().toISOString().slice(2, 10).replace(/-/g, "");
    return operationType === "bongkar"
      ? `SU${formData.department}${today}`
      : `CU${formData.department}${today}`;
  }, [operationType, formData.department]);

  const generateActualTicketNumber = () => {
    if (!ticketPrefix) return "";

    const existingTicketsToday = trucks.filter(
      (truck) => truck.noticket && truck.noticket.startsWith(ticketPrefix),
    );

    let nextNumber = 1;
    if (existingTicketsToday.length > 0) {
      // Extract nomor urut dari tiket yang ada
      const existingNumbers = existingTicketsToday.map((truck) => {
        const ticketNumber = truck.noticket;
        const numberPart = ticketNumber.slice(ticketPrefix.length);
        return parseInt(numberPart) || 0;
      });

      nextNumber = Math.max(...existingNumbers) + 1;
    }

    const formattedNumber = nextNumber.toString().padStart(2, "0");
    return `${ticketPrefix}${formattedNumber}`;
  };

  useEffect(() => {
    if (
      (formStep === 4 && operationType === "bongkar") ||
      (formStep === 3 && operationType === "muat")
    ) {
      const ticketNumber = generateTicketNumber(
        operationType,
        formData.department,
        true,
      );
      setPreviewTicketNumber(ticketNumber);

      if (ticketNumber && formData.department) {
        setTimeout(() => {
          try {
            JsBarcode("#barcode", ticketNumber, {
              format: "CODE128",
              lineColor: "#000",
              width: 2,
              height: 60,
              displayValue: true,
              fontSize: 16,
              margin: 10,
            });
          } catch (error) {
            console.warn("Could not generate barcode:", error);
          }
        }, 100);
      }
    }
  }, [formStep, operationType, formData.department, trucks]);

  const handlePrintTicket = () => {
    const printContents =
      document.getElementById("print-barcode-area")?.innerHTML;
    if (printContents) {
      const printWindow = window.open("", "", "width=600,height=400");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Print Ticket</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .print-content { text-align: center; }
              </style>
            </head>
            <body>
              <div class="print-content">
                ${printContents}
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  return {
    previewTicketNumber,
    generateActualTicketNumber,
    handlePrintTicket
  };
}