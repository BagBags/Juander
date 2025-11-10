import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import MainLayout from "../MainLayout";
import BackHeader from "../BackButton";
import ttsService from "../../../utils/textToSpeech";
import { useTranslation } from "react-i18next";
import OnlineRequiredModal from "../../shared/OnlineRequiredModal";
import ConfirmModal from "../../shared/ConfirmModal";
import {
  FaCheck,
  FaPlus,
  FaChevronDown,
  FaChevronUp,
  FaTrash,
  FaEdit,
} from "react-icons/fa";
import { Info, X } from "lucide-react";

function FortSantiagoModal({ isOpen, onClose, onDontShowAgain }) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleClose = async () => {
    if (dontShowAgain && onDontShowAgain) {
      await onDontShowAgain();
    }
    onClose();
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
        <div className="bg-[#f04e37] p-4 flex items-center gap-3">
          <Info className="text-white w-7 h-7" />
          <h2 className="text-lg font-semibold text-white">
            Fort Santiago Notice
          </h2>
        </div>

        <div className="p-6">
          <p className="text-gray-700 mb-4 text-sm leading-relaxed">
            You've selected a site inside Fort Santiago.
          </p>

          <div className="bg-orange-50 p-4 rounded-lg flex items-start gap-3 mb-5">
            <div className="w-2 h-2 bg-[#f04e37] rounded-full mt-1.5 flex-shrink-0"></div>
            <div className="flex-1">
              <p className="text-gray-700 text-sm leading-relaxed mb-2">
                An entrance fee is required to access Fort Santiago and its sites.
              </p>
              <p className="text-xs text-gray-600 leading-relaxed">
                Please purchase tickets at the Fort Santiago entrance before visiting.
              </p>
            </div>
          </div>

          <div className="mb-4">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="w-4 h-4 text-[#f04e37] border-gray-300 rounded focus:ring-[#f04e37] cursor-pointer"
              />
              <span className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors">
                Don't show this again
              </span>
            </label>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2.5 bg-[#f04e37] hover:bg-[#c53d27] text-white font-medium rounded-lg transition-colors text-sm"
            >
              I Understand
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CreateItineraryPage() {
  const { t } = useTranslation();
  const [selected, setSelected] = useState([]);
  const [userItineraries, setUserItineraries] = useState([]);
  const [itineraryName, setItineraryName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [editingItineraryId, setEditingItineraryId] = useState(null);
  const [sites, setSites] = useState([]);
  const [descriptionToggles, setDescriptionToggles] = useState({});
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [activeTab, setActiveTab] = useState("create"); // "create" or "myItineraries"
  const [showFortModal, setShowFortModal] = useState(false);
  const [offlineMessage, setOfflineMessage] = useState("");
  const [hideFortModalPreference, setHideFortModalPreference] = useState(false);
  const [showDeleteImageModal, setShowDeleteImageModal] = useState(false);

  const token = localStorage.getItem("token");
  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    ttsService.speak(t("tts_createItinerary"));
    fetchSites();
    fetchItineraries();
    fetchUserPreference();
  }, [t]);

  const fetchUserPreference = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/auth/me`,
        config
      );
      setHideFortModalPreference(res.data.hideFortSantiagoModal || false);
    } catch (err) {
      console.error("Error fetching user preference:", err);
    }
  };

  const fetchSites = async () => {
    try {
      const res = await axios.get(
        `${
          import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
        }/pins`
      );
      setSites(res.data);
    } catch {
      alert("Failed to load sites");
    }
  };

  const fetchItineraries = async () => {
    try {
      const res = await axios.get(
        `${
          import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
        }/itineraries`,
        config
      );
      setUserItineraries(res.data.filter((i) => !i.isAdminCreated));
    } catch {
      alert("Failed to load itineraries");
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await axios.post(
        `${
          import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
        }/userItineraries/upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setImageUrl(res.data.imageUrl);
    } catch (err) {
      console.error("Upload failed", err);
      alert("Image upload failed");
    }
  };

  const handleDeleteImage = async () => {
    try {
      // If there's an imageUrl, delete from server
      if (imageUrl) {
        await axios.delete(
          `${
            import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
          }/userItineraries/delete-image`,
          {
            headers: { Authorization: `Bearer ${token}` },
            data: { imageUrl }
          }
        );
      }
      setImageUrl("");
      setShowDeleteImageModal(false);
    } catch (err) {
      console.error("Failed to delete image:", err);
      alert("Failed to delete image");
    }
  };

  const getFullImageUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `${
      import.meta.env.VITE_API_BASE_URL?.replace("/api", "") ||
      "http://localhost:5000"
    }${url}`;
  };

  const toggleSelection = (siteId) => {
    const site = sites.find((s) => s._id === siteId);
    
    if (site?.insideFortSantiago && !selected.includes(siteId) && !hideFortModalPreference) {
      // Only show modal when adding a Fort Santiago site and user hasn't disabled it
      setShowFortModal(true);
    }
    setSelected((prev) =>
      prev.includes(siteId)
        ? prev.filter((id) => id !== siteId)
        : [...prev, siteId]
    );
  };

  const handleDontShowAgain = async () => {
    try {
      await axios.put(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/auth/fort-santiago-modal`,
        { hideFortSantiagoModal: true },
        config
      );
      setHideFortModalPreference(true);
    } catch (err) {
      console.error("Error updating preference:", err);
    }
  };

  const handleSave = async () => {
    // Check if offline
    if (!navigator.onLine) {
      setOfflineMessage(
        editingItineraryId
          ? "Updating itineraries requires an internet connection"
          : "Creating itineraries requires an internet connection"
      );
      setShowOfflineModal(true);
      return;
    }

    if (!itineraryName.trim() || selected.length === 0)
      return alert("Enter name & select sites");

    const payload = {
      name: itineraryName.trim(),
      imageUrl: imageUrl ? imageUrl.trim() : "", // Ensure empty string if no image
      sites: selected,
      isAdminCreated: false,
    };

    try {
      if (editingItineraryId) {
        await axios.put(
          `${
            import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
          }/itineraries/${editingItineraryId}`,
          payload,
          config
        );
        alert("Itinerary updated successfully");
      } else {
        await axios.post(
          `${
            import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
          }/itineraries`,
          payload,
          config
        );
        alert("Itinerary created successfully");
      }
      resetForm();
      fetchItineraries();
    } catch (err) {
      console.error("Save error:", err);
      // Check if it's a network error
      if (!navigator.onLine || err.message === "Network Error") {
        setOfflineMessage(
          "Lost connection while saving. Please try again when online."
        );
        setShowOfflineModal(true);
      } else {
        alert("Failed to save itinerary");
      }
    }
  };

  const handleDelete = async (id) => {
    // Check if offline
    if (!navigator.onLine) {
      setOfflineMessage("Deleting itineraries requires an internet connection");
      setShowOfflineModal(true);
      return;
    }

    if (!confirm("Delete this itinerary?")) return;
    try {
      await axios.delete(
        `${
          import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
        }/itineraries/${id}`,
        config
      );
      setUserItineraries(userItineraries.filter((i) => i._id !== id));
    } catch (err) {
      if (!navigator.onLine || err.message === "Network Error") {
        setOfflineMessage(
          "Lost connection while deleting. Please try again when online."
        );
        setShowOfflineModal(true);
      } else {
        alert("Failed to delete itinerary");
      }
    }
  };

  const handleEdit = (itinerary) => {
    setEditingItineraryId(itinerary._id);
    setItineraryName(itinerary.name);
    setImageUrl(itinerary.imageUrl || "");
    setSelected(itinerary.sites.map((s) => s._id));
    setActiveTab("create"); // Switch to Create tab
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelUpdate = () => resetForm();

  const resetForm = () => {
    setEditingItineraryId(null);
    setItineraryName("");
    setSelected([]);
    setImageUrl("");
  };

  const toggleExpand = (idx) =>
    setExpandedIndex(expandedIndex === idx ? null : idx);
  const toggleDescription = (id) =>
    setDescriptionToggles((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-500 via-[#f04e37] to-orange-600 flex flex-col relative">
      {/* Fort Santiago Modal */}
      {showFortModal && (
        <FortSantiagoModal
          isOpen={showFortModal}
          onClose={() => setShowFortModal(false)}
          onDontShowAgain={handleDontShowAgain}
        />
      )}
      
      {/* Delete Image Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteImageModal}
        onClose={() => setShowDeleteImageModal(false)}
        onConfirm={handleDeleteImage}
        title="Delete Image?"
        message="Are you sure you want to remove this image? This action cannot be undone."
        confirmText="Delete Image"
        type="danger"
      />
      
      {/* Global TTS Button */}

      {/* === STICKY BACKHEADER === */}
      <div 
        className="sticky top-0 z-20 bg-[#f04e37] border-b border-white/20"
        style={{
          paddingTop: "max(env(safe-area-inset-top), 16px)",
          paddingBottom: "8px",
          paddingLeft: "16px",
          paddingRight: "16px"
        }}
      >
        <BackHeader title="Itinerary Manager" />
      </div>

      {/* === TAB NAVIGATION === */}
      <div className="px-4 pt-6 pb-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative bg-white/10 backdrop-blur-md rounded-2xl p-1.5 border border-white/20">
            {/* Sliding Background */}
            <div
              className="absolute top-1.5 bottom-1.5 w-[calc(50%-0.375rem)] bg-white rounded-xl shadow-lg transition-transform duration-300 ease-out"
              style={{
                transform: activeTab === "create" ? "translateX(0)" : "translateX(calc(100% + 0.75rem))"
              }}
            />
            
            {/* Tab Buttons */}
            <div className="relative grid grid-cols-2 gap-1.5">
              <button
                onClick={() => setActiveTab("create")}
                className={`py-3 px-4 rounded-xl font-bold text-base transition-colors duration-300 ${
                  activeTab === "create"
                    ? "text-[#f04e37]"
                    : "text-white hover:text-white/80"
                }`}
              >
                {editingItineraryId ? "Update Itinerary" : "Create Itinerary"}
              </button>
              <button
                onClick={() => setActiveTab("myItineraries")}
                className={`py-3 px-4 rounded-xl font-bold text-base transition-colors duration-300 ${
                  activeTab === "myItineraries"
                    ? "text-[#f04e37]"
                    : "text-white hover:text-white/80"
                }`}
              >
                My Itineraries
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* === MAIN CONTENT === */}
      <MainLayout includeSideButtons={false}>
        <div className="flex-1 w-full max-w-6xl mx-auto px-4 pb-8">
          {/* CREATE ITINERARY TAB */}
          {activeTab === "create" && (
            <div className="space-y-6 animate-fadeIn">
              {/* Form Section */}
              <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-2xl border border-white/20">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <span className="w-2 h-8 bg-gradient-to-b from-[#f04e37] to-orange-600 rounded-full"></span>
                  {editingItineraryId ? "Update Your Itinerary" : "Create New Itinerary"}
                </h2>
                
                <div className="space-y-4">
                  {/* Itinerary Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Itinerary Name *
                    </label>
                    <input
                      type="text"
                      value={itineraryName}
                      onChange={(e) => setItineraryName(e.target.value)}
                      placeholder="e.g., Historical Tour, Weekend Adventure"
                      className="w-full px-4 py-3 rounded-xl bg-white text-gray-900 placeholder-gray-400 border-2 border-gray-200 focus:border-[#f04e37] focus:ring-2 focus:ring-[#f04e37]/20 transition-all outline-none"
                    />
                  </div>

                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Cover Image (Optional)
                    </label>
                    {imageUrl ? (
                      <div className="relative group">
                        <img
                          src={getFullImageUrl(imageUrl)}
                          alt="Itinerary Preview"
                          className="w-full h-48 object-cover rounded-xl border-2 border-gray-200"
                        />
                        <button
                          onClick={() => setShowDeleteImageModal(true)}
                          className="absolute top-3 right-3 bg-red-500 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-red-600 shadow-lg transition opacity-0 group-hover:opacity-100"
                          title="Remove image"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl hover:border-[#f04e37] hover:bg-gray-50 transition-all group">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-10 h-10 text-gray-400 group-hover:text-[#f04e37] transition-colors"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span className="mt-2 text-sm text-gray-500 group-hover:text-[#f04e37] transition-colors">
                          Click to upload cover image
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {/* Selected Sites Counter */}
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200">
                    <span className="text-sm font-semibold text-gray-700">
                      Sites Selected
                    </span>
                    <span className="text-2xl font-bold text-[#f04e37]">
                      {selected.length}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleSave}
                      className="flex-1 bg-gradient-to-r from-[#f04e37] to-orange-600 text-white font-bold py-3.5 px-6 rounded-xl hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all duration-200"
                    >
                      {editingItineraryId ? "Update Itinerary" : "Save Itinerary"}
                    </button>
                    {editingItineraryId && (
                      <button
                        onClick={handleCancelUpdate}
                        className="px-6 py-3.5 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition-all"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Available Sites Section */}
              <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-2xl border border-white/20">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <span className="w-2 h-8 bg-gradient-to-b from-[#f04e37] to-orange-600 rounded-full"></span>
                  Available Sites
                </h2>
                
                <SmoothScrollSiteList
                  sites={sites}
                  selected={selected}
                  descriptionToggles={descriptionToggles}
                  toggleDescription={toggleDescription}
                  toggleSelection={toggleSelection}
                  getFullImageUrl={getFullImageUrl}
                />
              </div>
            </div>
          )}

          {/* MY ITINERARIES TAB */}
          {activeTab === "myItineraries" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-2xl border border-white/20">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <span className="w-2 h-8 bg-gradient-to-b from-[#f04e37] to-orange-600 rounded-full"></span>
                  My Itineraries
                </h2>
                
                {userItineraries.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-lg font-medium mb-2">
                      No itineraries yet
                    </p>
                    <p className="text-gray-400 text-sm mb-6">
                      Create your first itinerary to get started
                    </p>
                    <button
                      onClick={() => setActiveTab("create")}
                      className="bg-gradient-to-r from-[#f04e37] to-orange-600 text-white font-bold py-3 px-8 rounded-xl hover:shadow-xl hover:scale-105 transition-all"
                    >
                      Create Itinerary
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userItineraries.map((itinerary, idx) => (
                      <ItineraryCard
                        key={itinerary._id}
                        itinerary={itinerary}
                        expanded={expandedIndex === idx}
                        toggleExpand={() => toggleExpand(idx)}
                        handleDelete={handleDelete}
                        handleEdit={handleEdit}
                        getFullImageUrl={getFullImageUrl}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </MainLayout>

      <footer className="text-center text-xs text-white/60 py-6 mt-auto">
        ©2025 Intramuros Administration
      </footer>

      {/* Offline Modal */}
      <OnlineRequiredModal
        isOpen={showOfflineModal}
        onClose={() => setShowOfflineModal(false)}
        message={offlineMessage}
        showLoginOption={false}
      />
    </div>
  );
}

/* === SmoothScrollSiteList Component === */
function SmoothScrollSiteList({
  sites,
  selected,
  descriptionToggles,
  toggleDescription,
  toggleSelection,
  getFullImageUrl,
}) {
  const scrollContainerRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight - container.clientHeight;
      const progress = scrollHeight > 0 ? scrollTop / scrollHeight : 0;
      setScrollProgress(progress);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      ref={scrollContainerRef}
      className="overflow-y-auto max-h-[600px]"
      style={{ 
        scrollBehavior: "smooth",
        scrollSnapType: "y mandatory", // Enable vertical scroll snapping
        scrollPaddingTop: "calc(50% - 200px)", // Center items in viewport (adjusted for card height)
        scrollPaddingBottom: "calc(50% - 200px)"
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4" style={{ paddingBottom: "300px" }}>
        {sites.map((site, index) => (
          <SiteCard
            key={site._id}
            site={site}
            index={index}
            totalSites={sites.length}
            scrollProgress={scrollProgress}
            isSelected={selected.includes(site._id)}
            isExpanded={descriptionToggles[site._id]}
            toggleDescription={toggleDescription}
            toggleSelection={toggleSelection}
            getFullImageUrl={getFullImageUrl}
          />
        ))}
      </div>
    </div>
  );
}

/* === SiteCard Component with Smooth Animations === */
function SiteCard({
  site,
  index,
  totalSites,
  scrollProgress,
  isSelected,
  isExpanded,
  toggleDescription,
  toggleSelection,
  getFullImageUrl,
}) {
  const cardRef = useRef(null);
  const [isInView, setIsInView] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [cardStyle, setCardStyle] = useState({
    opacity: 1,
    transform: "scale(1)",
  });

  // Detect if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      {
        threshold: [0, 0.25, 0.5, 0.75, 1],
        rootMargin: "-10% 0px -10% 0px",
      }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!cardRef.current || !isMobile) {
      // On desktop, keep default style
      setCardStyle({
        opacity: 1,
        transform: "scale(1)",
      });
      return;
    }

    const card = cardRef.current;
    const container = card.closest(".overflow-y-auto");
    if (!container) return;

    const updateCardStyle = () => {
      const cardRect = card.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      // Calculate distance from the CENTER of the container
      const containerCenter = containerRect.top + containerRect.height / 2;
      const cardCenter = cardRect.top + cardRect.height / 2;
      const distanceFromCenter = Math.abs(cardCenter - containerCenter);
      const cardHeight = cardRect.height;

      // Define the glow zone (centered around middle of container)
      const glowZoneRadius = cardHeight * 1.5;

      if (distanceFromCenter < glowZoneRadius) {
        // Card is in the glow zone near the center
        const normalizedPosition = distanceFromCenter / glowZoneRadius;

        // Full glow at center (0), fades as it moves away
        const opacity = 1 - normalizedPosition * 0.6;
        const scale = 1.05 - normalizedPosition * 0.15;

        setCardStyle({
          opacity: Math.max(0.4, opacity),
          transform: `scale(${Math.max(0.9, scale)})`,
        });
      } else {
        // Cards outside glow zone have reduced opacity/scale
        setCardStyle({
          opacity: 0.4,
          transform: "scale(0.9)",
        });
      }
    };

    const handleScroll = () => {
      requestAnimationFrame(updateCardStyle);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    updateCardStyle(); // Initial calculation

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [isInView, isMobile]);

  return (
    <div
      ref={cardRef}
      className="bg-white rounded-2xl shadow-lg hover:shadow-xl p-4 flex flex-col h-full transition-all duration-300 ease-out border border-gray-100"
      style={{
        opacity: isMobile ? cardStyle.opacity : 1,
        transform: isMobile ? cardStyle.transform : "scale(1)",
        scrollSnapAlign: "center", // Snap to center of viewport
      }}
    >
      <div className="relative mb-3 overflow-hidden rounded-xl group">
        <img
          src={
            site.mediaFiles?.find((m) => m.type === "image")?.url
              ? getFullImageUrl(
                  site.mediaFiles.find((m) => m.type === "image").url
                )
              : site.mediaUrl
              ? getFullImageUrl(site.mediaUrl)
              : "https://via.placeholder.com/150"
          }
          alt={site.siteName}
          className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            e.currentTarget.src = "https://via.placeholder.com/150";
          }}
        />
        {isSelected && (
          <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg">
            <FaCheck className="text-sm" />
          </div>
        )}
      </div>
      
      <h3 className="font-bold text-gray-800 text-base mb-2 line-clamp-2 min-h-[3rem]">
        {site.siteName}
      </h3>
      
      <div
        className={`text-gray-600 text-sm mb-3 flex-grow space-y-1 ${
          !isExpanded ? "line-clamp-3" : ""
        }`}
      >
        {site.siteDescription ? (
          site.siteDescription
            .split("\n\n")
            .map((paragraph, index) => <p key={index}>{paragraph.trim()}</p>)
        ) : (
          <p className="text-gray-400 italic">No description available</p>
        )}
      </div>
      
      {site.siteDescription && site.siteDescription.length > 100 && (
        <button
          className="text-sm text-[#f04e37] font-semibold mb-3 text-left hover:text-orange-600 transition-colors"
          onClick={() => toggleDescription(site._id)}
        >
          {isExpanded ? "Read less" : "Read more"}
        </button>
      )}
      
      <button
        onClick={() => toggleSelection(site._id)}
        className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-sm transition-all duration-200 ${
          isSelected
            ? "bg-green-500 text-white hover:bg-green-600"
            : "bg-gradient-to-r from-[#f04e37] to-orange-600 text-white hover:shadow-lg hover:scale-[1.02] active:scale-95"
        }`}
      >
        {isSelected ? (
          <>
            <FaCheck className="text-sm" /> Added to Itinerary
          </>
        ) : (
          <>
            <FaPlus className="text-sm" /> Add to Itinerary
          </>
        )}
      </button>
    </div>
  );
}

