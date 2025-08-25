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
// import { useState, useRef, useEffect } from "react";
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
// interface TruckRecord {
//   id: string;
//   plateNumber: string;
//   driver: string;
//   customer: string;
//   arrivalTime: string;
//   eta?: string;
//   status: "pending" | "loading" | "finished";
//   type: "internal" | "external";
//   goods: string;
//   quantity: number;
//   unit: string;
//   gateNumber: number;
//   dockNumber?: number;
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
//   const [formData, setFormData] = useState({
//     plateNumber: "",
//     driver: "",
//     customer: "",
//     arrivalTime: "",
//     // eta?: "",
//     // status: "pending" | "loading" | "finished",
//     type: "" as "" | "internal" | "external",
//     goods: "",
//     quantity: "",
//     unit: "",
//     date: "", 
//   });

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
//   const timeOptions = Array.from({ length: 48 }, (_, i) => {
//       const hour = String(Math.floor(i / 2)).padStart(2, "0");
//       const minute = i % 2 === 0 ? "00" : "30";
//       return `${hour}:${minute}`;
//     });
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
//       driver: "John Doe",
//       customer: "PT A",
//       arrivalTime: "08:30",
//       eta: "08:00",
//       status: "finished",
//       type: "internal",
//       goods: "Raw Materials",
//       quantity: 25,
//       unit: "pallets",
//       gateNumber: 1,
//       dockNumber: 3,
//       estimatedWaitTime: 30,
//       actualWaitTime: 25,
//       startLoadingTime: "08:55",
//       finishTime: "10:30",
//       date: new Date().toISOString().split('T')[0],
//     },
//     {
//       id: "2",
//       plateNumber: "B-5678-DEF",
//       driver: "Jane Smith",
//       customer: "PT B",
//       arrivalTime: "10:15",
//       eta: "10:30",
//       status: "loading",
//       type: "internal",
//       goods: "Steel Components",
//       quantity: 15,
//       unit: "rolls",
//       gateNumber: 2,
//       dockNumber: 1,
//       estimatedWaitTime: 45,
//       actualWaitTime: 65,
//       startLoadingTime: "11:20",
//       estimatedFinish: "14:30",
//       date: new Date().toISOString().split('T')[0],
//     },
//     {
//       id: "3",
//       plateNumber: "B-9012-GHI",
//       driver: "Mike Johnson",
//       customer: "PT C",
//       arrivalTime: "09:45",
//       status: "finished",
//       type: "external",
//       goods: "Finished Products",
//       quantity: 20,
//       unit: "boxes",
//       gateNumber: 3,
//       dockNumber: 5,
//       estimatedWaitTime: 25,
//       actualWaitTime: 30,
//       startLoadingTime: "10:15",
//       finishTime: "12:00",
//       date: new Date().toISOString().split('T')[0],
//     },
//     {
//       id: "4",
//       plateNumber: "B-3456-JKL",
//       driver: "Sarah Wilson",
//       customer: "PT D",
//       arrivalTime: "11:20",
//       status: "pending",
//       type: "external",
//       goods: "Electronics",
//       quantity: 8,
//       unit: "pallets",
//       gateNumber: 4,
//       estimatedWaitTime: 40,
//       actualWaitTime: 125, // Delayed truck
//       estimatedFinish: "15:00",
//       date: new Date().toISOString().split('T')[0],
//     },
//     {
//       id: "5",
//       plateNumber: "B-7890-MNO",
//       driver: "David Brown",
//       customer: "PT E",
//       arrivalTime: "13:30",
//       eta: "14:00",
//       status: "loading",
//       type: "internal",
//       goods: "Paper Rolls",
//       quantity: 12,
//       unit: "rolls",
//       gateNumber: 1,
//       dockNumber: 2,
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
//       gateNumber: 1,
//       date: new Date().toISOString().split('T')[0],
//       type: formData.type === "internal" || formData.type === "external" ? formData.type : "internal", // <-- ensure correct type
//       quantity: Number(formData.quantity), // ensure quantity is a number
//     };
//       setTrucks([...trucks, newTruck]);
//       setIsOpen(false); // close dialog
//       setFormData({
//         plateNumber: "",
//         driver: "",
//         customer: "",
//         arrivalTime: "",
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
//           <h1 className="text-xl font-bold text-gray-900 flex flex-row">Internal / External Trucks
//             <Truck className="pl-2 justify-center items-center h-7 w-9 text-blue-800"/>
//           </h1>
//           <p className="mt-1 text-sm text-gray-500">
//             See which trucks have entered or exited the site today.
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
//                   Form of New Truck
//                 </DialogTitle>
//                 <DialogDescription className="text-center text-muted-foreground">
//                   Please fill in all required information for the truck.
//                 </DialogDescription>
//               </DialogHeader>
//                 {/* const [formData, setFormData] = useState({ 
//                   // plateNumber: "",
//                   // driver: "",
//                   // customer: "",
//                   // arrivalTime: "",
//                   eta?: "",
//                   status: "pending" | "loading" | "finished",
//                   // type: "" as "" | "internal" | "external",
//                   // goods: "",
//                   // quantity: "",
//                   // unit: "",
//                   // date: "", 
//                 // });*/}

