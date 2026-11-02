import { Navigate, Outlet } from "react-router";
import { useAuth } from "../context/useAuth";

export default function RequireAdmin() {
  const { user } = useAuth();
  return user.role === "admin" ? <Outlet /> : <Navigate to="/dashboard" replace />;
}
