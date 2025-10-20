

import { useState, useEffect, useRef } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDashboardStore } from "@/store/dashboardStore";
import RoutingService from "../services/routingService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  FileClock,
  Menu,
  X,
  Bell,
  Search,
  LogOut,
  User,
  DoorOpen,
  PackageOpen
} from "lucide-react";

import Clock2 from "../components/dashboard/clock.tsx"
import { roleAccess, filterChildrenByRole, hasMenuAccess } from "../authentication/accessControl.ts";
import { useUser } from "../authentication/userContext.tsx";
import NotificationCard from "../components/dashboard/notification.tsx"
import { useAudio } from "@/hooks/useAudio";
import Information from "./dashboard/information.tsx";

function usePendingApprovalCount() {
  const leavePermissions = useDashboardStore(state => state.leavePermissions);
  const { role } = useUser();
  const [pendingCount, setPendingCount] = useState(0);
  
  // Use effect to fetch pending approvals dynamically
  useEffect(() => {
    const fetchPendingCount = async () => {
      if (!role) {
        setPendingCount(0);
        return;
      }

      const storedUser = localStorage.getItem("user");
      if (!storedUser) {
        setPendingCount(0);
        return;
      }
      const currentUser = JSON.parse(storedUser);

      try {
        if (role === "HR") {
          const pendingRequests = await RoutingService.getPendingRequestsForApprover(currentUser.name);          
          if (Array.isArray(pendingRequests)) {
            const filteredPending = pendingRequests.filter((e: any) => {
              const isGroupMember = e.reason && e.reason.includes('(Group with ') && e.approval === 'approved';
              return !isGroupMember;
            });
            setPendingCount(filteredPending.length);
          } else {
            console.warn('⚠️ getPendingRequestsForApprover did not return an array:', pendingRequests);
            setPendingCount(0);
          }
        } else if (role === "Head Department") {
          const pendingRequests = await RoutingService.getPendingRequestsForApprover(currentUser.name);
          if (Array.isArray(pendingRequests)) {
            const filteredPending = pendingRequests.filter((e: any) => {
              const isGroupMember = e.reason && e.reason.includes('(Group with ') && e.approval === 'approved';
              return !isGroupMember;
            });
            setPendingCount(filteredPending.length);
          } else {
            console.warn('⚠️ getPendingRequestsForApprover did not return an array for Head Department:', pendingRequests);
            setPendingCount(0);
          }
        } else if (role === "Director") {
          const pending = leavePermissions.filter((e: any) => {
            const isGroupMember = e.reason && e.reason.includes('(Group with ') && e.approval === 'approved';
            return e.statusFromDirector === "pending" && !isGroupMember;
          });
          setPendingCount(pending.length);
        } else {
          setPendingCount(0);
        }
      } catch (error) {
        console.error('Error fetching pending approval count:', error);
        setPendingCount(0);
      }
    };

    fetchPendingCount();
  }, [role, leavePermissions]);

  return pendingCount;
}

function useNotificationSound() {
  const count = usePendingApprovalCount();
  const { playDing } = useAudio();
  const prevCountRef = useRef(0);
  const isInitialLoadRef = useRef(true);
  useEffect(() => {
    if (isInitialLoadRef.current) {
      prevCountRef.current = count;
      isInitialLoadRef.current = false;
      return;
    }
    if (count > prevCountRef.current && count > 0) {
      playDing();
    }
    prevCountRef.current = count;
  }, [count, playDing]);
  return count;
}

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    children: [
      { key: "employee", name: "Employee", href: "/employee" },
      { key: "trucks", name: "Trucks", href: "/trucks" }
    ]
  },
  {
    name: "Operation",
    href: "/operation",
    icon: PackageOpen,
    children: [
      {
        key: "loading",
        name: (
          <span>
            Loading / <span className="text-green-600 font-semibold italic">Muat</span>
          </span>
        ),
        href: "/loadingtrucks"
      },
      {
        key: "unloading",
        name: (
          <span>
            Unloading / <span className="text-orange-600 font-semibold italic">Bongkar</span>
          </span>
        ),
        href: "/unloadingtrucks"
      },
      {
        key: "queue",
        name: (
          <span>
            Truck Queue / <span className="text-cyan-600 font-semibold italic">Antrian Truk</span>
          </span>
        ),
        href: "/truck-queue"
      },
      { key: "scan", name: "Scan", href: "/scan" },
    ]
  },
  {
    name: "History Operation",
    href: "/history",
    icon: FileClock,
    children: [
      { key: "employee-history", name: "Employee History", href: "/employeehistory" },
      { key: "trucks-history", name: "Trucks History", href: "/truckshistory" }
    ]
  },
  { name: "Leave Permission", href: "/leave", icon: DoorOpen }
];



