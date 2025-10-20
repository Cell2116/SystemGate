import { useState } from "react";
import { useEffect } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Clock2 from "../components/dashboard/clock"
import { Plus, Send, Sparkles, Zap, Eye, Calendar, Clock, User, MoreHorizontal, FileText, X, Crown } from "lucide-react";
import { useDashboardStore } from "@/store/dashboardStore";
import { onConnectionChange, onDataChange } from "@/lib/ws";
interface User {
  name: string;
  department: string;
  role: string;
}
export default function DirectorLeavePage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const leavePermissions = useDashboardStore(state => state.leavePermissions);
  const fetchLeavePermission = useDashboardStore(state => state.fetchLeavePermission);
  const addLeavePermission = useDashboardStore(state => state.addLeavePermission);
  const loading = useDashboardStore(state => state.loading);
  const error = useDashboardStore(state => state.error);
  const updateLeavePermission = useDashboardStore(state => state.updateLeavePermission);
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
    return () => {
      mounted = false;
      if (unsubscribeDataChange) unsubscribeDataChange();
      if (unsubscribeLeaveChange) unsubscribeLeaveChange();
    };
  }, [fetchLeavePermission]);
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
          if (storedRole === "Director" || parsedUser.role === "Director") {
            setCurrentUser({
              name: parsedUser.name,
              department: parsedUser.department,
              role: "Director",
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
    approval: "",
    statusFromDirector: "",
    statusFromHR: "",
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
  const getPendingDirectorEntries = () => {
    if (!currentUser) return [];
    return leavePermissions.filter(entry => 
      entry.role === "Head Department" && 
      entry.statusFromDirector?.toLowerCase() === "pending" &&
      !(entry as any).isGroupMember // Exclude group members, only show group leaders and individual requests
    );
  };
  const getProcessedDirectorEntries = () => {
    if (!currentUser) return [];
    return leavePermissions.filter(entry => 
      entry.role === "Head Department" && 
      entry.statusFromDirector !== "pending"
    );
  };
  const getOverallStatus = (entry: any) => {
    if (entry.role === "Head Department") {
      if (entry.statusFromHR === "rejected" || entry.statusFromDirector === "rejected") return "rejected";
      if (entry.statusFromHR === "approved" && entry.statusFromDirector === "approved") return "approved";
      return "pending";
    } else {
      if (entry.statusFromDepartment === "rejected" || entry.statusFromHR === "rejected") return "rejected";
      if (entry.statusFromDepartment === "approved" && entry.statusFromHR === "approved") return "approved";
      return "pending";
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
  const handleViewDetails = (entry: any) => {
    setSelectedEntry(entry);
    setIsDetailsOpen(true);
  };
  const handleApprovalAction = async (entryId: string, action: 'approved' | 'rejected') => {
    const entry = leavePermissions.find(e => e.id === entryId);
    if (!entry) return;
    const updatedEntry = { ...entry, statusFromDirector: action };
    updatedEntry.approval = getOverallStatus(updatedEntry);
    await updateLeavePermission(entryId, {
      statusFromDirector: action,
      approval: updatedEntry.approval
    });
    
    // Refresh data after approval
    await fetchLeavePermission();
    
    setIsDetailsOpen(false);
  };
  return (
    <div className="max-h-screen from-primary/5 via-background to-accent/20 p-3">
      <div className="z-10 sticky top-0 pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between justify-center items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Leave Permission Request (Director Side)</h1>
            <p className="mt-1 text-sm text-gray-500">
              Hello, lets see who want to go out during the working hours.
            </p>
          </div>
          <div className="mt-4 justify-center items-center w-fit sm:mt-0">
            <Clock2 />
          </div>
        </div>  
      </div>
      {/* Main content */}
      <div className="relative z-10 flex items-center justify-center pt-3 px-4">
        <div className="max-w-6xl md:w-[80vw] xl:w-[80vw] 2xl:w-[80vw] mx-auto text-center space-y-4 ">
          {/* Hero section */}
          {/* // Button entry and Pending */}
            <div className=" flex flex-col sm:flex-row gap-4 items-center justify-center">
            {/* Pending Card */}
            <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="group relative px-2 py-2 text-sm font-semibold border-2 hover:bg-primary hover:text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <Eye className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                  View Pending ({getPendingDirectorEntries().length})
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-card/95 border-border/50">
                <DialogHeader className="space-y-3">
                  <DialogTitle className="text-2xl font-bold text-center">
                    Pending Entries
                  </DialogTitle>
                  <DialogDescription className="text-center text-muted-foreground">
                    View visitor registration entries awaiting approval
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  {getPendingDirectorEntries().length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">No pending entries</p>
                      <p className="text-sm">All entries have been processed</p>
                    </div>
                  ) : (
                    <div className="max-h-[60vh] overflow-x-auto overflow-y-auto">
                      <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>License Plate</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Exit</TableHead>
                          <TableHead>Return</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getPendingDirectorEntries().map((entry) => (
                          <TableRow key={entry.id}>
                            <TableCell className="font-medium">{entry.name}</TableCell>
                            <TableCell className="font-mono">{entry.licensePlate}</TableCell>
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
                                entry.approval === 'approved' ? 'bg-green-100 text-green-800' :
                                entry.approval === 'rejected' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {entry.approval.charAt(0).toUpperCase() + entry.approval.slice(1)}
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
              {/* lg:max-w-lg */}
                <DialogHeader className="space-y-1">
                  <DialogTitle className="text-2xl font-bold text-center">
                    Permission Detail
                  </DialogTitle>
                  <DialogDescription className="text-center text-muted-foreground">
                    Complete information for this Leave Permission Request
                  </DialogDescription>
                </DialogHeader>
                {selectedEntry && (
                  <div className="py-1 space-y-1 ">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-semibold">{selectedEntry.name}</h3>
                        <p className="text-sm text-muted-foreground flex items-center mt-1">
                          <Calendar className="w-4 h-4 mr-1" />
                          Submitted: {selectedEntry.submittedAt}  
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        selectedEntry.statusFromDirector === 'approved' ? 'bg-green-100 text-green-800' :
                        selectedEntry.statusFromDirector === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {selectedEntry.statusFromDirector.charAt(0).toUpperCase() + selectedEntry.statusFromDirector.slice(1)}
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
                          <label className="text-sm font-medium text-muted-foreground">Date</label>
                          <p className="text-lg mt-1">{selectedEntry.date}</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Return Time</label>
                          <p className="text-lg mt-1 flex items-center">
                            <Clock className="w-4 h-4 mr-2" />
                            {selectedEntry.returnTime}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Exit Time</label>
                          <p className="text-lg mt-1 flex items-center">
                            <Clock className="w-4 h-4 mr-2" />
                            {selectedEntry.exitTime || 'Not set'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-border/30">
                      <label className="text-sm font-medium text-muted-foreground mb-3 block">Approval Status</label>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Status from Director</label>
                          <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium mt-1 ${
                            selectedEntry.statusFromDirector === 'approved' ? 'bg-green-100 text-green-800' :
                            selectedEntry.statusFromDirector === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {selectedEntry.statusFromDirector.charAt(0).toUpperCase() + selectedEntry.statusFromDirector.slice(1)}
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Status from HR</label>
                          <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium mt-1 ${
                            selectedEntry.statusFromHR === 'approved' ? 'bg-green-100 text-green-800' :
                            selectedEntry.statusFromHR === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {selectedEntry.statusFromHR.charAt(0).toUpperCase() + selectedEntry.statusFromHR.slice(1)}
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
                    {selectedEntry.statusFromDirector === 'pending' && (
                      <div className="pt-4 border-t border-border/30">
                        <label className="text-sm font-medium text-muted-foreground mb-3 block">Director Actions</label>
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
          {getProcessedDirectorEntries().length > 0 && (
            <div className="max-w-6xl mx-auto overflow-x-auto">
              <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-5 shadow-lg">
                <div className="block w-screen max-w-full overflow-x-auto overflow-y-auto h-[60vh] scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
                  <Table className="min-w-max">
                  <TableHeader>
                    <TableRow className="sticky top-0 bg-white z-10">
                      <TableHead>Name</TableHead>
                      <TableHead>License Plate</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Exit</TableHead>
                      <TableHead>Return</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getProcessedDirectorEntries().map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="font-medium">{entry.name}</TableCell>
                          <TableCell className="font-mono">{entry.licensePlate}</TableCell>
                          <TableCell className="font-mono">
                            <div className="flex items-center">
                            <Crown className="w-5 h-5 mr-2 text-yellow-600"/>
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
                            <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                              entry.statusFromDirector === 'approved' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {entry.statusFromDirector.charAt(0).toUpperCase() + entry.statusFromDirector.slice(1)}
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
          {/* CTA Buttons */}
        </div>
      </div>
    </div>
  );
}