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
      second: "2-digit",
    });
  };

  return (
    <section>
      <h1 className="text-4xl font-bold text-[#f04e37] mb-6">
        Admin Action Logs
      </h1>

      {loading ? (
        <p className="text-gray-500">Loading logs...</p>
      ) : logs.length === 0 ? (
        <p className="text-gray-500 italic">No logs available.</p>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-auto max-h-[600px]">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-[#f04e37] text-white sticky top-0">
              <tr>
                <th className="px-6 py-3">#</th>
                <th className="px-6 py-3">Admin Name</th>
                <th className="px-6 py-3">Action</th>
                <th className="px-6 py-3">Date &amp; Time</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, idx) => (
                <tr
                  key={log._id}
                  className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}
                >
                  <td className="px-6 py-3">{idx + 1}</td>
                  <td className="px-6 py-3 font-medium text-gray-800">
                    {log.adminName}
                  </td>
                  <td className="px-6 py-3">{log.action}</td>
                  <td className="px-6 py-3 text-gray-500">
                    {formatDateTime(log.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
