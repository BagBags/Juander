import React, { useEffect, useState } from "react";
import axios from "axios";
import { Edit, Trash2, Plus, Check, X } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
export default function ManagePhotobooth() {
  const [filters, setFilters] = useState([]);
  const [form, setForm] = useState({
    name: "",
    imageFile: null,
    imageUrl: "",
    preview: "",
    category: "general",
  });
  const [editingId, setEditingId] = useState(null);

  // Fetch filters
  const fetchFilters = async () => {
    try {
      const res = await axios.get("/api/photobooth/filters");
      setFilters(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchFilters();
  }, []);

  // Handle inputs
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "imageUrl") {
      setForm({
        ...form,
        imageFile: null,
        [name]: value,
        preview: value,
      });
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
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("category", form.category);

      if (form.imageFile) formData.append("image", form.imageFile);
      else if (form.imageUrl) formData.append("image", form.imageUrl);

      if (editingId) {
        await axios.put(`/api/photobooth/filters/${editingId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await axios.post("/api/photobooth/filters", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
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
    } catch (err) {
      console.error(err);
    }
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

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this filter?")) return;
    try {
      await axios.delete(`/api/photobooth/filters/${id}`);
      fetchFilters();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex gap-8 p-8 bg-gray-50 min-h-screen">
      {/* Form Panel */}
      <div className="w-1/2 bg-white rounded-2xl shadow-md p-6 flex flex-col gap-5">
        <h2 className="text-xl font-semibold text-gray-800">
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

        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Filter Name"
          required
        />

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
          </select>

          {/* FontAwesome dropdown icon */}
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
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Existing Filters
        </h2>
        <div className="overflow-y-auto max-h-[70vh]">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-gray-600 text-left">
              <tr>
                <th className="p-3 font-medium">Preview</th>
                <th className="p-3 font-medium">Name</th>
                <th className="p-3 font-medium">Category</th>
                <th className="p-3 font-medium text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filters.map((filter) => (
                <tr
                  key={filter._id}
                  className="hover:bg-gray-50 transition border-b"
                >
                  <td className="p-3">
                    <img
                      src={filter.image}
                      alt={filter.name}
                      className="h-14 w-14 object-contain border-2 border-gray-300 rounded-lg 
               focus:border-gray-400 focus:ring-2 focus:ring-gray-200 
               outline-none transition text-gray-700 bg-white"
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
                      onClick={() => handleDelete(filter._id)}
                      className="px-3 py-1 flex items-center gap-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                    >
                      <Trash2 size={16} /> Delete
                    </button>
                  </td>
                </tr>
              ))}
              {filters.length === 0 && (
                <tr>
                  <td
                    colSpan="4"
                    className="p-3 text-center text-gray-400 italic"
                  >
                    No filters available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
