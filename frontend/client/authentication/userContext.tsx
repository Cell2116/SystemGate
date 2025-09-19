import { createContext, useContext, useState, ReactNode, useEffect } from "react";

type Role = "Security" | "HR" | "Staff" | "Head Department" | "Director" | "Super User";

interface UserContextType {
  role: Role;
  setRole: (role: Role) => void;
}

const defaultRole: Role = "Staff"; 
const UserContext = createContext<UserContextType | undefined>(undefined);
//console.log("userContext Mounted");
export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRoleState] = useState<Role>(defaultRole);

  useEffect(() => {
    //console.log("User Provide mounted");
    const storedRole = localStorage.getItem("userRole");
    const normalized = storedRole;
    if (
      normalized === "Security" ||
      normalized === "HR" ||
      normalized === "Staff" ||
      normalized === "Head Department" ||
      normalized === "Director" ||
      normalized === "Super User"
    ) {
      setRoleState(normalized);
    }
  }, []);

  const setRole = (newRole: Role) => {
    setRoleState(newRole);
    localStorage.setItem("userRole", newRole);
  };

  return (
    <UserContext.Provider value={{ role, setRole }}>
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
