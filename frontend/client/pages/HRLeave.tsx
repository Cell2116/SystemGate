import { useState, useEffect, useRef } from "react";
import { useDashboardStore } from "../store/dashboardStore";
import { onConnectionChange, onDataChange } from "@/lib/ws";
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
import { Plus, Send, Sparkles, Zap, Eye, Calendar, Clock, User, MoreHorizontal, FileText, X, Shield, Crown, RefreshCw, Users, Building, MapPin } from "lucide-react";

export default function HR() {
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
  const addLeavePermission = useDashboardStore(state => state.addLeavePermission);
  const loading = useDashboardStore(state => state.loading);
  const error = useDashboardStore(state => state.error);
  const updateLeavePermission = useDashboardStore(state => state.updateLeavePermission);
  const [employees, setEmployees] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredEmployees, setFilteredEmployees] = useState<any[]>([]);
  const [hiddenEntries, setHiddenEntries] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('hrLeaveHiddenEntries');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [isGroupLeave, setIsGroupLeave] = useState(false);
  const [selectedColleagues, setSelectedColleagues] = useState<any[]>([]);
  const [availableColleagues, setAvailableColleagues] = useState<any[]>([]);
  const [colleagueSearch, setColleagueSearch] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let mounted = true;
    let unsubscribeDataChange: (() => void) | null = null;
    let unsubscribeLeaveChange: (() => void) | null = null;

    const setupRealTimeConnection = async () => {
      try {
        //console.log("Setting up real-time connection for HR Leave...");
        onConnectionChange((status) => {
          if (!mounted) return;
          //console.log("WebSocket connection status changed:", status);
        });
        unsubscribeDataChange = onDataChange('attendance', (data) => {
          if (!mounted) return;
          //console.log("Global attendance data change received in HR:", data);
          setTimeout(() => {
            if (mounted) {
              fetchLeavePermission();
            }
          }, 100);
        });
        unsubscribeLeaveChange = onDataChange('leave_permission', (data) => {
          if (!mounted) return;
          //console.log("Global leave permission data change received in HR:", data);
          setTimeout(() => {
            if (mounted) {
              fetchLeavePermission();
            }
          }, 100);
        });

        // Initial fetch
        await fetchLeavePermission();
        await fetchRecords();
        await fetchUsers();

      } catch (error) {
        console.error("Error in HR Leave real-time setup:", error);
      }
    };

    setupRealTimeConnection();

    return () => {
      //console.log("Cleaning up HR Leave connection...");
      mounted = false;
      
      if (unsubscribeDataChange) {
        unsubscribeDataChange();
      }
      
      if (unsubscribeLeaveChange) {
        unsubscribeLeaveChange();
      }
    };
  }, [fetchLeavePermission, fetchRecords, fetchUsers]);

  useEffect(() => {
    const employeeSuggestions = users.map(user => ({
      name: user.name,
      department: user.department,
      licensePlate: user.licenseplate,
      uid: user.uid,
      role: user.role
    }));
    
    setEmployees(employeeSuggestions);
    setAvailableColleagues(employeeSuggestions);
  }, [users]);
  const departmentSuggestions = [...new Set([
    ...users.map(user => user.department),
    ...records.map(record => record.department),
    ...leavePermissions.map(permission => permission.department)
  ])].filter(Boolean);


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
  
  // Update available colleagues when formData.name changes
  useEffect(() => {
    const colleagues = employees.filter(emp => 
      emp.name !== formData.name
    );
    setAvailableColleagues(colleagues);
  }, [employees, formData.name]);
  
  const getRequiredApprovals = (role: string) => {
    if (role === "Head Department") {
      return ["HR"];
    } else {
      return ["HR", "Head Department"];
    }
  };

  const getDisplayApprovals = (role: string) => {
    if (role === "Head Department") {
      return ["Head Department", "HR"];
    } else {
      return ["HR", "Head Department"];
    }
  };
  const isFullyApproved = (entry: any) => {
    const requiredApprovals = getRequiredApprovals(entry.role);
    
    if (requiredApprovals.includes("HR") && entry.statusFromHR !== "approved") return false;
    if (requiredApprovals.includes("Head Department") && entry.statusFromDepartment!== "approved") return false;
    
    return true;
  };
  const isRejected = (entry: any) => {
    const requiredApprovals = getRequiredApprovals(entry.role);
    
    if (requiredApprovals.includes("HR") && entry.statusFromHR === "rejected") return true;
    if (requiredApprovals.includes("Head Department") && entry.statusFromDepartment=== "rejected") return true;
    
    return false;
  };
  const getOverallStatus = (entry: any) => {
    if (isRejected(entry)) return "rejected";
    if (isFullyApproved(entry)) return "approved";
    return "pending";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("Please enter a name");
      return;
    }
    if (!formData.licensePlate.trim()) {
      alert("Please enter a license plate");
      return;
    }
    if (!formData.department.trim()) {
      alert("Please enter a department");
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
      // Create leave requests for main person and selected colleagues
      const leaveRequests = [];
      
      // Main person
      const mainEntry = {
        name: formData.name,
        licensePlate: formData.licensePlate,
        department: formData.department,
        role: formData.role,
        date: formData.date,
        exitTime: formData.exitTime,
        returnTime: formData.returnTime,
        reason: isGroupLeave && selectedColleagues.length > 0 
          ? `${reasonValue} (Group Leader with: ${selectedColleagues.map(c => c.name).join(', ')})` 
          : reasonValue,

        approval: "pending",
        statusFromDepartment: "pending",
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
      
      // Add colleagues if group leave - they don't need separate approval
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
            approval: "approved", // Auto-approved as part of group
            statusFromDepartment: "approved", // Auto-approved
            statusFromHR: "approved", // Auto-approved
            statusFromDirector: "approved", // Auto-approved
            submittedAt: formatted,
            actual_exittime: null,
            actual_returntime: null,
            groupLeader: formData.name, // Track who is the group leader
            isGroupMember: true // Flag to identify group members
          };
          leaveRequests.push(colleagueEntry);
        });
      }
      
      // Submit all leave requests
      for (const entry of leaveRequests) {
        await addLeavePermission(entry);
      }
      
      await fetchLeavePermission();
      setIsOpen(false);
      
      // Reset form and group leave states
      setFormData({
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
      setIsGroupLeave(false);
      setSelectedColleagues([]);
      setColleagueSearch("");
      
      const groupMessage = isGroupLeave ? 
        `Group leave request submitted successfully for ${leaveRequests.length} people!` : 
        "Leave request submitted successfully!";
      // alert(groupMessage);
    } catch (error) {
      console.error("Error adding leave permission:", error);
      // alert("Failed to submit leave request. Please try again.");
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === "reasonType" && value === "Sick") {
      setFormData(prev => ({ ...prev, [field]: value, returnTime: "" }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };
  const getTodayDate = ()=>{
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  const getTomorrowDate = ()=>{
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }
  const handleEmployeeSelect = (name: string, employee?: any) => {
    setFormData(prev => ({
      ...prev,
      name: name,
      department: employee?.department || prev.department,
      licensePlate: employee?.licensePlate || prev.licensePlate,
      role: employee?.role || prev.role 
    }));
  };

  const handleViewDetails = (entry: any) => {
    setSelectedEntry(entry);
    setIsDetailsOpen(true);
  };

  const handleApprovalAction = async (entryId: string, action: 'approved' | 'rejected') => {
    const entry = leavePermissions.find(e => e.id === entryId);
    if (!entry) return;
    const updatedEntry = { ...entry, statusFromHR: action };
    updatedEntry.approval = getOverallStatus(updatedEntry);
    await updateLeavePermission(entryId, {
      statusFromHR: action,
      approval: updatedEntry.approval
    });
    setIsDetailsOpen(false);
  };
  const getPendingHREntries = () => {
    return leavePermissions.filter(e => {
      const overallStatus = getOverallStatus(e);
      // Exclude group members (they have "Group with [name]" in reason and are already approved)
      const isGroupMember = e.reason && e.reason.includes('(Group with ') && e.approval === 'approved';
      return e.statusFromHR === 'pending' && overallStatus === 'pending' && !isGroupMember;
    });
  };

  const getProcessedEntries = () => {
    return leavePermissions.filter(e => 
      (e.statusFromHR === 'approved' || e.statusFromHR === 'rejected') && 
      !hiddenEntries.has(e.id)
    );
  };

  // New function to get all processed entries (including hidden ones)
  const getAllProcessedEntries = () => {
    return leavePermissions.filter(e => 
      e.statusFromHR === 'approved' || e.statusFromHR === 'rejected'
    );
  };


  const handleCleanTable = () => {
    const processedEntryIds = leavePermissions
      .filter(e => e.statusFromHR === 'approved' || e.statusFromHR === 'rejected')
      .map(e => e.id);
    
    const newHiddenEntries = new Set(processedEntryIds);
    setHiddenEntries(newHiddenEntries);
    localStorage.setItem('hrLeaveHiddenEntries', JSON.stringify([...newHiddenEntries]));
  };

  const handleShowAll = () => {
    setHiddenEntries(new Set());
    localStorage.removeItem('hrLeaveHiddenEntries');
  };

  return (
    <div className="max-h-screen from-primary/5 via-background to-accent/20 p-2 sm:p-3">
      <div className="z-10 sticky top-0 pb-2">
        <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between justify-center items-center">
          <div className="text-center sm:text-left">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">Leave Permission Request (HR Side)</h1>
            <p className="mt-1 text-xs sm:text-sm text-gray-500 px-2 sm:px-0">
              Welcome HR Management, Review leave requests with role-based approval workflow.
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
              
              <DialogContent className="sm:max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto bg-card/95 border-border/50 mx-2">
                <DialogHeader className="space-y-2 sm:space-y-3">
                  <DialogTitle className="text-lg sm:text-xl lg:text-2xl font-bold text-center">
                    Leave Request Registration
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
                        placeholder="Enter or search employee name"
                        value={formData.name}
                        onChange={handleEmployeeSelect}
                        employees={employees}
                        className="h-10 border-border/50 focus:border-primary"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="licensePlate" className="text-sm font-medium">
                        License Plate
                        <span className="text-xs italic opacity-40"> (Fill '-' if doesnt use vehicle)</span> 
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
                      <Autocomplete
                        id="department"
                        label="Department"
                        placeholder="Enter or search department"
                        value={formData.department}
                        onChange={(value) => handleInputChange("department", value)}
                        suggestions={departmentSuggestions}
                        className="h-10 border-border/50 focus:border-primary"
                        autoShowOnValueChange={false}
                        required
                      />
                    </div>
                    <div className="space-y-1 flex flex-col">
                      <Label htmlFor="role" className="text-sm font-medium">
                        Role
                      </Label>
                      <select
                        id="role"
                        title="Role"
                        value={formData.role}
                        onChange={(e) => handleInputChange("role", e.target.value)}
                        className="h-10 border border-border/50 rounded-md px-1 bg-background text-gray-500 text-sm focus:border-primary"
                        required
                      >
                        <option value="">Select role</option>
                        <option value="Staff">Staff</option>
                        <option value="Head Department">Head Department</option>
                      </select>
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
                      <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs px-2 py-1 h-7"
                      onClick={()=> handleInputChange("date", getTodayDate())}
                      >
                        Today
                      </Button>
                      <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs px-2 py-1 h-7"
                      onClick={()=> handleInputChange("date", getTomorrowDate())}
                      >
                        Tomorrow
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="exitTime" className="text-sm font-medium">
                        Exit Time <span className="text-red-500">*</span>
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
                      placeholder={formData.reasonType === "Sick" ? "Not required for Sick" : undefined}
                    />
                    {formData.reasonType === "Sick" &&(
                      <p className="text-xs text-muted-foreground ">Return time is not required for sick leave</p>
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
                      {formData.reasonType === "Sick" &&(
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
                              const mainDept = formData.department;
                              const sameDeptColleagues = availableColleagues.filter(c => 
                                c.department === mainDept
                              );
                              setSelectedColleagues(sameDeptColleagues);
                            }}
                            className="h-6 px-2"
                            disabled={formData.reasonType === "Sick"}
                          >
                            Select Same Dept
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
                      {formData.role === "Head Department" ? (
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          <span>Head Department → HR</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>Staff → HR → Head Department</span>
                        </div>
                      )}
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
                          "Submit Entry"
                        }
                      </span>
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {/* Pending Card */}
            <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="group relative px-3 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold border-2 hover:bg-primary hover:text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 w-full sm:w-auto"
                >
                  <Eye className="w-4 h-4 sm:w-5 sm:h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                  <span className="hidden sm:inline">View Waiting ({getPendingHREntries().length})</span>
                  <span className="sm:hidden">Waiting ({getPendingHREntries().length})</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-5xl w-[95vw] max-h-[90vh] overflow-y-auto bg-card/95 border-border/50 mx-2">
                <DialogHeader className="space-y-2 sm:space-y-3">
                  <DialogTitle className="text-lg sm:text-xl lg:text-2xl font-bold text-center">
                    Waiting HR Approval
                  </DialogTitle>
                  <DialogDescription className="text-center text-muted-foreground">
                    Leave requests awaiting HR approval
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  {getPendingHREntries().length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">No pending HR approvals</p>
                      <p className="text-sm">All entries have been processed</p>
                    </div>
                  ) : (
                    <div className="max-h-[60vh] overflow-x-auto overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Exit</TableHead>
                            <TableHead>Return</TableHead>
                            <TableHead>Required Approvals</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {getPendingHREntries().map((entry) => (
                            <TableRow key={entry.id}>
                              <TableCell className="font-medium">{entry.name}</TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  {entry.role === "Head Department" ? (
                                    <Crown className="w-4 h-4 mr-1 text-yellow-600" />
                                  ) : (
                                    <User className="w-4 h-4 mr-1 text-blue-600" />
                                  )}
                                  {entry.role}
                                </div>
                              </TableCell>
                              <TableCell>{entry.department}</TableCell>
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
                                <div className="text-xs">
                                  {getDisplayApprovals(entry.role).join(" → ")}
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
                  )}
                </div>
              </DialogContent>
            </Dialog>

            {/* Details Dialog */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
              <DialogContent className="w-[90vw] h-[90vh] rounded-xl sm:max-w-2xl lg:w-full md:w-full bg-card/95 border-border/50 lg:h-[90vh] overflow-auto scrollbar-hide">
                <DialogHeader className="space-y-1">
                  <DialogTitle className="text-2xl font-bold text-center">
                    Permission Detail
                  </DialogTitle>
                  <DialogDescription className="text-center text-muted-foreground">
                    Complete information for this Leave Permission Request
                  </DialogDescription>
                </DialogHeader>

                {selectedEntry && (
                  <div className="py-1 space-y-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-semibold flex items-center">
                          {selectedEntry.name}
                          {selectedEntry.role === "Head Department" ? (
                            <Crown className="w-5 h-5 ml-2 text-yellow-600" />
                          ) : (
                            <User className="w-5 h-5 ml-2 text-blue-600" />
                          )}
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
                          <p className="text-lg mt-1">{selectedEntry.department}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Role</label>
                          <p className="text-lg mt-1 flex items-center">
                            {selectedEntry.role === "Head Department" ? (
                              <Crown className="w-4 h-4 mr-2 text-yellow-600" />
                            ) : (
                              <User className="w-4 h-4 mr-2 text-blue-600" />
                            )}
                            {selectedEntry.role}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Date</label>
                          <p className="text-lg mt-1">{selectedEntry.date}</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Return Time</label>
                          <p className="text-lg mt-1 flex items-center">
                            <Clock className="w-4 h-4 mr-2" />
                            {selectedEntry.returnTime || 'Not set'}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Exit Time</label>
                          <p className="text-lg mt-1 flex items-center">
                            <Clock className="w-4 h-4 mr-2" />
                            {selectedEntry.exitTime || 'Not set'}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Required Approvals</label>
                          <p className="text-sm mt-1 bg-blue-50 px-3 py-2 rounded-lg">
                            {getDisplayApprovals(selectedEntry.role).join(" → ")}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-1 border-t border-border/30">
                      <label className="text-sm font-medium text-muted-foreground mb-1 block">Approval Status</label>
                      <div className="grid grid-cols-1 gap-4">
                        {getDisplayApprovals(selectedEntry.role).map((approval) => (
                          <div key={approval} className="flex justify-between items-center p-2 bg-muted/30 rounded-lg">
                            <div className="flex items-center">
                              {approval === "HR" && <Shield className="w-4 h-4 mr-2 text-blue-600" />}
                              {approval === "Head Department" && <User className="w-4 h-4 mr-2 text-green-600" />}
                              <label className="text-sm font-medium">{approval}</label>
                            </div>
                            <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                              (() => {
                                let status;
                                if (approval === "HR") {
                                  status = selectedEntry.statusFromHR;
                                } else if (approval === "Head Department") {
                                  status = selectedEntry.statusFromDepartment;
                                } else {
                                  status = 'pending';
                                }
                                
                                if (status === 'approved') return 'bg-green-100 text-green-800';
                                if (status === 'rejected') return 'bg-red-100 text-red-800';
                                return 'bg-yellow-100 text-yellow-800';
                              })()
                            }`}>
                              {(() => {
                                let status;
                                if (approval === "HR") {
                                  status = selectedEntry.statusFromHR;
                                } else if (approval === "Head Department") {
                                  status = selectedEntry.statusFromDepartment;
                                } else {
                                  status = 'pending';
                                }
                                return status.charAt(0).toUpperCase() + status.slice(1);
                              })()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-1 border-t border-border/30">
                      <label className="text-sm font-medium text-muted-foreground">Reason for Leave</label>
                      <p className="mt-2 text-sm leading-relaxed bg-muted/30 p-4 rounded-lg">
                        {selectedEntry.reason}
                      </p>
                    </div>

                    {selectedEntry.statusFromHR === 'pending' && (
                      <div className="pt-4 border-t border-border/30">
                        <label className="text-sm font-medium text-muted-foreground mb-3 block">HR Actions</label>
                        <div className="flex gap-3">
                          <Button
                            onClick={() => handleApprovalAction(selectedEntry.id, 'approved')}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Send className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleApprovalAction(selectedEntry.id, 'rejected')}
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

          {/* Recent Processed Entries Table */}
          {(getProcessedEntries().length > 0 || getAllProcessedEntries().length > 0) && (
            <div className="max-w-6xl mx-auto">
              <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-2 sm:p-4 shadow-lg">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-3 sm:mb-4 space-y-2 sm:space-y-0">
                  <div className="flex-1 hidden sm:block"></div>
                  <h3 className="text-base sm:text-lg font-semibold text-center flex-1">Processed Leave Requests</h3>
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
                    <TableHeader>
                      <TableRow className="sticky top-0 bg-white z-10">
                        <TableHead className="text-xs sm:text-sm px-1 sm:px-2">Name</TableHead>
                        <TableHead className="text-xs sm:text-sm px-1 sm:px-2">Role</TableHead>
                        <TableHead className="text-xs sm:text-sm px-1 sm:px-2">Department</TableHead>
                        <TableHead className="text-xs sm:text-sm px-1 sm:px-2">Date</TableHead>
                        <TableHead className="text-xs sm:text-sm px-1 sm:px-2">Exit</TableHead>
                        <TableHead className="text-xs sm:text-sm px-1 sm:px-2">Return</TableHead>
                        <TableHead className="text-xs sm:text-sm px-1 sm:px-2">Overall Status</TableHead>
                        <TableHead className="text-xs sm:text-sm px-1 sm:px-2">Approval Progress</TableHead>
                        <TableHead className="text-xs sm:text-sm px-1 sm:px-2 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getProcessedEntries().length === 0 && getAllProcessedEntries().length > 0 && (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8">
                            <div className="flex flex-col items-center justify-center space-y-3">
                              <Eye className="w-12 h-12 text-muted-foreground/50" />
                              <div className="text-muted-foreground">
                                <p className="font-medium">All processed entries are hidden</p>
                                <p className="text-sm">
                                  {getAllProcessedEntries().length} entries have been processed. 
                                  Click "Show All" to view them.
                                </p>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                      {getProcessedEntries().map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="font-medium text-xs sm:text-sm px-1 sm:px-2">{entry.name}</TableCell>
                          <TableCell className="text-xs sm:text-sm px-1 sm:px-2">
                            <div className="flex items-center">
                              {entry.role === "Head Department" ? (
                                <Crown className="w-3 h-3 sm:w-4 sm:h-4 mr-1 text-yellow-600" />
                              ) : (
                                <User className="w-3 h-3 sm:w-4 sm:h-4 mr-1 text-blue-600" />
                              )}
                              <span className="text-xs sm:text-sm truncate max-w-20 sm:max-w-none">{entry.role}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm px-1 sm:px-2 truncate max-w-24 sm:max-w-none">{entry.department}</TableCell>
                          <TableCell className="text-xs sm:text-sm px-1 sm:px-2">{entry.date}</TableCell>
                          <TableCell className="text-xs sm:text-sm px-1 sm:px-2">
                            <div className="flex items-center">
                              <Clock className="w-2 h-2 sm:w-3 sm:h-3 mr-1" />
                              {entry.exitTime}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm px-1 sm:px-2">
                            <div className="flex items-center">
                              <Clock className="w-2 h-2 sm:w-3 sm:h-3 mr-1" />
                              <span className="truncate max-w-16 sm:max-w-none">{entry.returnTime || 'Not set'}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm px-1 sm:px-2">
                            <div className={`inline-flex px-1 py-1 sm:px-2 rounded-full text-xs font-medium ${
                              getOverallStatus(entry) === 'approved' ? 'bg-green-100 text-green-800' :
                              getOverallStatus(entry) === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              <span className="hidden sm:inline">{getOverallStatus(entry).charAt(0).toUpperCase() + getOverallStatus(entry).slice(1)}</span>
                              <span className="sm:hidden">{getOverallStatus(entry).charAt(0).toUpperCase()}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm px-1 sm:px-2">
                            <div className="flex items-center space-x-1">
                              {entry.role === "Head Department" ? (
                                // Head Department workflow: HD → HR
                                <>
                                  <div className="flex items-center">
                                    <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${
                                      entry.statusFromDepartment === 'approved' ? 'bg-green-500' :
                                      entry.statusFromDepartment === 'rejected' ? 'bg-red-500' :
                                      'bg-yellow-500'
                                    }`} title={`Head Department: ${entry.statusFromDepartment}`} />
                                    <div className="w-1 sm:w-2 h-0.5 bg-gray-300 mx-1" />
                                    <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${
                                      entry.statusFromHR === 'approved' ? 'bg-green-500' :
                                      entry.statusFromHR === 'rejected' ? 'bg-red-500' :
                                      'bg-yellow-500'
                                    }`} title={`HR: ${entry.statusFromHR}`} />
                                  </div>
                                </>
                              ) : (
                                // Staff workflow: Staff → HD → HR
                                <>
                                  <div className="flex items-center">
                                    <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${
                                      entry.statusFromDepartment === 'approved' ? 'bg-green-500' :
                                      entry.statusFromDepartment === 'rejected' ? 'bg-red-500' :
                                      'bg-yellow-500'
                                    }`} title={`Head Department: ${entry.statusFromDepartment}`} />
                                    <div className="w-1 sm:w-2 h-0.5 bg-gray-300 mx-1" />
                                    <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${
                                      entry.statusFromHR === 'approved' ? 'bg-green-500' :
                                      entry.statusFromHR === 'rejected' ? 'bg-red-500' :
                                      'bg-yellow-500'
                                    }`} title={`HR: ${entry.statusFromHR}`} />
                                  </div>
                                </>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {entry.role === "Head Department" ? (
                                <>
                                  <span className={`${
                                    entry.statusFromDepartment === 'approved' ? 'text-green-600' :
                                    entry.statusFromDepartment === 'rejected' ? 'text-red-600' :
                                    'text-yellow-600'
                                  }`}>HD→</span>
                                </>
                              ) : (
                                <>
                                  <span className={`${
                                    entry.statusFromDepartment === 'approved' ? 'text-green-600' :
                                    entry.statusFromDepartment === 'rejected' ? 'text-red-600' :
                                    'text-yellow-600'
                                  }`}>HD→</span>
                                </>
                              )}
                              <span className={`${
                                entry.statusFromHR === 'approved' ? 'text-green-600' :
                                entry.statusFromHR === 'rejected' ? 'text-red-600' :
                                'text-yellow-600'
                              }`}>HR</span>
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