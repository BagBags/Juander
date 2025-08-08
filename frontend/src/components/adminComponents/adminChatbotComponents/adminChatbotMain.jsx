import React, { useEffect, useState } from "react";
import axios from "axios";

export default function AdminChatbot() {
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState({
    info_en: "",
    info_fil: "",
    keywords: "",
  });
  const [editId, setEditId] = useState(null);
  const API_BASE = "/api/admin/bot";

  // Helper to get auth header
  const getAuthHeader = () => {
    const token = localStorage.getItem("token"); // Adjust if your token key is different
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      const res = await axios.get(API_BASE, {
        headers: getAuthHeader(),
      });
      setEntries(res.data);
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "Error fetching entries. Are you logged in as admin?"
      );
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      info_en: form.info_en.trim(),
      info_fil: form.info_fil.trim(),
      keywords: form.keywords
        .split(",")
        .map((k) => k.trim())
        .filter((k) => k),
    };

    if (!payload.info_en) {
      alert("English information is required");
      return;
    }

    try {
      if (editId) {
        await axios.put(`${API_BASE}/${editId}`, payload, {
          headers: getAuthHeader(),
        });
        setEditId(null);
      } else {
        await axios.post(API_BASE, payload, {
          headers: getAuthHeader(),
        });
      }
      setForm({
        info_en: "",
        info_fil: "",
        keywords: "",
      });
      fetchEntries();
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "Error saving entry. Are you logged in as admin?"
      );
    }
  };

  const handleEdit = (entry) => {
    setEditId(entry._id);
    setForm({
      info_en: entry.info_en || "",
      info_fil: entry.info_fil || "",
      keywords: entry.keywords.join(", "),
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this entry?")) return;

    try {
      await axios.delete(`${API_BASE}/${id}`, {
        headers: getAuthHeader(),
      });
      fetchEntries();
    } catch (err) {
      console.error("Error deleting entry:", err);
      if (err.response) {
        console.error("Response status:", err.response.status);
        console.error("Response data:", err.response.data);
        alert(
          err.response.data.message ||
            "Error deleting entry. Are you logged in as admin?"
        );
      } else {
        alert("Network or server error deleting entry.");
      }
    }
  };

  return (
    <section>
      <h2 className="text-4xl font-bold mb-4 text-[#f04e37]">
        Manage Chatbot Knowledge Base
      </h2>
      <div className="p-4 max-w-3xl mx-auto">
        <form
          onSubmit={handleSubmit}
          className="mb-6 space-y-4 bg-white p-4 rounded shadow"
        >
          <div>
            <label>Information (English) *</label>
            <textarea
              name="info_en"
              value={form.info_en}
              onChange={handleChange}
              required
              rows={6}
              className="w-full border p-2 rounded"
            />
          </div>
          <div>
            <label>Information (Filipino)</label>
            <textarea
              name="info_fil"
              value={form.info_fil}
              onChange={handleChange}
              rows={6}
              className="w-full border p-2 rounded"
            />
          </div>
          <div>
            <label>Keywords (comma separated)</label>
            <input
              name="keywords"
              value={form.keywords}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
          </div>
          <button
            type="submit"
            className="bg-[#f04e37] text-white px-4 py-2 rounded hover:bg-[#d03b27]"
          >
            {editId ? "Update Entry" : "Add Entry"}
          </button>
          {editId && (
            <button
              type="button"
              onClick={() => {
                setEditId(null);
                setForm({
                  info_en: "",
                  info_fil: "",
                  keywords: "",
                });
              }}
              className="ml-4 px-4 py-2 border rounded"
            >
              Cancel
            </button>
          )}
        </form>

        <div className="space-y-4">
          {entries.map((entry) => (
            <div key={entry._id} className="bg-white p-4 rounded shadow">
              <p>
                <strong>Information (EN):</strong>
              </p>
              <p className="whitespace-pre-wrap">{entry.info_en}</p>

              {entry.info_fil && (
                <>
                  <p className="mt-2">
                    <strong>Information (FIL):</strong>
                  </p>
                  <p className="whitespace-pre-wrap">{entry.info_fil}</p>
                </>
              )}
              <p className="mt-2">
                <strong>Keywords:</strong> {entry.keywords.join(", ")}
              </p>
              <div className="mt-2 space-x-2">
                <button
                  onClick={() => handleEdit(entry)}
                  className="bg-blue-600 text-white px-3 py-1 rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(entry._id)}
                  className="bg-red-600 text-white px-3 py-1 rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
