import React, { useEffect, useState } from "react";
import axios from "axios";
import { Search, Eye, X } from "lucide-react";

export default function AdminLogMain() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filterType, setFilterType] = useState("all");
  const [selectedLog, setSelectedLog] = useState(null);
  const logsPerPage = 10;

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/logs`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 200 }
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
    if (action.toLowerCase().includes("delete")) {
      return "text-red-600 font-medium";
    } else if (action.toLowerCase().includes("update")) {
      return "text-yellow-600 font-medium";
    } else if (action.toLowerCase().includes("create")) {
      return "text-green-600 font-medium";
    }
    return "text-gray-700";
  };

  const getTargetTypeBadge = (type) => {
    const colors = {
      review: "bg-purple-100 text-purple-700",
      photobooth: "bg-pink-100 text-pink-700",
      itinerary: "bg-blue-100 text-blue-700",
      pin: "bg-green-100 text-green-700",
      user: "bg-orange-100 text-orange-700",
      other: "bg-gray-100 text-gray-700",
    };
    return colors[type] || colors.other;
  };

  // Filter logs based on search and type
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.adminName.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      (log.details?.reviewText || "").toLowerCase().includes(search.toLowerCase()) ||
      (log.details?.siteName || "").toLowerCase().includes(search.toLowerCase());
    
    const matchesType = filterType === "all" || log.targetType === filterType;
    
    return matchesSearch && matchesType;
  });

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

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by admin, action, or content..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-[#f04e37] focus:outline-none"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => {
            setFilterType(e.target.value);
            setCurrentPage(1);
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-[#f04e37] focus:outline-none"
        >
          <option value="all">All Types</option>
          <option value="review">Reviews</option>
          <option value="photobooth">Photobooth</option>
          <option value="itinerary">Itineraries</option>
          <option value="pin">Pins</option>
          <option value="user">Users</option>
        </select>
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
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">User/Admin</th>
                  <th className="px-6 py-3">Action</th>
                  <th className="px-6 py-3">Details</th>
                  <th className="px-6 py-3">Timestamp</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentLogs.map((log, idx) => (
                  <tr key={log._id} className="bg-white hover:bg-gray-50">
                    <td className="px-6 py-3">{indexOfFirstLog + idx + 1}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTargetTypeBadge(log.targetType)}`}>
                        {log.targetType}
                      </span>
                    </td>
                    <td className="px-6 py-3 font-medium text-gray-800">
                      {log.adminName}
                      <div className="text-xs text-gray-500">
                        {log.role === "admin" ? "Admin" : "User"}
                      </div>
                    </td>
                    <td className={`px-6 py-3 ${getActionColor(log.action)}`}>
                      {log.action}
                    </td>
                    <td className="px-6 py-3 text-gray-600 max-w-xs truncate">
                      {log.details?.siteName && (
                        <div className="text-xs">
                          <span className="font-medium">Site:</span> {log.details.siteName}
                        </div>
                      )}
                      {log.details?.rating && (
                        <div className="text-xs">
                          <span className="font-medium">Rating:</span> {log.details.rating}⭐
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-3 text-gray-500">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="px-6 py-3">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="text-blue-600 hover:text-blue-800"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
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

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold">Log Details</h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <span className="font-semibold">Type:</span>
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getTargetTypeBadge(selectedLog.targetType)}`}>
                  {selectedLog.targetType}
                </span>
              </div>
              <div>
                <span className="font-semibold">User/Admin:</span> {selectedLog.adminName}
                <span className="ml-2 text-sm text-gray-500">({selectedLog.role})</span>
              </div>
              <div>
                <span className="font-semibold">Action:</span>
                <span className={`ml-2 ${getActionColor(selectedLog.action)}`}>
                  {selectedLog.action}
                </span>
              </div>
              <div>
                <span className="font-semibold">Timestamp:</span> {formatDateTime(selectedLog.createdAt)}
              </div>

              {selectedLog.details && (
                <div className="border-t pt-4 mt-4">
                  <h4 className="font-semibold mb-3">Details:</h4>
                  {selectedLog.details.userName && (
                    <div className="mb-2">
                      <span className="font-medium">User:</span> {selectedLog.details.userName}
                      {selectedLog.details.userEmail && (
                        <span className="text-sm text-gray-500 ml-2">({selectedLog.details.userEmail})</span>
                      )}
                    </div>
                  )}
                  {selectedLog.details.siteName && (
                    <div className="mb-2">
                      <span className="font-medium">Site:</span> {selectedLog.details.siteName}
                    </div>
                  )}
                  {selectedLog.details.itineraryName && (
                    <div className="mb-2">
                      <span className="font-medium">Itinerary:</span> {selectedLog.details.itineraryName}
                    </div>
                  )}
                  {selectedLog.details.rating && (
                    <div className="mb-2">
                      <span className="font-medium">Rating:</span> {selectedLog.details.rating} ⭐
                    </div>
                  )}
                  {selectedLog.details.reviewText && (
                    <div className="mb-2">
                      <span className="font-medium">Review Content:</span>
                      <div className="mt-1 p-3 bg-gray-50 rounded-lg text-sm">
                        {selectedLog.details.reviewText}
                      </div>
                    </div>
                  )}
                  {selectedLog.details.photos && selectedLog.details.photos.length > 0 && (
                    <div className="mb-2">
                      <span className="font-medium">Photos:</span>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {selectedLog.details.photos.map((photo, idx) => (
                          <img
                            key={idx}
                            src={photo}
                            alt={`Review photo ${idx + 1}`}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedLog.details.previousData && (
                    <div className="mt-3 p-3 bg-red-50 rounded-lg">
                      <span className="font-medium text-red-700">Deletion Info:</span>
                      <div className="text-sm text-gray-700 mt-1">
                        {selectedLog.details.previousData.deletedBy && (
                          <div>Deleted by: {selectedLog.details.previousData.deletedBy}</div>
                        )}
                        <div>Deleted at: {formatDateTime(selectedLog.details.previousData.deletedAt)}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
