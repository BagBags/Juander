import React, { useEffect, useState } from "react";
import axios from "axios";
import SideButtons from "../sideButtons";
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
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [editingItineraryId, setEditingItineraryId] = useState(null);
  const [sites, setSites] = useState([]);
  const [descriptionToggles, setDescriptionToggles] = useState({});

  const token = localStorage.getItem("token");
  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    fetchSites();
    fetchItineraries();
  }, []);

  const fetchSites = async () => {
    try {
      const res = await axios.get("https://juander.onrender.com/api/pins");
      setSites(res.data);
    } catch {
      alert("Failed to load sites");
    }
  };

  const fetchItineraries = async () => {
    try {
      const res = await axios.get(
        "https://juander.onrender.com/api/itineraries",
        config
      );
      setUserItineraries(res.data.filter((i) => !i.isAdminCreated));
    } catch {
      alert("Failed to load itineraries");
    }
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
      sites: selected,
      isAdminCreated: false,
    };

    try {
      if (editingItineraryId) {
        await axios.put(
          `https://juander.onrender.com/api/itineraries/${editingItineraryId}`,
          payload,
          config
        );
      } else {
        await axios.post(
          "https://juander.onrender.com/api/itineraries",
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
      await axios.delete(
        `https://juander.onrender.com/api/itineraries/${id}`,
        config
      );
      setUserItineraries(userItineraries.filter((i) => i._id !== id));
    } catch {
      alert("Failed to delete itinerary");
    }
  };

  const handleEdit = (itinerary) => {
    setEditingItineraryId(itinerary._id);
    setItineraryName(itinerary.name);
    setSelected(itinerary.sites.map((s) => s._id));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelUpdate = () => resetForm();
  const resetForm = () => {
    setEditingItineraryId(null);
    setItineraryName("");
    setSelected([]);
  };

  const toggleExpand = (idx) =>
    setExpandedIndex(expandedIndex === idx ? null : idx);
  const toggleDescription = (id) =>
    setDescriptionToggles((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="min-h-screen flex flex-col bg-[#f04e37] text-white">
      <div className="flex flex-1 px-2 md:px-0">
        <SideButtons />
        <div
          className="flex-1 max-w-6xl mx-auto flex flex-col md:flex-row gap-4 py-6 
                pl-4 md:pl-0 pr-21 md:pr-0"
        >
          {/* Site Selection */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="sticky top-0 z-10 bg-[#f04e37]">
              <BackHeader title="Create Itinerary" />
            </div>

            <div className="flex-1 overflow-y-auto px-0 md:px-2 pt-2">
              <input
                type="text"
                value={itineraryName}
                onChange={(e) => setItineraryName(e.target.value)}
                placeholder="Enter itinerary name"
                className="w-full p-3 rounded-xl bg-white/90 text-gray-900 placeholder-gray-500 shadow focus:border-[#f4cc27] focus:ring-2 focus:ring-[#f4cc27] mb-6"
              />

              <h2 className="text-2xl font-bold mb-4">Sites</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {sites.map((site) => {
                  const isExpanded = descriptionToggles[site._id];
                  return (
                    <div
                      key={site._id}
                      className="bg-white text-black rounded-2xl shadow hover:shadow-xl transition p-4 flex flex-col justify-between"
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
                        className={`w-full py-2 rounded-full font-semibold transition-colors flex items-center justify-center gap-2 ${
                          selected.includes(site._id)
                            ? "bg-green-500 text-white hover:bg-green-600"
                            : "bg-[#f04e37]/10 text-[#f04e37] hover:bg-[#f04e37]/20"
                        }`}
                      >
                        {selected.includes(site._id) ? (
                          <>
                            <FaCheck className="w-4 h-4" /> Added
                          </>
                        ) : (
                          <>
                            <FaPlus className="w-4 h-4" /> Add
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="w-full md:w-80 flex flex-col gap-6 mt-6 md:mt-0">
            <div className="bg-white text-black rounded-xl shadow p-4 sticky top-4">
              <h2 className="font-bold text-lg mb-3">
                Selected Sites ({selected.length})
              </h2>
              {selected.length === 0 ? (
                <p className="text-gray-600 text-sm">No sites selected</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {selected.map((id) => {
                    const site = sites.find((s) => s._id === id);
                    if (!site) return null;
                    return (
                      <div
                        key={id}
                        className="flex items-center gap-2 bg-gray-100 p-2 rounded-lg"
                      >
                        <img
                          src={
                            site.mediaUrl || "https://via.placeholder.com/50"
                          }
                          alt={site.siteName}
                          className="w-10 h-10 rounded object-cover"
                        />
                        <p className="text-sm font-semibold">{site.siteName}</p>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-4 flex gap-2 flex-wrap">
                <button
                  onClick={handleSave}
                  className="flex-1 bg-[#f04e37] text-white font-bold py-2 rounded-lg"
                >
                  {editingItineraryId ? "Update" : "Save"}
                </button>
                {editingItineraryId && (
                  <button
                    onClick={handleCancelUpdate}
                    className="flex-1 bg-gray-300 text-gray-800 font-bold py-2 rounded-lg"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-y-auto max-h-[60vh]">
              <h2 className="text-xl font-bold mb-3">My Itineraries</h2>
              {userItineraries.length === 0 ? (
                <p className="text-white opacity-80 text-sm">
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
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <footer className="text-center text-xs text-white opacity-70 py-4">
        ©2025 Intramuros Administration
      </footer>
    </div>
  );
}

function ItineraryCard({
  itinerary,
  expanded,
  toggleExpand,
  handleDelete,
  handleEdit,
}) {
  const [descExpanded, setDescExpanded] = useState({});
  const toggleSiteDescription = (idx) =>
    setDescExpanded((prev) => ({ ...prev, [idx]: !prev[idx] }));

  return (
    <div className="bg-white text-black rounded-xl shadow p-4 mb-4 hover:shadow-lg transition">
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
