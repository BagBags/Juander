// TouristItineraryMain.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function TouristItineraryMain() {
  const [itineraries, setItineraries] = useState({ admin: [], user: [] });
  const navigate = useNavigate();

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

  // Shared container classes for both sections
  // Add right padding for mobile to avoid side button overlap
  const sectionClasses =
    "max-w-6xl w-full mx-auto flex flex-col gap-4 py-6 px-4  mb-8";

  return (
    <div className="flex flex-col items-center justify-start">
      {/* Admin-made itineraries */}
      <div className={sectionClasses}>
        <h2 className="text-2xl font-bold text-white mb-4">
          Admin Itineraries
        </h2>
        {itineraries.admin.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 ">
            {itineraries.admin.map((itinerary) => (
              <ItineraryCard
                key={itinerary._id}
                itinerary={itinerary}
                navigate={navigate}
              />
            ))}
          </div>
        ) : (
          <p className="text-white opacity-80">
            No admin itineraries available
          </p>
        )}
      </div>

      {/* User-made itineraries */}
      <div className={`${sectionClasses} mb-12`}>
        <h2 className="text-2xl font-bold text-white mb-4">My Itineraries</h2>
        {itineraries.user.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {itineraries.user.map((itinerary) => (
              <ItineraryCard
                key={itinerary._id}
                itinerary={itinerary}
                navigate={navigate}
              />
            ))}
          </div>
        ) : (
          <p className="text-white opacity-80">
            You have not created any itineraries
          </p>
        )}
      </div>
    </div>
  );
}

function ItineraryCard({ itinerary, navigate }) {
  return (
    <div
      className="bg-white rounded-3xl shadow-lg overflow-hidden cursor-pointer transform hover:scale-105 hover:shadow-2xl transition-all duration-300"
      onClick={() =>
        navigate(`/TouristItineraryMap/${itinerary._id}`, {
          state: { itinerary },
        })
      }
    >
      {itinerary.imageUrl ? (
        <img
          src={itinerary.imageUrl}
          alt={itinerary.name}
          className="w-full h-48 object-cover"
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
          {itinerary.description}
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
