import React, { useState } from "react";
import AdminSidebar from "../../sidebarComponents/admin-sidebar/adminSidebar";
import AdminLogMain from "./adminLogMain";

export default function AdminHome() {
  const [isExpanded, setIsExpanded] = useState(true);

  const toggleSidebar = () => setIsExpanded((prev) => !prev);

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <AdminSidebar isExpanded={isExpanded} toggleSidebar={toggleSidebar} />

      {/* Main Content */}
      <main
        className={`transition-all duration-300 flex-1 p-6 ${
          isExpanded ? "ml-80" : "ml-20"
        }`}
      >
        <AdminLogMain />
      </main>
    </div>
  );
}
