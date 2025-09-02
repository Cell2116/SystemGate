import PlaceholderPage from "./PlaceholderPage";

export default function InOutTrucks(){
  return(
    <PlaceholderPage
    title="In Out Trucks"
    description="This page will be use for seeing the Trucks from Internal or External"
    />
  )
}

// import Clock2 from "../components/dashboard/clock"
// import { Truck, TruckIcon, ArrowRight, ArrowLeft, ChartSpline, Logs } from "lucide-react";
// import { Button } from "../components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
// import { useState, useRef, useEffect, ChangeEvent } from "react";
// import { TableCell, TableBody, TableCaption, TableFooter, TableRow, TableHead, TableHeader, Table } from "@/components/ui/table";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "../components/ui/dialog";
// import { Input } from "../components/ui/input";
// import { Label } from "../components/ui/label";
// import {
//   Select,
//   SelectContent,
//   SelectGroup,
//   SelectItem,
//   SelectLabel,
//   SelectTrigger,
//   SelectValue,
// } from "../components/ui/select";
// import { useSuratJalan } from "../store/truckStore";
// interface TruckRecord {
//   id: string;
//   plateNumber: string;
//   noticket: string;
//   department: string;
//   nikdriver: string;
//   tlpdriver: string;
//   nosj: string;
//   tglsj: string;
//   driver: string;
//   supplier: string;
//   arrivalTime: string;
//   eta?: string;
//   status: "pending" | "loading" | "finished";
//   type: "internal" | "external";
//   goods: string;
//   descin: string;
//   descout: string;
//   statustruck: string;
//   estimatedFinish?: string;
//   estimatedWaitTime: number; // in minutes
//   actualWaitTime?: number; // in minutes
//   startLoadingTime?: string;
//   finishTime?: string;
//   date: string;
// }

// export default function InOutTrucks() {

//   const [isOpen, setIsOpen] = useState(false);
//   const [formStep, setFormStep] = useState(0);
//   const [operationType, setOperationType] = useState<"" | "bongkar" | "muat">("");
//   const [formData, setFormData] = useState({
//     plateNumber: "",
//     driver: "",
//     supplier: "",
//     arrivalTime: "",
//     noticket: "",
//     department: "",
//     nikdriver: "",
//     tlpdriver: "",
//     nosj: "",
//     tglsj: "",
//     descin: "",
//     descout: "",
//     statustruck: "",
//     // eta?: "",
//     // status: "pending" | "loading" | "finished",
//     type: "" as "" | "internal" | "external",
//     goods: "",
//     quantity: "",
//     unit: "",
//     date: "", 
//   });

//   // Data surat jalan dari API menggunakan truck store
//   const { data: suratJalanList, loading: suratJalanLoading, error: suratJalanError, refetch: refetchSuratJalan } = useSuratJalan('pending');

//   // State untuk mengatur mode input surat jalan
//   const [inputMode, setInputMode] = useState<"select" | "manual">("select");

//   const startCamera = async () => {
//     setShowCamera(true);
//     if (navigator.mediaDevices && videoRef.current) {
//       const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
//       videoRef.current.srcObject = stream;
//       videoRef.current.play();
//     }
//   };

//   const capturePhoto = () => {
//     if (videoRef.current && canvasRef.current) {
//       const context = canvasRef.current.getContext("2d");
//       if (context) {
//         context.drawImage(videoRef.current, 0, 0, 320, 240);
//         const imageData = canvasRef.current.toDataURL("image/png");
//         setCapturedImage(imageData);
//         const stream = videoRef.current.srcObject as MediaStream;
//         stream.getTracks().forEach(track => track.stop());
//         setShowCamera(false);
//       }
//     }
//   };

//   const [showCamera, setShowCamera] = useState(false);
//   const videoRef = useRef<HTMLVideoElement>(null);
//   const canvasRef = useRef<HTMLCanvasElement>(null);
//   const [capturedImage, setCapturedImage] = useState<string | null>(null);
//   // const timeOptions = Array.from({ length: 48 }, (_, i) => {
//   //     const hour = String(Math.floor(i / 2)).padStart(2, "0");
//   //     const minute = i % 2 === 0 ? "00" : "30";
//   //     return `${hour}:${minute}`;
//   //   });
//   useEffect(() => {
//     if (showCamera && videoRef.current) {
//       navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
//         .then((stream) => {
//           if (videoRef.current) {
//             videoRef.current.srcObject = stream;
//             videoRef.current.play();
//           }
//         })
//         .catch((err) => {
//           alert("Tidak bisa mengakses kamera: " + err.message);
//           setShowCamera(false);
//         });
//     }
//     // Matikan kamera saat kotak kamera ditutup
//     return () => {
//       if (videoRef.current && videoRef.current.srcObject) {
//         const stream = videoRef.current.srcObject as MediaStream;
//         stream.getTracks().forEach(track => track.stop());
//         videoRef.current.srcObject = null;
//       }
//     };
//   }, [showCamera]);

