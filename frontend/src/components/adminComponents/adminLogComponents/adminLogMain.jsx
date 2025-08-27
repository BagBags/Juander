import React, { useEffect, useState } from "react";
import axios from "axios";

export default function AdminLogMain() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/admin/logs", {
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

  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <p className=" font-medium text-gray-500 mb-4">
        Track user and system activites
      </p>
      {loading ? (
        <p className="text-gray-500">Loading logs...</p>
      ) : logs.length === 0 ? (
        <p className="text-gray-500 italic">No logs available.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200">
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
              {logs.map((log, idx) => (
                <tr key={log._id} className="bg-white hover:bg-gray-50">
                  <td className="px-6 py-3">{idx + 1}</td>
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
      )}
    </div>
  );
}
