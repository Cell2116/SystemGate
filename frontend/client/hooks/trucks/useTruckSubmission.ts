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

  // Function untuk upload foto ke backend
  const uploadPhoto = async (
    photoData: string,
    photoType: string,
    plateNumber: string,
  ) => {
    try {
      const response = await fetch("/api/trucks/upload-photo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          photoData,
          photoType,
          plateNumber,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to upload photo");
      }

      const result = await response.json();
      return result.filePath; // Return the file path for database storage
    } catch (error) {
      console.error("Error uploading photo:", error);
      return null;
    }
  };

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
        plateNumber: formData.plateNumber,
        noticket: ticketNumber,
        department: formData.department,
        nikdriver: formData.nikdriver,
        tlpdriver: formData.tlpdriver,
        nosj: formData.nosj,
        tglsj: suratJalanDate,
        driver: formData.driver,
        supplier: formData.supplier,
        arrivalTime: arrivalDateTime || "",
        eta: "",
        status: "Waiting",
        type:
          formData.type === "internal" 
            ? "Inbound"
            : formData.type === "external"
              ? "Outbound"
              : "Inbound", // default to Inbound
        operation: operationType as "bongkar" | "muat",
        goods: formData.goods,
        descin: formData.descin,
        descout: formData.descout,
        statustruck: formData.statustruck,
        // estimatedWaitTime: null,
        actualWaitTime: null,
        totalProcessLoadingTime: null,
        startLoadingTime: "",
        finishTime: "",
        date: currentDate,
        armada: formData.armada,
        kelengkapan: formData.kelengkapan,
        jenismobil: formData.jenismobil,
        quantity: formData.quantity || "",
        unit: formData.unit || "",
      };

      console.log("=== SENDING TRUCK DATA ===", newTruck);

      // Upload photos first and get the file paths
      let driverPhotoPath = null;
      let stnkPhotoPath = null;
      let simPhotoPath = null;

      if (capturedImages.driver) {
        driverPhotoPath = await uploadPhoto(
          capturedImages.driver,
          "driver",
          formData.plateNumber,
        );
      }

      if (capturedImages.stnk) {
        stnkPhotoPath = await uploadPhoto(
          capturedImages.stnk,
          "stnk",
          formData.plateNumber,
        );
      }

      if (capturedImages.sim) {
        simPhotoPath = await uploadPhoto(
          capturedImages.sim,
          "sim",
          formData.plateNumber,
        );
      }

      // Add photo paths to truck data
      const truckWithPhotos = {
        ...newTruck,
        driverPhoto: driverPhotoPath,
        stnkPhoto: stnkPhotoPath,
        simPhoto: simPhotoPath,
      };

      console.log("=== TRUCK DATA WITH PHOTOS ===", truckWithPhotos);

      await createTruck(truckWithPhotos);

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