import { useState } from "react";
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
} from "lucide-react";


import {roleAccess} from "../authentication/accessControl.ts";
import {useUser} from "../authentication/userContext.tsx";
import { useEffect } from "react";


const navigation = [
  { name: "Dashboard",
    href: "/",
    icon: LayoutDashboard, 
    children:[
      { name: "Employee", href: "/employee" }, 
      { name: "Trucks", href: "/trucks" }
    ]
  },
  { name: "History Management",
    href: "/history",
    icon: FileClock, 
    children:[
      { name: "Employee History", href: "/employeehistory" }, 
      { name: "Trucks History", href: "/truckshistory" }
    ]
  },
  { name: "Leave Permission", href: "/leave", icon: DoorOpen }
];

console.log("Layout.tsx file loaded");

export default function Layout() {
  const {role} = useUser();

  console.log("ROLE:", role); 
  const filteredNavigation = navigation.filter(item => roleAccess[item.name as keyof typeof roleAccess]?.includes(role));
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
          "fixed lg:relative inset-y-0 left-0 z-50 w-20 md:w-20 lg:w-[16vw] xl:w-[16vw] 2xl:w-[16vw] bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0",
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
                      <span className="truncate text-xs lg:text-sm xl:text-sm">{item.name}</span>
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
                      <span className="truncate text-xs lg:text-sm xl:text-sm">{item.name}</span>
                    </NavLink>
                  )}
                  
                  {/* Much more compact submenu */}
                  {hasChildren && isOpen && (
                    <div className="ml-3 md:ml-4 lg:ml-6 xl:ml-8 mt-0.5 md:mt-1 space-y-0.5">
                      {item.children.map((subItem) => (
                        <NavLink
                          key={subItem.name}
                          to={subItem.href}
                          className={({ isActive }) =>
                            cn(
                              "block px-1.5 md:px-2 lg:px-3 xl:px-4 py-1 md:py-1.5 lg:py-2 text-xs lg:text-sm xl:text-sm rounded-md transition-colors",
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
              <Avatar className="h-5 w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 xl:h-9 xl:w-9">
                <AvatarImage src="" alt="User" />
                <AvatarFallback className="text-xs lg:text-sm">C</AvatarFallback>
              </Avatar>
              <div className="ml-1.5 md:ml-2 lg:ml-3 flex-1 min-w-0">
                <p className="text-xs lg:text-sm xl:text-base font-medium text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">{user.role}</p>
              </div>
              <Button variant="ghost" size="sm" className="p-0.5 md:p-1" onClick={()=>{
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
          <div className="flex items-center justify-between h-5 md:h-10 lg:h-14 xl:h-15 px-2 md:px-3 lg:px-4 xl:px-6">
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
                  <Search className="absolute left-2 md:left-3 top-1/2 transform -translate-y-1/2 h-2 w-3 md:h-4 md:w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search employees, documents..."
                    className="w-full pl-6 md:pl-8 lg:pl-10 pr-2 md:pr-3 py-1 md:py-1.5 lg:py-2 border border-gray-300 rounded-md lg:rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-xs md:text-sm lg:text-sm"
                  />
                </div>
              </div>
            </div>
            
            {/* Much smaller action buttons */}
            <div className="flex items-center space-x-1 md:space-x-2">
              <Button variant="ghost" size="sm" className="relative p-1 md:p-1.5">
                <Bell className="h-3 w-3 md:h-4 md:w-4 lg:h-5 lg:w-5" />
                <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 md:h-2 md:w-2 bg-red-500 rounded-full"></span>
              </Button>
              <Button variant="ghost" size="sm" className="p-1 md:p-1.5">
                <User className="h-3 w-3 md:h-4 md:w-4 lg:h-5 lg:w-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Much smaller main content padding */}
        <main className="h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  );
}