import { useEffect, useState, useMemo } from "react";
import { useTruckStore } from "@/store/truckStore";
import { Scale, Truck, Clock5, Package, PackageOpen, FileQuestion } from "lucide-react"
import { useAudio } from "@/hooks/useAudio"
import { CombinedTruckData } from "@/store/truckStore"
import TimeTickerSimple from "@/components/dashboard/timeTickerSimple"
import { Dialog, DialogContent, DialogOverlay } from "@radix-ui/react-dialog";

import { ReactNode, CSSProperties } from "react";
import { spawn } from "child_process";

type CardProps = {
    children: ReactNode;
    className?: string;
    style?: CSSProperties;
};

const Card = ({ children, className = "", style = {} }: CardProps) => (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`} style={style}>
        {children}
    </div>
);

type CardContentProps = {
    children: ReactNode;
    className?: string;
    style?: CSSProperties;
};

const CardContent = ({ children, className = "", style = {} }: CardContentProps) => (
    <div className={`p-6 ${className}`} style={style}>
        {children}
    </div>
);

export default function TruckQueuePage() {
    const [zoomImage, setZoomImage] = useState<{
        src: string;
        alt: string;
        label: string;
    } | null>(null);
    const handleImageClick = (src: string, alt: string, label: string) => {
        setZoomImage({ src, alt, label });
    };
    const closeZoom = () => {
        setZoomImage(null);
    };
    const { playDingDongBell } = useAudio();
    const {
        trucks,
        fetchTrucks,
    } = useTruckStore();
    const baseurl = import.meta.env.VITE_API_BASE_URL;
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedDepartment, setSelectedDepartment] = useState("HPC/PBPG");
    const [modalImage, setModalImage] = useState<string | null>(null);
    const sortedAndFilteredTrucks = useMemo(() => {
        const filteredTrucks = trucks.filter((truck: CombinedTruckData) => {
            const status = truck.status?.toLowerCase();
            const matchesStatus = status === 'waiting' ||
                status === 'timbang' ||
                status === 'loading' ||
                status === 'unloading';
            if (status === 'timbang') {
                return selectedDepartment === "ALL" || selectedDepartment === "PT";
            }
            const matchesDepartment = selectedDepartment === "ALL" ||
                (selectedDepartment === "HPC/PBPG" && (truck.department === "HPC" || truck.department === "PBPG")) ||
                truck.department === selectedDepartment;
            return matchesStatus && matchesDepartment;
        });
        const sortedTrucks = filteredTrucks.sort((a, b) => {
            const getPriority = (status: string) => {
                switch (status?.toLowerCase()) {
                    case 'timbang': return 1;
                    case 'loading': return 2;
                    case 'unloading': return 2;
                    case 'waiting': return 3;
                    default: return 4;
                }
            };
            const priorityA = getPriority(a.status || '');
            const priorityB = getPriority(b.status || '');
            if (priorityA === priorityB) {
                const ticketA = a.noticket || '';
                const ticketB = b.noticket || '';
                return ticketA.localeCompare(ticketB);
            }
            return priorityA - priorityB;
        });
        return sortedTrucks;
    }, [trucks, selectedDepartment]);
    const formatTime = (dateString: string | null | undefined) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid Time';
        // const hours = String(date.getHours()).padStart(2, '0');
        // const minutes = String(date.getMinutes()).padStart(2, '0');
        // const seconds = String(date.getSeconds()).padStart(2, '0');
        const hours = String(date.getUTCHours()).padStart(2, "0");
        const minutes = String(date.getUTCMinutes()).padStart(2, "0");
        const seconds = String(date.getUTCSeconds()).padStart(2, "0");
        return `${hours}:${minutes}:${seconds}`;
    };
    const departmentStats = useMemo(() => {
        const departments = ['ALL', 'HPC/PBPG', 'PT'];
        return departments.map(dept => {
            const deptTrucks = trucks.filter(truck => {
                const status = truck.status?.toLowerCase();
                const matchesStatus = status === 'waiting' || status === 'timbang' || status === 'loading' || status === 'unloading';
                if (status === 'timbang') {
                    return dept === 'ALL' || dept === 'PT';
                }
                let matchesDepartment = false;
                if (dept === 'ALL') {
                    matchesDepartment = true;
                } else if (dept === 'HPC/PBPG') {
                    matchesDepartment = truck.department === 'HPC' || truck.department === 'PBPG';
                } else {
                    matchesDepartment = truck.department === dept;
                }
                return matchesStatus && matchesDepartment;
            });
            return {
                department: dept,
                total: deptTrucks.length,
                waiting: deptTrucks.filter(t => t.status?.toLowerCase() === 'waiting').length,
                timbang: deptTrucks.filter(t => {
                    if (t.status?.toLowerCase() === 'timbang') {
                        return dept === 'PT' || dept === 'ALL';
                    }
                    return false;
                }).length,
                loading: deptTrucks.filter(t => ['loading', 'unloading'].includes(t.status?.toLowerCase() || '')).length,
            };
        });
    }, [trucks]);
    const getStatusInfo = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'timbang':
                return {
                    color: 'bg-cyan-100 text-cyan-800',
                    icon: <Scale className="w-5 h-5" />,
                    label: 'TIMBANG',
                    priority: 'HIGH'
                };
            case 'loading':
                return {
                    color: 'bg-blue-100 text-blue-800',
                    icon: <Package className="w-5 h-5" />,
                    label: 'LOADING',
                    priority: 'MEDIUM'
                };
            case 'unloading':
                return {
                    color: 'bg-green-100 text-green-800',
                    icon: <PackageOpen className="w-5 h-5" />,
                    label: 'UNLOADING',
                    priority: 'MEDIUM'
                };
            case 'waiting':
                return {
                    color: 'bg-yellow-100 text-yellow-800',
                    icon: <Clock5 className="w-5 h-5" />,
                    label: 'WAITING',
                    priority: 'LOW'
                };
            default:
                return {
                    color: 'bg-gray-100 text-gray-800',
                    icon: <FileQuestion className="w-5 h-5" />,
                    label: 'UNKNOWN',
                    priority: 'LOW'
                };
        }
    };
    const getQueueNumberFromTicket = (ticket: string | null | undefined) => {
        if (!ticket) return 'N/A';
        const match = ticket.match(/(\d{2})$/);
        if (match) {
            return parseInt(match[1], 10);
        }
        return ticket.slice(-2);
    };
    useEffect(() => {
        fetchTrucks();
        const interval = setInterval(() => {
            fetchTrucks();
        }, 10000);
        return () => clearInterval(interval);
    }, [fetchTrucks]);

    return (
        <>
            <div className="h-[130vh] flex flex-col bg-gray-50 p-3 overflow-hidden">
                {/* Main Content */}
                <Card
                    style={{
                        transform: "scale(0.70)",
                        transformOrigin: "top left",
                        width: "142.8%",
                        height: "142.8%"
                    }}
                    className="flex-1 flex flex-col overflow-hidden"
                >
                    {/* Header dengan Filter Department */}
                    <div className="border-b border-gray-200 bg-white px-4 py-3">
                        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-3">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Truck Queue</h2>
                                <p className="text-sm text-gray-500">
                                    Showing {sortedAndFilteredTrucks.length} trucks in queue
                                    {selectedDepartment !== "ALL" && ` for ${selectedDepartment === "HPC/PBPG" ? "HPC/PBPG" : selectedDepartment}`}
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <label htmlFor="department" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                                        Department:
                                    </label>
                                    <select
                                        id="department"
                                        value={selectedDepartment}
                                        onChange={(e) => setSelectedDepartment(e.target.value)}
                                        className="h-8 border border-gray-300 rounded-md px-2 bg-white text-gray-700 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[140px]"
                                    >
                                        {departmentStats.map(stat => (
                                            <option key={stat.department} value={stat.department}>
                                                {stat.department === "ALL" ? "All Departments" :
                                                    stat.department === "HPC/PBPG" ? "HPC/PBPG" :
                                                        stat.department} ({stat.total})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {/* Department Statistics */}
                                {selectedDepartment !== "ALL" && departmentStats.find(s => s.department === selectedDepartment) && (
                                    <div className="flex items-center gap-2 text-xs flex-wrap">
                                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded whitespace-nowrap">
                                            Waiting: {departmentStats.find(s => s.department === selectedDepartment)?.waiting}
                                        </span>
                                        <span className="px-2 py-1 bg-cyan-100 text-cyan-800 rounded whitespace-nowrap">
                                            Timbang: {departmentStats.find(s => s.department === selectedDepartment)?.timbang}
                                        </span>
                                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded whitespace-nowrap">
                                            Loading: {departmentStats.find(s => s.department === selectedDepartment)?.loading}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <CardContent className="flex-1 overflow-y-auto space-y-4 p-4 pb-8" style={{
                        scrollBehavior: 'smooth',
                        scrollPadding: '20px'
                    }}>
                        {/* Loading State */}
                        {loading && (
                            <div className="flex items-center justify-center py-8">
                                <div className="flex items-center gap-2">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                    <p className="text-gray-500">Loading truck queue...</p>
                                </div>
                            </div>
                        )}
                        {/* Error State */}
                        {error && (
                            <div className="flex items-center justify-center py-8">
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <p className="text-red-600 flex items-center gap-2">
                                        <span>❌</span>
                                        <span>{error}</span>
                                    </p>
                                </div>
                            </div>
                        )}
                        {/* Empty State */}
                        {!loading && !error && sortedAndFilteredTrucks.length === 0 && (
                            <div className="flex items-center justify-center py-12">
                                <div className="text-center">
                                    <div className="text-6xl mb-4">🚛</div>
                                    <p className="text-gray-500 text-lg">No trucks in queue</p>
                                    <p className="text-gray-400 text-sm">Trucks with status waiting, loading, or timbang will appear here.</p>
                                </div>
                            </div>
                        )}
                        {/* Trucks List */}
                        {sortedAndFilteredTrucks.map((truck: CombinedTruckData, index: number) => {
                            const statusInfo = getStatusInfo(truck.status || '');
                            const queueNumber = getQueueNumberFromTicket(truck.noticket);
                            return (
                                <Card
                                    key={`${truck.id}-${index}`}
                                    className={`w-full transition-all duration-500 hover:shadow-md`}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex flex-col lg:flex-row justify-between lg:text-2xl sm:text-sm gap-4 w-full">
                                            {/* Section 1: Truck Image */}
                                            <div className="w-full lg:w-1/4 flex flex-col gap-4">
                                                <div className="w-full flex flex-row gap-4 justify-center">
                                                    <div className="flex flex-col items-center">
                                                        <h3 className="text-center pb-1 lg:text-xl sm:text-sm font-semibold text-green-600">
                                                            Foto Driver
                                                        </h3>
                                                        <img
                                                            src={truck.driver_photo
                                                                ? `${baseurl}/backend/uploads/trucks/${truck.driver_photo}`
                                                                : "https://via.placeholder.com/150x150?text=No+Photo"
                                                            }
                                                            alt="driver"
                                                            className="h-[15vh] w-[40vw] md:h-[17vh] md:w-[10vw] xl:h-[17vh] xl:w-[10vw] object-cover rounded-lg border shadow-sm text-gray-300 border-none text-center cursor-pointer"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Section 2: Truck Information */}
                                            <div className="w-full lg:w-2/4 flex flex-col text-left space-y-3">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <p className="font-bold lg:text-2xl sm:text-sm text-blue-600">
                                                        {truck.driver || 'Unknown Driver'} | {""}
                                                        <span className="text-blue-400">
                                                            {truck.platenumber || 'No Plate'}
                                                        </span>
                                                    </p>
                                                    {/* <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color} flex items-center gap-1`}>
                                                        {statusInfo.icon}
                                                        {statusInfo.label}
                                                    </span> */}
                                                </div>
                                                <div>
                                                    <span className="text-gray-900 font-bold lg:text-xl sm:text-sm">
                                                        {truck.noticket || 'No Ticket'} | {""}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500 font-bold lg:text-xl sm:text-sm">
                                                        {truck.supplier || 'Unknown Supplier'} | {truck.department || 'No Dept'}
                                                    </span>
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    <div>Jam Kedatangan: {formatTime(truck.arrivaltime)}</div>
                                                    {truck.startloadingtime && (
                                                        <div>Proses Dimulai: {formatTime(truck.startloadingtime)}</div>
                                                    )}
                                                </div>
                                            </div>
                                            {/* Section 3: Queue Number & Status */}
                                            <div className="w-full lg:w-1/4 flex flex-col text-left space-y-3">
                                                <div className="flex items-center gap-2 mb-2 justify-end">
                                                    {truck.status?.toLowerCase() === 'timbang' &&
                                                        (
                                                            <span className="px-2 py-1 gap-3 items-center flex flex-row rounded-full text-xl font-semibold bg-cyan-100 text-cyan-800 animate-pulse">
                                                                <Scale />
                                                                <span>Timbang</span>
                                                            </span>
                                                        )}
                                                    {truck.status?.toLowerCase() === 'loading' &&
                                                        (
                                                            <span className="px-2 py-1 gap-3 items-center flex flex-row rounded-full text-xl font-semibold bg-green-100 text-green-800 animate-bounce">
                                                                <Package />
                                                                <span>Muat</span>
                                                            </span>
                                                        )}
                                                    {truck.status?.toLowerCase() === 'unloading' &&
                                                        (
                                                            <span className="px-2 py-1 gap-3 items-center flex flex-row rounded-full text-xl font-semibold bg-orange-100 text-orange-800 animate-bounce">
                                                                <PackageOpen />
                                                                <span>Bongkar</span>
                                                            </span>
                                                        )}
                                                    {truck.status?.toLowerCase() === 'waiting' &&
                                                        (
                                                            <span className="px-2 py-1 gap-3 items-center flex flex-row rounded-full text-xl font-semibold bg-yellow-100 text-yellow-800 opacity-60">
                                                                <Clock5 />
                                                                <span>Menunggu</span>
                                                            </span>
                                                        )}
                                                </div>
                                                <div className="flex items-center">
                                                    <span className="font-medium text-gray-600 lg:text-xl sm:text-sm">Waktu Proses:</span>
                                                    {(() => {
                                                        const status = truck.status?.toLowerCase().trim();
                                                        if (!status || status === 'waiting') {
                                                            return (
                                                                <span className="ml-2 text-gray-400 font-bold lg:text-xl sm:text-sm">
                                                                    -
                                                                </span>
                                                            );
                                                        }
                                                        if (['timbang', 'loading', 'unloading'].includes(status)) {
                                                            let timeField = null;

                                                            if (status === 'timbang') {
                                                                timeField = truck.starttimbang;
                                                            } else if (status === 'loading' || status === 'unloading') {
                                                                timeField = truck.startloadingtime;
                                                            }

                                                            console.log(`🚛 Truck ${truck.platenumber} (${status}):`, {
                                                                starttimbang: truck.starttimbang,
                                                                startloadingtime: truck.startloadingtime,
                                                                selectedField: timeField,
                                                                status: truck.status
                                                            });
                                                            if (timeField) {
                                                                return <TimeTickerSimple startTime={timeField} status={truck.status} />;
                                                            } else {
                                                                return (
                                                                    <span className="ml-2 text-red-500 font-bold lg:text-xl sm:text-sm">
                                                                        Belum dimulai
                                                                    </span>
                                                                );
                                                            }
                                                        }
                                                        return (
                                                            <span className="ml-2 text-gray-400 font-bold lg:text-xl sm:text-sm">
                                                                -
                                                            </span>
                                                        );
                                                    })()}
                                                </div>
                                                <div className="flex-row">
                                                    <span className="font-medium text-gray-600 lg:text-2xl sm:text-sm">No. </span>
                                                    <span className="ml-2 text-black-700 font-mono lg:text-[2em] sm:text-sm">
                                                        {queueNumber}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                        {sortedAndFilteredTrucks.length > 0 && (
                            <div className="h-16"></div>
                        )}
                    </CardContent>
                </Card>
            </div>
            {/* Image Modal */}
            <Dialog open={!!zoomImage} onOpenChange={closeZoom}>
                {/* <DialogPortal> */}
                <DialogOverlay className="fixed inset-0 bg-black/80" />
                <DialogContent className="max-w-[70vw] max-h-[70vh] w-full h-full p-0 items-center justify-center flex bg-transparent border-none shadow-none">
                    <div className="relative w-full h-full flex items-center justify-center">
                        <button
                            onClick={closeZoom}
                            className="absolute top-4 right-4 z-50 bg-black/50 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-black/70 transition-all"
                            aria-label="Close zoom"
                        >
                            ✕
                        </button>
                        {zoomImage && (
                            <img
                                src={zoomImage.src}
                                alt={zoomImage.alt}
                                className="max-w-full max-h-full object-contain rounded-lg"
                                onError={(e) => {
                                    console.error('Failed to load zoomed image:', zoomImage.src);
                                }}
                            />
                        )}
                    </div>
                </DialogContent>
                {/* </DialogPortal> */}
            </Dialog>
        </>
    );
}