//             <form className="space-y-4 py-4">
//               {formStep === 0 && (                
//               <div>
//                 <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <Label htmlFor="driver" className="text-sm font-semibold">
//                     Pengemudi /
//                     <span className="italic opacity-50 text-xs"> Driver</span>
//                   </Label>
//                   <Input
//                     id="driver"
//                     placeholder="Nama"
//                     value={formData.driver}
//                     className="h-10 border-border/50 focuse:border-primary"
//                     required
//                     />
//                 </div>
//                 <div>
//                   <Label htmlFor="plateNumber" className="text-sm font-semibold">
//                     Plat Nomor /
//                     <span className="italic opacity-50 text-xs"> License Plate</span>
//                   </Label>
//                   <Input
//                     id="plateNumber"
//                     placeholder="ABC-123"
//                     value={formData.plateNumber}
//                     className="h-10 border-border/50 focuse:border-primary"
//                     required
//                     />
//                 </div>
//               </div>
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <Label htmlFor="company" className="text-sm font-semibold">
//                     Perusahaan /
//                     <span className="italic opacity-50 text-xs"> Company</span>
//                   </Label>
//                   <Input
//                     id="customer"
//                     placeholder="Nama Perusahaan"
//                     value={formData.customer}
//                     className="h-10 border-border/50 focuse:border-primary"
//                     required
//                   />
//                 </div>
//                 <div>
//                   <Label htmlFor="date" className="text-sm font-semibold">
//                     Jam Kedatangan /
//                     <span className="italic opacity-50 text-xs"> Arrival Time</span>
//                   </Label>
//                 <Input
//                   id="arrivalTime"
//                   type="time"
//                   value={formData.arrivalTime}
//                   className="h-10 border-border/50 focuse:border-primary"
//                   required
//                   />
//                 </div>
//               </div>
//               <div className="grid grid-cols-2 gap-4">
//                 <div className="flex flex-col">
//                   <Label htmlFor="type" className="text-sm font-semibold">
//                     Asal Truk /
//                     <span className="italic opacity-50 text-xs"> Type Truck</span>
//                   </Label>
//                   <select
//                     id="type"
//                     title="Asal Truck"
//                     value={formData.type}
//                     className="h-10 border border-border/50 rounded-md px-3 py-2 bg-background text-gray-500 text-sm focus:border-primary"
//                     required
//                   >
//                     <option value="">Pilih Asal</option>
//                     <option value="internal">Dalam (Alkindo)</option>
//                     <option value="external">Luar (Kustomer)</option>
//                   </select>
//                 </div>
//                 <div>
//                   <Label htmlFor="date" className="text-sm font-semibold">
//                     Tanggal /
//                     <span className="italic opacity-50 text-xs"> Date</span>
//                   </Label>
//                   <Input
//                     id="date"
//                     type="date"
//                     value={formData.date}
//                     className="h-10 border-border/50 focuse:border-primary opacity-50"
//                     required
//                   />
//                 </div>
//               </div>
//               <div className="grid grid-cols-2 gap-4">
//                 <Button
//                   type="button"
//                   className="bg-blue-600 font-bold h-[2.7em] w-[7em] hover:bg-blue-300 text-[0.8em] mt-2"
//                   onClick={startCamera}
//                   >
//                   Ambil Foto
//                 </Button>
//                 {capturedImage && (
//                 <img src={capturedImage} alt="Captured" className="rounded border w-32" />
//                   )}
//                 </div>
//                 {showCamera && (
//                   <div className="flex flex-col items-center space-y-2">
//                     <video ref={videoRef} width={320} height={240} autoPlay className="rounded border" />
//                     <Button type="button" onClick={capturePhoto}>Capture</Button>
//                     <canvas ref={canvasRef} width={320} height={240} style={{ display: "none" }} />
//                   </div>
//                 )}
//               </div>
//               )}
//               <div className="flex flex-row justify-between gap-4 pt-4">
//                 {formStep > 0 && (
//                   <div>
//                     <div className="grid grid-cols-2 gap-4">
//                       <div className="flex flex-col">
//                         <Label htmlFor="type" className="text-sm font-semibold">
//                           Asal Truk /
//                           <span className="italic opacity-50 text-xs"> Type Truck</span>
//                         </Label>
//                         <select
//                           id="type"
//                           title="Asal Truck"
//                           value={formData.type}
//                           className="h-10 border border-border/50 rounded-md px-3 py-2 bg-background text-gray-500 text-sm focus:border-primary"
//                           required
//                         >
//                           <option value="">Pilih Asal</option>
//                           <option value="internal">Dalam (Alkindo)</option>
//                           <option value="external">Luar (Kustomer)</option>
//                         </select>
//                       </div>
//                       <div>
//                         <Label htmlFor="date" className="text-sm font-semibold">
//                           Tanggal /
//                           <span className="italic opacity-50 text-xs"> Date</span>
//                         </Label>
//                         <Input
//                           id="date"
//                           type="date"
//                           value={formData.date}
//                           className="h-10 border-border/50 focuse:border-primary opacity-50 mb-7"
//                           required
//                         />
//                       </div>
//                     </div>
//                     <Button type="button" onClick={() => setFormStep(formStep - 1)}>
//                       Previous
//                     </Button>
//                   </div>
//                 )}
//                 {formStep < 1 ? (
//                   <Button type="button" onClick={() => setFormStep(formStep + 1)}>
//                     Next
//                   </Button>
//                 ) : (
//                   <Button type="button" onClick={handleAddTruck}>
//                     Submit
//                   </Button>
//                 )}
//               </div>
//             </form>
//             </DialogContent>
//             <Button className="bg-white-600 text-black border font-bold h-[2.7em] w-[11em] hover:bg-slate-300 text-[0.8em]"> <ChartSpline className="font-bold h-6 w-6 text-green-500"/>View Analytics</Button>
//           </Dialog>
//         </div>
//       </div>

