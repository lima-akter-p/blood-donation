import { Navigate, Outlet } from "react-router";
import { useAuth } from "../context/useAuth";

export default function RequireRequestManager() {
  const { user } = useAuth();
  if (
    user.status !== "active"
    || (user.role !== "donor" && user.role !== "admin")
    || (user.role === "donor" && (user.donorVerificationStatus || "verified") !== "verified")
  ) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
}
