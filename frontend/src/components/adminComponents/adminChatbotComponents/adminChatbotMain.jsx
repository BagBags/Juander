import React, { useEffect, useState } from "react";
import axios from "axios";

export default function AdminChatbot() {
  // --- States ---
  const [entries, setEntries] = useState([]);
  const [tags, setTags] = useState([]);
  const [filterTags, setFilterTags] = useState([]);
  const [form, setForm] = useState({
    info_en: "",
    info_fil: "",
    keywords: "",
    tags: [],
  });
  const [tagName, setTagName] = useState("");
  const [editId, setEditId] = useState(null);
  const [editTagId, setEditTagId] = useState(null);

  // --- API ---
  const API_BASE = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/admin/bot`;
  const TAG_API_BASE = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/admin/tags`;

  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // --- Init Fetch ---
  useEffect(() => {
    fetchEntries();
    fetchTags();
  }, []);

  const fetchEntries = async () => {
    try {
      const res = await axios.get(API_BASE, { headers: getAuthHeader() });
      setEntries(res.data);
    } catch {
      alert("Error fetching entries.");
    }
  };

  const fetchTags = async () => {
    try {
      const res = await axios.get(TAG_API_BASE, { headers: getAuthHeader() });
      setTags(res.data);
    } catch {
      alert("Error fetching tags.");
    }
  };

  // --- Form Handlers ---
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleTagCheckbox = (id) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(id)
        ? prev.tags.filter((t) => t !== id)
        : [...prev.tags, id],
    }));
  };

  const handleFilterCheckbox = (id) => {
    setFilterTags((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      info_en: form.info_en.trim(),
      info_fil: form.info_fil.trim(),
      keywords: form.keywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean),
      tags: form.tags,
    };

    if (!payload.info_en) return alert("English information is required");

    try {
      if (editId) {
        await axios.put(`${API_BASE}/${editId}`, payload, {
          headers: getAuthHeader(),
        });
        setEditId(null);
      } else {
        await axios.post(API_BASE, payload, { headers: getAuthHeader() });
      }
      setForm({ info_en: "", info_fil: "", keywords: "", tags: [] });
      fetchEntries();
    } catch {
      alert("Error saving entry.");
    }
  };

  const handleEdit = (entry) => {
    setEditId(entry._id);
    setForm({
      info_en: entry.info_en || "",
      info_fil: entry.info_fil || "",
      keywords: entry.keywords.join(", "),
      tags: entry.tags
        ? entry.tags.map((t) => (typeof t === "string" ? t : t._id))
        : [],
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this entry?")) return;
    try {
      await axios.delete(`${API_BASE}/${id}`, { headers: getAuthHeader() });
      fetchEntries();
    } catch {
      alert("Error deleting entry.");
    }
  };

  // --- Tag CRUD ---
  const handleTagSubmit = async (e) => {
    e.preventDefault();
    if (!tagName.trim()) return alert("Tag name required");

    try {
      if (editTagId) {
        await axios.put(
          `${TAG_API_BASE}/${editTagId}`,
          { name: tagName.trim() },
          { headers: getAuthHeader() }
        );
        setEditTagId(null);
      } else {
        await axios.post(
          TAG_API_BASE,
          { name: tagName.trim() },
          { headers: getAuthHeader() }
        );
      }
      setTagName("");
      fetchTags();
    } catch {
      alert("Error saving tag.");
    }
  };

  const handleTagEdit = (tag) => {
    setEditTagId(tag._id);
    setTagName(tag.name);
  };

  const handleTagDelete = async (id) => {
    if (!window.confirm("Delete this tag?")) return;
    try {
      await axios.delete(`${TAG_API_BASE}/${id}`, { headers: getAuthHeader() });
      fetchTags();
    } catch {
      alert("Error deleting tag.");
    }
  };

  // --- Filtered Entries ---
  const filteredEntries =
    filterTags.length === 0
      ? entries
      : entries.filter((entry) =>
          entry.tags?.some((t) =>
            filterTags.includes(typeof t === "string" ? t : t._id)
          )
        );

  // --- Render ---
  return (
    <section className="bg-gray-50 min-h-screen">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Knowledge Base Entries */}
        <div className="flex-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">
              Knowledge Base
            </h3>

          {/* Tag Filter */}
          <div className="bg-gray-50 p-4 rounded-xl border-2 border-gray-200 mb-6">
            <h4 className="font-semibold mb-3 text-gray-700">Filter by Tags</h4>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag._id}
                  onClick={() => handleFilterCheckbox(tag._id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    filterTags.includes(tag._id)
                      ? "bg-red-500 text-white shadow-md"
                      : "bg-white text-gray-700 border-2 border-gray-300 hover:border-red-300"
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>

          {/* Entries List */}
          {filteredEntries.map((entry) => (
            <div
              key={entry._id}
              className="bg-white p-5 rounded-xl shadow-sm border-2 border-gray-200 hover:border-red-300 transition-all"
            >
              <div className="flex justify-between items-start gap-4 mb-3">
                <div className="flex-1">
                  <p className="text-gray-800 font-medium line-clamp-2">
                    {entry.info_en}
                  </p>
                  {entry.info_fil && (
                    <p className="text-gray-600 text-sm mt-1 line-clamp-1 italic">
                      {entry.info_fil}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleEdit(entry)}
                    className="px-3 py-1.5 bg-yellow-400 hover:bg-yellow-500 text-white rounded-lg text-sm font-medium transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(entry._id)}
                    className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                <span className="text-xs font-semibold text-gray-500 mr-1">Keywords:</span>
                {entry.keywords.slice(0, 5).map((kw, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs"
                  >
                    {kw}
                  </span>
                ))}
                {entry.keywords.length > 5 && (
                  <span className="text-xs text-gray-500">+{entry.keywords.length - 5} more</span>
                )}
              </div>

              {entry.tags && entry.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {entry.tags.map((t) => (
                    <span
                      key={typeof t === "string" ? t : t._id}
                      className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium"
                    >
                      {t.name ? t.name : t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}

          {filteredEntries.length === 0 && (
            <p className="text-gray-500">No entries found.</p>
          )}
          </div>
        </div>

        {/* Right: Entry Form + Tag Management */}
        <div
          className="w-full lg:w-96 space-y-6 lg:sticky lg:top-6 self-start 
                max-h-[calc(100vh-3rem)] overflow-y-auto pr-2"
        >
          {/* Entry Form */}
          <div className="bg-white p-6 rounded-2xl shadow-lg">
            <h3 className="text-2xl font-bold mb-6 text-gray-800">
              {editId ? "Edit Entry" : "Add Entry"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <textarea
                name="info_en"
                value={form.info_en}
                onChange={handleChange}
                placeholder="Information (English)*"
                rows={4}
                required
                className="w-full border-2 border-gray-300 rounded-lg 
               focus:border-gray-400 focus:ring-2 focus:ring-gray-200 
               outline-none transition text-gray-700 bg-white p-2 text-sm"
              />
              <textarea
                name="info_fil"
                value={form.info_fil}
                onChange={handleChange}
                placeholder="Information (Filipino)"
                rows={4}
                className="w-full border-2 border-gray-300 rounded-lg 
               focus:border-gray-400 focus:ring-2 focus:ring-gray-200 
               outline-none transition text-gray-700 bg-white p-2 text-sm"
              />
              <input
                name="keywords"
                value={form.keywords}
                onChange={handleChange}
                placeholder="Keywords (comma separated)"
                className="w-full border-2 border-gray-300 rounded-lg 
               focus:border-gray-400 focus:ring-2 focus:ring-gray-200 
               outline-none transition text-gray-700 bg-white p-2 text-sm"
              />

              {/* Tags selection */}
              <div>
                <p className="font-medium text-gray-700 text-sm mb-2">Tags</p>
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto p-2 border border-gray-200 rounded-lg">
                  {tags.map((tag) => (
                    <label
                      key={tag._id}
                      className="flex items-center gap-1 text-sm text-gray-700"
                    >
                      <input
                        type="checkbox"
                        checked={form.tags.includes(tag._id)}
                        onChange={() => handleTagCheckbox(tag._id)}
                      />
                      {tag.name}
                    </label>
                  ))}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-[#f04e37] hover:bg-[#d03b27] text-white py-2 rounded-lg text-sm"
                >
                  {editId ? "Update" : "Add"}
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
                        tags: [],
                      });
                    }}
                    className="flex-1 py-2 rounded-lg text-sm font-medium 
             border border-gray-300 text-gray-600 bg-white 
             hover:bg-gray-100 hover:text-gray-700 
             transition shadow-sm"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Tag Management */}
          <div className="bg-white p-5 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">
              Manage Tags
            </h3>
            <form onSubmit={handleTagSubmit} className="flex gap-2 mb-4">
              <input
                value={tagName}
                onChange={(e) => setTagName(e.target.value)}
                placeholder="Tag name"
                className=" p-2 border-2 border-gray-300 rounded-lg 
               focus:border-gray-400 focus:ring-2 focus:ring-gray-200 
               outline-none transition text-gray-700 bg-white flex-1 text-sm"
              />
              <button
                type="submit"
                className="bg-[#f04e37] hover:bg-[#d03b27] text-white px-4 rounded-lg text-sm"
              >
                {editTagId ? "Update" : "Add"}
              </button>
              {editTagId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditTagId(null);
                    setTagName("");
                  }}
                  className="px-3 border rounded-lg text-sm"
                >
                  Cancel
                </button>
              )}
            </form>

            {/* Scrollable tag list */}
            <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {tags.map((tag) => (
                <li
                  key={tag._id}
                  className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-lg"
                >
                  <span className="text-sm text-gray-700">{tag.name}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleTagEdit(tag)}
                      className="text-blue-600 text-sm hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleTagDelete(tag._id)}
                      className="text-red-600 text-sm hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