//       {/* Main Content */}
//       <div className="flex sm:flex-row lg:flex-row gap-4 h-[60vh] w-full xl:pr-9 2xl:pr-2">
//         {/* Card Internal Truck */}
//         <div className="w-1/4 h-full">
//           <Card className="h-full flex flex-col">
//             <CardHeader className="font-bold text-lg justify-center items-left">
//               <div className="flex flex-row gap-2 font-bold items-center">
//                 <div className="w-7 h-7 rounded-full bg-green-200 flex items-center justify-center border">
//                   <ArrowRight className="text-green-600 font-bold w-4 h-4"/>
//                 </div>
//                 <div className="flex flex-col justify-center">
//                   <span className="text-lg text-green-800"> Internal </span>
//                   <span className="text-sm text-slate-500 font-medium"> Operations Trucks </span>
//                 </div>
//               </div>
//             </CardHeader>
//             <CardTitle>
//               <div className=" flex flex-col text-center">
//                 <div className="text-[2em] text-green-600 font-bold">
//                   5
//                 </div>
//                 <div className="text-lg text-slate-400">
//                   Trucks Today
//                 </div>
//               </div>
//             </CardTitle>
//             <CardContent>
//               {/* Card Content */}
//               <div className="flex flex-row justify-center items-center mt-6 space-x-4">
//                 <Card className="bg-yellow-100 w-[7vw] h-[10vh] flex justify-center items-center">
//                   <div className="flex flex-col text-center">
//                     <span className="text-yellow-600 text-xl font-bold pb-1">0</span>
//                     <span className="text-yellow-600 text-sm pb-1">Pending</span>
//                   </div>
//                 </Card>
//                 <Card className="bg-blue-100 w-[7vw] h-[10vh] flex justify-center items-center">
//                   <div className="flex flex-col text-center">
//                     <span className="text-blue-600 text-xl font-bold pb-1">4</span>
//                     <span className="text-blue-600 text-sm pb-1">Loading</span>
//                   </div>
//                 </Card>
//                 <Card className="bg-green-100 w-[7vw] h-[10vh] flex justify-center items-center">
//                   <div className="flex flex-col text-center">
//                     <span className="text-green-600 text-xl font-bold pb-1">1</span>
//                     <span className="text-green-600 text-sm pb-1">Finished</span>
//                   </div>
//                 </Card>
//               </div>
//             </CardContent>
//           </Card>  
//         </div>

