import "./global.css";

import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";

import NotFound from "./pages/NotFound";
import EmployeeHistory  from "./pages/EmployeeHistory";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import InOutTrucks from "./pages/InOutTrucks";
import InOutTrucksHistory from "./pages/InOutTrucksHistory";
import LeavePermission from "./pages/LeavePermission";
import Login from "./pages/Login";
import ProtectedRoute from "./authentication/protectedRoute";
import { UserProvider } from "./authentication/userContext";
import { useEffect } from "react";
import { initWebSocket } from "@/lib/ws";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    //console.log("Initiating global WebSocket connection...");
    initWebSocket();
    //console.log("WebSocket initialization completed");
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
              <Route path="history" element={<EmployeeHistory />} />
              <Route path="/employeehistory" element={<EmployeeHistory />} />
              <Route path="/truckshistory" element={<InOutTrucksHistory />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </UserProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};
createRoot(document.getElementById("root")!).render(<App />);

