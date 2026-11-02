import { Navigate, Outlet } from "react-router";
import { useAuth } from "../context/useAuth";

export default function RequireVolunteer() {
  const { user } = useAuth();
  const role = user.role?.trim().toLowerCase();
  return user.status === "active" && (role === "volunteer" || role === "admin")
    ? <Outlet />
    : <Navigate to="/dashboard" replace />;
}