//   // Dummy
//   const [trucks, setTrucks] = useState<TruckRecord[]>([
//     {
//       id: "1",
//       plateNumber: "B-1234-ABC",
//       noticket: "TKT001",
//       department: "HPC",
//       nikdriver: "123456789",
//       tlpdriver: "081234567890",
//       nosj: "SJ001",
//       tglsj: "2025-09-01",
//       driver: "John Doe",
//       supplier: "PT A",
//       arrivalTime: "08:30",
//       eta: "08:00",
//       status: "finished",
//       type: "internal",
//       goods: "Raw Materials",
//       descin: "Bahan baku untuk produksi",
//       descout: "Barang telah dibongkar",
//       statustruck: "kosong", // mobil sudah kosong setelah bongkar
//       estimatedWaitTime: 30,
//       actualWaitTime: 25,
//       startLoadingTime: "08:55",
//       finishTime: "10:30",
//       date: new Date().toISOString().split('T')[0],
//     },
//     {
//       id: "2",
//       plateNumber: "B-5678-DEF",
//       noticket: "TKT002",
//       department: "PT",
//       nikdriver: "987654321",
//       tlpdriver: "081987654321",
//       nosj: "SJ002",
//       tglsj: "2025-09-01",
//       driver: "Jane Smith",
//       supplier: "PT B",
//       arrivalTime: "10:15",
//       eta: "10:30",
//       status: "loading",
//       type: "internal",
//       goods: "Steel Components",
//       descin: "Komponen baja untuk assembly",
//       descout: "Sedang dalam proses muat",
//       statustruck: "isi", // mobil sedang dimuat
//       estimatedWaitTime: 45,
//       actualWaitTime: 65,
//       startLoadingTime: "11:20",
//       estimatedFinish: "14:30",
//       date: new Date().toISOString().split('T')[0],
//     },
//     {
//       id: "3",
//       plateNumber: "B-9012-GHI",
//       noticket: "TKT003",
//       department: "HPC",
//       nikdriver: "456789123",
//       tlpdriver: "081456789123",
//       nosj: "SJ003",
//       tglsj: "2025-09-01",
//       driver: "Mike Johnson",
//       supplier: "PT C",
//       arrivalTime: "09:45",
//       status: "finished",
//       type: "external",
//       goods: "Finished Products",
//       descin: "Produk jadi untuk pengiriman",
//       descout: "Barang telah dimuat",
//       statustruck: "isi", // mobil berisi barang
//       estimatedWaitTime: 25,
//       actualWaitTime: 30,
//       startLoadingTime: "10:15",
//       finishTime: "12:00",
//       date: new Date().toISOString().split('T')[0],
//     },
//     {
//       id: "4",
//       plateNumber: "B-3456-JKL",
//       noticket: "TKT004",
//       department: "PT",
//       nikdriver: "789123456",
//       tlpdriver: "081789123456",
//       nosj: "SJ004",
//       tglsj: "2025-09-01",
//       driver: "Sarah Wilson",
//       supplier: "PT D",
//       arrivalTime: "11:20",
//       status: "pending",
//       type: "external",
//       goods: "Electronics",
//       descin: "Komponen elektronik",
//       descout: "Menunggu proses bongkar",
//       statustruck: "isi", // mobil datang dengan barang
//       estimatedWaitTime: 40,
//       actualWaitTime: 125, // Delayed truck
//       estimatedFinish: "15:00",
//       date: new Date().toISOString().split('T')[0],
//     },
//     {
//       id: "5",
//       plateNumber: "B-7890-MNO",
//       noticket: "TKT005",
//       department: "HPC",
//       nikdriver: "321654987",
//       tlpdriver: "081321654987",
//       nosj: "SJ005",
//       tglsj: "2025-09-01",
//       driver: "David Brown",
//       supplier: "PT E",
//       arrivalTime: "13:30",
//       eta: "14:00",
//       status: "loading",
//       type: "internal",
//       goods: "Paper Rolls",
//       descin: "Gulungan kertas untuk produksi",
//       descout: "Sedang proses muat",
//       statustruck: "kosong", // mobil datang kosong untuk dimuat
//       estimatedWaitTime: 35,
//       actualWaitTime: 20,
//       startLoadingTime: "13:50",
//       estimatedFinish: "16:30",
//       date: new Date().toISOString().split('T')[0],
//     },
//   ]);
  
//   const handleAddTruck = () => {
//     const maxId = trucks.length > 0 ? Math.max(...trucks.map(t => Number(t.id))) : 0;
//     const nextId = (maxId + 1).toString();

//     const newTruck: TruckRecord = {
//       ...formData,
//       id: nextId,
//       status: "pending",
//       estimatedWaitTime: 0,
//       date: new Date().toISOString().split('T')[0],
//       type: formData.type === "internal" || formData.type === "external" ? formData.type : "internal",
//     };
//       setTrucks([...trucks, newTruck]);
//       setIsOpen(false); // close dialog
//       setFormStep(0); // reset to first step
//       setOperationType(""); // reset operation type
//       setInputMode("select"); // reset input mode
//       setFormData({
//         plateNumber: "",
//         driver: "",
//         supplier: "",
//         arrivalTime: "",
//         noticket: "",
//         department: "",
//         nikdriver: "",
//         tlpdriver: "",
//         nosj: "",
//         tglsj: "",
//         descin: "",
//         descout: "",
//         statustruck: "",
//         type: "",
//         goods: "",
//         quantity: "",
//         unit: "",
//         date: "", 
//       });
//   }
  
//   return (
//     <div className="space-y-6 p-3">
//       {/* Header */}
//       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
//         <div>
//           <h1 className="text-xl font-bold text-gray-900 flex flex-row">Trucks Record
//             <Truck className="pl-2 justify-center items-center h-7 w-9 text-blue-800"/>
//           </h1>
//           <p className="mt-1 text-sm text-gray-500">
//             See all the trucks operations today.
//           </p>
//         </div>
//         <div className="mt-4 sm:mt-0">
//           <Clock2/>
//         </div>
//       </div>

//       {/* Button */}
//       <div>
//         <div className="justify-center items-center flex sm:flex-col lg:flex-row gap-4">
//           <Dialog open = {isOpen} onOpenChange={setIsOpen}>
//             <DialogTrigger asChild>
//               <Button className="bg-blue-600 font-bold h-[2.7em] w-[11em] hover:bg-blue-300 text-[0.8em]"> <TruckIcon className="font-bold h-6 w-6"/>Add New Truck</Button>
//             </DialogTrigger>

//             <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-card/95 border-border/50">
//               <DialogHeader className="space-y-3">
//                 <DialogTitle className="text-2xl font-bold text-center">
//                   {formStep === 0 ? "Choose Operation" : 
//                     operationType === "bongkar" ? "Form Bongkar Muatan" : 
//                     operationType === "muat" ? "Form Muat Muatan" : "Form Truck Baru"}
//                 </DialogTitle>
//                 <DialogDescription className="text-center text-muted-foreground">
//                   {formStep === 0 ? "Pilih operasi yang akan dilakukan oleh truck" : 
//                     "Isi semua informasi yang diperlukan untuk truck."}
//                 </DialogDescription>
//               </DialogHeader>

//             <form className="space-y-4 py-4">
//               {formStep === 0 && (                
//               <div className="space-y-6">
//                 <div className="grid grid-cols-2 gap-6">
//                   <Button
//                     type="button"
//                     onClick={() => {
//                       setOperationType("bongkar");
//                       setFormStep(1);
//                     }}
//                     className={`h-24 flex flex-col items-center justify-center space-y-2 ${
//                       operationType === "bongkar" 
//                         ? "bg-red-500 hover:bg-red-700" 
//                         : "bg-red-500 hover:bg-red-700"
//                     }`}
//                   >
//                     <ArrowLeft className="w-9 h-9" />
//                     <span className="text-lg font-semibold">Bongkar</span>
//                     <span className="text-xs opacity-80">Unloading Operation</span>
//                   </Button>
                  
