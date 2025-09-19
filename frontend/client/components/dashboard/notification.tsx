import {roleAccess} from "../../authentication/accessControl.tsx";
import {useUser} from "../../authentication/userContext.tsx";
import { useEffect, useRef } from "react";
import { useDashboardStore, setupLeavePermissionListener } from "@/store/dashboardStore";
import { useAudio } from "@/hooks/useAudio";

export default function NotificationCard() {
    const leavePermissions = useDashboardStore(state => state.leavePermissions);
    const { role } = useUser();
    const { playNotificationSound } = useAudio();
    const previousPendingCount = useRef<number>(0);
    const isInitialized = useRef<boolean>(false);
    
    let pending: any[] = [];
    if (role === "HR") {
        pending = leavePermissions.filter((e: any) => {
            // Exclude group members (they have "Group with [name]" in reason and are already approved)
            const isGroupMember = e.reason && e.reason.includes('(Group with ') && e.approval === 'approved';
            return e.statusFromHR === "pending" && !isGroupMember;
        });
    } else if (role === "Head Department") {
        pending = leavePermissions.filter((e: any) => {
            // Exclude group members (they have "Group with [name]" in reason and are already approved)
            const isGroupMember = e.reason && e.reason.includes('(Group with ') && e.approval === 'approved';
            return e.statusFromDepartment === "pending" && !isGroupMember;
        });
    } else if (role === "Director") {
        pending = leavePermissions.filter((e: any) => {
            // Exclude group members (they have "Group with [name]" in reason and are already approved)
            const isGroupMember = e.reason && e.reason.includes('(Group with ') && e.approval === 'approved';
            return e.statusFromDirector === "pending" && !isGroupMember;
        });
    }

    // Setup WebSocket listener on component mount
    useEffect(() => {
        setupLeavePermissionListener();
    }, []);

    // Play notification sound when new pending requests arrive
    useEffect(() => {
        const currentPendingCount = pending.length;
        
        // Only play sound if:
        // 1. Component has been initialized (not first render)
        // 2. Current count is greater than previous count (new requests)
        if (isInitialized.current && currentPendingCount > previousPendingCount.current) {
            playNotificationSound('warning'); // Use warning tone for pending approvals
            console.log(`🔔 Playing notification sound: ${currentPendingCount - previousPendingCount.current} new pending approval(s)`);
        }
        
        previousPendingCount.current = currentPendingCount;
        
        // Mark as initialized after first effect run
        if (!isInitialized.current) {
            isInitialized.current = true;
        }
    }, [pending.length, playNotificationSound]);

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