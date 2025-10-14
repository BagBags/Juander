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
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
    fetchReviews();
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

  const fetchReviews = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/reviews/admin/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReviews(res.data);
    } catch (err) {
      console.error("Error fetching reviews:", err);
    }
  };

  // Print function
  const handlePrint = () => {
    window.print();
  };

  // ✅ Real data: Users by Country (Bar Chart)
  const countryCount = users.reduce((acc, user) => {
    const country = user.country || "Not Specified";
    acc[country] = (acc[country] || 0) + 1;
    return acc;
  }, {});

  const countryData = {
    labels: Object.keys(countryCount),
    datasets: [
      {
        label: "Users by Country",
        data: Object.values(countryCount),
        backgroundColor: "#f04e37",
      },
    ],
  };

  // ✅ Real data: Users by Gender (Pie Chart)
  const genderCount = users.reduce((acc, user) => {
    const gender = user.gender || "Not Specified";
    acc[gender] = (acc[gender] || 0) + 1;
    return acc;
  }, {});

  const genderData = {
    labels: Object.keys(genderCount),
    datasets: [
      {
        data: Object.values(genderCount),
        backgroundColor: ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"],
      },
    ],
  };

  // ✅ Real data: Users by Language (Doughnut Chart)
  const languageCount = users.reduce((acc, user) => {
    const lang = user.language || "Not Specified";
    const langName = lang === "en" ? "English" : lang === "tl" || lang === "fil" ? "Filipino" : lang;
    acc[langName] = (acc[langName] || 0) + 1;
    return acc;
  }, {});

  const languageData = {
    labels: Object.keys(languageCount),
    datasets: [
      {
        data: Object.values(languageCount),
        backgroundColor: ["#6366f1", "#f59e0b", "#10b981", "#ef4444"],
      },
    ],
  };

  // ✅ Real data: User Registration Timeline (Line Chart)
  const registrationByMonth = users.reduce((acc, user) => {
    if (user.createdAt) {
      const date = new Date(user.createdAt);
      const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
      acc[monthYear] = (acc[monthYear] || 0) + 1;
    }
    return acc;
  }, {});

  const sortedMonths = Object.keys(registrationByMonth).sort((a, b) => {
    return new Date(a) - new Date(b);
  });

  const registrationData = {
    labels: sortedMonths.length > 0 ? sortedMonths : ["No Data"],
    datasets: [
      {
        label: "User Registrations",
        data: sortedMonths.length > 0 ? sortedMonths.map(m => registrationByMonth[m]) : [0],
        borderColor: "#10b981",
        backgroundColor: "rgba(16, 185, 129, 0.2)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // ✅ Real data: Reviews by Rating (Bar Chart)
  const ratingCount = reviews.reduce((acc, review) => {
    const rating = review.rating || 0;
    acc[rating] = (acc[rating] || 0) + 1;
    return acc;
  }, {});

  const ratingData = {
    labels: ["1 Star", "2 Stars", "3 Stars", "4 Stars", "5 Stars"],
    datasets: [
      {
        label: "Reviews by Rating",
        data: [
          ratingCount[1] || 0,
          ratingCount[2] || 0,
          ratingCount[3] || 0,
          ratingCount[4] || 0,
          ratingCount[5] || 0,
        ],
        backgroundColor: ["#ef4444", "#f59e0b", "#fbbf24", "#10b981", "#22c55e"],
      },
    ],
  };

  // ✅ Real data: Reviews by Site (Top 5)
  const reviewsBySite = reviews.reduce((acc, review) => {
    const siteName = review.siteId?.siteName || "Unknown Site";
    acc[siteName] = (acc[siteName] || 0) + 1;
    return acc;
  }, {});

  const topSites = Object.entries(reviewsBySite)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const topSitesData = {
    labels: topSites.map(([site]) => site),
    datasets: [
      {
        label: "Reviews per Site",
        data: topSites.map(([, count]) => count),
        backgroundColor: "#3b82f6",
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
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          precision: 0,
        },
      },
    },
  };

  return (
    <section className="bg-gray-100 min-h-screen print:bg-white">
      <div className="max-w-7xl mx-auto px-6 py-10 print:px-12 print:py-8 print:max-w-none">
        {/* Welcome Card */}
        <div className="bg-white rounded-2xl shadow p-6 mb-10 print:shadow-none print:rounded-none print:border-b-4 print:border-[#f04e37] print:mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2 print:hidden">
            Welcome, Admin!
          </h2>
          <p className="text-gray-600 print:hidden">
            This dashboard allows administrators to manage accounts, view
            reports, monitor roles and system logs, and much more.
          </p>
          {/* Print Header */}
          <div className="hidden print:block text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">INTRAMUROS ADMINISTRATION</h1>
            <h2 className="text-2xl font-semibold text-[#f04e37] mb-4">User Analytics Report</h2>
            <p className="text-gray-600 text-sm">
              Generated on {new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 print:mb-8">
          <div className="bg-white p-6 rounded-2xl shadow hover:shadow-lg transition print:shadow-none print:border print:border-gray-300">
            <p className="text-gray-500">Users</p>
            <h3 className="text-3xl font-bold text-indigo-600">
              {loading ? "..." : users.length}
            </h3>
          </div>
          {/* ✅ Admins (includes Super Admin) */}
          <div className="bg-white p-6 rounded-2xl shadow hover:shadow-lg transition print:shadow-none print:border print:border-gray-300">
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
          <div className="bg-white p-6 rounded-2xl shadow hover:shadow-lg transition print:shadow-none print:border print:border-gray-300">
            <p className="text-gray-500">Total Reviews</p>
            <h3 className="text-3xl font-bold text-green-600">
              {loading ? "..." : reviews.length}
            </h3>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow hover:shadow-lg transition print:shadow-none print:border print:border-gray-300">
            <p className="text-gray-500">Avg Rating</p>
            <h3 className="text-3xl font-bold text-yellow-600">
              {loading || reviews.length === 0
                ? "N/A"
                : (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)} ⭐
            </h3>
          </div>
        </div>

        {/* Print Button */}
        <div className="flex justify-end mb-4">
          <button
            onClick={handlePrint}
            className="bg-[#f04e37] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#e03d2d] transition flex items-center gap-2 print:hidden"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
            </svg>
            Print Report
          </button>
        </div>

        {/* Charts - Hidden on Print */}
        <div className="bg-white rounded-2xl shadow p-6 print:hidden">
          <h3 className="text-xl font-semibold text-gray-700 mb-6">
            Analytics Overview
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar Chart - Users by Country */}
            <div className="bg-gray-50 p-4 rounded-xl shadow-inner h-80 flex flex-col">
              <h4 className="text-lg font-semibold text-gray-700 mb-4">
                Users by Country
              </h4>
              <div className="flex-1">
                <Bar data={countryData} options={chartOptions} />
              </div>
            </div>

            {/* Line Chart - Registration Timeline */}
            <div className="bg-gray-50 p-4 rounded-xl shadow-inner h-80 flex flex-col">
              <h4 className="text-lg font-semibold text-gray-700 mb-4">
                User Registration Timeline
              </h4>
              <div className="flex-1">
                <Line data={registrationData} options={chartOptions} />
              </div>
            </div>

            {/* Pie Chart - Gender Distribution */}
            <div className="bg-gray-50 p-4 rounded-xl shadow-inner h-80 flex flex-col">
              <h4 className="text-lg font-semibold text-gray-700 mb-4">
                Users by Gender
              </h4>
              <div className="flex-1">
                <Pie data={genderData} options={chartOptions} />
              </div>
            </div>

            {/* Pie Chart - Language Preference */}
            <div className="bg-gray-50 p-4 rounded-xl shadow-inner h-80 flex flex-col">
              <h4 className="text-lg font-semibold text-gray-700 mb-4">
                Users by Language Preference
              </h4>
              <div className="flex-1">
                <Pie data={languageData} options={chartOptions} />
              </div>
            </div>

            {/* Bar Chart - Reviews by Rating */}
            <div className="bg-gray-50 p-4 rounded-xl shadow-inner h-80 flex flex-col">
              <h4 className="text-lg font-semibold text-gray-700 mb-4">
                Reviews by Rating
              </h4>
              <div className="flex-1">
                <Bar data={ratingData} options={chartOptions} />
              </div>
            </div>

            {/* Bar Chart - Top Reviewed Sites */}
            <div className="bg-gray-50 p-4 rounded-xl shadow-inner h-80 flex flex-col">
              <h4 className="text-lg font-semibold text-gray-700 mb-4">
                Top 5 Reviewed Sites
              </h4>
              <div className="flex-1">
                <Bar data={topSitesData} options={chartOptions} />
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Print Report - Only visible when printing */}
        <div className="hidden print:block space-y-6 mt-8 page-break-before">
          {/* Summary Statistics */}
          <div className="bg-white p-6 rounded-lg border border-gray-300">
            <h3 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">
              Summary Statistics
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="border-r border-b pr-4 pb-4">
                <p className="text-gray-600 font-semibold">Total Users:</p>
                <p className="text-3xl font-bold text-indigo-600">{users.length}</p>
              </div>
              <div className="pl-4 border-b pb-4">
                <p className="text-gray-600 font-semibold">Total Admins:</p>
                <p className="text-3xl font-bold text-blue-600">
                  {users.filter((u) => u.role === "admin" || u.email === "aaronbagain@gmail.com").length}
                </p>
              </div>
              <div className="border-r pr-4 pt-4">
                <p className="text-gray-600 font-semibold">Total Reviews:</p>
                <p className="text-3xl font-bold text-green-600">{reviews.length}</p>
              </div>
              <div className="pl-4 pt-4">
                <p className="text-gray-600 font-semibold">Average Rating:</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {reviews.length > 0
                    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
                    : "N/A"} ⭐
                </p>
              </div>
            </div>
          </div>

          {/* Users by Country Table */}
          <div className="bg-white p-6 rounded-lg border border-gray-300">
            <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
              Users by Country
            </h3>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-left">Country</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">Count</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(countryCount)
                  .sort((a, b) => b[1] - a[1])
                  .map(([country, count]) => (
                    <tr key={country}>
                      <td className="border border-gray-300 px-4 py-2">{country}</td>
                      <td className="border border-gray-300 px-4 py-2 text-right font-semibold">{count}</td>
                      <td className="border border-gray-300 px-4 py-2 text-right">
                        {((count / users.length) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                <tr className="bg-gray-100 font-bold">
                  <td className="border border-gray-300 px-4 py-2">Total</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">{users.length}</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">100%</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Users by Gender Table */}
          <div className="bg-white p-6 rounded-lg border border-gray-300">
            <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
              Users by Gender
            </h3>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-left">Gender</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">Count</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(genderCount)
                  .sort((a, b) => b[1] - a[1])
                  .map(([gender, count]) => (
                    <tr key={gender}>
                      <td className="border border-gray-300 px-4 py-2">{gender}</td>
                      <td className="border border-gray-300 px-4 py-2 text-right font-semibold">{count}</td>
                      <td className="border border-gray-300 px-4 py-2 text-right">
                        {((count / users.length) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                <tr className="bg-gray-100 font-bold">
                  <td className="border border-gray-300 px-4 py-2">Total</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">{users.length}</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">100%</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Users by Language Table */}
          <div className="bg-white p-6 rounded-lg border border-gray-300">
            <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
              Users by Language Preference
            </h3>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-left">Language</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">Count</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(languageCount)
                  .sort((a, b) => b[1] - a[1])
                  .map(([language, count]) => (
                    <tr key={language}>
                      <td className="border border-gray-300 px-4 py-2">{language}</td>
                      <td className="border border-gray-300 px-4 py-2 text-right font-semibold">{count}</td>
                      <td className="border border-gray-300 px-4 py-2 text-right">
                        {((count / users.length) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                <tr className="bg-gray-100 font-bold">
                  <td className="border border-gray-300 px-4 py-2">Total</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">{users.length}</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">100%</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* User Registration Timeline Table */}
          <div className="bg-white p-6 rounded-lg border border-gray-300">
            <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
              User Registration Timeline
            </h3>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-left">Month/Year</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">New Users</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">Cumulative</th>
                </tr>
              </thead>
              <tbody>
                {sortedMonths.map((month, index) => {
                  const cumulative = sortedMonths
                    .slice(0, index + 1)
                    .reduce((sum, m) => sum + registrationByMonth[m], 0);
                  return (
                    <tr key={month}>
                      <td className="border border-gray-300 px-4 py-2">{month}</td>
                      <td className="border border-gray-300 px-4 py-2 text-right font-semibold">
                        {registrationByMonth[month]}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-right">
                        {cumulative}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Reviews by Rating Table */}
          <div className="bg-white p-6 rounded-lg border border-gray-300">
            <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
              Reviews by Rating
            </h3>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-left">Rating</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">Count</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = ratingCount[rating] || 0;
                  return (
                    <tr key={rating}>
                      <td className="border border-gray-300 px-4 py-2">
                        {rating} Star{rating !== 1 ? 's' : ''} ⭐
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-right font-semibold">{count}</td>
                      <td className="border border-gray-300 px-4 py-2 text-right">
                        {reviews.length > 0 ? ((count / reviews.length) * 100).toFixed(1) : 0}%
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-gray-100 font-bold">
                  <td className="border border-gray-300 px-4 py-2">Total Reviews</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">{reviews.length}</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">100%</td>
                </tr>
                <tr className="bg-yellow-50 font-bold">
                  <td className="border border-gray-300 px-4 py-2">Average Rating</td>
                  <td className="border border-gray-300 px-4 py-2 text-right" colSpan="2">
                    {reviews.length > 0
                      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(2)
                      : "N/A"} ⭐
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Top Reviewed Sites Table */}
          <div className="bg-white p-6 rounded-lg border border-gray-300">
            <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
              Top 10 Most Reviewed Sites
            </h3>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-left">Rank</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Site Name</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">Reviews</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">Avg Rating</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(reviewsBySite)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 10)
                  .map(([siteName, count], index) => {
                    const siteReviews = reviews.filter(r => r.siteId?.siteName === siteName);
                    const avgRating = siteReviews.length > 0
                      ? (siteReviews.reduce((sum, r) => sum + r.rating, 0) / siteReviews.length).toFixed(1)
                      : "N/A";
                    return (
                      <tr key={siteName}>
                        <td className="border border-gray-300 px-4 py-2 text-center font-semibold">
                          {index + 1}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">{siteName}</td>
                        <td className="border border-gray-300 px-4 py-2 text-right font-semibold">{count}</td>
                        <td className="border border-gray-300 px-4 py-2 text-right">{avgRating} ⭐</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="text-center text-gray-500 text-sm mt-12 pt-6 border-t-2 border-gray-400">
            <p className="font-semibold">© 2025 Intramuros Administration</p>
            <p className="text-xs mt-2">This report is confidential and intended for administrative use only.</p>
            <p className="text-xs mt-1">For inquiries, contact: admin@intramuros.gov.ph</p>
          </div>
        </div>
      </div>
    </section>
  );
}
