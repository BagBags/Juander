import React, { useEffect, useState } from "react";
import axios from "axios";
import { Search } from "lucide-react";

export default function AdminLogMain() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 10;

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/admin/logs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLogs(res.data);
    } catch (err) {
      console.error("Error fetching logs:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getActionColor = (action) => {
    switch (action.toLowerCase()) {
      case "login":
        return "text-blue-600 font-medium";
      case "update":
        return "text-green-600 font-medium";
      case "delete":
        return "text-red-600 font-medium";
      default:
        return "text-gray-700";
    }
  };

  // Filter logs based on search
  const filteredLogs = logs.filter(
    (log) =>
      log.adminName.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase())
  );

  // Pagination
  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog);
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);

  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <h2 className="text-2xl font-bold mb-1">Activities</h2>
      <p className="font-medium text-gray-500 mb-4">
        Track user and system activities
      </p>

      {/* Search Bar styled like adminRoleMain */}
      <div className="relative mb-4 w-full sm:w-1/3">
        <Search className="absolute left-3 top-3 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search by admin or action..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-[#f04e37] focus:outline-none"
        />
      </div>

      {loading ? (
        <p className="text-gray-500">Loading logs...</p>
      ) : filteredLogs.length === 0 ? (
        <p className="text-gray-500 italic">No logs found.</p>
      ) : (
        <>
          <div className="overflow-auto max-h-[60vh] rounded-xl border border-gray-200">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="px-6 py-3">ID</th>
                  <th className="px-6 py-3">Admin</th>
                  <th className="px-6 py-3">Action</th>
                  <th className="px-6 py-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentLogs.map((log, idx) => (
                  <tr key={log._id} className="bg-white hover:bg-gray-50">
                    <td className="px-6 py-3">{indexOfFirstLog + idx + 1}</td>
                    <td className="px-6 py-3 font-medium text-gray-800">
                      {log.adminName}
                    </td>
                    <td className={`px-6 py-3 ${getActionColor(log.action)}`}>
                      {log.action}
                    </td>
                    <td className="px-6 py-3 text-gray-500">
                      {formatDateTime(log.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex justify-between items-center mt-4">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
