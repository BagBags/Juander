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
} from "react-icons/fa";

export default function CreateItineraryPage() {
  const [selected, setSelected] = useState([]);
  const [userItineraries, setUserItineraries] = useState([]);
  const [itineraryName, setItineraryName] = useState("");
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [sites, setSites] = useState([]);

  const token = localStorage.getItem("token"); // Assuming you store user token here
  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    fetchSites();
    fetchItineraries();
  }, []);

  // Fetch all sites
  const fetchSites = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/pins");
      setSites(res.data);
    } catch (err) {
      console.error(err);
      alert("Failed to load sites");
    }
  };

  // Fetch itineraries and separate admin vs user
  const fetchItineraries = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/itineraries",
        config
      );
      const allItineraries = res.data;
      setUserItineraries(allItineraries.filter((i) => !i.isAdminCreated));
    } catch (err) {
      console.error(err);
      alert("Failed to load itineraries");
    }
  };

  // Toggle site selection
  const toggleSelection = (siteId) => {
    setSelected((prev) =>
      prev.includes(siteId)
        ? prev.filter((id) => id !== siteId)
        : [...prev, siteId]
    );
  };

  // Save a new user itinerary
  const handleSave = async () => {
    if (!itineraryName.trim() || selected.length === 0) {
      return alert("Enter itinerary name and select at least one site");
    }

    try {
      await axios.post(
        "http://localhost:5000/api/itineraries",
        {
          name: itineraryName.trim(),
          sites: selected,
          isAdminCreated: false,
        },
        config
      );

      alert("Itinerary saved!");
      setItineraryName("");
      setSelected([]);
      fetchItineraries(); // refresh user itineraries
    } catch (err) {
      console.error(err);
      alert("Failed to save itinerary");
    }
  };

  // Delete a user itinerary
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this itinerary?")) return;

    try {
      await axios.delete(`http://localhost:5000/api/itineraries/${id}`, config);
      setUserItineraries(userItineraries.filter((i) => i._id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete itinerary");
    }
  };

  const toggleExpand = (idx) => {
    setExpandedIndex(expandedIndex === idx ? null : idx);
  };

  return (
    <div className="min-h-screen bg-[#f04e37] flex flex-col items-center text-sm relative px-4 md:px-0 text-white">
      <SideButtons />
      <div className="w-full max-w-xl relative">
        <div className="pt-4 z-10 sticky top-0 bg-[#f04e37]">
          <BackHeader title="Create Itinerary" />
        </div>

        <div className="mt-4 text-center">
          <h1 className="text-2xl font-bold mb-2">Create Your Own Itinerary</h1>
          <p className="text-sm opacity-90 mb-6">
            Select from the options below. Once saved, they’ll appear in your
            list of created itineraries.
          </p>

          <input
            type="text"
            value={itineraryName}
            onChange={(e) => setItineraryName(e.target.value)}
            placeholder="Enter itinerary name"
            className="w-full p-3 rounded-xl border border-transparent bg-white/90 text-gray-900 placeholder-gray-500 shadow-sm focus:border-[#f4cc27] focus:ring-2 focus:ring-[#f4cc27] outline-none transition-all duration-300 mb-6"
          />

          <h2 className="text-3xl font-bold mb-6">Sites</h2>
          <div className="flex flex-col items-center gap-6">
            {sites.map((site) => (
              <div
                key={site._id}
                className="bg-[#f4cc27] text-black rounded-2xl shadow-md p-4 flex flex-col justify-between w-full min-h-[200px]"
              >
                <div className="flex gap-4 items-center">
                  <img
                    src={
                      site.mediaUrl ||
                      site.image ||
                      "https://via.placeholder.com/100"
                    }
                    alt={site.siteName || site.title}
                    className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="text-left flex-1">
                    <h3 className="text-lg font-bold text-[#f04e37]">
                      {site.siteName || site.title}
                    </h3>
                    <p className="text-sm text-gray-700">
                      {site.subtitle || ""}
                    </p>
                    <p className="text-xs mt-1 text-gray-600 line-clamp-2">
                      {site.description || ""}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex justify-center">
                  <button
                    onClick={() => toggleSelection(site._id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
                      selected.includes(site._id)
                        ? "bg-green-500 text-white"
                        : "bg-white text-[#f04e37]"
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
              </div>
            ))}
          </div>

          {/* User Itineraries */}
          <div className="mt-10 text-left w-full">
            <h2 className="text-xl font-bold mb-3">My Itineraries</h2>
            {userItineraries.length === 0 ? (
              <p className="text-white opacity-80">
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
                />
              ))
            )}
          </div>

          <button
            onClick={handleSave}
            className="bg-white text-[#f04e37] font-bold py-3 px-8 rounded-full mt-8"
          >
            Save Itinerary
          </button>
        </div>
      </div>

      <p className="mt-10 text-xs text-center text-white opacity-70">
        ©2025 Intramuros Administration
      </p>
    </div>
  );
}

// Component for displaying each itinerary
function ItineraryCard({ itinerary, expanded, toggleExpand, handleDelete }) {
  return (
    <div className="bg-white text-black rounded-xl shadow-lg p-4 mb-4 cursor-pointer">
      <div className="flex justify-between items-center">
        <p className="font-bold text-lg">{itinerary.name}</p>
        <div className="flex items-center gap-3">
          {handleDelete && (
            <button
              onClick={() => handleDelete(itinerary._id)}
              className="text-red-500"
            >
              <FaTrash />
            </button>
          )}
          <button onClick={toggleExpand}>
            {expanded ? <FaChevronUp /> : <FaChevronDown />}
          </button>
        </div>
      </div>

      {expanded && itinerary.sites?.length > 0 && (
        <div className="mt-3 space-y-2">
          {itinerary.sites.map((site, siteIdx) => (
            <div
              key={siteIdx}
              className="flex items-center gap-3 bg-gray-100 p-3 rounded-lg"
            >
              <img
                src={
                  site.mediaUrl ||
                  site.image ||
                  "https://via.placeholder.com/50"
                }
                alt={site.siteName || site.title}
                className="w-12 h-12 rounded object-cover"
              />
              <div>
                <p className="font-semibold">{site.siteName || site.title}</p>
                <p className="text-xs text-gray-600">{site.subtitle || ""}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
