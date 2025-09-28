//TODO Make it Responsive for Mobile


import { useState, ChangeEvent, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "../components/ui/dialog";
import { TruckIcon, ArrowLeft, ArrowRight, ChartSpline, Truck, Logs } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableHeader, TableRow, TableCell, TableHead } from "../components/ui/table";
import Clock2 from "../components/dashboard/clock";

// Import hooks and types
import { useFormSteps } from "../hooks/trucks/useFormSteps";
import { useCameraCapture } from "../hooks/useCameraCapture";
import { useTrucksWithFetch } from "../store/truckStore";
import { useFormValidation } from "../hooks/trucks/useFormValidation";
import { useTicketGeneration } from "../hooks/trucks/useTicketGeneration";
import { useTruckSubmission } from "../hooks/trucks/useTruckSubmission";
import { TruckFormData, OperationType } from "../types/truck.types";
import { INITIAL_FORM_DATA } from "../constants/truck.constants";

// Import komponen form yang sudah direfactor
import { 
  BongkarStep1, 
  BongkarStep2, 
  BongkarStep3, 
  MuatStep1, 
  MuatStep2, 
  TicketPreview,
  OperationSelector 
} from "../components/trucks/forms/steps";

import { AnalyticsDialog } from "../components/trucks/analytics/AnalyticsDialog";

