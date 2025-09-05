import React, { useEffect, useState } from "react";
import TouristItineraryMain from "./TouristItineraryMain";
import SideButtons from "../sideButtons";
import BackHeader from "../BackButton";
import axios from "axios";

export default function TouristItinerary() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await axios.get("http://localhost:5000/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCurrentUser(res.data);
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    };

    fetchUser();
  }, []);

  return (
    <div className="min-h-screen bg-[#f04e37] relative">
      {/* Back Header */}
      <div className="sticky top-0 z-10 bg-[#f04e37] p-4">
        <BackHeader
          title={<span className="text-white">Available Itineraries</span>}
        />
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center pt-6 px-4 md:px-0">
        <div className="flex-1 max-w-6xl w-full flex flex-col gap-4">
          <TouristItineraryMain />
        </div>
      </div>
    </div>
  );
}
