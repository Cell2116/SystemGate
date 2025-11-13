import axios from 'axios';

interface PendingLeaveRequest {
    id: number;
    name: string;
    department: string;
    role: string;
    licenseplate?: string;
    licensePlate?: string;
    date: string;
    exittime: string;
    returntime: string;
    reason: string;
    statusfromdept?: string;
    statusfromhr?: string;
    statusfromdirector?: string;
    approval?: string;
    submittedat: string;
    approval_level1_name?: string;
    approval_level1_role?: string;
    approval_level2_name?: string;
    approval_level2_role?: string;
    approval_level3_name?: string;
    approval_level3_role?: string;
    approver_level?: number;
}

interface RoutingConfig {
    id: number;
    department: string;
    employee_name?: string;
    role: string;
    approval_level1_name?: string;
    approval_level1_role?: string;
    approval_level2_name?: string;
    approval_level2_role?: string;
    approval_level3_name?: string;
    approval_level3_role?: string;
    is_active: boolean;
}

export class RoutingService {
    // private static baseURL = "http://192.168.4.108:3000";
    private static baseURL = import.meta.env.VITE_API_BASE_URL;
    /**
     * Get pending leave requests for a specific approver
     */
    static async getPendingRequestsForApprover(approverName: string): Promise<PendingLeaveRequest[]> {
        try {
            const response = await axios.get(`${this.baseURL}/leave-permission/pending-for/${encodeURIComponent(approverName)}`);
            // Check if the response has the expected structure
            if (response.data && response.data.success && response.data.pendingRequests) {
                return response.data.pendingRequests || [];
            }

            // Fallback for different response structures
            if (Array.isArray(response.data)) {
                return response.data;
            }

            console.warn('⚠️ Unexpected response structure from pending requests API:', response.data);
            return [];
        } catch (error) {
            console.error(`❌ Error fetching pending requests for ${approverName}:`, error);
            return [];
        }
    }

    /**
     * Get routing configuration for a department and role
     */
    static async getRoutingConfig(department: string, role: string, employeeName?: string): Promise<RoutingConfig | null> {
        try {
            const params = new URLSearchParams();
            if (employeeName) {
                params.append('employeeName', employeeName);
            }

            const response = await axios.get(`${this.baseURL}/routing/${encodeURIComponent(department)}/${encodeURIComponent(role)}?${params}`);
            return response.data;
        } catch (error) {
            console.error(`❌ Error fetching routing config for ${department}/${role}:`, error);
            return null;
        }
    }

    /**
     * Approve or reject a leave request through routing system
     */
    static async processRoutingApproval(
        leaveId: number,
        approverName: string,
        action: 'approved' | 'rejected',
        notes?: string
    ): Promise<boolean> {
        try {
            const response = await axios.put(`${this.baseURL}/leave-permission/${leaveId}/routing-approval`, {
                approverName,
                action,
                notes
            });
            return response.data.success === true;
        } catch (error) {
            console.error(`❌ Error processing routing approval:`, error);
            return false;
        }
    }

    /**
     * Helper method to check if a user can approve based on current user info
     * This replaces the hardcoded logic by calling the backend API
     */
    static async canUserApprove(userName: string, userRole: string): Promise<PendingLeaveRequest[]> {
        try {
            // Simply call the backend API which already handles all the routing logic
            return await this.getPendingRequestsForApprover(userName);
        } catch (error) {
            console.error(`❌ Error checking approval permissions for ${userName}:`, error);
            return [];
        }
    }
}

export default RoutingService;