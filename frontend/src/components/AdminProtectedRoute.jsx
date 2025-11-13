import React, { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import AdminWebOnlyPage from "./adminComponents/AdminWebOnlyPage";

export default function AdminProtectedRoute() {
  let userData = null;
  
  try {
    const userStr = localStorage.getItem("user");
    userData = userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error("Error parsing user data:", error);
    userData = null;
  }
  
  const token = localStorage.getItem("token");
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      
      // Check for mobile devices
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
      const isMobileDevice = mobileRegex.test(userAgent);
      
      // Check for small screen size (additional check)
      const isSmallScreen = window.innerWidth < 768;
      
      // Check for touch capability
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      // Consider it mobile if it matches mobile UA OR (small screen AND touch capable)
      setIsMobile(isMobileDevice || (isSmallScreen && isTouchDevice));
    };

    checkMobile();
    
    // Re-check on resize
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Check authentication first
  if (!token || !userData || userData.role !== "admin") {
    return <Navigate to="/login" replace />;
  }

  // If mobile device, show web-only page
  if (isMobile) {
    return <AdminWebOnlyPage />;
  }

  return <Outlet />;
}
