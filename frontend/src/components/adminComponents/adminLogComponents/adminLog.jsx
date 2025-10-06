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
      <div
        className={`transition-all duration-300 ${
          isExpanded
            ? "ml-80 w-[calc(100%-20rem)]"
            : "ml-20 w-[calc(100%-5rem)]"
        }`}
      >
        {/* Page Header */}
        <div className="w-full bg-white shadow-md px-8 py-4">
          <h1 className="text-2xl  text-gray-800 font-medium pr-20 pl-20">
            Admin Logs
          </h1>
        </div>

        {/* Logs Table (inside its own card) */}
        <main className="p-6 ">
          <AdminLogMain />
        </main>
      </div>
    </div>
  );
}
