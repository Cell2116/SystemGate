import PlaceholderPage from "./PlaceholderPage"
import { useUser } from "@/authentication/userContext"
import UserLeavePage from "../pages/UserLeave"
import HRLeavePage from "../pages/HRLeave"
import DirectorLeavePage from "../pages/DirectorLeave"
import DepartmentLeavePage from "./DepartmentLeave"


export default function LeavePermission(){
  const { role } = useUser();
  if (!role) 
    return <p>Loading.....</p>
  switch (role) {
    case "HR":
      return <HRLeavePage/>
    case "User":
      return <UserLeavePage/>
    case "Director":
      return <DirectorLeavePage/>
    case "Head Department":
      return <DepartmentLeavePage/>
      default:
      // return <p>Unauthorized</p>;
      return <UserLeavePage/>
  }
}