import { TruckIcon, ArrowLeft, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
interface CardDashboardTruckProps {
    getTypeStats: (type: string) => number;
    getDepartmentStats: (department: string) => number;
}
interface OperationStatsCardProps {
    muatStats: {
        total: number;
        pending: number;
        weighing: number;
        loading: number;
        finished: number;
    };
    bongkarStats: {
        total: number;
        pending: number;
        weighing: number;
        loading: number;
        finished: number;
    };
}
export function OperationStatsCard({ muatStats, bongkarStats }: OperationStatsCardProps) {
    return (
        <div className="flex flex-row gap-1 h-1/2">
            {/* Loading Trucks Card */}
            <div className="w-1/2">
                <Card className="h-full flex flex-col">
                    <CardHeader className="font-bold text-lg justify-center items-left">
                        <div className="flex flex-row gap-2 font-bold items-center">
                            <div className="w-7 h-7 rounded-full bg-green-200 flex items-center justify-center border">
                                <ArrowRight className="text-green-600 font-bold w-4 h-4" />
                            </div>
                            <div className="flex flex-col justify-center">
                                <span className="text-sm text-green-800">
                                    {" "}
                                    Loading Trucks / {" "} 
                                    <span className="italic opacity-70">
                                        Muat {" "}
                                    </span>
                                </span>
                                <span className="text-xs text-slate-500 font-medium">
                                    {" "}
                                    Operations Trucks{" "}
                                </span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardTitle>
                        <div className=" flex flex-col text-center">
                            <div className="text-[1.5em] text-green-600 font-bold">
                                {muatStats.total}
                            </div>
                            <div className="text-sm text-slate-400">Trucks Today</div>
                        </div>
                    </CardTitle>
                    <CardContent>
                        {/* Card Content */}
                        <div className="flex flex-row justify-center items-center mt-3 space-x-2">
                            <Card className="bg-yellow-100 w-[4vw] h-[6vh] flex justify-center items-center">
                                <div className="flex flex-col text-center">
                                    <span className="text-yellow-600 text-xs font-bold pb-1">
                                        {muatStats.pending}
                                    </span>
                                    <span className="text-yellow-600 text-xs pb-1">
                                        Pending
                                    </span>
                                </div>
                            </Card>
                            <Card className="bg-cyan-100 w-[4vw] h-[6vh] flex justify-center items-center">
                                <div className="flex flex-col text-center">
                                    <span className="text-cyan-600 text-xs font-bold pb-1">
                                        {muatStats.weighing}
                                    </span>
                                    <span className="text-cyan-600 text-xs pb-1">
                                        Weighing
                                    </span>
                                </div>
                            </Card>
                            <Card className="bg-blue-100 w-[4vw] h-[6vh] flex justify-center items-center">
                                <div className="flex flex-col text-center">
                                    <span className="text-blue-600 text-xs font-bold pb-1">
                                        {muatStats.loading}
                                    </span>
                                    <span className="text-blue-600 text-xs pb-1">
                                        Loading
                                    </span>
                                </div>
                            </Card>
                            <Card className="bg-green-100 w-[4vw] h-[6vh] flex justify-center items-center">
                                <div className="flex flex-col text-center">
                                    <span className="text-green-600 text-xs font-bold pb-1">
                                        {muatStats.finished}
                                    </span>
                                    <span className="text-green-600 text-xs pb-1">
                                        Finished
                                    </span>
                                </div>
                            </Card>
                        </div>
                    </CardContent>
                </Card>
            </div>
            {/* Unloading Trucks Card */}
            <div className="w-1/2">
                <Card className="h-full flex flex-col">
                    <CardHeader className="font-bold text-lg justify-center items-left">
                        <div className="flex flex-row gap-2 font-bold items-center">
                            <div className="w-7 h-7 rounded-full bg-red-200 flex items-center justify-center border">
                                <ArrowLeft className="text-red-600 font-bold w-4 h-4" />
                            </div>
                            <div className="flex flex-col justify-center">
                                <span className="text-sm text-red-800">
                                    {" "}
                                    Unloading Trucks / {" "}
                                    <span className="italic opacity-70">
                                        Bongkar {" "}
                                    </span>
                                </span>
                                <span className="text-xs text-slate-500 font-medium">
                                    {" "}
                                    Operations Trucks{" "}
                                </span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardTitle>
                        <div className=" flex flex-col text-center pa-3">
                            <div className="text-[1.5em] text-red-600 font-bold">
                                {bongkarStats.total}
                            </div>
                            <div className="text-sm text-slate-400">Trucks Today</div>
                        </div>
                    </CardTitle>
                    <CardContent>
                        {/* Card Content */}
                        <div className="flex justify-center items-center mt-3 space-x-2">
                            <Card className="bg-yellow-100 w-[4vw] h-[6vh] flex justify-center items-center">
                                <div className="flex flex-col text-center">
                                    <span className="text-yellow-600 text-xs font-bold pb-1">
                                        {bongkarStats.pending}
                                    </span>
                                    <span className="text-yellow-600 text-xs pb-1">
                                        Pending
                                    </span>
                                </div>
                            </Card>
                            <Card className="bg-cyan-100 w-[4vw] h-[6vh] flex justify-center items-center">
                                <div className="flex flex-col text-center">
                                    <span className="text-cyan-600 text-xs font-bold pb-1">
                                        {bongkarStats.weighing}
                                    </span>
                                    <span className="text-cyan-600 text-xs pb-1">
                                        Weighing
                                    </span>
                                </div>
                            </Card>
                            <Card className="bg-blue-100 w-[4vw] h-[6vh] flex justify-center items-center">
                                <div className="flex flex-col text-center">
                                    <span className="text-blue-600 text-xs font-bold pb-1">
                                        {bongkarStats.loading}
                                    </span>
                                    <span className="text-blue-600 text-xs pb-1">
                                        Loading
                                    </span>
                                </div>
                            </Card>
                            <Card className="bg-green-100 w-[4vw] h-[6vh] flex justify-center items-center">
                                <div className="flex flex-col text-center">
                                    <span className="text-green-600 text-xs font-bold pb-1">
                                        {bongkarStats.finished}
                                    </span>
                                    <span className="text-green-600 text-xs pb-1">
                                        Finished
                                    </span>
                                </div>
                            </Card>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
export function CardDashboardTruck({ getTypeStats, getDepartmentStats }: CardDashboardTruckProps) {
    // Get dynamic counts from getTypeStats function
    const internalCount = getTypeStats("internal");
    const externalCount = getTypeStats("external");
    
    return (
        <div className="flex flex-row gap-2 h-1/2">
            {/* Internal Trucks Card */}
            <div className="w-1/4">
                <Card className="relative w-full h-full overflow-hidden rounded-2xl shadow-md border">
                    <div className="absolute inset-0 bg-gradient-to-tl from-green-200 via-green-100 to-blue-200 [clip-path:polygon(100_0%, 100%_100%, 100%_0, 0_100%)]"></div>
                    {/* Internal section */}
                    <div className="absolute bottom-7 right-4 flex items-center gap-2">
                        <div>
                            <div className="text-green-700 text-sm font-semibold">Internal</div>
                            <div className="text-green-900 text-lg font-bold">
                                {internalCount} {""} 
                                <span className="font-semibold text-sm italic opacity-55">
                                    Trucks
                                </span>
                            </div>
                        </div>
                        <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center shadow">
                            <TruckIcon className="text-white w-3 h-3" />
                        </div>
                    </div>
                    
                    
                    {/* External section */}
                    <div className="absolute top-7 left-4 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center shadow">
                            <TruckIcon className="text-white w-3 h-3" />
                        </div>
                        <div className="text-right">
                            <div className="text-blue-700 text-sm font-semibold">External</div>
                            <div className="text-blue-900 text-lg font-bold">
                                {externalCount} {""}
                                <span className="font-semibold text-sm italic opacity-55">
                                    Trucks
                                </span>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
            {/* Department HPC */}
            <div className="w-1/4">
                <Card className="h-full flex flex-col">
                    <CardHeader className="flex-shrink-0 pb-1">
                        <div className="flex flex-row gap-1 font-bold items-center">
                            <div className="w-5 h-5 rounded-full bg-purple-200 flex items-center justify-center border">
                                <span className="text-purple-600 font-bold text-xs">
                                    H
                                </span>
                            </div>
                            <div className="flex flex-col justify-center">
                                <span className="text-xs text-purple-800">
                                    {" "}
                                    Dept. HPC{" "}
                                </span>
                                <span className="text-xs text-slate-500 font-medium">
                                    {" "}
                                    Destination{" "}
                                </span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardTitle className="flex-shrink-0 pb-1">
                        <div className="flex flex-col text-center">
                            <div className="text-lg text-purple-600 font-bold">
                                {getDepartmentStats("HPC")}
                            </div>
                            <div className="text-xs text-slate-400">Today</div>
                        </div>
                    </CardTitle>
                    <CardContent className="flex-1 flex items-center justify-center p-2">
                        <div className="w-full h-8 bg-purple-50 rounded flex items-center justify-center border border-purple-200">
                            <span className="text-purple-600 text-xs font-medium">
                                HPC
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>
            {/* Department PT */}
            <div className="w-1/4">
                <Card className="h-full flex flex-col">
                    <CardHeader className="flex-shrink-0 pb-1">
                        <div className="flex flex-row gap-1 font-bold items-center">
                            <div className="w-5 h-5 rounded-full bg-orange-200 flex items-center justify-center border">
                                <span className="text-orange-600 font-bold text-xs">
                                    P
                                </span>
                            </div>
                            <div className="flex flex-col justify-center">
                                <span className="text-xs text-orange-800">
                                    {" "}
                                    Dept. PT{" "}
                                </span>
                                <span className="text-xs text-slate-500 font-medium">
                                    {" "}
                                    Destination{" "}
                                </span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardTitle className="flex-shrink-0 pb-1">
                        <div className="flex flex-col text-center">
                            <div className="text-lg text-orange-600 font-bold">
                                {getDepartmentStats("PT")}
                            </div>
                            <div className="text-xs text-slate-400">Today</div>
                        </div>
                    </CardTitle>
                    <CardContent className="flex-1 flex items-center justify-center p-2">
                        <div className="w-full h-8 bg-orange-50 rounded flex items-center justify-center border border-orange-200">
                            <span className="text-orange-600 text-xs font-medium">
                                PT
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>
            {/* Department PBPG */}
            <div className="w-1/4">
                <Card className="h-full flex flex-col">
                    <CardHeader className="flex-shrink-0 pb-1">
                        <div className="flex flex-row gap-1 font-bold items-center">
                            <div className="w-5 h-5 rounded-full bg-teal-200 flex items-center justify-center border">
                                <span className="text-teal-600 font-bold text-xs">
                                    PP
                                </span>
                            </div>
                            <div className="flex flex-col justify-center">
                                <span className="text-xs text-teal-800">
                                    {" "}
                                    Dept. PBPG{" "}
                                </span>
                                <span className="text-xs text-slate-500 font-medium">
                                    {" "}
                                    Destination{" "}
                                </span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardTitle className="flex-shrink-0 pb-1">
                        <div className="flex flex-col text-center">
                            <div className="text-lg text-teal-600 font-bold">
                                {getDepartmentStats("PBPG")}
                            </div>
                            <div className="text-xs text-slate-400">Today</div>
                        </div>
                    </CardTitle>
                    <CardContent className="flex-1 flex items-center justify-center p-2">
                        <div className="w-full h-8 bg-teal-50 rounded flex items-center justify-center border border-teal-200">
                            <span className="text-teal-600 text-xs font-medium">
                                PBPG
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
