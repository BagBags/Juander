import React, { useState } from "react";
import AdminSidebar from "../../sidebarComponents/admin-sidebar/adminSidebar";
import AdminTourMap from "./LazyAdminTourMap";

export default function AdminMap() {
  const [isExpanded, setIsExpanded] = useState(true);

  const toggleSidebar = () => setIsExpanded((prev) => !prev);

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <AdminSidebar isExpanded={isExpanded} toggleSidebar={toggleSidebar} />

      {/* Main Content */}
      <main
        className={`transition-all duration-300 flex-1 p-0 ${
          isExpanded ? "ml-80" : "ml-20"
        }`}
      >
        {/* Pass isExpanded to child */}
        <AdminTourMap isExpanded={isExpanded} />
      </main>
    </div>
  );
}
