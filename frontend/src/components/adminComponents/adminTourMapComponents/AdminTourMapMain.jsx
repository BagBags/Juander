// AdminTourMapMain.jsx
import React, { useState, useRef, useEffect, Suspense } from "react";
import Map, { Marker, Source, Layer } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import axios from "axios";
import {
  MAPBOX_TOKEN,
  INTRAMUROS_BOUNDS,
  initialMaskFeature,
} from "./mapConfig";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point } from "@turf/helpers";
import { CheckCircle2, XCircle, MapPin, Archive, RotateCcw, Trash2, Edit, MapPinned, Image, Sparkles, Camera, Layers, X, Plus, Check, Info, Crop, Save, Search, Filter } from "lucide-react";
import ConfirmModal from "../../shared/ConfirmModal";
import {
  faCropSimple,
  faPlus,
  faInfo,
  faXmark,
  faFloppyDisk,
  faMapPin,
  faLock,
  faHandPaper,
} from "@fortawesome/free-solid-svg-icons";

// ---------- Lazy-loaded components ----------
const AdminPinCard = React.lazy(() =>
  import("../adminTourMapComponents/AdminPinCard")
);
const AddPinModal = React.lazy(() =>
  import("../adminTourMapComponents/AddPinModal")
);
const ManualAddModal = React.lazy(() =>
  import("../adminTourMapComponents/ManualAddModal")
);
const ThreeDModelPreview = React.lazy(() =>
  import("../adminTourMapComponents/ThreeDModelPreview")
);

