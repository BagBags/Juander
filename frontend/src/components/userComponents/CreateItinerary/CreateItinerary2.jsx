import React, { useEffect, useState } from "react";
import axios from "axios";
import MainLayout from "../MainLayout";
import BackHeader from "../BackButton";
import {
  FaCheck,
  FaPlus,
  FaChevronDown,
  FaChevronUp,
  FaTrash,
  FaEdit,
} from "react-icons/fa";

export default function CreateItineraryPage() {
  const [selected, setSelected] = useState([]);
  const [userItineraries, setUserItineraries] = useState([]);
  const [itineraryName, setItineraryName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [editingItineraryId, setEditingItineraryId] = useState(null);
  const [sites, setSites] = useState([]);
  const [descriptionToggles, setDescriptionToggles] = useState({});
  const [showMyItineraries, setShowMyItineraries] = useState(false);

  const token = localStorage.getItem("token");
  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    fetchSites();
    fetchItineraries();
  }, []);

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
      setImageUrl(res.data.imageUrl); // Save returned URL
    } catch (err) {
      console.error("Upload failed", err);
      alert("Image upload failed");
    }
  };

  const getFullImageUrl = (url) => {
    if (!url) return "";
    // If URL already starts with http, return as-is
    if (url.startsWith("http")) return url;
    // Otherwise, prepend localhost
    return `http://localhost:5000${url}`;
  };

  const toggleSelection = (siteId) =>
    setSelected((prev) =>
      prev.includes(siteId)
        ? prev.filter((id) => id !== siteId)
        : [...prev, siteId]
    );

  const handleSave = async () => {
    if (!itineraryName.trim() || selected.length === 0)
      return alert("Enter name & select sites");

    const payload = {
      name: itineraryName.trim(),
      imageUrl: imageUrl.trim(),
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
      } else {
        await axios.post(
          "http://localhost:5000/api/itineraries",
          payload,
          config
        );
      }
      resetForm();
      fetchItineraries();
    } catch {
      alert("Failed to save itinerary");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this itinerary?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/itineraries/${id}`, config);
      setUserItineraries(userItineraries.filter((i) => i._id !== id));
    } catch {
      alert("Failed to delete itinerary");
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
    <div className="min-h-screen flex flex-col bg-[#f04e37] text-white scroll-smooth">
      {/* === STICKY BACKHEADER === */}
      <div className="sticky top-0 z-40 mt-3 ml-3 bg-[#f04e37]">
        <BackHeader title="Create Itinerary" />
      </div>

      <MainLayout>
        <div className="flex flex-1 px-2 scroll-smooth">
          {/* === MAIN CONTENT === */}
          <div className="flex-1 w-full flex flex-col md:flex-row gap-4 py-6 px-5 md:pl-0">
          {/* === LEFT COLUMN: FORM + MY ITINERARIES (STICKY) === */}
          <div className="w-full md:w-80 flex flex-col order-1 md:order-1">
            <div className="sticky top-16 z-20 flex flex-col gap-4">
              {/* Itinerary Name & Image */}
              <div className="flex flex-col gap-2 bg-[#f04e37] p-2 rounded-xl">
                <div className="flex flex-col gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full p-3 rounded-xl bg-white/90 text-gray-900 placeholder-gray-500 shadow focus:ring-2 focus:ring-[#f4cc27]"
                  />
                  {imageUrl && (
                    <img
                      src={getFullImageUrl(imageUrl)}
                      alt="Itinerary Preview"
                      className="w-full h-24 md:h-40 object-cover rounded-lg shadow"
                    />
                  )}
                </div>
                <input
                  type="text"
                  value={itineraryName}
                  onChange={(e) => setItineraryName(e.target.value)}
                  placeholder="Enter itinerary name"
                  className="w-full p-3 rounded-xl bg-white/90 text-gray-900 placeholder-gray-500 shadow focus:ring-2 focus:ring-[#f4cc27]"
                />
              </div>

              {/* Selected Sites */}
              <div className="bg-white text-black rounded-xl shadow p-3">
                <h2 className="font-bold text-base md:text-lg mb-2">
                  Selected Sites ({selected.length})
                </h2>
                {selected.length === 0 ? (
                  <p className="text-gray-600 text-sm">No sites selected</p>
                ) : (
                  <div className="flex flex-wrap gap-2 max-h-20 md:max-h-64 overflow-y-auto">
                    {selected.map((id) => {
                      const site = sites.find((s) => s._id === id);
                      if (!site) return null;
                      return (
                        <div
                          key={id}
                          className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg"
                        >
                          <img
                            src={
                              site.mediaUrl || "https://via.placeholder.com/40"
                            }
                            alt={site.siteName}
                            className="w-5 h-5 md:w-10 md:h-10 rounded object-cover"
                          />
                          <p className="text-xs md:text-sm font-semibold whitespace-nowrap">
                            {site.siteName}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={handleSave}
                    className="flex-1 bg-[#f04e37] text-white font-bold py-1 md:py-2 rounded-lg"
                  >
                    {editingItineraryId ? "Update" : "Save"}
                  </button>
                  {editingItineraryId && (
                    <button
                      onClick={handleCancelUpdate}
                      className="flex-1 bg-gray-300 text-gray-800 font-bold py-1 md:py-2 rounded-lg"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>

              {/* My Itineraries */}
              <div className="bg-[#f04e37] rounded-xl p-2">
                <button
                  onClick={() => setShowMyItineraries((prev) => !prev)}
                  className="w-full flex justify-between items-center font-bold text-white text-lg p-2 rounded-lg bg-white/10 hover:bg-white/20 md:hidden"
                >
                  My Itineraries
                  {showMyItineraries ? <FaChevronUp /> : <FaChevronDown />}
                </button>

                <div
                  className={`transition-all duration-300 ease-in-out overflow-y-auto scroll-smooth ${
                    showMyItineraries
                      ? "max-h-[60vh]"
                      : "max-h-0 md:max-h-[60vh]"
                  }`}
                >
                  <h2 className="hidden md:block text-xl font-bold mb-2">
                    My Itineraries
                  </h2>
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

          {/* === RIGHT COLUMN: AVAILABLE SITES (SCROLLABLE) === */}
          <div className="flex-1 flex flex-col order-2">
            {/* Sticky header */}
            <h2 className="text-2xl font-bold text-white mb-2 sticky top-16 bg-[#f04e37] z-20 px-2">
              Available Sites
            </h2>

            {/* Scrollable site list */}
            <div className="overflow-y-auto flex-1 max-h-[calc(100vh-16px-64px)] px-2 pb-24 md:pb-6 scroll-smooth">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {sites.map((site) => {
                  const isExpanded = descriptionToggles[site._id];
                  return (
                    <div
                      key={site._id}
                      className="bg-white text-black rounded-2xl shadow p-4 flex flex-col justify-between"
                    >
                      <img
                        src={site.mediaUrl || "https://via.placeholder.com/150"}
                        alt={site.siteName}
                        className="w-full h-40 object-cover rounded-lg mb-3"
                      />
                      <h3 className="font-bold text-[#f04e37]">
                        {site.siteName}
                      </h3>
                      <p
                        className={`text-gray-700 text-sm mb-2 ${
                          !isExpanded ? "line-clamp-2" : ""
                        }`}
                      >
                        {site.siteDescription || "No description available"}
                      </p>
                      {site.siteDescription &&
                        site.siteDescription.length > 60 && (
                          <button
                            className="text-xs text-[#f04e37] font-semibold mb-2"
                            onClick={() => toggleDescription(site._id)}
                          >
                            {isExpanded ? "Read less" : "Read more"}
                          </button>
                        )}
                      <button
                        onClick={() => toggleSelection(site._id)}
                        className={`w-full py-2 rounded-full font-semibold flex items-center justify-center gap-2 ${
                          selected.includes(site._id)
                            ? "bg-green-500 text-white"
                            : "bg-[#f04e37]/10 text-[#f04e37] hover:bg-[#f04e37]/20"
                        }`}
                      >
                        {selected.includes(site._id) ? (
                          <>
                            <FaCheck /> Added
                          </>
                        ) : (
                          <>
                            <FaPlus /> Add
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        </div>
      </MainLayout>

      <footer className="text-center text-xs text-white opacity-70 py-4">
        ©2025 Intramuros Administration
      </footer>
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
                  src={site.mediaUrl || "https://via.placeholder.com/50"}
                  alt={site.siteName}
                  className="w-10 h-10 rounded object-cover"
                />
                <div className="flex-1">
                  <p className="font-semibold">{site.siteName}</p>
                  <p
                    className={`text-xs text-gray-600 ${
                      !expandedDesc ? "line-clamp-2" : ""
                    }`}
                  >
                    {site.siteDescription || "No description available"}
                  </p>
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
