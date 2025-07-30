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


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element = {<Dashboard />}/>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/employee" element={<EmployeeDashboard />} />
            <Route path="/trucks" element={<InOutTrucks />} />
            <Route path="/leave" element={<LeavePermission />} />
            <Route path="/asd" element={<Products />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
    </BrowserRouter>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
