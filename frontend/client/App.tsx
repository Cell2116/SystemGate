import "./global.css";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
// import LoadingTrucks from "./pages/LoadingTrucks";
import LoadingTrucks from "./pages/LoadingTrucks.refactored";
import UnloadingTrucks from "./pages/UnloadingTrucks.refactored";
// import UnloadingTrucks from "./pages/UnloadingTrucks";
import Scan from "./pages/Scan";
import NotFound from "./pages/NotFound";
// import EmployeeHistory  from "./pages/EmployeeHistory";
import EmployeeHistory  from "./pages/EmployeeHistory.refactored";
import EmployeeDashboard from "./pages/EmployeeDashboard";
// import InOutTrucks from "./pages/InOutTrucks";
import InOutTrucks from "./pages/InOutTrucks.refactored";
// import InOutTrucksHistory from "./pages/InOutTrucksHistory";
import InOutTrucksHistory from "./pages/InOutTrucksHistory.refactored";
import LeavePermission from "./pages/LeavePermission";
import Login from "./pages/Login";
import ProtectedRoute from "./authentication/protectedRoute";
import { UserProvider } from "./authentication/userContext";
import { useEffect } from "react";
import { initWebSocket } from "@/lib/ws";
import { PWAUpdatePrompt } from "./components/PWAUpdatePrompt";
import { InstallPrompt } from "./components/InstallPrompt";
import { NetworkStatus } from "./components/NetworkStatus";
import GlobalScanner from "./components/GlobalScanner";
import ScannerIndicator from "./components/ScannerIndicator";
import TruckQueuePage from "./pages/TruckQueuePage";
import Contact from "./pages/Contact";
const queryClient = new QueryClient();
const App = () => {
  useEffect(() => {
    initWebSocket();
  }, []);
  // if (import.meta.env.MODE === 'development') {
  //   console.log = () => { };
  //   console.debug = () => { };
  //   console.info = () => { };
  // }
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <UserProvider>
          <GlobalScanner>
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
                <Route path="/loadingtrucks" element={<LoadingTrucks />} />
                <Route path="/unloadingtrucks" element={<UnloadingTrucks />} />
                <Route path="/scan" element={<Scan />} />
                <Route path="/truck-queue" element={<TruckQueuePage />} />
                <Route path="/contact" element={<Contact />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
            <PWAUpdatePrompt />
            <InstallPrompt />
            <NetworkStatus />
            <ScannerIndicator />
          </GlobalScanner>
        </UserProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};
createRoot(document.getElementById("root")!).render(<App />);
