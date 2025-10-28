import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import MainLayout from "../MainLayout";
import BackHeader from "../BackButton";
import ttsService from "../../../utils/textToSpeech";
import GlobalTTSButton from "../../GlobalTTSButton";
import { useTranslation } from "react-i18next";
import OnlineRequiredModal from "../../shared/OnlineRequiredModal";
import {
  FaCheck,
  FaPlus,
  FaChevronDown,
  FaChevronUp,
  FaTrash,
  FaEdit,
} from "react-icons/fa";

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
  const [showMyItineraries, setShowMyItineraries] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(true);
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [offlineMessage, setOfflineMessage] = useState("");

  const token = localStorage.getItem("token");
  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    ttsService.speak(t('tts_createItinerary'));
    fetchSites();
    fetchItineraries();
  }, [t]);

  const fetchSites = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/pins");
      setSites(res.data);
    } catch {
      alert("Failed to load sites");
    }
  };

  const fetchItineraries = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/itineraries",
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
        "http://localhost:5000/api/userItineraries/upload",
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

  const getFullImageUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `http://localhost:5000${url}`;
  };

  const toggleSelection = (siteId) =>
    setSelected((prev) =>
      prev.includes(siteId)
        ? prev.filter((id) => id !== siteId)
        : [...prev, siteId]
    );

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
          `http://localhost:5000/api/itineraries/${editingItineraryId}`,
          payload,
          config
        );
        alert("Itinerary updated successfully");
      } else {
        await axios.post(
          "http://localhost:5000/api/itineraries",
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
      if (!navigator.onLine || err.message === 'Network Error') {
        setOfflineMessage("Lost connection while saving. Please try again when online.");
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
      await axios.delete(`http://localhost:5000/api/itineraries/${id}`, config);
      setUserItineraries(userItineraries.filter((i) => i._id !== id));
    } catch (err) {
      if (!navigator.onLine || err.message === 'Network Error') {
        setOfflineMessage("Lost connection while deleting. Please try again when online.");
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
    window.scrollTo({ top: 0, behavior: "smooth" });
    setShowMyItineraries(false);
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
    <div className="h-screen flex flex-col bg-[#f04e37] text-white overflow-hidden scroll-smooth">
      {/* Global TTS Button */}
      <GlobalTTSButton />

      {/* === STICKY BACKHEADER + FILE + NAME + SELECTED === */}
      <div className="sticky top-0 z-40 bg-[#f04e37] px-3 py-3 pt-3">
        <BackHeader title="Create Itinerary" />
      </div>
      
      {/* Mobile: Collapsible Toggle Button */}
      <div className="lg:hidden bg-[#f04e37] px-3 py-2">
        <button
          onClick={() => setShowCreateForm((prev) => !prev)}
          className="w-full flex justify-between items-center font-bold text-white text-lg p-3 rounded-lg bg-white/10 hover:bg-white/20 transition"
        >
          <span>{editingItineraryId ? "Update Itinerary" : "Create Itinerary"}</span>
          {showCreateForm ? <FaChevronUp /> : <FaChevronDown />}
        </button>
      </div>

      <div className={`bg-[#f04e37] px-3 transition-all duration-300 ease-in-out ${
        showCreateForm ? 'py-3' : 'max-h-0 overflow-hidden lg:max-h-none lg:py-3'
      }`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col gap-3">
            {/* Mobile: Name and Selected Sites first */}
            <div className="flex flex-col gap-3 lg:hidden">
              {/* Itinerary name */}
              <input
                type="text"
                value={itineraryName}
                onChange={(e) => setItineraryName(e.target.value)}
                placeholder="Enter itinerary name"
                className="w-full px-4 py-3 rounded-lg bg-white text-gray-900 placeholder-gray-500 shadow-md focus:ring-2 focus:ring-[#f4cc27] text-base"
              />

              {/* Selected Sites summary with buttons */}
              <div className="flex flex-row items-center justify-between bg-white/20 rounded-lg px-4 py-3 gap-3">
                <span className="font-semibold text-base">
                  Selected Sites:{" "}
                  <span className="text-[#f4cc27] font-bold text-lg">
                    {selected.length}
                  </span>
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    className="bg-[#f4cc27] text-[#f04e37] font-bold text-sm px-6 py-2 rounded-lg hover:bg-yellow-400 shadow-md transition whitespace-nowrap"
                  >
                    {editingItineraryId ? "Update" : "Save"}
                  </button>
                  {editingItineraryId && (
                    <button
                      onClick={handleCancelUpdate}
                      className="bg-gray-200 text-gray-800 font-bold text-sm px-6 py-2 rounded-lg hover:bg-gray-300 shadow-md transition whitespace-nowrap"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>

              {/* Upload Image Section for mobile */}
              <div className="w-full">
                {imageUrl ? (
                  <div className="relative">
                    <img
                      src={getFullImageUrl(imageUrl)}
                      alt="Itinerary Preview"
                      className="w-full h-40 object-cover rounded-xl border-4 border-white shadow-lg"
                    />
                    <button
                      onClick={() => setImageUrl("")}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 shadow-md transition font-bold"
                      title="Remove image"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer block text-center bg-white text-[#f04e37] font-semibold py-2 px-6 rounded-lg hover:bg-white/90 shadow-md transition">
                    Upload Itinerary Image (Optional)
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Desktop: Compact single row layout */}
            <div className="hidden lg:flex gap-3 items-center">
              {/* Left: Upload Image Button or Preview (expands when image uploaded) */}
              <div className="flex-shrink-0">
                {imageUrl ? (
                  <div className="relative group">
                    <img
                      src={getFullImageUrl(imageUrl)}
                      alt="Preview"
                      className="w-32 h-20 object-cover rounded-lg border-2 border-white shadow transition-all"
                    />
                    <button
                      onClick={() => setImageUrl("")}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 shadow text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove image"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex items-center justify-center w-12 h-12 text-center bg-white text-[#f04e37] font-bold rounded-lg hover:bg-white/90 shadow transition" title="Upload Image (Optional)">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Middle: Itinerary name input */}
              <input
                type="text"
                value={itineraryName}
                onChange={(e) => setItineraryName(e.target.value)}
                placeholder="Enter itinerary name"
                className="flex-1 px-3 py-2 rounded-lg bg-white text-gray-900 placeholder-gray-500 shadow focus:ring-2 focus:ring-[#f4cc27] text-sm"
              />

              {/* Right: Selected Sites counter and Save button */}
              <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
                <span className="text-xs font-medium whitespace-nowrap">
                  Selected Sites: <span className="text-[#f4cc27] font-bold text-sm">{selected.length}</span>
                </span>
              </div>

              <button
                onClick={handleSave}
                className="bg-[#f4cc27] text-[#f04e37] font-bold text-sm px-4 py-2 rounded-lg hover:bg-yellow-300 shadow transition whitespace-nowrap"
              >
                {editingItineraryId ? "Update" : "Save"}
              </button>
              
              {editingItineraryId && (
                <button
                  onClick={handleCancelUpdate}
                  className="bg-white/90 text-gray-700 font-semibold text-sm px-4 py-2 rounded-lg hover:bg-white shadow transition"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------- */}

      {/* === MAIN BODY === */}
      <MainLayout includeSideButtons={false}>
        <div className="flex flex-1 px-2 scroll-smooth">
          <div className="flex-1 w-full flex flex-col md:flex-row gap-4 py-4 px-3 md:pl-0 z-20">
          {/* === LEFT COLUMN: My Itineraries === */}
          <div className="w-full md:w-80 flex flex-col order-1 md:order-1">
            <div className="flex flex-col gap-4">
              <div className="bg-[#f04e37] rounded-xl ">
                <button
                  onClick={() => setShowMyItineraries((prev) => !prev)}
                  className="w-full flex justify-between items-center font-bold text-white text-lg p-2 rounded-lg bg-white/10 hover:bg-white/20 md:hidden"
                >
                  My Itineraries
                  {showMyItineraries ? <FaChevronUp /> : <FaChevronDown />}
                </button>

                {/* === My Itineraries Section === */}
                <div
                  className={`transition-all duration-300 ease-in-out flex flex-col overflow-hidden ${
                    showMyItineraries
                      ? "max-h-[65vh]"
                      : "max-h-0 md:max-h-[65vh]"
                  }`}
                >
                  {/* Sticky Header (same as Available Sites) */}
                  <div className="hidden md:block bg-[#f04e37] px-2 py-2 mb-2 border-b border-white/20 sticky top-0 z-10">
                    <h2 className="text-2xl font-bold text-white">
                      My Itineraries
                    </h2>
                  </div>

                  {/* Scrollable List */}
                  <div className="flex-1 overflow-y-auto px-2 pb-24 md:pb-6 scroll-smooth">
                    {userItineraries.length === 0 ? (
                      <p className="text-white/80 text-sm">
                        No itineraries created yet.
                      </p>
                    ) : (
                      userItineraries.map((itinerary, idx) => (
                        <ItineraryCard
                          key={itinerary._id}
                          itinerary={itinerary}
                          expanded={expandedIndex === idx}
                          toggleExpand={() => toggleExpand(idx)}
                          handleDelete={handleDelete}
                          handleEdit={handleEdit}
                          getFullImageUrl={getFullImageUrl}
                        />
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* === RIGHT COLUMN: Available Sites === */}
          <div className="flex-1 flex flex-col order-2 overflow-hidden">
            {/* Header fixed at top of this section */}
            <div className="bg-[#f04e37] px-2 py-2 mb-2 border-b border-white/20">
              <h2 className="text-2xl font-bold text-white">Available Sites</h2>
            </div>

            {/* Scrollable site list */}
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
        </div>
      </MainLayout>

      <footer className="text-center text-xs text-white opacity-70 py-4">
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
      className="flex-1 overflow-y-auto px-2 pb-[calc(65vh-200px)] md:pb-8 max-h-[65vh] md:max-h-[70vh] snap-y snap-mandatory"
      style={{ scrollBehavior: "smooth" }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
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

      // Calculate distance from the top of the container
      const distanceFromTop = cardRect.top - containerRect.top;
      const cardHeight = cardRect.height;

      // Define the glow zone (top portion of container)
      const glowZoneHeight = cardHeight * 1.5;

      if (distanceFromTop >= -cardHeight && distanceFromTop < glowZoneHeight) {
        // Card is in the glow zone near the top
        const normalizedPosition = Math.max(0, Math.min(1, distanceFromTop / glowZoneHeight));
        
        // Full glow at top (0), fades as it moves down
        const opacity = 1 - (normalizedPosition * 0.6);
        const scale = 1.05 - (normalizedPosition * 0.15);

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
      className="bg-white text-black rounded-xl shadow p-3 flex flex-col h-full transition-all duration-300 ease-out snap-start"
      style={{
        opacity: cardStyle.opacity,
        transform: cardStyle.transform,
      }}
    >
      <img
        src={
          site.mediaFiles?.find(m => m.type === "image")?.url
            ? getFullImageUrl(site.mediaFiles.find(m => m.type === "image").url)
            : site.mediaUrl 
              ? getFullImageUrl(site.mediaUrl)
              : "https://via.placeholder.com/150"
        }
        alt={site.siteName}
        className="w-full h-24 object-cover rounded-lg mb-2"
        onError={(e) => {
          e.currentTarget.src = "https://via.placeholder.com/150";
        }}
      />
      <h3 className="font-bold text-[#f04e37] text-sm mb-1 line-clamp-1">
        {site.siteName}
      </h3>
      <div
        className={`text-gray-600 text-xs mb-2 flex-grow space-y-1 ${
          !isExpanded ? "line-clamp-2" : ""
        }`}
      >
        {site.siteDescription ? (
          site.siteDescription.split('\n\n').map((paragraph, index) => (
            <p key={index}>{paragraph.trim()}</p>
          ))
        ) : (
          <p>No description available</p>
        )}
      </div>
      {site.siteDescription && site.siteDescription.length > 60 && (
        <button
          className="text-xs text-[#f04e37] font-semibold mb-2 text-left"
          onClick={() => toggleDescription(site._id)}
        >
          {isExpanded ? "Read less" : "Read more"}
        </button>
      )}
      <button
        onClick={() => toggleSelection(site._id)}
        className={`w-full py-2 rounded-lg font-semibold flex items-center justify-center gap-1 text-xs transition-all duration-200 ${
          isSelected
            ? "bg-green-500 text-white"
            : "bg-[#f04e37] text-white hover:bg-[#d43e2a]"
        }`}
      >
        {isSelected ? (
          <>
            <FaCheck className="text-xs" /> Added
          </>
        ) : (
          <>
            <FaPlus className="text-xs" /> Add
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
    <div className="bg-white text-black rounded-xl shadow p-4 mb-4">
      {itinerary.imageUrl && (
        <img
          src={getFullImageUrl(itinerary.imageUrl)}
          alt={itinerary.name}
          className="w-full h-40 object-cover rounded-lg mb-3"
        />
      )}

      <div className="flex justify-between items-center">
        <p className="font-bold text-lg">{itinerary.name}</p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEdit(itinerary)}
            className="text-blue-500"
          >
            <FaEdit />
          </button>
          <button
            onClick={() => handleDelete(itinerary._id)}
            className="text-red-500"
          >
            <FaTrash />
          </button>
          <button onClick={toggleExpand}>
            {expanded ? <FaChevronUp /> : <FaChevronDown />}
          </button>
        </div>
      </div>
      {expanded && itinerary.sites?.length > 0 && (
        <div className="mt-3 space-y-2">
          {itinerary.sites.map((site, idx) => {
            const expandedDesc = descExpanded[idx];
            return (
              <div
                key={idx}
                className="flex items-center gap-3 bg-gray-100 p-2 rounded-lg"
              >
                <img
                  src={
                    site.mediaFiles?.find(m => m.type === "image")?.url
                      ? getFullImageUrl(site.mediaFiles.find(m => m.type === "image").url)
                      : site.mediaUrl 
                        ? getFullImageUrl(site.mediaUrl)
                        : "https://via.placeholder.com/50"
                  }
                  alt={site.siteName}
                  className="w-10 h-10 rounded object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "https://via.placeholder.com/50";
                  }}
                />
                <div className="flex-1">
                  <p className="font-semibold">{site.siteName}</p>
                  <div
                    className={`text-xs text-gray-600 space-y-1 ${
                      !expandedDesc ? "line-clamp-2" : ""
                    }`}
                  >
                    {site.siteDescription ? (
                      site.siteDescription.split('\n\n').map((paragraph, index) => (
                        <p key={index}>{paragraph.trim()}</p>
                      ))
                    ) : (
                      <p>No description available</p>
                    )}
                  </div>
                  {site.siteDescription && site.siteDescription.length > 60 && (
                    <button
                      className="text-xs text-[#f04e37] font-semibold"
                      onClick={() => toggleSiteDescription(idx)}
                    >
                      {expandedDesc ? "Read less" : "Read more"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