//         {/* Card External Truck */}
//         <div className="w-1/4 h-full">
//           <Card className="h-full flex flex-col">
//             <CardHeader className="font-bold text-lg justify-center items-left">  
//               <div className="flex flex-row gap-2 font-bold items-center">
//                 <div className="w-7 h-7 rounded-full bg-red-200 flex items-center justify-center border">
//                   <ArrowLeft className="text-red-600 font-bold w-4 h-4"/>
//                 </div>
//                 <div className="flex flex-col justify-center">
//                   <span className="text-lg text-red-800"> External </span>
//                   <span className="text-sm text-slate-500 font-medium"> Operations Trucks </span>
//                 </div>
//               </div>
//             </CardHeader>
//             <CardTitle>
//               <div className=" flex flex-col text-center pa-3">
//                 <div className="text-[2em] text-red-600 font-bold">
//                   7
//                 </div>
//                 <div className="text-lg text-slate-400">
//                   Trucks Today
//                 </div>
//               </div>
//             </CardTitle>
//             <CardContent>
//               {/* Card Content */}
//               <div className="flex justify-center items-center mt-6 space-x-4">
//                 <Card className="bg-yellow-100 w-[7vw] h-[10vh] flex justify-center items-center">
//                   <div className="flex flex-col text-center">
//                     <span className="text-yellow-600 text-xl font-bold pb-1">2</span>
//                     <span className="text-yellow-600 text-sm pb-1">Pending</span>
//                   </div>
//                 </Card>
//                 <Card className="bg-blue-100 w-[7vw] h-[10vh] flex justify-center items-center">
//                   <div className="flex flex-col text-center">
//                     <span className="text-blue-600 text-xl font-bold pb-1">3</span>
//                     <span className="text-blue-600 text-sm pb-1">Loading</span>
//                   </div>
//                 </Card>
//                 <Card className="bg-green-100 w-[7vw] h-[10vh] flex justify-center items-center">
//                   <div className="flex flex-col text-center">
//                     <span className="text-green-600 text-xl font-bold pb-1">2</span>
//                     <span className="text-green-600 text-sm pb-1">Finished</span>
//                   </div>
//                 </Card>
//               </div>
//             </CardContent>
//           </Card>  
//         </div>

//         {/* Row List Queue Truck */}
//         <div className="w-2/4 h-full">
//           <Card className="h-full flex flex-col">
//             <CardHeader className="font-bold text-lg justify-center items-center">  
//               <div className="flex flex-row gap-2 font-bold items-center">
//                 <div className="flex flex-col justify-center">
//                   <span className="text-lg text-blue-800"> Trucks in Queue </span>
//                   <span className="text-sm text-slate-500 font-medium"></span>
//                 </div>
//                 <div className="w-7 h-7 rounded-full bg-blue-200 flex items-center justify-center border">
//                   <Logs className="text-blue-600 font-bold w-5 h-5"/>
//                 </div>
//               </div>
//             </CardHeader>
//             <CardContent>
//               {/* Card Content */}
//               <div className="flex flex-row justify-center items-center space-x-12">
//                 <div className="lg:max-h-[17em] 2xl:max-h-80 overflow-x-auto overflow-y-auto scrollbar-hide">
//                   <Table>
//                     <TableHeader>
//                       <TableRow>
//                         <TableHead>Id</TableHead>
//                         <TableHead>Plate/Driver</TableHead>
//                         <TableHead>Customer</TableHead>
//                         <TableHead>Truck Status</TableHead>
//                         <TableHead>Progress</TableHead>
//                         <TableHead>Goods</TableHead>
//                         <TableHead>Gate/Dock</TableHead>
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
//                           <TableCell><div className="text-xs">{truck.customer}</div></TableCell>
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
//                           <TableCell><div className="text-xs">{truck.goods} ({truck.quantity} {truck.unit})</div></TableCell>
//                           <TableCell>
//                             <div>
//                               <div className="font-semibold text-xs">Gate {truck.gateNumber}</div>
//                               <div className="font-light text-xs">{truck.dockNumber ? `/ Dock ${truck.dockNumber}` : ""}</div>
//                             </div></TableCell>
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