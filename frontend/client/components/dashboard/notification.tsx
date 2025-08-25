import {roleAccess} from "../../authentication/accessControl.tsx";
import {useUser} from "../../authentication/userContext.tsx";
import { useEffect } from "react";
import { useDashboardStore } from "@/store/dashboardStore";

export default function NotificationCard() {
    const leavePermissions = useDashboardStore(state => state.leavePermissions);
    const { role } = useUser();
    let pending: any[] = [];
    if (role === "HR") {
        pending = leavePermissions.filter((e: any) => e.statusFromHR === "pending");
    } else if (role === "Head Department") {
        pending = leavePermissions.filter((e: any) => e.statusFromDepartment === "pending");
    } else if (role === "Director") {
        pending = leavePermissions.filter((e: any) => e.statusFromDirector === "pending");
    }
    return (
    <div className="bg-white rounded-xl shadow p-4">
        <div className="font-bold text-base mb-2">Notifications</div>
        {pending.length === 0 ? (
        <div className="text-gray-500 text-sm text-center py-4">No approval requests.</div>
        ) : (
        <ul className="divide-y divide-gray-200 max-h-60 overflow-y-auto">
            {pending.map((item: any) => (
            <li key={item.id} className="py-2 flex flex-col gap-1">
                <span className="font-medium">{item.name}</span>
                <span className="text-xs text-gray-500">{item.department} - {item.role}</span>
                <span className="text-xs text-gray-400">{item.date}</span>
                <span className="text-xs text-blue-600">Needs your approval</span>
            </li>
            ))}
        </ul>
        )}
    </div>
    );
}