import { useEffect, useState } from "react";
import axios from "axios";
import {
  Edit,
  Trash2,
  Plus,
  Check,
  Upload,
  Archive,
  RotateCcw,
  X,
} from "lucide-react";
import ConfirmModal from "../../shared/ConfirmModal";

export default function AdminItineraryMain() {
  const [pins, setPins] = useState([]);
  const [selectedSites, setSelectedSites] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(""); // Duration in hours
  const [imageFile, setImageFile] = useState(null); // <-- File state
  const [imagePreview, setImagePreview] = useState(""); // <-- Preview URL
  const [imageUrl, setImageUrl] = useState(""); // <-- Store the actual image URL for deletion
  const [itineraries, setItineraries] = useState([]);
  const [archivedItineraries, setArchivedItineraries] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [activeTab, setActiveTab] = useState("active"); // "active" or "archived"
  
  // Validation errors
  const [errors, setErrors] = useState({
    name: "",
    description: "",
    duration: "",
    image: "",
    sites: "",
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

  const ICON_SIZE = 20;
  const COVER_IMAGE_HEIGHT = 192;

  // Helper function to get fresh config with token
  const getConfig = () => {
    const token = localStorage.getItem("token");
    return {
      headers: { Authorization: `Bearer ${token}` },
    };
  };

  // Fetch pins
  useEffect(() => {
    const fetchPins = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          window.location.href = "/admin/login";
          return;
        }
        
        const res = await axios.get(
          `${
            import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
          }/pins`,
          getConfig()
        );
        setPins(res.data);
      } catch (err) {
        console.error("Failed to fetch pins:", err);
        if (err.response?.status === 401) {
          window.location.href = "/admin/login";
        }
      }
    };
    fetchPins();
  }, []);

  // Fetch itineraries
  useEffect(() => {
    fetchItineraries();
    fetchArchivedItineraries();
  }, []);

  const fetchItineraries = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.href = "/admin/login";
        return;
      }
      
      const res = await axios.get(
        `${
          import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
        }/itineraries`,
        getConfig()
      );
      setItineraries(res.data);
    } catch (err) {
      console.error("Failed to fetch itineraries:", err);
      if (err.response?.status === 401) {
        window.location.href = "/admin/login";
      }
    }
  };

  const fetchArchivedItineraries = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.href = "/admin/login";
        return;
      }
      
      const res = await axios.get(
        `${
          import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
        }/itineraries/archived`,
        getConfig()
      );
      setArchivedItineraries(res.data);
    } catch (err) {
      console.error("Failed to fetch archived itineraries:", err);
      if (err.response?.status === 401) {
        window.location.href = "/admin/login";
      }
    }
  };

  const toggleSite = (pin) => {
    setSelectedSites((prev) =>
      prev.find((s) => s._id === pin._id)
        ? prev.filter((s) => s._id !== pin._id)
        : [...prev, pin]
    );
  };

  // Handle file input change
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageFile(file); // store file to upload
    setImagePreview(URL.createObjectURL(file)); // preview immediately
  };

  // Handle save / update itinerary
  const handleSave = () => {
    // Validation
    const newErrors = {};
    if (!name.trim()) {
      newErrors.name = "Itinerary name is required";
    }
    if (!description.trim()) {
      newErrors.description = "Description is required";
    }
    if (!duration || duration <= 0) {
      newErrors.duration = "Duration is required and must be greater than 0";
    }
    // Image is required for both new and edit
    if (!imageFile && !imagePreview) {
      newErrors.image = "Image is required";
    }
    if (selectedSites.length === 0) {
      newErrors.sites = "Please select at least one site";
    }
    
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setConfirmModal({
      isOpen: true,
      type: "success",
      title: editingId ? "Update Itinerary?" : "Add New Itinerary?",
      message: editingId 
        ? `Are you sure you want to update the itinerary "${name}"?`
        : `Are you sure you want to add the itinerary "${name}"?`,
      confirmText: editingId ? "Update" : "Add Itinerary",
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, loading: true }));
        try {
          // Check if token exists
          const token = localStorage.getItem("token");
          if (!token) {
            alert("Session expired. Please login again.");
            window.location.href = "/admin/login";
            return;
          }

          let imageUrl = "";

          // If user selected a new image, upload it
          if (imageFile) {
            const formData = new FormData();
            formData.append("image", imageFile);

            const res = await axios.post(
              `${
                import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
              }/itineraries/upload`,
              formData,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "multipart/form-data",
                },
              }
            );

            imageUrl = res.data.imageUrl;
          } else if (editingId) {
            const existing = itineraries.find((i) => i._id === editingId);
            imageUrl = existing?.imageUrl || "";
          }

          const payload = {
            name,
            description,
            imageUrl,
            duration: duration ? Number(duration) : 0,
            sites: selectedSites.map((s) => s._id),
            isAdminCreated: true,
          };

          if (editingId) {
            await axios.put(
              `${
                import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
              }/itineraries/${editingId}`,
              payload,
              getConfig()
            );
          } else {
            await axios.post(
              `${
                import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
              }/itineraries`,
              payload,
              getConfig()
            );
          }

          // Reset form
          setName("");
          setDescription("");
          setDuration("");
          setImageFile(null);
          setImagePreview("");
          setImageUrl("");
          setSelectedSites([]);
          setEditingId(null);
          fetchItineraries();
          setErrors({ name: "", description: "", duration: "", image: "", sites: "" }); // Clear errors
          setConfirmModal({ isOpen: false, type: "warning", title: "", message: "", onConfirm: null, loading: false });
        } catch (err) {
          console.error("Failed to save itinerary:", err);
          setConfirmModal(prev => ({ ...prev, loading: false }));
          
          // Handle 401 Unauthorized
          if (err.response?.status === 401) {
            alert("Session expired. Please login again.");
            window.location.href = "/admin/login";
          } else {
            alert(err.response?.data?.error || "Failed to save itinerary. Please try again.");
          }
        }
      },
    });
  };
  const handleArchive = (id) => {
    setConfirmModal({
      isOpen: true,
      type: "info",
      title: "Archive Itinerary?",
      message: "This itinerary will be moved to the archived section. You can restore it later if needed.",
      confirmText: "Archive",
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, loading: true }));
        try {
          await axios.put(
            `${
              import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
            }/itineraries/${id}/archive`,
            {},
            getConfig()
          );
          fetchItineraries();
          fetchArchivedItineraries();
          setConfirmModal({ isOpen: false, type: "warning", title: "", message: "", onConfirm: null, loading: false });
        } catch (err) {
          console.error("Failed to archive itinerary:", err);
          setConfirmModal(prev => ({ ...prev, loading: false }));
        }
      },
    });
  };

  const handleRestore = (id) => {
    setConfirmModal({
      isOpen: true,
      type: "restore",
      title: "Restore Itinerary?",
      message: "This itinerary will be restored to the active itineraries list and will be available for users again.",
      confirmText: "Restore",
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, loading: true }));
        try {
          await axios.put(
            `${
              import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
            }/itineraries/${id}/restore`,
            {},
            getConfig()
          );
          fetchItineraries();
          fetchArchivedItineraries();
          setConfirmModal({ isOpen: false, type: "warning", title: "", message: "", onConfirm: null, loading: false });
        } catch (err) {
          console.error("Failed to restore itinerary:", err);
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
      message: "WARNING: This action cannot be undone! The itinerary will be permanently deleted from the database.",
      confirmText: "Delete Forever",
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, loading: true }));
        try {
          await axios.delete(
            `${
              import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
            }/itineraries/${id}`,
            getConfig()
          );
          fetchArchivedItineraries();
          setConfirmModal({ isOpen: false, type: "warning", title: "", message: "", onConfirm: null, loading: false });
        } catch (err) {
          console.error("Failed to delete itinerary:", err);
          setConfirmModal(prev => ({ ...prev, loading: false }));
        }
      },
    });
  };

  const handleEdit = (itinerary) => {
    // Clear any existing validation errors
    setErrors({ name: "", description: "", duration: "", image: "", sites: "" });
    
    setName(itinerary.name);
    setDescription(itinerary.description);

    // Only set preview if imageUrl exists
    if (itinerary.imageUrl) {
      setImageUrl(itinerary.imageUrl); // Store the actual URL
      setImagePreview(
        itinerary.imageUrl.startsWith("http")
          ? itinerary.imageUrl
          : `${
              import.meta.env.VITE_API_BASE_URL?.replace("/api", "") ||
              "http://localhost:5000"
            }${itinerary.imageUrl}`
      ); // <-- prepend localhost if needed
    } else {
      setImageUrl("");
      setImagePreview(""); // show placeholder
    }

    setImageFile(null); // clear any previously selected file
    setDuration(itinerary.duration || "");

    const selected = pins.filter((pin) =>
      itinerary.sites?.some((site) => site._id === pin._id)
    );
    setSelectedSites(selected);
    setEditingId(itinerary._id);
  };

  const handleDeleteImage = () => {
    setConfirmModal({
      isOpen: true,
      type: "danger",
      title: "Delete Image?",
      message: "Are you sure you want to remove this image? This action cannot be undone.",
      confirmText: "Delete Image",
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, loading: true }));
        try {
          // If editing an existing itinerary with an image URL, delete from server
          if (editingId && imageUrl) {
            await axios.delete(
              `${
                import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
              }/itineraries/delete-image`,
              {
                ...getConfig(),
                data: { imageUrl }
              }
            );
          }
          
          // Clear local state
          setImageFile(null);
          setImagePreview("");
          setImageUrl("");
          setErrors({ ...errors, image: "" });
          setConfirmModal({ isOpen: false, type: "warning", title: "", message: "", onConfirm: null, loading: false });
        } catch (err) {
          console.error("Failed to delete image:", err);
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
      
      <div className="flex gap-6 p-6">
      {/* Form Panel */}
      <div className="w-1/2 bg-white rounded-2xl shadow-lg p-6 flex flex-col gap-4">
        <h2 className="text-2xl font-bold text-gradient-red mb-4">
            {editingId ? "Edit Itinerary" : "Add Itinerary"}
          </h2>

          {/* Cover Image Preview */}
          <div
            className="w-full rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center relative"
            style={{ height: COVER_IMAGE_HEIGHT }}
          >
            {imagePreview ? (
              <>
                <img
                  src={imagePreview}
                  alt="Itinerary Preview"
                  className="w-full h-full object-cover rounded-xl"
                  onError={(e) => {
                    e.currentTarget.src = "https://via.placeholder.com/192"; // fallback
                  }}
                />
                <button
                  onClick={handleDeleteImage}
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transition"
                  title="Delete image"
                >
                  <X size={20} />
                </button>
              </>
            ) : (
              <span className="text-gray-400">Image Preview</span>
            )}
          </div>

          {/* File Upload */}
          <div className="w-full">
            {!imageFile && !imagePreview ? (
              <label className={`flex flex-col items-center justify-center w-full h-13 px-4 border-2 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition ${
                errors.image ? "border-red-500" : "border-gray-300"
              }`}>
                <span className="text-gray-500 text-sm">Click to upload</span>
                <input
                  type="file"
                  accept="image/png"
                  onChange={(e) => {
                    handleFileChange(e);
                    if (errors.image) {
                      setErrors({ ...errors, image: "" });
                    }
                  }}
                  className="hidden"
                />
              </label>
            ) : (
              <p className="text-sm text-green-600">Image uploaded ✓</p>
            )}
            {errors.image && (
              <p className="text-red-500 text-xs mt-1">{errors.image}</p>
            )}
          </div>

          {/* Name Input */}
          <div>
            <input
              type="text"
              placeholder="Itinerary Name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name && e.target.value.trim()) {
                  setErrors({ ...errors, name: "" });
                }
              }}
              className={`w-full border-2 rounded-lg p-3 text-sm focus:ring-2 outline-none transition ${
                errors.name ? "border-red-500 focus:border-red-500 focus:ring-red-200" : "border-gray-300 focus:border-red-400 focus:ring-red-200"
              }`}
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <textarea
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (errors.description && e.target.value.trim()) {
                setErrors({ ...errors, description: "" });
              }
            }}
            placeholder="Description"
            className={`w-full p-3 border-2 border-gray-300 rounded-lg focus:border-gray-400 focus:ring-2 focus:ring-gray-200 outline-none text-gray-700 text-sm resize-none ${
              errors.description ? "border-red-500 focus:border-red-500 focus:ring-red-200" : ""
            }`}
          />
          {errors.description && (
            <p className="text-red-500 text-xs mt-1">{errors.description}</p>
          )}

          {/* Duration input */}
          <div>
            <input
              type="number"
              min="0"
              step="0.5"
              value={duration}
              onChange={(e) => {
                setDuration(e.target.value);
                if (errors.duration && e.target.value > 0) {
                  setErrors({ ...errors, duration: "" });
                }
              }}
              placeholder="Duration (hours)"
              className={`w-full p-3 border-2 rounded-lg focus:ring-2 outline-none text-gray-700 text-sm transition ${
                errors.duration ? "border-red-500 focus:border-red-500 focus:ring-red-200" : "border-gray-300 focus:border-gray-400 focus:ring-gray-200"
              }`}
            />
            {errors.duration && (
              <p className="text-red-500 text-xs mt-1">{errors.duration}</p>
            )}
          </div>

          {/* Selected Sites */}
          <div className="p-3 border-2 border-gray-300 rounded-lg bg-white text-gray-700 text-sm h-28 overflow-y-auto">
            {selectedSites.length ? (
              selectedSites.map((site) => (
                <span key={site._id} className="block">
                  • {site.siteName || site.title}
                </span>
              ))
            ) : (
              <span className="text-gray-400">No sites selected</span>
            )}
          </div>
          {errors.sites && (
            <p className="text-red-500 text-xs mt-1">{errors.sites}</p>
          )}

          {/* Buttons */}
          <div className="flex gap-3 mt-2">
            <button
              onClick={handleSave}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-red-600 text-white py-2 rounded-lg hover:opacity-90 transition"
            >
              {editingId ? (
                <Check size={ICON_SIZE} />
              ) : (
                <Plus size={ICON_SIZE} />
              )}
              {editingId ? "Update" : "Save"}
            </button>
            <button
              onClick={() => {
                setName("");
                setDescription("");
                setDuration("");
                setImageFile(null);
                setImagePreview("");
                setImageUrl("");
                setSelectedSites([]);
                setEditingId(null);
                setErrors({ name: "", description: "", duration: "", image: "", sites: "" });
              }}
              className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Itineraries & Sites Panel */}
        <div className="w-1/2 flex flex-col gap-6">
          {/* Existing Itineraries Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800">
                Itineraries
              </h2>
            </div>

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
                Active Itineraries ({itineraries.length})
              </button>
              <button
                onClick={() => setActiveTab("archived")}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                  activeTab === "archived"
                    ? "bg-red-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Archived ({archivedItineraries.length})
              </button>
            </div>

            {/* Scrollable itineraries list */}
            <div className="flex flex-col gap-4 overflow-y-auto max-h-[45vh] pr-2">
              {activeTab === "active" ? (
                itineraries.length ? (
                  itineraries.map((itinerary) => (
                    <div
                      key={itinerary._id}
                      className="border border-gray-200 rounded-xl p-5 bg-white 
               shadow-sm hover:shadow-lg transition"
                    >
                      {/* Title + Subtitle */}
                      <h3 className="text-lg font-semibold text-gray-800">
                        {itinerary.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {itinerary.description}
                      </p>

                      {itinerary.duration > 0 && (
                        <p className="text-xs text-gray-500 mt-1 font-medium">
                          Duration: {itinerary.duration}{" "}
                          {itinerary.duration === 1 ? "hour" : "hours"}
                        </p>
                      )}

                      {/* Image */}
                      {itinerary.imageUrl && (
                        <img
                          src={
                            itinerary.imageUrl.startsWith("http")
                              ? itinerary.imageUrl
                              : `${
                                  import.meta.env.VITE_API_BASE_URL?.replace(
                                    "/api",
                                    ""
                                  ) || "http://localhost:5000"
                                }${itinerary.imageUrl}`
                          }
                          alt={itinerary.name}
                          className="w-full h-48 object-cover rounded-xl mt-3"
                          onError={(e) => {
                            e.currentTarget.src =
                              "https://via.placeholder.com/192";
                          }}
                        />
                      )}

                      {/* Sites */}
                      {itinerary.sites?.length > 0 && (
                        <p className="text-xs text-gray-500 mt-2">
                          Sites: {itinerary.sites.length}
                        </p>
                      )}

                      {/* Actions */}
                      <div className="flex gap-3 mt-4">
                        <button
                          onClick={() => handleEdit(itinerary)}
                          className="flex items-center justify-center gap-2 px-4 py-2 
                bg-yellow-500 hover:bg-yellow-700
                text-white text-sm font-medium rounded-lg shadow-sm transition"
                        >
                          <Edit size={16} /> Edit
                        </button>

                        <button
                          onClick={() => handleArchive(itinerary._id)}
                          className="flex items-center justify-center gap-2 px-4 py-2 
                bg-orange-500 hover:bg-orange-600 
                text-white text-sm font-medium rounded-lg shadow-sm transition"
                        >
                          <Archive size={16} /> Archive
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400">No active itineraries found</p>
                )
              ) : archivedItineraries.length ? (
                archivedItineraries.map((itinerary) => (
                  <div
                    key={itinerary._id}
                    className="border border-gray-200 rounded-xl p-5 bg-gray-50 
               shadow-sm hover:shadow-lg transition"
                  >
                    {/* Title + Subtitle */}
                    <h3 className="text-lg font-semibold text-gray-500">
                      {itinerary.name}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {itinerary.description}
                    </p>
                    {itinerary.duration > 0 && (
                      <p className="text-xs text-gray-500 mt-1 font-medium">
                        Duration: {itinerary.duration}{" "}
                        {itinerary.duration === 1 ? "hour" : "hours"}
                      </p>
                    )}

                    {/* Image */}
                    {itinerary.imageUrl && (
                      <img
                        src={
                          itinerary.imageUrl.startsWith("http")
                            ? itinerary.imageUrl
                            : `${
                                import.meta.env.VITE_API_BASE_URL?.replace(
                                  "/api",
                                  ""
                                ) || "http://localhost:5000"
                              }${itinerary.imageUrl}`
                        }
                        alt={itinerary.name}
                        className="w-full h-48 object-cover rounded-xl mt-3 opacity-60"
                        onError={(e) => {
                          e.currentTarget.src =
                            "https://via.placeholder.com/192";
                        }}
                      />
                    )}

                    {/* Sites */}
                    {itinerary.sites?.length > 0 && (
                      <p className="text-xs text-gray-400 mt-2">
                        Sites: {itinerary.sites.length}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => handleRestore(itinerary._id)}
                        className="flex items-center justify-center gap-2 px-4 py-2 
                bg-green-500 hover:bg-green-600
                text-white text-sm font-medium rounded-lg shadow-sm transition"
                      >
                        <RotateCcw size={16} /> Restore
                      </button>

                      <button
                        onClick={() => handlePermanentDelete(itinerary._id)}
                        className="flex items-center justify-center gap-2 px-4 py-2 
                bg-red-600 hover:bg-red-700 
                text-white text-sm font-medium rounded-lg shadow-sm transition"
                      >
                        <Trash2 size={16} /> Delete
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400">No archived itineraries</p>
              )}
            </div>
          </div>

          {/* Sites Card - Separate section */}
          <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col border-2 border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800">
                Sites
              </h2>
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {pins.length} available
              </span>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Select sites to add to your itinerary
            </p>

            {/* Scrollable sites list */}
            <div className="flex flex-col gap-4 max-h-[40vh] overflow-y-auto pr-2">
              {pins.map((pin) => {
                const isSelected = selectedSites.some((s) => s._id === pin._id);
                return (
                  <div
                    key={pin._id}
                    className="flex items-center gap-4 rounded-2xl p-4 border border-gray-200 
          bg-white shadow-sm hover:shadow-md transition"
                  >
                    {/* Thumbnail */}
                    <img
                      src={
                        // Get first image from mediaFiles (not video)
                        pin.mediaFiles?.find((m) => m.type === "image")?.url
                          ? `${
                              import.meta.env.VITE_API_BASE_URL?.replace(
                                "/api",
                                ""
                              ) || "http://localhost:5000"
                            }${
                              pin.mediaFiles.find((m) => m.type === "image").url
                            }`
                          : pin.mediaUrl ||
                            pin.image ||
                            "https://via.placeholder.com/80"
                      }
                      alt={pin.siteName || pin.title}
                      className="object-cover rounded-xl flex-shrink-0"
                      style={{ width: 80, height: 80 }}
                    />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-gray-800 truncate">
                        {pin.siteName || pin.title}
                      </h3>
                      <p className="text-gray-500 text-sm line-clamp-2">
                        {pin.description}
                      </p>
                    </div>

                    {/* Action button */}
                    <button
                      onClick={() => toggleSite(pin)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white shadow-sm transition 
            ${
              isSelected
                ? "bg-green-500 hover:bg-green-600"
                : "bg-red-500 hover:bg-red-600"
            }`}
                    >
                      {isSelected ? <Check size={20} /> : <Plus size={20} />}
                      {isSelected ? "Added" : "Add"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      </>
  );
}
