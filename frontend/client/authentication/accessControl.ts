
export type Role = "Security" | "HR" | "Staff" | "Head Department" | "Director" | "Super User";

//console.log("accessControl mounted")

export const roleAccess: Record<string, Role[]> = {
  Dashboard: ["Security", "HR", "Super User"], // Menu Dashboard
  "Operation": ["Security", "HR", "Super User"], // Menu Operation
  "History Operation": ["Security", "HR", "Head Department", "Super User"], // Menu History
  "Leave Permission": ["HR", "Staff", "Head Department", "Director", "Super User"], // Menu Leave

  // Children menu 
  "Dashboard.employee": ["HR", "Super User", "Security"], 
  "Dashboard.trucks": ["Security", "HR", "Super User"], 
  "Operation.loading": ["Security", "Super User", "HR"], 
  "Operation.unloading": ["Security", "Super User", "HR"], 
  "Operation.scan": ["Security", "HR", "Super User"], 
  "History Operation.employee-history": ["HR", "Head Department", "Super User"], 
  "History Operation.trucks-history": ["HR", "Super User"], 
};

// Helper utama untuk akses menu, terintegrasi dengan roleAccess dan pengecekan spesial
export const hasMenuAccess = (
  menuKey: string,
  userRole: Role,
  userName?: string,
  userDepartment?: string
): boolean => {
  // Integrasi pengecekan spesial di awal
  if (
    userRole === "Head Department" &&
    userName?.toUpperCase() === "KUSWARA" &&
    userDepartment === "Finance"
  ) {
    // Give KUSWARA the same access as HR role
    const allowedRoles = roleAccess[menuKey];
    return allowedRoles ? allowedRoles.includes("HR") : true;
  }
  // Lanjutkan ke roleAccess normal
  const allowedRoles = roleAccess[menuKey];
  return allowedRoles ? allowedRoles.includes(userRole) : true;
};

// Helper function untuk mengecek akses children menu (dengan nama dan department)
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
    // Give KUSWARA the same access as HR role
    const accessKey = `${parentName}.${childKey}`;
    const allowedRoles = roleAccess[accessKey];
    return allowedRoles ? allowedRoles.includes("HR") : true;
  }
  const accessKey = `${parentName}.${childKey}`;
  const allowedRoles = roleAccess[accessKey];
  return allowedRoles ? allowedRoles.includes(userRole) : true;
};

// Helper filter children dengan nama dan department
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
