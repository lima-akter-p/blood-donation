import { Navigate, Outlet } from "react-router";
import { useAuth } from "../context/useAuth";

export default function RequireRequestEditor() {
  const { user } = useAuth();
  const permittedRoles = ["donor", "volunteer", "admin"];
  if (user.status !== "active" || !permittedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
}
