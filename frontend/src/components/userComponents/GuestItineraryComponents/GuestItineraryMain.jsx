// GuestItineraryMain.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function GuestItineraryMain() {
  const [adminItineraries, setAdminItineraries] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchItineraries = async () => {
      try {
        const res = await axios.get(
          "https://juander.onrender.com/api/itineraries/guest"
        );
        setAdminItineraries(res.data); // backend already returns only admin-created
      } catch (err) {
        console.error("Failed to fetch itineraries:", err);
      }
    };

    fetchItineraries();
  }, []);

  return (
    <div className="flex flex-col items-center justify-start">
      {/* Admin itineraries */}
      <div className="max-w-6xl w-full mx-auto flex flex-col gap-4 py-6 px-4 mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">
          Admin Itineraries
        </h2>
        {adminItineraries.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {adminItineraries.map((itinerary) => (
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
    </div>
  );
}

function ItineraryCard({ itinerary, navigate }) {
  return (
    <div
      className="bg-white rounded-3xl shadow-lg overflow-hidden cursor-pointer transform hover:scale-105 hover:shadow-2xl transition-all duration-300"
      onClick={() =>
        navigate(`/GuestItineraryMap/${itinerary._id}`, {
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
