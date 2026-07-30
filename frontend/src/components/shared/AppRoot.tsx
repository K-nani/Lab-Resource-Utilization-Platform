import * as React from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { FlaskConical } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { setUnauthorizedHandler } from "@/lib/api/client";
import { ROLE_PERMISSIONS } from "@/config/rolePermissions";
import { AppShell } from "@/components/shared/AppShell";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import type { Role } from "@/types";

import LandingPage from "@/features/landing/LandingPage";

import LoginPage from "@/features/auth/LoginPage";
import RegisterPage from "@/features/auth/RegisterPage";
import VerifyOtpPage from "@/features/auth/VerifyOtpPage";
import ForgotPasswordPage from "@/features/auth/ForgotPasswordPage";
import ResetPasswordPage from "@/features/auth/ResetPasswordPage";

import EquipmentCatalogPage from "@/features/equipment/EquipmentCatalogPage";
import EquipmentDetailPage from "@/features/equipment/EquipmentDetailPage";

import ResearcherDashboard from "@/features/researcher/ResearcherDashboard";
import CreateBookingPage from "@/features/researcher/CreateBookingPage";

import ManagerDashboard from "@/features/manager/ManagerDashboard";
import ManageEquipmentPage from "@/features/manager/ManageEquipmentPage";
import EquipmentFormPage from "@/features/manager/EquipmentFormPage";
import ManagerBookingsPage from "@/features/manager/ManagerBookingsPage";
import ManagerCalendarPage from "@/features/manager/ManagerCalendarPage";
import UtilizationPage from "@/features/manager/UtilizationPage";
import EquipmentUtilizationDashboard from "@/features/manager/EquipmentUtilizationDashboard";
import ManagerWaitlistPage from "@/features/manager/ManagerWaitlistPage";
import CalibrationsDuePage from "@/features/manager/CalibrationsDuePage";
import BookingAuditPage from "@/features/manager/BookingAuditPage";
import ReportsPage from "@/features/manager/ReportsPage";
import CalibrationDashboard from "@/features/technician/CalibrationDashboard";
import AdminInstitutionsPage from "@/features/admin/AdminInstitutionsPage";
import BrowsePlaceholder from "@/features/browse/BrowsePlaceholder";
import { ProfilePage } from "@/features/profile/ProfilePage";
import CreateMaintenanceRequestPage from "@/features/maintenance/CreateMaintenanceRequestPage";
import MaintenanceRequestsListPage from "@/features/maintenance/MaintenanceRequestsListPage";
import TechnicianMaintenancePage from "@/features/maintenance/TechnicianMaintenancePage";

// ---------------------------------------------------------------------------
// AppRoot — wires the React Router v6 route table, the global 401 handler,
// session hydration, and the role-based guards (driven by ROLE_PERMISSIONS).
// ---------------------------------------------------------------------------

function Splash() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-soft">
          <FlaskConical className="size-6" />
        </div>
        <div className="size-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
      </div>
    </div>
  );
}

/** Side-effectful bootstrap: hydrate the session + wire the global 401 handler. */
function Bootstrap() {
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s.hydrated);
  const hydrateUser = useAuthStore((s) => s.hydrateUser);
  const clearSession = useAuthStore((s) => s.clearSession);

  // Wire the 401 handler FIRST so it's ready before any in-flight fetch resolves.
  React.useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession();
      navigate("/login", { replace: true });
      toast.error("Session expired — please log in again.");
    });
    return () => setUnauthorizedHandler(null);
  }, [clearSession, navigate]);

  // Hydrate the session from a persisted token on mount.
  React.useEffect(() => {
    if (token && !hydrated) hydrateUser();
  }, [token, hydrated, hydrateUser]);

  return null;
}

/** Require an authenticated, email-verified session. */
function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s.hydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  if (token && !hydrated) return <Splash />;
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
  if (!user.emailVerified) {
    return (
      <Navigate
        to={`/verify-otp?email=${encodeURIComponent(user.email)}`}
        replace
      />
    );
  }
  return <>{children}</>;
}

/** Require a specific set of roles (in addition to auth). */
function RequireRole({
  roles,
  children,
}: {
  roles: Role[];
  children: React.ReactNode;
}) {
  const user = useAuthStore((s) => s.user);
  return (
    <RequireAuth>
      {user && roles.includes(user.role) ? (
        children
      ) : (
        <Navigate to={ROLE_PERMISSIONS[user?.role ?? "RESEARCHER"].landing} replace />
      )}
    </RequireAuth>
  );
}