// ---------- Axios instance ----------
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
});
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default function AdminTourMapMain() {
  const [viewState, setViewState] = useState({
    latitude: 40.5896,
    longitude: 120.9747,
    zoom: 4,
    bearing: 45,
  });

  const [pins, setPins] = useState([]);
  const [archivedPins, setArchivedPins] = useState([]);
  const [activeTab, setActiveTab] = useState("active"); // "active" or "archived"
  const [maskGeoJson, setMaskGeoJson] = useState(initialMaskFeature);
  const [originalPinData, setOriginalPinData] = useState(null); // Store original pin data
  
  // Create inverse mask for visual overlay (dark outside bounds)
  const [inverseMask, setInverseMask] = useState(null);
  
  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: "warning",
    title: "",
    message: "",
    onConfirm: null,
    loading: false,
  });

  const [isAddingPin, setIsAddingPin] = useState(false);
  const [isMaskingMode, setIsMaskingMode] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [selectedPin, setSelectedPin] = useState(null);
  const [manualCoords, setManualCoords] = useState({ lat: "", lng: "" });
  const [draggablePinIndex, setDraggablePinIndex] = useState(null);

  const [loading, setLoading] = useState(false);
  const [notif, setNotif] = useState(null);

  const [showGlbPreview, setShowGlbPreview] = useState(false);
  const [currentGlbUrl, setCurrentGlbUrl] = useState("");
  
  // Validation errors
  const [validationErrors, setValidationErrors] = useState({
    siteName: "",
    siteDescription: "",
    category: "",
    latitude: "",
    longitude: "",
    facadeUrl: "",
    mediaFiles: "",
  });

  const adminMapRef = useRef(null);
  const drawRef = useRef(null);
  const [showAddPinModal, setShowAddPinModal] = useState(false);
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [showPinsPanel, setShowPinsPanel] = useState(false);
  const [showCategoryPanel, setShowCategoryPanel] = useState(false);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // "all", "active", "inactive"
  const [filterCategory, setFilterCategory] = useState("all");
  const [categories, setCategories] = useState([]);
  const [categoryForm, setCategoryForm] = useState({ name: "" });
  const [editCategoryId, setEditCategoryId] = useState(null);

  // ---------- Helpers ----------
  const notify = (type, message) => {
    setNotif({ type, message });
    setTimeout(() => setNotif(null), 2500);
  };

  // Create inverse mask geometry for visual overlay
  useEffect(() => {
    if (maskGeoJson && maskGeoJson.geometry) {
      // Create a large outer polygon covering beyond the viewport
      // Then add the inner polygon (hole) which is the Intramuros bounds
      const outerRing = [
        [120.96, 14.575],   // Bottom-left (extended)
        [120.99, 14.575],   // Bottom-right (extended)
        [120.99, 14.605],   // Top-right (extended)
        [120.96, 14.605],   // Top-left (extended)
        [120.96, 14.575],   // Close the ring
      ];
      
      setInverseMask({
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {},
            geometry: {
              type: "Polygon",
              coordinates: [
                outerRing,
                maskGeoJson.geometry.coordinates[0], // Inner ring (hole)
              ],
            },
          },
        ],
      });
    }
  }, [maskGeoJson]);

  // Fetch archived pins
  const fetchArchivedPins = async () => {
    try {
      const res = await api.get("/pins/archived");
      setArchivedPins(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching archived pins:", err);
      // Silently handle error - archived pins endpoint may not exist yet
      setArchivedPins([]);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const res = await api.get("/admin/categories");
      setCategories(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching categories:", err);
      setCategories([]);
    }
  };

  // ---------- Load pins + mask on mount ----------
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [pinsRes, maskRes] = await Promise.all([
          api.get("/pins"),
          api.get("/mask").catch(() => ({ data: null })),
        ]);

        setPins(
          Array.isArray(pinsRes.data)
            ? pinsRes.data
            : Array.isArray(pinsRes.data?.pins)
            ? pinsRes.data.pins
            : []
        );

        const maskData = maskRes?.data;
        if (maskData) {
          if (maskData.type === "Feature") setMaskGeoJson(maskData);
          else if (maskData.geometry)
            setMaskGeoJson({
              type: "Feature",
              properties: {},
              geometry: maskData.geometry,
            });
        }

        // Load archived pins and categories
        fetchArchivedPins();
        fetchCategories();

        notify("success", "Map data loaded");
      } catch (err) {
        console.error(err);
        notify("error", "Failed to load pins/mask");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ---------- Mask Editing ----------
  const enableMaskEditing = async () => {
    const map = adminMapRef.current?.getMap?.();
    if (!map) return;

    if (!drawRef.current) {
      const { default: MapboxDraw } = await import("@mapbox/mapbox-gl-draw");
      const draw = new MapboxDraw({
        displayControlsDefault: false,
        controls: { polygon: false, trash: false },
        styles: [
          {
            id: "gl-draw-polygon-fill",
            type: "fill",
            paint: { "fill-color": "#ff6600", "fill-opacity": 0.5 },
          },
          {
            id: "gl-draw-polygon-stroke",
            type: "line",
            paint: { "line-color": "#ff0000", "line-width": 3 },
          },
          {
            id: "gl-draw-polygon-and-line-vertex-halo-active",
            type: "circle",
            paint: { "circle-radius": 7, "circle-color": "#fff" },
          },
          {
            id: "gl-draw-polygon-and-line-vertex-active",
            type: "circle",
            paint: { "circle-radius": 5, "circle-color": "#ff0000" },
          },
        ],
      });

      drawRef.current = draw;
      map.addControl(draw, "top-left");

      if (maskGeoJson?.geometry) {
        const added = draw.add(maskGeoJson);
        const featureId =
          maskGeoJson.id || (Array.isArray(added) ? added[0] : added);
        if (featureId) draw.changeMode("direct_select", { featureId });
      }
    }

    setIsMaskingMode(true);
  };

  const exitMaskEditing = () => {
    const map = adminMapRef.current?.getMap?.();
    if (drawRef.current && map) {
      map.removeControl(drawRef.current);
      drawRef.current = null;
    }
    setIsMaskingMode(false);
  };

  const saveMask = async () => {
    const map = adminMapRef.current?.getMap?.();
    try {
      let featureToSave = maskGeoJson;
      if (drawRef.current && map) {
        const data = drawRef.current.getAll();
        if (data.features.length > 0) {
          featureToSave = data.features[0];
          setMaskGeoJson(featureToSave);
        } else {
          notify("error", "No mask found to save");
          setIsMaskingMode(false);
          return;
        }
      }

      await api.post("/mask", { geometry: featureToSave.geometry });
      notify("success", "Mask saved");
    } catch (err) {
      console.error(err);
      notify("error", "Failed to save mask");
    } finally {
      exitMaskEditing();
    }
  };

  // ---------- Pin handling ----------
  // Check if coordinates are inside Intramuros mask
  const isInsideMask = (lng, lat) => {
    try {
      const pt = point([lng, lat]);
      return booleanPointInPolygon(pt, maskGeoJson);
    } catch (err) {
      console.error("Error checking point in polygon:", err);
      return false;
    }
  };

  const handleMapClick = (event) => {
    if (!isAddingPin) return;
    const { lng, lat } = event.lngLat;
    
    // Validate if pin is inside Intramuros mask
    if (!isInsideMask(lng, lat)) {
      notify("error", "Pin location is outside Intramuros bounds. Please place pins within the highlighted area.");
      return;
    }
    
    const newPin = {
      latitude: lat,
      longitude: lng,
      siteName: "",
      siteDescription: "",
      mediaUrl: "",
      mediaType: "image",
      arEnabled: false,
      arLink: "",
      status: "active",
    };
    setPins((prev) => [...prev, newPin]);
    openPinCard(pins.length);
  };

  const addPinFromCoords = () => {
    const lat = parseFloat(manualCoords.lat);
    const lng = parseFloat(manualCoords.lng);
    if (isNaN(lat) || isNaN(lng))
      return notify("error", "Invalid latitude or longitude");
    
    // Validate if pin is inside Intramuros mask
    if (!isInsideMask(lng, lat)) {
      notify("error", "Coordinates are outside Intramuros bounds. Please enter valid coordinates within the highlighted area.");
      return;
    }
    
    const newPin = {
      latitude: lat,
      longitude: lng,
      siteName: "",
      siteDescription: "",
      mediaUrl: "",
      mediaType: "image",
      arEnabled: false,
      arLink: "",
      status: "active",
    };
    setPins((prev) => [...prev, newPin]);
    openPinCard(pins.length);
    setManualCoords({ lat: "", lng: "" });
  };

  const updatePinField = (index, field, value) =>
    setPins((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );

  // Open pin card and save original data
  const openPinCard = (index) => {
    setSelectedPin(index);
    setOriginalPinData({ ...pins[index] }); // Deep copy of original pin data
  };

  // Close pin card and revert changes if not saved
  const closePinCard = () => {
    if (originalPinData && selectedPin !== null) {
      // If pin has no _id, it's a new unsaved pin - remove it
      if (!originalPinData._id) {
        setPins((prev) => prev.filter((_, i) => i !== selectedPin));
      } else {
        // If pin has _id, it's an existing pin - revert to original data
        setPins((prev) =>
          prev.map((p, i) => (i === selectedPin ? originalPinData : p))
        );
      }
    }
    setSelectedPin(null);
    setOriginalPinData(null);
    setIsAddingPin(false);
  };

  const handleFormSubmit = (e, index) => {
    e.preventDefault();
    const pin = pins[index];
    const pinName = pin.siteName || `Pin #${index + 1}`;
    
    // Validation
    const errors = {};
    
    if (!pin.siteName || !pin.siteName.trim()) {
      errors.siteName = "Site name is required";
    }
    
    if (!pin.siteDescription || !pin.siteDescription.trim()) {
      errors.siteDescription = "Site description is required";
    }
    
    if (!pin.category) {
      errors.category = "Category is required";
    }
    
    if (!pin.latitude || isNaN(parseFloat(pin.latitude))) {
      errors.latitude = "Valid latitude is required";
    } else {
      const lat = parseFloat(pin.latitude);
      if (lat < -90 || lat > 90) {
        errors.latitude = "Latitude must be between -90 and 90";
      }
    }
    
    if (!pin.longitude || isNaN(parseFloat(pin.longitude))) {
      errors.longitude = "Valid longitude is required";
    } else {
      const lng = parseFloat(pin.longitude);
      if (lng < -180 || lng > 180) {
        errors.longitude = "Longitude must be between -180 and 180";
      }
    }
    
    if (!pin.facadeUrl || !pin.facadeUrl.trim()) {
      errors.facadeUrl = "2D Facade image is required";
    }
    
    if (!pin.mediaFiles || pin.mediaFiles.length === 0) {
      errors.mediaFiles = "At least 1 media file is required";
    }
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      notify("error", "Please fill in all required fields");
      return;
    }
    
    setConfirmModal({
      isOpen: true,
      type: "success",
      title: pin._id ? "Update Pin?" : "Add New Pin?",
      message: pin._id 
        ? `Are you sure you want to update "${pinName}"?`
        : `Are you sure you want to add "${pinName}"?`,
      confirmText: pin._id ? "Update" : "Add Pin",
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, loading: true }));
        try {
          let saved;
          if (pin._id) {
            const { _id, ...payload } = pin;
            const res = await api.put(`/pins/${_id}`, payload);
            saved = res.data;
          } else {
            const res = await api.post("/pins", pin);
            saved = res.data;
          }
          setPins((prev) => prev.map((p, i) => (i === index ? saved : p)));
          notify("success", `Pin #${index + 1} saved`);
          setSelectedPin(null);
          setOriginalPinData(null);
          setIsAddingPin(false);
          setValidationErrors({}); // Clear all errors
          setConfirmModal({ isOpen: false, type: "warning", title: "", message: "", onConfirm: null, loading: false });
        } catch (err) {
          console.error(err);
          notify("error", "Failed to save pin");
          setConfirmModal(prev => ({ ...prev, loading: false }));
        }
      },
    });
  };

  const handleArchive = (id) => {
    if (!id) return;
    setConfirmModal({
      isOpen: true,
      type: "info",
      title: "Archive Pin?",
      message: "This pin will be moved to the archived section. You can restore it later if needed.",
      confirmText: "Archive",
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, loading: true }));
        try {
          await api.put(`/pins/${id}/archive`);
          const pinsRes = await api.get("/pins");
          setPins(Array.isArray(pinsRes.data) ? pinsRes.data : []);
          fetchArchivedPins();
          setSelectedPin(null);
          notify("success", "Pin archived successfully");
          setConfirmModal({ isOpen: false, type: "warning", title: "", message: "", onConfirm: null, loading: false });
        } catch (err) {
          console.error(err);
          notify("error", "Failed to archive pin");
          setConfirmModal(prev => ({ ...prev, loading: false }));
        }
      },
    });
  };

  const handleRestore = (id) => {
    if (!id) return;
    setConfirmModal({
      isOpen: true,
      type: "restore",
      title: "Restore Pin?",
      message: "This pin will be restored to the active pins list and will be available on the map again.",
      confirmText: "Restore",
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, loading: true }));
        try {
          await api.put(`/pins/${id}/restore`);
          const pinsRes = await api.get("/pins");
          setPins(Array.isArray(pinsRes.data) ? pinsRes.data : []);
          fetchArchivedPins();
          notify("success", "Pin restored successfully");
          setConfirmModal({ isOpen: false, type: "warning", title: "", message: "", onConfirm: null, loading: false });
        } catch (err) {
          console.error(err);
          notify("error", "Failed to restore pin");
          setConfirmModal(prev => ({ ...prev, loading: false }));
        }
      },
    });
  };

  const handlePermanentDelete = (id) => {
    if (!id) return;
    setConfirmModal({
      isOpen: true,
      type: "danger",
      title: "Permanent Delete?",
      message: "WARNING: This action cannot be undone! This pin and all its associated data will be permanently deleted from the database.",
      confirmText: "Delete Forever",
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, loading: true }));
        try {
          await api.delete(`/pins/${id}`);
          fetchArchivedPins();
          notify("success", "Pin permanently deleted");
          setConfirmModal({ isOpen: false, type: "warning", title: "", message: "", onConfirm: null, loading: false });
        } catch (err) {
          console.error(err);
          notify("error", "Failed to delete pin");
          setConfirmModal(prev => ({ ...prev, loading: false }));
        }
      },
    });
  };

  // ---------- Category CRUD ----------
  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) {
      notify("error", "Category name is required");
      return;
    }

    const categoryName = categoryForm.name.trim();
    const isEditing = !!editCategoryId;

    setConfirmModal({
      isOpen: true,
      type: isEditing ? "info" : "success",
      title: isEditing ? "Update Category?" : "Create New Category?",
      message: isEditing 
        ? `Are you sure you want to update this category to "${categoryName}"?`
        : `Are you sure you want to create a new category named "${categoryName}"?`,
      confirmText: isEditing ? "Update" : "Create",
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, loading: true }));
        try {
          if (isEditing) {
            await api.put(`/admin/categories/${editCategoryId}`, { name: categoryName });
            notify("success", "Category updated");
          } else {
            await api.post("/admin/categories", { name: categoryName });
            notify("success", "Category created");
          }
          setCategoryForm({ name: "" });
          setEditCategoryId(null);
          fetchCategories();
          setConfirmModal({ isOpen: false, type: "warning", title: "", message: "", onConfirm: null, loading: false });
        } catch (err) {
          console.error(err);
          notify("error", err.response?.data?.message || "Failed to save category");
          setConfirmModal(prev => ({ ...prev, loading: false }));
        }
      },
    });
  };

  const handleCategoryEdit = (category) => {
    setEditCategoryId(category._id);
    setCategoryForm({ name: category.name });
  };

  const handleCategoryDelete = (id) => {
    setConfirmModal({
      isOpen: true,
      type: "danger",
      title: "Delete Category?",
      message: "This category will be permanently deleted. Pins using this category will have their category removed.",
      confirmText: "Delete Category",
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, loading: true }));
        try {
          await api.delete(`/admin/categories/${id}`);
          fetchCategories();
          notify("success", "Category deleted");
          setConfirmModal({ isOpen: false, type: "warning", title: "", message: "", onConfirm: null, loading: false });
        } catch (err) {
          console.error(err);
          notify("error", "Failed to delete category");
          setConfirmModal(prev => ({ ...prev, loading: false }));
        }
      },
    });
  };

  const handleGlbUpload = async (e, index) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("arModel", file);

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/pins/upload-ar`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      const uploadedUrl = res.data.url;
      setPins((prev) =>
        prev.map((p, i) => (i === index ? { ...p, glbUrl: uploadedUrl } : p))
      );
      notify("success", "3D model uploaded (click Save Changes to apply)");
    } catch (err) {
      console.error(err);
      notify("error", err.response?.data?.message || "Upload failed");
    }
  };

  const previewGlb = (glbUrl) => {
    setCurrentGlbUrl(glbUrl);
    setShowGlbPreview(true);
  };

  const handleFacadeUpload = async (e, pinIndex) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("facade", file);

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/pins/upload-facade-temp`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      const uploadedUrl = res.data.url;
      setPins((prev) =>
        prev.map((p, i) => (i === pinIndex ? { ...p, facadeUrl: uploadedUrl } : p))
      );
      notify("success", "Facade image uploaded (click Save Changes to apply)");
    } catch (err) {
      console.error(err);
      notify("error", "Facade upload failed");
    }
  };

  const handleRemoveFacade = async (index) => {
    const pin = pins[index];
    
    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete the facade image for "${pin.siteName}"?\n\n` +
      `This will permanently delete the file from the server and cannot be undone.`
    );
    
    if (!confirmed) return;

    try {
      notify("info", "Deleting facade image...");
      
      // Call backend to delete the file and update database
      await api.delete(`/pins/${pin._id}/remove-facade`);
      
      // Update local state
      setPins((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], facadeUrl: "" };
        return updated;
      });
      
      notify("success", "Facade image deleted successfully");
    } catch (error) {
      console.error("Error removing facade:", error);
      notify("error", "Failed to delete facade image. Please try again.");
    }
  };

  const handleRemoveGlb = async (index) => {
    const pin = pins[index];
    
    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete the 3D model for "${pin.siteName}"?\n\n` +
      `This will permanently delete the file from the server and cannot be undone.`
    );
    
    if (!confirmed) return;

    try {
      notify("info", "Deleting 3D model...");
      
      // Call backend to delete the file and update database
      await api.delete(`/pins/${pin._id}/remove-glb`);
      
      // Update local state
      setPins((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], glbUrl: "" };
        return updated;
      });
      
      notify("success", "3D model deleted successfully");
    } catch (error) {
      console.error("Error removing 3D model:", error);
      notify("error", "Failed to delete 3D model. Please try again.");
    }
  };

  const handleMediaUpload = async (e, index) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    // Validate file sizes (50MB limit per file)
    const maxSize = 50 * 1024 * 1024; // 50MB in bytes
    const oversizedFiles = files.filter(file => file.size > maxSize);
    
    if (oversizedFiles.length > 0) {
      const fileNames = oversizedFiles.map(f => f.name).join(", ");
      notify("error", `File(s) too large: ${fileNames}. Maximum size is 50MB per file.`);
      return;
    }
    
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("mediaFiles", file);
    });

    try {
      notify("info", "Uploading files...");
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/pins/upload-media`,
        formData,
        { 
          headers: { "Content-Type": "multipart/form-data" },
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        }
      );
      const uploadedFiles = res.data.files;
      
      setPins((prev) =>
        prev.map((p, i) => {
          if (i === index) {
            const existingFiles = p.mediaFiles || [];
            return { ...p, mediaFiles: [...existingFiles, ...uploadedFiles] };
          }
          return p;
        })
      );
      notify("success", `${uploadedFiles.length} file(s) uploaded (click Save Changes to apply)`);
    } catch (err) {
      console.error(err);
      notify("error", err.response?.data?.message || "Media upload failed");
    }
  };

  const handleRemoveMedia = async (pinIndex, mediaIndex) => {
    const pin = pins[pinIndex];
    const mediaFile = pin.mediaFiles[mediaIndex];
    
    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete this media file?\n\n` +
      `This will permanently delete the file from the server and cannot be undone.`
    );
    
    if (!confirmed) return;

    try {
      notify("info", "Deleting media file...");
      
      // Call backend to delete the file and update database
      await api.delete(`/pins/${pin._id}/remove-media/${mediaIndex}`);
      
      // Update local state
      setPins((prev) => {
        const updated = [...prev];
        const mediaFiles = [...(updated[pinIndex].mediaFiles || [])];
        mediaFiles.splice(mediaIndex, 1);
        updated[pinIndex] = { ...updated[pinIndex], mediaFiles };
        return updated;
      });
      
      notify("success", "Media file deleted successfully");
    } catch (error) {
      console.error("Error removing media file:", error);
      notify("error", "Failed to delete media file. Please try again.");
    }
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
      
      <div className="flex justify-center items-center p-6 bg-gray-100 min-h-screen">
      <div className="relative w-full h-[90vh] bg-white rounded-2xl shadow-lg overflow-hidden">
        {loading && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[10000] bg-white/90 border border-gray-200 px-3 py-1 rounded shadow">
            Loading…
          </div>
        )}
        {notif && (
          <div
            className={`absolute top-3 left-1/2 z-[10000] w-auto min-w-[300px] max-w-md px-4 py-3 rounded-xl shadow-lg border animate-slideDown ${
              notif.type === "success"
                ? "bg-green-50 border-green-300 text-green-800"
                : notif.type === "error"
                ? "bg-red-50 border-red-300 text-red-800"
                : "bg-blue-50 border-blue-300 text-blue-800"
            }`}
            style={{ transform: 'translateX(-50%)' }}
          >
            <div className="flex items-center gap-3">
              {notif.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              ) : notif.type === "error" ? (
                <XCircle className="w-5 h-5 flex-shrink-0" />
              ) : (
                <MapPin className="w-5 h-5 flex-shrink-0" />
              )}
              <p className="text-sm font-medium leading-relaxed">{notif.message}</p>
            </div>
          </div>
        )}
        {/* 3D Model Preview */}
        {showGlbPreview && (
          <Suspense
            fallback={
              <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-50">
                Loading 3D preview…
              </div>
            }
          >
            <ThreeDModelPreview url={currentGlbUrl} />
          </Suspense>
        )}

        {/* Map */}
        <Map
          ref={adminMapRef}
          initialViewState={{ ...viewState, minZoom: 15.5 }}
          maxBounds={INTRAMUROS_BOUNDS}
          mapboxAccessToken={MAPBOX_TOKEN}
          onMove={(evt) => setViewState(evt.viewState)}
          onClick={handleMapClick}
          mapStyle="mapbox://styles/mapbox/streets-v11"
          style={{ width: "100%", height: "100%" }}
        >
          {/* Inverse Mask Overlay - Dark outside bounds */}
          {inverseMask && (
            <Source id="inverse-mask" type="geojson" data={inverseMask}>
              <Layer
                id="inverse-mask-layer"
                type="fill"
                paint={{
                  "fill-color": "#000000",
                  "fill-opacity": 0.4,
                }}
              />
            </Source>
          )}

          {/* Intramuros Bounds Outline */}
          {maskGeoJson && (
            <Source id="bounds-outline" type="geojson" data={maskGeoJson}>
              <Layer
                id="bounds-outline-layer"
                type="line"
                paint={{
                  "line-color": "#f04e37",
                  "line-width": 3,
                  "line-opacity": 0.8,
                }}
              />
            </Source>
          )}

          {pins.map((pin, index) => (
            <Marker
              key={pin._id || `pin-${index}`}
              latitude={pin.latitude}
              longitude={pin.longitude}
              anchor="bottom"
              draggable={draggablePinIndex === index}
              onDragEnd={async (event) => {
                const { lng, lat } = event.lngLat;

                // Validate if new position is inside Intramuros mask
                if (!isInsideMask(lng, lat)) {
                  notify("error", "Pin must be placed within Intramuros bounds");
                  // Revert to original position
                  return;
                }

                // Update local state immediately
                updatePinField(index, "latitude", lat);
                updatePinField(index, "longitude", lng);

                // Update database if pin exists
                if (pin._id) {
                  try {
                    await api.put(`/pins/${pin._id}`, {
                      ...pin,
                      latitude: lat,
                      longitude: lng,
                    });
                    notify("success", "Pin position updated");
                  } catch (err) {
                    console.error(err);
                    notify("error", "Failed to update pin position");
                  }
                }
              }}
            >
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  openPinCard(index);
                }}
                className={`absolute top-1/2 left-1/2 w-5 h-5 rounded-full border-2 border-white shadow-md`}
                style={{
                  transform: "translate(-50%, -50%)",
                  cursor: "pointer",
                  backgroundColor:
                    pin.status === "inactive" ? "#3b82f6" : "#dc2626", // blue if inactive, red if active
                }}
                title={pin.siteName || `Pin #${index + 1}`}
              ></div>
            </Marker>
          ))}
        </Map>

        {/* Pin Card - Hidden when moving pin */}
        {selectedPin !== null && pins[selectedPin] && draggablePinIndex !== selectedPin && (
          <Suspense
            fallback={
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                Loading pin card…
              </div>
            }
          >
            <AdminPinCard
              pin={pins[selectedPin]}
              selectedPinIndex={selectedPin}
              updatePinField={updatePinField}
              handleFormSubmit={handleFormSubmit}
              handleArchive={handleArchive}
              handleGlbUpload={handleGlbUpload}
              previewGlb={previewGlb}
              handleRemoveGlb={handleRemoveGlb}
              handleFacadeUpload={handleFacadeUpload}
              handleRemoveFacade={handleRemoveFacade}
              handleMediaUpload={handleMediaUpload}
              handleRemoveMedia={handleRemoveMedia}
              onClose={closePinCard}
              categories={categories}
              fetchCategories={fetchCategories}
              validationErrors={validationErrors}
              setValidationErrors={setValidationErrors}
            />
          </Suspense>
        )}

        {/* Add Pin Modal */}
        {showAddPinModal && (
          <Suspense
            fallback={
              <div className="fixed inset-0 flex items-center justify-center z-50">
                Loading…
              </div>
            }
          >
            <AddPinModal
              isAddingPin={isAddingPin}
              setIsAddingPin={setIsAddingPin}
              setShowManualAdd={setShowManualAdd}
              setShowAddPinModal={setShowAddPinModal}
            />
          </Suspense>
        )}

        {/* Manual Add Modal */}
        {showManualAdd && (
          <Suspense
            fallback={
              <div className="fixed inset-0 flex items-center justify-center z-50">
                Loading…
              </div>
            }
          >
            <ManualAddModal
              manualCoords={manualCoords}
              setManualCoords={setManualCoords}
              addPinFromCoords={addPinFromCoords}
              setShowManualAdd={setShowManualAdd}
              setShowAddPinModal={setShowAddPinModal}
            />
          </Suspense>
        )}

        {/* Toolbar */}
        <div className="absolute top-6 right-6 z-[9999] flex items-end space-x-3">
          {showLegend && (
            <div className="absolute right-full mr-3 top-0 bg-white rounded-lg shadow-md w-52 p-4 text-gray-800 animate-fadeIn">
              <h4 className="font-semibold mb-3 text-lg border-b pb-1">
                Map Legend
              </h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center space-x-2">
                  <span className="w-4 h-4 rounded-full bg-red-600 border border-white shadow-sm"></span>
                  <span>Active Site</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-4 h-4 rounded-full bg-blue-600 border border-white shadow-sm"></span>
                  <span>Disabled Site</span>
                </li>
              </ul>
            </div>
          )}

          <div className="flex flex-col items-end space-y-2">
            <div className="bg-white rounded-lg shadow-md flex flex-col overflow-hidden relative z-[9999]">
              <button
                onClick={() => setShowLegend((prev) => !prev)}
                title="Map Legend"
                className={`p-3 w-full transition-colors hover:bg-gray-100 ${
                  showLegend ? "text-white" : "text-gray-700"
                }`}
                style={showLegend ? { backgroundColor: '#f04e37' } : {}}
              >
                <Info className="w-5 h-5 mx-auto" />
              </button>
              <button
                onClick={() => setShowAddPinModal(true)}
                title="Add Pin"
                className={`p-3 w-full transition-colors hover:bg-gray-100 ${
                  isAddingPin || showAddPinModal ? "text-white" : "text-gray-700"
                }`}
                style={isAddingPin || showAddPinModal ? { backgroundColor: '#f04e37' } : {}}
              >
                {isAddingPin ? <MapPinned className="w-5 h-5 mx-auto" /> : <Plus className="w-5 h-5 mx-auto" />}
              </button>
              <button
                onClick={isMaskingMode ? exitMaskEditing : enableMaskEditing}
                title={
                  isMaskingMode ? "Exit Mask Editing" : "Enable Mask Editing"
                }
                className={`p-3 w-full transition-colors hover:bg-gray-100 ${
                  isMaskingMode ? "text-white" : "text-gray-700"
                }`}
                style={isMaskingMode ? { backgroundColor: '#f04e37' } : {}}
              >
                {isMaskingMode ? <X className="w-5 h-5 mx-auto" /> : <Crop className="w-5 h-5 mx-auto" />}
              </button>
              <button
                onClick={() => setShowPinsPanel(!showPinsPanel)}
                title="Manage Pins"
                className={`p-3 w-full transition-colors hover:bg-gray-100 ${
                  showPinsPanel ? "text-white" : "text-gray-700"
                }`}
                style={showPinsPanel ? { backgroundColor: '#f04e37' } : {}}
              >
                <MapPin className="w-5 h-5 mx-auto" />
              </button>
              <button
                onClick={() => setShowCategoryPanel(!showCategoryPanel)}
                title="Manage Categories"
                className={`p-3 w-full transition-colors hover:bg-gray-100 ${
                  showCategoryPanel ? "text-white" : "text-gray-700"
                }`}
                style={showCategoryPanel ? { backgroundColor: '#f04e37' } : {}}
              >
                <Layers className="w-5 h-5 mx-auto" />
              </button>
            </div>

            {isMaskingMode && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden relative z-[9999] w-full">
                <button
                  onClick={saveMask}
                  title="Save Mask"
                  className="p-3 w-full transition-colors hover:bg-gray-100 bg-green-50 text-green-700"
                >
                  <Save className="w-5 h-5 mx-auto" />
                </button>
              </div>
            )}

            {/* Move / Lock Pin */}
            {selectedPin !== null && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden relative z-[9999] w-full">
                <button
                  onClick={() =>
                    setDraggablePinIndex(
                      draggablePinIndex === selectedPin ? null : selectedPin
                    )
                  }
                  title={
                    draggablePinIndex === selectedPin ? "Lock Pin" : "Move Pin"
                  }
                  className={`p-3 w-full text-xl transition-colors hover:bg-gray-100 ${
                    draggablePinIndex === selectedPin
                      ? "bg-yellow-50 text-yellow-600"
                      : "text-gray-700"
                  }`}
                >
                  <FontAwesomeIcon
                    icon={
                      draggablePinIndex === selectedPin ? faLock : faHandPaper
                    }
                  />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Pins Management Modal */}
        {showPinsPanel && (
          <div className="fixed inset-0 bg-black/50 z-[10000] flex items-center justify-center p-4" onClick={() => setShowPinsPanel(false)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="text-white p-5 flex justify-between items-center" style={{ background: 'linear-gradient(to right, #f04e37, #d9442f)' }}>
                <h2 className="text-xl font-bold">Manage Pins</h2>
                <button
                  onClick={() => setShowPinsPanel(false)}
                  className="text-white rounded-full p-1.5 transition"
                  style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.2)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.1)'}
                >
                  <XCircle size={28} />
                </button>
              </div>

              {/* Search and Filter Bar */}
              <div className="p-5 pb-4 space-y-3">
                <div className="flex gap-3">
                  {/* Search Bar */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by site name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-[#f04e37] focus:ring-2 focus:ring-[#f04e37]/20 outline-none transition-all"
                    />
                  </div>
                  
                  {/* Status Filter */}
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="pl-10 pr-8 py-2.5 border-2 border-gray-200 rounded-lg focus:border-[#f04e37] focus:ring-2 focus:ring-[#f04e37]/20 outline-none transition-all appearance-none bg-white cursor-pointer"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  
                  {/* Category Filter */}
                  <div className="relative">
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-[#f04e37] focus:ring-2 focus:ring-[#f04e37]/20 outline-none transition-all appearance-none bg-white cursor-pointer"
                    >
                      <option value="all">All Categories</option>
                      {categories.map((cat) => (
                        <option key={cat._id} value={cat._id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="px-5 pb-4">
                <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
                  <button
                    onClick={() => setActiveTab("active")}
                    className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                      activeTab === "active"
                        ? "bg-white text-[#f04e37] shadow-md"
                        : "text-gray-600 hover:text-gray-800"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Active</span>
                    <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                      activeTab === "active" 
                        ? "bg-[#f04e37] text-white" 
                        : "bg-gray-200 text-gray-600"
                    }`}>
                      {pins.length}
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab("archived")}
                    className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                      activeTab === "archived"
                        ? "bg-white text-[#f04e37] shadow-md"
                        : "text-gray-600 hover:text-gray-800"
                    }`}
                  >
                    <Archive className="w-4 h-4" />
                    <span>Archived</span>
                    <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                      activeTab === "archived" 
                        ? "bg-[#f04e37] text-white" 
                        : "bg-gray-200 text-gray-600"
                    }`}>
                      {archivedPins.length}
                    </span>
                  </button>
                </div>
              </div>

              {/* Pins Grid */}
              <div className="flex-1 overflow-y-auto p-5 min-h-[500px]">
                {activeTab === "active" ? (
                  (() => {
                    // Filter pins based on search and filters
                    const filteredPins = pins.filter((pin) => {
                      // Search filter
                      const matchesSearch = pin.siteName?.toLowerCase().includes(searchQuery.toLowerCase());
                      
                      // Status filter
                      const matchesStatus = filterStatus === "all" || 
                        (filterStatus === "active" && (!pin.status || pin.status === "active")) ||
                        (filterStatus === "inactive" && pin.status === "inactive");
                      
                      // Category filter
                      const matchesCategory = filterCategory === "all" || pin.category === filterCategory;
                      
                      return matchesSearch && matchesStatus && matchesCategory;
                    });
                    
                    return filteredPins.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20">
                        <MapPin className="w-16 h-16 text-gray-300 mb-3" />
                        <p className="text-gray-500 text-lg">
                          {searchQuery || filterStatus !== "all" || filterCategory !== "all" 
                            ? "No pins match your filters" 
                            : "No active pins"}
                        </p>
                        {(searchQuery || filterStatus !== "all" || filterCategory !== "all") && (
                          <button
                            onClick={() => {
                              setSearchQuery("");
                              setFilterStatus("all");
                              setFilterCategory("all");
                            }}
                            className="mt-3 px-4 py-2 bg-[#f04e37] text-white rounded-lg hover:bg-[#e03d2d] transition"
                          >
                            Clear Filters
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredPins.map((pin, index) => (
                        <div
                          key={pin._id || `pin-${index}`}
                          className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all flex flex-col"
                          style={{ borderColor: '#e5e7eb' }}
                          onMouseEnter={(e) => e.currentTarget.style.borderColor = '#f04e37'}
                          onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                        >
                          {/* Pin Image */}
                          <div className="h-40 bg-gray-100 overflow-hidden flex-shrink-0">
                            {(pin.mediaFiles?.[0]?.url || pin.mediaUrl) ? (
                              <img
                                src={pin.mediaFiles?.[0]?.url || pin.mediaUrl}
                                alt={pin.siteName}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                <MapPin className="w-12 h-12 text-gray-400" />
                              </div>
                            )}
                          </div>
                          
                          {/* Card Content */}
                          <div className="p-4 flex-1 flex flex-col">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h3 className="font-bold text-gray-800 text-base">
                                {pin.siteName || `Pin #${index + 1}`}
                              </h3>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-semibold capitalize flex-shrink-0 ${
                                  pin.status === "inactive"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-green-100 text-green-700"
                                }`}
                              >
                                {pin.status || "active"}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
                              <MapPinned className="w-3 h-3" />
                              <span>{pin.latitude.toFixed(4)}, {pin.longitude.toFixed(4)}</span>
                            </div>
                            
                            {/* Badges at top */}
                            <div className="flex flex-wrap gap-2 mb-3 text-xs">
                              {pin.arEnabled && (
                                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-medium flex items-center gap-1">
                                  <Sparkles className="w-3 h-3" />
                                  <span>AR Enabled</span>
                                </span>
                              )}
                              {pin.mediaFiles && pin.mediaFiles.length > 0 && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium flex items-center gap-1">
                                  <Camera className="w-3 h-3" />
                                  <span>{pin.mediaFiles.length} media</span>
                                </span>
                              )}
                            </div>
                            
                            <p className="text-sm text-gray-600 line-clamp-2 mb-3 min-h-[2.5rem]">
                              {(() => {
                                if (!pin.siteDescription) return "No description available";
                                // Get first paragraph/section (split by double newline or first section)
                                const firstSection = pin.siteDescription.split(/\n\n|\n\s*\n/)[0];
                                return firstSection || pin.siteDescription;
                              })()}
                            </p>
                            
                            {/* Buttons - Original Design */}
                            <div className="flex gap-2 mt-auto">
                              <button
                                onClick={() => { setShowPinsPanel(false); openPinCard(index); }}
                                className="flex-1 flex items-center justify-center gap-1.5 bg-yellow-500 hover:bg-yellow-600 text-white text-sm py-2 px-3 rounded-lg transition font-semibold shadow-sm"
                              >
                                <Edit size={16} />
                                Edit
                              </button>
                              <button
                                onClick={() => handleArchive(pin._id)}
                                className="flex-1 flex items-center justify-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm py-2 px-3 rounded-lg transition font-semibold shadow-sm"
                              >
                                <Archive size={16} />
                                Archive
                              </button>
                            </div>
                          </div>
                        </div>
                        ))}
                      </div>
                    );
                  })()
                ) : (
                  archivedPins.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20">
                      <Archive className="w-16 h-16 text-gray-300 mb-3" />
                      <p className="text-gray-500 text-lg">No archived pins</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {archivedPins.map((pin) => (
                        <div
                          key={pin._id}
                          className="bg-gray-50 border-2 border-gray-300 rounded-xl overflow-hidden opacity-80 flex flex-col h-full"
                        >
                          {/* Pin Image */}
                          <div className="h-32 bg-gray-200 overflow-hidden flex-shrink-0">
                            {(pin.mediaFiles?.[0]?.url || pin.mediaUrl) ? (
                              <img
                                src={pin.mediaFiles?.[0]?.url || pin.mediaUrl}
                                alt={pin.siteName}
                                className="w-full h-full object-cover grayscale"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-300">
                                <MapPin className="w-12 h-12 text-gray-500" />
                              </div>
                            )}
                          </div>
                          
                          <div className="p-4 flex-1 flex flex-col">
                            <h3 className="font-bold text-gray-600 text-base mb-2">
                              {pin.siteName}
                            </h3>
                            
                            <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                              <MapPinned className="w-3 h-3" />
                              <span>{pin.latitude.toFixed(4)}, {pin.longitude.toFixed(4)}</span>
                            </div>
                            
                            {pin.siteDescription && (
                              <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                                {pin.siteDescription}
                              </p>
                            )}
                            
                            <div className="flex flex-wrap gap-2 mb-3 text-xs">
                              {pin.arEnabled && (
                                <span className="px-2 py-1 bg-gray-200 text-gray-600 rounded-full font-medium flex items-center gap-1">
                                  <Sparkles className="w-3 h-3" />
                                  <span>AR Enabled</span>
                                </span>
                              )}
                              {pin.mediaFiles && pin.mediaFiles.length > 0 && (
                                <span className="px-2 py-1 bg-gray-200 text-gray-600 rounded-full font-medium flex items-center gap-1">
                                  <Camera className="w-3 h-3" />
                                  <span>{pin.mediaFiles.length} media</span>
                                </span>
                              )}
                            </div>
                            
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleRestore(pin._id)}
                                className="flex-1 flex items-center justify-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-sm py-2 px-3 rounded-lg transition font-semibold shadow-sm"
                              >
                                <RotateCcw size={16} />
                                Restore
                              </button>
                              <button
                                onClick={() => handlePermanentDelete(pin._id)}
                                className="flex-1 flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-sm py-2 px-3 rounded-lg transition font-semibold shadow-sm"
                              >
                                <Trash2 size={16} />
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {/* Category Management Modal */}
        {showCategoryPanel && (
          <div className="fixed inset-0 bg-black/50 z-[10000] flex items-center justify-center p-4" onClick={() => setShowCategoryPanel(false)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="text-white p-5 flex justify-between items-center" style={{ background: 'linear-gradient(to right, #f04e37, #d9442f)' }}>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Layers className="w-6 h-6" />
                  Manage Categories
                </h2>
                <button
                  onClick={() => setShowCategoryPanel(false)}
                  className="text-white rounded-full p-1.5 transition"
                  style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.2)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.1)'}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {/* Add/Edit Form */}
                <form onSubmit={handleCategorySubmit} className="mb-6 p-4 rounded-lg border-2" style={{ backgroundColor: '#fef2f0', borderColor: '#f9c5bd' }}>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    {editCategoryId ? "Edit Category" : "Add New Category"}
                  </h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({ name: e.target.value })}
                      placeholder="Category name"
                      className="flex-1 border-2 border-gray-300 rounded-lg outline-none transition text-gray-700 bg-white p-2 text-sm"
                      style={{ focusBorderColor: '#f04e37' }}
                      onFocus={(e) => { e.target.style.borderColor = '#f04e37'; e.target.style.boxShadow = '0 0 0 3px rgba(240, 78, 55, 0.1)'; }}
                      onBlur={(e) => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; }}
                    />
                    <button
                      type="submit"
                      className="flex items-center gap-1.5 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm hover:shadow-md transition"
                      style={{ backgroundColor: '#f04e37' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#d9442f'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f04e37'}
                    >
                      {editCategoryId ? <Check size={16} /> : <Plus size={16} />}
                      {editCategoryId ? "Update" : "Add"}
                    </button>
                    {editCategoryId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditCategoryId(null);
                          setCategoryForm({ name: "" });
                        }}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-600 bg-white hover:bg-gray-100 hover:text-gray-700 transition shadow-sm"
                      >
                        <X size={16} />
                        Cancel
                      </button>
                    )}
                  </div>
                </form>

                {/* Categories List */}
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    All Categories ({categories.length})
                  </h3>
                  {categories.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No categories yet. Add one above!</p>
                  ) : (
                    categories.map((category) => (
                      <div
                        key={category._id}
                        className="flex justify-between items-center bg-white border-2 border-gray-200 p-4 rounded-lg transition-all"
                        style={{ borderColor: '#e5e7eb' }}
                        onMouseEnter={(e) => e.currentTarget.style.borderColor = '#f04e37'}
                        onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                      >
                        <span className="text-gray-800 font-medium">{category.name}</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleCategoryEdit(category)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-400 hover:bg-yellow-500 text-white rounded-lg text-sm font-medium transition shadow-sm hover:shadow-md"
                          >
                            <Edit size={14} />
                            Edit
                          </button>
                          <button
                            onClick={() => handleCategoryDelete(category._id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition shadow-sm hover:shadow-md"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="absolute bottom-0 w-full bg-orange-600 text-white text-center py-2 font-bold z-10">
          Tour Map
        </div>
      </div>
    </div>
    </>
  );
}
