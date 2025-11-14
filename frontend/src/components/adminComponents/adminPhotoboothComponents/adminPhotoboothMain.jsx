import React, { useEffect, useState } from "react";
import axios from "axios";
import { Edit, Trash2, Plus, Check, X, ChevronUp, ChevronDown, Archive, RotateCcw } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import ConfirmModal from "../../shared/ConfirmModal";

export default function ManagePhotobooth() {
  const [filters, setFilters] = useState([]);
  const [archivedFilters, setArchivedFilters] = useState([]);
  const [sortedFilters, setSortedFilters] = useState([]);
  const [sortedArchivedFilters, setSortedArchivedFilters] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [archivedSortConfig, setArchivedSortConfig] = useState({ key: null, direction: "asc" });
  const [form, setForm] = useState({
    name: "",
    imageFile: null,
    imageUrl: "",
    preview: "",
    category: "general",
  });
  const [editingId, setEditingId] = useState(null);
  const [activeTab, setActiveTab] = useState("active"); // "active" or "archived"
  
  // Validation errors
  const [errors, setErrors] = useState({
    name: "",
    image: "",
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

  // Get token from localStorage
  const token = localStorage.getItem("token"); // <-- make sure your token is stored here

  // Axios config with auth header
  const axiosConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const axiosMultipartConfig = {
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: `Bearer ${token}`,
    },
  };

  // Fetch active filters
  const fetchFilters = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/photobooth/filters`, axiosConfig);
      const BACKEND_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || "http://localhost:5000";
      
      // Resolve image URLs
      const filtersWithUrls = res.data.map(f => ({
        ...f,
        image: f.image && !f.image.startsWith('http') 
          ? `${BACKEND_URL}${f.image.startsWith('/') ? '' : '/'}${f.image}`
          : f.image
      }));
      
      setFilters(filtersWithUrls);
      setSortedFilters(filtersWithUrls);
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch archived filters
  const fetchArchivedFilters = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/photobooth/filters/archived`, axiosConfig);
      const BACKEND_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || "http://localhost:5000";
      
      // Resolve image URLs
      const filtersWithUrls = res.data.map(f => ({
        ...f,
        image: f.image && !f.image.startsWith('http') 
          ? `${BACKEND_URL}${f.image.startsWith('/') ? '' : '/'}${f.image}`
          : f.image
      }));
      
      setArchivedFilters(filtersWithUrls);
      setSortedArchivedFilters(filtersWithUrls);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchFilters();
    fetchArchivedFilters();
  }, []);

  // Sorting function
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }

    const sorted = [...filters].sort((a, b) => {
      let aValue = a[key];
      let bValue = b[key];

      // Handle string comparison
      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return direction === "asc" ? -1 : 1;
      if (aValue > bValue) return direction === "asc" ? 1 : -1;
      return 0;
    });

    setSortedFilters(sorted);
    setSortConfig({ key, direction });
  };

  // Update sortedFilters when filters change
  useEffect(() => {
    if (sortConfig.key) {
      handleSort(sortConfig.key);
    } else {
      setSortedFilters(filters);
    }
  }, [filters]);

  // Handle inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "imageUrl") {
      setForm({ ...form, imageFile: null, [name]: value, preview: value });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm({
        ...form,
        imageFile: file,
        imageUrl: "",
        preview: URL.createObjectURL(file),
      });
    }
  };

  // Submit create/update
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    const newErrors = {};
    if (!form.name.trim()) {
      newErrors.name = "Filter name is required";
    }
    if (!form.imageFile && !form.imageUrl) {
      newErrors.image = "Image is required";
    }
    
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    
    setConfirmModal({
      isOpen: true,
      type: "success",
      title: editingId ? "Update Filter?" : "Add New Filter?",
      message: editingId 
        ? `Are you sure you want to update the filter "${form.name}"?`
        : `Are you sure you want to add the filter "${form.name}"?`,
      confirmText: editingId ? "Update" : "Add Filter",
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, loading: true }));
        try {
          const formData = new FormData();
          formData.append("name", form.name);
          formData.append("category", form.category);

          if (form.imageFile) formData.append("image", form.imageFile);
          else if (form.imageUrl) formData.append("image", form.imageUrl);

          if (editingId) {
            await axios.put(
              `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/photobooth/filters/${editingId}`,
              formData,
              axiosMultipartConfig
            );
          } else {
            await axios.post(
              `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/photobooth/filters`,
              formData,
              axiosMultipartConfig
            );
          }

          setForm({
            name: "",
            imageFile: null,
            imageUrl: "",
            preview: "",
            category: "general",
          });
          setEditingId(null);
          fetchFilters();
          setErrors({ name: "", image: "" }); // Clear errors
          setConfirmModal({ isOpen: false, type: "warning", title: "", message: "", onConfirm: null, loading: false });
        } catch (err) {
          console.error(err);
          setConfirmModal(prev => ({ ...prev, loading: false }));
        }
      },
    });
  };

  const handleEdit = (filter) => {
    setForm({
      name: filter.name,
      imageFile: null,
      imageUrl: filter.image,
      preview: filter.image,
      category: filter.category,
    });
    setEditingId(filter._id);
  };

  const handleArchive = (id) => {
    setConfirmModal({
      isOpen: true,
      type: "info",
      title: "Archive Filter?",
      message: "This filter will be moved to the archived section. You can restore it later if needed.",
      confirmText: "Archive",
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, loading: true }));
        try {
          await axios.put(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/photobooth/filters/${id}/archive`, {}, axiosConfig);
          fetchFilters();
          fetchArchivedFilters();
          setConfirmModal({ isOpen: false, type: "warning", title: "", message: "", onConfirm: null, loading: false });
        } catch (err) {
          console.error(err);
          setConfirmModal(prev => ({ ...prev, loading: false }));
        }
      },
    });
  };

  const handleRestore = (id) => {
    setConfirmModal({
      isOpen: true,
      type: "restore",
      title: "Restore Filter?",
      message: "This filter will be restored to the active filters list and will be available for users again.",
      confirmText: "Restore",
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, loading: true }));
        try {
          await axios.put(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/photobooth/filters/${id}/restore`, {}, axiosConfig);
          fetchFilters();
          fetchArchivedFilters();
          setConfirmModal({ isOpen: false, type: "warning", title: "", message: "", onConfirm: null, loading: false });
        } catch (err) {
          console.error(err);
          setConfirmModal(prev => ({ ...prev, loading: false }));
        }
      },
    });
  };

  const handlePermanentDelete = (id) => {
    setConfirmModal({
      isOpen: true,
      type: "danger",
      title: "Permanent Delete?",
      message: "WARNING: This action cannot be undone! The filter will be permanently deleted from the database.",
      confirmText: "Delete Forever",
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, loading: true }));
        try {
          await axios.delete(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/photobooth/filters/${id}`, axiosConfig);
          fetchArchivedFilters();
          setConfirmModal({ isOpen: false, type: "warning", title: "", message: "", onConfirm: null, loading: false });
        } catch (err) {
          console.error(err);
          setConfirmModal(prev => ({ ...prev, loading: false }));
        }
      },
    });
  };

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
      
      <div className="flex gap-8 ">
      {/* Form Panel */}
      <div className="w-1/2 bg-white rounded-2xl shadow-md p-6 flex flex-col gap-5">
        <h2 className="text-2xl font-bold text-gray-800">
          {editingId ? "Update Filter" : "Add New Filter"}
        </h2>

        {/* Preview */}
        <div className="w-full aspect-video rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
          {form.preview ? (
            <img
              src={form.preview}
              alt="Preview"
              className="w-full h-full object-contain"
            />
          ) : (
            <span className="text-gray-400">No Preview Available</span>
          )}
        </div>
        <div className="w-full">
          {!form.imageUrl ? (
            <label className="flex flex-col items-center justify-center w-full h-13 px-4 border-2 border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition">
              <span className="text-gray-500 text-sm">Click to upload</span>
              <input
                type="file"
                accept="image/png"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          ) : (
            <p className="text-sm text-green-600">Image uploaded ✓</p>
          )}
        </div>

        <input
          type="text"
          placeholder="Filter Name"
          value={form.name}
          onChange={(e) => {
            setForm({ ...form, name: e.target.value });
            if (errors.name && e.target.value.trim()) {
              setErrors({ ...errors, name: "" });
            }
          }}
          className={`border-2 rounded-lg p-3 text-sm focus:ring-2 outline-none transition ${
            errors.name ? "border-red-500 focus:border-red-500 focus:ring-red-200" : "border-gray-300 focus:border-red-400 focus:ring-red-200"
          }`}
        />
        {errors.name && (
          <p className="text-red-500 text-xs mt-1">{errors.name}</p>
        )}

        <input
          type="text"
          name="imageUrl"
          value={form.imageUrl}
          onChange={handleChange}
          placeholder="Or paste image URL"
          className="w-full p-3 border-2 border-gray-300 rounded-lg
             focus:border-gray-400 focus:ring-2 focus:ring-gray-200 outline-none transition"
          disabled={!!form.imageFile}
        />

        <div className="relative w-full">
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className="w-full appearance-none p-3 border-2 border-gray-300 rounded-lg
               focus:border-gray-400 focus:ring-2 focus:ring-gray-200
               outline-none transition text-gray-700 bg-white pr-10"
          >
            <option value="general">General</option>
            <option value="head">Head</option>
            <option value="eyes">Eyes</option>
            <option value="frame">Frame</option>
            <option value="border">Border</option>
          </select>

          <FontAwesomeIcon
            icon={faChevronDown}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
          />
        </div>

        <div className="flex gap-3 mt-2">
          <button
            type="submit"
            onClick={handleSubmit}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-red-600 text-white py-2 rounded-lg hover:opacity-90 transition"
          >
            {editingId ? <Check size={18} /> : <Plus size={18} />}
            {editingId ? "Update Filter" : "Add Filter"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm({
                  name: "",
                  imageFile: null,
                  imageUrl: "",
                  preview: "",
                  category: "general",
                });
              }}
              className="flex-1 flex items-center justify-center gap-2 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
            >
              <X size={18} /> Cancel
            </button>
          )}
        </div>
      </div>

      {/* Filters List */}
      <div className="w-1/2 bg-white rounded-2xl shadow-md p-6 flex flex-col">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Filters
        </h2>
        
        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab("active")}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
              activeTab === "active"
                ? "bg-red-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Active Filters ({filters.length})
          </button>
          <button
            onClick={() => setActiveTab("archived")}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
              activeTab === "archived"
                ? "bg-red-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Archived ({archivedFilters.length})
          </button>
        </div>

        <div className="overflow-y-auto max-h-[70vh]">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-gray-600 text-left sticky top-0">
              <tr>
                <th className="p-3 font-medium">Preview</th>
                <th 
                  className="p-3 font-medium cursor-pointer hover:bg-gray-200 transition"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center gap-1">
                    Name
                    <span className="flex flex-col leading-none">
                      <ChevronUp
                        size={12}
                        className={`${
                          sortConfig.key === "name" && sortConfig.direction === "asc"
                            ? "text-red-500"
                            : "text-gray-300"
                        }`}
                      />
                      <ChevronDown
                        size={12}
                        className={`-mt-1 ${
                          sortConfig.key === "name" && sortConfig.direction === "desc"
                            ? "text-red-500"
                            : "text-gray-300"
                        }`}
                      />
                    </span>
                  </div>
                </th>
                <th 
                  className="p-3 font-medium cursor-pointer hover:bg-gray-200 transition"
                  onClick={() => handleSort("category")}
                >
                  <div className="flex items-center gap-1">
                    Category
                    <span className="flex flex-col leading-none">
                      <ChevronUp
                        size={12}
                        className={`${
                          sortConfig.key === "category" && sortConfig.direction === "asc"
                            ? "text-red-500"
                            : "text-gray-300"
                        }`}
                      />
                      <ChevronDown
                        size={12}
                        className={`-mt-1 ${
                          sortConfig.key === "category" && sortConfig.direction === "desc"
                            ? "text-red-500"
                            : "text-gray-300"
                        }`}
                      />
                    </span>
                  </div>
                </th>
                <th className="p-3 font-medium text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeTab === "active" ? (
                <>
                  {sortedFilters.map((filter) => (
                    <tr
                      key={filter._id}
                      className="hover:bg-gray-50 transition border-b"
                    >
                      <td className="p-3">
                        <img
                          src={filter.image}
                          alt={filter.name}
                          className="h-14 w-14 object-contain border-2 border-gray-300 rounded-lg"
                        />
                      </td>
                      <td className="p-3 font-medium text-gray-700">
                        {filter.name}
                      </td>
                      <td className="p-3 capitalize text-gray-500">
                        {filter.category}
                      </td>
                      <td className="p-3 text-center flex gap-2 justify-center">
                        <button
                          onClick={() => handleEdit(filter)}
                          className="px-3 py-1 flex items-center gap-1 bg-yellow-400 text-white rounded-lg hover:bg-yellow-500 transition"
                        >
                          <Edit size={16} /> Edit
                        </button>
                        <button
                          onClick={() => handleArchive(filter._id)}
                          className="px-3 py-1 flex items-center gap-1 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
                        >
                          <Archive size={16} /> Archive
                        </button>
                      </td>
                    </tr>
                  ))}
                  {sortedFilters.length === 0 && (
                    <tr>
                      <td
                        colSpan="4"
                        className="p-3 text-center text-gray-400 italic"
                      >
                        No active filters available.
                      </td>
                    </tr>
                  )}
                </>
              ) : (
                <>
                  {sortedArchivedFilters.map((filter) => (
                    <tr
                      key={filter._id}
                      className="hover:bg-gray-50 transition border-b bg-gray-50"
                    >
                      <td className="p-3">
                        <img
                          src={filter.image}
                          alt={filter.name}
                          className="h-14 w-14 object-contain border-2 border-gray-300 rounded-lg opacity-60"
                        />
                      </td>
                      <td className="p-3 font-medium text-gray-500">
                        {filter.name}
                      </td>
                      <td className="p-3 capitalize text-gray-400">
                        {filter.category}
                      </td>
                      <td className="p-3 text-center flex gap-2 justify-center">
                        <button
                          onClick={() => handleRestore(filter._id)}
                          className="px-3 py-1 flex items-center gap-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                        >
                          <RotateCcw size={16} /> Restore
                        </button>
                        <button
                          onClick={() => handlePermanentDelete(filter._id)}
                          className="px-3 py-1 flex items-center gap-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                        >
                          <Trash2 size={16} /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {sortedArchivedFilters.length === 0 && (
                    <tr>
                      <td
                        colSpan="4"
                        className="p-3 text-center text-gray-400 italic"
                      >
                        No archived filters.
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </>
  );
}
