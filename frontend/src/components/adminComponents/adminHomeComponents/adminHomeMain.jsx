import React from "react";

export default function AdminHomeMain() {
  return (
    <section className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-2">
        Welcome to the Admin Dashboard
      </h2>
      <p className="text-gray-600">
        This dashboard allows administrators to manage employee accounts, view
        reports, manage roles and content, and monitor system logs.
      </p>
      <p className="text-gray-600 mt-2">
        Use the sidebar to navigate between sections. More features coming soon!
      </p>
    </section>
  );
}
