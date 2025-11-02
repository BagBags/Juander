import React, { useEffect, useState } from "react";
import LogoHeader from "./logoHeader";
import MainLayout from "../MainLayout";
import Button from "./Button";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import FloatingChatbot from "../ChatbotComponents/FloatingChatbot";
import { useTranslation } from "react-i18next";
import GlobalTTSButton from "../../GlobalTTSButton";
import ttsService from "../../../utils/textToSpeech";
import { WifiOff, X } from "lucide-react";
import TourProvider from "../../TourComponents/TourProvider";
import { homepageTourSteps } from "../../TourComponents/tourSteps";

export default function Homepage() {
  const { t } = useTranslation(); // 👈 initialize translations
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [fromCache, setFromCache] = useState(false);
  const [showOfflineBanner, setShowOfflineBanner] = useState(true);

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

        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/auth/me`, {
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

  return (
    <TourProvider steps={homepageTourSteps} userRole="tourist">
      <div
        className="
      fixed inset-0 bg-cover bg-no-repeat bg-center 
      flex flex-col items-center justify-start 
      px-4 sm:px-6 md:px-8 lg:px-10 overflow-hidden
      bg-[url('/JuanderBGPhone.png')] 
      sm:bg-[url('/JuanderBGWeb1.svg')]
    "
        style={{
          backgroundColor: "#d9d9d9",
          backgroundAttachment: "fixed",
          backgroundSize: "cover",
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
          touchAction: "none",
          overscrollBehavior: "none",
          WebkitOverscrollBehavior: "none",
        }}
      >
      {/* Offline Indicator */}
      {isOffline && showOfflineBanner && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white px-4 py-3 shadow-lg">
          <div className="flex items-center justify-center gap-2 relative">
            <WifiOff className="w-5 h-5" />
            <span className="font-semibold">
              You're offline - Some features may be limited
            </span>
            <button
              onClick={() => setShowOfflineBanner(false)}
              className="absolute right-0 hover:bg-red-700 rounded p-1 transition-colors"
              aria-label="Close banner"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Logo Header */}
      <div className={`w-full flex justify-center px-4 ${isOffline && showOfflineBanner ? 'mt-20' : 'mt-2'}`}>
        <LogoHeader />
      </div>

      {/* Title */}
      <div className="mt-40 sm:mt-26 md:mt-40 lg:mt-48 text-center relative z-10 px-4">
        <h5
          className="text-[38px] sm:text-[56px] md:text-[68px] 
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
    </TourProvider>
  );
}
