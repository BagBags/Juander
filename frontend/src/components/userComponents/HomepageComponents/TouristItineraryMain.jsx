import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ChevronDown, ChevronUp } from "lucide-react"; // optional: icons for toggle

export default function TouristItineraryMain() {
  const [itineraries, setItineraries] = useState({ admin: [], user: [] });
  const [openSections, setOpenSections] = useState({
    admin: true,
    user: false,
  }); // both can toggle independently
  const navigate = useNavigate();

  const getFullImageUrl = (url) => {
    if (!url) return null;
    return url.startsWith("http") ? url : `http://localhost:5000${url}`;
  };

  useEffect(() => {
    const fetchItineraries = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await axios.get("http://localhost:5000/api/itineraries", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const adminItineraries = res.data.filter((i) => i.isAdminCreated);
        const userItineraries = res.data.filter((i) => !i.isAdminCreated);

        setItineraries({ admin: adminItineraries, user: userItineraries });
      } catch (err) {
        console.error("Failed to fetch itineraries:", err);
      }
    };

    fetchItineraries();
  }, []);

  const toggleSection = (section) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const sectionClasses =
    "max-w-6xl w-full mx-auto flex flex-col gap-4 py-6 px-4 mb-8 bg-white/10 rounded-2xl backdrop-blur-sm shadow-md";

  return (
    <div className="flex flex-col items-center justify-start">
      {/* Admin-made itineraries */}
      <div className={sectionClasses}>
        <button
          onClick={() => toggleSection("admin")}
          className="flex items-center justify-between w-full text-left text-2xl font-bold text-white focus:outline-none"
        >
          <span>Admin Itineraries</span>
          {openSections.admin ? (
            <ChevronUp className="text-white" />
          ) : (
            <ChevronDown className="text-white" />
          )}
        </button>

        {/* Collapsible content */}
        <div
          className={`transition-all duration-500 overflow-hidden ${
            openSections.admin
              ? "max-h-[2000px] opacity-100"
              : "max-h-0 opacity-0"
          }`}
        >
          {itineraries.admin.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
              {itineraries.admin.map((itinerary) => (
                <ItineraryCard
                  key={itinerary._id}
                  itinerary={itinerary}
                  navigate={navigate}
                  getFullImageUrl={getFullImageUrl}
                />
              ))}
            </div>
          ) : (
            <p className="text-white opacity-80 mt-3">
              No admin itineraries available
            </p>
          )}
        </div>
      </div>

      {/* User-made itineraries */}
      <div className={`${sectionClasses} mb-12`}>
        <button
          onClick={() => toggleSection("user")}
          className="flex items-center justify-between w-full text-left text-2xl font-bold text-white focus:outline-none"
        >
          <span>My Itineraries</span>
          {openSections.user ? (
            <ChevronUp className="text-white" />
          ) : (
            <ChevronDown className="text-white" />
          )}
        </button>

        {/* Collapsible content */}
        <div
          className={`transition-all duration-500 overflow-hidden ${
            openSections.user
              ? "max-h-[2000px] opacity-100"
              : "max-h-0 opacity-0"
          }`}
        >
          {itineraries.user.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
              {itineraries.user.map((itinerary) => (
                <ItineraryCard
                  key={itinerary._id}
                  itinerary={itinerary}
                  navigate={navigate}
                  getFullImageUrl={getFullImageUrl}
                />
              ))}
            </div>
          ) : (
            <p className="text-white opacity-80 mt-3">
              You have not created any itineraries
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function ItineraryCard({ itinerary, navigate, getFullImageUrl }) {
  const imageSrc = getFullImageUrl(itinerary.imageUrl);

  return (
    <div
      className="bg-white rounded-3xl shadow-lg overflow-hidden cursor-pointer transform hover:scale-105 hover:shadow-2xl transition-all duration-300"
      onClick={() =>
        navigate(`/TouristItineraryMap/${itinerary._id}`, {
          state: { itinerary },
        })
      }
    >
      {imageSrc ? (
        <img
          src={imageSrc}
          alt={itinerary.name}
          className="w-full h-48 object-cover"
          onError={(e) =>
            (e.currentTarget.src = "https://via.placeholder.com/192")
          }
        />
      ) : (
        <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-400">
          No Image
        </div>
      )}

      <div className="p-5">
        <h2 className="text-xl font-semibold text-red-600 mb-2">
          {itinerary.name}
        </h2>
        <p className="text-gray-600 text-sm mb-3 line-clamp-3">
          {itinerary.description || "No description available"}
        </p>
        {itinerary.sites?.length > 0 ? (
          <div className="text-gray-700 text-sm">
            <span className="font-semibold">Sites:</span>
            <ul className="list-disc list-inside mt-1 space-y-0.5">
              {itinerary.sites.map((site) => (
                <li key={site._id}>{site.siteName || site.title}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No sites available</p>
        )}
      </div>
    </div>
  );
}