//                   <Button
//                     type="button"
//                     onClick={() => {
//                       setOperationType("muat");
//                       setFormStep(1);
//                     }}
//                     className={`h-24 flex flex-col items-center justify-center space-y-2 ${
//                       operationType === "muat" 
//                         ? "bg-green-500 hover:bg-green-700" 
//                         : "bg-green-500 hover:bg-green-700"
//                     }`}
//                   >
//                     <ArrowRight className="w-8 h-8" />
//                     <span className="text-lg font-semibold">Muat</span>
//                     <span className="text-xs opacity-80">Loading Operation</span>
//                   </Button>
//                 </div>
//               </div>
//               )}
              
//               {/* Form Unloading - Step 1 */}
//               {formStep === 1 && operationType === "bongkar" && (                
//               <div className="space-y-4">               
//                 <div className="grid grid-cols-2 gap-4">
                  
//                   <div>
//                     <Label htmlFor="driver" className="text-sm font-semibold">
//                       Pengemudi /
//                       <span className="italic opacity-50 text-xs"> Driver</span>
//                     </Label>
//                     <Input
//                       id="driver"
//                       placeholder="Nama Pengemudi" 
//                       value={formData.driver}
//                       onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({...formData, driver: e.target.value})}
//                       className="h-9 border-gray-300 focus:border-blue-500 focus:outline-none"
//                       required
//                       />
//                   </div>
//                   <div>
//                     <Label htmlFor="plateNumber" className="text-sm font-semibold">
//                       Plat Nomor /
//                       <span className="italic opacity-50 text-xs"> License Plate</span>
//                     </Label>
//                     <Input
//                       id="plateNumber"
//                       placeholder="ABC-123"
//                       value={formData.plateNumber}
//                       onChange={(e) => setFormData({...formData, plateNumber: e.target.value})}
//                       className="h-9 border-gray-300 focus:border-blue-500 focus:outline-none"
//                       required
//                       />
//                   </div>
//                 </div>
//                 <div className="grid grid-cols-2 gap-4">
//                   <div>
//                     <Label htmlFor="nikdriver" className="text-sm font-semibold">
//                       NIK /
//                       <span className="italic opacity-50 text-xs"> National ID Number</span>
//                     </Label>
//                     <Input
//                       id="nikdriver"
//                       placeholder="NIK Pengemudi" 
//                       value={formData.nikdriver}
//                       onChange={(e) => setFormData({...formData, nikdriver: e.target.value})}
//                       className="h-9 border-gray-300 focus:border-blue-500 focus:outline-none"
//                       required
//                       />
//                   </div>
//                   <div>
//                     <Label htmlFor="tlpdriver" className="text-sm font-semibold">
//                       No Telfon /
//                       <span className="italic opacity-50 text-xs"> Phone Number</span>
//                     </Label>
//                     <Input
//                       id="tlpdriver"
//                       placeholder="+62"
//                       value={formData.tlpdriver}
//                       onChange={(e) => setFormData({...formData, tlpdriver: e.target.value})}
//                       className="h-9 border-gray-300 focus:border-blue-500 focus:outline-none"
//                       required
//                       />
//                   </div>
//                 </div>
                
//                 <div className="grid grid-cols-2 gap-4">
//                   <div>
//                     <Label htmlFor="supplier" className="text-sm font-semibold">
//                       Perusahaan Asal /
//                       <span className="italic opacity-50 text-xs"> Origin Company</span>
//                     </Label>
//                     <Input
//                       id="supplier"
//                       placeholder="Nama Perusahaan"
//                       value={formData.supplier}
//                       onChange={(e) => setFormData({...formData, supplier: e.target.value})}
//                       className="h-9 border-gray-300 focus:border-blue-500 focus:outline-none"
//                       required
//                     />
//                   </div>
//                   <div>
//                     <Label htmlFor="arrivalTime" className="text-sm font-semibold">
//                       Jam Kedatangan /
//                       <span className="italic opacity-50 text-xs"> Arrival Time</span>
//                     </Label>
//                     <Input
//                       id="arrivalTime"
//                       type="time"
//                       value={formData.arrivalTime}
//                       onChange={(e) => setFormData({...formData, arrivalTime: e.target.value})}
//                       className="h-9 border-gray-300 focus:border-blue-500 focus:outline-none"
//                       required
//                       />
//                   </div>
//                 </div>
//               </div>
//               )}
              
//               {/* Form Unloading - Step 2 */}
//               {formStep === 2 && operationType === "bongkar" && (                
//               <div className="space-y-4">
//                 <div className="grid grid-cols-2 gap-4">
//                   <div>
//                     <Label htmlFor="goods" className="text-sm font-semibold">
//                       Nama Barang /
//                       <span className="italic opacity-50 text-xs"> Name of Goods</span>
//                     </Label>
//                     <Input
//                       id="goods"
//                       placeholder="Jenis barang yang dibongkar"
//                       value={formData.goods}
//                       onChange={(e) => setFormData({...formData, goods: e.target.value})}
//                       className="h-9 border-gray-300 focus:border-blue-500 focus:outline-none"
//                       required
//                     />
//                   </div>
//                   <div>
//                     <Label htmlFor="descin" className="text-sm font-semibold">
//                       Deskripsi Barang /
//                       <span className="italic opacity-50 text-xs"> Goods Description</span>
//                     </Label>
//                     <Input
//                       id="descin"
//                       placeholder="Deskripsi barang yang dibongkar"
//                       value={formData.descin}
//                       onChange={(e) => setFormData({...formData, descin: e.target.value})}
//                       className="h-9 border-gray-300 focus:border-blue-500 focus:outline-none"
//                       required
//                     />
//                   </div>
//                   {/* <div>
//                     <Label htmlFor="quantity" className="text-sm font-semibold">
//                       Jumlah /
//                       <span className="italic opacity-50 text-xs"> Quantity</span>
//                     </Label>
//                     <div className="flex gap-2">
//                       <Input
//                         id="quantity"
//                         type="number"
//                         placeholder="0"
//                         value={formData.quantity}
//                         onChange={(e) => setFormData({...formData, quantity: e.target.value})}
//                         className="h-9 border-gray-300 focus:border-blue-500 focus:outline-none flex-1"
//                         required
//                       />
//                       <Input
//                         id="unit"
//                         placeholder="Unit"
//                         value={formData.unit}
//                         onChange={(e) => setFormData({...formData, unit: e.target.value})}
//                         className="h-9 border-gray-300 focus:border-blue-500 focus:outline-none w-20"
//                         required
//                       />
//                     </div>
//                   </div> */}
//                 </div>
                
