import React, { useState } from "react";
import AdminSidebar from "../../sidebarComponents/admin-sidebar/adminSidebar";
import AdminHomeMain from "./adminHomeMain";

export default function AdminHome() {
  const [isExpanded, setIsExpanded] = useState(true);

  const toggleSidebar = () => setIsExpanded((prev) => !prev);

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar - Hidden on print */}
      <div className="print:hidden">
        <AdminSidebar isExpanded={isExpanded} toggleSidebar={toggleSidebar} />
      </div>

      {/* Main Content */}
      <div
        className={`flex-1 transition-all duration-300 ${
          isExpanded ? "ml-80" : "ml-20"
        } print:ml-0`}
      >
        {/* Page Header - Hidden on print */}
        <div className="w-full bg-white shadow-md px-8 py-4 print:hidden">
          <h1 className="text-2xl text-gray-800 font-medium pr-20 pl-20">
            Admin Home
          </h1>
        </div>

        {/* Main Section */}
        <main className="p-6 pl-20 pr-20 print:p-0">
          <AdminHomeMain />
        </main>
      </div>
    </div>
  );
}
