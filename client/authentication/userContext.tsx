// src/context/UserContext.tsx
import { createContext, useContext, useState, ReactNode, useEffect } from "react";

type Role = "Security" | "HR" | "User" | "Head Department" | "Director";

interface UserContextType {
  role: Role;
  setRole: (role: Role) => void;
}

const defaultRole: Role = "User"; // default

// const UserContext = createContext<UserContextType>({
//   role: defaultRole,
//   setRole: () => {},
// });
const UserContext = createContext<UserContextType | undefined>(undefined);


// export const useUser = () => useContext(UserContext);

console.log("userContext Mounted");
export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRoleState] = useState<Role>(defaultRole);

  useEffect(() => {
    console.log("User Provide mounted");
    const storedRole = localStorage.getItem("userRole");
    const normalized = storedRole === "Staff" ? "User" : storedRole;
    if (
      normalized === "Security" ||
      normalized === "HR" ||
      normalized === "User" ||
      normalized === "Head Department" ||
      normalized === "Director"
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