//                 <div className="grid grid-cols-2 gap-4">
//                   <div>
//                     <Label htmlFor="noticket" className="text-sm font-semibold">
//                       No. Tiket /
//                       <span className="italic opacity-50 text-xs"> Ticket Number</span>
//                     </Label>
//                     <Input
//                       id="noticket"
//                       placeholder="TKT001"
//                       value={formData.noticket}
//                       onChange={(e) => setFormData({...formData, noticket: e.target.value})}
//                       className="h-9 border-gray-300 focus:border-blue-500 focus:outline-none"
//                       required
//                     />
//                   </div>
//                   <div>
//                     <Label htmlFor="department" className="text-sm font-semibold">
//                       Departemen Tujuan /
//                       <span className="italic opacity-50 text-xs"> Destination Department</span>
//                     </Label>
//                     <select
//                       id="department"
//                       value={formData.department}
//                       onChange={(e) => setFormData({...formData, department: e.target.value})}
//                       className="h-9 border border-gray-300 rounded-md px-3 py-2 bg-background text-gray-500 text-sm focus:border-blue-500 focus:outline-none"
//                       required
//                     >
//                       <option value="">Pilih Departemen</option>
//                       <option value="HPC">HPC</option>
//                       <option value="PT">PT</option>
//                     </select>
//                   </div>
//                 </div>
//                 <div className="grid grid-cols-2 gap-4">
//                   <div className="flex flex-col">
//                     <Label htmlFor="statustruck" className="text-sm font-semibold">
//                       Status Truck /
//                       <span className="italic opacity-50 text-xs"> Truck Status</span>
//                     </Label>
//                     <select
//                       id="statustruck"
//                       value={formData.statustruck}
//                       onChange={(e) => setFormData({...formData, statustruck: e.target.value})}
//                       className="h-9 border border-gray-300 rounded-md px-3 py-2 bg-background text-gray-500 text-sm focus:border-blue-500 focus:outline-none"
//                       required
//                     >
//                       <option value="">Pilih Status</option>
//                       <option value="isi">Isi (Ada Barang)</option>
//                       <option value="kosong">Kosong</option>
//                     </select>
//                   </div>
//                   <div>
//                   <Label htmlFor="date" className="text-sm font-semibold">
//                     Tanggal /
//                     <span className="italic opacity-50 text-xs"> Date</span>
//                   </Label>
//                   <Input
//                     id="date"
//                     type="date"
//                     value={formData.date}
//                     onChange={(e) => setFormData({...formData, date: e.target.value})}
//                     className="h-9 border-gray-300 focus:border-blue-500 focus:outline-none"
//                     required
//                   />
//                 </div>
//                 </div>
                
//                 <div className="grid grid-cols-2 gap-4">
//                   <Button
//                     type="button"
//                     className="bg-blue-600 font-bold h-[2.7em] w-[7em] hover:bg-blue-300 text-[0.8em] mt-2"
//                     onClick={startCamera}
//                     >
//                     Ambil Foto
//                   </Button>
//                   {capturedImage && (
//                   <img src={capturedImage} alt="Captured" className="rounded border w-32" />
//                     )}
//                   </div>
//                   {showCamera && (
//                     <div className="flex flex-col items-center space-y-2">
//                       <video ref={videoRef} width={320} height={240} autoPlay className="rounded border" />
//                       <Button type="button" onClick={capturePhoto}>Capture</Button>
//                       <canvas ref={canvasRef} width={320} height={240} style={{ display: "none" }} />
//                     </div>
//                   )}
//               </div>
//               )}
//               {/* Step 3 Unloading */}
//               {formStep === 3 && operationType === "bongkar" && (
//                 <div className="space-y-4">
//                   <div className="flex items-center justify-between">
//                     <p className="text-xs font-bold text-slate-600">
//                       Pilih nomor <span className="text-blue-700">Surat Jalan</span> atau mengisi secara manual.
//                     </p>
//                     <div className="flex gap-2">
//                       <Button
//                         type="button"
//                         size="sm"
//                         variant={inputMode === "select" ? "default" : "outline"}
//                         onClick={() => setInputMode("select")}
//                         className="text-xs"
//                       >
//                         Pilih dari Data
//                       </Button>
//                       <Button
//                         type="button"
//                         size="sm"
//                         variant={inputMode === "manual" ? "default" : "outline"}
//                         onClick={() => setInputMode("manual")}
//                         className="text-xs"
//                       >
//                         Input Manual
//                       </Button>
//                     </div>
//                   </div>

//                   {inputMode === "select" ? (
//                     <div className="space-y-4">
//                       <div>
//                         <Label htmlFor="suratJalanSelect" className="text-sm font-semibold">
//                           Pilih Surat Jalan /
//                           <span className="italic opacity-50 text-xs"> Select Delivery Note</span>
//                         </Label>
//                         <Select
//                           value={formData.nosj}
//                           onValueChange={(value) => {
//                             const selectedSJ = suratJalanList.find(sj => sj.noSuratJalan === value);
//                             if (selectedSJ) {
//                               setFormData({
//                                 ...formData, 
//                                 nosj: selectedSJ.noSuratJalan,
//                                 tglsj: selectedSJ.tanggal
//                               });
//                             }
//                           }}
//                           disabled={suratJalanLoading}
//                         >
//                           <SelectTrigger className="h-15 border-gray-300 focus:border-blue-500">
//                             <SelectValue placeholder={
//                               suratJalanLoading ? "Loading..." :
//                               suratJalanError ? "Error loading data" :
//                               suratJalanList.length === 0 ? "Tidak ada surat jalan tersedia" :
//                               "Pilih nomor surat jalan..."
//                             } />
//                           </SelectTrigger>
//                           <SelectContent>
//                             <SelectGroup>
//                               <SelectLabel>
//                                 Daftar Surat Jalan 
//                                 {suratJalanError && (
//                                   <button 
//                                     onClick={refetchSuratJalan}
//                                     className="ml-2 text-xs text-blue-500 hover:text-blue-700"
//                                   >
//                                     (Retry)
//                                   </button>
//                                 )}
//                               </SelectLabel>
//                               {suratJalanLoading ? (
//                                 <SelectItem value="loading" disabled>
//                                   <div className="flex items-center">
//                                     <span className="text-gray-500">Loading data...</span>
//                                   </div>
//                                 </SelectItem>
//                               ) : suratJalanError ? (
//                                 <SelectItem value="error" disabled>
//                                   <div className="flex flex-col">
//                                     <span className="text-red-500">Error: {suratJalanError}</span>
//                                     <span className="text-xs text-gray-500">Click retry di atas</span>
//                                   </div>
//                                 </SelectItem>
//                               ) : suratJalanList.length === 0 ? (
//                                 <SelectItem value="empty" disabled>
//                                   <span className="text-gray-500">Tidak ada surat jalan tersedia</span>
//                                 </SelectItem>
//                               ) : (
//                                 suratJalanList.map((sj) => (
//                                   <SelectItem key={sj.id} value={sj.noSuratJalan}>
//                                     <div className="flex flex-col">
//                                       <span className="font-medium">{sj.noSuratJalan}</span>
//                                       <span className="text-xs text-gray-500">{sj.tanggal}</span>
//                                       {sj.supplier && (
//                                         <span className="text-xs text-blue-600">{sj.supplier}</span>
//                                       )}
//                                     </div>
//                                   </SelectItem>
//                                 ))
//                               )}
//                             </SelectGroup>
//                           </SelectContent>
//                         </Select>
//                       </div>
                      
