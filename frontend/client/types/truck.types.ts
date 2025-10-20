export interface TruckFormData {
    platenumber: string;
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
export interface SuratJalan {
    id: string;
    noSuratJalan: string;
    tanggal: string;
    status?: "pending" | "in_progress" | "completed" | "cancelled";
    supplier?: string;
    barang?: string;
    jumlahBarang?: number;
    unit?: string;
    keterangan?: string;
    createdAt?: string;
    updatedAt?: string;
    createdBy?: string;
    updatedBy?: string;
}


export interface TruckMainData {
    id: string;
    platenumber: string;
    noticket: string;
    department: string;
    nikdriver: string;
    tlpdriver: string;
    nosj: string;
    tglsj: string;
    driver: string;
    supplier: string;
    eta?: string;
    status: "waiting" | "timbang" | "loading" | "unloading" | "done" | "on process" | "finished";
    type: "Inbound" | "Outbound" | "internal" | "external";
    operation: "bongkar" | "muat";
    goods: string;
    descin: string;
    descout: string;
    statustruck: string;
    armada: string;
    kelengkapan: string;
    jenismobil: string;
    date: string;
    exittime: string;
}

export interface TruckTimesData {
    id: string;
    truck_id: string;
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
}


export interface TruckPhotosData {
    id: string;
    truck_id: string;
    driver_photo?: string;
    sim_photo?: string;
    stnk_photo?: string;
}


export interface TruckRecord {
    id: string;
    plateNumber: string;
    noticket: string;
    department: string;
    nikdriver: string;
    tlpdriver: string;
    nosj: string;
    tglsj: string;
    driver: string;
    supplier: string;
    arrivalTime: string;
    eta?: string;
    status: "waiting" | "timbang" | "loading" | "unloading" | "done" | "on process" | "finished";
    type: "Inbound" | "Outbound" | "internal" | "external";
    operation: "bongkar" | "muat";
    goods: string;
    descin: string;
    descout: string;
    statustruck: string;
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
    exittime: string;
    date: string;
    armada: string;
    kelengkapan: string;
    jenismobil: string;
    quantity?: string;
    driver_photo?: string;
    sim_photo?: string;
    stnk_photo?: string;
    unit?: string;
}


interface ApiResponse<T> {
    success: boolean;
    data: T;
    message: string;
    error?: string;
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
        arrivaltime: string;
        exittime: string;
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
        
        driver_photo: string;
        stnk_photo: string;
        sim_photo: string;
}
export type TruckOperation = 'muat' | 'bongkar';
export type TruckStatus = 'waiting' | 'timbang' | 'loading' | 'unloading' | 'exit' | 'on process' | 'finished' | 'Waiting' | 'Loading' | 'Weighing' | 'Finished' | 'pending' | 'weighing';
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
        weighing?: TruckStatus[]; 
        loading: TruckStatus[];
        finished: TruckStatus[];
        exit: TruckStatus[];
    };
    // departmentFilters?:{
    //     weighing?: string[];
    // }
    features: {
        suratJalanRecommendations: boolean;
    };
    emptyMessage: string;
}

export type FilterStatus = 'all' | 'Waiting' | 'Weighing' | 'Loading' | 'Finished' | 'Exit' | 'pending' | 'weighing' | 'loading' | 'unloading' | 'finished' | 'waiting' | 'timbang' | 'exit';