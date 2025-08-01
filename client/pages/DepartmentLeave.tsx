
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
import { Plus, Send, Sparkles, Zap, Eye, Calendar, Clock, User, MoreHorizontal, FileText, X, Shield, Crown, Building, BookUser } from "lucide-react";

// Mock Clock component
const Clock2 = () => (
  <div className="text-sm text-gray-500">
    {new Date().toLocaleTimeString()}
  </div>
);
import { useEffect } from "react";

interface User {
  name: string;
  department: string;
  role: string;
}

export default function DepartmentHead() {
  // Current user is IT Department Head
  // const currentUser = {
  //   name: "Sarah Johnson",
  //   department: "Engineering",
  //   role: "Department Head"
  // };
  // // const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [entries, setEntries] = useState<Array<{
    id: string;
    name: string;
    licensePlate: string;
    department: string;
    role: string;
    date: string;
    exitTime: string;
    returnTime: string;
    reason: string;
    approval: string;
    statusFromDepartment: string; // Department approval
    statusFromHR: string; // HR approval
    statusFromDirector: string; // Director approval
    submittedAt: string;
  }>>([
    {
      id: "1",
      name: "David Wilson",
      licensePlate: "JKL-7890",
      department: "IT",
      role: "Staff",
      date: "2024-01-15",
      exitTime: "17:00",
      returnTime: "08:00",
      reason: "Server maintenance and network infrastructure upgrade for the new office building.",
      approval: "pending",
      statusFromDepartment: "pending",
      statusFromHR: "pending",
      statusFromDirector: "pending",
      submittedAt: "2024-01-15, 07:45:00"
    },
    {
      id: "2",
      name: "Alice Cooper",
      licensePlate: "ABC-5678",
      department: "Engineering",
      role: "Staff",
      date: "2024-01-14",
      exitTime: "16:30",
      returnTime: "09:00",
      reason: "Client site visit for system installation and user training session.",
      approval: "approved",
      statusFromDepartment: "approved",
      statusFromHR: "approved",
      statusFromDirector: "approved",
      submittedAt: "2024-01-14, 08:30:00"
    },
    {
      id: "3",
      name: "Mike Johnson",
      licensePlate: "XYZ-9012",
      department: "IT",
      role: "Staff",
      date: "2024-01-13",
      exitTime: "18:00",
      returnTime: "08:30",
      reason: "Emergency database recovery at client location downtown.",
      approval: "rejected",
      statusFromDepartment: "rejected",
      statusFromHR: "pending",
      statusFromDirector: "pending",
      submittedAt: "2024-01-13, 09:15:00"
    },
    {
      id: "4",
      name: "Emma Davis",
      licensePlate: "DEF-3456",
      department: "IT",
      role: "Staff",
      date: "2024-01-12",
      exitTime: "17:30",
      returnTime: "09:15",
      reason: "Hardware procurement meeting with vendors and technical evaluation.",
      approval: "pending",
      statusFromDepartment: "approved",
      statusFromHR: "pending",
      statusFromDirector: "pending",
      submittedAt: "2024-01-12, 08:45:00"
    },
    // Add Department Head's own request - auto-approved at department level
    {
      id: "5",
      name: "Sarah Johnson", // Current user (Department Head)
      licensePlate: "SAR-1234",
      department: "IT",
      role: "Department Head",
      date: "2024-01-11",
      exitTime: "15:30",
      returnTime: "08:00",
      reason: "Strategic planning meeting with board of directors and quarterly review session.",
      approval: "pending",
      statusFromDepartment: "approved", // Auto-approved (self)
      statusFromHR: "pending",
      statusFromDirector: "pending",
      submittedAt: "2024-01-11, 07:30:00"
    },
    // Add some entries from other departments to show they're filtered out
    {
      id: "6",
      name: "John Smith",
      licensePlate: "GHI-7890",
      department: "Engineering",
      role: "Staff",
      date: "2024-01-11",
      exitTime: "16:00",
      returnTime: "08:00",
      reason: "Project meeting with external partners.",
      approval: "pending",
      statusFromDepartment: "pending",
      statusFromHR: "pending",
      statusFromDirector: "pending",
      submittedAt: "2024-01-11, 07:30:00"
    }
  ]);

  // if (!currentUser) {
  //   return <p>Loading user data...</p>;
  // } 
  
  // const [formData, setFormData] = useState({
  //   name: currentUser.name, // Pre-fill with current user's name
  //   licensePlate: "",
  //   department: currentUser.department, // Pre-filled and locked to current department
  //   role: currentUser.role, // Set to Department Head
  //   date: "",
  //   exitTime: "",
  //   returnTime: "",
  //   reason: "",
  // });

  // // Filter entries to only show current department
  // const getDepartmentEntries = () => {
  //   return entries.filter(entry => entry.department === currentUser.department);
  // };

  // // Get entries that need department approval
  // const getPendingDepartmentEntries = () => {
  //   return getDepartmentEntries().filter(e => e.statusFromDepartment === 'pending');
  // };

  // // Get entries that have been processed by department
  // const getProcessedDepartmentEntries = () => {
  //   return getDepartmentEntries().filter(e => e.statusFromDepartment !== 'pending');
  // };

  // // Helper function to get overall approval status for Department Head
  // const getOverallStatus = (entry: any) => {
  //   if (entry.role === "Department Head") {
  //     // For Department Head: needs HR and Director approval
  //     if (entry.statusFromHR === "rejected" || entry.statusFromDirector === "rejected") return "rejected";
  //     if (entry.statusFromHR === "approved" && entry.statusFromDirector === "approved") return "approved";
  //     return "pending";
  //   } else {
  //     // For Staff: needs Department and HR approval
  //     if (entry.statusFromDepartment === "rejected" || entry.statusFromHR === "rejected") return "rejected";
  //     if (entry.statusFromDepartment === "approved" && entry.statusFromHR === "approved") return "approved";
  //     return "pending";
  //   }
  // };
  

  // const handleSubmit = (e: React.FormEvent) => {
  //   e.preventDefault();
  //   const newEntry = {
  //     id: Date.now().toString(),
  //     ...formData,
  //     approval: "pending",
  //     statusFromDepartment: formData.role === "Department Head" ? "approved" : "pending", // Auto-approve for Department Head
  //     statusFromHR: "pending",
  //     statusFromDirector: "pending",
  //     submittedAt: new Date().toLocaleString(),
  //   };
  //   setEntries(prev => [newEntry, ...prev]);
  //   setIsOpen(false);
  //   setFormData({
  //     name: currentUser.name,
  //     licensePlate: "",
  //     department: currentUser.department,
  //     role: currentUser.role,
  //     date: "",
  //     exitTime: "",
  //     returnTime: "",
  //     reason: "",
  //   });
  // };

  // const handleInputChange = (field: string, value: string) => {
  //   setFormData(prev => ({ ...prev, [field]: value }));
  // };

  // const handleViewDetails = (entry: any) => {
  //   setSelectedEntry(entry);
  //   setIsDetailsOpen(true);
  // };

  // const handleDepartmentApprovalAction = (entryId: string, action: 'approved' | 'rejected') => {
  //   setEntries(prev => prev.map(entry => {
  //     if (entry.id === entryId) {
  //       const updatedEntry = { ...entry, statusFromDepartment: action };
  //       updatedEntry.approval = getOverallStatus(updatedEntry);
  //       return updatedEntry;
  //     }
  //     return entry;
  //   }));
  //   setIsDetailsOpen(false);
  // };
