import { useState } from "react";
import { TruckFormData, OperationType, CameraTarget } from "../../types/truck.types";
import { TruckRecord } from "../../store/truckStore";
import { getIndonesianDate } from "../../lib/timezone";

interface UseTruckSubmissionProps {
  createTruck: (truck: Omit<TruckRecord, "id">) => Promise<void>;
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
      // Convert arrivalTime to proper timestamp format with Indonesian timezone
      const arrivalDateTime =
        formData.arrivalTime && formData.date
          ? `${formData.date} ${formData.arrivalTime}:00`
          : null;

      // Ensure date fields are not empty - use Indonesian timezone
      const currentDate = formData.date || getIndonesianDate();
      const suratJalanDate = formData.tglsj || currentDate;

      const newTruck: Omit<TruckRecord, "id"> = {
        // Main truck data (untuk tabel trucks)
        plateNumber: formData.plateNumber,
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
              : "Inbound", // default to Inbound
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
        
        // Time data (untuk tabel truck_times) - set initial values
        arrivalTime: arrivalDateTime || "",
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
        
        // Photo data (untuk tabel truck_photos)
        driver_photo: capturedImages.driver || "",
        sim_photo: capturedImages.sim || "",
        stnk_photo: capturedImages.stnk || "",
        
        // Optional fields (backward compatibility - tidak dikirim ke backend)
        quantity: formData.quantity || "",
        unit: formData.unit || "",
      };

      console.log("=== SENDING TRUCK DATA ===", newTruck);

      await createTruck(newTruck);

      // Refresh data and call success callback
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