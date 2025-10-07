
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FilePlus, DoorOpen, Plus, Send, Sparkles, Zap, Calendar, Clock, User, CircleCheck, XCircle, RefreshCw } from "lucide-react";
import Clock2 from "../components/dashboard/clock"
import { useDashboardStore } from "@/store/dashboardStore";
import { initWebSocket, onMessage, closeWebSocket, onConnectionChange, onDataChange } from "@/lib/ws";
interface User {
  name: string;
  department: string;
  role: string;
  uid: string;
  licenseplate: string;
}

export default function UserLeavePage(){
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any | null>(null);
  const [isGroupLeave, setIsGroupLeave] = useState(false);
  const [selectedColleagues, setSelectedColleagues] = useState<User[]>([]);
  const [availableColleagues, setAvailableColleagues] = useState<User[]>([]);
  const [colleagueSearch, setColleagueSearch] = useState("");
  const [hiddenEntries, setHiddenEntries] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('userLeaveHiddenEntries');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});
  
  // Dashboard store hooks
  const leavePermissions = useDashboardStore(state => state.leavePermissions);
  const fetchLeavePermission = useDashboardStore(state => state.fetchLeavePermission);
  const addLeavePermission = useDashboardStore(state => state.addLeavePermission);
  const users = useDashboardStore(state => state.users);
  const fetchUsers = useDashboardStore(state => state.fetchUsers);
  const loading = useDashboardStore(state => state.loading);
  const error = useDashboardStore(state => state.error);

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
    let mounted = true;
    let unsubscribeDataChange: (() => void) | null = null;
    let unsubscribeLeaveChange: (() => void) | null = null;

    unsubscribeLeaveChange = onDataChange('leave_permission', (data) => {
      if (!mounted) return;
      setTimeout(() => {
        if (mounted) fetchLeavePermission();
      }, 100);
    });

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
          console.log("Parsed user data:", parsedUser); 
          setCurrentUser({
            name: parsedUser.name,
            department: parsedUser.department,
            role: parsedUser.role,
            uid: parsedUser.uid,
            licenseplate: parsedUser.licenseplate || parsedUser.licensePlate || "" 
          });
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
    fetchLeavePermission();
    fetchUsers();

    return () => {
      mounted = false;
      if (unsubscribeLeaveChange) unsubscribeLeaveChange();
    };
  }, [fetchLeavePermission, fetchUsers]);

  useEffect(() => {
    if (currentUser && users.length > 0 && !currentUser.licenseplate) {
      const userFromDB = users.find(user => 
        user.name === currentUser.name || user.uid === currentUser.uid
      );
      if (userFromDB && userFromDB.licenseplate) {
        console.log("Found license plate from database:", userFromDB.licenseplate);
        setCurrentUser(prev => prev ? {
          ...prev,
          licenseplate: userFromDB.licenseplate
        } : null);
      }
    }
  }, [currentUser, users]);

  useEffect(() => {
    if (currentUser && users.length > 0) {
      const colleagues = users.filter(user => 
        user.name !== currentUser.name 
      );
      setAvailableColleagues(colleagues);
    }
  }, [currentUser, users]);

  useEffect(() => {
    if (currentUser) {
      console.log("Current user license plate:", currentUser.licenseplate); 
      setFormData(prev => ({
        ...prev,
        name: currentUser.name,
        department: currentUser.department,
        role: currentUser.role,
        licensePlate: currentUser.licenseplate || "No license plate found", 
      }));
    }
  }, [currentUser]);

  // Get user's own leave requests
  const getUserLeaveRequests = () => {
    if (!currentUser) return [];
    return leavePermissions.filter(entry => 
      entry.name === currentUser.name && !hiddenEntries.has(entry.id)
    );
  };

  // Handle clean table - hide processed entries
  const handleCleanTable = () => {
    if (!currentUser) return;
    const processedEntryIds = leavePermissions
      .filter(e => 
        e.name === currentUser.name && 
        (calculateOverallApproval(e) === 'approved' || calculateOverallApproval(e) === 'rejected')
      )
      .map(e => e.id);
    
    const newHiddenEntries = new Set(processedEntryIds);
    setHiddenEntries(newHiddenEntries);
    localStorage.setItem('userLeaveHiddenEntries', JSON.stringify([...newHiddenEntries]));
  };

  // Handle show all - show hidden entries
  const handleShowAll = () => {
    setHiddenEntries(new Set());
    localStorage.removeItem('userLeaveHiddenEntries');
  };

  // Get processed entries (for display logic)
  const getProcessedUserEntries = () => {
    if (!currentUser) return [];
    return leavePermissions.filter(entry => 
      entry.name === currentUser.name &&
      (calculateOverallApproval(entry) === 'approved' || calculateOverallApproval(entry) === 'rejected') &&
      !hiddenEntries.has(entry.id)
    );
  };

  // Get All Processed Data
  const getAllProcessedUserEntries = () => {
    if (!currentUser) return [];
    return leavePermissions.filter(entry => 
      entry.name === currentUser.name &&
      (calculateOverallApproval(entry) === 'approved' || calculateOverallApproval(entry) === 'rejected')
    );
  };

  const calculateOverallApproval = (entry: any) => {
    const requiredApprovals = ["statusFromDepartment", "statusFromHR"];

    if (entry.role === "Head Department") {
      requiredApprovals.push("statusFromDirector");
    }
    const hasRejection = requiredApprovals.some(approval => 
      entry[approval] === "rejected"
    );
    if (hasRejection) {
      return "rejected";
    }
    const allApproved = requiredApprovals.every(approval => 
      entry[approval] === "approved"
    );

    if (allApproved) {
      return "approved";
    }

    return "pending";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setFieldErrors({});
    setShowSuccessMessage(false);
    
    const errors: {[key: string]: string} = {};
    
    if (!currentUser) {
      setSuccessMessage("User information not available. Please log in again.");
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
      return;
    }

    if (!formData.date.trim()) {
      errors.date = "Please select a date";
    }

    if (!formData.exitTime.trim()) {
      errors.exitTime = "Please enter an exit time";
    }

    if (!formData.reasonType) {
      errors.reasonType = "Please select a reason type";
    }

    if (formData.reasonType === "Outside" && !formData.outsideReason.trim()) {
      errors.outsideReason = "Please explain the reason for leaving (Outside)";
    }

    if (formData.reasonType !== "Sick" && !formData.returnTime) {
      errors.returnTime = "Please enter a return time";
    }
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    let reasonValue = formData.reasonType === "Outside" ? formData.outsideReason : formData.reasonType;
    if (!reasonValue) {
      reasonValue = formData.reason;
    }
    
    const now = new Date();
    const formatted = now.getFullYear() + '-' +
    String(now.getMonth() + 1).padStart(2, '0') + '-' +
    String(now.getDate()).padStart(2, '0') + ' ' +
    String(now.getHours()).padStart(2, '0') + ':' +
    String(now.getMinutes()).padStart(2, '0') + ':' +
    String(now.getSeconds()).padStart(2, '0');
    
    const leaveRequests = [];
    const currentUserEntry = {
      name: currentUser.name,
      uid: currentUser.uid,
      licensePlate: currentUser.licenseplate,
      department: currentUser.department,
      role: currentUser.role,
      date: formData.date,
      exitTime: formData.exitTime,
      returnTime: formData.reasonType === "Sick" ? "" : formData.returnTime,
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
    leaveRequests.push(currentUserEntry);
    
    if (isGroupLeave && selectedColleagues.length > 0) {
      selectedColleagues.forEach(colleague => {
        const colleagueEntry = {
          name: colleague.name,
          uid: colleague.uid,
          licensePlate: colleague.licenseplate || "",
          department: colleague.department,
          role: colleague.role,
          date: formData.date,
          exitTime: formData.exitTime,
          returnTime: formData.reasonType === "Sick" ? "" : formData.returnTime,
          reason: `${reasonValue} (Group with ${currentUser.name})`,
          approval: "approved", 
          statusFromDepartment: "approved",
          statusFromHR: "approved", 
          statusFromDirector: "approved",
          submittedAt: formatted,
          actual_exittime: null,
          actual_returntime: null,
          groupLeader: currentUser.name, 
          isGroupMember: true 
        };
        leaveRequests.push(colleagueEntry);
      });
    }

    try {
      for (const request of leaveRequests) {
        await addLeavePermission(request);
      }
      await fetchLeavePermission();
      setIsOpen(false);
      setFormData({
        name: currentUser.name,
        licensePlate: currentUser.licenseplate,
        department: currentUser.department,
        role: currentUser.role,
        date: "",
        exitTime: "",
        returnTime: "",
        reason: "",
        reasonType: "",
        outsideReason: "",
      });
      
      // Reset group leave states
      setIsGroupLeave(false);
      setSelectedColleagues([]);
      setColleagueSearch("");
      
      const groupMessage = isGroupLeave ? 
        `Group leave request submitted successfully for ${leaveRequests.length} people!` : 
        "Leave request submitted successfully!";
      
      setSuccessMessage(groupMessage);
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
    } catch (error) {
      console.error("Error adding leave permission:", error);
      setSuccessMessage("Failed to submit leave request. Please try again.");
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === "licensePlate" || field === "name" || field === "department" || field === "role") {
      return;
    }    
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    
    if (field === "reasonType" && value === "Sick") {
      setFormData(prev => ({ ...prev, [field]: value, returnTime: "" }));
      // Also clear returnTime error if it exists
      if (fieldErrors.returnTime) {
        setFieldErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.returnTime;
          return newErrors;
        });
      }
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  if (isLoading) {
    return <div className="p-4">Loading...</div>;
  }

  if (!currentUser) {
    return <div className="p-4">Please log in to submit leave requests.</div>;
  }

  const userLeaveRequests = getUserLeaveRequests();

  return(
    <div className="h-screen overflow-hidden flex flex-col space-y-2 sm:space-y-4 p-2 sm:p-4">
      <div className="z-10 sticky top-0 pb-2">
        <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-center sm:text-left">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Leave Permission Request</h1>
            <p className="mt-1 text-xs sm:text-sm text-gray-500 px-2 sm:px-0">
              Have an urgent business outside the company? Write a request letter.
            </p>
          </div>
        </div>
      </div>
      <div className="w-full max-w-6xl mx-auto bg-white shadow-lg sm:shadow-2xl rounded-t-2xl sm:rounded-t-3xl overflow-hidden h-full flex flex-col">
        <div className="bg-blue-500 text-white flex items-center justify-between w-full py-2 sm:py-3">
          <h2 className="text-left text-sm sm:text-lg lg:text-xl font-bold px-2 sm:px-4">Leave Request History</h2>
          <div className="flex justify-end items-center gap-1 sm:gap-2 pr-2 sm:pr-3">
            {/* Clear Table and Show All buttons */}
            <Button
              size="sm"
              onClick={handleShowAll}
              className="group relative px-2 py-1 sm:px-3 text-xs font-medium bg-white border border-white/30 text-black hover:bg-white/50 hover:border-white/70 transition-all duration-300 hover:scale-105 backdrop-blur-sm"
            >
              <RefreshCw className="w-3 h-3 sm:mr-1 group-hover:rotate-180 transition-transform duration-300" />
              <span className="hidden sm:inline">Show All</span>
            </Button>
            <Button
              size="sm"
              onClick={handleCleanTable}
              className="group relative px-2 py-1 sm:px-3 text-xs font-medium bg-white border border-white/30 text-black hover:bg-white/50 hover:border-white/70 transition-all duration-300 hover:scale-105 backdrop-blur-sm"
            >
              <Sparkles className="w-3 h-3 sm:mr-1 group-hover:rotate-12 transition-transform duration-300" />
              <span className="hidden sm:inline">Clear</span>
            </Button>
            <div>
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button 
                    size="sm"
                    className="group relative px-2 py-1 sm:px-4 sm:py-2 font-semibold bg-white hover:bg-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    <DoorOpen className="text-black w-4 h-4 sm:w-5 sm:h-5"/>
                  </Button>
                </DialogTrigger>
                
                <DialogContent className="sm:max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto bg-card/95 border-border/50 mx-2">
                  <DialogHeader className="space-y-2 sm:space-y-3">
                    <DialogTitle className="text-lg sm:text-xl lg:text-2xl font-bold text-center">
                      Leave Request Registration
                    </DialogTitle>
                    <DialogDescription className="text-center text-muted-foreground text-sm">
                      Please fill in all required information for the entry log.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-3 sm:space-y-4 py-2 sm:py-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium">
                          Nama / {""}
                          <span className="italic text-xs opacity-45">Name</span>
                        </Label>
                        <Input
                          id="name"
                          placeholder="Enter name"
                          value={formData.name}
                          disabled
                          readOnly
                          className="h-10 border-border/50 bg-gray-100 text-gray-700 cursor-not-allowed"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="licensePlate" className="text-sm font-medium">
                          Plat Nomor / {""}
                          <span className="italic text-xs opacity-45">License Plate</span>
                        </Label>
                        <Input
                          id="licensePlate"
                          placeholder="Loading license plate..."
                          value={formData.licensePlate || "Loading..."}
                          disabled
                          readOnly
                          className="h-10 border-border/50 bg-gray-100 text-gray-700 cursor-not-allowed"
                          required
                        />
                      </div>
                    </div>
                    
                    {/* Group Leave Option */}
                    <div className="space-y-3 border-t pt-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="groupLeave"
                          checked={isGroupLeave}
                          onChange={(e) => setIsGroupLeave(e.target.checked)}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor="groupLeave" className="text-sm font-medium">
                          Undang Teman / {""}
                          <span className="italic text-xs opacity-45">Cross-Department Group Leave</span>
                        </Label>
                      </div>
                      
                      {isGroupLeave && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">
                            Pilih teman dari departemen mana saja / {""}
                            <span className="italic text-xs opacity-45">Select Colleagues from Any Department</span>
                          </Label>
                          
                          {/* Search input */}
                          <Input
                            placeholder="Cari berdasarkan nama..."
                            value={colleagueSearch}
                            onChange={(e) => setColleagueSearch(e.target.value)}
                            className="h-8 text-sm"
                          />
                          
                          {/* Quick actions */}
                          <div className="flex gap-2 text-xs">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedColleagues([])}
                              className="h-6 px-2"
                            >
                              Hapus Semua
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const sameDeptColleagues = availableColleagues.filter(c => 
                                  c.department === currentUser?.department
                                );
                                setSelectedColleagues(sameDeptColleagues);
                              }}
                              className="h-6 px-2"
                            >
                              Departemen saya 
                            </Button>
                          </div>
                          
                          <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-2 border-blue-600 bg-gray-50">
                            {availableColleagues.length === 0 ? (
                              <p className="text-sm text-gray-500 text-center py-2">
                                No colleagues available
                              </p>
                            ) : (
                              (() => {
                                const filtered = availableColleagues.filter(colleague =>
                                  colleague.name.toLowerCase().includes(colleagueSearch.toLowerCase()) ||
                                  colleague.department.toLowerCase().includes(colleagueSearch.toLowerCase())
                                );
                                
                                return Object.entries(
                                  filtered.reduce((acc, colleague) => {
                                    const dept = colleague.department;
                                    if (!acc[dept]) acc[dept] = [];
                                    acc[dept].push(colleague);
                                    return acc;
                                  }, {} as Record<string, typeof availableColleagues>)
                                ).map(([department, colleagues]) => (
                                <div key={department} className="space-y-1">
                                  <div className="text-xs font-semibold text-gray-700 bg-gray-200 px-2 py-1 rounded">
                                    {department} ({colleagues.length})
                                  </div>
                                  {colleagues.map((colleague) => (
                                    <div key={colleague.uid} className="flex items-center space-x-2 ml-2">
                                      <input
                                        type="checkbox"
                                        id={`colleague-${colleague.uid}`}
                                        checked={selectedColleagues.some(c => c.uid === colleague.uid)}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setSelectedColleagues(prev => [...prev, colleague]);
                                          } else {
                                            setSelectedColleagues(prev => prev.filter(c => c.uid !== colleague.uid));
                                          }
                                        }}
                                        className="rounded border-gray-300"
                                      />
                                      <Label htmlFor={`colleague-${colleague.uid}`} className="text-sm">
                                        {colleague.name} ({colleague.role})
                                      </Label>
                                    </div>
                                  ))}
                                </div>
                              ))
                            })()
                            )}
                          </div>
                          {selectedColleagues.length > 0 && (
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-blue-800">
                                Selected colleagues ({selectedColleagues.length}):
                              </p>
                              <div className="text-sm text-blue-600 space-y-1">
                                {selectedColleagues.map(c => (
                                  <div key={c.uid} className="flex justify-between items-center bg-blue-50 px-2 py-1 rounded">
                                    <span>{c.name} ({c.department})</span>
                                    <button
                                      onClick={() => setSelectedColleagues(prev => prev.filter(col => col.uid !== c.uid))}
                                      className="text-red-500 hover:text-red-700 ml-2"
                                      type="button"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="department" className="text-sm font-medium">
                          Departemen / {""}
                          <span className="italic text-xs opacity-45">Department</span>
                        </Label>
                        <Input
                          id="department"
                          placeholder="Enter department"
                          value={formData.department}
                          disabled
                          readOnly
                          className="h-10 border-border/50 bg-gray-100 text-gray-700 cursor-not-allowed"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="date" className="text-sm font-medium">
                          Tanggal / {""}
                          <span className="italic text-xs opacity-45">Date</span>
                        </Label>
                        <div className="space-y-2">
                          <Input
                            id="date"
                            type="date"
                            value={formData.date}
                            onChange={(e) => handleInputChange("date", e.target.value)}
                            className={`h-10 border-border/50 focus:border-primary ${fieldErrors.date ? 'border-red-500 focus:border-red-500' : ''}`}
                            min={getTodayDate()}
                            required
                          />
                          {fieldErrors.date && (
                            <p className="text-red-500 text-xs mt-1">{fieldErrors.date}</p>
                          )}
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleInputChange("date", getTodayDate())}
                              className="text-xs px-2 py-1 h-7"
                            >
                              Hari ini
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleInputChange("date", getTomorrowDate())}
                              className="text-xs px-2 py-1 h-7"
                            >
                              Besok
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="exitTime" className="text-sm font-medium">
                          Jam Keluar / {""}
                          <span className="italic text-xs opacity-45">Exit Time</span>
                        </Label>
                        <Input
                          id="exitTime"
                          type="time"
                          value={formData.exitTime}
                          onChange={(e) => handleInputChange("exitTime", e.target.value)}
                          className={`h-10 border-border/50 focus:border-primary ${fieldErrors.exitTime ? 'border-red-500 focus:border-red-500' : ''}`}
                        />
                        {fieldErrors.exitTime && (
                          <p className="text-red-500 text-xs mt-1">{fieldErrors.exitTime}</p>
                        )}
                      </div>
                    <div className="space-y-2">
                      <Label htmlFor="returnTime" className="text-sm font-medium">
                          Jam Kembali / {""}
                          <span className="italic text-xs opacity-45">Return Time {""}</span>
                          {formData.reasonType === "Sick" && <span className="text-blue-500">(Tidak Perlu)</span>}
                      </Label>
                      <Input
                        id="returnTime"
                        type="time"
                        value={formData.returnTime}
                        onChange={(e) => handleInputChange("returnTime", e.target.value)}
                        className={`h-10 border-border/50 focus:border-primary ${formData.reasonType === "Sick"
                            ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                            : ""
                          } ${fieldErrors.returnTime ? 'border-red-500 focus:border-red-500' : ''}`}
                        required={formData.reasonType !== "Sick"}
                        disabled={formData.reasonType === "Sick"}
                        placeholder={formData.reasonType === "Sick" ? "Not required for Sick" : undefined}
                      />
                      {fieldErrors.returnTime && (
                        <p className="text-red-500 text-xs mt-1">{fieldErrors.returnTime}</p>
                      )}
                    </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reasonType" className="text-sm font-medium">
                        Jenis Izin  / {""}
                        <span className="italic text-xs opacity-45">Type of Leave</span>
                      </Label>
                      <Select 
                        value={formData.reasonType} 
                        onValueChange={(value) => handleInputChange("reasonType", value)}
                      >
                        <SelectTrigger className={`h-10 border-border/50 focus:border-primary ${fieldErrors.reasonType ? 'border-red-500 focus:border-red-500' : ''}`}>
                          <SelectValue placeholder="Select reason type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PT">Plant / {""}
                            <span className="italic text-xs opacity-45">PT</span>
                          </SelectItem>
                          <SelectItem value="Sick">Sick / {""}
                            <span className="italic text-xs opacity-45">Sick</span>
                          </SelectItem>
                          <SelectItem value="Outside">Keluar / {""}
                            <span className="italic text-xs opacity-45">Outside</span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {fieldErrors.reasonType && (
                        <p className="text-red-500 text-xs mt-1">{fieldErrors.reasonType}</p>
                      )}
                    </div>
                    
                    {formData.reasonType === "Outside" && (
                      <div className="space-y-2">
                        <Label htmlFor="outsideReason" className="text-sm font-medium">
                          Alasan Izin Keluar / {""}
                          <span className="italic text-xs opacity-45">Specify Reason</span>
                        </Label>
                        <Input
                          id="outsideReason"
                          placeholder="Masukan alasan..."
                          value={formData.outsideReason}
                          onChange={(e) => handleInputChange("outsideReason", e.target.value)}
                          className={`h-10 border-border/50 focus:border-primary ${fieldErrors.outsideReason ? 'border-red-500 focus:border-red-500' : ''}`}
                          required={formData.reasonType === "Outside"}
                        />
                        {fieldErrors.outsideReason && (
                          <p className="text-red-500 text-xs mt-1">{fieldErrors.outsideReason}</p>
                        )}
                      </div>
                    )}
                    
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
                        onClick={handleSubmit} 
                        className="w-full sm:w-auto group order-1 sm:order-2"
                      >
                        <Send className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform duration-200" />
                        <span className="text-xs sm:text-sm">
                          {isGroupLeave ? 
                            `Send Group Request (${selectedColleagues.length + 1})` : 
                            "Send Request"
                          }
                        </span>
                      </Button>
                    </DialogFooter>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        <div className="flex-1 px-2 sm:px-4 py-2">
          <div className="h-[30rem] sm:h-[35rem] overflow-x-auto scrollbar-hide">
            <table className="w-full text-xs sm:text-sm text-center min-w-[800px]">
              <thead className="sticky top-0 bg-blue-50">
                <tr className="border-b">
                  <th className="py-2 px-1 sm:px-2 min-w-[80px]">Name</th>
                  <th className="py-2 px-1 sm:px-2 min-w-[100px]">License Plate</th>
                  <th className="py-2 px-1 sm:px-2 min-w-[80px]">Date</th>
                  <th className="py-2 px-1 sm:px-2 min-w-[80px]">Exit Time</th>
                  <th className="py-2 px-1 sm:px-2 min-w-[80px]">Return Time</th>
                  <th className="py-2 px-1 sm:px-2 min-w-[120px]">Reason</th>
                  <th className="py-2 px-1 sm:px-2 min-w-[80px]">Approval</th>
                  <th className="py-2 px-1 sm:px-2 min-w-[120px]">Approval Progress</th>
                  <th className="py-2 px-1 sm:px-2 min-w-[80px]"></th>
                </tr>
              </thead>
              <tbody>
                {userLeaveRequests.length === 0 && getAllProcessedUserEntries().length > 0 && (
                  <tr>
                    <td colSpan={9} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <User className="w-12 h-12 text-muted-foreground/50" />
                        <div className="text-muted-foreground">
                          <p className="font-medium">All processed entries are hidden</p>
                          <p className="text-sm">
                            {getAllProcessedUserEntries().length} entries have been processed. 
                            Click "Show All" to view them.
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
                
                {userLeaveRequests.length === 0 && getAllProcessedUserEntries().length === 0 && (
                  <tr>
                    <td colSpan={9} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <Calendar className="w-12 h-12 text-muted-foreground/50" />
                        <div className="text-muted-foreground">
                          <p className="font-medium">No leave requests yet</p>
                          <p className="text-sm">Submit your first leave request to get started</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
                
                {userLeaveRequests.map((entry, i) => (
                  <tr key={entry.id || i} className="border-b hover:bg-gray-100">
                    <td className="py-2 px-1 sm:px-2 text-xs sm:text-sm">{entry.name}</td>
                    <td className="py-2 px-1 sm:px-2 text-xs sm:text-sm font-mono">{entry.licensePlate}</td>
                    <td className="py-2 px-1 sm:px-2 text-xs sm:text-sm">{entry.date}</td>
                    <td className="py-2 px-1 sm:px-2 text-xs sm:text-sm">{entry.exitTime}</td>
                    <td className="py-2 px-1 sm:px-2 text-xs sm:text-sm">{!entry.returnTime || entry.reason === "Sick" ? "N/A" : entry.returnTime}</td>
                    <td className="py-2 px-1 sm:px-2 max-w-xs truncate text-xs sm:text-sm" title={entry.reason}>
                      {entry.reason?.includes("Group leave") ? (
                        <span className="inline-flex items-center px-1 sm:px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                          👥 <span className="hidden sm:inline ml-1">Group</span>
                        </span>
                      ) : (
                        <span className="truncate block max-w-[100px] sm:max-w-none">{entry.reason}</span>
                      )}
                    </td>
                    <td className="py-2 px-1 sm:px-2">
                      {calculateOverallApproval(entry) === "approved" && (
                        <div className="flex items-center justify-center text-green-600">
                          <CircleCheck className="w-4 h-4 sm:w-5 sm:h-5"/>
                        </div>
                      )}  
                      {calculateOverallApproval(entry) === "rejected" && (
                        <div className="flex items-center justify-center text-red-600">
                          <XCircle className="w-4 h-4 sm:w-5 sm:h-5"/>
                        </div>
                      )}  
                      {calculateOverallApproval(entry) === "pending" && (
                        <div className="flex items-center justify-center text-yellow-600">
                          <Clock className="w-4 h-4 sm:w-5 sm:h-5"/>
                        </div>
                      )}  
                    </td>
                    <td className="py-2 px-1 sm:px-2 text-xs flex flex-col space-y-1">
                      <div className="flex items-center justify-center space-x-1">
                        <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${
                          entry.statusFromDepartment === 'approved' ? 'bg-green-500' :
                          entry.statusFromDepartment === 'rejected' ? 'bg-red-500' :
                          'bg-yellow-500'
                        }`} title={`Department: ${entry.statusFromDepartment}`} />
                        <div className="w-1 sm:w-2 h-0.5 bg-gray-300 mx-1" />
                        <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${
                          entry.statusFromHR === 'approved' ? 'bg-green-500' :
                          entry.statusFromHR === 'rejected' ? 'bg-red-500' :
                          'bg-yellow-500'
                        }`} title={`HR: ${entry.statusFromHR}`} />
                      </div>
                      <div className="text-xs text-muted-foreground text-center mt-1">
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
                      </div>
                    </td>
                    <td className="py-2 px-1 sm:px-2">
                      <div>
                        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
                          <DialogTrigger asChild>
                            <Button 
                            variant="outline"
                            onClick={() => setSelectedEntry(entry)}
                            className="group px-1 py-1 text-xs sm:text-sm font-medium border-2 hover:bg-red-400 hover:text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                            >
                              <span className="hidden sm:inline">Detail</span>
                              <span className="sm:hidden">•••</span>
                            </Button>
                          </DialogTrigger>
                          
                          <DialogContent
                            onOpenAutoFocus={(e) => e.preventDefault()}
                            onCloseAutoFocus={(e) => e.preventDefault()}
                            className="sm:max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto bg-card/95 border-border/50 mx-2"
                          >
                            {selectedEntry && (
                              <>
                                <DialogHeader>
                                  <DialogTitle className="text-lg sm:text-xl">Details of Your Request</DialogTitle>
                                  <DialogDescription className="text-sm">Is it anything wrong?</DialogDescription>
                                </DialogHeader>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">Name:</span>
                                    <p>{selectedEntry.name}</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">License Plate:</span>
                                    <p>{selectedEntry.licensePlate}</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Department:</span>
                                    <p>{selectedEntry.department}</p>
                                  </div>
                                  <div> 
                                    <span className="text-muted-foreground">Exit Time:</span>
                                    <p>{selectedEntry.exitTime || "Not set"}</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Return Time:</span>
                                    <p>{!selectedEntry.returnTime || selectedEntry.reason === "Sick" ? "N/A (Sick Leave)" : selectedEntry.returnTime}</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Status:</span>
                                    <p>{selectedEntry.approval === "approved" && (
                                      <div className="bg-green-300 rounded-br-2xl w-fit p-1 px-2 text-gray-600 font-semibold">
                                        approved
                                      </div>
                                    )}</p>
                                    <p>{selectedEntry.approval === "rejected" && (
                                      <div className="bg-red-300 rounded-br-2xl w-fit p-1 px-2 text-gray-600 font-semibold">
                                        rejected
                                      </div>
                                    )}</p>
                                    <p>{selectedEntry.approval === "pending" && (
                                      <div className="bg-yellow-300 rounded-br-2xl w-fit p-1 px-2 text-gray-600 font-semibold">
                                        pending
                                      </div>
                                    )}</p>
                                  </div>
                                  <div className="col-span-2 mt-2">
                                    <span className="text-muted-foreground">Reason:</span>
                                    <p>{selectedEntry.reason}</p>
                                  </div>
                                  <div className="col-span-2 mt-2">
                                    <span className="text-muted-foreground">Approval Status:</span>
                                    <div className="mt-1 space-y-1">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs">Department:</span>
                                        <span className={`px-2 py-1 rounded text-xs ${
                                          selectedEntry.statusFromDepartment === 'approved' ? 'bg-green-100 text-green-800' :
                                          selectedEntry.statusFromDepartment === 'rejected' ? 'bg-red-100 text-red-800' :
                                          'bg-yellow-100 text-yellow-800'
                                        }`}>
                                          {selectedEntry.statusFromDepartment}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs">HR:</span>
                                        <span className={`px-2 py-1 rounded text-xs ${
                                          selectedEntry.statusFromHR === 'approved' ? 'bg-green-100 text-green-800' :
                                          selectedEntry.statusFromHR === 'rejected' ? 'bg-red-100 text-red-800' :
                                          'bg-yellow-100 text-yellow-800'
                                        }`}>
                                          {selectedEntry.statusFromHR}
                                        </span>
                                      </div>
                                      {selectedEntry.role === "Head Department" && (
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs">Director:</span>
                                          <span className={`px-2 py-1 rounded text-xs ${
                                            selectedEntry.statusFromDirector === 'approved' ? 'bg-green-100 text-green-800' :
                                            selectedEntry.statusFromDirector === 'rejected' ? 'bg-red-100 text-red-800' :
                                            'bg-yellow-100 text-yellow-800'
                                          }`}>
                                            {selectedEntry.statusFromDirector}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}