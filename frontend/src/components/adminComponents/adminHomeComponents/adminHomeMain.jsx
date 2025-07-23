import React, { useEffect, useState } from "react";
import axios from "axios";

export default function AdminHomeMain() {
  const [filters, setFilters] = useState([]);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const res = await axios.get("/api/filters");
        // Adjust the URL if needed
        setFilters(res.data);
        console.log(res.data);
      } catch (err) {
        console.error("Error fetching filters:", err);
      }
    };

    fetchFilters();
  }, []);

  return (
    <section>
      <h1 className="text-4xl font-bold text-[#f04e37] mb-6">Dashboard</h1>
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-5xl font-bold text-gray-800 mb-2 text-center">
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

        {/* Display fetched filter data */}
        <div className="mt-6">
          <h3 className="text-2xl font-semibold text-gray-800 mb-2">
            Filters:
          </h3>
          <ul className="list-disc list-inside text-gray-700">
            {filters.map((filter, index) => (
              <li key={index}>{filter.value}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
