"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Bar, Line, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function AdminHomeMain() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  // Dummy data for charts (keep for now)
  const barData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Users",
        data: [120, 190, 300, 250, 420, 500],
        backgroundColor: "#6366f1",
      },
    ],
  };

  const lineData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Revenue (₱)",
        data: [15000, 20000, 18000, 22000, 30000, 40000],
        borderColor: "#f59e0b",
        backgroundColor: "rgba(245, 158, 11, 0.2)",
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const pieData = {
    labels: ["Item A", "Item B", "Item C", "Item D"],
    datasets: [
      {
        data: [300, 150, 100, 50],
        backgroundColor: ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"],
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
    },
  };

  return (
    <section className="bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Welcome Card */}
        <div className="bg-white rounded-2xl shadow p-6 mb-10">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Welcome, Admin!
          </h2>
          <p className="text-gray-600">
            This dashboard allows administrators to manage accounts, view
            reports, monitor roles and system logs, and much more.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-white p-6 rounded-2xl shadow hover:shadow-lg transition">
            <p className="text-gray-500">Users</p>
            <h3 className="text-3xl font-bold text-indigo-600">
              {loading ? "..." : users.length}
            </h3>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow hover:shadow-lg transition">
            <p className="text-gray-500">Items</p>
            <h3 className="text-3xl font-bold text-green-600">578</h3>
          </div>
          {/* ✅ Admins (includes Super Admin) */}
          <div className="bg-white p-6 rounded-2xl shadow hover:shadow-lg transition">
            <p className="text-gray-500">Admins</p>
            <h3 className="text-3xl font-bold text-blue-600">
              {loading
                ? "..."
                : users.filter(
                    (u) =>
                      u.role === "admin" || u.email === "aaronbagain@gmail.com"
                  ).length}
            </h3>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow hover:shadow-lg transition">
            <p className="text-gray-500">Revenue</p>
            <h3 className="text-3xl font-bold text-yellow-600">₱92,340</h3>
          </div>
        </div>

        {/* Charts */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h3 className="text-xl font-semibold text-gray-700 mb-6">
            Analytics Overview
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar Chart */}
            <div className="bg-gray-50 p-4 rounded-xl shadow-inner h-80 flex flex-col">
              <h4 className="text-lg font-semibold text-gray-700 mb-4">
                Users Growth
              </h4>
              <div className="flex-1">
                <Bar data={barData} options={chartOptions} />
              </div>
            </div>

            {/* Line Chart */}
            <div className="bg-gray-50 p-4 rounded-xl shadow-inner h-80 flex flex-col">
              <h4 className="text-lg font-semibold text-gray-700 mb-4">
                Revenue Trend
              </h4>
              <div className="flex-1">
                <Line data={lineData} options={chartOptions} />
              </div>
            </div>

            {/* Pie Chart */}
            <div className="bg-gray-50 p-4 rounded-xl shadow-inner lg:col-span-2 h-[350px] flex flex-col">
              <h4 className="text-lg font-semibold text-gray-700 mb-4">
                Items Distribution
              </h4>
              <div className="flex-1">
                <Pie data={pieData} options={chartOptions} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
