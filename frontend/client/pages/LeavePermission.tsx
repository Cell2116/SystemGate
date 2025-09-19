import PlaceholderPage from "./PlaceholderPage"
import { useUser } from "@/authentication/userContext"
import UserLeavePage from "../pages/UserLeave"
import HRLeavePage from "../pages/HRLeave"
import DirectorLeavePage from "../pages/DirectorLeave"
import DepartmentLeavePage from "./DepartmentLeave"
import { useEffect } from "react"
import { initWebSocket } from "@/lib/ws"


export default function LeavePermission(){
  const { role } = useUser();
  useEffect(() => {
    initWebSocket
  }, []);
  if (!role) 
    return <p>Loading.....</p>
  switch (role) {
    case "HR":
      return <HRLeavePage/>
    case "Super User":
      return <HRLeavePage/>
    case "Staff":
      return <UserLeavePage/>
    case "Director":
      return <DirectorLeavePage/>
    case "Head Department":
      return <DepartmentLeavePage/>
      default:
      // return <p>Unauthorized</p>;
      // return <UserLeavePage/>
  }
}