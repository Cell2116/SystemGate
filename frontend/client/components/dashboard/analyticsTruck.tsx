import React, { useState, useEffect } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import { getIndonesianDate } from "../../lib/timezone";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
    type ChartConfig,
} from "@/components/ui/chart";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { CalendarDays, TrendingUp, Truck, ArrowUpDown } from "lucide-react";
import { CombinedTruckData, useTrucksWithFetch } from "@/store/truckStore";
// Interface untuk data chart
interface TruckAnalyticsData {
    date: string;
    totalTrucks: number;
    loadingTrucks: number;
    unloadingTrucks: number;
    waitingTrucks: number;
    finishedTrucks: number;
    internalTrucks: number;
    externalTrucks: number;
}

interface TruckStatusData {
    name: string;
    value: number;
    color: string;
}

interface TruckOperationData {
    name: string;
    loading: number;
    unloading: number;
}
// Chart configuration
const chartConfig = {
    totalTrucks: {
        label: "Total Trucks",
        color: "#2563eb", // blue-600
    },
    loadingTrucks: {
        label: "Loading",
        color: "#10b981", // emerald-500
    },
    unloadingTrucks: {
        label: "Unloading",
        color: "#fbbf24", // red-500
    },
    waitingTrucks: {
        label: "Waiting",
        color: "#f59e0b", // amber-500
    },
    finishedTrucks: {
        label: "Finished",
        color: "#8b5cf6", // violet-500
    },
    internalTrucks: {
        label: "Internal",
        color: "#059669", // emerald-600
    },
    externalTrucks: {
        label: "External",
        color: "#dc2626", // red-600
    },
} satisfies ChartConfig;
// Status colors untuk pie chart
const STATUS_COLORS = [
    "#10b981", // green - finished
    "#3b82f6", // blue - loading
    "#f59e0b", // yellow - waiting
    "#ef4444", // red - other
];