export default function InOutTrucks() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [formData, setFormData] = useState<TruckFormData>(INITIAL_FORM_DATA);
  const [inputMode, setInputMode] = useState<"select" | "manual">("select");
  
  // Use form steps hook
  const {
    formStep,
    operationType,
    validationError,
    setFormStep,
    setOperationType,
    setValidationError,
    canGoPrevious,
    canGoNext,
    isLastStep,
    goToPreviousStep,
    goToNextStep,
  } = useFormSteps();

  // Set default value for type field when operation type changes to "muat"
  useEffect(() => {
    if (operationType === "muat" && formData.type === "") {
      setFormData(prev => ({ ...prev, type: "internal" }));
    }
  }, [operationType, formData.type]);

  // Camera hook
  const {
    showCamera,
    cameraTarget,
    capturedImages,
    startCamera,
    stopCamera,
    handlePhotoCapture,
    clearAllImages,
  } = useCameraCapture();

  // Data hooks
  const {
    trucks: allTrucks,
    loading: trucksLoading,
    error: trucksError,
    refetch: refetchTrucks,
    createTruck,
    updateTruckAPI,
  } = useTrucksWithFetch({});

  // Validation hook
  const { validationStep, getValidationMessage, validateAllSteps } = useFormValidation({
    formData,
    operationType,
    capturedImages
  });

  // Ticket generation hook
  const { previewTicketNumber, generateActualTicketNumber, handlePrintTicket } = useTicketGeneration({
    formData,
    operationType,
    formStep,
    trucks: allTrucks || []
  });

  // Submission hook
  const { submitTruck, isSubmitting } = useTruckSubmission({
    createTruck: async (truck) => {
      await createTruck(truck);
    },
    refetchTrucks,
    onSuccess: () => {
      setIsOpen(false);
      setFormStep(0);
      setOperationType("");
      setInputMode("select");
      setValidationError("");
      setFormData(INITIAL_FORM_DATA);
      clearAllImages();
    }
  });

  const handleInputChange = (field: string, value: string) => {
    if (field === "reasonType" && value === "Sick") {
      setFormData((prev) => ({ ...prev, [field]: value, returnTime: "" }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleNextStep = () => {
    // Validate current step before proceeding
    const currentStepValid = validationStep(formStep, operationType);
    if (!currentStepValid) {
      const errorMessage = getValidationMessage(formStep, operationType);
      setValidationError(errorMessage);
      return;
    }
    
    // Clear validation error and proceed
    setValidationError("");
    goToNextStep();
  };

  const trucks = allTrucks || [];

  // Submit functions
  const handleSubmitBongkar = async () => {
    if (!validateAllSteps) {
      setValidationError("Masih ada data yang belum lengkap. Mohon periksa kembali semua form.");
      return;
    }
    const ticketNumber = generateActualTicketNumber();
    await submitTruck(formData, operationType, capturedImages, ticketNumber);
  };

  const handleSubmitMuat = async () => {
    if (!validateAllSteps) {
      setValidationError("Masih ada data yang belum lengkap. Mohon periksa kembali semua form.");
      return;
    }
    const ticketNumber = generateActualTicketNumber();
    await submitTruck(formData, operationType, capturedImages, ticketNumber);
  };

  // Stats functions
  const getOperationStats = (operation: "bongkar" | "muat") => {
    const operationTrucks = trucks.filter((truck) => truck.operation === operation);
    const pending = operationTrucks.filter((truck) => truck.status === "Waiting").length;
    const loading = operationTrucks.filter((truck) => truck.status === "Loading").length;
    const finished = operationTrucks.filter((truck) => truck.status === "Finished").length;
    const total = operationTrucks.length;
    return { pending, loading, finished, total };
  };

  const muatStats = getOperationStats("muat");
  const bongkarStats = getOperationStats("bongkar");
  
  const getDepartmentStats = (department: string) => {
    return trucks.filter((truck) => truck.department === department).length;
  };

  const getTypeStats = (type: string) => {
    return trucks.filter((truck) => truck.type === type).length;
  };

  return (
    <div className="space-y-6 p-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex flex-row">
            Trucks Record
            <Truck className="pl-2 justify-center items-center h-7 w-9 text-blue-800" />
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            See all the trucks operations today.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Clock2 />
        </div>
      </div>

      {/* Button */}
      <div>
        <div className="justify-center items-center flex sm:flex-col lg:flex-row gap-4">
          <Dialog
            open={isOpen}
            onOpenChange={(open) => {
              setIsOpen(open);
              if (!open) {
                // Reset everything when closing dialog
                setFormStep(0);
                setOperationType("");
                setInputMode("select");
                setValidationError("");
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="bg-blue-600 font-bold h-[2.7em] w-[11em] hover:bg-blue-300 text-[0.8em]">
                {" "}
                <TruckIcon className="font-bold h-6 w-6" />
                Add New Truck
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-card/95 border-border/50">
              <DialogHeader className="space-y-3">
                <DialogTitle className="text-2xl font-bold text-center">
                  {formStep === 0
                    ? "Choose Operation"
                    : operationType === "bongkar"
                      ? "Form Bongkar Barang"
                      : operationType === "muat"
                        ? "Form Muat Barang"
                        : "Form Truck Baru"}
                </DialogTitle>
                <DialogDescription className="text-center text-muted-foreground">
                  {formStep === 0
                    ? "Pilih operasi yang akan dilakukan oleh truck"
                    : formStep === 1
                      ? "Bagian ini bisa diisi oleh Pengemudi/Driver"
                      : formStep === 2
                        ? "Bagian ini harus diisi oleh Security"
                        : ""}
                </DialogDescription>
              </DialogHeader>

              <form className="space-y-4 py-4">
                {/* Step 0: Operation Selection */}
                {formStep === 0 && (
                  <OperationSelector 
                    onSelectOperation={(operation) => {
                      setOperationType(operation);
                      setFormStep(1);
                    }}
                  />
                )}

                {/* Bongkar Forms */}
                {formStep === 1 && operationType === "bongkar" && (
                  <BongkarStep1
                    formData={formData}
                    onFieldChange={handleInputChange}
                    capturedImages={capturedImages}
                    showCamera={showCamera}
                    cameraTarget={cameraTarget}
                    onStartCamera={startCamera}
                    onStopCamera={stopCamera}
                    onPhotoCapture={handlePhotoCapture}
                    validationError={validationError}
                  />
                )}

                {formStep === 2 && operationType === "bongkar" && (
                  <BongkarStep2
                    formData={formData}
                    onFieldChange={handleInputChange}
                    capturedImages={capturedImages}
                    showCamera={showCamera}
                    cameraTarget={cameraTarget}
                    onStartCamera={startCamera}
                    onStopCamera={stopCamera}
                    onPhotoCapture={handlePhotoCapture}
                    validationError={validationError}
                  />
                )}

                {formStep === 3 && operationType === "bongkar" && (
                  <BongkarStep3
                    formData={formData}
                    onFieldChange={handleInputChange}
                    validationError={validationError}
                  />
                )}

                {formStep === 4 && operationType === "bongkar" && (
                  <TicketPreview
                    formData={formData}
                    previewTicketNumber={previewTicketNumber}
                    onPrintTicket={handlePrintTicket}
                    operationType="bongkar"
                  />
                )}

                {/* Muat Forms */}
                {formStep === 1 && operationType === "muat" && (
                  <MuatStep1
                    formData={formData}
                    onFieldChange={handleInputChange}
                    capturedImages={capturedImages}
                    showCamera={showCamera}
                    cameraTarget={cameraTarget}
                    onStartCamera={startCamera}
                    onStopCamera={stopCamera}
                    onPhotoCapture={handlePhotoCapture}
                    validationError={validationError}
                  />
                )}

                {formStep === 2 && operationType === "muat" && (
                  <MuatStep2
                    formData={formData}
                    onFieldChange={handleInputChange}
                    capturedImages={capturedImages}
                    showCamera={showCamera}
                    cameraTarget={cameraTarget}
                    onStartCamera={startCamera}
                    onStopCamera={stopCamera}
                    onPhotoCapture={handlePhotoCapture}
                    validationError={validationError}
                  />
                )}

                {formStep === 3 && operationType === "muat" && (
                  <TicketPreview
                    formData={formData}
                    previewTicketNumber={previewTicketNumber}
                    onPrintTicket={handlePrintTicket}
                    operationType="muat"
                  />
                )}

                {/* Navigation Buttons */}
                <div className="flex flex-row justify-between gap-4 pt-4">
                  {canGoPrevious && (
                    <Button
                      type="button"
                      onClick={goToPreviousStep}
                      className="bg-gray-500 hover:bg-gray-600 text-white"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Kembali
                    </Button>
                  )}

                  {canGoNext && !isLastStep && (
                    <Button
                      type="button"
                      onClick={handleNextStep}
                      className={
                        operationType === "bongkar"
                          ? "bg-red-600 hover:bg-red-700 text-white ml-auto"
                          : "bg-green-600 hover:bg-green-700 text-white ml-auto"
                      }
                    >
                      Selanjutnya
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}

                  {isLastStep && (
                    <Button
                      type="button"
                      onClick={operationType === "bongkar" ? handleSubmitBongkar : handleSubmitMuat}
                      className={
                        operationType === "bongkar"
                          ? "bg-red-600 hover:bg-red-700 text-white ml-auto"
                          : "bg-green-600 hover:bg-green-700 text-white ml-auto"
                      }
                    >
                      {operationType === "bongkar" ? "Simpan Bongkar" : "Simpan Muat"}
                    </Button>
                  )}
                </div>
              </form>
            </DialogContent>
          </Dialog>
          
          <Button
            className="bg-white-600 text-black border font-bold h-[2.7em] w-[11em] hover:bg-slate-300 text-[0.8em]"
            onClick={() => setIsAnalyticsOpen(true)}
          >
            <ChartSpline className="font-bold h-6 w-6 text-green-500" />
            View Analytics
          </Button>
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
                      <ArrowRight className="text-green-600 font-bold w-4 h-4" />
                    </div>
                    <div className="flex flex-col justify-center">
                      <span className="text-sm text-green-800">
                        {" "}
                        Loading Trucks / {" "} 
                        <span className="italic opacity-70">
                          Muat {" "}
                        </span>
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        {" "}
                        Operations Trucks{" "}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardTitle>
                  <div className=" flex flex-col text-center">
                    <div className="text-[1.5em] text-green-600 font-bold">
                      {muatStats.total}
                    </div>
                    <div className="text-sm text-slate-400">Trucks Today</div>
                  </div>
                </CardTitle>
                <CardContent>
                  {/* Card Content */}
                  <div className="flex flex-row justify-center items-center mt-3 space-x-2">
                    <Card className="bg-yellow-100 w-[4vw] h-[6vh] flex justify-center items-center">
                      <div className="flex flex-col text-center">
                        <span className="text-yellow-600 text-xs font-bold pb-1">
                          {muatStats.pending}
                        </span>
                        <span className="text-yellow-600 text-xs pb-1">
                          Pending
                        </span>
                      </div>
                    </Card>
                    <Card className="bg-blue-100 w-[4vw] h-[6vh] flex justify-center items-center">
                      <div className="flex flex-col text-center">
                        <span className="text-blue-600 text-xs font-bold pb-1">
                          {muatStats.loading}
                        </span>
                        <span className="text-blue-600 text-xs pb-1">
                          Loading
                        </span>
                      </div>
                    </Card>
                    <Card className="bg-green-100 w-[4vw] h-[6vh] flex justify-center items-center">
                      <div className="flex flex-col text-center">
                        <span className="text-green-600 text-xs font-bold pb-1">
                          {muatStats.finished}
                        </span>
                        <span className="text-green-600 text-xs pb-1">
                          Finished
                        </span>
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
                      <ArrowLeft className="text-red-600 font-bold w-4 h-4" />
                    </div>
                    <div className="flex flex-col justify-center">
                      <span className="text-sm text-red-800">
                        {" "}
                        Unloading Trucks / {" "}
                        <span className="italic opacity-70">
                          Bongkar {" "}
                        </span>
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        {" "}
                        Operations Trucks{" "}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardTitle>
                  <div className=" flex flex-col text-center pa-3">
                    <div className="text-[1.5em] text-red-600 font-bold">
                      {bongkarStats.total}
                    </div>
                    <div className="text-sm text-slate-400">Trucks Today</div>
                  </div>
                </CardTitle>
                <CardContent>
                  {/* Card Content */}
                  <div className="flex justify-center items-center mt-3 space-x-2">
                    <Card className="bg-yellow-100 w-[4vw] h-[6vh] flex justify-center items-center">
                      <div className="flex flex-col text-center">
                        <span className="text-yellow-600 text-xs font-bold pb-1">
                          {bongkarStats.pending}
                        </span>
                        <span className="text-yellow-600 text-xs pb-1">
                          Pending
                        </span>
                      </div>
                    </Card>
                    <Card className="bg-blue-100 w-[4vw] h-[6vh] flex justify-center items-center">
                      <div className="flex flex-col text-center">
                        <span className="text-blue-600 text-xs font-bold pb-1">
                          {bongkarStats.loading}
                        </span>
                        <span className="text-blue-600 text-xs pb-1">
                          Loading
                        </span>
                      </div>
                    </Card>
                    <Card className="bg-green-100 w-[4vw] h-[6vh] flex justify-center items-center">
                      <div className="flex flex-col text-center">
                        <span className="text-green-600 text-xs font-bold pb-1">
                          {bongkarStats.finished}
                        </span>
                        <span className="text-green-600 text-xs pb-1">
                          Finished
                        </span>
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
                      <TruckIcon className="text-green-600 font-bold w-3 h-3" />
                    </div>
                    <div className="flex flex-col justify-center">
                      <span className="text-xs text-green-800"> Internal</span>
                      <span className="text-xs text-slate-500 font-medium">
                        {" "}
                        Alkindo's{" "}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardTitle className="flex-shrink-0 pb-1">
                  <div className="flex flex-col text-center">
                    <div className="text-lg text-green-600 font-bold">
                      {getTypeStats("Inbound")}
                    </div>
                    <div className="text-xs text-slate-400">Today</div>
                  </div>
                </CardTitle>
                <CardContent className="flex-1 flex items-center justify-center p-2">
                  <div className="w-full h-8 bg-green-50 rounded flex items-center justify-center border border-green-200">
                    <span className="text-green-600 text-xs font-medium">
                      Internal
                    </span>
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
                      <TruckIcon className="text-blue-600 font-bold w-3 h-3" />
                    </div>
                    <div className="flex flex-col justify-center">
                      <span className="text-xs text-blue-800"> External </span>
                      <span className="text-xs text-slate-500 font-medium">
                        {" "}
                        Vendor's{" "}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardTitle className="flex-shrink-0 pb-1">
                  <div className="flex flex-col text-center">
                    <div className="text-lg text-blue-600 font-bold">
                      {getTypeStats("Outbound")}
                    </div>
                    <div className="text-xs text-slate-400">Today</div>
                  </div>
                </CardTitle>
                <CardContent className="flex-1 flex items-center justify-center p-2">
                  <div className="w-full h-8 bg-blue-50 rounded flex items-center justify-center border border-blue-200">
                    <span className="text-blue-600 text-xs font-medium">
                      External
                    </span>
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
                      <span className="text-purple-600 font-bold text-xs">
                        H
                      </span>
                    </div>
                    <div className="flex flex-col justify-center">
                      <span className="text-xs text-purple-800">
                        {" "}
                        Dept. HPC{" "}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        {" "}
                        Destination{" "}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardTitle className="flex-shrink-0 pb-1">
                  <div className="flex flex-col text-center">
                    <div className="text-lg text-purple-600 font-bold">
                      {getDepartmentStats("HPC")}
                    </div>
                    <div className="text-xs text-slate-400">Today</div>
                  </div>
                </CardTitle>
                <CardContent className="flex-1 flex items-center justify-center p-2">
                  <div className="w-full h-8 bg-purple-50 rounded flex items-center justify-center border border-purple-200">
                    <span className="text-purple-600 text-xs font-medium">
                      HPC
                    </span>
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
                      <span className="text-orange-600 font-bold text-xs">
                        P
                      </span>
                    </div>
                    <div className="flex flex-col justify-center">
                      <span className="text-xs text-orange-800">
                        {" "}
                        Dept. PT{" "}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        {" "}
                        Destination{" "}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardTitle className="flex-shrink-0 pb-1">
                  <div className="flex flex-col text-center">
                    <div className="text-lg text-orange-600 font-bold">
                      {getDepartmentStats("PT")}
                    </div>
                    <div className="text-xs text-slate-400">Today</div>
                  </div>
                </CardTitle>
                <CardContent className="flex-1 flex items-center justify-center p-2">
                  <div className="w-full h-8 bg-orange-50 rounded flex items-center justify-center border border-orange-200">
                    <span className="text-orange-600 text-xs font-medium">
                      PT
                    </span>
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
                  <span className="text-sm text-blue-800">
                    {" "}
                    Trucks in Queue / {" "}
                    <span className="italic opacity-70">
                      Antrian Truk {" "}
                    </span>
                  </span>
                </div>
                <div className="w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center border">
                  <Logs className="text-blue-600 font-bold w-4 h-4" />
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
                        <TableHead className="text-xs md:text-xs">
                          Plate/Driver
                        </TableHead>
                        <TableHead className="text-xs md:text-xs">
                          Supplier
                        </TableHead>
                        <TableHead className="text-xs md:text-xs">
                          Operation
                        </TableHead>
                        <TableHead className="text-xs md:text-xs">
                          Truck Status
                        </TableHead>
                        <TableHead className="text-xs md:text-xs">
                          Progress
                        </TableHead>
                        <TableHead className="text-xs md:text-xs">
                          Goods
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trucks
                        .filter(
                          (truck) =>
                            truck.status === "Waiting" ||
                            truck.status === "Loading",
                        )
                        .sort((a, b) => {
                          // Loading First then the Waiting status
                          if (a.status !== b.status) {
                            if (a.status === "Loading") return -1;
                            if (b.status === "Loading") return 1;
                          }
                          // Sorting by id 
                          return a.id.localeCompare(b.id);
                        })
                        .map((truck) => (
                          <TableRow key={truck.id}>
                            <TableCell>
                              {" "}
                              <div className="text-xs">{truck.id}</div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-semibold text-xs">
                                  {truck.plateNumber}
                                </div>
                                <div className="font-light text-xs">
                                  {truck.driver}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-xs">{truck.supplier}</div>
                            </TableCell>
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
                                  {truck.status.charAt(0).toUpperCase() +
                                    truck.status.slice(1)}
                                </div>
                              )}
                              {truck.status === "Loading" && (
                                <div className="rounded-full flex bg-blue-100 text-blue-700 font-bold text-xs px-2 py-1 w-fit mx-auto">
                                  {truck.status.charAt(0).toUpperCase() +
                                    truck.status.slice(1)}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="text-xs">{truck.goods}</div>
                            </TableCell>
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

      {/* Analytics Dialog */}
      <AnalyticsDialog 
        isOpen={isAnalyticsOpen} 
        onOpenChange={setIsAnalyticsOpen} 
      />
    </div>
  );
}