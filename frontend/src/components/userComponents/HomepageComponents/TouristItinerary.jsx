import React, { useEffect, useState } from "react";
import TouristItineraryMain from "./TouristItineraryMain";
import SideButtons from "../SideButtons";
import axios from "axios";

export default function TouristItinerary() {
  const [currentUser, setCurrentUser] = useState(null);

  // Fetch logged-in tourist info
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
    <div
      className="min-h-screen bg-cover bg-center relative"
      style={{ backgroundColor: "#f04e37" }}
    >
      {/* Side Buttons */}
      <SideButtons user={currentUser} />

      {/* Main Content */}
      <TouristItineraryMain />
    </div>
  );
}
