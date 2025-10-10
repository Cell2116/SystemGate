import { useState, useEffect, useCallback } from "react";
import { TruckHistoryRecord } from "@/types/truck.types";
import { useTrucks } from "@/store/truckStore";

const transformTruckRecordToHistory = (truck: any): TruckHistoryRecord => {
    return {
        id: parseInt(truck.id) || 0,
        platenumber: truck.plateNumber || '',
        noticket: truck.noticket || '',
        department: truck.department || '',
        nikdriver: truck.nikdriver || '',
        tlpdriver: truck.tlpdriver || '',
        nosj: truck.nosj || '',
        tglsj: truck.tglsj || '',
        driver: truck.driver || '',
        supplier: truck.supplier || '',
        arrivaltime: truck.arrivalTime || '',
        eta: truck.eta || '',
        status: truck.status || '',
        type: truck.type || '',
        goods: truck.goods || '',
        descin: truck.descin || '',
        descout: truck.descout || '',
        statustruck: truck.statustruck || '',
        estimatedfinish: '', // Not available in TruckRecord
        estimatedwaittime: '', // Not available in TruckRecord
        actualwaitloadingtime: truck.actualwaitloadingtime || '',
        startloadingtime: truck.startLoadingTime || '',
        finishloadingtime: truck.finishloadingtime || '',
        date: truck.date || '',
        armada: truck.armada || '',
        kelengkapan: truck.kelengkapan || '',
        jenismobil: truck.jenismobil || ''
    };
};

export const useTruckHistory = () => {
    const {
        trucks,
        loading,
        error,
        fetchTrucks,
        refreshTrucks
    } = useTrucks();

    // Transform truck records to history records format
    const records: TruckHistoryRecord[] = trucks.map(transformTruckRecordToHistory);

    // Fetch all trucks on mount
    useEffect(() => {
        if (trucks.length === 0 && !loading) {
            fetchTrucks();
        }
    }, []);

    const fetchTruckHistory = async () => {
        try {
            await fetchTrucks();
        } catch (err) {
            console.error("Failed to fetch truck history:", err);
        }
    };

    const fetchData = async () => {
        try {
            await refreshTrucks();
        } catch (err) {
            console.error("Failed to refresh truck history records:", err);
        }
    };

    return {
        records,
        fetchTruckHistory,
        fetchData,
        loading,
        error
    };
};