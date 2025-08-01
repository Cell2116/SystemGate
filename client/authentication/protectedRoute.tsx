// import { Navigate, useLocation } from "react-router-dom";

// export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
//   const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
//   const location = useLocation();

//   // Jika belum login dan bukan di halaman login, redirect ke login
//   if (!isLoggedIn && location.pathname !== "/login") {
//     return <Navigate to="/login" replace />;
//   }

//   return children;
// }


import { Navigate, useLocation } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
}
console.log("ProtectedRoute Mounted");

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const location = useLocation();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
