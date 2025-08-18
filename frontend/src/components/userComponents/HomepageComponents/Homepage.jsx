import React, { useEffect, useState } from "react";
import LogoHeader from "./logoHeader";
import SideButtons from "../sideButtons";
import Button from "./Button";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Homepage() {
  const navigate = useNavigate();
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
      className="min-h-screen bg-cover bg-center flex flex-col items-center justify-start px-4 sm:px-6 md:px-8 lg:px-10 relative"
      style={{
        backgroundImage: "url('/login-background.svg')",
        backgroundColor: "#f04e37",
      }}
    >
      {/* Logo Header */}
      <div className="absolute top-4 left-0 right-0 flex justify-end px-4">
        <LogoHeader />
      </div>

      {/* Title */}
      <div className="mt-32 sm:mt-36 text-center relative z-10">
        <h3 className="text-4xl sm:text-5xl md:text-6xl lg:text-6xl xl:text-6xl font-extrabold text-white">
          Welcome To Intramuros!
        </h3>
      </div>

      {/* Buttons */}
      <SideButtons user={currentUser} />
      <Button user={currentUser} />
    </div>
  );
}
