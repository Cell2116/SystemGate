import { useState, useEffect, useMemo } from "react";
import { TruckFormData, OperationType } from "../../types/truck.types";
import { CombinedTruckData } from "../../store/truckStore";
import JsBarcode from "jsbarcode";
interface UseTicketGenerationProps {
  formData: TruckFormData;
  operationType: OperationType;
  formStep: number;
  trucks: CombinedTruckData[];
}
export function useTicketGeneration({
  formData,
  operationType,
  formStep,
  trucks
}: UseTicketGenerationProps) {
  const [previewTicketNumber, setPreviewTicketNumber] = useState<string>("");

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
  // const handlePrintTicket = () => {
  //   const printContents = document.getElementById("print-barcode-area")?.innerHTML;
  //   if (printContents) {
  //     const printWindow = window.open("", "", "width=600,height=600");
  //     if (printWindow) {
  //       printWindow.document.write(`
  //         <html>
  //           <head>
  //             <title>Print Ticket</title>
  //             <style>
  //               body { font-family: Arial, sans-serif; margin: 20px; }
  //               .print-content { text-align: center;}
  //               #size-img { width: 150px; height: auto}
  //             </style>
  //           </head>
  //           <body>
  //             <div class="print-content">
  //               ${printContents}
  //             </div>
  //           </body>
  //         </html>
  //       `);
  //       printWindow.document.close();
  //       printWindow.print();
  //     }
  //   }
  // };
  const handlePrintTicket = () => {
    const ticket = document.getElementById("print-barcode-area");
    if (!ticket) return;

    const formDataDriver = document.querySelector("#driver")?.textContent || "";
    const formDataPlate = document.querySelector("#plate")?.textContent || "";
    const formDataCompany = document.querySelector("#company")?.textContent || "";
    const formDataDate = document.querySelector("#date")?.textContent || "";
    const formDataTime = document.querySelector("#time")?.textContent || "";
    const queueNumber = document.querySelector("#queue")?.textContent || "";
    const barcode = document.querySelector("#barcode")?.outerHTML || "";

    const printWindow = window.open("", "", "width=600,height=600");
    if (!printWindow) return;

    printWindow.document.write(`
    <html>
      <head>
        <title>Print Ticket</title>
        <style>
      @page {
        size: 80mm auto;
        margin: 5mm;
      }
      body {
        font-family: Arial, sans-serif;
        -webkit-print-color-adjust: exact;
        color-adjust: exact;
        margin: 0;
        padding: 0;
        display: flex;
        justify-content: center;
      }
      .ticket {
        width: 70mm;
        background: white;
        padding: 8px;
        box-sizing: border-box;
      }
      .header {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .header img {
        width: 25px;
        height: 25px;
        object-fit: contain;
      }
      .title {
        font-weight: bold;
        font-size: 13px;
      }
      .info {
        margin-top: 8px;
        font-size: 10px;
        display: flex;
        justify-content: space-between;
      }
      .info p {
        margin: 0; 
        padding: 0;
      }
      .queue {
        text-align: right;
      }
      .queue .label {
        font-size: 9px;
        font-weight: 600;
      }
      .queue .number {
        font-size: 16px;
        font-weight: bold;
      }
      #barcode {
        display: block;
        max-width: 60mm; 
        margin: 2px auto 0 auto; /* Atas 2px, bawah 0px */
        padding: 0;
      }
      svg {
        margin: 0 !important;
        padding: 0 !important;
      }
      .footer {
        text-align: center;
        font-size: 9px;
        margin-top: 4px;
      }
    </style>
      </head>
      <body>
        <div class="ticket">
          <div class="header">
            <img src="/alkindo-naratama-tbk--600-removebg-preview.png" alt="logo" />
            <p class="title">Gateway System</p>
          </div>
          <div class="info">
            <div>
              <p>${formDataDriver} || ${formDataPlate} || ${formDataCompany}</p>
              <p>${formDataDate} || ${formDataTime}</p>
            </div>
            <div class="queue">
              <p class="label">No. Antrean</p>
              <p class="number">${queueNumber}</p>
            </div>
          </div>
          ${barcode}
          <p class="footer">PT. Alkindo Naratama TBK</p>
        </div>
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = () => window.close();
          };
        </script>
      </body>
    </html>
  `);

    printWindow.document.close();
  };
  return {
    previewTicketNumber,
    generateActualTicketNumber,
    handlePrintTicket
  };
}