useEffect(() => {
    const loadUserFromStorage = () => {
      try {
        // In a real environment, this would work:
        // const storedUser = localStorage.getItem("user");
        // const storedRole = localStorage.getItem("userRole");
        // const isLoggedIn = localStorage.getItem("isLoggedIn");
        
        // For demo purposes in Claude.ai, we'll simulate localStorage data
        // In your actual implementation, uncomment the lines above and remove the simulation below
        const simulatedStorageData = JSON.stringify({
          id: 1,
          name: "Sarah Johnson",
          email: "dh@dh.com",
          username: "sarahj",
          department: "Engineering",
          role: "Head Department"
        });
        const simulatedRole = "Head Department";
        const simulatedLogin = "true";
        
        const storedUser = localStorage.getItem("user"); // Replace with localStorage.getItem("user") in real app
        const storedRole = localStorage.getItem("userRole"); // Replace with localStorage.getItem("userRole") in real app
        const isLoggedIn = localStorage.getItem("isLoggedIn"); // Replace with localStorage.getItem("isLoggedIn") in real app
        
        // Check if user is logged in
        if (!isLoggedIn || isLoggedIn !== "true") {
          console.error("User not logged in");
          return;
        }
        
        if (storedUser && storedRole) {
          const parsedUser = JSON.parse(storedUser);
          
          // Validate that the user has Head Department role (matching your login system)
          if (storedRole === "Head Department" || parsedUser.role === "Head Department") {
            setCurrentUser({
              name: parsedUser.name,
              department: parsedUser.department,
              role: "Department Head" // Normalize to match UI expectations
            });
            
            // Add a sample entry for the logged-in department head
            const departmentHeadEntry = {
              id: "5",
              name: parsedUser.name,
              licensePlate: "SAR-1234",
              department: parsedUser.department,
              role: "Department Head",
              date: "2024-01-11",
              exitTime: "15:30",
              returnTime: "08:00",
              reason: "Strategic planning meeting with board of directors and quarterly review session.",
              approval: "pending",
              statusFromDepartment: "approved", // Auto-approved (self)
              statusFromHR: "pending",
              statusFromDirector: "pending",
              submittedAt: "2024-01-11, 07:30:00"
            };
            
            setEntries(prev => {
              // Check if entry already exists
              const exists = prev.some(entry => entry.id === "5");
              if (!exists) {
                return [...prev, departmentHeadEntry];
              }
              return prev;
            });
          } else {
            console.error("User is not a Department Head. Current role:", storedRole);
            // In a real app, you might redirect to login or show an error
          }
        } else {
          console.error("No user data found in localStorage");
          // In a real app, you might redirect to login
        }
      } catch (error) {
        console.error("Error loading user from localStorage:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserFromStorage();
  }, []);

  // Initialize form data when currentUser is loaded
  const [formData, setFormData] = useState({
    name: "",
    licensePlate: "",
    department: "",
    role: "",
    date: "",
    exitTime: "",
    returnTime: "",
    reason: "",
  });

  // Update form data when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setFormData(prev => ({
        ...prev,
        name: currentUser.name,
        department: currentUser.department,
        role: currentUser.role,
      }));
    }
  }, [currentUser]);

  // Show loading state while user data is being loaded
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

  // Show error state if no user data is found
  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <Shield className="w-16 h-16 mx-auto mb-2" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            No user data found or insufficient permissions.
          </p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Verify user has Department Head role
  if (currentUser.role !== "Department Head") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-yellow-500 mb-4">
            <Crown className="w-16 h-16 mx-auto mb-2" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Insufficient Permissions</h2>
          <p className="text-gray-600 mb-4">
            This page is only accessible to Department Heads.
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Current role: {currentUser.role}
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => window.history.back()}>
              Go Back
            </Button>
            <Button variant="outline" onClick={() => {
              // In real app: localStorage.clear(); navigate("/login");
              window.location.reload();
            }}>
              Logout
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Filter entries to only show current department
  const getDepartmentEntries = () => {
    return entries.filter(entry => entry.department === currentUser.department);
  };

  // Get entries that need department approval
  const getPendingDepartmentEntries = () => {
    return getDepartmentEntries().filter(e => e.statusFromDepartment === 'pending');
  };

  // Get entries that have been processed by department
  const getProcessedDepartmentEntries = () => {
    return getDepartmentEntries().filter(e => e.statusFromDepartment !== 'pending');
  };

  // Helper function to get overall approval status for Department Head
  const getOverallStatus = (entry: any) => {
    if (entry.role === "Department Head") {
      // For Department Head: needs HR and Director approval
      if (entry.statusFromHR === "rejected" || entry.statusFromDirector === "rejected") return "rejected";
      if (entry.statusFromHR === "approved" && entry.statusFromDirector === "approved") return "approved";
      return "pending";
    } else {
      // For Staff: needs Department and HR approval
      if (entry.statusFromDepartment === "rejected" || entry.statusFromHR === "rejected") return "rejected";
      if (entry.statusFromDepartment === "approved" && entry.statusFromHR === "approved") return "approved";
      return "pending";
    }
  };
  

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newEntry = {
      id: Date.now().toString(),
      ...formData,
      approval: "pending",
      statusFromDepartment: formData.role === "Department Head" ? "approved" : "pending", // Auto-approve for Department Head
      statusFromHR: "pending",
      statusFromDirector: "pending",
      submittedAt: new Date().toLocaleString(),
    };
    setEntries(prev => [newEntry, ...prev]);
    setIsOpen(false);
    setFormData({
      name: currentUser.name,
      licensePlate: "",
      department: currentUser.department,
      role: currentUser.role,
      date: "",
      exitTime: "",
      returnTime: "",
      reason: "",
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleViewDetails = (entry: any) => {
    setSelectedEntry(entry);
    setIsDetailsOpen(true);
  };

  const handleDepartmentApprovalAction = (entryId: string, action: 'approved' | 'rejected') => {
    setEntries(prev => prev.map(entry => {
      if (entry.id === entryId) {
        const updatedEntry = { ...entry, statusFromDepartment: action };
        updatedEntry.approval = getOverallStatus(updatedEntry);
        return updatedEntry;
      }
      return entry;
    }));
    setIsDetailsOpen(false);
  };

  return (
    <div className="max-h-screen from-primary/5 via-background to-accent/20">
      <div className="z-10 sticky top-0 pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Leave Permission Request (Department Head)</h1>
            <p className="mt-1 text-sm text-gray-500">
              Welcome {currentUser.name} - {currentUser.department} Department Head. Review leave requests for your department.
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Clock2 />
          </div>
        </div>  
      </div>

      {/* Main content */}
      <div className="relative z-10 flex items-center justify-center pt-3 px-4">
        <div className="max-w-6xl mx-auto text-center space-y-8">
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
                    Leave Request Registration - {currentUser.department}
                  </DialogTitle>
                  <DialogDescription className="text-center text-muted-foreground">
                    Please fill in all required information for the entry log.
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium">
                        Name
                      </Label>
                      <Input
                        id="name"
                        placeholder="Enter name"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        className="h-10 border-border/50 focus:border-primary"
                        required
                      />
                      <p className="text-xs text-blue-600">Creating request for yourself as Department Head</p>
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
                      <Label htmlFor="department" className="text-sm font-medium">
                        Department
                      </Label>
                      <Input
                        id="department"
                        value={formData.department}
                        disabled
                        className="h-10 border-border/50 bg-muted/50"
                      />
                      <p className="text-xs text-muted-foreground">Your department</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role" className="text-sm font-medium">
                        Role
                      </Label>
                      <Input
                        id="role"
                        value="Department Head"
                        disabled
                        className="h-10 border-border/50 bg-muted/50"
                      />
                      <p className="text-xs text-muted-foreground">Your role in the organization</p>
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
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reason" className="text-sm font-medium">
                      Reason for Visit
                    </Label>
                    <textarea
                      id="reason"
                      placeholder="Enter reason for visit..."
                      value={formData.reason}
                      onChange={(e) => handleInputChange("reason", e.target.value)}
                      className="flex min-h-[80px] w-full rounded-lg border border-border/50 bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 resize-none transition-all duration-200"
                      required
                    />
                  </div>
                  
                  {/* Approval Flow Information */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">Approval Flow:</h4>
                    <div className="text-xs text-blue-700">
                      <div className="flex items-center gap-2">
                        <Crown className="w-4 h-4" />
                        <span>Department Head (Auto-approved) → HR → Director</span>
                      </div>
                      <p className="mt-2 text-xs text-blue-600">
                        As Department Head, your request will be auto-approved at department level and sent to HR and Director for final approval.
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
                    Pending Department Approval - {currentUser.department}
                  </DialogTitle>
                  <DialogDescription className="text-center text-muted-foreground">
                    Leave requests awaiting your approval as Department Head
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
                                  <User className="w-4 h-4 mr-2 text-blue-600" />
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
              <DialogContent className="sm:max-w-2xl bg-card/95 border-border/50">
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
                          <label className="text-sm font-medium text-muted-foreground">Visit Date</label>
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
                            {selectedEntry.role === "Department Head" ? "Department (Auto) → HR → Director" : "Department Head → HR"}
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
                            <label className="text-sm font-medium">Department Head</label>
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
                        {selectedEntry.role === 'Department Head' && (
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
                        )}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border/30">
                      <label className="text-sm font-medium text-muted-foreground">Reason for Visit</label>
                      <p className="mt-2 text-sm leading-relaxed bg-muted/30 p-4 rounded-lg">
                        {selectedEntry.reason}
                      </p>
                    </div>

                    {selectedEntry.statusFromDepartment === 'pending' && (
                      <div className="pt-4 border-t border-border/30">
                        <label className="text-sm font-medium text-muted-foreground mb-3 block">Department Head Actions</label>
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
            <div className="max-w-6xl mx-auto">
              <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-5 shadow-lg">
                <h3 className="text-lg font-semibold mb-4">
                  {currentUser.department} Department Leave Requests
                </h3>
                <div className="overflow-auto h-[60vh] scrollbar-hide">
                  <Table className="min-w-full">
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
                              {entry.role === "Department Head" ? (
                                <Crown className="w-4 h-4 mr-2 text-yellow-600" />
                              ) : (
                                <User className="w-4 h-4 mr-2 text-blue-600" />
                              )}
                              {entry.name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={`text-sm px-2 py-1 rounded-full ${
                              entry.role === "Department Head" 
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
                              {entry.role === "Department Head" && (
                                <>
                                <div className="w-2 h-0.5 bg-gray-300 mx-1" />
                                  {/* Director approval status */}
                                  <div className={`w-3 h-3 rounded-full ${
                                    entry.statusFromDirector === 'approved' ? 'bg-green-500' :
                                    entry.statusFromDirector === 'rejected' ? 'bg-red-500' :
                                    'bg-yellow-500'
                                    }`} title={`Director: ${entry.statusFromDirector}`} />
                                </>
                              )}
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
                              {entry.role === "Department Head" && (
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
                              )}
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

          {/* Summary Cards */}
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
          </div>
        </div>
      </div>
    </div>
  );
}