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
import { Plus, Send, Sparkles, Zap, Eye, Calendar, Clock, User, MoreHorizontal, FileText, X, Shield, Crown } from "lucide-react";

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
      
    const newEntry = {
      name: formData.name,
      licensePlate: formData.licensePlate,
      department: formData.department,
      role: formData.role,
      date: formData.date,
      exitTime: formData.exitTime,
      returnTime: formData.returnTime,
      reason: reasonValue,
      approval: "pending",
      statusFromDepartment: "pending",
      statusFromHR: "pending",
      statusFromDirector: "pending",
      submittedAt: formatted,
      actual_exittime: null,
      actual_returntime: null
    };
    await addLeavePermission(newEntry);
    await fetchLeavePermission();
    setIsOpen(false);
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
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === "reasonType" && value === "Sick") {
      setFormData(prev => ({ ...prev, [field]: value, returnTime: "" }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleEmployeeSelect = (name: string, employee?: any) => {
    setFormData(prev => ({
      ...prev,
      name: name,
      department: employee?.department || prev.department,
      licensePlate: employee?.licensePlate || prev.licensePlate
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
      return e.statusFromHR === 'pending' && overallStatus === 'pending';
    });
  };

  const getProcessedEntries = () => {
    return leavePermissions.filter(e => 
      (e.statusFromHR === 'approved' || e.statusFromHR === 'rejected') && 
      !hiddenEntries.has(e.id)
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

  return (
    <div className="max-h-screen from-primary/5 via-background to-accent/20 p-3">
      <div className="z-10 sticky top-0 pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between justify-center items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Leave Permission Request (HR Side)</h1>
            <p className="mt-1 text-sm text-gray-500">
              Welcome HR Management, Review leave requests with role-based approval workflow.
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
              
              <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-card/95 border-border/50">
                <DialogHeader className="space-y-3">
                  <DialogTitle className="text-2xl font-bold text-center">
                    Leave Request Registration
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
                      Submit Entry
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
                  className="group relative px-2 py-2 text-sm font-semibold border-2 hover:bg-primary hover:text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <Eye className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                  View Waiting ({getPendingHREntries().length})
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto bg-card/95 border-border/50">
                <DialogHeader className="space-y-3">
                  <DialogTitle className="text-2xl font-bold text-center">
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
          {getProcessedEntries().length > 0 && (
            <div className="max-w-6xl mx-auto">
              <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-4 shadow-lg">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex-1"></div>
                  <h3 className="text-lg font-semibold text-center flex-1">Processed Leave Requests</h3>
                  <div className="flex-1 flex justify-end">
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
                    <TableHeader>
                      <TableRow className="sticky top-0 bg-white z-10">
                        <TableHead>Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Exit</TableHead>
                        <TableHead>Return</TableHead>
                        <TableHead>Overall Status</TableHead>
                        <TableHead>Approval Progress</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getProcessedEntries().map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="font-medium">{entry.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              {entry.role === "Head Department" ? (
                                <Crown className="w-4 h-4 mr-1 text-yellow-600" />
                              ) : (
                                <User className="w-4 h-4 mr-1 text-blue-600" />
                              )}
                              <span className="text-sm">{entry.role}</span>
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
                              {entry.role === "Head Department" ? (
                                // Head Department workflow: HD → HR
                                <>
                                  <div className="flex items-center">
                                    <div className={`w-3 h-3 rounded-full ${
                                      entry.statusFromDepartment === 'approved' ? 'bg-green-500' :
                                      entry.statusFromDepartment === 'rejected' ? 'bg-red-500' :
                                      'bg-yellow-500'
                                    }`} title={`Head Department: ${entry.statusFromDepartment}`} />
                                    <div className="w-2 h-0.5 bg-gray-300 mx-1" />
                                    <div className={`w-3 h-3 rounded-full ${
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
                                    <div className={`w-3 h-3 rounded-full ${
                                      entry.statusFromDepartment === 'approved' ? 'bg-green-500' :
                                      entry.statusFromDepartment === 'rejected' ? 'bg-red-500' :
                                      'bg-yellow-500'
                                    }`} title={`Head Department: ${entry.statusFromDepartment}`} />
                                    <div className="w-2 h-0.5 bg-gray-300 mx-1" />
                                    <div className={`w-3 h-3 rounded-full ${
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
                                // <span className="text-green-600">HD→</span>
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
        </div>
      </div>
    </div>
  );
}