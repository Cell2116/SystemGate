import Clock2 from "../components/dashboard/clock"
import { PackageOpen } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { useDashboardStore } from "@/store/dashboardStore"

export default function LoadingTrucks(){
    return(
        <div className="relative h-[calc(80vh-1rem)]">
            <div className="absolute right-1">
                <Clock2/>
            </div>
            <div>
            
            </div>
        </div>
    )
}