//                       {formData.nosj && (
//                         <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-md">
//                           <div>
//                             <Label className="text-sm font-semibold text-gray-600">
//                               No. Surat Jalan Terpilih
//                             </Label>
//                             <p className="text-sm font-medium">{formData.nosj}</p>
//                           </div>
//                           <div>
//                             <Label className="text-sm font-semibold text-gray-600">
//                               Tanggal Surat Jalan
//                             </Label>
//                             <p className="text-sm font-medium">{formData.tglsj}</p>
//                           </div>
//                         </div>
//                       )}
//                     </div>
//                   ) : (
//                     <div className="grid grid-cols-2 gap-4">
//                       <div>
//                         <Label htmlFor="nosj" className="text-sm font-semibold">
//                           No. Surat Jalan /
//                           <span className="italic opacity-50 text-xs"> Delivery Note Number</span>
//                         </Label>
//                         <Input
//                           id="nosj"
//                           placeholder="SJ001"
//                           value={formData.nosj}
//                           onChange={(e) => setFormData({...formData, nosj: e.target.value})}
//                           className="h-9 border-gray-300 focus:border-blue-500 focus:outline-none"
//                           required
//                         />
//                       </div>
//                       <div>
//                         <Label htmlFor="tglsj" className="text-sm font-semibold">
//                           Tanggal Surat Jalan /
//                           <span className="italic opacity-50 text-xs"> Delivery Note Date</span>
//                         </Label>
//                         <Input
//                           id="tglsj"
//                           type="date"
//                           value={formData.tglsj}
//                           onChange={(e) => setFormData({...formData, tglsj: e.target.value})}
//                           className="h-9 border-gray-300 focus:border-blue-500 focus:outline-none"
//                           required
//                           />
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               )}
              
//               {/* Form Loading */}
//               {formStep === 1 && operationType === "muat" && (                
//               <div className="space-y-4">
//                 <div className="grid grid-cols-2 gap-4">
//                   <div>
//                     <Label htmlFor="driver" className="text-sm font-semibold">
//                       Pengemudi /
//                       <span className="italic opacity-50 text-xs"> Driver</span>
//                     </Label>
//                     <Input
//                       id="driver"
//                       placeholder="Nama Pengemudi"
//                       value={formData.driver}
//                       onChange={(e) => setFormData({...formData, driver: e.target.value})}
//                       className="h-9 border-gray-300 focus:border-blue-500 focus:outline-none"
//                       required
//                       />
//                   </div>
//                   <div>
//                     <Label htmlFor="plateNumber" className="text-sm font-semibold">
//                       Plat Nomor /
//                       <span className="italic opacity-50 text-xs"> License Plate</span>
//                     </Label>
//                     <Input
//                       id="plateNumber"
//                       placeholder="ABC-123"
//                       value={formData.plateNumber}
//                       onChange={(e) => setFormData({...formData, plateNumber: e.target.value})}
//                       className="h-9 border-gray-300 focus:border-blue-500 focus:outline-none"
//                       required
//                       />
//                   </div>
//                 </div>
                
//                 <div className="grid grid-cols-2 gap-4">
//                   <div>
//                     <Label htmlFor="supplier" className="text-sm font-semibold">
//                       Perusahaan Tujuan /
//                       <span className="italic opacity-50 text-xs"> Destination Company</span>
//                     </Label>
//                     <Input
//                       id="supplier"
//                       placeholder="Nama Perusahaan"
//                       value={formData.supplier}
//                       onChange={(e) => setFormData({...formData, supplier: e.target.value})}
//                       className="h-9 border-gray-300 focus:border-blue-500 focus:outline-none"
//                       required
//                     />
//                   </div>
//                   <div>
//                     <Label htmlFor="arrivalTime" className="text-sm font-semibold">
//                       Jam Kedatangan /
//                       <span className="italic opacity-50 text-xs"> Arrival Time</span>
//                     </Label>
//                     <Input
//                       id="arrivalTime"
//                       type="time"
//                       value={formData.arrivalTime}
//                       onChange={(e) => setFormData({...formData, arrivalTime: e.target.value})}
//                       className="h-9 border-gray-300 focus:border-blue-500 focus:outline-none"
//                       required
//                       />
//                   </div>
//                 </div>
                
//                 <div className="grid grid-cols-2 gap-4">
//                   <div className="flex flex-col">
//                     <Label htmlFor="type" className="text-sm font-semibold">
//                       Asal Truk /
//                       <span className="italic opacity-50 text-xs"> Truck Origin</span>
//                     </Label>
//                     <select
//                       id="type"
//                       title="Asal Truck"
//                       value={formData.type}
//                       onChange={(e) => setFormData({...formData, type: e.target.value as "internal" | "external" | ""})}
//                       className="h-9 border border-gray-300 rounded-md px-3 py-2 bg-background text-gray-500 text-sm focus:border-blue-500 focus:outline-none"
//                       required
//                     >
//                       <option value="">Pilih Asal</option>
//                       <option value="internal">Dalam (Alkindo)</option>
//                       <option value="external">Luar (Kustomer)</option>
//                     </select>
//                   </div>
//                   <div>
//                     <Label htmlFor="goods" className="text-sm font-semibold">
//                       Jenis Barang /
//                       <span className="italic opacity-50 text-xs"> Goods Type</span>
//                     </Label>
//                     <Input
//                       id="goods"
//                       placeholder="Jenis barang yang dimuat"
//                       value={formData.goods}
//                       onChange={(e) => setFormData({...formData, goods: e.target.value})}
//                       className="h-9 border-gray-300 focus:border-blue-500 focus:outline-none"
//                       required
//                     />
//                   </div>
//                 </div>
                
