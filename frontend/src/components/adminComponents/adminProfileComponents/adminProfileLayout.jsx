// src/components/admin/AdminProfileLayout.jsx
import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import AdminSidebar from "../../sidebarComponents/admin-sidebar/adminSidebar";

import BackHeader from "./BackHeader";

export default function AdminProfileLayout() {
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(true);

  const toggleSidebar = () => setIsExpanded((prev) => !prev);

  const getTitle = () => {
    if (location.pathname.endsWith("/Account")) return "Account";
    if (location.pathname.endsWith("/Birthday")) return "Birthday";
    if (location.pathname.endsWith("/Gender")) return "Gender";
    if (location.pathname.endsWith("/Country")) return "Country";
    if (location.pathname.endsWith("/Language")) return "Language";
    return "Admin Profile";
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center text-sm relative px-4 md:px-0">
      {/* Sidebar */}
      <AdminSidebar isExpanded={isExpanded} toggleSidebar={toggleSidebar} />
      <div className="w-full max-w-md">
        <div className="pt-4 z-10 bg-white sticky top-0">
          <BackHeader title={getTitle()} />
        </div>
        <div className="mt-4">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
