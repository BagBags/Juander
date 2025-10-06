// pages/adminPages/adminRole.jsx
import React, { useState } from "react";
import AdminSidebar from "../../sidebarComponents/admin-sidebar/adminSidebar";
import RolesPage from "./adminRoleMain";

export default function AdminRole() {
  const [isExpanded, setIsExpanded] = useState(true);

  const toggleSidebar = () => setIsExpanded((prev) => !prev);

  return (
    <div className="flex min-h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <AdminSidebar isExpanded={isExpanded} toggleSidebar={toggleSidebar} />

      {/* Main Content */}
      <div
        className={`transition-all duration-300 ${
          isExpanded
            ? "ml-80 w-[calc(100%-20rem)]"
            : "ml-20 w-[calc(100%-5rem)]"
        }`}
      >
        {/* Page Header */}
        <div className="w-full bg-white shadow-md px-8 py-4">
          <h1 className="text-2xl text-gray-800 font-medium pr-20 pl-20">
            Manage User Roles
          </h1>
        </div>

        {/* Main Section */}
        <main className="p-6">
          <RolesPage />
        </main>
      </div>
    </div>
  );
}