/* === ItineraryCard Component === */
function ItineraryCard({
  itinerary,
  expanded,
  toggleExpand,
  handleDelete,
  handleEdit,
  getFullImageUrl,
}) {
  const [descExpanded, setDescExpanded] = useState({});
  const toggleSiteDescription = (idx) =>
    setDescExpanded((prev) => ({ ...prev, [idx]: !prev[idx] }));

  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden">
      {/* Horizontal Layout */}
      <div className="flex flex-col md:flex-row">
        {/* Image Section */}
        {itinerary.imageUrl && (
          <div className="relative w-full md:w-64 h-48 md:h-auto flex-shrink-0">
            <img
              src={getFullImageUrl(itinerary.imageUrl)}
              alt={itinerary.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/40 to-transparent"></div>
          </div>
        )}

        {/* Content Section */}
        <div className="flex-1 p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="font-bold text-2xl text-gray-800 mb-2">{itinerary.name}</h3>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 bg-orange-50 text-[#f04e37] px-3 py-1 rounded-full text-sm font-semibold">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                  </svg>
                  {itinerary.sites?.length || 0} {itinerary.sites?.length === 1 ? "site" : "sites"}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(itinerary)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-all"
              >
                <FaEdit className="text-sm" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => handleDelete(itinerary._id)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-all"
              >
                <FaTrash className="text-sm" />
                <span>Delete</span>
              </button>
            </div>
            <button
              onClick={toggleExpand}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-[#f04e37] to-orange-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
            >
              {expanded ? (
                <>
                  <FaChevronUp className="text-sm" />
                  <span>Hide Sites</span>
                </>
              ) : (
                <>
                  <FaChevronDown className="text-sm" />
                  <span>View Sites ({itinerary.sites?.length || 0})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Expanded Sites List */}
      {expanded && itinerary.sites?.length > 0 && (
        <div className="border-t border-gray-200 bg-gray-50 p-6 animate-fadeIn">
          <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Included Sites</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {itinerary.sites.map((site, idx) => {
              const expandedDesc = descExpanded[idx];
              return (
                <div
                  key={idx}
                  className="flex items-start gap-3 bg-white p-3 rounded-lg border border-gray-200 hover:border-orange-300 hover:shadow-sm transition-all"
                >
                  <img
                    src={
                      site.mediaFiles?.find((m) => m.type === "image")?.url
                        ? getFullImageUrl(
                            site.mediaFiles.find((m) => m.type === "image").url
                          )
                        : site.mediaUrl
                        ? getFullImageUrl(site.mediaUrl)
                        : "https://via.placeholder.com/60"
                    }
                    alt={site.siteName}
                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                    onError={(e) => {
                      e.currentTarget.src = "https://via.placeholder.com/60";
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <h5 className="font-semibold text-gray-800 text-sm mb-1 line-clamp-1">{site.siteName}</h5>
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {site.siteDescription || "No description available"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
