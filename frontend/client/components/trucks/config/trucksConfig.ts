// src/components/trucks/config/trucksConfig.ts
import { TrucksTableConfig } from '@/types/truck.types';

export const loadingTrucksConfig: TrucksTableConfig = {
    operation: 'muat',
    title: 'Loading Trucks / ',
    subtitle: 'Muat',
    subtitleColor: 'text-green-600',
    statusMapping: {
        waiting: ['Waiting', 'pending'],
        loading: ['Loading', 'loading'],
        finished: ['Finished', 'finished']
    },
    features: {
        suratJalanRecommendations: true
    },
    emptyMessage: 'No loading trucks found. Only trucks with "muat" operation are shown here.'
};

export const unloadingTrucksConfig: TrucksTableConfig = {
    operation: 'bongkar',
    title: 'Unloading Trucks / ',
    subtitle: 'Bongkar',
    subtitleColor: 'text-orange-600',
    statusMapping: {
        waiting: ['Waiting', 'pending'],
        weighing: ['Weighing', 'weighing'],
        loading: ['Loading', 'loading'],
        finished: ['Finished', 'finished']
    },
    features: {
        suratJalanRecommendations: false
    },
    emptyMessage: 'No unloading trucks found. Only trucks with "bongkar" operation are shown here.'
};

export const weighingTrucksConfig: TrucksTableConfig = {
    operation: 'bongkar',
    title: 'Weighing Trucks / ',
    subtitle: 'Truck Sedang Ditimbang',
    subtitleColor: 'text-blue-600',
    statusMapping: {
        waiting: [],
        weighing: ['Weighing', 'weighing'],
        loading: [],
        finished: []
    },
    features: {
        suratJalanRecommendations: false
    },
    emptyMessage: 'No trucks currently being weighed.'
};
