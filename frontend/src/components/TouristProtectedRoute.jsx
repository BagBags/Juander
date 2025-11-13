import React from "react";
import { Navigate, Outlet } from "react-router-dom";

export default function TouristProtectedRoute() {
  let userData = null;
  
  try {
    const userStr = localStorage.getItem("user");
    userData = userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error("Error parsing user data:", error);
    userData = null;
  }

  if (!userData || userData.role !== "tourist") {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
