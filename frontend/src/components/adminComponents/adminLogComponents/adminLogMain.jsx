import React, { useEffect, useState } from "react";
import axios from "axios";
import { Search, Eye, X, Download, FileSpreadsheet } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function AdminLogMain() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filterType, setFilterType] = useState("all");
  const [sortOrder, setSortOrder] = useState("latest");
  const [selectedLog, setSelectedLog] = useState(null);
  const logsPerPage = 10;

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${
          import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
        }/logs`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit: 200 },
        }
      );
      setLogs(res.data);
    } catch (err) {
      console.error("Error fetching logs:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF();

      // Add title
      doc.setFontSize(18);
      doc.setFont(undefined, "bold");
      doc.text("Intramuros Administration", 105, 15, { align: "center" });
      doc.setFontSize(14);
      doc.setTextColor(240, 78, 55);
      doc.text("Activity Logs Report", 105, 23, { align: "center" });

      // Add summary info
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, "normal");
      const summaryY = 32;
      doc.text(`Total Logs: ${filteredLogs.length}`, 14, summaryY);
      doc.text(`Filter Type: ${filterType}`, 70, summaryY);
      doc.text(
        `Sort Order: ${
          sortOrder === "latest" ? "Latest First" : "Oldest First"
        }`,
        120,
        summaryY
      );
      doc.text(
        `Generated: ${new Date().toLocaleDateString()}`,
        14,
        summaryY + 6
      );

      // Prepare table data
      const tableData = filteredLogs.map((log, idx) => [
        `#${sortOrder === "latest" ? filteredLogs.length - idx : idx + 1}`,
        log.targetType,
        `${log.adminName}\n(${log.role === "admin" ? "Admin" : "User"})`,
        log.action,
        formatDateTime(log.createdAt),
      ]);

      // Add table using autoTable
      autoTable(doc, {
        startY: summaryY + 12,
        head: [["ID", "Type", "User/Admin", "Action", "Timestamp"]],
        body: tableData,
        theme: "grid",
        styles: {
          fontSize: 8,
          cellPadding: 2,
          overflow: "linebreak",
        },
        headStyles: {
          fillColor: [240, 78, 55],
          textColor: 255,
          fontStyle: "bold",
        },
        columnStyles: {
          0: { cellWidth: 15 },
          1: { cellWidth: 25 },
          2: { cellWidth: 45 },
          3: { cellWidth: 40 },
          4: { cellWidth: 40 },
        },
        didDrawPage: (data) => {
          // Footer
          const pageCount = doc.internal.getNumberOfPages();
          doc.setFontSize(8);
          doc.setTextColor(128);
          doc.text(
            `© ${new Date().getFullYear()} Intramuros Administration - Page ${
              data.pageNumber
            } of ${pageCount}`,
            105,
            doc.internal.pageSize.height - 10,
            { align: "center" }
          );
        },
      });

      // Save the PDF
      doc.save(`activity-logs-${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (error) {
      console.error("PDF generation error:", error);
      alert("Failed to generate PDF. Please try refreshing the page.");
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "—";
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getActionColor = (action) => {
    const a = (action || "").toLowerCase();
    if (a.includes("delete")) {
      return "text-red-600 font-medium";
    } else if (a.includes("update")) {
      return "text-yellow-600 font-medium";
    } else if (a.includes("add")) {
      return "text-green-600 font-medium";
    } else if (a.includes("archive")) {
      return "text-blue-600 font-medium";
    } else if (a.includes("restore")) {
      return "text-indigo-600 font-medium";
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

  const formatValue = (v) => {
    if (v === null || v === undefined || v === "") return "—";
    if (typeof v === "string") return `"${v}"`;
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  };

  // Filter and sort logs based on search, type, and sort order
  const filteredLogs = logs
    .filter((log) => {
      const matchesSearch =
        log.adminName.toLowerCase().includes(search.toLowerCase()) ||
        log.action.toLowerCase().includes(search.toLowerCase()) ||
        (log.details?.reviewText || "")
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        (log.details?.siteName || "")
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesType = filterType === "all" || log.targetType === filterType;

      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return sortOrder === "latest" ? dateB - dateA : dateA - dateB;
    });

  // Pagination
  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog);
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);

  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 print:hidden">
        <div>
          <h2 className="text-2xl font-bold mb-1">Activity Logs</h2>
          <p className="font-medium text-gray-500">
            Track user and system activities
          </p>
        </div>
        <button
          onClick={handleDownloadPDF}
          className="px-4 py-2 bg-[#f04e37] text-white rounded-lg hover:bg-[#e03d2d] transition-colors font-medium flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Download PDF
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4 print:hidden">
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
          value={sortOrder}
          onChange={(e) => {
            setSortOrder(e.target.value);
            setCurrentPage(1);
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-[#f04e37] focus:outline-none"
        >
          <option value="latest">Latest First</option>
          <option value="oldest">Oldest First</option>
        </select>
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
          <option value="other">Other</option>
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
                  <th className="px-6 py-3">Timestamp</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentLogs.map((log, idx) => (
                  <tr key={log._id} className="bg-white hover:bg-gray-50">
                    <td className="px-6 py-3">
                      #
                      {sortOrder === "latest"
                        ? filteredLogs.length - (indexOfFirstLog + idx)
                        : indexOfFirstLog + idx + 1}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getTargetTypeBadge(
                          log.targetType
                        )}`}
                      >
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
                <span
                  className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getTargetTypeBadge(
                    selectedLog.targetType
                  )}`}
                >
                  {selectedLog.targetType}
                </span>
              </div>
              <div>
                <span className="font-semibold">User/Admin:</span>{" "}
                {selectedLog.adminName}
                <span className="ml-2 text-sm text-gray-500">
                  ({selectedLog.role})
                </span>
              </div>
              <div>
                <span className="font-semibold">Action:</span>
                <span className={`ml-2 ${getActionColor(selectedLog.action)}`}>
                  {selectedLog.action}
                </span>
              </div>
              <div>
                <span className="font-semibold">Timestamp:</span>{" "}
                {formatDateTime(selectedLog.createdAt)}
              </div>

              {selectedLog.details && (
                <div className="border-t pt-4 mt-4">
                  <h4 className="font-semibold mb-3">Details:</h4>
                  {selectedLog.details.userName && (
                    <div className="mb-2">
                      <span className="font-medium">User:</span>{" "}
                      {selectedLog.details.userName}
                      {selectedLog.details.userEmail && (
                        <span className="text-sm text-gray-500 ml-2">
                          ({selectedLog.details.userEmail})
                        </span>
                      )}
                    </div>
                  )}
                  {selectedLog.details.siteName && (
                    <div className="mb-2">
                      <span className="font-medium">Site:</span>{" "}
                      {selectedLog.details.siteName}
                    </div>
                  )}
                  {selectedLog.details.itineraryName && (
                    <div className="mb-2">
                      <span className="font-medium">Itinerary:</span>{" "}
                      {selectedLog.details.itineraryName}
                    </div>
                  )}
                  {selectedLog.details.rating && (
                    <div className="mb-2">
                      <span className="font-medium">Rating:</span>{" "}
                      {selectedLog.details.rating} ⭐
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
                  {selectedLog.details.changes &&
                    Object.keys(selectedLog.details.changes).length > 0 && (
                      <div className="mb-2">
                        <span className="font-medium">Changed Fields:</span>
                        <div className="mt-2 space-y-2 text-sm">
                          {Object.entries(selectedLog.details.changes).map(
                            ([key, change]) => (
                              <div key={key} className="flex items-start gap-2">
                                <span className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
                                  {key}
                                </span>
                                <span className="text-gray-700">
                                  <span className="inline-block px-2 py-1 rounded bg-red-100 text-red-700">
                                    {formatValue(change?.from)}
                                  </span>
                                  <span className="mx-1">→</span>
                                  <span className="inline-block px-2 py-1 rounded bg-green-100 text-green-700">
                                    {formatValue(change?.to)}
                                  </span>
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  {selectedLog.details.photos &&
                    selectedLog.details.photos.length > 0 && (
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
                  {selectedLog.details.previousData &&
                    selectedLog.details.previousData.deletedAt && (
                      <div className="mt-3 p-3 bg-red-50 rounded-lg">
                        <span className="font-medium text-red-700">
                          Deletion Info:
                        </span>
                        <div className="text-sm text-gray-700 mt-1">
                          {selectedLog.details.previousData.deletedBy && (
                            <div>
                              Deleted by:{" "}
                              {selectedLog.details.previousData.deletedBy}
                            </div>
                          )}
                          <div>
                            Deleted at:{" "}
                            {formatDateTime(
                              selectedLog.details.previousData.deletedAt
                            )}
                          </div>
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
