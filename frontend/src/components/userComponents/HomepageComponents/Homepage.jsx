import React, { useEffect, useState } from "react";
import LogoHeader from "./logoHeader";
import SideButtons from "../sideButtons";
import Button from "./Button";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import FloatingChatbot from "../ChatbotComponents/FloatingChatbot";
import { useTranslation } from "react-i18next"; // 👈 import hook

export default function Homepage() {
  const { t } = useTranslation(); // 👈 initialize translations
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
      <div className="center mt-10 top-4 left-0 right-0 flex justify-end px-4">
        <LogoHeader />
      </div>

      {/* Title */}
      <div className="mt-22 sm:mt-26 text-center relative z-10">
        <h3 className="text-4xl sm:text-5xl md:text-6xl lg:text-6xl xl:text-6xl font-extrabold text-white">
          {t("homepageTitle")} {/* 👈 translated text */}
        </h3>
      </div>

      {/* Buttons */}
      <SideButtons user={currentUser} />
      <Button navigate={navigate} />
      <FloatingChatbot />
    </div>
  );
}