//                 <div className="grid grid-cols-2 gap-4">
//                   <div>
//                     <Label htmlFor="quantity" className="text-sm font-semibold">
//                       Jumlah /
//                       <span className="italic opacity-50 text-xs"> Quantity</span>
//                     </Label>
//                     <div className="flex gap-2">
//                       <Input
//                         id="quantity"
//                         type="number"
//                         placeholder="0"
//                         value={formData.quantity}
//                         onChange={(e) => setFormData({...formData, quantity: e.target.value})}
//                         className="h-9 border-gray-300 focus:border-blue-500 focus:outline-none flex-1"
//                         required
//                       />
//                       <Input
//                         id="unit"
//                         placeholder="Unit"
//                         value={formData.unit}
//                         onChange={(e) => setFormData({...formData, unit: e.target.value})}
//                         className="h-9 border-gray-300 focus:border-blue-500 focus:outline-none w-20"
//                         required
//                       />
//                     </div>
//                   </div>
//                   <div>
//                     <Label htmlFor="date" className="text-sm font-semibold">
//                       Tanggal /
//                       <span className="italic opacity-50 text-xs"> Date</span>
//                     </Label>
//                     <Input
//                       id="date"
//                       type="date"
//                       value={formData.date}
//                       onChange={(e) => setFormData({...formData, date: e.target.value})}
//                       className="h-9 border-gray-300 focus:border-blue-500 focus:outline-none"
//                       required
//                     />
//                   </div>
//                 </div>
                
//                 <div className="grid grid-cols-2 gap-4">
//                   <Button
//                     type="button"
//                     className="bg-blue-600 font-bold h-[2.7em] w-[7em] hover:bg-blue-300 text-[0.8em] mt-2"
//                     onClick={startCamera}
//                     >
//                     Ambil Foto
//                   </Button>
//                   {capturedImage && (
//                   <img src={capturedImage} alt="Captured" className="rounded border w-32" />
//                     )}
//                   </div>
//                   {showCamera && (
//                     <div className="flex flex-col items-center space-y-2">
//                       <video ref={videoRef} width={320} height={240} autoPlay className="rounded border" />
//                       <Button type="button" onClick={capturePhoto}>Capture</Button>
//                       <canvas ref={canvasRef} width={320} height={240} style={{ display: "none" }} />
//                     </div>
//                   )}
//               </div>
//               )}
              
//               <div className="flex flex-row justify-between gap-4 pt-4">
//                 {formStep > 0 && (
//                   <Button 
//                     type="button" 
//                     onClick={() => {
//                       if (formStep === 1) {
//                         setFormStep(0);
//                         setOperationType("");
//                       } else if (formStep === 2) {
//                         setFormStep(1);
//                       } else if(formStep === 3){
//                         setFormStep(2);
//                         setInputMode("select"); // reset input mode when going back from step 3
//                       }
//                     }}
//                     className="bg-gray-500 hover:bg-gray-600 text-white"
//                   >
//                     <ArrowLeft className="w-4 h-4 mr-2" />
//                     Kembali
//                   </Button>
//                 )}
                
//                 {/* Next button untuk form bongkar step 1 */}
//                 {formStep === 1 && operationType === "bongkar" && (
//                   <Button 
//                     type="button" 
//                     onClick={() => setFormStep(2)}
//                     className="bg-red-600 hover:bg-red-700 text-white ml-auto"
//                   >
//                     Selanjutnya
//                     <ArrowRight className="w-4 h-4 ml-2" />
//                   </Button>
//                 )}
//                 {formStep === 2 && operationType === "bongkar" && (
//                   <Button 
//                     type="button" 
//                     onClick={() => setFormStep(3)}
//                     className="bg-red-600 hover:bg-red-700 text-white ml-auto"
//                   >
//                     Selanjutnya
//                     <ArrowRight className="w-4 h-4 ml-2" />
//                   </Button>
//                 )}
                
//                 {/* Submit button untuk form bongkar step 2 */}
//                 {formStep === 3 && operationType === "bongkar" && (
//                   <Button 
//                     type="button" 
//                     onClick={handleAddTruck}
//                     className="bg-red-600 hover:bg-red-700 text-white ml-auto"
//                   >
//                     Simpan Bongkar
//                   </Button>
//                 )}
                
//                 {/* Submit button untuk form muat (langsung step 1) */}
//                 {formStep === 1 && operationType === "muat" && (
//                   <Button 
//                     type="button" 
//                     onClick={handleAddTruck}
//                     className="bg-green-600 hover:bg-green-700 text-white ml-auto"
//                   >
//                     Simpan Muat
//                   </Button>
//                 )}
//               </div>
//             </form>
//             </DialogContent>
//           </Dialog>
//           <Button className="bg-white-600 text-black border font-bold h-[2.7em] w-[11em] hover:bg-slate-300 text-[0.8em]"> <ChartSpline className="font-bold h-6 w-6 text-green-500"/>View Analytics</Button>
//         </div>
//       </div>

