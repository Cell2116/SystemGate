import { useState, useEffect, useMemo } from "react";
import { TruckFormData, OperationType } from "../../types/truck.types";
import { CombinedTruckData } from "../../store/truckStore";
import JsBarcode from "jsbarcode";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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
  //   const ticket = document.getElementById("print-barcode-area");
  //   if (!ticket) return;

  //   const formDataDriver = document.querySelector("#driver")?.textContent || "";
  //   const formDataPlate = document.querySelector("#plate")?.textContent || "";
  //   const formDataCompany = document.querySelector("#armada")?.textContent || "";
  //   const formDataDate = document.querySelector("#date")?.textContent || "";
  //   const formDataTime = document.querySelector("#time")?.textContent || "";
  //   const formDataSupplier = document.querySelector("#supplier")?.textContent || "";
  //   // const formDataDepartment = document.querySelector("#department")?.textContent || "";
  //   const departmentSelect = document.querySelector("#department") as HTMLSelectElement;
  //   const formDataDepartment = departmentSelect?.value || "";
  //   const formDataJenisBarang = document.querySelector("#jenisbarang")?.textContent || "";
  //   const formDataJumlahBarang = document.querySelector("#descin")?.textContent || "";
  //   const queueNumber = document.querySelector("#queue")?.textContent || "";
  //   const barcode = document.querySelector("#barcode")?.outerHTML || "";

  //   const printWindow = window.open("", "", "width=600,height=600");
  //   if (!printWindow) return;

  //   printWindow.document.write(`
  //       <!DOCTYPE html>
  //       <html>
  //           <head>
  //               <title>Print Ticket</title>
  //               <style>
  //                   * {
  //                       margin: 0;
  //                       padding: 0;
  //                       box-sizing: border-box;
  //                   }
                    
  //                   @page {
  //                       size: auto 80mm;
  //                       margin: 1mm;
  //                   }
                    
  //                   html, body {
  //                       width: 90mm;
  //                       height: 90mm;
  //                       margin: 0;
  //                       padding: 0;
  //                       overflow: hidden;
  //                       position: relative;
  //                   }
                    
  //                   body { 
  //                       font-family: Arial, sans-serif;
  //                       padding: 0;
  //                       display: flex;
  //                       justify-content: center;
  //                       align-items: flex-start;
  //                   }
                    
  //                   .ticket-container {
  //                       background: white;
  //                       width: 90mm;
  //                       max-width: 90mm;
  //                       padding-left: 1mm;
  //                       padding-right: 1mm;
  //                       border: 1px solid #000;
  //                       page-break-after: avoid;
  //                   }
                    
  //                   .header {
  //                       display: flex;
  //                       justify-content: space-between;
  //                       align-items: center;
  //                       margin-bottom: 3mm;
  //                       padding-bottom: 2mm;
  //                       border-bottom: 1px solid #ccc;
  //                   }
                    
  //                   .logo-section {
  //                       display: flex;
  //                       align-items: center;
  //                       gap: 2mm;
  //                   }
                    
  //                   .logo {
  //                       width: 8mm;
  //                       height: 8mm;
  //                   }
                    
  //                   .company-name {
  //                       font-weight: bold;
  //                       font-size: 4mm;
  //                   }
                    
  //                   .queue-section {
  //                       text-align: right;
  //                   }
                    
  //                   .queue-label {
  //                       font-size: 3mm;
  //                       font-weight: 600;
  //                   }
                    
  //                   .queue-number {
  //                       font-size: 6mm;
  //                       font-weight: bold;
  //                   }
                    
  //                   .info-section {
  //                       display: flex;
  //                       justify-content: space-between;
  //                       margin-bottom: 1mm;
  //                       font-size: 3.5mm;
  //                   }
                    
  //                   .info-left, .info-right {
  //                       line-height: 1;
  //                       font-weight: 500;
  //                   }
                    
  //                   .info-left div, .info-right div {
  //                       margin-bottom: 1mm;
  //                   }
                    
  //                   .info-right {
  //                       text-align: right;
  //                       align-content: center;
  //                   }
                    
  //                   .barcode-section {
  //                       text-align: center;
  //                       margin: 2mm 0;
  //                   }
                    
  //                   .barcode-section svg {
  //                       max-width: 80mm;
  //                       height: auto;
  //                   }
                    
  //                   // .footer {
  //                   //     text-align: center;
  //                   //     font-size: 3.5mm;
  //                   //     margin-top: 2mm;
  //                   //     padding-top: 2mm;
  //                   //     border-top: 1px solid #ccc;
  //                   // }
  //                   .footer {
  //                       text-align: center;
  //                       font-size: 3mm;
  //                       padding-top: 1.5mm;
  //                       margin-top: 1.5mm;
  //                       border-top: 0.3mm solid #ccc;
  //                       page-break-after: avoid;
  //                   }
                    
  //                   // @media print {
  //                   //     html, body {
  //                   //         height: auto;
  //                   //         overflow: visible;
  //                   //     }
                        
  //                   //     body {
  //                   //         padding: 0;
  //                   //     }
                        
  //                   //     .ticket-container {
  //                   //         border: none;
  //                   //         margin: 0;
  //                   //         padding: 10mm;
  //                   //     }
  //                   // }
  //                   @media print {
  //                     body {
  //                         margin: 0;
  //                         padding: 0;
  //                         page-break-after: avoid;
  //                     }
  //                     @page {
  //                         size: 90mm 90mm;  /* Fixed size for thermal printers */
  //                         margin: 0;  /* No margins to eliminate blank space */
  //                     }
  //                     .ticket-container {
  //                         border: none;
  //                         margin: 0;
  //                         padding: 1mm;  /* Keep minimal padding */
  //                         page-break-after: avoid;
  //                     }
  //               }
  //               </style>
  //           </head>
  //           <body>
  //               <div class="ticket-container">
  //                   <!-- Header -->
  //                   <div class="header">
  //                       <div class="logo-section">
  //                           <img src="../../dist/spa/alkindo-naratama-tbk--600-removebg-preview.png" 
  //                               alt="Alkindo Logo" 
  //                               class="logo"
  //                               onerror="this.style.display='none'">
  //                           <span class="company-name">Gateway System</span>
  //                       </div>
  //                       <div class="queue-section">
  //                           <div class="queue-label">No. Antrean</div>
  //                           <div class="queue-number">${queueNumber}</div>
  //                       </div>
  //                   </div>

  //                   <!-- Info Section -->
  //                   <div class="info-section">
  //                       <div class="info-left">
  //                           <div>${formDataDriver || '-'}</div>
  //                           <div>${formDataPlate || '-'}</div>
  //                           <div>${formDataCompany || '-'}</div>
  //                           <div>${formDataDate}</div>
  //                           <div>${formDataTime}</div>
  //                           <div>${formDataDepartment || '-'}</div>
  //                       </div>
  //                       <div class="info-right">
  //                           <div>${formDataSupplier || '-'}</div>
  //                           <div>${formDataJenisBarang}</div>
  //                           <div>${formDataJumlahBarang || '-'}</div>
  //                       </div>
  //                   </div>

  //                   <!-- Barcode -->
  //                   <div class="barcode-section">
  //                       ${barcode}
  //                   </div>

  //                   <!-- Footer -->
  //                   <div class="footer">
  //                       PT. Alkindo Naratama TBK
  //                   </div>
  //               </div>
                
  //               <script>
  //                   window.onload = function() {
  //                       setTimeout(function() {
  //                           window.print();
  //                           window.onafterprint = function() {
  //                               window.close();
  //                           };
  //                       }, 250);
  //                   };
  //               </script>
  //           </body>
  //       </html>
  //   `);
  //   printWindow.document.close();
  // };

  const handlePrintTicket = () => {
    // Extract data from the DOM
    const formDataDriver = document.querySelector("#driver")?.textContent || "";
    const formDataPlate = document.querySelector("#plate")?.textContent || "";
    const formDataCompany = document.querySelector("#armada")?.textContent || "";
    const formDataDate = document.querySelector("#date")?.textContent || "";
    const formDataTime = document.querySelector("#time")?.textContent || "";
    const formDataSupplier = document.querySelector("#supplier")?.textContent || "";
    const departmentSelect = document.querySelector("#department") as HTMLSelectElement;
    const formDataDepartment = departmentSelect?.value || "";
    const formDataJenisBarang = document.querySelector("#jenisbarang")?.textContent || "";
    const formDataJumlahBarang = document.querySelector("#descin")?.textContent || "";
    const queueNumber = document.querySelector("#queue")?.textContent || "";
    const rawSupplier = (document.querySelector("#supplier")?.textContent || "").trim();
    const ticketNumber = generateActualTicketNumber();
    const supplierLabel = (() => {
      const code = (ticketNumber || "").trim().toUpperCase();
      if (code.startsWith("SU")) return "Supplier";
      if (code.startsWith("CU")) return "Customer";
      return "Supplier";
    })();

    const ticketDiv = document.createElement('div');
    ticketDiv.style.width = '80mm';
    ticketDiv.style.height = '80mm';
    ticketDiv.style.position = 'absolute';
    ticketDiv.style.left = '-9999px';
    ticketDiv.style.fontFamily = 'Arial Black, sans-serif';
    ticketDiv.style.fontWeight = '200';
    ticketDiv.style.fontSize = '10px';
    ticketDiv.style.padding = '4mm';
    ticketDiv.style.boxSizing = 'border-box';
    ticketDiv.style.border = '1px solid #000';
    ticketDiv.style.background = 'white';
    ticketDiv.style.display = 'flex';
    ticketDiv.style.flexDirection = 'column';
    ticketDiv.style.justifyContent = 'space-between'; 

    ticketDiv.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 3mm; border-bottom: 1px solid #ccc;">
      <div style="display: flex; align-items: center; gap: 2px;">
        <span style="font-weight: bold; font-size: 12px;">Gateway System</span>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 7px; font-weight: 600;">No. Antrean</div>
        <div style="font-size: 16px; font-weight: bold;">${queueNumber}</div>
      </div>
    </div>
    
    <div style="display: flex; justify-content: space-between; font-size: 10px; flex-grow: 1; padding: 3mm 0;">
      <div style="line-height: 1.5; display: flex; flex-direction: column; justify-content: space-around;">
        <div><strong>Driver:</strong> ${formDataDriver || '-'}</div>
        <div><strong>Plat:</strong> ${formDataPlate || '-'}</div>
        <div><strong>Armada:</strong> ${formDataCompany || '-'}</div>
        <div><strong>Tanggal:</strong> ${formDataDate}</div>
        <div><strong>Waktu:</strong> ${formDataTime}</div>
        <div><strong>Dept:</strong> ${formDataDepartment || '-'}</div>
      </div>
      <div style="text-align: right; line-height: 1.5; display: flex; flex-direction: column; justify-content: center;">
        <div><strong>${supplierLabel}:</strong> ${formDataSupplier || '-'}</div>
        <div><strong>Jenis:</strong> ${formDataJenisBarang}</div>
        <div><strong>Jumlah:</strong> ${formDataJumlahBarang || '-'}</div>
      </div>
    </div>
    
    <div style="text-align: center; margin: 3mm 0;">
      <canvas id="barcode-canvas" style="max-width: 100%; height: auto;"></canvas>
    </div>
    
    <div style="text-align: center; font-size: 9px; font-weight: 500; padding-top: 2mm; border-top: 1px solid #ccc;">
      PT. Alkindo Naratama TBK
    </div>
  `;

    // Append to body temporarily
    document.body.appendChild(ticketDiv);

    // Generate barcode
    const barcodeCanvas = ticketDiv.querySelector('#barcode-canvas') as HTMLCanvasElement;
    if (barcodeCanvas) {
      try {
        JsBarcode(barcodeCanvas, ticketNumber, {
          format: 'CODE128',
          width: 2.2,
          height: 50,
          displayValue: true,
          fontSize: 12,
          margin: 2,
        });
      } catch (error) {
        console.warn('Barcode generation failed:', error);
        barcodeCanvas.style.display = 'none';
      }
    }

    // Capture with html2canvas
    html2canvas(ticketDiv, {
      scale: 4,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false
    }).then((canvas) => {
      // Remove the temp div
      document.body.removeChild(ticketDiv);

      // Convert to image data URL
      const imgData = canvas.toDataURL('image/png');

      // Open print window
      const printWindow = window.open('', '_blank', 'width=600,height=600');
      if (!printWindow) {
        alert('Popup blocked! Please allow popups for this site and try again.');
        return;
      }

      // Write to print window
      printWindow.document.write(`
      <html>
        <head>
          <title>Print Ticket</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              margin: 0;
              padding: 0;
              background: white;
            }
            img {
              display: block;
              width: 80mm;
              height: auto;
              object-fit: fill;
            }
            @media print {
              @page {
                size: 80mm auto;
                margin: 0;
              }
              body {
                margin: 0;
                padding: 0;
              }
              img {
                width: 80mm;
                height: auto;
                object-fit: fill;
              }
            }
          </style>
        </head>
        <body>
          <img src="${imgData}" alt="Ticket" />
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `);
      printWindow.document.close();
    }).catch((error) => {
      console.error('Error generating image:', error);
      if (document.body.contains(ticketDiv)) {
        document.body.removeChild(ticketDiv);
      }
    });
  };



  // const handlePrintTicket = () => {
  //   // Extract data from the DOM (same as before)
  //   const formDataDriver = document.querySelector("#driver")?.textContent || "";
  //   const formDataPlate = document.querySelector("#plate")?.textContent || "";
  //   const formDataCompany = document.querySelector("#armada")?.textContent || "";
  //   const formDataDate = document.querySelector("#date")?.textContent || "";
  //   const formDataTime = document.querySelector("#time")?.textContent || "";
  //   const formDataSupplier = document.querySelector("#supplier")?.textContent || "";
  //   const departmentSelect = document.querySelector("#department") as HTMLSelectElement;
  //   const formDataDepartment = departmentSelect?.value || "";
  //   const formDataJenisBarang = document.querySelector("#jenisbarang")?.textContent || "";
  //   const formDataJumlahBarang = document.querySelector("#descin")?.textContent || "";
  //   const queueNumber = document.querySelector("#queue")?.textContent || "";

  //   // Generate the ticket number (use your existing logic)
  //   const ticketNumber = generateActualTicketNumber();  // Assuming this is available in scope

  //   // Create a new jsPDF document with exact 80mm x 80mm size
  //   const doc = new jsPDF({
  //     orientation: 'portrait',
  //     unit: 'mm',
  //     format: [80, 80]  // Exact thermal paper size
  //   });

  //   // Set font and initial position
  //   doc.setFont('Arial', 'normal');
  //   let yPos = 5;  // Starting Y position

  //   // Header: Logo and Company Name (left), Queue (right)
  //   // Note: For logo, you'll need the image as base64 or a URL. Replace with your logo path.
  //   // If no logo, skip or use text.
  //   try {
  //     // Assuming you have the logo as a base64 string or URL. For example:
  //     // const logoBase64 = 'data:image/png;base64,...';  // Replace with actual base64
  //     // doc.addImage(logoBase64, 'PNG', 5, yPos, 8, 8);
  //     doc.setFontSize(12);
  //     doc.text('Gateway System', 15, yPos + 5);  // Company name next to logo
  //   } catch (error) {
  //     console.warn('Logo not loaded:', error);
  //   }

  //   // Queue section (right side)
  //   doc.setFontSize(8);
  //   doc.text('No. Antrean', 50, yPos);
  //   doc.setFontSize(16);
  //   doc.setFont('Arial', 'bold');
  //   doc.text(queueNumber, 50, yPos + 5);
  //   yPos += 15;

  //   // Info Section: Left and Right columns
  //   doc.setFontSize(10);
  //   doc.setFont('Arial', 'normal');

  //   // Left column
  //   doc.text(`${formDataDriver || '-'}`, 5, yPos);
  //   yPos += 5;
  //   doc.text(`${formDataPlate || '-'}`, 5, yPos);
  //   yPos += 5;
  //   doc.text(`${formDataCompany || '-'}`, 5, yPos);
  //   yPos += 5;
  //   doc.text(`${formDataDate}`, 5, yPos);
  //   yPos += 5;
  //   doc.text(`${formDataTime}`, 5, yPos);
  //   yPos += 5;
  //   doc.text(`${formDataDepartment || '-'}`, 5, yPos);
  //   yPos += 5;

  //   // Right column (aligned to the right)
  //   let rightY = 25;  // Reset to match left start
  //   doc.text(`${formDataSupplier || '-'}`, 40, rightY);
  //   rightY += 5;
  //   doc.text(`${formDataJenisBarang}`, 40, rightY);
  //   rightY += 5;
  //   doc.text(`${formDataJumlahBarang || '-'}`, 40, rightY);

  //   yPos += 10;  // Space before barcode

  //   // Barcode: Generate and add as SVG
  //   // JsBarcode generates an SVG, so we need to convert it to an image for jsPDF
  //   const barcodeCanvas = document.createElement('canvas');
  //   try {
  //     JsBarcode(barcodeCanvas, ticketNumber, {
  //       format: 'CODE128',
  //       width: 2,
  //       height: 40,  // Smaller for PDF
  //       displayValue: true,
  //       fontSize: 12,
  //       margin: 5,
  //     });
  //     const barcodeDataURL = barcodeCanvas.toDataURL('image/png');
  //     doc.addImage(barcodeDataURL, 'PNG', 5, yPos, 70, 20);  // Center-ish
  //   } catch (error) {
  //     console.warn('Barcode generation failed:', error);
  //     doc.text(`Barcode: ${ticketNumber}`, 5, yPos);
  //   }

  //   yPos += 25;

  //   // Footer
  //   doc.setFontSize(10);
  //   doc.text('PT. Alkindo Naratama TBK', 40, yPos, { align: 'center' });

  //   // Save or print the PDF
  //   // Option 1: Save as file (for testing)
  //   // doc.save('ticket.pdf');
  //   doc.setPage(0);

  //   // Option 2: Auto-print (opens print dialog)
  //   // doc.autoPrint();
  //   // window.open(doc.output('bloburl'), '_blank');  // Opens in new tab for printing

  // //   doc.setProperties({
  // //     title: 'Ticket',
  // //     subject: 'Printed Ticket',
  // //     author: 'Your App',
  // //     keywords: 'ticket',
  // //     creator: 'jsPDF'
  // //   });
  // // // For printing: Open in a way that hints at size
  // // const pdfBlob = doc.output('blob');
  // // // In the new window, add a script to set print options
  // //   const pdfUrl = URL.createObjectURL(pdfBlob);
  // //   // Open the PDF in a new window, with null check
  // //   const printWindow = window.open(pdfUrl, '_blank', 'width=400,height=400');
  // //   if (!printWindow) {
  // //     // Handle if popup is blocked
  // //     alert('Popup blocked! Please allow popups for this site and try again.');
  // //     return;
  // //   }
  // //   // Wait for the window to load, then inject CSS and print
  // //   printWindow.onload = () => {
  // //     // Inject CSS to force the print size
  // //     const style = printWindow.document.createElement('style');
  // //     style.textContent = `
  // //   @media print {
  // //     @page {
  // //       size: 80mm 80mm;
  // //       margin: 0;
  // //     }
  // //     body {
  // //       margin: 0;
  // //       padding: 0;
  // //     }
  // //   }
  // // `;
  // //     printWindow.document.head.appendChild(style);
  // //     printWindow.print();

  // //     // Listen for when printing is done (onafterprint event)
  // //     printWindow.onafterprint = () => {
  // //       printWindow.close();  // Close only after printing completes
  // //     };

  // //     // Fallback: If onafterprint doesn't fire (e.g., in some browsers), close after a delay
  // //     setTimeout(() => {
  // //       if (!printWindow.closed) {
  // //         printWindow.close();
  // //       }
  // //     }, 10000);  // 1
  // //     }}

  //   };

  return {
    previewTicketNumber,
    generateActualTicketNumber,
    handlePrintTicket
  };
}

