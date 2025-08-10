// src/constants/accessControl.ts

// Semua role yang tersedia
export type Role = "Security" | "HR" | "User" | "Head Department" | "Director";

console.log("accessControl mounted")

// Akses masing-masing role ke menu sidebar
export const roleAccess: Record<string, Role[]> = {
  Dashboard: ["Security", "HR"], // Menu A
  "History Management": ["Security", "HR", "Head Department"], // Menu B
  "Leave Permission": ["HR", "User", "Head Department", "Director"], // Menu C
};
