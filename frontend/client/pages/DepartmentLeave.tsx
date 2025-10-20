import RoutingService from "../services/routingService";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Autocomplete } from "@/components/ui/autocomplete";
import { EmployeeAutocomplete } from "@/components/ui/employee-autocomplete";
import Clock2 from "../components/dashboard/clock"
import { Plus, Send, Sparkles, Zap, Eye, Calendar, Clock, User, MoreHorizontal, FileText, X, Shield, Crown, Building, BookUser, RefreshCw, Users, MapPin } from "lucide-react";

import { useDashboardStore } from "@/store/dashboardStore";
import { initWebSocket, onMessage, closeWebSocket, onConnectionChange, onDataChange } from "@/lib/ws";

interface User {
  name: string;
  department: string;
  role: string;
}

export default function DepartmentHead() {

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const leavePermissions = useDashboardStore(state => state.leavePermissions);
  const records = useDashboardStore(state => state.records);
  const users = useDashboardStore(state => state.users);
  const fetchLeavePermission = useDashboardStore(state => state.fetchLeavePermission);
  const fetchRecords = useDashboardStore(state => state.fetchRecords);
  const fetchUsers = useDashboardStore(state => state.fetchUsers);
  const fetchUsersByDepartment = useDashboardStore(state => state.fetchUsersByDepartment);
  const addLeavePermission = useDashboardStore(state => state.addLeavePermission);
  const loading = useDashboardStore(state => state.loading);
  const error = useDashboardStore(state => state.error);
  const updateLeavePermission = useDashboardStore(state => state.updateLeavePermission);
  const [employees, setEmployees] = useState<any[]>([]);
  const [pendingRoutingEntries, setPendingRoutingEntries] = useState<any[]>([]);
  const [hiddenEntries, setHiddenEntries] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('departmentLeaveHiddenEntries');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [isGroupLeave, setIsGroupLeave] = useState(false);
  const [selectedColleagues, setSelectedColleagues] = useState<any[]>([]);
  const [availableColleagues, setAvailableColleagues] = useState<any[]>([]);
  const [colleagueSearch, setColleagueSearch] = useState("");

  useEffect(() => {
    let mounted = true;
    let unsubscribeDataChange: (() => void) | null = null;
    let unsubscribeLeaveChange: (() => void) | null = null;
    unsubscribeDataChange = onDataChange('attendance', (data) => {
      if (!mounted) return;
      setTimeout(() => {
        if (mounted) fetchLeavePermission();
      }, 100);
    });
    unsubscribeLeaveChange = onDataChange('leave_permission', (data) => {
      if (!mounted) return;
      setTimeout(() => {
        if (mounted) fetchLeavePermission();
      }, 100);
    });
    fetchLeavePermission();
    fetchRecords();
    fetchUsers();
    return () => {
      mounted = false;
      if (unsubscribeDataChange) unsubscribeDataChange();
      if (unsubscribeLeaveChange) unsubscribeLeaveChange();
    };
  }, [fetchLeavePermission, fetchRecords, fetchUsers, fetchUsersByDepartment]);

  const fetchPendingRoutingEntries = async () => {
    if (!currentUser?.name) return;

    try {
      // Use the new routing service instead of hardcoded logic
      const pendingRequests = await RoutingService.getPendingRequestsForApprover(currentUser.name);

      // Ensure we always set an array, even if the API returns something else
      if (Array.isArray(pendingRequests)) {
        setPendingRoutingEntries(pendingRequests);
      } else {
        console.warn('⚠️ getPendingRequestsForApprover did not return an array:', pendingRequests);
        setPendingRoutingEntries([]);
      }
    } catch (error) {
      console.error('Error fetching pending routing entries for Head Department:', error);
      setPendingRoutingEntries([]);
    }
  };

  useEffect(() => {
    if (currentUser?.name) {
      fetchPendingRoutingEntries();
    }
  }, [currentUser]);
  useEffect(() => {
    if (currentUser?.department) {
      // Always fetch all users for cross-department group leave capability
      fetchUsers().then(() => {
        const allUsers = useDashboardStore.getState().users;
        const employeeSuggestions = allUsers.map(user => ({
          name: user.name,
          department: user.department,
          licensePlate: user.licenseplate,
          uid: user.uid,
          role: user.role
        }));
        setEmployees(employeeSuggestions);
      });
    }
  }, [currentUser, fetchUsers]);

  useEffect(() => {
    const loadUserFromStorage = () => {
      try {
        const storedUser = localStorage.getItem("user");
        const storedRole = localStorage.getItem("userRole");
        const isLoggedIn = localStorage.getItem("isLoggedIn");
        if (!isLoggedIn || isLoggedIn !== "true") {
          console.error("User not logged in");
          return;
        }
        if (storedUser && storedRole) {
          const parsedUser = JSON.parse(storedUser);
          if (storedRole === "Head Department" || parsedUser.role === "Head Department") {
            setCurrentUser({
              name: parsedUser.name,
              department: parsedUser.department,
              role: "Head Department",
            });
          } else {
            console.error("User is not a Head Department. Current role:", storedRole);
          }
        } else {
          console.error("No user data found in localStorage");
        }
      } catch (error) {
        console.error("Error loading user from localStorage:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadUserFromStorage();
  }, []);
  const [formData, setFormData] = useState({
    name: "",
    licensePlate: "",
    department: "",
    role: "",
    date: "",
    exitTime: "",
    returnTime: "",
    reason: "",
    reasonType: "",
    outsideReason: "",
  });


  useEffect(() => {
    if (employees.length > 0 && formData.name) {
      const colleagues = employees.filter(emp =>
        emp.name !== formData.name
      );
      setAvailableColleagues(colleagues);
    } else {
      setAvailableColleagues(employees);
    }
  }, [employees, formData.name]);

  useEffect(() => {
    if (currentUser) {
      setFormData(prev => ({
        ...prev,
        department: currentUser.department,
        role: currentUser.role,
        name: currentUser.name,
      }));
    }
  }, [currentUser]);


  const getPendingRoutingEntries = () => {
    return pendingRoutingEntries;
  };
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
  const getApprovalDepartments = (userDepartment: string) => {
    const departmentHierarchyFinance: Record<string, string[]> = {
      "Finance": [
        "Invoicing",
        "Purchasing",
        "Accounting",
        "Corporate Secretary",
        "Collector",
        "Audit Internal",
        "Administrasi",
        "Finance"
      ],
    };
    const departmentHierarchyPPIC: Record<string, string[]> = {
      "PPIC - PC": [
        "PPIC - HC",
        "PPIC - PC"
      ],
    };

    return departmentHierarchyFinance[userDepartment] || departmentHierarchyPPIC[userDepartment] || [userDepartment];
  };

  const getPendingDepartmentEntries = () => {
    if (!currentUser) return [];
    const approvalDepartments = getApprovalDepartments(currentUser.department);
    return leavePermissions.filter(entry =>
      approvalDepartments.includes(entry.department) &&
      entry.statusFromDepartment === "pending" &&
      !(entry.reason && entry.reason.includes('(Group with ') && entry.approval === 'approved')
    );
  };

  const getProcessedDepartmentEntries = () => {
    if (!currentUser) return [];
    const approvalDepartments = getApprovalDepartments(currentUser.department);
    return leavePermissions.filter(entry =>
      approvalDepartments.includes(entry.department) &&
      (entry.statusFromDepartment === "approved" || entry.statusFromDepartment === "rejected") &&
      !hiddenEntries.has(entry.id)
    );
  };


  const getAllDepartmentEntries = () => {
    if (!currentUser) return [];
    const approvalDepartments = getApprovalDepartments(currentUser.department);
    return leavePermissions.filter(entry =>
      approvalDepartments.includes(entry.department) &&
      (entry.statusFromDepartment === "approved" || entry.statusFromDepartment === "rejected")
    );
  };

  const handleCleanTable = () => {
    if (!currentUser) return;
    const approvalDepartments = getApprovalDepartments(currentUser.department);
    const processedEntryIds = leavePermissions
      .filter(e => approvalDepartments.includes(e.department) && (e.statusFromDepartment === "approved" || e.statusFromDepartment === "rejected"))
      .map(e => e.id);

    const newHiddenEntries = new Set(processedEntryIds);
    setHiddenEntries(newHiddenEntries);
    localStorage.setItem('departmentLeaveHiddenEntries', JSON.stringify([...newHiddenEntries]));
  };

  const handleShowAll = () => {
    setHiddenEntries(new Set());
    localStorage.removeItem('departmentLeaveHiddenEntries');
  };
  const getOverallStatus = (entry: any) => {
    if (entry.role === "Head Department") {
      if (entry.statusFromHR === "rejected") return "rejected";
      if (entry.statusFromHR === "approved") return "approved";
      return "pending";
    } else {
      if (entry.statusFromDepartment === "rejected" || entry.statusFromHR === "rejected") return "rejected";
      if (entry.statusFromDepartment === "approved" && entry.statusFromHR === "approved") return "approved";
      return "pending";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!formData.name.trim()) {
      alert("Please enter a staff name");
      return;
    }
    if (!formData.licensePlate.trim()) {
      alert("Please enter a license plate");
      return;
    }
    if (!formData.role.trim()) {
      alert("Please select a role");
      return;
    }
    if (!formData.date) {
      alert("Please select a date");
      return;
    }
    if (!formData.exitTime) {
      alert("Please enter an exit time");
      return;
    }
    if (!formData.reasonType) {
      alert("Please select a reason type");
      return;
    }
    if (formData.reasonType === "Outside" && !formData.outsideReason.trim()) {
      alert("Please explain the reason for leaving (Outside)");
      return;
    }
    if (formData.reasonType !== "Sick" && !formData.returnTime) {
      alert("Please enter a return time");
      return;
    }
    let reasonValue = formData.reasonType === "Outside" ? formData.outsideReason : formData.reasonType;

    const now = new Date();
    const formatted = now.getFullYear() + '-' +
      String(now.getMonth() + 1).padStart(2, '0') + '-' +
      String(now.getDate()).padStart(2, '0') + ' ' +
      String(now.getHours()).padStart(2, '0') + ':' +
      String(now.getMinutes()).padStart(2, '0') + ':' +
      String(now.getSeconds()).padStart(2, '0');

    try {

      const leaveRequests = [];


      const mainEntry = {
        ...formData,
        department: currentUser.department,
        reason: isGroupLeave && selectedColleagues.length > 0
          ? `${reasonValue} (Group Leader with: ${selectedColleagues.map(c => c.name).join(', ')})`
          : reasonValue,
        approval: "pending",
        statusFromDepartment: formData.role === "Head Department" ? "approved" : "pending",
        statusFromHR: "pending",
        statusFromDirector: "pending",
        submittedAt: formatted,
        actual_exittime: null,
        actual_returntime: null,
        ...(isGroupLeave && selectedColleagues.length > 0 && {
          isGroupLeader: true,
          groupMembers: selectedColleagues.map(c => c.name).join(', ')
        })
      };
      leaveRequests.push(mainEntry);


      if (isGroupLeave && selectedColleagues.length > 0) {
        selectedColleagues.forEach(colleague => {
          const colleagueEntry = {
            name: colleague.name,
            licensePlate: colleague.licensePlate || colleague.licenseplate,
            department: colleague.department,
            role: colleague.role,
            date: formData.date,
            exitTime: formData.exitTime,
            returnTime: formData.returnTime,
            reason: `${reasonValue} (Group with ${formData.name})`,
            approval: "approved",
            statusFromDepartment: "approved",
            statusFromHR: "approved",
            statusFromDirector: "approved",
            submittedAt: formatted,
            actual_exittime: null,
            actual_returntime: null,
            groupLeader: formData.name,
            isGroupMember: true
          };
          leaveRequests.push(colleagueEntry);
        });
      }
      for (const entry of leaveRequests) {
        await addLeavePermission(entry);
      }
      await fetchLeavePermission();
      setIsOpen(false);
      setFormData({
        name: "",
        licensePlate: "",
        department: currentUser.department,
        role: "",
        date: "",
        exitTime: "",
        returnTime: "",
        reason: "",
        reasonType: "",
        outsideReason: "",
      });
      setIsGroupLeave(false);
      setSelectedColleagues([]);
      setColleagueSearch("");

      const groupMessage = isGroupLeave ?
        `Group leave request submitted successfully for ${leaveRequests.length} people!` :
        "Leave request submitted successfully!";

    } catch (error) {
      console.error("Error adding leave permission:", error);

    }
  };
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }
  const handleInputChange = (field: string, value: string) => {
    if (field === "reasonType") {
      setFormData(prev => ({
        ...prev,
        [field]: value,
        returnTime: value === "Sick" ? "" : prev.returnTime,
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };
  const handleEmployeeSelect = (name: string, employee?: any) => {
    setFormData(prev => ({
      ...prev,
      name: name,
      licensePlate: employee?.licensePlate || prev.licensePlate,
      role: employee?.role || prev.role
    }));
  };
  const handleViewDetails = (entry: any) => {
    setSelectedEntry(entry);
    setIsDetailsOpen(true);
  };
  const handleDepartmentApprovalAction = async (entryId: string, action: "approved" | "rejected") => {
    const entry = leavePermissions.find(e => e.id === entryId);
    if (!entry) return;
    const updatedEntry = { ...entry, statusFromDepartment: action };
    updatedEntry.approval = getOverallStatus(updatedEntry);
    await updateLeavePermission(entryId, {
      statusFromDepartment: action,
      approval: updatedEntry.approval
    });
    await fetchLeavePermission();
    setIsDetailsOpen(false);
  };

  const handleRoutingApprovalAction = async (entryId: string, action: "approved" | "rejected") => {
    if (!currentUser?.name) return;

    try {
      // Use the new routing service for approval
      const success = await RoutingService.processRoutingApproval(
        parseInt(entryId),
        currentUser.name,
        action
      );

      if (success) {
        // Refresh the data after successful approval
        await fetchLeavePermission();
        await fetchPendingRoutingEntries();
      } else {
        console.error('❌ Routing approval action failed for Head Department');
      }
    } catch (error) {
      console.error('Error handling routing approval for Head Department:', error);
    }
    setIsDetailsOpen(false);
  };
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg">Loading user data...</p>
        </div>
      </div>
    );
  }
  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <Shield className="w-16 h-16 mx-auto mb-2" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">No user data found or insufficient permissions.</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }
  if (currentUser.role !== "Head Department") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-yellow-500 mb-4">
            <Crown className="w-16 h-16 mx-auto mb-2" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Insufficient Permissions</h2>
          <p className="text-gray-600 mb-4">This page is only accessible to Head Departments.</p>
          <p className="text-sm text-gray-500 mb-4">Current role: {currentUser.role}</p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => window.history.back()}>Go Back</Button>
            <Button
              variant="outline"
              onClick={() => {
                window.location.reload();
              }}
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-h-screen from-primary/5 via-background to-accent/20 p-2 sm:p-3">
      <div className="z-10 sticky top-0 pb-2">
        <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between justify-center items-center">
          <div className="text-center sm:text-left">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">Leave Permission Request (Head Department)</h1>
            <p className="mt-1 text-xs sm:text-sm text-gray-500 px-2 sm:px-0">
              Welcome {currentUser.name} - {currentUser.department} Head {getApprovalDepartments(currentUser.department).length > 1 ? 'Division' : 'Department'}.
              Review leave requests for {getApprovalDepartments(currentUser.department).length > 1 ? 'your division departments' : 'your department'}.
              {getApprovalDepartments(currentUser.department).length > 1 && (
                <span className="block mt-1 text-xs text-blue-600">
                  Managing: {getApprovalDepartments(currentUser.department).join(', ')}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
      {/* Main content */}
      <div className="relative z-10 flex items-center justify-center pt-2 sm:pt-3 px-2 sm:px-4">
        <div className="max-w-6xl w-full sm:w-[90vw] md:w-[80vw] xl:w-[80vw] 2xl:w-[80vw] mx-auto text-center space-y-3 sm:space-y-4">
          {/* Button entry and Pending */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-center justify-center">
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  className="group relative px-3 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 w-full sm:w-auto"
                >
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                  <span className="hidden sm:inline">Add New Entry</span>
                  <span className="sm:hidden">Add Entry</span>
                  <Zap className="w-3 h-3 sm:w-4 sm:h-4 ml-2 group-hover:scale-110 transition-transform duration-300" />
                </Button>
              </DialogTrigger>

              <DialogContent className="sm:max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto bg-card/95 border-border/50 scrollbar-hide mx-2">
                <DialogHeader className="space-y-2 sm:space-y-3">
                  <DialogTitle className="text-lg sm:text-xl lg:text-2xl font-bold text-center">
                    Leave Request Registration - {currentUser.department}
                  </DialogTitle>
                  <DialogDescription className="text-center text-muted-foreground text-xs sm:text-sm">
                    Please fill in all required information for the entry log.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 py-2 sm:py-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <EmployeeAutocomplete
                        id="name"
                        label="Name"
                        placeholder="Enter or search staff name"
                        value={formData.name}
                        onChange={handleEmployeeSelect}
                        employees={employees}
                        className="h-10 border-border/50 focus:border-primary"
                        required
                      />
                      <p className="text-xs text-blue-600">
                        You can request for any staff in your {getApprovalDepartments(currentUser.department).length > 1 ? 'supervised departments' : 'department'}
                        {/* {getApprovalDepartments(currentUser.department).length > 1 && (
                          <span className="block mt-1">
                            ({getApprovalDepartments(currentUser.department).join(', ')})
                          </span>
                        )} */}
                      </p>
                    </div>
                    <div className="space-y-2 flex flex-col">
                      <Label htmlFor="role" className="text-sm font-medium">
                        Role
                      </Label>
                      <select
                        id="role"
                        title="Role"
                        value={formData.role}
                        onChange={(e) => handleInputChange("role", e.target.value)}
                        className="h-10 border border-border/50 rounded-md px-3 py-2 bg-background text-gray-500 text-sm focus:border-primary"
                        required
                      >
                        <option value="">Select role</option>
                        <option value="Staff">Staff</option>
                        <option value="Head Department">Head Department</option>
                      </select>
                      <p className="text-xs text-muteds-foreground">Select the role for this request</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="department" className="text-sm font-medium">
                        Department
                      </Label>
                      <Input
                        id="department"
                        value={formData.department}
                        disabled
                        className="h-10 border-border/50 bg-muted/50"
                      />
                      <p className="text-xs text-muted-foreground">
                        Request will be submitted under {currentUser.department} department
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="licensePlate" className="text-sm font-medium">
                        License Plate
                        <span className="text-sm italic opacity-70"> (Fill '-' if doesnt use vehicle)</span>
                      </Label>
                      <Input
                        id="licensePlate"
                        placeholder="ABC-1234"
                        value={formData.licensePlate}
                        onChange={(e) => handleInputChange("licensePlate", e.target.value)}
                        className="h-10 border-border/50 focus:border-primary"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date" className="text-sm font-medium">
                        Date
                      </Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => handleInputChange("date", e.target.value)}
                        className="h-10 border-border/50 focus:border-primary"
                        required
                      />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleInputChange("date", getTodayDate())}
                          className="text-xs px-2 py-1 h-7"
                        >
                          Today
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleInputChange("date", getTomorrowDate())}
                          className="text-xs px-2 py-1 h-7"
                        >
                          Tomorrow
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="exitTime" className="text-sm font-medium">
                        Exit Time
                        <span className="text-xs opacity-60"> (24H Format)</span>
                      </Label>
                      <Input
                        id="exitTime"
                        type="time"
                        value={formData.exitTime}
                        onChange={(e) => handleInputChange("exitTime", e.target.value)}
                        className="h-10 border-border/50 focus:border-primary"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="returnTime" className="text-sm font-medium">
                      Return Time
                      <span className="text-xs opacity-60"> (24H Format)</span>
                    </Label>
                    <Input
                      id="returnTime"
                      type="time"
                      value={formData.returnTime}
                      onChange={(e) => handleInputChange("returnTime", e.target.value)}
                      className="h-10 border-border/50 focus:border-primary"
                      required={formData.reasonType !== "Sick"}
                      disabled={formData.reasonType === "Sick"}
                    />
                    {formData.reasonType === "Sick" && (
                      <p className="text-xs text-muted-foreground">Return time is not required for sick leave.</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reasonType" className="text-sm font-medium">
                      Reason to Leave
                    </Label>
                    <select
                      id="reasonType"
                      title="Reason"
                      value={formData.reasonType}
                      onChange={e => handleInputChange("reasonType", e.target.value)}
                      className="h-10 border border-border/50 rounded-md px-3 py-2 bg-background text-gray-500 text-sm focus:border-primary"
                      required
                    >
                      <option value="">Select reason</option>
                      <option value="PT">Plant 1</option>
                      <option value="Outside">Outside</option>
                      <option value="Sick">Sick</option>
                    </select>
                    {formData.reasonType === "Outside" && (
                      <div className="mt-2">
                        <Label htmlFor="outsideReason" className="text-sm font-medium">Explain Reason (Outside)</Label>
                        <textarea
                          id="outsideReason"
                          placeholder="Enter reason for leaving (Outside)..."
                          value={formData.outsideReason}
                          onChange={e => handleInputChange("outsideReason", e.target.value)}
                          className="flex min-h-[80px] w-full rounded-lg border border-border/50 bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 resize-none transition-all duration-200"
                          required
                        />
                        <p className="text-xs text-muted-foreground">Please explain the reason for leaving if you select Outside.</p>
                      </div>
                    )}
                    {formData.reasonType && formData.reasonType !== "Outside" && (
                      <p className="text-xs text-muted-foreground mt-2">Reason will be set as <span className="font-semibold">{formData.reasonType}</span>.</p>
                    )}
                  </div>

                  {/* Group Leave Section */}
                  <div className="space-y-4">
                    <div className="space-x-2">
                      <input
                        type="checkbox"
                        id="groupLeave"
                        checked={isGroupLeave}
                        onChange={(e) => setIsGroupLeave(e.target.checked)}
                        className="rounded border-gray-300"
                        disabled={formData.reasonType === "Sick"}
                      />
                      <Label htmlFor="groupLeave" className="text-sm font-medium">
                        Cross-Department Group Leave (Invite colleagues from any department)
                      </Label>
                      {formData.reasonType === "Sick" && (
                        <p className="text-xs text-muted-foreground mt-2">Reason SICK can't bring other person</p>
                      )}
                    </div>

                    {isGroupLeave && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          Select Colleagues from Any Department
                        </Label>

                        {/* Search input */}
                        <input
                          placeholder="Search colleagues by name or department..."
                          value={colleagueSearch}
                          onChange={(e) => setColleagueSearch(e.target.value)}
                          className="w-full h-8 text-sm px-3 border border-gray-300 rounded-md"
                          disabled={formData.reasonType === "Sick"}
                        />

                        {/* Quick actions */}
                        <div className="flex gap-2 text-xs">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedColleagues([])}
                            className="h-6 px-2"

                            disabled={formData.reasonType === "Sick"}
                          >
                            Clear All
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const mainDept = currentUser?.department;
                              const sameDeptColleagues = availableColleagues.filter(c =>
                                c.department === mainDept
                              );
                              setSelectedColleagues(sameDeptColleagues);
                            }}
                            className="h-6 px-2"
                            disabled={formData.reasonType === "Sick"}
                          >
                            Select My Dept
                          </Button>
                        </div>

                        <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-2 bg-gray-50">
                          {availableColleagues.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-2">
                              No colleagues available
                            </p>
                          ) : (
                            (() => {
                              const filteredColleagues = availableColleagues.filter(colleague =>
                                colleague.name.toLowerCase().includes(colleagueSearch.toLowerCase()) ||
                                colleague.department.toLowerCase().includes(colleagueSearch.toLowerCase())
                              );

                              const groupedByDept = filteredColleagues.reduce((groups, colleague) => {
                                const dept = colleague.department;
                                if (!groups[dept]) groups[dept] = [];
                                groups[dept].push(colleague);
                                return groups;
                              }, {} as Record<string, typeof filteredColleagues>);

                              return Object.entries(groupedByDept).map(([dept, colleagues]) => (
                                <div key={dept} className="space-y-1">
                                  <div className="flex items-center gap-1 text-xs font-medium text-gray-600">
                                    <Building className="w-3 h-3" />
                                    {dept}
                                  </div>
                                  <div className="pl-4 space-y-1">
                                    {(colleagues as any[]).map((colleague: any, idx: number) => (
                                      <label key={idx} className="flex items-center space-x-2 text-xs cursor-pointer hover:bg-white rounded p-1">
                                        <input
                                          type="checkbox"
                                          checked={selectedColleagues.some(c => c.uid === colleague.uid)}
                                          onChange={(e) => {
                                            if (e.target.checked) {
                                              setSelectedColleagues([...selectedColleagues, colleague]);
                                            } else {
                                              setSelectedColleagues(selectedColleagues.filter(c => c.uid !== colleague.uid));
                                            }
                                          }}
                                          className="rounded border-gray-300"
                                          disabled={formData.reasonType === "Sick"}
                                        />
                                        <span className="font-medium">{colleague.name}</span>
                                        <span className="text-gray-500">({colleague.role})</span>
                                      </label>
                                    ))}
                                  </div>
                                </div>
                              ));
                            })()
                          )}
                        </div>

                        {selectedColleagues.length > 0 && (
                          <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                            <Users className="w-3 h-3 inline mr-1" />
                            Selected: {selectedColleagues.length} colleague(s) + 1 main person = {selectedColleagues.length + 1} total
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Approval Flow Information */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">Approval Flow:</h4>
                    <div className="text-xs text-blue-700">
                      <div className="flex items-center gap-2">
                        <Crown className="w-4 h-4" />
                        <span>Head Department (Auto-approved) → HR → Director</span>
                      </div>
                      <p className="mt-2 text-xs text-blue-600">
                        As Head Department, your request will be auto-approved at department level and sent to HR and Director for final approval.
                      </p>
                    </div>
                  </div>
                  <DialogFooter className="gap-2 sm:gap-3 flex-col sm:flex-row">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsOpen(false)}
                      className="w-full sm:w-auto order-2 sm:order-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="w-full sm:w-auto group order-1 sm:order-2"
                    >
                      <Send className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform duration-200" />
                      <span className="text-xs sm:text-sm">
                        {isGroupLeave ?
                          `Submit Group (${selectedColleagues.length + 1})` :
                          "Submit My Request"
                        }
                      </span>
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            {/* Pending Department Approval Card */}
            <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="group relative px-3 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold border-2 hover:bg-primary hover:text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 w-full sm:w-auto"
                >
                  <Eye className="w-4 h-4 sm:w-5 sm:h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                  <span className="hidden sm:inline">Pending Approval ({getPendingRoutingEntries().length})</span>
                  <span className="sm:hidden">Pending ({getPendingRoutingEntries().length})</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto bg-card/95 border-border/50">
                <DialogHeader className="space-y-3">
                  <DialogTitle className="text-2xl font-bold text-center">
                    Pending {getApprovalDepartments(currentUser.department).length > 1 ? 'Division' : 'Department'} Approval - {currentUser.department}
                  </DialogTitle>
                  <DialogDescription className="text-center text-muted-foreground">
                    Leave requests awaiting your approval as Head {getApprovalDepartments(currentUser.department).length > 1 ? 'Division' : 'Department'}
                    {getApprovalDepartments(currentUser.department).length > 1 && (
                      <div className="mt-2 text-xs">
                        Managing: {getApprovalDepartments(currentUser.department).join(', ')}
                      </div>
                    )}
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  {getPendingRoutingEntries().length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Building className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">No pending approvals</p>
                      <p className="text-sm">All department entries have been processed</p>
                    </div>
                  ) : (
                    <div className="max-h-[60vh] overflow-x-auto overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>License Plate</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Exit</TableHead>
                            <TableHead>Return</TableHead>
                            <TableHead>Submitted</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {getPendingRoutingEntries().map((entry) => (
                            <TableRow key={entry.id}>
                              <TableCell className="font-medium">
                                <div className="flex items-center">
                                  {entry.role === "Head Department" ? (
                                    <Crown className="w-4 h-4 mr-1 text-yellow-600" />
                                  ) : (
                                    <User className="w-4 h-4 mr-1 text-blue-600" />
                                  )}
                                  {entry.name}
                                </div>
                              </TableCell>
                              <TableCell className="font-mono text-sm">{entry.licenseplate || entry.licensePlate || '-'}</TableCell>
                              <TableCell>{formatDate(entry.date)}</TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {entry.exittime ? formatTime(entry.exittime) : 'Not set'}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {entry.returntime ? formatTime(entry.returntime) : 'Not set'}
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {formatTime(entry.submittedat) || 'Not available'}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewDetails(entry)}
                                  className="hover:bg-primary/10"
                                >
                                  <FileText className="w-4 h-4 mr-1" />
                                  Review
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
            {/* Details Dialog */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
              <DialogContent className="w-[90vw] h-[90vh] rounded-xl sm:max-w-2xl lg:w-full md:w-full bg-card/95 border-border/50 lg:h-[90vh] overflow-auto scrollbar-hide">
                <DialogHeader className="space-y-3">
                  <DialogTitle className="text-2xl font-bold text-center">
                    Leave Permission Detail
                  </DialogTitle>
                  <DialogDescription className="text-center text-muted-foreground">
                    Complete information for this Leave Permission Request
                  </DialogDescription>
                </DialogHeader>
                {selectedEntry && (
                  <div className="py-1 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-semibold flex items-center">
                          <User className="w-5 h-5 mr-2 text-blue-600" />
                          {selectedEntry.name}
                        </h3>
                        <p className="text-sm text-muted-foreground flex items-center mt-1">
                          <Calendar className="w-4 h-4 mr-1" />
                          Submitted: {selectedEntry.submittedat || 'Not available'}
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${getOverallStatus(selectedEntry) === 'approved' ? 'bg-green-100 text-green-800' :
                          getOverallStatus(selectedEntry) === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                        }`}>
                        {getOverallStatus(selectedEntry).charAt(0).toUpperCase() + getOverallStatus(selectedEntry).slice(1)}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">License Plate</label>
                          <p className="text-lg font-mono mt-1">{selectedEntry.licensePlate || selectedEntry.licenseplate}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Department</label>
                          <p className="text-lg mt-1 flex items-center">
                            <Building className="w-4 h-4 mr-2 text-blue-600" />
                            {selectedEntry.department}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Date</label>
                          <p className="text-lg mt-1">{selectedEntry.date
                            ? new Date(selectedEntry.date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })
                            : 'Not set'}</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Exit Time</label>
                          <p className="text-lg mt-1 flex items-center">
                            <Clock className="w-4 h-4 mr-2" />
                            {(selectedEntry.exitTime || selectedEntry.exittime)
                              ? formatTime(selectedEntry.exitTime || selectedEntry.exittime)
                              : 'Not set'}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Return Time</label>
                          <p className="text-lg mt-1 flex items-center">
                            <Clock className="w-4 h-4 mr-2" />
                            {(selectedEntry.returnTime || selectedEntry.returntime)
                              ? formatTime(selectedEntry.returnTime || selectedEntry.returntime)
                              : 'Not set'}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Approval Flow</label>
                          <p className="text-sm mt-1 bg-blue-50 px-3 py-2 rounded-lg">
                            {selectedEntry.role === "Head Department" ? "Head Department → HR" : "Head Department → HR"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-border/30">
                      <label className="text-sm font-medium text-muted-foreground mb-3 block">Approval Status</label>
                      <div className="grid grid-cols-1 gap-4">
                        <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                          <div className="flex items-center">
                            <Building className="w-4 h-4 mr-2 text-blue-600" />
                            <div className="flex-col">
                            <label className="text-sm font-medium">Head Department</label>
                              <p className="text-xs font-semibold opacity-45">{selectedEntry.departmentApprover}</p>
                            </div>
                          </div>
                          <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${selectedEntry.statusFromDepartment === 'approved' ? 'bg-green-100 text-green-800' :
                              selectedEntry.statusFromDepartment === 'rejected' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                            }`}>
                            {(() => {
                              const status = selectedEntry.statusFromDepartment || 'pending';
                              return status.charAt(0).toUpperCase() + status.slice(1);
                            })()}
                          </div>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                          <div className="flex items-center">
                            <Shield className="w-4 h-4 mr-2 text-green-600" />
                            <div className="flex flex-col">
                            <label className="text-sm font-medium">HR</label>
                            <p className="text-xs font-semibold opacity-45">{selectedEntry.hrApprover}</p>
                            </div>
                          </div>
                          <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${selectedEntry.statusFromHR === 'approved' ? 'bg-green-100 text-green-800' :
                              selectedEntry.statusFromHR === 'rejected' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                            }`}>
                            {(() => {
                              const status = selectedEntry.statusFromHR || 'pending';
                              return status.charAt(0).toUpperCase() + status.slice(1);
                            })()}
                          </div>
                        </div>

                      </div>
                    </div>
                    <div className="pt-4 border-t border-border/30">
                      <label className="text-sm font-medium text-muted-foreground">Reason for Leave</label>
                      <p className="mt-2 text-sm leading-relaxed bg-muted/30 p-4 rounded-lg">
                        {selectedEntry.reason}
                      </p>
                    </div>
                    {(selectedEntry.statusFromDepartment === 'pending' || selectedEntry.statusFromDepartment === null || selectedEntry.statusFromDepartment === undefined) && (
                      <div className="pt-4 border-t border-border/30">
                        <label className="text-sm font-medium text-muted-foreground mb-3 block">Head Department Actions</label>
                        <div className="flex gap-3">
                          <Button
                            onClick={() => handleRoutingApprovalAction(selectedEntry.id, 'approved')}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Send className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleRoutingApprovalAction(selectedEntry.id, 'rejected')}
                            variant="destructive"
                            className="flex-1"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
          {/* Department Entries Table */}
          {(getProcessedDepartmentEntries().length > 0 || getAllDepartmentEntries().length > 0) && (
            <div className="max-w-6xl">
              <div className="bg-card/50 border border-border/50 rounded-2xl p-2 sm:p-3 shadow-lg">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-3 sm:mb-4 space-y-2 sm:space-y-0">
                  <div className="flex-1 hidden sm:block"></div>
                  <h3 className="text-base sm:text-lg font-semibold text-center flex-1">
                    {getApprovalDepartments(currentUser.department).length > 1
                      ? `${currentUser.department} Division Leave Requests`
                      : `${currentUser.department} Department Leave Requests`
                    }
                  </h3>
                  <div className="flex-1 flex justify-center sm:justify-end gap-1 sm:gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleShowAll}
                      className="group relative px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium border-2 hover:bg-primary/10 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                    >
                      <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2 group-hover:rotate-180 transition-transform duration-300" />
                      <span className="hidden sm:inline">Show All</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCleanTable}
                      className="group relative px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium border-2 hover:bg-secondary/80 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                    >
                      <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2 group-hover:rotate-12 transition-transform duration-300" />
                      <span className="hidden sm:inline">Clear</span>
                    </Button>
                  </div>
                </div>
                <div className="w-full overflow-x-auto overflow-y-auto h-[50vh] sm:h-[60vh] scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
                  <Table className="min-w-[800px] w-full">
                    <TableHeader className="">
                      <TableRow className="">
                        <TableHead className="items-center justify-center text-center text-xs sm:text-sm px-1 sm:px-2">Name</TableHead>
                        <TableHead className="items-center justify-center text-center text-xs sm:text-sm px-1 sm:px-2">Role</TableHead>
                        <TableHead className="items-center justify-center text-center text-xs sm:text-sm px-1 sm:px-2">License Plate</TableHead>
                        <TableHead className="items-center justify-center text-center text-xs sm:text-sm px-1 sm:px-2">Date</TableHead>
                        <TableHead className="items-center justify-center text-center text-xs sm:text-sm px-1 sm:px-2">Exit</TableHead>
                        <TableHead className="items-center justify-center text-center text-xs sm:text-sm px-1 sm:px-2">Return</TableHead>
                        <TableHead className="items-center justify-center text-center text-xs sm:text-sm px-1 sm:px-2">Overall Status</TableHead>
                        <TableHead className="items-center justify-center text-center text-xs sm:text-sm px-1 sm:px-2">Approval Progress</TableHead>
                        <TableHead className="items-center justify-center text-center text-xs sm:text-sm px-1 sm:px-2">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getProcessedDepartmentEntries().length === 0 && getAllDepartmentEntries().length > 0 && (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8">
                            <div className="flex flex-col items-center justify-center space-y-3">
                              <Eye className="w-12 h-12 text-muted-foreground/50" />
                              <div className="text-muted-foreground">
                                <p className="font-medium">All processed entries are hidden</p>
                                <p className="text-sm">
                                  {getAllDepartmentEntries().length} entries have been processed.
                                  Click "Show All" to view them.
                                </p>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                      {getProcessedDepartmentEntries().map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="font-medium text-xs sm:text-sm px-1 sm:px-2">
                            <div className="flex items-center">
                              {entry.role === "Head Department" ? (
                                <Crown className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-yellow-600" />
                              ) : (
                                <User className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-blue-600" />
                              )}
                              <span className="truncate max-w-20 sm:max-w-none">{entry.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm px-1 sm:px-2">
                            <span className={`text-xs px-1 py-1 sm:px-2 rounded-full ${entry.role === "Head Department"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-blue-100 text-blue-800"
                              }`}>
                              <span className="hidden sm:inline">{entry.role}</span>
                              <span className="sm:hidden">{entry.role === "Head Department" ? "HD" : "Staff"}</span>
                            </span>
                          </TableCell>
                          <TableCell className="font-mono text-xs sm:text-sm px-1 sm:px-2 truncate max-w-24 sm:max-w-none">{entry.licensePlate}</TableCell>
                          <TableCell className="text-xs sm:text-sm px-1 sm:px-2">{entry.date}</TableCell>
                          <TableCell className="text-xs sm:text-sm px-1 sm:px-2">
                            <div className="flex items-center">
                              <Clock className="w-2 h-2 sm:w-3 sm:h-3 mr-1" />
                              {entry.exitTime ? formatTime(entry.exitTime) : 'Not set'}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm px-1 sm:px-2">
                            <div className="flex items-center">
                              <Clock className="w-2 h-2 sm:w-3 sm:h-3 mr-1" />
                              <span className="truncate max-w-16 sm:max-w-none">{entry.returnTime ? formatTime(entry.returnTime) : 'Not set'}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm px-1 sm:px-2">
                            <div className={`inline-flex px-1 py-1 sm:px-2 rounded-full text-xs font-medium ${getOverallStatus(entry) === 'approved' ? 'bg-green-100 text-green-800' :
                                getOverallStatus(entry) === 'rejected' ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'
                              }`}>
                              <span className="hidden sm:inline">{getOverallStatus(entry).charAt(0).toUpperCase() + getOverallStatus(entry).slice(1)}</span>
                              <span className="sm:hidden">{getOverallStatus(entry).charAt(0).toUpperCase()}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm px-1 sm:px-2">
                            <div className="flex items-center space-x-1">
                              {/* Department approval status */}
                              <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${entry.statusFromDepartment === 'approved' ? 'bg-green-500' :
                                  entry.statusFromDepartment === 'rejected' ? 'bg-red-500' :
                                    'bg-yellow-500'
                                }`} title={`Department: ${entry.statusFromDepartment}`} />
                              <div className="w-1 sm:w-2 h-0.5 bg-gray-300 mx-1" />
                              {/* HR approval status */}
                              <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${entry.statusFromHR === 'approved' ? 'bg-green-500' :
                                  entry.statusFromHR === 'rejected' ? 'bg-red-500' :
                                    'bg-yellow-500'
                                }`} title={`HR: ${entry.statusFromHR}`} />
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              <span className={`${entry.statusFromDepartment === 'approved' ? 'text-green-600' :
                                  entry.statusFromDepartment === 'rejected' ? 'text-red-600' :
                                    'text-yellow-600'
                                }`}>
                                D
                              </span>
                              →
                              <span className={`${entry.statusFromHR === 'approved' ? 'text-green-600' :
                                  entry.statusFromHR === 'rejected' ? 'text-red-600' :
                                    'text-yellow-600'
                                }`}>
                                H
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right px-1 sm:px-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(entry)}
                              className="hover:bg-primary/10 px-1 py-1 sm:px-2 sm:py-1"
                            >
                              <FileText className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                              <span className="hidden sm:inline text-xs">Details</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