//       {/* Main Content */}
//       <div className="flex sm:flex-row lg:flex-row gap-4 md:h-[64vh] xl:h-[67vh] w-full xl:pr-9 2xl:pr-2">
//         {/* Left Half - 6 Cards Total */}
//         <div className="w-1/2 flex flex-col gap-4">
//           {/* Top Row: Loading and Unloading Cards (2 cards) */}
//           <div className="flex flex-row gap-4 h-1/2">
//             {/* Loading Trucks Card */}
//             <div className="w-1/2">
//               <Card className="h-full flex flex-col">
//                 <CardHeader className="font-bold text-lg justify-center items-left">
//                   <div className="flex flex-row gap-2 font-bold items-center">
//                     <div className="w-7 h-7 rounded-full bg-green-200 flex items-center justify-center border">
//                       <ArrowRight className="text-green-600 font-bold w-4 h-4"/>
//                     </div>
//                     <div className="flex flex-col justify-center">
//                       <span className="text-sm text-green-800"> Loading Trucks </span>
//                       <span className="text-xs text-slate-500 font-medium"> Operations Trucks </span>
//                     </div>
//                   </div>
//                 </CardHeader>
//                 <CardTitle>
//                   <div className=" flex flex-col text-center">
//                     <div className="text-[1.5em] text-green-600 font-bold">
//                       5
//                     </div>
//                     <div className="text-sm text-slate-400">
//                       Trucks Today
//                     </div>
//                   </div>
//                 </CardTitle>
//                 <CardContent>
//                   {/* Card Content */}
//                   <div className="flex flex-row justify-center items-center mt-3 space-x-2">
//                     <Card className="bg-yellow-100 w-[4vw] h-[6vh] flex justify-center items-center">
//                       <div className="flex flex-col text-center">
//                         <span className="text-yellow-600 text-xs font-bold pb-1">0</span>
//                         <span className="text-yellow-600 text-xs pb-1">Pending</span>
//                       </div>
//                     </Card>
//                     <Card className="bg-blue-100 w-[4vw] h-[6vh] flex justify-center items-center">
//                       <div className="flex flex-col text-center">
//                         <span className="text-blue-600 text-xs font-bold pb-1">4</span>
//                         <span className="text-blue-600 text-xs pb-1">Loading</span>
//                       </div>
//                     </Card>
//                     <Card className="bg-green-100 w-[4vw] h-[6vh] flex justify-center items-center">
//                       <div className="flex flex-col text-center">
//                         <span className="text-green-600 text-xs font-bold pb-1">1</span>
//                         <span className="text-green-600 text-xs pb-1">Finished</span>
//                       </div>
//                     </Card>
//                   </div>
//                 </CardContent>
//               </Card>  
//             </div>

//             {/* Unloading Trucks Card */}
//             <div className="w-1/2">
//               <Card className="h-full flex flex-col">
//                 <CardHeader className="font-bold text-lg justify-center items-left">  
//                   <div className="flex flex-row gap-2 font-bold items-center">
//                     <div className="w-7 h-7 rounded-full bg-red-200 flex items-center justify-center border">
//                       <ArrowLeft className="text-red-600 font-bold w-4 h-4"/>
//                     </div>
//                     <div className="flex flex-col justify-center">
//                       <span className="text-sm text-red-800"> Unloading Trucks </span>
//                       <span className="text-xs text-slate-500 font-medium"> Operations Trucks </span>
//                     </div>
//                   </div>
//                 </CardHeader>
//                 <CardTitle>
//                   <div className=" flex flex-col text-center pa-3">
//                     <div className="text-[1.5em] text-red-600 font-bold">
//                       7
//                     </div>
//                     <div className="text-sm text-slate-400">
//                       Trucks Today
//                     </div>
//                   </div>
//                 </CardTitle>
//                 <CardContent>
//                   {/* Card Content */}
//                   <div className="flex justify-center items-center mt-3 space-x-2">
//                     <Card className="bg-yellow-100 w-[4vw] h-[6vh] flex justify-center items-center">
//                       <div className="flex flex-col text-center">
//                         <span className="text-yellow-600 text-xs font-bold pb-1">2</span>
//                         <span className="text-yellow-600 text-xs pb-1">Pending</span>
//                       </div>
//                     </Card>
//                     <Card className="bg-blue-100 w-[4vw] h-[6vh] flex justify-center items-center">
//                       <div className="flex flex-col text-center">
//                         <span className="text-blue-600 text-xs font-bold pb-1">3</span>
//                         <span className="text-blue-600 text-xs pb-1">Loading</span>
//                       </div>
//                     </Card>
//                     <Card className="bg-green-100 w-[4vw] h-[6vh] flex justify-center items-center">
//                       <div className="flex flex-col text-center">
//                         <span className="text-green-600 text-xs font-bold pb-1">2</span>
//                         <span className="text-green-600 text-xs pb-1">Finished</span>
//                       </div>
//                     </Card>
//                   </div>
//                 </CardContent>
//               </Card>  
//             </div>
//           </div>

//           {/* Bottom Row: 4 Cards - Internal, External, HPC, PT */}
//           <div className="flex flex-row gap-2 h-1/2">
//             {/* Internal Trucks Card */}
//             <div className="w-1/4">
//               <Card className="h-full flex flex-col">
//                 <CardHeader className="flex-shrink-0 pb-1">
//                   <div className="flex flex-row gap-1 font-bold items-center">
//                     <div className="w-5 h-5 rounded-full bg-green-200 flex items-center justify-center border">
//                       <TruckIcon className="text-green-600 font-bold w-3 h-3"/>
//                     </div>
//                     <div className="flex flex-col justify-center">
//                       <span className="text-xs text-green-800"> Internal</span>
//                       <span className="text-xs text-slate-500 font-medium"> Alkindo's </span>
//                     </div>
//                   </div>
//                 </CardHeader>
//                 <CardTitle className="flex-shrink-0 pb-1">
//                   <div className="flex flex-col text-center">
//                     <div className="text-lg text-green-600 font-bold">
//                       7
//                     </div>
//                     <div className="text-xs text-slate-400">
//                       Today
//                     </div>
//                   </div>
//                 </CardTitle>
//                 <CardContent className="flex-1 flex items-center justify-center p-2">
//                   <div className="w-full h-8 bg-green-50 rounded flex items-center justify-center border border-green-200">
//                     <span className="text-green-600 text-xs font-medium">Internal</span>
//                   </div>
//                 </CardContent>
//               </Card>
//             </div>

//             {/* External Trucks Card */}
//             <div className="w-1/4">
//               <Card className="h-full flex flex-col">
//                 <CardHeader className="flex-shrink-0 pb-1">
//                   <div className="flex flex-row gap-1 font-bold items-center">
//                     <div className="w-5 h-5 rounded-full bg-blue-200 flex items-center justify-center border">
//                       <TruckIcon className="text-blue-600 font-bold w-3 h-3"/>
//                     </div>
//                     <div className="flex flex-col justify-center">
//                       <span className="text-xs text-blue-800"> External </span>
//                       <span className="text-xs text-slate-500 font-medium"> Vendor's </span>
//                     </div>
//                   </div>
//                 </CardHeader>
//                 <CardTitle className="flex-shrink-0 pb-1">
//                   <div className="flex flex-col text-center">
//                     <div className="text-lg text-blue-600 font-bold">
//                       5
//                     </div>
//                     <div className="text-xs text-slate-400">
//                       Today
//                     </div>
//                   </div>
//                 </CardTitle>
//                 <CardContent className="flex-1 flex items-center justify-center p-2">
//                   <div className="w-full h-8 bg-blue-50 rounded flex items-center justify-center border border-blue-200">
//                     <span className="text-blue-600 text-xs font-medium">External</span>
//                   </div>
//                 </CardContent>
//               </Card>
//             </div>

