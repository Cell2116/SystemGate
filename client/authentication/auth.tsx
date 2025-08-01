// import { createContext, useContext } from "react";

// export type UserRole = "User" | "HR" | "Director" | "Head Department";

// export interface User{
//   name: String;
//   role: UserRole;
// }

// interface AuthContextType{
//   user: User | null;
// }

// // export const AuthContext = createContext<AuthContextType>({ user: null });
// export const AuthContext = createContext<AuthContextType>(
//   { 
//     user:{
//       name: "Cello",
//       role: "User"
//     }  
//     }        
//   );  
// export const useAuth = () => useContext(AuthContext);