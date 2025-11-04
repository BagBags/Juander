import React, { useState } from "react";
import AdminSidebar from "../../sidebarComponents/admin-sidebar/adminSidebar";
import AdminReviewsMain from "./adminReviewsMain";

export default function AdminReviews() {
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
        <div className="w-full bg-white shadow-md px-8 py-4">
          <h1 className="text-2xl text-gray-800 font-medium pr-20 pl-20">
            Manage Reviews
          </h1>
        </div>

        {/* Main Section */}
        <main className="p-6 pl-20 pr-20">
          <AdminReviewsMain />
        </main>
      </div>
    </div>
  );
}
