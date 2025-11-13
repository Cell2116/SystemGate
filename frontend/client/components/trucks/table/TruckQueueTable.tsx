import { ArrowLeft, ArrowRight, Logs } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableHeader, TableRow, TableCell, TableHead } from "@/components/ui/table";
import { useTrucksWithFetch } from "@/store/truckStore";
import { useState } from "react"
export function TrucksQueue() {
    const [ selectedDepartment, setSelectedDepartment ] = useState("HPC");
    const {
        trucks: allTrucks,
        loading: trucksLoading,
        error: trucksError,
        refetch: refetchTrucks,
        createTruck,
        updateTruckAPI,
    } = useTrucksWithFetch({});
    
    const trucks = allTrucks || [];
    const getTodayData = new Date().toISOString().split('T')[0];
    const filteredTrucks = trucks.filter(
        truck => truck.department === selectedDepartment &&
        new Date(truck.date).toISOString().split('T')[0] === getTodayData
    ); 
    return (
        <div className="h-full">
            <Card className="h-full flex flex-col">
                <CardHeader className="font-bold text-lg">
                    <div className="flex flex-row justify-between items-center w-full">
                        <div className="flex-1"></div>
                        <div className="flex flex-row gap-2 font-bold items-center">
                            <div className="flex flex-col justify-center">
                                <span className="text-sm text-blue-800">
                                    {" "}
                                    Trucks in Queue / {" "}
                                    <span className="italic opacity-70">
                                        Antrian Truk {" "}
                                    </span>
                                </span>
                            </div>
                            <div className="w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center border">
                                <Logs className="text-blue-600 font-bold w-4 h-4" />
                            </div>
                        </div>
                        <div className="flex-1 flex justify-end">
                            <select
                            id= "department"
                            value={selectedDepartment}
                            onChange={(e) => setSelectedDepartment(e.target.value)}
                            className="h-8 border border-gray-300 rounded-md px-2 bg-background text-slate-500 opacity-75 text-xs focus:border-blue-500 focus:outline-none w-[5em]"
                            >
                                <option value="HPC" className="text-slate-500 opacity-75 text-xs">HPC</option>
                                <option value="PBPG" className="text-slate-500 opacity-75 text-xs">PBPG</option>
                                <option value="PT" className="text-slate-500 opacity-75 text-xs">PT</option>
                            </select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 p-4 min-h-0">
                    {/* Card Content */}
                    <div className="h-full w-full">
                        <div className="h-full overflow-x-auto overflow-y-auto border rounded-md scrollbar-hide">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-xs md:text-xs">Id</TableHead>
                                        <TableHead className="text-xs md:text-xs">
                                            Plate/Driver
                                        </TableHead>
                                        <TableHead className="text-xs md:text-xs">
                                            Supplier
                                        </TableHead>
                                        <TableHead className="text-xs md:text-xs">
                                            Operation
                                        </TableHead>
                                        <TableHead className="text-xs md:text-xs">
                                            Truck Status
                                        </TableHead>
                                        <TableHead className="text-xs md:text-xs">
                                            Progress
                                        </TableHead>
                                        <TableHead className="text-xs md:text-xs">
                                            Goods
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody >
                                    {filteredTrucks
                                        .filter(
                                            (truck) =>
                                                truck.status === "waiting" ||
                                                truck.status === "loading",
                                        )
                                        .sort((a, b) => {
                                            // Loading First then the Waiting status
                                            if (a.status !== b.status) {
                                                if (a.status === "loading") return -1;
                                                if (b.status === "loading") return 1;
                                            }
                                            // Sorting by id 
                                            return a.id.localeCompare(b.id);
                                        })
                                        .map((truck) => (
                                            <TableRow key={truck.id}>
                                                <TableCell>
                                                    {" "}
                                                    <div className="text-xs">{truck.id}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-semibold text-xs">
                                                            {truck.platenumber}
                                                        </div>
                                                        <div className="font-light text-xs">
                                                            {truck.driver}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-xs">{truck.supplier}</div>
                                                </TableCell>
                                                <TableCell>
                                                    {truck.operation === "bongkar" && (
                                                        <div className="rounded-full flex bg-red-100 text-red-700 text-xs font-bold px-2 py-1 w-fit mx-auto">
                                                            <ArrowLeft className="w-3 h-3 mr-1" />
                                                            Bongkar
                                                        </div>
                                                    )}
                                                    {truck.operation === "muat" && (
                                                        <div className="rounded-full flex bg-green-100 text-green-700 text-xs font-bold px-2 py-1 w-fit mx-auto">
                                                            <ArrowRight className="w-3 h-3 mr-1" />
                                                            Muat
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {truck.type === "Inbound" && (
                                                        <div className="rounded-full flex bg-green-50 text-green-500 text-xs font-bold px-2 py-1 w-fit mx-auto">
                                                            Internal
                                                        </div>
                                                    )}
                                                    {truck.type === "Outbound" && (
                                                        <div className="rounded-full flex bg-red-50 text-red-500 text-xs font-bold px-2 py-1 w-fit mx-auto">
                                                            External
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {truck.status === "waiting" && (
                                                        <div className="rounded-full flex bg-yellow-100 text-yellow-700 font-bold text-xs px-2 py-1 w-fit mx-auto">
                                                            {truck.status.charAt(0).toUpperCase() +
                                                                truck.status.slice(1)}
                                                        </div>
                                                    )}
                                                    {truck.status === "loading" && (
                                                        <div className="rounded-full flex bg-blue-100 text-blue-700 font-bold text-xs px-2 py-1 w-fit mx-auto">
                                                            {truck.status.charAt(0).toUpperCase() +
                                                                truck.status.slice(1)}
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-xs">{truck.goods}</div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
