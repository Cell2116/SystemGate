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
        noticket: string;
        department: string;
        nikdriver: string;
        tlpdriver: string;
        nosj: string;
        tglsj: string;
        driver: string;
        supplier: string;
        eta: string;
        status: string;
        type: string;
        goods: string;
        descin: string;
        descout: string;
        statustruck: string;
        armada: string;
        kelengkapan: string;
        jenismobil: string;
        date: string;
        exittime: string;
        // Time data dari truck_times table
        arrivaltime: string;
        waitingfortimbang: string;
        starttimbang: string;
        finishtimbang: string;
        totalprocesstimbang: string;
        runtohpc: string;
        waitingforarrivalhpc: string;
        entryhpc: string;
        totalwaitingarrival: string;
        startloadingtime: string;
        finishloadingtime: string;
        totalprocessloadingtime: string;
        actualwaitloadingtime: string;
        // Photo data dari truck_photos table
        driver_photo: string;
        stnk_photo: string;
        sim_photo: string;
}
export type TruckOperation = 'muat' | 'bongkar';
export type TruckStatus = 'waiting' | 'timbang' | 'loading' | 'unloading' | 'done' | 'on process' | 'finished' | 'Waiting' | 'Loading' | 'Weighing' | 'Finished' | 'pending' | 'weighing';
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

export type FilterStatus = 'all' | 'Waiting' | 'Weighing' | 'Loading' | 'Finished' | 'pending' | 'weighing' | 'loading' | 'unloading' | 'finished' | 'waiting' | 'timbang';