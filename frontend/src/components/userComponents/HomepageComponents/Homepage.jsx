import React, { useEffect, useState } from "react";
import LogoHeader from "./logoHeader";
import SideButtons from "../sideButtons";
import Button from "./Button";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import FloatingChatbot from "../ChatbotComponents/FloatingChatbot";
import NotificationContainer from "./NotificationContainer";
import { useTranslation } from "react-i18next"; // 👈 import hook
import GlobalTTSButton from "../../GlobalTTSButton";
import ttsService from "../../../utils/textToSpeech";

export default function Homepage() {
  const { t } = useTranslation(); // 👈 initialize translations
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [inactivePins, setInactivePins] = useState([]);

  // Announce page load
  useEffect(() => {
    ttsService.speak(t('tts_welcome'));
  }, [t]);

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

  // Fetch inactive pins
  useEffect(() => {
    const fetchInactivePins = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/pins/inactive");
        setInactivePins(res.data);
      } catch (err) {
        console.error("Error fetching inactive pins:", err);
      }
    };

    fetchInactivePins();

    // Optional: poll every 10 seconds
    const interval = setInterval(fetchInactivePins, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="
    min-h-screen bg-cover bg-no-repeat bg-center 
    flex flex-col items-center justify-start 
    px-4 sm:px-6 md:px-8 lg:px-10 relative
    bg-[url('/JuanderBGPhone.png')] 
    sm:bg-[url('/JuanderBGWeb1.svg')]
  "
      style={{
        backgroundColor: "#d9d9d9",
      }}
    >
      {/* Logo Header */}
      <div className="w-full mt-10 flex justify-center px-4">
        <LogoHeader />
      </div>

      <NotificationContainer
        notifications={inactivePins}
        removeNotification={(id) =>
          setInactivePins((prev) => prev.filter((n) => n._id !== id))
        }
      />

      {/* Title */}
      <div className="mt-40 sm:mt-26 md:mt-40 lg:mt-48 text-center relative z-10">
        <h5
          className="text-[42px] sm:text-[60px] md:text-[72px] 
             font-poppins font-extrabold tracking-tight leading-[1.1] 
             text-[#f5f5dc] drop-shadow-[0_4px_10px_rgba(0,0,0,0.45)]"
        >
          {t("homepageTitle")}
        </h5>
      </div>

      {/* Buttons */}
      <SideButtons user={currentUser} />
      <Button navigate={navigate} />
      <FloatingChatbot />
      <GlobalTTSButton />
    </div>
  );
}
