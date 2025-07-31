

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
import { FilePlus, DoorOpen, Plus, Send, Sparkles, Zap, Calendar, Clock, User, CircleCheck, XCircle } from "lucide-react";

// Clock component placeholder
const Clock2 = () => (
  <div className="text-sm text-gray-500">
    {new Date().toLocaleTimeString()}
  </div>
);

export default function UserLeavePage(){
  const [isOpen, setIsOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<typeof entries[0] | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    licensePlate: "",
    department: "",
    date: "",
    exitTime: "",
    returnTime: "",
    reason: "",
    approval: "",
    statusFromDepartment: "pending",
    statusFromHR: "pending"
  });

  const [entries, setEntries] = useState<Array<{
    id: string;
    name: string;
    licensePlate: string;
    department: string;
    role:string;
    date: string;
    exitTime: string;
    returnTime: string;
    statusFromDepartment: string;
    statusFromHR: string;
    statusFromDirector: string;
    reason: string;
    approval: string;
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
      department: "IT",
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
    {
      id: "5",
      name: "Sarah Johnson",
      licensePlate: "SAR-1234",
      department: "IT",
      role: "Department Head",
      date: "2024-01-11",
      exitTime: "15:30",
      returnTime: "08:00",
      reason: "Strategic planning meeting with board of directors and quarterly review session.",
      approval: "pending",
      statusFromDepartment: "approved",
      statusFromHR: "pending",
      statusFromDirector: "pending",
      submittedAt: "2024-01-11, 07:30:00"
    },
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

  // Function to calculate overall approval status
  const calculateOverallApproval = (entry: typeof entries[0]) => {
    const requiredApprovals = ["statusFromDepartment", "statusFromHR"];
    
    // Add director approval for Department Heads
    if (entry.role === "Department Head") {
      requiredApprovals.push("statusFromDirector");
    }

    // Check if any required approval is rejected
    const hasRejection = requiredApprovals.some(approval => 
      entry[approval as keyof typeof entry] === "rejected"
    );

    if (hasRejection) {
      return "rejected";
    }

    // Check if all required approvals are approved
    const allApproved = requiredApprovals.every(approval => 
      entry[approval as keyof typeof entry] === "approved"
    );

    if (allApproved) {
      return "approved";
    }

    return "pending";
  };

  // Update overall approval status whenever entries change
  useEffect(() => {
    setEntries(prevEntries => 
      prevEntries.map(entry => ({
        ...entry,
        approval: calculateOverallApproval(entry)
      }))
    );
  }, []);

  // Function to simulate approval updates (for demonstration)
  const updateApprovalStatus = (entryId: string, approvalType: string, status: string) => {
    setEntries(prevEntries => 
      prevEntries.map(entry => {
        if (entry.id === entryId) {
          const updatedEntry = {
            ...entry,
            [approvalType]: status
          };
          // Recalculate overall approval
          updatedEntry.approval = calculateOverallApproval(updatedEntry);
          return updatedEntry;
        }
        return entry;
      })
    );
  };

  const handleSubmit = () => {
    const newEntry = {
      id: Date.now().toString(),
      ...formData,
      role: "Staff",
      approval: "pending",
      statusFromDepartment: "pending",
      statusFromHR: "pending",
      statusFromDirector: "pending",
      submittedAt: new Date().toLocaleString()
    };
    
    // Calculate initial approval status
    const entryWithApproval = {
      ...newEntry,
      approval: calculateOverallApproval(newEntry)
    };
    
    setEntries(prev => [entryWithApproval, ...prev]);
    setIsOpen(false);
    setFormData({
      name: "",
      licensePlate: "",
      department: "",
      date: "",
      exitTime: "",
      returnTime: "",
      reason: "",
      approval: "",
      statusFromDepartment: "",
      statusFromHR: "",
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return(
    <div className="h-screen overflow-hidden flex flex-col space-y-4 p-4">
      <div className="z-10 sticky top-0 pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Leave Permission Request</h1>
            <p className="mt-1 text-sm text-gray-500">
              Have an urgent business outside the company? Write a request letter.
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Clock2 />
          </div>
        </div>  
      </div>

      <div className="w-full max-w-6xl mx-auto bg-white shadow-2xl rounded-t-3xl overflow-hidden h-full flex flex-col">
        <div className="bg-blue-500 text-white flex items-center justify-between w-full py-4">
          <div className="w-1/3"/>
          <h2 className="text-center w-1/3 text-xl font-bold">Leave Requests History</h2>
          <div className="w-1/3 flex justify-end pr-3">
            <div>
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button 
                    size="lg" 
                    className="group relative px-6 text-lg font-semibold bg-white hover:bg-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    <DoorOpen className="text-black"/>
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
                  
                  <div className="space-y-4 py-4">
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
                          placeholder="Enter department"
                          value={formData.department}
                          onChange={(e) => handleInputChange("department", e.target.value)}
                          className="h-10 border-border/50 focus:border-primary"
                          required
                        />
                      </div>
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
                    </div>
                    <div className="grid grid-cols-2 gap-4">
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
                      <Label htmlFor="reason" className="text-sm font-medium">
                        Reason to leave
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
                        onClick={handleSubmit} 
                        className="flex-1 sm:flex-none group"
                      >
                        <Send className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform duration-200" />
                        Send Request
                      </Button>
                    </DialogFooter>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        <div className="flex-1 px-4 py-2">
          <div className="h-[35rem] overflow-x-auto scrollbar-hide">
            <table className="w-full text-sm text-center">
              <thead className="sticky top-0 bg-blue-50">
                <tr className="border-b">
                  <th className="py-2">Name</th>
                  <th>License Plate</th>
                  <th>Date</th>
                  <th>Exit Time</th>
                  <th>Return Time</th>
                  <th>Approval</th>
                  <th>Approval Progress</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, i) => (
                  <tr key={i} className="border-b hover:bg-gray-100">
                    <td className="py-2">{entry.name}</td>
                    <td>{entry.licensePlate}</td>
                    <td>{entry.date}</td>
                    <td>{entry.exitTime}</td>
                    <td>{entry.returnTime}</td>
                    <td>
                      {entry.approval === "approved" && (
                        <div className="flex items-center justify-center text-green-600">
                          <CircleCheck className="w-5 h-5"/>
                        </div>
                      )}  
                      {entry.approval === "rejected" && (
                        <div className="flex items-center justify-center text-red-600">
                          <XCircle className="w-5 h-5"/>
                        </div>
                      )}  
                      {entry.approval === "pending" && (
                        <div className="flex items-center justify-center text-yellow-600">
                          <Clock className="w-5 h-5"/>
                        </div>
                      )}  
                    </td>
                    <td className="text-xs flex flex-col space-y-1 ">
                      <div className="flex items-center justify-center space-x-1 ">
                        <div className={`w-3 h-3 rounded-full ${
                          entry.statusFromDepartment === 'approved' ? 'bg-green-500' :
                          entry.statusFromDepartment === 'rejected' ? 'bg-red-500' :
                          'bg-yellow-500'
                        }`} title={`Department: ${entry.statusFromDepartment}`} />
                        <div className="w-2 h-0.5 bg-gray-300 mx-1" />
                        <div className={`w-3 h-3 rounded-full ${
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
                    <td>
                      <div>
                        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
                          <DialogTrigger asChild>
                            <Button 
                            variant="outline"
                            onClick={() => setSelectedEntry(entry)}
                            className="group px-1 py-1 text-sm font-medium border-2 hover:bg-red-400 hover:text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                            >
                              Detail
                            </Button>
                          </DialogTrigger>
                          
                          <DialogContent
                            onOpenAutoFocus={(e) => e.preventDefault()}
                            onCloseAutoFocus={(e) => e.preventDefault()}
                            className="sm:max-w-4xl max-h-[90h] overflow-y-auto bg-card/95 border-border/50"
                          >
                            {selectedEntry && (
                              <>
                                <DialogHeader>
                                  <DialogTitle>Details of Your Request</DialogTitle>
                                  <DialogDescription>Is it anything wrong?</DialogDescription>
                                </DialogHeader>
                                <div className="grid grid-cols-2 gap-4 text-sm">
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
                                    <p>{selectedEntry.returnTime}</p>
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
                                      {selectedEntry.role === "Department Head" && (
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