import "./global.css";

import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import About from "./pages/About";
import Advantages from "./pages/Advantages";
import Products from "./pages/Products";
import Values from "./pages/Values";
import Articles from "./pages/Articles";
import Clients from "./pages/Clients";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import InOutTrucks from "./pages/InOutTrucks";
import LeavePermission from "./pages/LeavePermission";
import Login from "./pages/Login";
import ProtectedRoute from "./authentication/protectedRoute";
import { UserProvider } from "./authentication/userContext";
import { useEffect } from "react";
import { initWebSocket } from "@/lib/ws";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    console.log("🚀 Initiating global WebSocket connection...");
    initWebSocket();
    console.log("✅ WebSocket initialization completed");
    // Only initialize once, never close here!
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <UserProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="employee" element={<EmployeeDashboard />} />
              <Route path="trucks" element={<InOutTrucks />} />
              <Route path="leave" element={<LeavePermission />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </UserProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};
createRoot(document.getElementById("root")!).render(<App />);

