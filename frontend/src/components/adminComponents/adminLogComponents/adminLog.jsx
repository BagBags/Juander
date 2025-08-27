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
        className={`transition-all duration-300 flex-1 p-6 pl-20 pr-20 ${
          isExpanded ? "ml-80" : "ml-20"
        }`}
      >
        {/* Page Header outside the card */}
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            Admin Action Logs
          </h1>
        </div>

        {/* Logs Table (inside its own card) */}
        <AdminLogMain />
      </main>
    </div>
  );
}
