import { useState } from "react";
import { TruckFormData, OperationType, CameraTarget } from "../../types/truck.types";
import { CombinedTruckData } from "../../store/truckStore";
import { getIndonesianDate } from "../../lib/timezone";
interface UseTruckSubmissionProps {
  createTruck: (truck: Omit<CombinedTruckData, "id">) => Promise<void>;
  refetchTrucks: () => void;
  onSuccess: () => void;
}
export function useTruckSubmission({ 
  createTruck, 
  refetchTrucks, 
  onSuccess 
}: UseTruckSubmissionProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitTruck = async (
    formData: TruckFormData,
    operationType: OperationType,
    capturedImages: Record<CameraTarget, string | null>,
    ticketNumber: string
  ) => {
    setIsSubmitting(true);
    try {
      
      const arrivalDateTime =
        formData.arrivalTime && formData.date
          ? `${formData.date} ${formData.arrivalTime}:00`
          : null;
      
      const currentDate = formData.date || getIndonesianDate();
      const suratJalanDate = formData.tglsj || currentDate;
      const newTruck: Omit<CombinedTruckData, "id"> = {
        
        platenumber: formData.platenumber,
        noticket: ticketNumber,
        department: formData.department,
        nikdriver: formData.nikdriver,
        tlpdriver: formData.tlpdriver,
        nosj: formData.nosj,
        tglsj: suratJalanDate,
        driver: formData.driver,
        supplier: formData.supplier,
        eta: "",
        status: "waiting",
        type: formData.type === "internal" 
            ? "Inbound"
            : formData.type === "external"
              ? "Outbound"
              : "Inbound", 
        operation: operationType as "bongkar" | "muat",
        goods: formData.goods,
        descin: formData.descin,
        descout: formData.descout,
        statustruck: formData.statustruck,
        armada: formData.armada,
        kelengkapan: formData.kelengkapan,
        jenismobil: formData.jenismobil,
        date: currentDate,
        exittime: "",
        
        arrivaltime: arrivalDateTime || "",
        waitingfortimbang: "",
        starttimbang: "",
        finishtimbang: "",
        totalprocesstimbang: "",
        runtohpc: "",
        waitingforarrivalhpc: "",
        entryhpc: "",
        totalwaitingarrival: "",
        startloadingtime: "",
        finishloadingtime: "",
        totalprocessloadingtime: "",
        actualwaitloadingtime: "",
        
        truck_id: '',
        driver_photo: capturedImages.driver || "",
        sim_photo: capturedImages.sim || "",
        stnk_photo: capturedImages.stnk || "",
      };
      
      await createTruck(newTruck);
      
      refetchTrucks();
      onSuccess();
    } catch (error: any) {
      console.error("Error adding truck:", error);
      console.error("Response data:", error?.response?.data);
      console.error("Response status:", error?.response?.status);
      console.error("Response headers:", error?.response?.headers);
      
      const errorMessage = error?.response?.data?.error || error?.message || "Gagal menyimpan data truck";
      alert(`Error: ${errorMessage}`);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };
  return {
    submitTruck,
    isSubmitting
  };
}