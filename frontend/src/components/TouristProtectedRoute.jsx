import React from "react";
import { Navigate, Outlet } from "react-router-dom";

export default function TouristProtectedRoute() {
  const userData = JSON.parse(localStorage.getItem("user"));

  if (!userData || userData.role !== "tourist") {
    return <Navigate to="/login" replace />; // ✅ go straight to login
  }

  return <Outlet />;
}
