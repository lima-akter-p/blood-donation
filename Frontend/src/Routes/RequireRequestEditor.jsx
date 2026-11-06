import { Navigate, Outlet } from "react-router";
import { useAuth } from "../context/useAuth";

export default function RequireRequestEditor() {
  const { user } = useAuth();
  const permittedRoles = ["donor", "volunteer", "admin"];
  if (
    user.status !== "active"
    || !permittedRoles.includes(user.role)
    || (user.role === "donor" && (user.donorVerificationStatus || "verified") !== "verified")
  ) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
}
