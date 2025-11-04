import React, { useEffect, useState } from "react";
import axios from "axios";
import { Printer } from "lucide-react";
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

export default function AdminReportsMain() {
  const [users, setUsers] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("charts"); // "charts" or "tables"

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      const [usersRes, reviewsRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/reviews/admin/all`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      
      setUsers(usersRes.data);
      setReviews(reviewsRes.data);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Calculate statistics
  const countryCount = users.reduce((acc, user) => {
    const country = user.country || "Not Specified";
    acc[country] = (acc[country] || 0) + 1;
    return acc;
  }, {});

  const genderCount = users.reduce((acc, user) => {
    const gender = user.gender || "Not Specified";
    acc[gender] = (acc[gender] || 0) + 1;
    return acc;
  }, {});

  const languageCount = users.reduce((acc, user) => {
    const lang = user.language || "Not Specified";
    const langName = lang === "en" ? "English" : lang === "tl" || lang === "fil" ? "Filipino" : lang;
    acc[langName] = (acc[langName] || 0) + 1;
    return acc;
  }, {});

  const ratingCount = reviews.reduce((acc, review) => {
    const rating = review.rating || 0;
    acc[rating] = (acc[rating] || 0) + 1;
    return acc;
  }, {});

  const reviewsBySite = reviews.reduce((acc, review) => {
    const siteName = review.siteId?.siteName || "Unknown Site";
    acc[siteName] = (acc[siteName] || 0) + 1;
    return acc;
  }, {});

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(2)
    : "N/A";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#f04e37]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="bg-white rounded-xl shadow-md p-6 print:shadow-none">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Analytics & Reports</h2>
            <p className="text-gray-600">Comprehensive system analytics and data insights</p>
          </div>
          <div className="flex gap-3 print:hidden">
            <button
              onClick={() => setViewMode(viewMode === "charts" ? "tables" : "charts")}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              {viewMode === "charts" ? "View Tables" : "View Charts"}
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-[#f04e37] text-white rounded-lg hover:bg-[#e03d2d] transition-colors font-medium flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Print Report
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
            <p className="text-indigo-600 text-sm font-medium">Total Users</p>
            <p className="text-2xl font-bold text-indigo-900">{users.length}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-blue-600 text-sm font-medium">Administrators</p>
            <p className="text-2xl font-bold text-blue-900">
              {users.filter(u => u.role === "admin" || u.email === "aaronbagain@gmail.com").length}
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <p className="text-green-600 text-sm font-medium">Total Reviews</p>
            <p className="text-2xl font-bold text-green-900">{reviews.length}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <p className="text-yellow-600 text-sm font-medium">Average Rating</p>
            <p className="text-2xl font-bold text-yellow-900">{avgRating}</p>
          </div>
        </div>
      </div>

      {/* Charts View */}
      {viewMode === "charts" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Users by Country - Horizontal Bar Chart */}
          <div className="bg-white rounded-xl shadow-md p-6" style={{ height: Object.keys(countryCount).length > 10 ? '600px' : '400px' }}>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Users by Country</h3>
            <div className="h-[calc(100%-3rem)]">
              <Bar 
                data={{
                  labels: Object.keys(countryCount).sort((a, b) => countryCount[b] - countryCount[a]),
                  datasets: [{
                    label: "Users by Country",
                    data: Object.keys(countryCount).sort((a, b) => countryCount[b] - countryCount[a]).map(k => countryCount[k]),
                    backgroundColor: "#f04e37",
                  }]
                }} 
                options={{
                  indexAxis: 'y',
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      callbacks: {
                        label: (context) => {
                          const percentage = ((context.parsed.x / users.length) * 100).toFixed(1);
                          return `${context.parsed.x} users (${percentage}%)`;
                        }
                      }
                    }
                  },
                  scales: {
                    x: {
                      beginAtZero: true,
                      ticks: { stepSize: 1, precision: 0 },
                      title: { display: true, text: 'Number of Users' }
                    },
                    y: { ticks: { autoSkip: false } }
                  },
                }} 
              />
            </div>
          </div>

          {/* Users by Gender - Pie Chart */}
          <div className="bg-white rounded-xl shadow-md p-6 h-[400px]">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Users by Gender</h3>
            <div className="h-[calc(100%-3rem)]">
              <Pie 
                data={{
                  labels: Object.keys(genderCount),
                  datasets: [{
                    data: Object.values(genderCount),
                    backgroundColor: ["#3b82f6", "#ec4899", "#8b5cf6", "#6b7280", "#f59e0b"],
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: "top" },
                  },
                }}
              />
            </div>
          </div>

          {/* Users by Language - Pie Chart */}
          <div className="bg-white rounded-xl shadow-md p-6 h-[400px]">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Users by Language</h3>
            <div className="h-[calc(100%-3rem)]">
              <Pie 
                data={{
                  labels: Object.keys(languageCount),
                  datasets: [{
                    data: Object.values(languageCount),
                    backgroundColor: ["#6366f1", "#10b981", "#f59e0b", "#ef4444"],
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: "top" },
                  },
                }}
              />
            </div>
          </div>

          {/* Reviews by Rating - Bar Chart */}
          <div className="bg-white rounded-xl shadow-md p-6 h-[400px]">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Reviews by Rating</h3>
            <div className="h-[calc(100%-3rem)]">
              <Bar 
                data={{
                  labels: ["1 Star", "2 Stars", "3 Stars", "4 Stars", "5 Stars"],
                  datasets: [{
                    label: "Reviews by Rating",
                    data: [
                      ratingCount[1] || 0,
                      ratingCount[2] || 0,
                      ratingCount[3] || 0,
                      ratingCount[4] || 0,
                      ratingCount[5] || 0,
                    ],
                    backgroundColor: ["#ef4444", "#f59e0b", "#fbbf24", "#10b981", "#22c55e"],
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: { stepSize: 1, precision: 0 },
                    },
                  },
                }}
              />
            </div>
          </div>

          {/* Top Sites - Bar Chart */}
          <div className="bg-white rounded-xl shadow-md p-6 lg:col-span-2 h-[400px]">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Top 10 Most Reviewed Sites</h3>
            <div className="h-[calc(100%-3rem)]">
              <Bar 
                data={{
                  labels: Object.entries(reviewsBySite)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 10)
                    .map(([site]) => site),
                  datasets: [{
                    label: "Reviews per Site",
                    data: Object.entries(reviewsBySite)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 10)
                      .map(([, count]) => count),
                    backgroundColor: "#3b82f6",
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: { stepSize: 1, precision: 0 },
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Data Tables */}
      {viewMode === "tables" && (
      <div className="space-y-6">
        {/* Users by Country */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Users by Country</h3>
          <div className="overflow-auto max-h-[600px] border border-gray-200 rounded-lg">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Country</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Count</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(countryCount)
                  .sort((a, b) => b[1] - a[1])
                  .map(([country, count]) => (
                    <tr key={country} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-900">{country}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">{count}</td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {((count / users.length) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                <tr className="bg-gray-50 font-bold">
                  <td className="px-4 py-3 text-gray-900">Total</td>
                  <td className="px-4 py-3 text-right text-gray-900">{users.length}</td>
                  <td className="px-4 py-3 text-right text-gray-900">100%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Users by Gender */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Users by Gender</h3>
          <div className="overflow-auto max-h-[600px] border border-gray-200 rounded-lg">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Gender</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Count</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(genderCount)
                  .sort((a, b) => b[1] - a[1])
                  .map(([gender, count]) => (
                    <tr key={gender} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-900">{gender}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">{count}</td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {((count / users.length) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                <tr className="bg-gray-50 font-bold">
                  <td className="px-4 py-3 text-gray-900">Total</td>
                  <td className="px-4 py-3 text-right text-gray-900">{users.length}</td>
                  <td className="px-4 py-3 text-right text-gray-900">100%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Users by Language */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Users by Language Preference</h3>
          <div className="overflow-auto max-h-[600px] border border-gray-200 rounded-lg">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Language</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Count</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(languageCount)
                  .sort((a, b) => b[1] - a[1])
                  .map(([language, count]) => (
                    <tr key={language} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-900">{language}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">{count}</td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {((count / users.length) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                <tr className="bg-gray-50 font-bold">
                  <td className="px-4 py-3 text-gray-900">Total</td>
                  <td className="px-4 py-3 text-right text-gray-900">{users.length}</td>
                  <td className="px-4 py-3 text-right text-gray-900">100%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Reviews by Rating */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Reviews by Rating</h3>
          <div className="overflow-auto max-h-[600px] border border-gray-200 rounded-lg">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Rating</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Count</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = ratingCount[rating] || 0;
                  return (
                    <tr key={rating} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-900">{rating} Star{rating !== 1 ? 's' : ''}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">{count}</td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {reviews.length > 0 ? ((count / reviews.length) * 100).toFixed(1) : 0}%
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-gray-50 font-bold">
                  <td className="px-4 py-3 text-gray-900">Total Reviews</td>
                  <td className="px-4 py-3 text-right text-gray-900">{reviews.length}</td>
                  <td className="px-4 py-3 text-right text-gray-900">100%</td>
                </tr>
                <tr className="bg-yellow-50 font-bold">
                  <td className="px-4 py-3 text-gray-900">Average Rating</td>
                  <td className="px-4 py-3 text-right text-gray-900" colSpan="2">{avgRating}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Reviewed Sites */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Top 10 Most Reviewed Sites</h3>
          <div className="overflow-auto max-h-[600px] border border-gray-200 rounded-lg">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Rank</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Site Name</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Reviews</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Avg Rating</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(reviewsBySite)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 10)
                  .map(([siteName, count], index) => {
                    const siteReviews = reviews.filter(r => r.siteId?.siteName === siteName);
                    const siteAvgRating = siteReviews.length > 0
                      ? (siteReviews.reduce((sum, r) => sum + r.rating, 0) / siteReviews.length).toFixed(1)
                      : "N/A";
                    return (
                      <tr key={siteName} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 text-center font-semibold text-gray-900">{index + 1}</td>
                        <td className="px-4 py-3 text-gray-900">{siteName}</td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900">{count}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{siteAvgRating}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      )}

      {/* Print Footer */}
      <div className="hidden print:block text-center text-gray-500 text-sm mt-12 pt-6 border-t-2 border-gray-400">
        <p className="font-semibold">© 2025 Intramuros Administration</p>
        <p className="text-xs mt-2">This report is confidential and intended for administrative use only.</p>
        <p className="text-xs mt-1">Generated on {new Date().toLocaleString()}</p>
      </div>
    </div>
  );
}
