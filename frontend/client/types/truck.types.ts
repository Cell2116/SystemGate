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

export interface TruckHistoryRecord {
    id: number;
    platenumber: string;
    noticket?: string;
    department?: string;
    nikdriver?: string;
    tlpdriver?: string;
    nosj?: string;
    tglsj?: string;
    driver?: string;
    supplier?: string;
    arrivaltime?: string;
    eta?: string;
    status?: string;
    type?: string;
    goods?: string;
    descin?: string;
    descout?: string;
    statustruck?: string;
    estimatedfinish?: string;
    estimatedwaittime?: string;
    actualwaittime?: string;
    startloadingtime?: string;
    finishtime?: string;
    date?: string;
    armada?: string;
    kelengkapan?: string;
    jenismobil?: string;
    driver_photo?: string;
    sim_photo?: string;
    stnk_photo?: string;
}

export type TruckOperation = 'muat' | 'bongkar';
export type TruckStatus = 'Waiting' | 'Loading' | 'Weighing' | 'Finished' | 'pending' | 'weighing' | 'loading' | 'finished';
export interface StatusStep {
    id: number;
    label: string;
    status: TruckStatus;
    color: string;
    borderColor: string;
    count: number;
    isActive: boolean;
}

export interface TrucksTableConfig {
    operation: TruckOperation;
    title: string;
    subtitle: string;
    subtitleColor: string;
    statusMapping: {
        waiting: TruckStatus[];
        weighing?: TruckStatus[]; // Optional untuk operasi yang tidak butuh weighing
        loading: TruckStatus[];
        finished: TruckStatus[];
    };
    features: {
        suratJalanRecommendations: boolean;
    };
    emptyMessage: string;
}

export type FilterStatus = 'all' | 'Waiting' | 'Weighing' | 'Loading' | 'Finished' | 'pending' | 'weighing' | 'loading' | 'unloading' | 'finished';