import Clock2 from "../components/dashboard/clock"
import { Outlet } from "react-router-dom";
import {
  Users,
  UserCheck,
  UserX,
  TrendingUp,
  TrendingDown,
  Clock,
  Calendar,
  DollarSign,
  Award,
  AlertCircle,
  ArrowUpRight,
} from "lucide-react";


export default function Dashboard() {
  return (
    <div className="relative h-[calc(80vh-1rem)]"> 
      {/* <div className="absolute right-1">
        <Clock2/>
      </div> */}
      <div className="flex flex-col justify-center items-center h-full text-center px-4">
        <h1 className="text-5xl font-bold text-gray-900">Hello, Welcome Back, 👋</h1>
        <p className="mt-2 text-gray-700 max-w-xl">
          This is <span className="text-yellow-800">PT. Alkindo Naratama </span>gateway dashboard. Use the side menu to manage employees or track vehicle movements.
        </p>
      </div>
    </div>
  );
}
