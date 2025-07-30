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
import Clock2 from "../components/dashboard/clock"
import { Plus, Send, Sparkles, Zap, Eye, Calendar, Clock, User, MoreHorizontal, FileText, X } from "lucide-react";

export default function HRLeavePage() {
  const [isOpen, setIsOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
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
    statusFromHR: string;
    statusFromDepartment: string;
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
      statusFromHR: "approved",
      statusFromDepartment: "approved",
      submittedAt: "2024-01-15, 08:45:00"
    },
    {
      id: "2",
      name: "Sarah Johnson",
      licensePlate: "XYZ-5678",
      department: "Marketing",
      date: "2024-01-15",
      exitTime: "09:30",
      returnTime: "10:30",
      reason: "Client presentation and product demo session.",
      approval: "pending",
      statusFromHR: "pending",
      statusFromDepartment: "approved",
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
      statusFromHR: "rejected",
      statusFromDepartment: "rejected",
      submittedAt: "2024-01-14, 08:20:00"
    },
    {
      id: "4",
      name: "Emily Davis",
      licensePlate: "GHI-3456",
      department: "Department",
      date: "2024-01-14",
      exitTime: "18:00",
      returnTime: "09:15",
      reason: "Interview sessions for new candidates and team building workshop.",
      approval: "approved",
      statusFromHR: "approved",
      statusFromDepartment: "approved",
      submittedAt: "2024-01-14, 09:00:00"
    },
    {
      id: "5",
      name: "David Wilson",
      licensePlate: "JKL-7890",
      department: "IT",
      date: "2024-01-13",
      exitTime: "17:00",
      returnTime: "08:00",
      reason: "Server maintenance and network infrastructure upgrade.",
      approval: "pending",
      statusFromHR: "approved",
      statusFromDepartment: "pending",
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
      statusFromHR: "rejected",
      statusFromDepartment: "approved",
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
      statusFromHR: "approved",
      statusFromDepartment: "approved",
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
      statusFromHR: "pending",
      statusFromDepartment: "pending",
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
      statusFromHR: "approved",
      statusFromDepartment: "rejected",
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
      statusFromHR: "rejected",
      statusFromDepartment: "approved",
      submittedAt: "2024-01-11, 09:30:00"
    },
    {
      id: "11",
      name: "Radis",
      licensePlate: "JKL-7890",
      department: "IT",
      date: "2024-01-13",
      exitTime: "17:00",
      returnTime: "08:00",
      reason: "Server maintenance and network infrastructure upgrade.",
      approval: "approved",
      statusFromHR: "pending",
      statusFromDepartment: "approved",
      submittedAt: "2024-01-13, 07:45:00"
    },
    {
      id: "12",
      name: "Wilson",
      licensePlate: "JKL-7890",
      department: "IT",
      date: "2024-01-13",
      exitTime: "17:00",
      returnTime: "08:00",
      reason: "Server maintenance and network infrastructure upgrade.",
      approval: "pending",
      statusFromHR: "approved",
      statusFromDepartment: "pending",
      submittedAt: "2024-01-13, 07:45:00"
    },
  ]);
  const [formData, setFormData] = useState({
    name: "",
    licensePlate: "",
    department: "",
    date: "",
    exitTime: "",
    returnTime: "",
    reason: "",
    approval: "",
    statusFromHR: "",
    statusFromDepartment: "",
  });

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
      approval: "",
      statusFromHR: "",
      statusFromDepartment: ""
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleViewDetails = (entry: any) => {
    setSelectedEntry(entry);
    setIsDetailsOpen(true);
  };

  const handleApprovalAction = (entryId: string, action: 'approved' | 'rejected') => {
    setEntries(prev => prev.map(entry =>
      entry.id === entryId
        ? { ...entry, approval: action, statusFromDepartment: action }
        : entry
    ));
    setIsDetailsOpen(false);
  };

  return (
    <div className="max-h-screen  from-primary/5 via-background to-accent/20">
      <div className="z-10 sticky top-0 pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Leave Permission Request (Department Side)</h1>
            <p className="mt-1 text-sm text-gray-500">
              Hello Head Department, See who need to go out during the work.
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Clock2 />
          </div>
        </div>  
      </div>
      {/* Main content */}
      <div className="relative z-10 flex items-center justify-center pt-3 px-4">
        <div className="max-w-6xl mx-auto text-center space-y-8 ">
          {/* Hero section */}
          {/* // Button entry and Pending */}

            <div className=" flex flex-col sm:flex-row gap-4 items-center justify-center">
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
              
              <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-card/95  border-border/50">
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
                  View Pending ({entries.filter(e => (e.approval === 'pending') && (e.department === 'IT')).length})
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
                  {entries.filter(e => e.approval === 'pending').length === 0 ? (
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
                        {entries.filter(e => ( e.approval === 'pending') && (e.department === 'IT')).map((entry) => (
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
              <DialogContent className="sm:max-w-xl lg:max-w-lg bg-card/95 border-border/50">
                <DialogHeader className="space-y-3">
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
                        selectedEntry.approval === 'approved' ? 'bg-green-100 text-green-800' :
                        selectedEntry.approval === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {selectedEntry.approval.charAt(0).toUpperCase() + selectedEntry.approval.slice(1)}
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
                          <label className="text-sm font-medium text-muted-foreground">Visit Date</label>
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
                          <label className="text-xs font-medium text-muted-foreground">Status from HR</label>
                          <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium mt-1 ${
                            selectedEntry.statusFromHR === 'approved' ? 'bg-green-100 text-green-800' :
                            selectedEntry.statusFromHR === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {selectedEntry.statusFromHR.charAt(0).toUpperCase() + selectedEntry.statusFromHR.slice(1)}
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Status from Department</label>
                          <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium mt-1 ${
                            selectedEntry.statusFromDepartment === 'approved' ? 'bg-green-100 text-green-800' :
                            selectedEntry.statusFromDepartment === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {selectedEntry.statusFromDepartment.charAt(0).toUpperCase() + selectedEntry.statusFromDepartment.slice(1)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border/30">
                      <label className="text-sm font-medium text-muted-foreground">Reason for Visit</label>
                      <p className="mt-2 text-sm leading-relaxed bg-muted/30 p-4 rounded-lg">
                        {selectedEntry.reason}
                      </p>
                    </div>

                    {selectedEntry.approval === 'pending' && (
                      <div className="pt-4 border-t border-border/30">
                        <label className="text-sm font-medium text-muted-foreground mb-3 block">Head Department Action</label>
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
          {entries.filter(e => (e.statusFromDepartment !== 'pending') && (e.department === 'IT')).length > 0 && (
            // Table Section List
            <div className="max-w-6xl mx-auto">
              <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-5 shadow-lg">
                <div className="overflow-auto h-[60vh] scrollbar-hide">
                  <Table className="min-w-full">
                  <TableHeader>
                    <TableRow className="sticky top-0 bg-white z-10">
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
                    {entries
                      .filter(e => (e.statusFromDepartment !== 'pending') && (e.department === 'IT'))
                      .map((entry) => (
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
                              'bg-red-100 text-red-800'
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
              </div>
            </div>
          )}

          {/* CTA Buttons */}

        </div>
      </div>
    </div>
  );
}