//             {/* Department HPC */}
//             <div className="w-1/4">
//               <Card className="h-full flex flex-col">
//                 <CardHeader className="flex-shrink-0 pb-1">
//                   <div className="flex flex-row gap-1 font-bold items-center">
//                     <div className="w-5 h-5 rounded-full bg-purple-200 flex items-center justify-center border">
//                       <span className="text-purple-600 font-bold text-xs">H</span>
//                     </div>
//                     <div className="flex flex-col justify-center">
//                       <span className="text-xs text-purple-800"> Dept. HPC </span>
//                       <span className="text-xs text-slate-500 font-medium"> Destination </span>
//                     </div>
//                   </div>
//                 </CardHeader>
//                 <CardTitle className="flex-shrink-0 pb-1">
//                   <div className="flex flex-col text-center">
//                     <div className="text-lg text-purple-600 font-bold">
//                       3
//                     </div>
//                     <div className="text-xs text-slate-400">
//                       Today
//                     </div>
//                   </div>
//                 </CardTitle>
//                 <CardContent className="flex-1 flex items-center justify-center p-2">
//                   <div className="w-full h-8 bg-purple-50 rounded flex items-center justify-center border border-purple-200">
//                     <span className="text-purple-600 text-xs font-medium">HPC</span>
//                   </div>
//                 </CardContent>
//               </Card>
//             </div>

//             {/* Department PT */}
//             <div className="w-1/4">
//               <Card className="h-full flex flex-col">
//                 <CardHeader className="flex-shrink-0 pb-1">
//                   <div className="flex flex-row gap-1 font-bold items-center">
//                     <div className="w-5 h-5 rounded-full bg-orange-200 flex items-center justify-center border">
//                       <span className="text-orange-600 font-bold text-xs">P</span>
//                     </div>
//                     <div className="flex flex-col justify-center">
//                       <span className="text-xs text-orange-800"> Dept. PT </span>
//                       <span className="text-xs text-slate-500 font-medium"> Destination </span>
//                     </div>
//                   </div>
//                 </CardHeader>
//                 <CardTitle className="flex-shrink-0 pb-1">
//                   <div className="flex flex-col text-center">
//                     <div className="text-lg text-orange-600 font-bold">
//                       4
//                     </div>
//                     <div className="text-xs text-slate-400">
//                       Today
//                     </div>
//                   </div>
//                 </CardTitle>
//                 <CardContent className="flex-1 flex items-center justify-center p-2">
//                   <div className="w-full h-8 bg-orange-50 rounded flex items-center justify-center border border-orange-200">
//                     <span className="text-orange-600 text-xs font-medium">PT</span>
//                   </div>
//                 </CardContent>
//               </Card>
//             </div>
//           </div>
//         </div>

//         {/* Right Half - Trucks in Queue */}
//         <div className="w-1/2 xl:h-full">
//           <Card className="h-full flex flex-col">
//             <CardHeader className="font-bold text-lg justify-center items-center">  
//               <div className="flex flex-row gap-2 font-bold items-center">
//                 <div className="flex flex-col justify-center">
//                   <span className="text-sm text-blue-800"> Trucks in Queue </span>
//                 </div>
//                 <div className="w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center border">
//                   <Logs className="text-blue-600 font-bold w-4 h-4"/>
//                 </div>
//               </div>
//             </CardHeader>
//             <CardContent>
//               {/* Card Content */}
//               <div className="flex flex-row justify-center items-center space-x-12">
//                 <div className="lg:max-h-[20em] 2xl:max-h-80 overflow-x-auto overflow-y-auto scrollbar-hide">
//                   <Table>
//                     <TableHeader>
//                       <TableRow>
//                         <TableHead className="text-xs md:text-xs">Id</TableHead>
//                         <TableHead className="text-xs md:text-xs">Plate/Driver</TableHead>
//                         <TableHead className="text-xs md:text-xs">Supplier</TableHead>
//                         <TableHead className="text-xs md:text-xs">Truck Status</TableHead>
//                         <TableHead className="text-xs md:text-xs">Progress</TableHead>
//                         <TableHead className="text-xs md:text-xs">Goods</TableHead>
//                       </TableRow>
//                     </TableHeader>
//                     <TableBody>
//                       {trucks.filter(truck => truck.status === "pending" || truck.status === "loading").map((truck) => (
//                         <TableRow key={truck.id}>
//                           <TableCell> <div className="text-xs">{truck.id}</div></TableCell>
//                           <TableCell>
//                             <div>
//                               <div className="font-semibold text-xs">{truck.plateNumber}</div>
//                               <div className="font-light text-xs">{truck.driver}</div>
//                             </div>
//                           </TableCell>
//                           <TableCell><div className="text-xs">{truck.supplier}</div></TableCell>
//                           <TableCell>
//                             {truck.type === "internal" && (
//                               <div className="rounded-full flex bg-green-100 text-green-700 text-xs font-bold px-2 py-1 w-fit mx-auto">
//                                 {truck.type.charAt(0).toUpperCase() + truck.type.slice(1)}
//                               </div>
//                             )}
//                             {truck.type === "external" && (
//                               <div className="rounded-full flex bg-red-100 text-red-700 text-xs font-bold px-2 py-1 w-fit mx-auto">
//                                 {truck.type.charAt(0).toUpperCase() + truck.type.slice(1)}
//                               </div>
//                             )}
//                           </TableCell>
//                           <TableCell>
//                             {truck.status === "pending" && (
//                               <div className="rounded-full flex bg-yellow-100 text-yellow-700 font-bold text-xs px-2 py-1 w-fit mx-auto">
//                                 {truck.status.charAt(0).toUpperCase() + truck.status.slice(1)}
//                               </div>
//                             )}
//                             {truck.status === "loading" && (
//                               <div className="rounded-full flex bg-blue-100 text-blue-700 font-bold text-xs px-2 py-1 w-fit mx-auto">
//                                 {truck.status.charAt(0).toUpperCase() + truck.status.slice(1)}
//                               </div>
//                             )}
//                           </TableCell>
//                           <TableCell><div className="text-xs">{truck.goods}</div></TableCell>
//                         </TableRow>
//                       ))}
//                     </TableBody>
//                   </Table>
//                 </div>
//               </div>
//             </CardContent>
//           </Card> 
//         </div>
//       </div>
//     </div>
//   );
// }
