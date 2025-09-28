export interface TruckFormData {
    plateNumber: string;
    driver: string;
    supplier: string;
    arrivalTime: string;
    noticket: string;
    department: string;
    nikdriver: string;
    tlpdriver: string;
    nosj: string;
    tglsj: string;
    descin: string;
    descout: string;
    statustruck: string;
    type: string;
    operation: string;
    goods: string;
    quantity: string;
    unit: string;
    date: string;
    armada: string;
    kelengkapan: string;
    jenismobil: string;
}

export type CameraTarget = "driver" | "sim" | "stnk";

export interface CapturedImages {
    driver: string | null;
    sim: string | null;
    stnk: string | null;
}

export interface TruckStats {
    pending: number;
    loading: number;
    finished: number;
    total: number;
}

export type OperationType = "" | "bongkar" | "muat";
export type InputMode = "select" | "manual";

export interface PhotoCaptureProps {
    target: CameraTarget;
    onCapture: (target: CameraTarget, imageData: string) => void;
    capturedImage: string | null;
    showCamera: boolean;
    onStartCamera: (target: CameraTarget) => void;
    onStopCamera: () => void;
}
