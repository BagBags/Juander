import React, { useState } from "react";
import AdminSidebar from "../../sidebarComponents/admin-sidebar/adminSidebar";
import AdminTourMap from "./LazyAdminTourMap";

export default function AdminMap() {
  const [isExpanded, setIsExpanded] = useState(true);

  const toggleSidebar = () => setIsExpanded((prev) => !prev);

  return (
    <div className="min-h-screen">
      {/* Sidebar */}
      <AdminSidebar isExpanded={isExpanded} toggleSidebar={toggleSidebar} />

      {/* Main Content */}
      <main 
        className={`min-h-screen transition-all duration-300 ${
          isExpanded ? "ml-80" : "ml-20"
        }`}
      >
        <AdminTourMap isExpanded={isExpanded} />
      </main>
    </div>
  );
}
