import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useIsMobile } from "../hooks/useIsMobile";
import AdminMobileWarning from "./adminComponents/AdminMobileWarning";

export default function AdminProtectedRoute() {
  const userData = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");
  const isMobile = useIsMobile();

  if (!token || !userData || userData.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  if (!userData || userData.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  // Show mobile warning if accessing from mobile device
  if (isMobile) {
    return <AdminMobileWarning />;
  }

  return <Outlet />;
}
