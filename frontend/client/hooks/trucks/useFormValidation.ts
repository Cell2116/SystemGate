import { useMemo } from "react";
import { TruckFormData, OperationType, CameraTarget } from "../../types/truck.types";

interface UseFormValidationProps {
  formData: TruckFormData;
  operationType: OperationType;
  capturedImages: Record<CameraTarget, string | null>;
}

export function useFormValidation({
  formData,
  operationType,
  capturedImages
}: UseFormValidationProps) {

  const validationStep = (step: number, operation: string): boolean => {
    if (operation === "bongkar") {
      switch (step) {
        case 1:
          return !!(
            formData.driver &&
            formData.plateNumber &&
            formData.nikdriver &&
            formData.tlpdriver &&
            formData.supplier &&
            formData.arrivalTime &&
            capturedImages.driver
          );
        case 2:
          return !!(
            formData.goods &&
            formData.descin &&
            formData.department &&
            formData.jenismobil &&
            formData.statustruck &&
            formData.date &&
            capturedImages.sim &&
            capturedImages.stnk
          );
        case 3:
          return !!(formData.nosj && formData.tglsj);
        default:
          return true;
      }
    } else if (operation === "muat") {
      switch (step) {
        case 1:
          return !!(
            formData.driver &&
            formData.plateNumber &&
            formData.nikdriver &&
            formData.tlpdriver &&
            formData.armada &&
            formData.supplier &&
            formData.arrivalTime &&
            capturedImages.driver
          );
        case 2:
          return !!(
            formData.goods &&
            formData.descin &&
            formData.type &&
            formData.department &&
            formData.date &&
            formData.jenismobil &&
            capturedImages.sim &&
            capturedImages.stnk
          );
        default:
          return true;
      }
    }
    return true;
  };

  const getValidationMessage = (step: number, operation: string): string => {
    if (operation === "bongkar") {
      switch (step) {
        case 1:
          const missingFields1 = [];
          if (!formData.driver) missingFields1.push("Pengemudi");
          if (!formData.plateNumber) missingFields1.push("Plat Nomor");
          if (!formData.nikdriver) missingFields1.push("NIK");
          if (!formData.tlpdriver) missingFields1.push("No Telepon");
          if (!formData.supplier) missingFields1.push("Perusahaan Asal");
          if (!formData.arrivalTime) missingFields1.push("Jam Kedatangan");
          if (!capturedImages.driver) missingFields1.push("Foto Pengemudi");
          return `Mohon Lengkapi (${missingFields1.join(",  ")})`;
        case 2:
          const missingFields2 = [];
          if (!formData.goods) missingFields2.push("Nama Barang");
          if (!formData.descin) missingFields2.push("Jumlah Barang");
          if (!formData.department) missingFields2.push("Departemen");
          if (!formData.statustruck) missingFields2.push("Kondisi Truck");
          if (!formData.jenismobil) missingFields2.push("Jenis Mobil");
          if (!formData.date) missingFields2.push("Tanggal");
          if (!capturedImages.sim) missingFields2.push("Foto SIM");
          if (!capturedImages.stnk) missingFields2.push("Foto STNK");
          return `Mohon lengkapi (${missingFields2.join(", ")})`;

        case 3:
          const missingFields3 = [];
          if (!formData.nosj) missingFields3.push("No. Surat Jalan");
          if (!formData.tglsj) missingFields3.push("Tanggal Surat Jalan");
          return `Mohon lengkapi (${missingFields3.join(", ")})`;
      }
    } else if (operation === "muat") {
      switch (step) {
        case 1:
          const missingFields1 = [];
          if (!formData.driver) missingFields1.push("Pengemudi");
          if (!formData.plateNumber) missingFields1.push("Plat Nomor");
          if (!formData.nikdriver) missingFields1.push("NIK");
          if (!formData.tlpdriver) missingFields1.push("No Telepon");
          if (!formData.armada) missingFields1.push("Armada");
          if (!formData.supplier) missingFields1.push("Supplier");
          // if (!formData.statustruck) missingFields1.push("Kondisi Truck");
          if (!formData.arrivalTime) missingFields1.push("Jam Kedatangan");
          if (!capturedImages.driver) missingFields1.push("Foto Pengemudi");
          return `Mohon lengkapi (${missingFields1.join(", ")})`;

        case 2:
          const missingFields2 = [];
          if (!formData.goods) missingFields2.push("Nama Barang");
          if (!formData.descin) missingFields2.push("Jumlah Barang");
          if (!formData.type) missingFields2.push("Transporter");
          if (!formData.department) missingFields2.push("Departemen");
          if (!formData.date) missingFields2.push("Tanggal");
          if (!formData.jenismobil) missingFields2.push("Jenis Mobil");
          if (!capturedImages.sim) missingFields2.push("Foto SIM");
          if (!capturedImages.stnk) missingFields2.push("Foto STNK");
          return `Mohon lengkapi (${missingFields2.join(", ")})`;
      }
    }
    return "Mohon lengkapi seluruh data form yang dibutuhkan.";
  };

  const validateAllSteps = useMemo(() => {
    if (operationType === "bongkar") {
      return validationStep(1, "bongkar") &&
        validationStep(2, "bongkar") &&
        validationStep(3, "bongkar");
    } else if (operationType === "muat") {
      return validationStep(1, "muat") &&
        validationStep(2, "muat");
    }
    return false;
  }, [formData, operationType, capturedImages]);

  return {
    validationStep,
    getValidationMessage,
    validateAllSteps
  };
}