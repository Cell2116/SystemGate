export type Role = "Security" | "HR" | "User" | "Head Department" | "Director" | "Super User";

//console.log("accessControl mounted")

export const roleAccess: Record<string, Role[]> = {
  Dashboard: ["Security", "HR", "Super User"], // Menu Dashboard
  "History Management": ["Security", "HR", "Head Department", "Super User"], // Menu History
  "Leave Permission": ["HR", "User", "Head Department", "Director", "Super User"], // Menu Leave
};
