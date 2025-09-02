import { useState } from "react";
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
import { Plus, Send, Sparkles, Zap, Eye, Calendar, Clock, User, MoreHorizontal, FileText, X, Shield, Crown, Building, BookUser } from "lucide-react";

import { useEffect } from "react";
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
  const [hiddenEntries, setHiddenEntries] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('departmentLeaveHiddenEntries');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

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
  useEffect(() => {
    if (currentUser?.department) {
      const approvalDepartments = getApprovalDepartments(currentUser.department);
      
      // If head department manages multiple departments, fetch users from all of them
      if (approvalDepartments.length > 1) {
        // Fetch all users and filter by supervised departments
        fetchUsers().then(() => {
          const allUsers = useDashboardStore.getState().users;
          const employeeSuggestions = allUsers
            .filter(user => approvalDepartments.includes(user.department))
            .map(user => ({
              name: user.name,
              department: user.department,
              licensePlate: user.licenseplate,
              uid: user.uid,
              role: user.role
            }));
          setEmployees(employeeSuggestions);
        });
      } else {
        // Single department - use existing logic
        fetchUsersByDepartment(currentUser.department).then(departmentUsers => {
          const employeeSuggestions = departmentUsers.map(user => ({
            name: user.name,
            department: user.department,
            licensePlate: user.licenseplate,
            uid: user.uid,
            role: user.role
          }));
          setEmployees(employeeSuggestions);
        });
      }
    }
  }, [currentUser, fetchUsersByDepartment, fetchUsers]);
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
    if (currentUser) {
      setFormData(prev => ({
        ...prev,
        department: currentUser.department,
        role: currentUser.role,
        name: currentUser.name,
      }));
    }
  }, [currentUser]);

// Define which departments each head department can approve
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
    entry.statusFromDepartment === "pending"
  );
};

const getProcessedDepartmentEntries = () => {
  if (!currentUser) return [];
  const approvalDepartments = getApprovalDepartments(currentUser.department);
  return leavePermissions.filter(entry => 
    approvalDepartments.includes(entry.department) && 
    entry.statusFromDepartment !== "pending" &&
    !hiddenEntries.has(entry.id)
  );
};

