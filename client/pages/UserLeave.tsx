import PlaceholderPage from "./PlaceholderPage";
import { Card } from "@/components/ui/card";
import Clock2 from "../components/dashboard/clock"
import { Button } from "@/components/ui/button";
import { useState } from "react";
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
import { useSelectRange } from "react-day-picker";


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
    approval: ""
  });
  const [entries, setEntries] = useState<Array<{
    id: string;
    name: string;
    licensePlate: string;
    department: string;
    date: string;
    exitTime: string;
    returnTime: string;
    reason: string;
    approval: string;
    submittedAt: string;
  }>>([
    {
      id: "1",
      name: "John Smith",
      licensePlate: "ABC-1234",
      department: "Engineering",
      date: "2024-01-15",
      exitTime: "17:30",
      returnTime: "09:00",
      reason: "Meeting with development team to discuss new project requirements and technical specifications.",
      approval: "approved",
      submittedAt: "2024-01-15, 08:45:00"
    },
    {
      id: "2",
      name: "Sarah Johnson",
      licensePlate: "XYZ-5678",
      department: "Marketing",
      date: "2024-01-15",
      exitTime: "",
      returnTime: "10:30",
      reason: "Client presentation and product demo session.",
      approval: "pending",
      submittedAt: "2024-01-15, 10:15:00"
    },
        {
      id: "3",
      name: "Michael Chen",
      licensePlate: "DEF-9012",
      department: "Finance",
      date: "2024-01-14",
      exitTime: "16:00",
      returnTime: "08:30",
      reason: "Quarterly budget review and financial analysis meeting.",
      approval: "rejected",
      submittedAt: "2024-01-14, 08:20:00"
    },
    {
      id: "4",
      name: "Emily Davis",
      licensePlate: "GHI-3456",
      department: "HR",
      date: "2024-01-14",
      exitTime: "18:00",
      returnTime: "09:15",
      reason: "Interview sessions for new candidates and team building workshop.",
      approval: "approved",
      submittedAt: "2024-01-14, 09:00:00"
    },
    {
      id: "5",
      name: "David Wilson",
      licensePlate: "JKL-7890",
      department: "IT Support",
      date: "2024-01-13",
      exitTime: "17:00",
      returnTime: "08:00",
      reason: "Server maintenance and network infrastructure upgrade.",
      approval: "approved",
      submittedAt: "2024-01-13, 07:45:00"
    },
    {
      id: "6",
      name: "Lisa Rodriguez",
      licensePlate: "MNO-2468",
      department: "Legal",
      date: "2024-01-13",
      exitTime: "16:30",
      returnTime: "10:00",
      reason: "Contract review and compliance audit meeting.",
      approval: "rejected",
      submittedAt: "2024-01-13, 09:30:00"
    },
    {
      id: "7",
      name: "Robert Taylor",
      licensePlate: "PQR-1357",
      department: "Sales",
      date: "2024-01-12",
      exitTime: "19:00",
      returnTime: "09:30",
      reason: "Client onboarding and product demonstration sessions.",
      approval: "approved",
      submittedAt: "2024-01-12, 09:00:00"
    },
    {
      id: "8",
      name: "Amanda Foster",
      licensePlate: "STU-9753",
      department: "Operations",
      date: "2024-01-12",
      exitTime: "",
      returnTime: "11:00",
      reason: "Process optimization and workflow analysis.",
      approval: "pending",
      submittedAt: "2024-01-12, 10:45:00"
    },
    {
      id: "9",
      name: "Kevin Brown",
      licensePlate: "VWX-4682",
      department: "Research",
      date: "2024-01-11",
      exitTime: "15:45",
      returnTime: "08:15",
      reason: "Laboratory equipment calibration and research data analysis.",
      approval: "approved",
      submittedAt: "2024-01-11, 08:00:00"
    },
    {
      id: "10",
      name: "Jennifer Lee",
      licensePlate: "YZA-8024",
      department: "Quality Assurance",
      date: "2024-01-11",
      exitTime: "16:15",
      returnTime: "09:45",
      reason: "Product testing and quality control inspection.",
      approval: "rejected",
      submittedAt: "2024-01-11, 09:30:00"
    },
    {
      id: "10",
      name: "Jennifer Lee",
      licensePlate: "YZA-8024",
      department: "Quality Assurance",
      date: "2024-01-11",
      exitTime: "16:15",
      returnTime: "09:45",
      reason: "Product testing and quality control inspection.",
      approval: "rejected",
      submittedAt: "2024-01-11, 09:30:00"
    },
    {
      id: "10",
      name: "Jennifer Lee",
      licensePlate: "YZA-8024",
      department: "Quality Assurance",
      date: "2024-01-11",
      exitTime: "16:15",
      returnTime: "09:45",
      reason: "Product testing and quality control inspection.",
      approval: "rejected",
      submittedAt: "2024-01-11, 09:30:00"
    },
    {
      id: "10",
      name: "Jennifer Lee",
      licensePlate: "YZA-8024",
      department: "Quality Assurance",
      date: "2024-01-11",
      exitTime: "16:15",
      returnTime: "09:45",
      reason: "Product testing and quality control inspection.",
      approval: "rejected",
      submittedAt: "2024-01-11, 09:30:00"
    },
    {
      id: "10",
      name: "Jennifer Lee",
      licensePlate: "YZA-8024",
      department: "Quality Assurance",
      date: "2024-01-11",
      exitTime: "16:15",
      returnTime: "09:45",
      reason: "Product testing and quality control inspection.",
      approval: "rejected",
      submittedAt: "2024-01-11, 09:30:00"
    },
    {
      id: "10",
      name: "Jennifer Lee",
      licensePlate: "YZA-8024",
      department: "Quality Assurance",
      date: "2024-01-11",
      exitTime: "16:15",
      returnTime: "09:45",
      reason: "Product testing and quality control inspection.",
      approval: "rejected",
      submittedAt: "2024-01-11, 09:30:00"
    },
    {
      id: "10",
      name: "Lee",
      licensePlate: "YZA-8024",
      department: "Quality Assurance",
      date: "2024-01-11",
      exitTime: "16:15",
      returnTime: "09:45",
      reason: "Product testing and quality control inspection.",
      approval: "rejected",
      submittedAt: "2024-01-11, 09:30:00"
    },
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newEntry = {
      id: Date.now().toString(),
      ...formData,
      approval: "pending",
      submittedAt: new Date().toLocaleString(),
    };
    setEntries(prev => [newEntry, ...prev]);
    setIsOpen(false);
    setFormData({
      name: "",
      licensePlate: "",
      department: "",
      date: "",
      exitTime: "",
      returnTime: "",
      reason: "",
      approval: ""
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return(
    <div className="h-screen overflow-hidden flex flex-col space-y-4">
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

      <div className="w-full max-w-5xl mx-auto bg-white shadow-2xl rounded-t-3xl overflow-hidden h-full flex flex-col">

      <div className="bg-blue-500 text-white flex items-center justify-between w-full py-4">
        <div className="w-1/3"/>
        <h2 className="text-center w-1/3 text-xl font-bold">Leave Requests History</h2>
        <div className="w-1/3 flex justify-end pr-3">
        {/* <Button variant="secondary" size="sm">
          <DoorOpen className="w-5 h-5"/>
        </Button> */}

        {/* Sumbit */}
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
                    type="submit" 
                    className="flex-1 sm:flex-none group"
                  >
                    <Send className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform duration-200" />
                    Send Request
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      </div>
        {/* Row Table & Details Card */}
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
                  <td>
                    <div>
                      <Dialog open={detailsOpen} onOpenChange = {setDetailsOpen}>
                        <DialogTrigger asChild>
                          <Button 
                          variant="outline"
                          onClick={()=> setSelectedEntry(entry)}
                          className="group px-1 py-1 text-sm font-medium border-2 hover:bg-red-400 hover:text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                          >
                            Detail
                          </Button>
                        </DialogTrigger>
                        {/* <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-card/95 border-border/50">
                          <DialogHeader className="space-y-3">
                            <DialogTitle className="text-2xl font-bold text-center">
                              Submitted Entries
                            </DialogTitle>
                            <DialogDescription className="text-center text-muted-foreground">
                              View all visitor registration entries
                            </DialogDescription>
                          </DialogHeader>

                          <div className="py-4">
                            {entries.length === 0 ? (
                              <div className="text-center py-12 text-muted-foreground">
                                <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p className="text-lg">No entries submitted yet</p>
                                <p className="text-sm">Add your first entry using the form above</p>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                {entries.map((entry) => (
                                  <div key={entry.id} className="border border-border/50 rounded-xl p-6 bg-background/50 hover:bg-background/80 transition-colors">
                                    <div className="flex justify-between items-start mb-4">
                                      <div className="space-y-1">
                                        <h3 className="font-semibold text-lg">{entry.name}</h3>
                                        <p className="text-sm text-muted-foreground flex items-center">
                                          <Calendar className="w-4 h-4 mr-1" />
                                          Submitted: {entry.submittedAt}
                                        </p>
                                      </div>
                                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                                        entry.approval === 'approved' ? 'bg-green-100 text-green-800' :
                                        entry.approval === 'rejected' ? 'bg-red-100 text-red-800' :
                                        'bg-yellow-100 text-yellow-800'
                                      }`}>
                                        {entry.approval.charAt(0).toUpperCase() + entry.approval.slice(1)}
                                      </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                      <div>
                                        <span className="font-medium text-muted-foreground">License Plate:</span>
                                        <p className="font-mono">{entry.licensePlate}</p>
                                      </div>
                                      <div>
                                        <span className="font-medium text-muted-foreground">Department:</span>
                                        <p>{entry.department}</p>
                                      </div>
                                      <div>
                                        <span className="font-medium text-muted-foreground">Date:</span>
                                        <p>{entry.date}</p>
                                      </div>
                                      <div>
                                        <span className="font-medium text-muted-foreground">Return:</span>
                                        <p className="flex items-center">
                                          <Clock className="w-3 h-3 mr-1" />
                                          {entry.returnTime}
                                        </p>
                                      </div>
                                      <div>
                                        <span className="font-medium text-muted-foreground">Exit:</span>
                                        <p className="flex items-center">
                                          <Clock className="w-3 h-3 mr-1" />
                                          {entry.exitTime || 'Not set'}
                                        </p>
                                      </div>
                                    </div>
                                    
                                    {entry.reason && (
                                      <div className="mt-4 pt-4 border-t border-border/30">
                                        <span className="font-medium text-muted-foreground text-sm">Reason for Visit:</span>
                                        <p className="mt-1 text-sm">{entry.reason}</p>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </DialogContent>   */}
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