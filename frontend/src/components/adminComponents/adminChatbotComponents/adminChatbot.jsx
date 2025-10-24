import React, { useState } from "react";
import AdminSidebar from "../../sidebarComponents/admin-sidebar/adminSidebar";
import AdminChatbotMain from "./adminChatbotMain";

export default function AdminHome() {
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
          <h1 className="text-2xl text-gray-800 pr-20 pl-20 font-medium">
            Chatbot Knowledge Base
          </h1>
        </div>

        {/* Main Content */}
        <main className="p-6">
          <AdminChatbotMain />
        </main>
      </div>
    </div>
  );
}
