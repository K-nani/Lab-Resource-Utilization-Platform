import type { Role } from "@/types";

// ---------------------------------------------------------------------------
// Single source of truth for what each role can do.
// Route guards and UI branch off this map instead of scattered conditionals.
// ---------------------------------------------------------------------------

export type RouteKey =
  | "dashboard"
  | "bookingsNew"
  | "equipment"
  | "equipmentDetail"
  | "managerDashboard"
  | "managerEquipment"
  | "managerEquipmentNew"
  | "managerEquipmentEdit"
  | "managerBookings"
  | "managerCalendar"
  | "managerUtilization"
  | "managerWaitlist"
  | "managerCalibrations"
  | "managerAudit"
  | "managerMaintenance"
  | "managerReports"
  | "adminInstitutions"
  | "browse"
  | "technicianCalibration"
  | "technicianMaintenance";

export interface RolePermission {
  /** Full featured experience label, or null for browse-only placeholder */
  experience: "researcher" | "manager" | "browse" | "admin" | null;
  /** Landing route after login (within the in-app router) */
  landing: string;
  /** Routes this role is allowed to visit */
  routes: RouteKey[];
  /** Can book equipment */
  canBook: boolean;
  /** Can manage equipment (CRUD + status) */
  canManageEquipment: boolean;
  /** Can manage bookings across all users (accept/reject/etc.) */
  canManageBookings: boolean;
  /** Can view utilization reports */
  canViewUtilization: boolean;
  /** Friendly display name */
  label: string;
}

export const ROLE_PERMISSIONS: Record<Role, RolePermission> = {
  RESEARCHER: {
    experience: "researcher",
    landing: "/dashboard",
    routes: ["dashboard", "bookingsNew", "equipment", "equipmentDetail"],
    canBook: true,
    canManageEquipment: false,
    canManageBookings: false,
    canViewUtilization: false,
    label: "Researcher",
  },
  LAB_MANAGER: {
    experience: "manager",
    landing: "/manager/dashboard",
    routes: [
      "managerDashboard",
      "managerEquipment",
      "managerEquipmentNew",
      "managerEquipmentEdit",
      "managerBookings",
      "managerCalendar",
      "managerUtilization",
      "managerWaitlist",
      "managerCalibrations",
      "managerAudit",
      "managerMaintenance",
      "managerReports",
      "equipment",
      "equipmentDetail",
    ],
    canBook: false,
    canManageEquipment: true,
    canManageBookings: true,
    canViewUtilization: true,
    label: "Lab Manager",
  },
  LAB_TECHNICIAN: {
    experience: "browse",
    landing: "/technician/calibration",
    routes: ["technicianCalibration", "technicianMaintenance", "browse", "equipment", "equipmentDetail"],
    canBook: false,
    canManageEquipment: false,
    canManageBookings: false,
    canViewUtilization: false,
    label: "Lab Technician",
  },
  DEPARTMENT_HEAD: {
    experience: "browse",
    landing: "/browse",
    routes: ["browse", "equipment", "equipmentDetail"],
    canBook: false,
    canManageEquipment: false,
    canManageBookings: false,
    canViewUtilization: false,
    label: "Department Head",
  },
  INSTITUTION_ADMIN: {
    experience: "admin",
    landing: "/admin/institutions",
    routes: ["adminInstitutions", "browse", "equipment", "equipmentDetail"],
    canBook: false,
    canManageEquipment: false,
    canManageBookings: false,
    canViewUtilization: false,
    label: "Institution Admin",
  },
  SYSTEM_ADMIN: {
    experience: "admin",
    landing: "/admin/institutions",
    routes: ["adminInstitutions", "browse", "equipment", "equipmentDetail"],
    canBook: false,
    canManageEquipment: false,
    canManageBookings: false,
    canViewUtilization: false,
    label: "System Admin",
  },
};

export function canVisit(role: Role | undefined, route: RouteKey): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role].routes.includes(route);
}