/** Public-only pages (login/register): bounce authed users to their landing. */
function PublicOnly({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s.hydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  if (token && !hydrated) return <Splash />;
  if (isAuthenticated && user && user.emailVerified) {
    return <Navigate to={ROLE_PERMISSIONS[user.role].landing} replace />;
  }
  return <>{children}</>;
}

const withShell = (node: React.ReactNode) => (
  <RequireAuth>
    <AppShell>{node}</AppShell>
  </RequireAuth>
);

const withRoleShell = (roles: Role[], node: React.ReactNode) => (
  <RequireRole roles={roles}>
    <AppShell>{node}</AppShell>
  </RequireRole>
);

const OTHER_ROLES: Role[] = [
  "LAB_TECHNICIAN",
  "DEPARTMENT_HEAD",
  "INSTITUTION_ADMIN",
  "SYSTEM_ADMIN",
];

export function AppRoot() {
  return (
    <>
      <Bootstrap />
      <ErrorBoundary>
      <Routes>
        {/* Public landing page */}
        <Route path="/" element={<LandingPage />} />

        {/* Auth flow */}
        <Route
          path="/login"
          element={
            <PublicOnly>
              <LoginPage />
            </PublicOnly>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnly>
              <RegisterPage />
            </PublicOnly>
          }
        />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Shared (any authenticated role) */}
        <Route
          path="/equipment"
          element={withShell(<EquipmentCatalogPage />)}
        />
        <Route
          path="/equipment/:id"
          element={withShell(<EquipmentDetailPage />)}
        />
        <Route
          path="/profile"
          element={withShell(<ProfilePage />)}
        />

        {/* Researcher */}
        <Route
          path="/dashboard"
          element={withRoleShell(["RESEARCHER"], <ResearcherDashboard />)}
        />
        <Route
          path="/bookings/new"
          element={withRoleShell(["RESEARCHER"], <CreateBookingPage />)}
        />

        {/* Lab Manager */}
        <Route
          path="/manager/dashboard"
          element={withRoleShell(["LAB_MANAGER"], <ManagerDashboard />)}
        />
        <Route
          path="/manager/equipment"
          element={withRoleShell(["LAB_MANAGER", "SYSTEM_ADMIN", "INSTITUTION_ADMIN"], <ManageEquipmentPage />)}
        />
        <Route
          path="/manager/equipment/new"
          element={withRoleShell(["LAB_MANAGER", "SYSTEM_ADMIN", "INSTITUTION_ADMIN"], <EquipmentFormPage />)}
        />
        <Route
          path="/manager/equipment/:id/edit"
          element={withRoleShell(["LAB_MANAGER", "SYSTEM_ADMIN", "INSTITUTION_ADMIN"], <EquipmentFormPage />)}
        />
        <Route
          path="/manager/bookings"
          element={withRoleShell(["LAB_MANAGER"], <ManagerBookingsPage />)}
        />
        <Route
          path="/manager/calendar"
          element={withRoleShell(["LAB_MANAGER"], <ManagerCalendarPage />)}
        />
        <Route
          path="/manager/utilization"
          element={withRoleShell(["LAB_MANAGER"], <UtilizationPage />)}
        />
        <Route
          path="/manager/utilization-dashboard"
          element={withRoleShell(["LAB_MANAGER", "DEPARTMENT_HEAD", "INSTITUTION_ADMIN", "SYSTEM_ADMIN"], <EquipmentUtilizationDashboard />)}
        />
        <Route
          path="/manager/waitlist"
          element={withRoleShell(["LAB_MANAGER"], <ManagerWaitlistPage />)}
        />
        <Route
          path="/manager/calibrations"
          element={withRoleShell(["LAB_MANAGER"], <CalibrationsDuePage />)}
        />
        <Route
          path="/manager/audit"
          element={withRoleShell(["LAB_MANAGER"], <BookingAuditPage />)}
        />
        <Route
          path="/manager/reports"
          element={withRoleShell(["LAB_MANAGER", "SYSTEM_ADMIN", "INSTITUTION_ADMIN"], <ReportsPage />)}
        />

        {/* Maintenance Requests — Lab Manager */}
        <Route
          path="/manager/maintenance"
          element={withRoleShell(["LAB_MANAGER", "SYSTEM_ADMIN"], <MaintenanceRequestsListPage />)}
        />
        <Route
          path="/manager/maintenance/new"
          element={withRoleShell(["LAB_MANAGER", "SYSTEM_ADMIN"], <CreateMaintenanceRequestPage />)}
        />

        {/* Lab Technician */}
        <Route
          path="/technician/calibration"
          element={withRoleShell(["LAB_TECHNICIAN", "LAB_MANAGER", "DEPARTMENT_HEAD", "SYSTEM_ADMIN", "INSTITUTION_ADMIN"], <CalibrationDashboard />)}
        />
        <Route
          path="/technician/maintenance"
          element={withRoleShell(["LAB_TECHNICIAN"], <TechnicianMaintenancePage />)}
        />

        {/* Admin */}
        <Route
          path="/admin/institutions"
          element={
            withRoleShell(
              ["SYSTEM_ADMIN", "INSTITUTION_ADMIN"],
              <AdminInstitutionsPage />,
            )
          }
        />
        {/* Other roles — browse-only */}
        <Route
          path="/browse"
          element={withRoleShell(OTHER_ROLES, <BrowsePlaceholder />)}
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </ErrorBoundary>
    </>
  );
}