export default function Layout() {
  const { role, name, department } = useUser();
  
  const filteredNavigation = navigation
    .filter(item => hasMenuAccess(item.name, role, name, department))
    .map(item => {
      
      if (item.children) {
        return {
          ...item,
          children: filterChildrenByRole(item.name, item.children, role, name, department)
        };
      }
      return item;
    })
    .filter(item => {
      
      if (item.children) {
        return item.children.length > 0;
      }
      return true;
    });
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState(() => {
    return localStorage.getItem("openMenu") || null;
  });
  const [user, setUser] = useState<{ name: string; role: string }>({ name: "", role: "" });
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUser({
        name: parsed.name || "",
        role: parsed.role || ""
      });
    }
  }, []);
  return (
    <div className="min-h-full bg-gray-50 flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div
        className={cn(
          "fixed lg:relative inset-y-0 left-0 z-50 w-25 md:w-20 lg:w-[16vw] xl:w-[16vw] 2xl:w-[15vw] bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-screen overflow-y-auto pt-1">
          <div className="flex items-center justify-between h-10 md:h-12 lg:h-14 xl:h-13 px-2 md:px-3 lg:px-4 xl:px-6 border-b border-gray-200">
            <div className="flex items-center">
              <img
                src="../../public/alkindo-naratama-tbk--600-removebg-preview.png"
                alt="logo"
                className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 xl:w-9 xl:h-9"
              />
              <span className="ml-1.5 md:ml-2 text-xs md:text-sm lg:text-lg xl:text-sm 2xl:text-lg font-bold text-gray-900">
                Gateway System
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden p-1"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
          </div>
          {/* Much more compact navigation */}
          <nav className="flex-1 overflow-y-auto px-1.5 md:px-2 lg:px-3 xl:px-4 py-2 md:py-3 lg:py-4 space-y-0.5 md:space-y-1">
            {filteredNavigation.map((item) => {
              const hasChildren = item.children && item.children.length > 0;
              const isOpen = openMenu === item.name;
              return (
                <div key={item.name}>
                  {hasChildren ? (
                    <div
                      className={cn(
                        "flex items-center px-1.5 md:px-2 lg:px-3 xl:px-4 py-1.5 md:py-2 lg:py-2.5 text-xs lg:text-sm xl:text-base font-medium rounded-md cursor-pointer transition-colors",
                        isOpen
                          ? "bg-blue-100 text-blue-900 border-r-2 border-blue-700"
                          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      )}
                      onClick={() => {
                        const newValue = isOpen ? null : item.name;
                        setOpenMenu(newValue);
                        localStorage.setItem("openMenu", newValue || "");
                      }}
                    >
                      <item.icon className="mr-1.5 md:mr-2 lg:mr-3 h-3 w-3 md:h-4 md:w-4 lg:h-5 lg:w-5 xl:h-6 xl:w-6 flex-shrink-0" />
                      <span className="truncate text-xs lg:text-sm xl:text-xs">{item.name}</span>
                    </div>
                  ) : (
                    <NavLink
                      to={item.href}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center px-1.5 md:px-2 lg:px-3 xl:px-4 py-1.5 md:py-2 lg:py-2.5 text-xs lg:text-sm xl:text-base font-medium rounded-md transition-colors",
                          isActive
                            ? "bg-blue-100 text-blue-900 border-r-2 border-blue-700"
                            : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                        )
                      }
                      onClick={() => {
                        setOpenMenu(null);
                        localStorage.removeItem("openMenu");
                        setSidebarOpen(false);
                      }}
                    >
                      <item.icon className="mr-1.5 md:mr-2 lg:mr-3 h-3 w-3 md:h-4 md:w-4 lg:h-5 lg:w-5 xl:h-6 xl:w-6 flex-shrink-0" />
                      <span className="truncate text-xs lg:text-sm xl:text-xs">{item.name}</span>
                    </NavLink>
                  )}
                  {/* Much more compact submenu */}
                  {hasChildren && isOpen && (
                    <div className="ml-3 md:ml-4 lg:ml-6 xl:ml-8 mt-0.5 md:mt-1 space-y-0.5">
                      {item.children.map((subItem) => (
                        <NavLink
                          key={subItem.key || subItem.href}
                          to={subItem.href}
                          className={({ isActive }) =>
                            cn(
                              "block px-1.5 md:px-2 lg:px-3 xl:px-4 py-1 md:py-1.5 lg:py-2 text-xs lg:text-sm xl:text-xs rounded-md transition-colors",
                              isActive
                                ? "bg-blue-100 text-blue-800"
                                : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                            )
                          }
                          onClick={() => setSidebarOpen(false)}
                        >
                          <span className="truncate">{subItem.name}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
          {/* Much smaller user profile section */}
          <div className="border-t border-gray-200 p-1.5 md:p-2 lg:p-3 xl:p-3">
            <div className="flex items-center">
              <Avatar className="h-5 w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 xl:h-6 xl:w-6">
                <AvatarImage src="" alt="User" />
                <AvatarFallback className="text-xs lg:text-sm">{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="ml-1.5 md:ml-2 lg:ml-3 flex-1 min-w-0">
                <p className="text-xs lg:text-sm xl:text-xs font-medium text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">{user.name === 'KUSWARA' ? 'Director' : user.role }</p>
              </div>
              <Button variant="ghost" size="sm" className="p-0.5 md:p-1" onClick={() => {
                localStorage.removeItem("user");
                localStorage.removeItem("userRole");
                localStorage.removeItem("isLoggedIn");
                navigate("/login");
              }
              }>
                <LogOut className="h-3 w-3 md:h-4 md:w-4 lg:h-4 lg:w-4 text-gray-500" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      {/* Responsive Main Content */}
      <div className="flex-1 min-w-0 h-screen overflow-hidden">
        {/* Much smaller header for 1366px */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-14 md:h-10 lg:h-14 xl:h-15 px-2 md:px-3 lg:px-4 xl:px-6">
            <div className="flex items-center flex-1">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden mr-1 p-1"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-3 w-3 md:h-4 md:w-4" />
              </Button>
              {/* Much smaller search */}
              <div className="hidden sm:flex items-center ml-1 md:ml-2 lg:ml-4 flex-1 md:max-w-sm lg:max-w-md xl:max-w-lg">
                <div className="relative w-full">
                  {/* <Search className="absolute left-2 md:left-3 top-1/2 transform -translate-y-1/2 h-2 w-3 md:h-4 md:w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search employees, documents..."
                    className="w-full pl-6 md:pl-8 lg:pl-10 pr-2 md:pr-3 py-1 md:py-1.5 lg:py-2 border border-gray-300 rounded-md lg:rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-xs md:text-sm lg:text-sm"
                  /> */}
                </div>
              </div>
            </div>
            {/* Much smaller action buttons */}
            <div className="flex items-center space-x-1 md:space-x-2">
              <div className="w-fit">
                <Clock2 />
              </div>
              {/* Notification */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative p-1 md:p-1.5">
                    <Bell className="h-3 w-3 md:h-4 md:w-4 lg:h-5 lg:w-5" />
                    {(() => {
                      const count = useNotificationSound(); 
                      return count > 0 ? (
                        <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] min-w-[18px] h-[18px] flex items-center justify-center rounded-full border-2 border-white font-bold z-10">
                          {count}
                        </span>
                      ) : null;
                    })()}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 p-0 mt-2 shadow-lg rounded-xl">
                  <NotificationCard />
                </PopoverContent>
              </Popover>
              {/* User Profile */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-1 md:p-1.5">
                    <User className="h-3 w-3 md:h-4 md:w-4 lg:h-5 lg:w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-xs w-full p-0 rounded-xl">
                  <div className="flex flex-col items-center p-6">
                    <Avatar className="h-16 w-16 mb-3">
                      <AvatarImage src="" alt={user.name} />
                      <AvatarFallback className="text-2xl">{user.name?.[0] || "U"}</AvatarFallback>
                    </Avatar>
                    <DialogHeader className="w-full text-center">
                      <DialogTitle className="text-lg font-bold">{user.name || "Unknown User"}</DialogTitle>
                      <DialogDescription className="text-sm text-gray-500 mt-1">Role:
                        <span className="text-slate-700"> {user.name === 'KUSWARA' ? 'Director as Head of Deparment' : user.role || "-"}</span>
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="w-full mt-4 flex flex-col gap-2">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          localStorage.removeItem("user");
                          localStorage.removeItem("userRole");
                          localStorage.removeItem("isLoggedIn");
                          navigate("/login");
                        }}
                      >
                        <LogOut className="h-4 w-4 mr-2" /> Logout
                      </Button>
                    </DialogFooter>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </header>
        {/* Much smaller main content padding */}
        <main className="h-screen">
          <Outlet />
        </main>
      </div>
      {/* <Information /> */}
    </div>
  );
}