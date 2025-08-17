import React from "react";
import { Navigate, Outlet } from "react-router-dom";

export default function AdminProtectedRoute() {
  const userData = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  if (!token || !userData || userData.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  if (!userData || userData.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
