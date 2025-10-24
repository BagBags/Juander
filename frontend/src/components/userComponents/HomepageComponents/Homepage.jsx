import React, { useEffect, useState } from "react";
import LogoHeader from "./logoHeader";
import MainLayout from "../MainLayout";
import Button from "./Button";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import FloatingChatbot from "../ChatbotComponents/FloatingChatbot";
import NotificationContainer from "./NotificationContainer";
import { useTranslation } from "react-i18next"; // 👈 import hook
import GlobalTTSButton from "../../GlobalTTSButton";
import ttsService from "../../../utils/textToSpeech";
import { WifiOff } from "lucide-react";

export default function Homepage() {
  const { t } = useTranslation(); // 👈 initialize translations
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [inactivePins, setInactivePins] = useState([]);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [fromCache, setFromCache] = useState(false);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      // Refetch data when back online
      window.location.reload();
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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
        // Check if offline
        if (!navigator.onLine) {
          // Try to load from cache
          const cachedUser = localStorage.getItem('cached_user');
          if (cachedUser) {
            setCurrentUser(JSON.parse(cachedUser));
            setFromCache(true);
          }
          return;
        }

        const res = await axios.get("http://localhost:5000/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCurrentUser(res.data);
        // Cache user data
        localStorage.setItem('cached_user', JSON.stringify(res.data));
      } catch (err) {
        console.error("Error fetching user:", err);
        // Try cache on error
        const cachedUser = localStorage.getItem('cached_user');
        if (cachedUser) {
          setCurrentUser(JSON.parse(cachedUser));
          setFromCache(true);
        }
      }
    };

    fetchUser();
  }, []);

  // Fetch inactive pins
  useEffect(() => {
    const fetchInactivePins = async () => {
      // Skip if offline - notifications require real-time data
      if (!navigator.onLine) {
        return;
      }

      try {
        const res = await axios.get("http://localhost:5000/api/pins/inactive");
        setInactivePins(res.data);
      } catch (err) {
        console.error("Error fetching inactive pins:", err);
      }
    };

    fetchInactivePins();

    // Optional: poll every 10 seconds (only when online)
    const interval = setInterval(() => {
      if (navigator.onLine) {
        fetchInactivePins();
      }
    }, 10000);
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
      {/* Offline Indicator */}
      {isOffline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-orange-500 text-white px-4 py-3 text-center shadow-lg">
          <div className="flex items-center justify-center gap-2">
            <WifiOff className="w-5 h-5" />
            <span className="font-semibold">
              You're offline - Some features may be limited
            </span>
          </div>
        </div>
      )}

      {/* Cache Indicator */}
      {fromCache && !isOffline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-blue-500 text-white px-4 py-2 text-center text-sm">
          📦 Showing cached data
        </div>
      )}

      {/* Logo Header */}
      <div className={`w-full flex justify-center px-4 ${isOffline || fromCache ? 'mt-20' : 'mt-10'}`}>
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
      <MainLayout>
        <Button navigate={navigate} />
      </MainLayout>
      <FloatingChatbot />
      <GlobalTTSButton />
    </div>
  );
}
