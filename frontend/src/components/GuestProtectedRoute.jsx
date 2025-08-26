// GuestProtectedRoute.jsx
import { Navigate, Outlet } from "react-router-dom";

export default function GuestProtectedRoute() {
  const userData = JSON.parse(localStorage.getItem("user"));

  if (token && userData?.role === "tourist") {
    return <Navigate to="/Homepage" replace />;
  }

  if (token && userData?.role === "admin") {
    return <Navigate to="/AdminHome" replace />;
  }

  // ✅ No token = guest
  return <Outlet />;
}
