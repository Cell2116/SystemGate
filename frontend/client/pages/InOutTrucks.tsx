// import PlaceholderPage from "./PlaceholderPage";

// export default function InOutTrucks(){
//   return(
//     <PlaceholderPage
//     title="In Out Trucks"
//     description="This page will be use for seeing the Trucks from Internal or External"
//     />
//   )
// }

import Clock2 from "../components/dashboard/clock"
import { Truck, TruckIcon, ArrowRight, ArrowLeft, ChartSpline, Logs } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { useState, useRef, useEffect, ChangeEvent } from "react";
import { TableCell, TableBody, TableCaption, TableFooter, TableRow, TableHead, TableHeader, Table } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useTrucksWithFetch, TruckRecord } from "../store/truckStore";
import JsBarcode from "jsbarcode";

export default function InOutTrucks() {

  const [isOpen, setIsOpen] = useState(false);
  const [formStep, setFormStep] = useState(0);
  const [operationType, setOperationType] = useState<"" | "bongkar" | "muat">("");
  const [formData, setFormData] = useState({
    plateNumber: "",
    driver: "",
    supplier: "",
    arrivalTime: "",
    noticket: "",
    department: "",
    nikdriver: "",
    tlpdriver: "",
    nosj: "",
    tglsj: "",
    descin: "",
    descout: "",
    statustruck: "",
    // eta?: "",
    // status: "pending" | "loading" | "finished",
    type: "",
    operation: "", 
    goods: "",
    quantity: "",
    unit: "",
    date: "", 
    armada: "",
    kelengkapan: "",
    jenismobil: "",
  });

  // Data surat jalan dari API menggunakan truck store
  // const { data: suratJalanList, loading: suratJalanLoading, error: suratJalanError, refetch: refetchSuratJalan } = useSuratJalan('pending');

  // State untuk mengatur mode input surat jalan
  const [inputMode, setInputMode] = useState<"select" | "manual">("select");

  // Data trucks dari API menggunakan truck store dengan auto-fetch
  const {
    trucks: allTrucks,
    loading: trucksLoading,
    error: trucksError,
    refetch: refetchTrucks,
    createTruck,
    updateTruckAPI
  } = useTrucksWithFetch({});

  const startCamera = async (target: 'driver' | 'sim' | 'stnk') => {
    setCameraTarget(target);
    setShowCamera(true);
    if (navigator.mediaDevices && videoRef.current) {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      videoRef.current.srcObject = stream;
      videoRef.current.play();
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current && cameraTarget) {
      const context = canvasRef.current.getContext("2d");
      if (context) {
        context.drawImage(videoRef.current, 0, 0, 320, 240);
        const imageData = canvasRef.current.toDataURL("image/png");
        if (cameraTarget === 'driver') setCapturedImage(imageData);
        if (cameraTarget === 'sim') setCapturedSimImage(imageData);
        if (cameraTarget === 'stnk') setCapturedStnkImage(imageData);
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        setShowCamera(false);
        setCameraTarget(null);
      }
    }
  };

  const [showCamera, setShowCamera] = useState(false);
  const [cameraTarget, setCameraTarget] = useState<'driver' | 'sim' | 'stnk' | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedSimImage, setCapturedSimImage] = useState<string | null>(null);
  const [capturedStnkImage, setCapturedStnkImage] = useState<string | null>(null);
  // const timeOptions = Array.from({ length: 48 }, (_, i) => {
  //     const hour = String(Math.floor(i / 2)).padStart(2, "0");
  //     const minute = i % 2 === 0 ? "00" : "30";
  //     return `${hour}:${minute}`;
  //   });
  useEffect(() => {
    if (showCamera && videoRef.current) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }
        })
        .catch((err) => {
          alert("Tidak bisa mengakses kamera: " + err.message);
          setShowCamera(false);
        });
    }
    // Matikan kamera saat kotak kamera ditutup
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    };
  }, [showCamera]);

  // Menggunakan data trucks dari API (bukan dummy)
  const trucks = allTrucks || [];
  
  const handleAddTruck = async () => {
    try {
      const newTruck: Omit<TruckRecord, 'id'> = {
        plateNumber: formData.plateNumber,
        noticket: formData.noticket,
        department: formData.department,
        nikdriver: formData.nikdriver,
        tlpdriver: formData.tlpdriver,
        nosj: formData.nosj,
        tglsj: formData.tglsj,
        driver: formData.driver,
        supplier: formData.supplier,
        arrivalTime: formData.arrivalTime,
        status: "pending",
        type: (formData.type === "internal" || formData.type === "external") ? formData.type as "internal" | "external" : "internal",
        operation: operationType as "bongkar" | "muat",
        goods: formData.goods,
        descin: formData.descin,
        descout: formData.descout,
        statustruck: formData.statustruck,
        estimatedWaitTime: 0,
        date: new Date().toISOString().split('T')[0],
        armada: formData.armada,
        kelengkapan: formData.kelengkapan,
        jenismobil: formData.jenismobil,
      };

      // Menggunakan API untuk membuat truck baru
      await createTruck(newTruck);
      
      // Refresh data
      refetchTrucks();

      // Reset form
      setIsOpen(false); 
      setFormStep(0); 
      setOperationType(""); 
      setInputMode("select");
      setFormData({
        plateNumber: "",
        driver: "",
        supplier: "",
        arrivalTime: "",
        noticket: "",
        department: "",
        nikdriver: "",
        tlpdriver: "",
        nosj: "",
        tglsj: "",
        descin: "",
        descout: "",
        statustruck: "",
        type: "",
        operation: "", 
        goods: "",
        quantity: "",
        unit: "",
        date: "",
        armada: "", 
        kelengkapan: "",
        jenismobil: "" 
      });
    } catch (error) {
      console.error('Error adding truck:', error);
      // You could add error handling UI here
    }
  }
  useEffect(() => {
    if (formStep === 4 && operationType === "bongkar") {
      const ticketNumber = `SU${formData.department}${new Date().toISOString().slice(2,10).replace(/-/g,"")}${"01"}`;
      JsBarcode("#barcode", ticketNumber, {
        format: "CODE128",
        lineColor: "#000",
        width: 2,
        height: 60,
        displayValue: true,
        fontSize: 16,
        margin: 10,
      });
    }
    else if (formStep === 3 && operationType === "muat") {
      const ticketNumber = `CU${formData.department}${new Date().toISOString().slice(2,10).replace(/-/g,"")}${"01"}`;
      JsBarcode("#barcode", ticketNumber, {
        format: "CODE128",
        lineColor: "#000",
        width: 2,
        height: 60,
        displayValue: true,
        fontSize: 16,
        margin: 10,
      });
    }
  }, [formStep, operationType, formData.department]);


  const handlePrintTicket = () => {
  const printContents = document.getElementById("print-barcode-area")?.innerHTML;
  if (printContents) {
    const printWindow = window.open("", "", "width=600,height=400");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Ticket</title>
            <style>
              /* Print-specific styles for 7x5 cm ticket */
              @page {
                size: 5cm 7cm;
                margin: 0;
                padding: 0;
              }
              
              @media print {
                body {
                  width: 7cm;
                  height: 5cm;
                  margin: 0;
                  padding: 1cm;
                  font-family: Arial, sans-serif;
                  font-size: 10px;
                  line-height: 1.2;
                  box-sizing: border-box;
                  background: white;
                  -webkit-print-color-adjust: exact;
                  color-adjust: exact;
                }
                
                .barcode-area {
                  width: 100%;
                  height: 100%;
                  display: flex;
                  flex-direction: column;
                  justify-content: space-between;
                  text-align: center;
                }
                
                /* Header logo and title */
                .barcode-area > div:first-child {
                  display: flex;
                  align-items: left;
                  justify-content: left;
                  margin-bottom: 1mm;
                }
                
                .barcode-area img {
                  width: 8px !important;
                  height: 8px !important;
                  margin-right: 2px;
                }
                
                .barcode-area p {
                  margin: 0;
                  padding: 0;
                  font-size: 6px;
                  font-weight: bold;
                }
                
                /* Info text */
                .barcode-area > div:nth-child(2),
                .barcode-area > div:nth-child(3) {
                  font-size: 6px;
                  margin: 0;
                  text-align: left;
                }
                
                /* Barcode */
                .barcode-area svg {
                  width: 100% !important;
                  height: 12mm !important;
                  margin: 1mm 0;
                }
                
                /* Company name */
                .barcode-area > p:last-child {
                  font-size: 8px;
                  margin-top: 1mm;
                  margin-bottom: 0;
                }
              }
              
              /* Screen display (non-print) */
              @media screen {
                body { 
                  font-family: Arial, sans-serif; 
                  padding: 20px; 
                  background: #f0f0f0;
                }
                .barcode-area { 
                  background: white;
                  padding: 10px;
                  border: 1px solid #ccc;
                  width: 7cm;
                  height: 5cm;
                  margin: 0 auto;
                  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
              }
            </style>
          </head>
          <body>
            <div class="barcode-area">
              ${printContents}
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  }
};

  // Helper functions untuk menghitung statistik berdasarkan operasi
  const getOperationStats = (operation: "bongkar" | "muat") => {
    const operationTrucks = trucks.filter(truck => truck.operation === operation);
    const pending = operationTrucks.filter(truck => truck.status === "Waiting").length;
    const loading = operationTrucks.filter(truck => truck.status === "Loading").length;
    const finished = operationTrucks.filter(truck => truck.status === "Finished").length;
    const total = operationTrucks.length;

    // console.log(pending, loading, finished, total);

    
    return { pending, loading, finished, total };
  };

  const muatStats = getOperationStats("muat");
  const bongkarStats = getOperationStats("bongkar");

  // Helper function untuk menghitung statistik berdasarkan departemen
  const getDepartmentStats = (department: string) => {
    return trucks.filter(truck => truck.department === department).length;
  };

  // Helper function untuk menghitung statistik berdasarkan tipe (internal/external)
  const getTypeStats = (type: string) => {
    return trucks.filter(truck => truck.type === type).length;
  };

  return (
    <div className="space-y-6 p-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex flex-row">Trucks Record
            <Truck className="pl-2 justify-center items-center h-7 w-9 text-blue-800"/>
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            See all the trucks operations today.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Clock2/>
        </div>
      </div>

      {/* Button */}
      <div>
        <div className="justify-center items-center flex sm:flex-col lg:flex-row gap-4">
          <Dialog open = {isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 font-bold h-[2.7em] w-[11em] hover:bg-blue-300 text-[0.8em]"> <TruckIcon className="font-bold h-6 w-6"/>Add New Truck</Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-card/95 border-border/50">
              <DialogHeader className="space-y-3">
                <DialogTitle className="text-2xl font-bold text-center">
                  {formStep === 0 ? "Choose Operation" : 
                    operationType === "bongkar" ? "Form Bongkar Barang" : 
                    operationType === "muat" ? "Form Muat Barang" : "Form Truck Baru"}
                </DialogTitle>
                <DialogDescription className="text-center text-muted-foreground">
                  {formStep === 0 ? "Pilih operasi yang akan dilakukan oleh truck" : 
                    formStep === 1 ? "Bagian ini bisa diisi oleh Pengemudi/Driver":
                    formStep === 2 ? "Bagian ini harus diisi oleh Security":""}
                </DialogDescription>
              </DialogHeader>

            <form className="space-y-4 py-4">
              {formStep === 0 && (                
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <Button
                    type="button"
                    onClick={() => {
                      setOperationType("bongkar");
                      setFormStep(1);
                    }}
                    className={`h-24 flex flex-col items-center justify-center space-y-2 ${
                      operationType === "bongkar" 
                        ? "bg-red-500 hover:bg-red-700" 
                        : "bg-red-500 hover:bg-red-700"
                    }`}
                  >
                    <ArrowLeft className="w-9 h-9" />
                    <span className="text-lg font-semibold">Bongkar</span>
                    <span className="text-xs opacity-80">Unloading Operation</span>
                  </Button>
                  
                  <Button
                    type="button"
                    onClick={() => {
                      setOperationType("muat");
                      setFormStep(1);
                    }}
                    className={`h-24 flex flex-col items-center justify-center space-y-2 ${
                      operationType === "muat" 
                        ? "bg-green-500 hover:bg-green-700" 
                        : "bg-green-500 hover:bg-green-700"
                    }`}
                  >
                    <ArrowRight className="w-8 h-8" />
                    <span className="text-lg font-semibold">Muat</span>
                    <span className="text-xs opacity-80">Loading Operation</span>
                  </Button>
                </div>
              </div>
              )}
              
              {/* Form Unloading - Step 1 */}
              {formStep === 1 && operationType === "bongkar" && (                
              <div className="space-y-4">               
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="driver" className="text-sm font-semibold">
                      Pengemudi /
                      <span className="italic opacity-50 text-xs"> Driver</span>
                    </Label>
                    <Input
                      id="driver"
                      placeholder="Nama Pengemudi" 
                      value={formData.driver}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({...formData, driver: e.target.value})}
                      className="h-9 border-gray-300 focus:border-blue-500 focus:outline-none"
                      required
                      />
                  </div>
                  <div>
                    <Label htmlFor="plateNumber" className="text-sm font-semibold">
                      Plat Nomor /
                      <span className="italic opacity-50 text-xs"> License Plate</span>
                    </Label>
                    <Input
                      id="plateNumber"
                      placeholder="ABC-123"
                      value={formData.plateNumber}
                      onChange={(e) => setFormData({...formData, plateNumber: e.target.value})}
                      className="h-9 border-gray-300 focus:border-blue-500 focus:outline-none"
                      required
                      />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nikdriver" className="text-sm font-semibold">
                      NIK /
                      <span className="italic opacity-50 text-xs"> National ID Number</span>
                    </Label>
                    <Input
                      id="nikdriver"
                      placeholder="NIK Pengemudi" 
                      value={formData.nikdriver}
                      onChange={(e) => setFormData({...formData, nikdriver: e.target.value})}
                      className="h-9 border-gray-300 focus:border-blue-500 focus:outline-none"
                      required
                      />
                  </div>
                  <div>
                    <Label htmlFor="tlpdriver" className="text-sm font-semibold">
                      No Telfon /
                      <span className="italic opacity-50 text-xs"> Phone Number</span>
                    </Label>
                    <Input
                      id="tlpdriver"
                      placeholder="+62"
                      value={formData.tlpdriver}
                      onChange={(e) => setFormData({...formData, tlpdriver: e.target.value})}
                      className="h-9 border-gray-300 focus:border-blue-500 focus:outline-none"
                      required
                      />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="supplier" className="text-sm font-semibold">
                      Perusahaan Asal /
                      <span className="italic opacity-50 text-xs"> Origin Company</span>
                    </Label>
                    <Input
                      id="supplier"
                      placeholder="Nama Perusahaan"
                      value={formData.supplier}
                      onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                      className="h-9 border-gray-300 focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="arrivalTime" className="text-sm font-semibold">
                      Jam Kedatangan
                      <span className="opacity-60"> (24H)</span> /
                      <span className="italic opacity-50 text-xs"> Arrival Time (24H)</span>
                    </Label>
                    <Input
                      id="arrivalTime"
                      type="time"
                      value={formData.arrivalTime}
                      onChange={(e) => setFormData({...formData, arrivalTime: e.target.value})}
                      className="h-9 border-gray-300 focus:border-blue-500 focus:outline-none"
                      required
                      />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Label htmlFor="fotoDriver" className="text-sm font-semibold">
                    Foto Pengemudi /
                    <span className="italic opacity-50 text-xs">Driver's Photo</span>
                  </Label>
                  <Button
                    type="button"
                    className="bg-blue-600 font-bold h-[2.7em] w-[7em] hover:bg-blue-300 text-[0.8em] mt-2"
                    onClick={()=> startCamera('driver')}                    >
                    Ambil Foto
                  </Button>
                  {capturedImage && (
                  <img src={capturedImage} alt="Captured" className="rounded border w-32" />
                )}
                  {showCamera && (
                    <div className="flex flex-col items-center">
                      <video ref={videoRef} width={320} height={240} autoPlay className="rounded border" />
                      <Button type="button" onClick={capturePhoto}>Capture</Button>
                      <canvas ref={canvasRef} width={320} height={240} style={{ display: "none" }} />
                    </div>
                  )}
                  </div>
              </div>
              )}
              
              {/* Form Unloading - Step 2 */}
              {formStep === 2 && operationType === "bongkar" && (                
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="goods" className="text-sm font-semibold">
                      Nama Barang /
                      <span className="italic opacity-50 text-xs"> Name of Goods</span>
                    </Label>
                    <Input
                      id="goods"
                      placeholder="Jenis barang yang dibongkar"
                      value={formData.goods}
                      onChange={(e) => setFormData({...formData, goods: e.target.value})}
                      className="h-9 border-gray-300 focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="descin" className="text-sm font-semibold">
                      Jumlah Barang /
                      <span className="italic opacity-50 text-xs"> Goods Quantity</span>
                    </Label>
                    <Input
                      id="descin"
                      placeholder="Jumlah barang yang dibongkar"
                      value={formData.descin}
                      onChange={(e) => setFormData({...formData, descin: e.target.value})}
                      className="h-9 border-gray-300 focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="department" className="text-sm font-semibold">
                      Departemen Tujuan /
                      <span className="italic opacity-50 text-xs"> Destination Department</span>
                    </Label>
                    <select
                      id="department"
                      value={formData.department}
                      onChange={(e) => setFormData({...formData, department: e.target.value})}
                      className="h-9 border border-gray-300 rounded-md px-3 py-2 bg-background text-gray-500 text-sm focus:border-blue-500 focus:outline-none"
                      required
                    >
                      <option value="">Pilih Departemen</option>
                      <option value="HPC">HPC</option>
                      <option value="PT">PT</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <Label htmlFor="statustruck" className="text-sm font-semibold">
                      Kondisi Truck /
                      <span className="italic opacity-50 text-xs"> Truck Condition</span>
                    </Label>
                    <select
                      id="statustruck"
                      value={formData.statustruck}
                      onChange={(e) => setFormData({...formData, statustruck: e.target.value})} 
                      className="h-9 border border-gray-300 rounded-md px-3 py-2 bg-background text-gray-500 text-sm focus:border-blue-500 focus:outline-none"
                      required
                    >
                      <option value="">Pilih Status</option>
                      <option value="isi">Isi (Ada Barang)</option>
                      <option value="kosong">Kosong</option>
                    </select>
                  </div>
                  <div>
                  <Label htmlFor="date" className="text-sm font-semibold">
                    Tanggal /
                    <span className="italic opacity-50 text-xs"> Date</span>
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="h-9 border-gray-300 focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <Label htmlFor="fotoSim" className="text-sm font-semibold">
                    Foto SIM Pengemudi
                  </Label>
                  <Button
                    type="button"
                    className="bg-blue-600 font-bold h-[2.7em] w-[7em] hover:bg-blue-300 text-[0.8em] mt-2"
                    onClick={() => startCamera('sim')}
                  >
                    Foto SIM
                  </Button>
                  {capturedSimImage && (
                    <img src={capturedSimImage} alt="SIM" className="rounded border w-32" />
                  )}
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <Label htmlFor="fotoStnk" className="text-sm font-semibold">
                    Foto STNK Kendaraan
                  </Label>
                  <Button
                    type="button"
                    className="bg-blue-600 font-bold h-[2.7em] w-[7em] hover:bg-blue-300 text-[0.8em] mt-2"
                    onClick={() => startCamera('stnk')}
                  >
                    Foto STNK
                  </Button>
                  {capturedStnkImage && (
                    <img src={capturedStnkImage} alt="STNK" className="rounded border w-32" />
                  )}
                </div>
                {showCamera && cameraTarget && (
                  <div className="flex flex-col items-center">
                    <video ref={videoRef} width={320} height={240} autoPlay className="rounded border" />
                    <Button type="button" onClick={capturePhoto}>Capture</Button>
                    <canvas ref={canvasRef} width={320} height={240} style={{ display: "none" }} />
                  </div>
                )}
              </div>
              )}
              {/* Step 3 Unloading */}
              {formStep === 3 && operationType === "bongkar" && (
                <div className="space-y-4">
                  {/* <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-600">
                      Pilih nomor <span className="text-blue-700">Surat Jalan</span> atau mengisi secara manual.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={inputMode === "select" ? "default" : "outline"}
                        onClick={() => setInputMode("select")}
                        className="text-xs"
                      >
                        Pilih dari Data
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={inputMode === "manual" ? "default" : "outline"}
                        onClick={() => setInputMode("manual")}
                        className="text-xs"
                      >
                        Input Manual
                      </Button>
                    </div>
                  </div>

                  {inputMode === "select" ? (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="suratJalanSelect" className="text-sm font-semibold">
                          Pilih Surat Jalan /
                          <span className="italic opacity-50 text-xs"> Select Delivery Note</span>
                        </Label>
                        <Select
                          value={formData.nosj}
                          onValueChange={(value) => {
                            const selectedSJ = suratJalanList.find(sj => sj.noSuratJalan === value);
                            if (selectedSJ) {
                              setFormData({
                                ...formData, 
                                nosj: selectedSJ.noSuratJalan,
                                tglsj: selectedSJ.tanggal
                              });
                            }
                          }}
                          disabled={suratJalanLoading}
                        >
                          <SelectTrigger className="h-15 border-gray-300 focus:border-blue-500">
                            <SelectValue placeholder={
                              suratJalanLoading ? "Loading..." :
                              suratJalanError ? "Error loading data" :
                              suratJalanList.length === 0 ? "Tidak ada surat jalan tersedia" :
                              "Pilih nomor surat jalan..."
                            } />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>
                                Daftar Surat Jalan 
                                {suratJalanError && (
                                  <button 
                                    onClick={refetchSuratJalan}
                                    className="ml-2 text-xs text-blue-500 hover:text-blue-700"
                                  >
                                    (Retry)
                                  </button>
                                )}
                              </SelectLabel>
                              {suratJalanLoading ? (
                                <SelectItem value="loading" disabled>
                                  <div className="flex items-center">
                                    <span className="text-gray-500">Loading data...</span>
                                  </div>
                                </SelectItem>
                              ) : suratJalanError ? (
                                <SelectItem value="error" disabled>
                                  <div className="flex flex-col">
                                    <span className="text-red-500">Error: {suratJalanError}</span>
                                    <span className="text-xs text-gray-500">Click retry di atas</span>
                                  </div>
                                </SelectItem>
                              ) : suratJalanList.length === 0 ? (
                                <SelectItem value="empty" disabled>
                                  <span className="text-gray-500">Tidak ada surat jalan tersedia</span>
                                </SelectItem>
                              ) : (
                                suratJalanList.map((sj) => (
                                  <SelectItem key={sj.id} value={sj.noSuratJalan}>
                                    <div className="flex flex-col">
                                      <span className="font-medium">{sj.noSuratJalan}</span>
                                      <span className="text-xs text-gray-500">{sj.tanggal}</span>
                                      {sj.supplier && (
                                        <span className="text-xs text-blue-600">{sj.supplier}</span>
                                      )}
                                    </div>
                                  </SelectItem>
                                ))
                              )}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {formData.nosj && (
                        <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-md">
                          <div>
                            <Label className="text-sm font-semibold text-gray-600">
                              No. Surat Jalan Terpilih
                            </Label>
                            <p className="text-sm font-medium">{formData.nosj}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-semibold text-gray-600">
                              Tanggal Surat Jalan
                            </Label>
                            <p className="text-sm font-medium">{formData.tglsj}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="nosj" className="text-sm font-semibold">
                          No. Surat Jalan /
                          <span className="italic opacity-50 text-xs"> Delivery Note Number</span>
                        </Label>
                        <Input
                          id="nosj"
                          placeholder="SJ001"
                          value={formData.nosj}
                          onChange={(e) => setFormData({...formData, nosj: e.target.value})}
                          className="h-9 border-gray-300 focus:border-blue-500 focus:outline-none"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="tglsj" className="text-sm font-semibold">
                          Tanggal Surat Jalan /
                          <span className="italic opacity-50 text-xs"> Delivery Note Date</span>
                        </Label>
                        <Input
                          id="tglsj"
                          type="date"
                          value={formData.tglsj}
                          onChange={(e) => setFormData({...formData, tglsj: e.target.value})}
                          className="h-9 border-gray-300 focus:border-blue-500 focus:outline-none"
                          required
                          />
                      </div>
                    </div>
                  )} */}
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-600">
                      Masukan Nomor <span className="text-blue-700">Surat Jalan</span>.
                    </p>
                  </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="nosj" className="text-sm font-semibold">
                          No. Surat Jalan /
                          <span className="italic opacity-50 text-xs"> Delivery Note Number</span>
                        </Label>
                        <Input
                          id="nosj"
                          placeholder="SJ001"
                          value={formData.nosj}
                          onChange={(e) => setFormData({...formData, nosj: e.target.value})}
                          className="h-9 border-gray-300 focus:border-blue-500 focus:outline-none"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="tglsj" className="text-sm font-semibold">
                          Tanggal Surat Jalan /
                          <span className="italic opacity-50 text-xs"> Delivery Note Date</span>
                        </Label>
                        <Input
                          id="tglsj"
                          type="date"
                          value={formData.tglsj}
                          onChange={(e) => setFormData({...formData, tglsj: e.target.value})}
                          className="h-9 border-gray-300 focus:border-blue-500 focus:outline-none"
                          required
                          />
                      </div>
                    </div>

                </div>
              )}
              {/* Step 4 Unloading */}
              {formStep === 4 && operationType === "bongkar" && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="noticket" className="text-sm font-semibold">
                      No. Tiket /
                      <span className="italic opacity-50 text-xs"> Ticket Number (Otomatis)</span>
                    </Label>
                    <div className="font-bold text-lg bg-gray-100 p-2 rounded">
                      {`SU${formData.department}${new Date().toISOString().slice(2,10).replace(/-/g,"")}${"01"}`}
                      {/* {`SU${new Date().toISOString().slice(2,10).replace(/-/g,"")}${formData.id || "01"}`} */}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold opacity-85 text-slate-600">
                      Silahkan tekan <span className="italic">generate</span> untuk mencetak <span className="text-blue-600">Barcode</span> tiket masuk truck.
                    </p>
                  </div>
                  <div className="flex justify-center items-center">
                    <div id="print-barcode-area" className="bg-white w-[25vw] flex flex-col p-5">
                      <div className="flex flex-row">
                        <img src="../../dist/spa/alkindo-naratama-tbk--600-removebg-preview.png" alt="alkindo" className="w-7 h-7" />
                        <p className="font-bold">Gateway System</p>
                      </div>
                      <div className="flex flex-row text-xs pt-5">
                        <p>{formData.driver} || {formData.plateNumber} || {formData.nosj}</p>
                      </div>
                      <div className="flex flex-row text-xs">
                        <p>{formData.date} || {formData.arrivalTime}</p>
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
                      onClick={handlePrintTicket} 
                    >
                      Print Ticket
                    </Button>
                  </div>
                  <div>
                    <p className="text-xs font-semibold opacity-85 text-slate-600">
                      <span className="text-red-600">Peringatan!</span> jangan melakukan simpan sebelum mencetak <span className="text-blue-600">Barcode</span> ticket.
                    </p>
                  </div>
                </div>
              )}
              
              {/* Form Loading */}
              {formStep === 1 && operationType === "muat" && (                
              <div className="space-y-4">               
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="driver" className="text-sm font-semibold">
                      Pengemudi /
                      <span className="italic opacity-50 text-xs"> Driver</span>
                    </Label>
                    <Input
                      id="driver"
                      placeholder="Nama Pengemudi" 
                      value={formData.driver}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({...formData, driver: e.target.value})}
                      className="h-9 border-gray-300 focus:border-blue-500 focus:outline-none"
                      required
                      />
                  </div>
                  <div>
                    <Label htmlFor="plateNumber" className="text-sm font-semibold">
                      Plat Nomor /
                      <span className="italic opacity-50 text-xs"> License Plate</span>
                    </Label>
                    <Input
                      id="plateNumber"
                      placeholder="ABC-123"
                      value={formData.plateNumber}
                      onChange={(e) => setFormData({...formData, plateNumber: e.target.value})}
                      className="h-9 border-gray-300 focus:border-blue-500 focus:outline-none"
                      required
                      />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nikdriver" className="text-sm font-semibold">
                      NIK /
                      <span className="italic opacity-50 text-xs"> National ID Number</span>
                    </Label>
                    <Input
                      id="nikdriver"
                      placeholder="NIK Pengemudi" 
                      value={formData.nikdriver}
                      onChange={(e) => setFormData({...formData, nikdriver: e.target.value})}
                      className="h-9 border-gray-300 focus:border-blue-500 focus:outline-none"
                      required
                      />
                  </div>
                  <div>
                    <Label htmlFor="tlpdriver" className="text-sm font-semibold">
                      No Telfon /
                      <span className="italic opacity-50 text-xs"> Phone Number</span>
                    </Label>
                    <Input
                      id="tlpdriver"
                      placeholder="+62"
                      value={formData.tlpdriver}
                      onChange={(e) => setFormData({...formData, tlpdriver: e.target.value})}
                      className="h-9 border-gray-300 focus:border-blue-500 focus:outline-none"
                      required
                      />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="armada" className="text-sm font-semibold">
                      Armada /
                      <span className="italic opacity-50 text-xs"> Armada</span>
                    </Label>
                    <Input
                      id="armada"
                      placeholder="Armada"
                      value={formData.armada}
                      onChange={(e) => setFormData({...formData, armada: e.target.value})}
                      className="h-9 border-gray-300 focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div className="flex flex-col">
                    <Label htmlFor="statustruck" className="text-sm font-semibold">
                      Kondisi Truck /
                      <span className="italic opacity-50 text-xs"> Truck Condition</span>
                    </Label>
                    <select
                      id="statustruck"
                      value={formData.statustruck}
                      onChange={(e) => setFormData({...formData, statustruck: e.target.value})} 
                      className="h-9 border border-gray-300 rounded-md px-3 py-2 bg-background text-gray-500 text-sm focus:border-blue-500 focus:outline-none"
                      required
                    >
                      <option value="">Pilih Status</option>
                      <option value="isi">Isi (Ada Barang)</option>
                      <option value="kosong">Kosong</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="arrivalTime" className="text-sm font-semibold">
                      Jam Kedatangan
                      <span className="opacity-60"> (24H)</span> /
                      <span className="italic opacity-50 text-xs"> Arrival Time (24H)</span>
                    </Label>
                    <Input
                      id="arrivalTime"
                      type="time"
                      value={formData.arrivalTime}
                      onChange={(e) => setFormData({...formData, arrivalTime: e.target.value})}
                      className="h-9 border-gray-300 focus:border-blue-500 focus:outline-none"
                      required
                      />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Label htmlFor="fotoDriver" className="text-sm font-semibold">
                    Foto Pengemudi /
                    <span className="italic opacity-50 text-xs">Driver's Photo</span>
                  </Label>
                  <Button
                    type="button"
                    className="bg-blue-600 font-bold h-[2.7em] w-[7em] hover:bg-blue-300 text-[0.8em] mt-2"
                    onClick={()=> startCamera('driver')}                    >
                    Ambil Foto
                  </Button>
                  {capturedImage && (
                  <img src={capturedImage} alt="Captured" className="rounded border w-32" />
                )}
                  {showCamera && (
                    <div className="flex flex-col items-center">
                      <video ref={videoRef} width={320} height={240} autoPlay className="rounded border" />
                      <Button type="button" onClick={capturePhoto}>Capture</Button>
                      <canvas ref={canvasRef} width={320} height={240} style={{ display: "none" }} />
                    </div>
                  )}
                  </div>
              </div>
              )}
              
              {/* Form loading - Step 2 */}
              {formStep === 2 && operationType === "muat" && (                
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="goods" className="text-sm font-semibold">
                      Nama Barang /
                      <span className="italic opacity-50 text-xs"> Name of Goods</span>
                    </Label>
                    <Input
                      id="goods"
                      placeholder="Jenis barang yang diangkut"
                      value={formData.goods}
                      onChange={(e) => setFormData({...formData, goods: e.target.value})}
                      className="h-9 border-gray-300 focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="descin" className="text-sm font-semibold">
                      Jumlah Barang /
                      <span className="italic opacity-50 text-xs"> Goods Quantity</span>
                    </Label>
                    <Input
                      id="descin"
                      placeholder="Jumlah barang yang diangkut"
                      value={formData.descin}
                      onChange={(e) => setFormData({...formData, descin: e.target.value})}
                      className="h-9 border-gray-300 focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <Label htmlFor="type" className="text-sm font-semibold">
                      Transporter /
                      <span className="italic opacity-50 text-xs"> Transporter</span>
                    </Label>
                    <select
                      id="type"
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      className="h-9 border border-gray-300 rounded-md px-3 py-2 bg-background text-gray-500 text-sm focus:border-blue-500 focus:outline-none"
                      required
                    >
                      <option value="">Asal Truck</option>
                      <option value="internal">Kendaraan Internal</option>
                      <option value="external">Kendaraan External</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="department" className="text-sm font-semibold">
                      Departemen Tujuan /
                      <span className="italic opacity-50 text-xs"> Destination Department</span>
                    </Label>
                    <select
                      id="department"
                      value={formData.department}
                      onChange={(e) => setFormData({...formData, department: e.target.value})}
                      className="h-9 border border-gray-300 rounded-md px-3 py-2 bg-background text-gray-500 text-sm focus:border-blue-500 focus:outline-none"
                      required
                    >
                      <option value="">Pilih Departemen</option>
                      <option value="HPC">HPC</option>
                      <option value="PT">PT</option>
                    </select>
                  </div>
                </div>
                <div className="">

                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                  <Label htmlFor="date" className="text-sm font-semibold">
                    Tanggal /
                    <span className="italic opacity-50 text-xs"> Date</span>
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="h-9 border-gray-300 focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <Label htmlFor="fotoSim" className="text-sm font-semibold">
                    Foto SIM Pengemudi
                  </Label>
                  <Button
                    type="button"
                    className="bg-blue-600 font-bold h-[2.7em] w-[7em] hover:bg-blue-300 text-[0.8em] mt-2"
                    onClick={() => startCamera('sim')}
                  >
                    Foto SIM
                  </Button>
                  {capturedSimImage && (
                    <img src={capturedSimImage} alt="SIM" className="rounded border w-32" />
                  )}
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <Label htmlFor="fotoStnk" className="text-sm font-semibold">
                    Foto STNK Kendaraan
                  </Label>
                  <Button
                    type="button"
                    className="bg-blue-600 font-bold h-[2.7em] w-[7em] hover:bg-blue-300 text-[0.8em] mt-2"
                    onClick={() => startCamera('stnk')}
                  >
                    Foto STNK
                  </Button>
                  {capturedStnkImage && (
                    <img src={capturedStnkImage} alt="STNK" className="rounded border w-32" />
                  )}
                </div>
                {showCamera && cameraTarget && (
                  <div className="flex flex-col items-center">
                    <video ref={videoRef} width={320} height={240} autoPlay className="rounded border" />
                    <Button type="button" onClick={capturePhoto}>Capture</Button>
                    <canvas ref={canvasRef} width={320} height={240} style={{ display: "none" }} />
                  </div>
                )}
              </div>
              )}
              {/* Step 3 Unloading */}
              {formStep === 3 && operationType === "muat" && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="noticket" className="text-sm font-semibold">
                      No. Tiket /
                      <span className="italic opacity-50 text-xs"> Ticket Number (Otomatis)</span>
                    </Label>
                    <div className="font-bold text-lg bg-gray-100 p-2 rounded">
                      {`CU${formData.department}${new Date().toISOString().slice(2,10).replace(/-/g,"")}${"01"}`}
                      {/* {`SU${new Date().toISOString().slice(2,10).replace(/-/g,"")}${formData.id || "01"}`} */}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold opacity-85 text-slate-600">
                      Silahkan tekan <span className="italic">generate</span> untuk mencetak <span className="text-blue-600">Barcode</span> tiket masuk truck.
                    </p>
                  </div>
                  <div className="flex justify-center items-center">
                    <div id="print-barcode-area" className="bg-white w-[25vw] flex flex-col p-5">
                      <div className="flex flex-row">
                        <img src="../../dist/spa/alkindo-naratama-tbk--600-removebg-preview.png" alt="alkindo" className="w-7 h-7" />
                        <p className="font-bold">Gateway System</p>
                      </div>
                      <div className="flex flex-row text-xs pt-5">
                        <p>{formData.driver} || {formData.plateNumber} || {formData.armada}</p>
                      </div>
                      <div className="flex flex-row text-xs">
                        <p>{formData.date} || {formData.arrivalTime}</p>
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
                      onClick={handlePrintTicket} 
                    >
                      Print Ticket
                    </Button>
                  </div>
                  <div>
                    <p className="text-xs font-semibold opacity-85 text-slate-600">
                      <span className="text-red-600">Peringatan!</span> jangan melakukan simpan sebelum mencetak <span className="text-blue-600">Barcode</span> ticket.
                    </p>
                  </div>
                </div>
              )}
              
              <div className="flex flex-row justify-between gap-4 pt-4">
                {formStep > 0 && (
                  <Button 
                    type="button" 
                    onClick={() => {
                      if (formStep === 1) {
                        setFormStep(0);
                        setOperationType("");
                      } else if (formStep === 2) {
                        setFormStep(1);
                      } else if(formStep === 3){
                        setFormStep(2);
                        setInputMode("select"); // reset input mode when going back from step 3
                      } else if (formStep === 4){
                        setFormStep(3);
                      }
                    }}
                    className="bg-gray-500 hover:bg-gray-600 text-white"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Kembali
                  </Button>
                )}
                
                {/* Next button untuk form bongkar step 1 */}
                {formStep === 1 && operationType === "bongkar" && (
                  <Button 
                    type="button" 
                    onClick={() => setFormStep(2)}
                    className="bg-red-600 hover:bg-red-700 text-white ml-auto"
                  >
                    Selanjutnya
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
                {formStep === 2 && operationType === "bongkar" && (
                  <Button 
                    type="button" 
                    onClick={() => setFormStep(3)}
                    className="bg-red-600 hover:bg-red-700 text-white ml-auto"
                  >
                    Selanjutnya
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
                
                {/* Submit button untuk form bongkar step 2 */}
                {formStep === 3 && operationType === "bongkar" && (
                  <Button 
                    type="button" 
                    onClick={() => setFormStep(4)}
                    className="bg-red-600 hover:bg-red-700 text-white ml-auto"
                  >
                    Selanjutnya
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
                {/* Submit button untuk form bongkar step 3 */}
                {formStep === 4 && operationType === "bongkar" && (
                  <Button 
                    type="button" 
                    onClick={handleAddTruck}
                    className="bg-red-600 hover:bg-red-700 text-white ml-auto"
                  >
                    Simpan Bongkar
                  </Button>
                )}
                
                {/* Submit button untuk form muat (langsung step 1) */}
                {formStep === 1 && operationType === "muat" && (
                  <Button 
                    type="button" 
                    onClick={() => setFormStep(2)}
                    className="bg-green-600 hover:bg-green-700 text-white ml-auto"
                  >
                    Selanjutnya
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
                {formStep === 2 && operationType === "muat" && (
                  <Button 
                    type="button" 
                    onClick={() => setFormStep(3)}
                    className="bg-green-600 hover:bg-green-700 text-white ml-auto"
                  >
                    Selanjutnya
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
                {formStep === 3 && operationType === "muat" && (
                  <Button 
                    type="button" 
                    onClick={handleAddTruck}
                    className="bg-green-600 hover:bg-green-700 text-white ml-auto"
                  >
                    Simpan Muat
                  </Button>
                )}
              </div>
            </form>
            </DialogContent>
          </Dialog>
          <Button className="bg-white-600 text-black border font-bold h-[2.7em] w-[11em] hover:bg-slate-300 text-[0.8em]"> <ChartSpline className="font-bold h-6 w-6 text-green-500"/>View Analytics</Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex sm:flex-row lg:flex-row gap-4 md:h-[64vh] xl:h-[67vh] w-full xl:pr-9 2xl:pr-2">
        {/* Left Half - 6 Cards Total */}
        <div className="w-1/2 flex flex-col gap-4">
          {/* Top Row: Loading and Unloading Cards (2 cards) */}
          <div className="flex flex-row gap-4 h-1/2">
            {/* Loading Trucks Card */}
            <div className="w-1/2">
              <Card className="h-full flex flex-col">
                <CardHeader className="font-bold text-lg justify-center items-left">
                  <div className="flex flex-row gap-2 font-bold items-center">
                    <div className="w-7 h-7 rounded-full bg-green-200 flex items-center justify-center border">
                      <ArrowRight className="text-green-600 font-bold w-4 h-4"/>
                    </div>
                    <div className="flex flex-col justify-center">
                      <span className="text-sm text-green-800"> Loading Trucks </span>
                      <span className="text-xs text-slate-500 font-medium"> Operations Trucks </span>
                    </div>
                  </div>
                </CardHeader>
                <CardTitle>
                  <div className=" flex flex-col text-center">
                    <div className="text-[1.5em] text-green-600 font-bold">
                      {muatStats.total}
                    </div>
                    <div className="text-sm text-slate-400">
                      Trucks Today
                    </div>
                  </div>
                </CardTitle>
                <CardContent>
                  {/* Card Content */}
                  <div className="flex flex-row justify-center items-center mt-3 space-x-2">
                    <Card className="bg-yellow-100 w-[4vw] h-[6vh] flex justify-center items-center">
                      <div className="flex flex-col text-center">
                        <span className="text-yellow-600 text-xs font-bold pb-1">{muatStats.pending}</span>
                        <span className="text-yellow-600 text-xs pb-1">Pending</span>
                      </div>
                    </Card>
                    <Card className="bg-blue-100 w-[4vw] h-[6vh] flex justify-center items-center">
                      <div className="flex flex-col text-center">
                        <span className="text-blue-600 text-xs font-bold pb-1">{muatStats.loading}</span>
                        <span className="text-blue-600 text-xs pb-1">Loading</span>
                      </div>
                    </Card>
                    <Card className="bg-green-100 w-[4vw] h-[6vh] flex justify-center items-center">
                      <div className="flex flex-col text-center">
                        <span className="text-green-600 text-xs font-bold pb-1">{muatStats.finished}</span>
                        <span className="text-green-600 text-xs pb-1">Finished</span>
                      </div>
                    </Card>
                  </div>
                </CardContent>
              </Card>  
            </div>

            {/* Unloading Trucks Card */}
            <div className="w-1/2">
              <Card className="h-full flex flex-col">
                <CardHeader className="font-bold text-lg justify-center items-left">  
                  <div className="flex flex-row gap-2 font-bold items-center">
                    <div className="w-7 h-7 rounded-full bg-red-200 flex items-center justify-center border">
                      <ArrowLeft className="text-red-600 font-bold w-4 h-4"/>
                    </div>
                    <div className="flex flex-col justify-center">
                      <span className="text-sm text-red-800"> Unloading Trucks </span>
                      <span className="text-xs text-slate-500 font-medium"> Operations Trucks </span>
                    </div>
                  </div>
                </CardHeader>
                <CardTitle>
                  <div className=" flex flex-col text-center pa-3">
                    <div className="text-[1.5em] text-red-600 font-bold">
                      {bongkarStats.total}
                    </div>
                    <div className="text-sm text-slate-400">
                      Trucks Today
                    </div>
                  </div>
                </CardTitle>
                <CardContent>
                  {/* Card Content */}
                  <div className="flex justify-center items-center mt-3 space-x-2">
                    <Card className="bg-yellow-100 w-[4vw] h-[6vh] flex justify-center items-center">
                      <div className="flex flex-col text-center">
                        <span className="text-yellow-600 text-xs font-bold pb-1">{bongkarStats.pending}</span>
                        <span className="text-yellow-600 text-xs pb-1">Pending</span>
                      </div>
                    </Card>
                    <Card className="bg-blue-100 w-[4vw] h-[6vh] flex justify-center items-center">
                      <div className="flex flex-col text-center">
                        <span className="text-blue-600 text-xs font-bold pb-1">{bongkarStats.loading}</span>
                        <span className="text-blue-600 text-xs pb-1">Loading</span>
                      </div>
                    </Card>
                    <Card className="bg-green-100 w-[4vw] h-[6vh] flex justify-center items-center">
                      <div className="flex flex-col text-center">
                        <span className="text-green-600 text-xs font-bold pb-1">{bongkarStats.finished}</span>
                        <span className="text-green-600 text-xs pb-1">Finished</span>
                      </div>
                    </Card>
                  </div>
                </CardContent>
              </Card>  
            </div>
          </div>

          {/* Bottom Row: 4 Cards - Internal, External, HPC, PT */}
          <div className="flex flex-row gap-2 h-1/2">
            {/* Internal Trucks Card */}
            <div className="w-1/4">
              <Card className="h-full flex flex-col">
                <CardHeader className="flex-shrink-0 pb-1">
                  <div className="flex flex-row gap-1 font-bold items-center">
                    <div className="w-5 h-5 rounded-full bg-green-200 flex items-center justify-center border">
                      <TruckIcon className="text-green-600 font-bold w-3 h-3"/>
                    </div>
                    <div className="flex flex-col justify-center">
                      <span className="text-xs text-green-800"> Internal</span>
                      <span className="text-xs text-slate-500 font-medium"> Alkindo's </span>
                    </div>
                  </div>
                </CardHeader>
                <CardTitle className="flex-shrink-0 pb-1">
                  <div className="flex flex-col text-center">
                    <div className="text-lg text-green-600 font-bold">
                      {getTypeStats("Inbound")}
                    </div>
                    <div className="text-xs text-slate-400">
                      Today
                    </div>
                  </div>
                </CardTitle>
                <CardContent className="flex-1 flex items-center justify-center p-2">
                  <div className="w-full h-8 bg-green-50 rounded flex items-center justify-center border border-green-200">
                    <span className="text-green-600 text-xs font-medium">Internal</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* External Trucks Card */}
            <div className="w-1/4">
              <Card className="h-full flex flex-col">
                <CardHeader className="flex-shrink-0 pb-1">
                  <div className="flex flex-row gap-1 font-bold items-center">
                    <div className="w-5 h-5 rounded-full bg-blue-200 flex items-center justify-center border">
                      <TruckIcon className="text-blue-600 font-bold w-3 h-3"/>
                    </div>
                    <div className="flex flex-col justify-center">
                      <span className="text-xs text-blue-800"> External </span>
                      <span className="text-xs text-slate-500 font-medium"> Vendor's </span>
                    </div>
                  </div>
                </CardHeader>
                <CardTitle className="flex-shrink-0 pb-1">
                  <div className="flex flex-col text-center">
                    <div className="text-lg text-blue-600 font-bold">
                      {getTypeStats("Outbound")}
                    </div>
                    <div className="text-xs text-slate-400">
                      Today
                    </div>
                  </div>
                </CardTitle>
                <CardContent className="flex-1 flex items-center justify-center p-2">
                  <div className="w-full h-8 bg-blue-50 rounded flex items-center justify-center border border-blue-200">
                    <span className="text-blue-600 text-xs font-medium">External</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Department HPC */}
            <div className="w-1/4">
              <Card className="h-full flex flex-col">
                <CardHeader className="flex-shrink-0 pb-1">
                  <div className="flex flex-row gap-1 font-bold items-center">
                    <div className="w-5 h-5 rounded-full bg-purple-200 flex items-center justify-center border">
                      <span className="text-purple-600 font-bold text-xs">H</span>
                    </div>
                    <div className="flex flex-col justify-center">
                      <span className="text-xs text-purple-800"> Dept. HPC </span>
                      <span className="text-xs text-slate-500 font-medium"> Destination </span>
                    </div>
                  </div>
                </CardHeader>
                <CardTitle className="flex-shrink-0 pb-1">
                  <div className="flex flex-col text-center">
                    <div className="text-lg text-purple-600 font-bold">
                      {getDepartmentStats("HPC")}
                    </div>
                    <div className="text-xs text-slate-400">
                      Today
                    </div>
                  </div>
                </CardTitle>
                <CardContent className="flex-1 flex items-center justify-center p-2">
                  <div className="w-full h-8 bg-purple-50 rounded flex items-center justify-center border border-purple-200">
                    <span className="text-purple-600 text-xs font-medium">HPC</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Department PT */}
            <div className="w-1/4">
              <Card className="h-full flex flex-col">
                <CardHeader className="flex-shrink-0 pb-1">
                  <div className="flex flex-row gap-1 font-bold items-center">
                    <div className="w-5 h-5 rounded-full bg-orange-200 flex items-center justify-center border">
                      <span className="text-orange-600 font-bold text-xs">P</span>
                    </div>
                    <div className="flex flex-col justify-center">
                      <span className="text-xs text-orange-800"> Dept. PT </span>
                      <span className="text-xs text-slate-500 font-medium"> Destination </span>
                    </div>
                  </div>
                </CardHeader>
                <CardTitle className="flex-shrink-0 pb-1">
                  <div className="flex flex-col text-center">
                    <div className="text-lg text-orange-600 font-bold">
                      {getDepartmentStats("PT")}
                    </div>
                    <div className="text-xs text-slate-400">
                      Today
                    </div>
                  </div>
                </CardTitle>
                <CardContent className="flex-1 flex items-center justify-center p-2">
                  <div className="w-full h-8 bg-orange-50 rounded flex items-center justify-center border border-orange-200">
                    <span className="text-orange-600 text-xs font-medium">PT</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Right Half - Trucks in Queue */}
        <div className="w-1/2 xl:h-full">
          <Card className="h-full flex flex-col">
            <CardHeader className="font-bold text-lg justify-center items-center">  
              <div className="flex flex-row gap-2 font-bold items-center">
                <div className="flex flex-col justify-center">
                  <span className="text-sm text-blue-800"> Trucks in Queue </span>
                </div>
                <div className="w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center border">
                  <Logs className="text-blue-600 font-bold w-4 h-4"/>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Card Content */}
              <div className="flex flex-row justify-center items-center space-x-12">
                <div className="lg:max-h-[20em] 2xl:max-h-80 overflow-x-auto overflow-y-auto scrollbar-hide">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs md:text-xs">Id</TableHead>
                        <TableHead className="text-xs md:text-xs">Plate/Driver</TableHead>
                        <TableHead className="text-xs md:text-xs">Supplier</TableHead>
                        <TableHead className="text-xs md:text-xs">Operation</TableHead>
                        <TableHead className="text-xs md:text-xs">Truck Status</TableHead>
                        <TableHead className="text-xs md:text-xs">Progress</TableHead>
                        <TableHead className="text-xs md:text-xs">Goods</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trucks
                        .filter(truck => truck.status === "Waiting" || truck.status === "Loading")
                        .sort((a, b) => {
                          // Prioritas pertama: Loading dulu, baru Waiting
                          if (a.status !== b.status) {
                            if (a.status === "Loading") return -1;
                            if (b.status === "Loading") return 1;
                          }
                          // Prioritas kedua: urutkan berdasarkan ID (string comparison)
                          return a.id.localeCompare(b.id);
                        })
                        .map((truck) => (
                        <TableRow key={truck.id}>
                          <TableCell> <div className="text-xs">{truck.id}</div></TableCell>
                          <TableCell>
                            <div>
                              <div className="font-semibold text-xs">{truck.plateNumber}</div>
                              <div className="font-light text-xs">{truck.driver}</div>
                            </div>
                          </TableCell>
                          <TableCell><div className="text-xs">{truck.supplier}</div></TableCell>
                          <TableCell>
                            {truck.operation === "bongkar" && (
                              <div className="rounded-full flex bg-red-100 text-red-700 text-xs font-bold px-2 py-1 w-fit mx-auto">
                                <ArrowLeft className="w-3 h-3 mr-1" />
                                Bongkar
                              </div>
                            )}
                            {truck.operation === "muat" && (
                              <div className="rounded-full flex bg-green-100 text-green-700 text-xs font-bold px-2 py-1 w-fit mx-auto">
                                <ArrowRight className="w-3 h-3 mr-1" />
                                Muat
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {truck.type === "Inbound" && (
                              <div className="rounded-full flex bg-green-50 text-green-500 text-xs font-bold px-2 py-1 w-fit mx-auto">
                                Internal
                              </div>
                            )}
                            {truck.type === "Outbound" && (
                              <div className="rounded-full flex bg-red-50 text-red-500 text-xs font-bold px-2 py-1 w-fit mx-auto">
                                External
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {truck.status === "Waiting" && (
                              <div className="rounded-full flex bg-yellow-100 text-yellow-700 font-bold text-xs px-2 py-1 w-fit mx-auto">
                                {truck.status.charAt(0).toUpperCase() + truck.status.slice(1)}
                              </div>
                            )}
                            {truck.status === "Loading" && (
                              <div className="rounded-full flex bg-blue-100 text-blue-700 font-bold text-xs px-2 py-1 w-fit mx-auto">
                                {truck.status.charAt(0).toUpperCase() + truck.status.slice(1)}
                              </div>
                            )}
                          </TableCell>
                          <TableCell><div className="text-xs">{truck.goods}</div></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card> 
        </div>
      </div>
    </div>
  );
}