const handleCleanTable = () => {
  if (!currentUser) return;
  const approvalDepartments = getApprovalDepartments(currentUser.department);
  const processedEntryIds = leavePermissions
    .filter(e => approvalDepartments.includes(e.department) && e.statusFromDepartment !== "pending")
    .map(e => e.id);
  
  const newHiddenEntries = new Set(processedEntryIds);
  setHiddenEntries(newHiddenEntries);
  localStorage.setItem('departmentLeaveHiddenEntries', JSON.stringify([...newHiddenEntries]));
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
  
  const newEntry = {
    ...formData,
    department: currentUser.department,
    reason: reasonValue,
    approval: "pending",
    statusFromDepartment: formData.role === "Head Department" ? "approved" : "pending",
    statusFromHR: "pending",
    statusFromDirector: "pending",
    submittedAt: formatted,
    actual_exittime: null,
    actual_returntime: null
  };
    
  //console.log("=== DEBUG NEW ENTRY ===");
  //console.log("newEntry:", newEntry);

  try {
    await addLeavePermission(newEntry);
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
  } catch (error) {
    console.error("Error adding leave permission:", error);
    alert("Failed to submit leave request. Please try again.");
  }
};

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
      licensePlate: employee?.licensePlate || prev.licensePlate
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
    <div className="max-h-screen from-primary/5 via-background to-accent/20 p-3">
      <div className="z-10 sticky top-0 pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between justify-center items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Leave Permission Request (Head Department)</h1>
            <p className="mt-1 text-sm text-gray-500">
              Welcome {currentUser.name} - {currentUser.department} Head {getApprovalDepartments(currentUser.department).length > 1 ? 'Division' : 'Department'}. 
              Review leave requests for {getApprovalDepartments(currentUser.department).length > 1 ? 'your division departments' : 'your department'}.
              {getApprovalDepartments(currentUser.department).length > 1 && (
                <span className="block mt-1 text-xs text-blue-600">
                  Managing: {getApprovalDepartments(currentUser.department).join(', ')}
                </span>
              )}
            </p>
          </div>
          <div className="mt-4 justify-center items-center w-fit sm:mt-0">
            <Clock2 />
          </div>
        </div>  
      </div>

      {/* Main content */}
      <div className="relative z-10 flex items-center justify-center pt-3 px-4">
        <div className="max-w-6xl md:w-[80vw] xl:w-[80vw] 2xl:w-[80vw] mx-auto text-center space-y-4">
          {/* Button entry and Pending */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  className="group relative px-2 py-2 text-sm font-medium bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <Plus className="w-2 h-2 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                  Add New Entry
                  <Zap className="w-2 h-2 ml-2 group-hover:scale-110 transition-transform duration-300" />
                </Button>
              </DialogTrigger>
              
              <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-card/95 border-border/50 scrollbar-hide">
                <DialogHeader className="space-y-3">
                  <DialogTitle className="text-2xl font-bold text-center">
                    Leave Request Registration - {currentUser.department}
                  </DialogTitle>
                  <DialogDescription className="text-center text-muted-foreground">
                    Please fill in all required information for the entry log.
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
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
                  <div className="grid grid-cols-2 gap-4">
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
                  <div className="grid grid-cols-2 gap-4">
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
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="exitTime" className="text-sm font-medium">
                        Exit Time
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
                      <option value="PaT">Plant 1</option>
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

                  <DialogFooter className="gap-3 sm:gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsOpen(false)}
                      className="flex-1 sm:flex-none"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1 sm:flex-none group"
                    >
                      <Send className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform duration-200" />
                      Submit My Request
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
                  className="group relative px-2 py-2 text-sm font-semibold border-2 hover:bg-primary hover:text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <Eye className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                  Pending Approval ({getPendingDepartmentEntries().length})
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
                  {getPendingDepartmentEntries().length === 0 ? (
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
                          {getPendingDepartmentEntries().map((entry) => (
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
                              <TableCell className="font-mono text-sm">{entry.licensePlate}</TableCell>
                              <TableCell>{entry.date}</TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {entry.exitTime}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {entry.returnTime || 'Not set'}
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {entry.submittedAt}
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
                          Submitted: {selectedEntry.submittedAt}  
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        getOverallStatus(selectedEntry) === 'approved' ? 'bg-green-100 text-green-800' :
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
                          <p className="text-lg font-mono mt-1">{selectedEntry.licensePlate}</p>
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
                          <p className="text-lg mt-1">{selectedEntry.date}</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Exit Time</label>
                          <p className="text-lg mt-1 flex items-center">
                            <Clock className="w-4 h-4 mr-2" />
                            {selectedEntry.exitTime}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Return Time</label>
                          <p className="text-lg mt-1 flex items-center">
                            <Clock className="w-4 h-4 mr-2" />
                            {selectedEntry.returnTime || 'Not set'}
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
                            <label className="text-sm font-medium">Head Department</label>
                          </div>
                          <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                            selectedEntry.statusFromDepartment === 'approved' ? 'bg-green-100 text-green-800' :
                            selectedEntry.statusFromDepartment === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {selectedEntry.statusFromDepartment.charAt(0).toUpperCase() + selectedEntry.statusFromDepartment.slice(1)}
                          </div>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                          <div className="flex items-center">
                            <Shield className="w-4 h-4 mr-2 text-green-600" />
                            <label className="text-sm font-medium">HR</label>
                          </div>
                          <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                            selectedEntry.statusFromHR === 'approved' ? 'bg-green-100 text-green-800' :
                            selectedEntry.statusFromHR === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {selectedEntry.statusFromHR.charAt(0).toUpperCase() + selectedEntry.statusFromHR.slice(1)}
                          </div>
                        </div>
                        {/* {selectedEntry.role === 'Head Department' && (
                          <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                          <div className="flex items-center">
                            <BookUser className="w-4 h-4 mr-2 text-red-600" />
                            <label className="text-sm font-medium">Director</label>
                          </div>
                          <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                            selectedEntry.statusFromDirector === 'approved' ? 'bg-green-100 text-green-800' :
                            selectedEntry.statusFromDirector === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {selectedEntry.statusFromDirector.charAt(0).toUpperCase() + selectedEntry.statusFromDirector.slice(1)}
                          </div>
                        </div>
                        )} */}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border/30">
                      <label className="text-sm font-medium text-muted-foreground">Reason for Leave</label>
                      <p className="mt-2 text-sm leading-relaxed bg-muted/30 p-4 rounded-lg">
                        {selectedEntry.reason}
                      </p>
                    </div>

                    {selectedEntry.statusFromDepartment === 'pending' && (
                      <div className="pt-4 border-t border-border/30">
                        <label className="text-sm font-medium text-muted-foreground mb-3 block">Head Department Actions</label>
                        <div className="flex gap-3">
                          <Button
                            onClick={() => handleDepartmentApprovalAction(selectedEntry.id, 'approved')}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Send className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleDepartmentApprovalAction(selectedEntry.id, 'rejected')}
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
          {getProcessedDepartmentEntries().length > 0 && (
            <div className="max-w-6xl">
              <div className="bg-card/50 border border-border/50 rounded-2xl p-3 shadow-lg">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex-1"></div>
                  <h3 className="text-lg font-semibold text-center flex-1">
                    {getApprovalDepartments(currentUser.department).length > 1 
                      ? `${currentUser.department} Division Leave Requests`
                      : `${currentUser.department} Department Leave Requests`
                    }
                  </h3>
                  <div className="flex-1 flex justify-end mr-6 md:mr-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCleanTable}
                      className="group relative px-3 py-2 text-sm font-medium border-2 hover:bg-secondary/80 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                    >
                      <Sparkles className="w-4 h-4 md:w-4 md:h-4 md:mr-2 group-hover:rotate-12 transition-transform duration-300" />
                      Clear
                    </Button>
                  </div>
                </div>
                <div className="block w-screen max-w-full overflow-x-auto overflow-y-auto h-[60vh] scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
                  <Table className="min-w-max">
                    <TableHeader className="">
                      <TableRow className="">
                        <TableHead className="items-center justify-center text-center">Name</TableHead>
                        <TableHead className="items-center justify-center text-center">Role</TableHead>
                        <TableHead className="items-center justify-center text-center">License Plate</TableHead>
                        <TableHead className="items-center justify-center text-center">Date</TableHead>
                        <TableHead className="items-center justify-center text-center">Exit</TableHead>
                        <TableHead className="items-center justify-center text-center">Return</TableHead>
                        <TableHead className="items-center justify-center text-center">Overall Status</TableHead>
                        <TableHead className="items-center justify-center text-center">Approval Progress</TableHead>
                        <TableHead className="items-center justify-center text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getProcessedDepartmentEntries().map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              {entry.role === "Head Department" ? (
                                <Crown className="w-4 h-4 mr-2 text-yellow-600" />
                              ) : (
                                <User className="w-4 h-4 mr-2 text-blue-600" />
                              )}
                              {entry.name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={`text-sm px-2 py-1 rounded-full ${
                              entry.role === "Head Department" 
                                ? "bg-yellow-100 text-yellow-800" 
                                : "bg-blue-100 text-blue-800"
                            }`}>
                              {entry.role}
                            </span>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{entry.licensePlate}</TableCell>
                          <TableCell>{entry.date}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {entry.exitTime}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {entry.returnTime || 'Not set'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                              getOverallStatus(entry) === 'approved' ? 'bg-green-100 text-green-800' :
                              getOverallStatus(entry) === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {getOverallStatus(entry).charAt(0).toUpperCase() + getOverallStatus(entry).slice(1)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              {/* Department approval status */}
                              <div className={`w-3 h-3 rounded-full ${
                                entry.statusFromDepartment === 'approved' ? 'bg-green-500' :
                                entry.statusFromDepartment === 'rejected' ? 'bg-red-500' :
                                'bg-yellow-500'
                              }`} title={`Department: ${entry.statusFromDepartment}`} />
                              <div className="w-2 h-0.5 bg-gray-300 mx-1" />
                              {/* HR approval status */}
                              <div className={`w-3 h-3 rounded-full ${
                                entry.statusFromHR === 'approved' ? 'bg-green-500' :
                                entry.statusFromHR === 'rejected' ? 'bg-red-500' :
                                'bg-yellow-500'
                              }`} title={`HR: ${entry.statusFromHR}`} />
                              {/* {entry.role === "Head Department" && (
                                <>
                                <div className="w-2 h-0.5 bg-gray-300 mx-1" /> */}
                                  {/* Director approval status */}
                                  {/* <div className={`w-3 h-3 rounded-full ${
                                    entry.statusFromDirector === 'approved' ? 'bg-green-500' :
                                    entry.statusFromDirector === 'rejected' ? 'bg-red-500' :
                                    'bg-yellow-500'
                                    }`} title={`Director: ${entry.statusFromDirector}`} />
                                </>
                              )} */}
                            </div>

                            <div className="text-xs text-muted-foreground mt-1">
                              <span className={`${
                                entry.statusFromDepartment === 'approved' ? 'text-green-600' :
                                entry.statusFromDepartment === 'rejected' ? 'text-red-600' :
                                'text-yellow-600'
                              }`}>
                                D
                              </span>
                              →
                              <span className={`${
                                entry.statusFromHR === 'approved' ? 'text-green-600' :
                                entry.statusFromHR === 'rejected' ? 'text-red-600' :
                                'text-yellow-600'
                              }`}>
                                H
                              </span>
                              {/* {entry.role === "Head Department" && (
                                <>
                                  →
                                  <span className={`${
                                    entry.statusFromDirector === 'approved' ? 'text-green-600' :
                                    entry.statusFromDirector === 'rejected' ? 'text-red-600' :
                                    'text-yellow-600'
                                  }`}>
                                    Dir
                                  </span>
                                </>
                              )} */}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(entry)}
                              className="hover:bg-primary/10"
                            >
                              <FileText className="w-4 h-4 mr-1" />
                              Details
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

          {/* Summary Cards
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Approval</p>
                  <p className="text-2xl font-bold text-yellow-600">{getPendingDepartmentEntries().length}</p>
                </div>
                <Eye className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
            
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Approved</p>
                  <p className="text-2xl font-bold text-green-600">
                    {getDepartmentEntries().filter(e => getOverallStatus(e) === 'approved').length}
                  </p>
                </div>
                <Send className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Requests</p>
                  <p className="text-2xl font-bold text-blue-600">{getDepartmentEntries().length}</p>
                </div>
                <Building className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
}