export default function AnalyticsTruck() {
    const [dateRange, setDateRange] = useState({
        from: getIndonesianDate(-7), // 7 days ago in Indonesian timezone
        to: getIndonesianDate(0), // today in Indonesian timezone
    });
    const { trucks, loading, error, refetch } = useTrucksWithFetch({
        dateFrom: dateRange.from,
        dateTo: dateRange.to,
    });
    
    const processAnalyticsData = (
        trucks: CombinedTruckData[],
    ): TruckAnalyticsData[] => {
        const dateMap = new Map<string, TruckAnalyticsData>();
        trucks.forEach((truck) => {
            const date = truck.date || getIndonesianDate();
            if (!dateMap.has(date)) {
                dateMap.set(date, {
                    date,
                    totalTrucks: 0,
                    loadingTrucks: 0,
                    unloadingTrucks: 0,
                    waitingTrucks: 0,
                    finishedTrucks: 0,
                    internalTrucks: 0,
                    externalTrucks: 0,
                });
            }
            const dayData = dateMap.get(date)!;
            dayData.totalTrucks++;
            
            if (truck.operation === "muat") {
                dayData.loadingTrucks++;
            } else if (truck.operation === "bongkar") {
                dayData.unloadingTrucks++;
            }
            
            const status = truck.status.toLowerCase();
            if (status === "waiting" || status === "pending") {
                dayData.waitingTrucks++;
            } else if (status === "loading") {
                
            } else if (status === "finished") {
                dayData.finishedTrucks++;
            }
            
            if (truck.type === "Inbound" || truck.type === "internal") {
                dayData.internalTrucks++;
            } else {
                dayData.externalTrucks++;
            }
        });
        return Array.from(dateMap.values()).sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        );
    };
    
    const processStatusData = (trucks: CombinedTruckData[]): TruckStatusData[] => {
        const statusCount = trucks.reduce(
            (acc, truck) => {
                const status = truck.status.toLowerCase();
                let normalizedStatus = status;
                if (status === "pending") normalizedStatus = "waiting";
                if (status === "loading") normalizedStatus = "loading";
                if (status === "finished") normalizedStatus = "finished";
                acc[normalizedStatus] = (acc[normalizedStatus] || 0) + 1;
                return acc;
            },
            {} as Record<string, number>,
        );
        return Object.entries(statusCount).map(([name, value], index) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            value,
            color: STATUS_COLORS[index % STATUS_COLORS.length],
        }));
    };
    
    const processOperationData = (
        trucks: CombinedTruckData[],
    ): TruckOperationData[] => {
        const dateMap = new Map<
            string,
            { loading: number; unloading: number }
        >();
        trucks.forEach((truck) => {
            const date = truck.date || new Date().toISOString().split("T")[0];
            if (!dateMap.has(date)) {
                dateMap.set(date, { loading: 0, unloading: 0 });
            }
            const dayData = dateMap.get(date)!;
            if (truck.operation === "muat") {
                dayData.loading++;
            } else if (truck.operation === "bongkar") {
                dayData.unloading++;
            }
        });
        return Array.from(dateMap.entries()).map(([date, data]) => ({
            name: new Date(date).toLocaleDateString("id-ID", {
                month: "short",
                day: "numeric",
            }),
            ...data,
        }));
    };
    const analyticsData = processAnalyticsData(trucks);
    const statusData = processStatusData(trucks);
    const operationData = processOperationData(trucks);
    
    const totalTrucks = trucks.length;
    const avgTrucksPerDay =
        analyticsData.length > 0
            ? Math.round(totalTrucks / analyticsData.length)
            : 0;
    const peakDay = analyticsData.reduce(
        (max, current) =>
            current.totalTrucks > max.totalTrucks ? current : max,
        analyticsData[0] || { totalTrucks: 0, date: "" },
    );
    const handleDateRangeChange = (field: "from" | "to", value: string) => {
        setDateRange((prev) => ({
            ...prev,
            [field]: value,
        }));
    };
    const handleRefresh = () => {
        refetch();
    };
    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        );
    }
    if (error) {
        return (
            <div className="text-center p-8">
                <p className="text-red-600 mb-4">
                    Error loading analytics: {error}
                </p>
                <Button onClick={handleRefresh}>Try Again</Button>
            </div>
        );
    }
    return (
        <div className="space-y-6">
            {/* Header dengan Date Range Selector */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <p className="text-gray-600 mt-1">
                        Analysis of truck operations from{" "}
                        {new Date(dateRange.from).toLocaleDateString()} to{" "}
                        {new Date(dateRange.to).toLocaleDateString()}
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" />
                        <input
                            type="date"
                            value={dateRange.from}
                            onChange={(e) =>
                                handleDateRangeChange("from", e.target.value)
                            }
                            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                        <span className="text-gray-500">to</span>
                        <input
                            type="date"
                            value={dateRange.to}
                            onChange={(e) =>
                                handleDateRangeChange("to", e.target.value)
                            }
                            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                    </div>
                    <Button onClick={handleRefresh} size="sm">
                        Refresh
                    </Button>
                </div>
            </div>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Truck className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">
                                    Total Trucks
                                </p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {totalTrucks}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <TrendingUp className="h-6 w-6 text-green-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">
                                    Avg/Day
                                </p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {avgTrucksPerDay}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <ArrowUpDown className="h-6 w-6 text-purple-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">
                                    Peak Day
                                </p>
                                <p className="text-lg font-bold text-gray-900">
                                    {peakDay?.totalTrucks || 0}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {peakDay?.date
                                        ? new Date(
                                              peakDay.date,
                                          ).toLocaleDateString()
                                        : "-"}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <CalendarDays className="h-6 w-6 text-orange-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">
                                    Active Days
                                </p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {analyticsData.length}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            {/* Charts */}
            <Tabs defaultValue="daily-trend" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="daily-trend">Daily Trend</TabsTrigger>
                    <TabsTrigger value="status-breakdown">
                        Status Breakdown
                    </TabsTrigger>
                    {/* <TabsTrigger value="operation-comparison">
                        Operation Comparison
                    </TabsTrigger> */}
                </TabsList>
                <TabsContent value="daily-trend" className="space-y-4">
                    <Card className="flex flex-col">
                        <CardHeader className="flex items-start">
                            <CardTitle>Daily Truck Count Trend</CardTitle>
                            <CardDescription>
                                Number of trucks by date with operation
                                breakdown
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex items-center justify-center">
                            <ChartContainer
                                config={chartConfig}
                                className="h-[50vh]"
                            >
                                <LineChart data={analyticsData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={(value) =>
                                            new Date(value).toLocaleDateString(
                                                "id-ID",
                                                {
                                                    month: "short",
                                                    day: "numeric",
                                                },
                                            )
                                        }
                                    />
                                    <YAxis
                                        tickCount={10}
                                        domain={[0, "dataMax + 2"]}
                                        allowDecimals={false}
                                    />
                                    <ChartTooltip
                                        content={<ChartTooltipContent />}
                                    />
                                    <ChartLegend
                                        content={<ChartLegendContent />}
                                    />
                                    {/* <Line
                                        type="monotone"
                                        dataKey="totalTrucks"
                                        stroke="#2563eb"
                                        strokeWidth={3}
                                        dot={{
                                            fill: "#2563eb",
                                            strokeWidth: 1,
                                            r: 1,
                                        }}
                                        activeDot={{
                                            r: 6,
                                            stroke: "#2563eb",
                                            strokeWidth: 2,
                                        }}
                                    /> */}
                                    <Line
                                        type="monotone"
                                        dataKey="loadingTrucks"
                                        stroke="#10b981"
                                        strokeWidth={2}
                                        dot={{
                                            fill: "#10b981",
                                            strokeWidth: 2,
                                            r: 3,
                                        }}
                                        activeDot={{
                                            r: 5,
                                            stroke: "#10b981",
                                            strokeWidth: 2,
                                        }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="unloadingTrucks"
                                        stroke="#fbbf24"
                                        strokeWidth={2}
                                        dot={{
                                            fill: "#fbbf24",
                                            strokeWidth: 2,
                                            r: 3,
                                        }}
                                        activeDot={{
                                            r: 5,
                                            stroke: "#fbbf24",
                                            strokeWidth: 2,
                                        }}
                                    />
                                </LineChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="status-breakdown" className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Truck Status Distribution</CardTitle>
                                <CardDescription>
                                    Current status of all trucks in the selected
                                    period
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ChartContainer
                                    config={chartConfig}
                                    className="h-[40vh]"
                                >
                                    <PieChart>
                                        <Pie
                                            data={statusData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) =>
                                                `${name} ${(percent * 100).toFixed(0)}%`
                                            }
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {statusData.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={entry.color}
                                                />
                                            ))}
                                        </Pie>
                                        <ChartTooltip
                                            content={<ChartTooltipContent />}
                                        />
                                    </PieChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Vehicle Type Distribution</CardTitle>
                                <CardDescription>
                                    Internal vs External vehicles
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ChartContainer
                                    config={chartConfig}
                                    className="h-[40vh] w-[30vw]"
                                >
                                    <BarChart data={analyticsData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis
                                            dataKey="date"
                                            tickFormatter={(value) =>
                                                new Date(
                                                    value,
                                                ).toLocaleDateString("id-ID", {
                                                    month: "short",
                                                    day: "numeric",
                                                })
                                            }
                                        />
                                        <YAxis
                                            tickCount={10}
                                            domain={[0, "dataMax + 2"]}
                                            allowDecimals={false}
                                        />
                                        <ChartTooltip
                                            content={<ChartTooltipContent />}
                                        />
                                        <ChartLegend
                                            content={<ChartLegendContent />}
                                        />
                                        <Bar
                                            dataKey="internalTrucks"
                                            stackId="a"
                                            fill="#059669"
                                        />
                                        <Bar
                                            dataKey="externalTrucks"
                                            stackId="a"
                                            fill="#dc2626"
                                        />
                                    </BarChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
                {/* <TabsContent value="operation-comparison" className="space-y-4">
                    <Card className="flex flex-col">
                        <CardHeader className="flex items-start">
                            <CardTitle>
                                Loading vs Unloading Operations
                            </CardTitle>
                            <CardDescription>
                                Comparison of loading and unloading operations
                                by date
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex items-center justify-center">
                            <ChartContainer
                                config={chartConfig}
                                className="h-[400px]"
                            >
                                <BarChart data={operationData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis 
                                        tickCount={10}
                                        domain={[0, 'dataMax + 2']}
                                        allowDecimals={false}
                                    />
                                    <ChartTooltip
                                        content={<ChartTooltipContent />}
                                    />
                                    <ChartLegend
                                        content={<ChartLegendContent />}
                                    />
                                    <Bar
                                        dataKey="loading"
                                        fill="#10b981"
                                    />
                                    <Bar
                                        dataKey="unloading"
                                        fill="#ef4444"
                                    />
                                </BarChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                </TabsContent> */}
            </Tabs>
        </div>
    );
}
