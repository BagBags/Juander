import React, { useState } from "react";
import AdminSidebar from "../../sidebarComponents/admin-sidebar/adminSidebar";
import AdminItineraryMain from "./adminItineraryMain";

export default function AdminItinerary() {
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
          <h1 className="text-2xl  text-gray-800 font-medium pr-20 pl-20">
            Suggested Itinerary
          </h1>
        </div>

        {/* Main Section */}
        <main className="p-6 pl-20 pr-20">
          <AdminItineraryMain />
        </main>
      </div>
    </div>
  );
}
