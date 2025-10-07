import { TruckFormData } from "../types/truck.types";
import { getIndonesianDate } from "../lib/timezone";

export const INITIAL_FORM_DATA: TruckFormData = {
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
    date: getIndonesianDate(), // Set default to today's date in Indonesian timezone
    armada: "",
    kelengkapan: "",
    jenismobil: "",
};

export const DEPARTMENT_OPTIONS = [
    { value: "HPC", label: "HPC" },
    { value: "PT", label: "PT" },
    { value: "PBPG", label: "PBPG" },
];

export const TRUCK_TYPE_OPTIONS = [
    { value: "Container", label: "Container" },
    { value: "Wingbox", label: "Wingbox" },
    { value: "Tronton", label: "Tronton" },
    { value: "Dumptruck", label: "Dumptruck" },
    { value: "Colt", label: "Colt" },
    { value: "Fuso", label: "Fuso" },
];

export const TRUCK_STATUS_OPTIONS = [
    { value: "isi", label: "Isi (Ada Barang)" },
    { value: "kosong", label: "Kosong" },
];

export const TRANSPORTER_OPTIONS = [
    { value: "internal", label: "Kendaraan Internal" },
    { value: "external", label: "Kendaraan External" },
];

export const CAMERA_LABELS = {
    driver: "Pengemudi",
    sim: "SIM",
    stnk: "STNK",
} as const;

export const VALIDATION_MESSAGES = {
    BONGKAR_STEP_1:
        "Mohon lengkapi data pengemudi, plat nomor, supplier, dan foto yang diperlukan.",
    BONGKAR_STEP_2:
        "Mohon lengkapi nomor surat jalan, tanggal surat jalan, dan deskripsi barang masuk.",
    BONGKAR_STEP_3: "Mohon pilih department tujuan.",
    MUAT_STEP_1:
        "Mohon lengkapi data pengemudi, plat nomor, dan foto yang diperlukan.",
    MUAT_STEP_2:
        "Mohon lengkapi jenis barang, quantity, unit, department, dan deskripsi barang keluar.",
    TIMBANG_STEP_1: "Mohon lengkapi data pengemudi, plat nomor, dan foto yang diperlukan.",
    DEFAULT: "Mohon lengkapi seluruh data form yang dibutuhkan.",
};
