import { roleAccess } from "../../authentication/accessControl.tsx";
import { useUser } from "../../authentication/userContext.tsx";
import { useEffect, useRef, useState } from "react";
import { useDashboardStore, setupLeavePermissionListener } from "@/store/dashboardStore";
import { useAudio } from "@/hooks/useAudio";
import RoutingService from "@/services/routingService";

interface User {
    name: string;
    department: string;
    role: string;
    no_hp?: string;
}

interface NotificationItem {
    id: string | number;
    name: string;
    department: string;
    role: string;
    date: string;
    reason?: string;
    approval?: string;
    statusFromHR?: string;
    statusFromDepartment?: string;
    statusFromDirector?: string;
}

export default function NotificationCard() {
    const leavePermissions = useDashboardStore(state => state.leavePermissions);
    const { role } = useUser();
    const { playNotificationSound } = useAudio();
    const previousPendingCount = useRef<number>(0);
    const isInitialized = useRef<boolean>(false);
    const [pendingRoutingEntries, setPendingRoutingEntries] = useState<NotificationItem[]>([]);
    const formatDate = (isoString: string): string => {
        const date = new Date(isoString);
        const pad = (n: number) => String(n).padStart(2, "0");
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} `;
    };
    const formatTime = (isoString: string): string => {
        if (!isoString) return 'Not set';
        const dateTimeStr = isoString.replace('T', ' ').split('.')[0]; 
        if (dateTimeStr.includes(' ')) {
            const timePart = dateTimeStr.split(' ')[1];
            return timePart || 'Not set';
        }
        const date = new Date(isoString);
        if (!isNaN(date.getTime())) {
            const pad = (n: number) => String(n).padStart(2, "0");
            return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
        }
        return isoString;
    };
    const fetchPendingRoutingEntries = async () => {
        const storedUser = localStorage.getItem("user");
        if (!storedUser) return;
        const currentUser = JSON.parse(storedUser);
        if (!currentUser.name) return;
        try {
            const pendingRequests = await RoutingService.getPendingRequestsForApprover(currentUser.name);
            if (Array.isArray(pendingRequests)) {
                const filteredRequests = pendingRequests.filter((entry: NotificationItem) => {
                    const isGroupMember = entry.reason && entry.reason.includes('(Group with ') && entry.approval === 'approved';
                    return !isGroupMember;
                });
                setPendingRoutingEntries(filteredRequests);
            } else {
                console.warn('⚠️ Routing service did not return an array for notifications:', pendingRequests);
                setPendingRoutingEntries([]);
            }
        } catch (error) {
            console.error('Error fetching pending routing entries for notifications:', error);
            setPendingRoutingEntries([]);
        }
    };
    let pending: NotificationItem[] = [];

    if (role === "HR" || role === "Head Department") {
        pending = pendingRoutingEntries;
    } else if (role === "Director") {
        pending = leavePermissions.filter((e: NotificationItem) => {
            const isGroupMember = e.reason && e.reason.includes('(Group with ') && e.approval === 'approved';
            return e.statusFromDirector === "pending" && !isGroupMember;
        });
    }

    useEffect(() => {
        setupLeavePermissionListener();
    }, []);

    useEffect(() => {
        if (role === "HR" || role === "Head Department") {
            fetchPendingRoutingEntries();
        }
    }, [role, leavePermissions]);

    useEffect(() => {
        const currentPendingCount = pending.length;
        if (isInitialized.current && currentPendingCount > previousPendingCount.current) {
            playNotificationSound('warning');
            
            // Optional: Send WhatsApp notification from frontend
            // sendWhatsAppNotification();
        }
        previousPendingCount.current = currentPendingCount;
        if (!isInitialized.current) {
            isInitialized.current = true;
        }
    }, [pending.length, playNotificationSound]);

    // WhatsApp notification function for frontend
    // const sendWhatsAppNotification = async () => {
    //     try {
    //         const newNotifications = pending.slice(previousPendingCount.current);
    //         if (newNotifications.length > 0) {
    //             // Get relevant phone numbers based on roles
    //             const phoneNumbers: string[] = [];

    //             for (const notification of newNotifications) {
    //                 try {
    //                     const response = await fetch(`/users/department/${notification.department}`);
    //                     const users = await response.json() as User[];

    //                     // Filter users based on role and get their phone numbers
    //                     const relevantUsers = users.filter((user: User) => {
    //                         if (notification.statusFromHR === "pending" && user.role === "HR") return true;
    //                         if (notification.statusFromDepartment === "pending" && user.role === "Head Department") return true;
    //                         if (notification.statusFromDirector === "pending" && user.role === "Director") return true;
    //                         return false;
    //                     });

    //                     // Add phone numbers to the array, filter out undefined values
    //                     const validPhoneNumbers = relevantUsers
    //                         .map((user: User) => user.no_hp)
    //                         .filter((number): number is string => number !== undefined && number !== null);
    //                     phoneNumbers.push(...validPhoneNumbers);
    //                 } catch (error) {
    //                     console.error('Error fetching user phone numbers:', error);
    //                 }
    //             }
    //             const uniquePhoneNumbers = [...new Set(phoneNumbers)];

    //             if (uniquePhoneNumbers.length > 0) {
    //                 const message = `🔔 ${newNotifications.length} new leave permission(s) require approval\n\n` +
    //                     newNotifications.map(item =>
    //                         `• ${item.name} (${item.department}) - ${formatDate(item.date)}`
    //                     ).join('\n');

    //                 const response = await fetch('/api/whatsapp/send', {
    //                     method: 'POST',
    //                     headers: { 'Content-Type': 'application/json' },
    //                     body: JSON.stringify({
    //                         message,
    //                         phoneNumbers: uniquePhoneNumbers
    //                     })
    //                 });

    //                 if (response.ok) {
    //                     console.log('WhatsApp notification sent to users:', uniquePhoneNumbers);
    //                 }
    //             } else {
    //                 console.warn('No valid phone numbers found for notifications');
    //             }
    //         }
    //     } catch (error) {
    //         console.error('Error sending WhatsApp notification:', error);
    //     }
    // };
    return (
        <div className="bg-white rounded-xl shadow p-4">
            <div className="font-bold text-base mb-2">Notifications</div>
            {pending.length === 0 ? (
                <div className="text-gray-500 text-sm text-center py-4">No approval requests.</div>
            ) : (
                <ul className="divide-y divide-gray-200 max-h-60 overflow-y-auto">
                    {pending.map((item: NotificationItem) => (
                        <li key={item.id} className="py-2 flex flex-col gap-1">
                            <span className="font-medium">{item.name}</span>
                            <span className="text-xs text-gray-500">{item.department} - {item.role}</span>
                            <span className="text-xs text-gray-400">{formatDate(item.date)}</span>
                            <span className="text-xs text-blue-600">Needs your approval</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}