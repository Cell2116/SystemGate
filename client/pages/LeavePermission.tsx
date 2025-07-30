import PlaceholderPage from "./PlaceholderPage"
import { useAuth } from "../authentication/auth"
import UserLeavePage from "../pages/UserLeave"
import HRLeavePage from "../pages/HRLeave"
import DirectorLeavePage from "../pages/DirectorLeave"
import DepartmentLeavePage from "./DepartmentLeave"


export default function LeavePermission(){
  const { user } = useAuth();
  if (!user) 
    return <p>Loading.....</p>
  switch (user.role) {
    case "HR":
      return <HRLeavePage/>
    case "User":
      return <UserLeavePage/>
    case "Director":
      return <DirectorLeavePage/>
    case "Department":
      return <DepartmentLeavePage/>
      default:
      // return <p>Unauthorized</p>;
      return <UserLeavePage/>
  }
}