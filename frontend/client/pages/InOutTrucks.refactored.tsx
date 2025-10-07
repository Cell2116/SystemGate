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
import { TrucksQueue } from "@/components/trucks/table/TruckQueueTable";

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
import { CardDashboardTruck, OperationStatsCard } from "@/components/trucks/cardDashboard/CardDashboardTruck";

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
        {/* <div className="mt-4 sm:mt-0">
          <Clock2 />
        </div> */}
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
          <OperationStatsCard 
            muatStats={muatStats}
            bongkarStats={bongkarStats}
          />

          {/* Bottom Row: 4 Cards - Internal + External, PBPG, HPC, PT */}
          <CardDashboardTruck 
            getTypeStats={getTypeStats}
            getDepartmentStats={getDepartmentStats}
          />
        </div>

        {/* Right Half - Trucks in Queue */}
        <div className="w-1/2 h-full">
          <TrucksQueue/>
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