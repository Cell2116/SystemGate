
export type Role = "Security" | "HR" | "Staff" | "Head Department" | "Director" | "Super User" | "Admin";
////console.log("accessControl mounted")

export const roleAccess: Record<string, Role[]> = {
  Dashboard: ["Security", "HR", "Super User", "Admin"], // Menu Dashboard
  "Operation": ["Security", "HR", "Super User", "Admin"], // Menu Operation
  "History Operation": ["Security", "HR", "Head Department", "Super User", "Admin"], // Menu History
  "Leave Permission": ["HR", "Staff", "Head Department", "Director", "Super User"], // Menu Leave

  // Children menu 
  "Dashboard.employee": ["HR", "Super User", "Security"], 
  "Dashboard.trucks": ["Security", "HR", "Super User","Admin"], 
  "Operation.loading": ["Security", "Super User", "HR", "Admin"], 
  "Operation.unloading": ["Security", "Super User", "HR", "Admin"], 
  "Operation.scan": ["Security", "HR", "Super User", "Admin"], 
  "History Operation.employee-history": ["HR", "Head Department", "Super User"], 
  "History Operation.trucks-history": ["HR", "Super User", "Admin"], 
};


export const hasMenuAccess = (
  menuKey: string,
  userRole: Role,
  userName?: string,
  userDepartment?: string
): boolean => {
  
  if (
    userRole === "Head Department" &&
    userName?.toUpperCase() === "KUSWARA" &&
    userDepartment === "Finance"
  ) {
    const allowedRoles = roleAccess[menuKey];
    return allowedRoles ? allowedRoles.includes("HR") : true;
  }
  
  const allowedRoles = roleAccess[menuKey];
  return allowedRoles ? allowedRoles.includes(userRole) : true;
};

export const hasChildrenAccess = (
  parentName: string,
  childKey: string,
  userRole: Role,
  userName?: string,
  userDepartment?: string
): boolean => {
  if (
    userRole === "Head Department" &&
    userName?.toUpperCase() === "KUSWARA" &&
    userDepartment === "Finance"
  ) {
    
    const accessKey = `${parentName}.${childKey}`;
    const allowedRoles = roleAccess[accessKey];
    return allowedRoles ? allowedRoles.includes("HR") : true;
  }
  const accessKey = `${parentName}.${childKey}`;
  const allowedRoles = roleAccess[accessKey];
  return allowedRoles ? allowedRoles.includes(userRole) : true;
};


export const filterChildrenByRole = (
  parentName: string,
  children: any[],
  userRole: Role,
  userName?: string,
  userDepartment?: string
) => {
  return children.filter(child =>
    hasChildrenAccess(parentName, child.key, userRole, userName, userDepartment)
  );
};
