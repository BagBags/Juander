// GuestProtectedRoute.jsx
import { Navigate, Outlet } from "react-router-dom";

export default function GuestProtectedRoute() {
  // Check localStorage for both regular users and guests
  const token = localStorage.getItem("token");
  const userData = JSON.parse(localStorage.getItem("user") || "null");
  const isGuest = localStorage.getItem("guest") === "true";

  // If logged in as tourist, redirect to tourist homepage
  if (token && userData?.role === "tourist") {
    return <Navigate to="/Homepage" replace />;
  }

  // If logged in as admin, redirect to admin homepage
  if (token && userData?.role === "admin") {
    return <Navigate to="/AdminHome" replace />;
  }

  // ✅ Allow access for guests (no token or guest flag set)
  return <Outlet />;
}
