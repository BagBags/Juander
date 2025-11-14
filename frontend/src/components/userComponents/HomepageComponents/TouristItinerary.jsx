import React, { useEffect, useState } from "react";
import TouristItineraryMain from "./TouristItineraryMain";
import MainLayout from "../MainLayout";
import BackHeader from "../BackButton";
import axios from "axios";

export default function TouristItinerary() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/auth/me`, {
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
      <div 
        className="sticky top-0 z-10 bg-[#f04e37]"
        style={{
          paddingTop: "max(env(safe-area-inset-top), 16px)",
          paddingBottom: "8px",
          paddingLeft: "16px",
          paddingRight: "16px"
        }}
      >
        <BackHeader
          title={<span className="text-white">Available Itineraries</span>}
          className="text-white"
        />
      </div>

      {/* Main Content */}
      <MainLayout includeSideButtons={false}>
        <div className="flex flex-col items-center justify-center pt-6 px-4 md:px-0">
          <div className="flex-1 max-w-6xl w-full flex flex-col gap-4">
            <TouristItineraryMain />
          </div>
        </div>
      </MainLayout>
    </div>
  );
}
