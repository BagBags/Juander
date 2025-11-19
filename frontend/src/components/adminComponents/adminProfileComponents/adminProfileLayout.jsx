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
    return "Admin Profile";
  };

  // Routes that should display BackHeader
  const routesWithBackHeader = [
    "/Account",
    "/Birthday",
    "/Gender",
    "/Country",
  ];

  const showBackHeader = routesWithBackHeader.some((path) =>
    location.pathname.endsWith(path)
  );

  return (
    <div className="min-h-screen bg-white flex text-sm relative">
      {/* Sidebar */}
      <AdminSidebar isExpanded={isExpanded} toggleSidebar={toggleSidebar} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center px-4 md:px-0 overflow-auto">
        <div className="w-full max-w-md">
          {/* Conditionally render BackHeader */}
          {showBackHeader && (
            <BackHeader title={getTitle()} />
          )}

          <div>
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
