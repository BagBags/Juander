import React from "react";

export default function AdminHomeMain() {
  return (
    <section>
      <h1 className="text-4xl font-bold text-[#f04e37] mb-6">Dashboard</h1>
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-5xl font-bold text-gray-800 mb-2 text-center ">
          Welcome, Admin!
        </h2>
        <p className="text-gray-600">
          This dashboard allows administrators to manage employee accounts, view
          reports, manage roles and content, and monitor system logs.
        </p>
        <p className="text-gray-600 mt-2">
          Use the sidebar to navigate between sections. More features coming
          soon!
        </p>
      </div>
    </section>
  );
}
