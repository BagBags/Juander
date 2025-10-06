import React, { useState } from "react";
import AdminSidebar from "../../sidebarComponents/admin-sidebar/adminSidebar";
import AdminPhotoboothMain from "./adminPhotoboothMain";

export default function AdminPhotobooth() {
  const [isExpanded, setIsExpanded] = useState(true);

  const toggleSidebar = () => setIsExpanded((prev) => !prev);

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <AdminSidebar isExpanded={isExpanded} toggleSidebar={toggleSidebar} />

      {/* Main Content */}
      <div
        className={`flex-1 transition-all duration-300 ${
          isExpanded ? "ml-80" : "ml-20"
        }`}
      >
        {/* Page Header */}
        <div className="w-full bg-white shadow-md px-8 py-4 mb-6">
          <h1 className="text-2xl font-medium pr-20 pl-20 text-gray-800">
            Photobooth Filters
          </h1>
        </div>

        {/* Main Section */}
        <main className="p-6">
          <AdminPhotoboothMain />
        </main>
      </div>
    </div>
  );
}
