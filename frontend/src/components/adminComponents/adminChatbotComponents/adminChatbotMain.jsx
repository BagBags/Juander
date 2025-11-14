import React, { useEffect, useState } from "react";
import axios from "axios";
import { Edit, Trash2, Plus, X, Check, Archive, RotateCcw } from "lucide-react";
import ConfirmModal from "../../shared/ConfirmModal";

export default function AdminChatbot() {
  // --- States ---
  const [entries, setEntries] = useState([]);
  const [archivedEntries, setArchivedEntries] = useState([]);
  const [activeTab, setActiveTab] = useState("active");
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
  
  // Validation errors
  const [errors, setErrors] = useState({
    info_en: "",
    tagName: "",
  });
  
  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: "warning",
    title: "",
    message: "",
    onConfirm: null,
    loading: false,
  });

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
    fetchArchivedEntries();
    fetchTags();
  }, []);

  const fetchEntries = async () => {
    try {
      const res = await axios.get(API_BASE, { headers: getAuthHeader() });
      setEntries(res.data);
    } catch (err) {
      console.error("Error fetching entries:", err);
    }
  };

  const fetchArchivedEntries = async () => {
    try {
      const res = await axios.get(`${API_BASE}/archived`, { headers: getAuthHeader() });
      setArchivedEntries(res.data);
    } catch (err) {
      console.error("Error fetching archived entries:", err);
    }
  };

  const fetchTags = async () => {
    try {
      const res = await axios.get(TAG_API_BASE, { headers: getAuthHeader() });
      setTags(res.data);
    } catch (err) {
      console.error("Error fetching tags:", err);
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

  const handleSubmit = (e) => {
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

    // Validation
    const newErrors = {};
    if (!payload.info_en) {
      newErrors.info_en = "English information is required";
    }
    
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setConfirmModal({
      isOpen: true,
      type: "success",
      title: editId ? "Update Entry?" : "Add New Entry?",
      message: editId 
        ? "Are you sure you want to update this chatbot entry?"
        : "Are you sure you want to add this chatbot entry?",
      confirmText: editId ? "Update" : "Add Entry",
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, loading: true }));
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
          setErrors({ info_en: "", tagName: "" }); // Clear errors
          setConfirmModal({ isOpen: false, type: "warning", title: "", message: "", onConfirm: null, loading: false });
        } catch (err) {
          console.error("Error saving entry:", err);
          setConfirmModal(prev => ({ ...prev, loading: false }));
        }
      },
    });
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

  const handleArchive = (id) => {
    setConfirmModal({
      isOpen: true,
      type: "warning",
      title: "Archive Chatbot Entry?",
      message: "This entry will be moved to the archived section. Users will no longer receive this information when they ask related questions.",
      confirmText: "Archive Entry",
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, loading: true }));
        try {
          await axios.put(`${API_BASE}/${id}/archive`, {}, { headers: getAuthHeader() });
          fetchEntries();
          fetchArchivedEntries();
          setConfirmModal({ isOpen: false, type: "warning", title: "", message: "", onConfirm: null, loading: false });
        } catch (err) {
          console.error("Error archiving entry:", err);
          setConfirmModal(prev => ({ ...prev, loading: false }));
        }
      },
    });
  };

  const handleRestore = (id) => {
    setConfirmModal({
      isOpen: true,
      type: "success",
      title: "Restore Chatbot Entry?",
      message: "This entry will be restored to the active knowledge base. Users will be able to receive this information again.",
      confirmText: "Restore Entry",
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, loading: true }));
        try {
          await axios.put(`${API_BASE}/${id}/restore`, {}, { headers: getAuthHeader() });
          fetchEntries();
          fetchArchivedEntries();
          setConfirmModal({ isOpen: false, type: "warning", title: "", message: "", onConfirm: null, loading: false });
        } catch (err) {
          console.error("Error restoring entry:", err);
          setConfirmModal(prev => ({ ...prev, loading: false }));
        }
      },
    });
  };

  const handlePermanentDelete = (id) => {
    setConfirmModal({
      isOpen: true,
      type: "danger",
      title: "Permanently Delete Entry?",
      message: "This chatbot entry will be permanently deleted and cannot be recovered. This action cannot be undone.",
      confirmText: "Delete Forever",
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, loading: true }));
        try {
          await axios.delete(`${API_BASE}/${id}`, { headers: getAuthHeader() });
          fetchArchivedEntries();
          setConfirmModal({ isOpen: false, type: "warning", title: "", message: "", onConfirm: null, loading: false });
        } catch (err) {
          console.error("Error deleting entry:", err);
          setConfirmModal(prev => ({ ...prev, loading: false }));
        }
      },
    });
  };

  // --- Tag CRUD ---
  const handleTagSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    const newErrors = {};
    if (!tagName.trim()) {
      newErrors.tagName = "Tag name is required";
    }
    
    setErrors({...errors, ...newErrors});
    if (Object.keys(newErrors).length > 0) return;

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
      setErrors({...errors, tagName: ""}); // Clear tag error
    } catch (err) {
      console.error("Error saving tag:", err);
    }
  };

  const handleTagEdit = (tag) => {
    setEditTagId(tag._id);
    setTagName(tag.name);
  };

  const handleTagDelete = (id) => {
    setConfirmModal({
      isOpen: true,
      type: "danger",
      title: "Delete Tag?",
      message: "This tag will be permanently deleted. All chatbot entries using this tag will need to be updated.",
      confirmText: "Delete Tag",
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, loading: true }));
        try {
          await axios.delete(`${TAG_API_BASE}/${id}`, { headers: getAuthHeader() });
          fetchTags();
          setConfirmModal({ isOpen: false, type: "warning", title: "", message: "", onConfirm: null, loading: false });
        } catch (err) {
          console.error("Error deleting tag:", err);
          setConfirmModal(prev => ({ ...prev, loading: false }));
        }
      },
    });
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
    <>
      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, type: "warning", title: "", message: "", onConfirm: null, loading: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        confirmText={confirmModal.confirmText}
        loading={confirmModal.loading}
      />
      
      <section className="bg-gray-50 min-h-screen">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Knowledge Base Entries */}
        <div className="flex-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">
              Knowledge Base Management
            </h3>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab("active")}
              className={`flex-1 py-2.5 px-4 rounded-lg font-semibold transition ${
                activeTab === "active"
                  ? "text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
              style={activeTab === "active" ? { backgroundColor: '#f04e37' } : {}}
            >
              Active Entries ({entries.length})
            </button>
            <button
              onClick={() => setActiveTab("archived")}
              className={`flex-1 py-2.5 px-4 rounded-lg font-semibold transition ${
                activeTab === "archived"
                  ? "text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
              style={activeTab === "archived" ? { backgroundColor: '#f04e37' } : {}}
            >
              Archived ({archivedEntries.length})
            </button>
          </div>

          {/* Tag Filter - Only show for active tab */}
          {activeTab === "active" && (
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-700 text-sm">Filter by Tags</h4>
              {filterTags.length > 0 && (
                <button
                  onClick={() => setFilterTags([])}
                  className="text-xs text-red-600 hover:text-red-700 font-medium"
                >
                  Clear all ({filterTags.length})
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
              {tags.map((tag) => (
                <button
                  key={tag._id}
                  onClick={() => handleFilterCheckbox(tag._id)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition flex-shrink-0 ${
                    filterTags.includes(tag._id)
                      ? "bg-red-500 text-white"
                      : "bg-white text-gray-700 border border-gray-300 hover:border-red-300"
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
          )}

          {/* Active Entries List */}
          {activeTab === "active" && filteredEntries.map((entry) => (
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
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-400 hover:bg-yellow-500 text-white rounded-lg text-sm font-medium transition shadow-sm hover:shadow-md"
                  >
                    <Edit size={14} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleArchive(entry._id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition shadow-sm hover:shadow-md"
                  >
                    <Archive size={14} />
                    Archive
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

          {activeTab === "active" && filteredEntries.length === 0 && (
            <p className="text-gray-500 text-center py-8">No active entries found.</p>
          )}

          {/* Archived Entries List */}
          {activeTab === "archived" && archivedEntries.map((entry) => (
            <div
              key={entry._id}
              className="bg-gray-50 p-5 rounded-xl shadow-sm border-2 border-gray-300 hover:border-gray-400 transition-all opacity-80"
            >
              <div className="flex justify-between items-start gap-4 mb-3">
                <div className="flex-1">
                  <p className="text-gray-600 font-medium line-clamp-2">
                    {entry.info_en}
                  </p>
                  {entry.info_fil && (
                    <p className="text-gray-500 text-sm mt-1 line-clamp-1 italic">
                      {entry.info_fil}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleRestore(entry._id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition shadow-sm hover:shadow-md"
                  >
                    <RotateCcw size={14} />
                    Restore
                  </button>
                  <button
                    onClick={() => handlePermanentDelete(entry._id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition shadow-sm hover:shadow-md"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                <span className="text-xs font-semibold text-gray-500 mr-1">Keywords:</span>
                {entry.keywords.slice(0, 5).map((kw, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded text-xs"
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
                      className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded text-xs font-medium"
                    >
                      {t.name ? t.name : t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}

          {activeTab === "archived" && archivedEntries.length === 0 && (
            <p className="text-gray-500 text-center py-8">No archived entries found.</p>
          )}
          </div>
        </div>

        {/* Right: Entry Form + Tag Management */}
        <div
          className="w-full lg:w-[600px] space-y-6 lg:sticky lg:top-6 self-start 
                max-h-[calc(100vh-3rem)] overflow-y-auto pr-2"
        >
          {/* Entry Form */}
          <div className="bg-white p-6 rounded-2xl shadow-lg">
            <h3 className="text-2xl font-bold mb-6 text-gray-800">
              {editId ? "Edit Entry" : "Add Entry"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* English Information */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Information (English) <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="info_en"
                  value={form.info_en}
                  onChange={(e) => {
                    handleChange(e);
                    if (errors.info_en && e.target.value.trim()) {
                      setErrors({...errors, info_en: ""});
                    }
                  }}
                  placeholder="Information (English)*"
                  rows={4}
                  className={`w-full border-2 rounded-lg focus:ring-2 outline-none transition text-gray-700 bg-white p-2 text-sm ${
                    errors.info_en ? "border-red-500 focus:border-red-500 focus:ring-red-200" : "border-gray-300 focus:border-gray-400 focus:ring-gray-200"
                  }`}
                />
                {errors.info_en && (
                  <p className="text-red-500 text-xs mt-1">{errors.info_en}</p>
                )}
              </div>
              
              {/* Filipino Information */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Information (Filipino)
                </label>
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
              </div>
              
              {/* Keywords */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Keywords
                </label>
                <input
                  name="keywords"
                  value={form.keywords}
                  onChange={handleChange}
                  placeholder="Keywords (comma separated)"
                  className="w-full border-2 border-gray-300 rounded-lg 
                 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 
                 outline-none transition text-gray-700 bg-white p-2 text-sm"
                />
              </div>

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
                  className="flex-1 flex items-center justify-center gap-1.5 bg-[#f04e37] hover:bg-[#d03b27] text-white py-2 rounded-lg text-sm font-medium shadow-sm hover:shadow-md transition"
                >
                  {editId ? <Check size={16} /> : <Plus size={16} />}
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
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-600 bg-white hover:bg-gray-100 hover:text-gray-700 transition shadow-sm"
                  >
                    <X size={16} />
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
                type="text"
                value={tagName}
                onChange={(e) => {
                  setTagName(e.target.value);
                  if (errors.tagName && e.target.value.trim()) {
                    setErrors({...errors, tagName: ""});
                  }
                }}
                placeholder="Tag name"
                className={`flex-1 border-2 rounded-lg focus:ring-2 outline-none transition text-gray-700 bg-white p-2 text-sm ${
                  errors.tagName ? "border-red-500 focus:border-red-500 focus:ring-red-200" : "border-gray-300 focus:border-gray-400 focus:ring-gray-200"
                }`}
              />
              {errors.tagName && (
                <p className="text-red-500 text-xs mt-1 absolute">{errors.tagName}</p>
              )}
              <button
                type="submit"
                className="flex items-center gap-1.5 bg-[#f04e37] hover:bg-[#d03b27] text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm hover:shadow-md transition"
              >
                 {editTagId ? <Check size={16} /> : <Plus size={16} />}
                {editTagId ? "Update" : "Add"}
              </button>
              {editTagId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditTagId(null);
                    setTagName("");
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-600 bg-white hover:bg-gray-100 hover:text-gray-700 transition shadow-sm"
                >
                  <X size={16} />
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
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleTagEdit(tag)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-400 hover:bg-yellow-500 text-white rounded-lg text-sm font-medium transition shadow-sm hover:shadow-md"
                    >
                      <Edit size={14} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleTagDelete(tag._id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition shadow-sm hover:shadow-md"
                    >
                      <Trash2 size={14} />
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
    </>
  );
}
