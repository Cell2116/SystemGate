import { createContext, useContext, useState, ReactNode, useEffect } from "react";

type Role = "Security" | "HR" | "Staff" | "Head Department" | "Director" | "Super User" | "Admin";

interface UserContextType {
  role: Role;
  setRole: (role: Role) => void;
  name: string;
  setName: (name: string) => void;
  department: string;
  setDepartment: (department: string) => void;
}

const defaultRole: Role = "Staff";
const defaultName = "";
const defaultDepartment = "";
const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRoleState] = useState<Role>(defaultRole);
  const [name, setNameState] = useState<string>(defaultName);
  const [department, setDepartmentState] = useState<string>(defaultDepartment);
  useEffect(() => {
    
    const storedRole = localStorage.getItem("userRole");
    const storedName = localStorage.getItem("userName");
    const storedDepartment = localStorage.getItem("userDepartment");
    const normalized = storedRole;
    if (
      normalized === "Security" ||
      normalized === "HR" ||
      normalized === "Staff" ||
      normalized === "Head Department" ||
      normalized === "Director" ||
      normalized === "Super User" ||
      normalized === "Admin"
    ) {
      setRoleState(normalized);
    }
    if (storedName) setNameState(storedName);
    if (storedDepartment) setDepartmentState(storedDepartment);
  }, []);
  const setRole = (newRole: Role) => {
    setRoleState(newRole);
    localStorage.setItem("userRole", newRole);
  };
  const setName = (newName: string) => {
    setNameState(newName);
    localStorage.setItem("userName", newName);
  };
  const setDepartment = (newDepartment: string) => {
    setDepartmentState(newDepartment);
    localStorage.setItem("userDepartment", newDepartment);
  };
  return (
    <UserContext.Provider value={{ role, setRole, name, setName, department, setDepartment }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("❌ useUser must be used within a UserProvider");
  }
  return context;
};
