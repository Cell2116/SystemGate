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
    jenisbarang: string;
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
    status: "waiting" | "timbang" | "loading" | "unloading" | "exit" | "on process" | "finished" | "weighing_neto" | "weighing_neto_finished";
    type: "Inbound" | "Outbound" | "internal" | "external";
    operation: "bongkar" | "muat";
    goods: string;
    descin: string;
    descout: string;
    statustruck: string;
    armada: string;
    kelengkapan: string;
    jenismobil: string;
    jenisbarang: string;
    date: string;
    exittime: string;
    skipped_steps?: string;
    skip_reason?: string;
    loading_cycle?: number;
    department_history?: string;
}

export interface TruckTimesData {
    id: string;
    truck_id: string;
    cycle_number: number;
    arrivaltime: string;
    waitingfortimbang: string;
    starttimbang: string;
    finishtimbang: string;
    totalprocesstimbang: string;
    runtohpc: string
    waitingforarrivalhpc: string;
    entryhpc: string;
    totalwaitingarrival: string;
    runtopt: string;
    waitingforarrivalpt: string;
    entrypt: string;
    startloadingtime: string;
    finishloadingtime: string;
    totalprocessloadingtime: string;
    actualwaitloadingtime: string;
    starttimbangneto: string;
    finishtimbangneto: string;
    waitingfortimbangneto: string;
    totalprocesstimbangneto: string;
    exittime: string;
    waitingforexit: string;
    totaltruckcompletiontime: string;
}

export interface TruckQueueData {
    queue_ticket?: number;
    queue_position?: number;
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
    platenumber: string;
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
    status: "waiting" | "timbang" | "loading" | "unloading" | "exit" | "on process" | "finished" | "weighing_neto" | "weighing_neto_finished";
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
    starttimbangneto: string;
    finishtimbangneto: string;
    waitingfortimbangneto: string;
    totalprocesstimbangneto: string;
    exittime: string;
    date: string;
    armada: string;
    kelengkapan: string;
    jenismobil: string;
    jenisbarang: string;
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
    jenisbarang: string;
    date: string;
    skipped_steps?: string;
    skip_reason?: string;
    loading_cycle?: number;
    department_history?: string;

    queue_ticket?: string;
    queue_position?: number;

    cycle_number: number;
    arrivaltime: string;
    waitingfortimbang: string;
    starttimbang: string;
    finishtimbang: string;
    totalprocesstimbang: string;
    runtohpc: string;
    waitingforarrivalhpc: string;
    entryhpc: string;
    totalwaitingarrival: string;
    runtopt: string;
    waitingforarrivalpt: string;
    entrypt: string;
    startloadingtime: string;
    finishloadingtime: string;
    totalprocessloadingtime: string;
    actualwaitloadingtime: string;
    starttimbangneto: string;
    finishtimbangneto: string;
    waitingfortimbangneto: string;
    totalprocesstimbangneto: string;
    exittime: string;
    waitingforexit: string;
    totaltruckcompletiontime: string;

    driver_photo: string;
    stnk_photo: string;
    sim_photo: string;
}
export type TruckOperation = 'muat' | 'bongkar';
export type TruckStatus = 'waiting' | 'timbang' | 'loading' | 'unloading' | 'exit' | 'on process' | 'finished' | 'weighing_neto' | 'weighing_neto_finished' | 'Waiting' | 'Loading' | 'Weighing' | 'Finished' | 'pending' | 'weighing';
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
export interface TruckExportData {
    truck_id: number;
    platenumber: string;
    noticket: string;
    driver: string;
    nikdriver: string;
    tlpdriver: string;
    supplier: string;
    nosj: string;
    tglsj: string;
    status: string;
    type: string;
    operation: string;
    goods: string;
    descin: string;
    descout: string;
    statustruck: string;
    armada: string;
    kelengkapan: string;
    jenismobil: string;
    jenisbarang: string;
    department: string;
    date: string;
    loading_cycle: string;

    // Cycle 1 times
    arrivaltime: string;
    waitingfortimbang: string;
    starttimbang: string;
    finishtimbang: string;
    totalprocesstimbang: string;
    runtohpc: string;
    waitingforarrivalhpc: string;
    entryhpc: string;
    runtopt: string;
    waitingforarrivalpt: string;
    entrypt: string;
    totalwaitingarrival: string;
    startloadingtime: string;
    finishloadingtime: string;
    totalprocessloadingtime: string;
    actualwaitloadingtime: string;
    starttimbangneto: string;
    finishtimbangneto: string;
    totalprocesstimbangneto: string;
    waitingfortimbangneto: string;
    exittime: string;
    totaltruckcompletiontime: string;
    waitingforexit: string;

    // Cycle 2 times (optional)
    arrivaltime_cycle2?: string;
    waitingfortimbang_cycle2?: string;
    starttimbang_cycle2?: string;
    finishtimbang_cycle2?: string;
    totalprocesstimbang_cycle2?: string;
    runtohpc_cycle2?: string;
    waitingforarrivalhpc_cycle2?: string;
    entryhpc_cycle2?: string;
    runtopt_cycle2?: string;
    waitingfoarrivalpt_cycle2?: string;
    entrypt_cycle2?: string;
    totalwaitingarrival_cycle2?: string;
    startloadingtime_cycle2?: string;
    finishloadingtime_cycle2?: string;
    totalprocessloadingtime_cycle2?: string;
    actualwaitloadingtime_cycle2?: string;
    starttimbangneto_cycle2?: string;
    finishtimbangneto_cycle2?: string;
    totalprocesstimbangneto_cycle2?: string;
    waitingfortimbangneto_cycle2?: string;
    exittime_cycle2?: string;
    totaltruckcompletiontime_cycle2?: string;
    waitingforexit_cycle2?: string;

    // Queue & Photos
    queue_position: number;
    queue_ticket: number;
    driver_photo: string;
    stnk_photo: string;
    sim_photo: string;
}

export type FilterStatus = 'all' | 'Waiting' | 'Weighing' | 'Loading' | 'Finished' | 'Exit' | 'pending' | 'weighing' | 'loading' | 'unloading' | 'finished' | 'waiting' | 'timbang' | 'exit';