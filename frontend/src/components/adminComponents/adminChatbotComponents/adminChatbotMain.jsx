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
  const API_BASE = "/api/admin/bot";
  const TAG_API_BASE = "/api/admin/tags";

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
    <section className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-3xl font-bold mb-8 text-gray-800">Admin Panel</h2>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left: Knowledge Base Entries */}
        <div className="flex-1 space-y-6">
          <h3 className="text-xl font-semibold text-gray-700">
            Chatbot Knowledge Base
          </h3>

          {/* Tag Filter */}
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <h4 className="font-medium mb-2 text-gray-600">Filter by Tags</h4>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <label
                  key={tag._id}
                  className="flex items-center gap-1 text-sm text-gray-700"
                >
                  <input
                    type="checkbox"
                    checked={filterTags.includes(tag._id)}
                    onChange={() => handleFilterCheckbox(tag._id)}
                  />
                  {tag.name}
                </label>
              ))}
            </div>
          </div>

          {/* Entries List */}
          {filteredEntries.map((entry) => (
            <div
              key={entry._id}
              className="bg-white p-5 rounded-xl shadow-sm border border-gray-100"
            >
              <p className="font-semibold text-gray-800">Information (EN):</p>
              <p className="text-gray-700 whitespace-pre-wrap">
                {entry.info_en}
              </p>

              {entry.info_fil && (
                <>
                  <p className="mt-3 font-semibold text-gray-800">
                    Information (FIL):
                  </p>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {entry.info_fil}
                  </p>
                </>
              )}

              <div className="mt-3">
                <span className="font-semibold text-gray-800">Keywords:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {entry.keywords.map((kw, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-3">
                <span className="font-semibold text-gray-800">Tags:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {entry.tags && entry.tags.length > 0 ? (
                    entry.tags.map((t) => (
                      <span
                        key={typeof t === "string" ? t : t._id}
                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs"
                      >
                        {t.name ? t.name : t}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500 text-sm">None</span>
                  )}
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => handleEdit(entry)}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(entry._id)}
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}

          {filteredEntries.length === 0 && (
            <p className="text-gray-500">No entries found.</p>
          )}
        </div>

        {/* Right: Entry Form + Tag Management */}
        <div
          className="w-full lg:w-96 space-y-8 lg:sticky lg:top-6 self-start 
                max-h-[calc(100vh-3rem)] overflow-y-auto pr-2"
        >
          {/* Entry Form */}
          <div className="bg-white p-5 rounded-xl shadow-sm ">
            <h3 className="text-lg font-semibold mb-4 text-gray-700 ">
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
