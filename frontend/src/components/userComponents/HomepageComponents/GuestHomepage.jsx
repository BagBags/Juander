import React, { useEffect, useState } from "react";
import LogoHeader from "./logoHeader";
import { useNavigate } from "react-router-dom";
import FloatingChatbot from "../ChatbotComponents/FloatingChatbot";
import SideButtons from "../sideButtons";
import { useTranslation } from "react-i18next";
import ttsService from "../../../utils/textToSpeech";
import TourProvider, { useTour } from "../../TourComponents/TourProvider";
import { guestTourSteps } from "../../TourComponents/tourSteps";
import ModernLoader from "../../shared/ModernLoader";

export default function GuestHomepage() {
  return (
    <TourProvider steps={guestTourSteps} userRole="guest">
      <GuestHomepageContent />
    </TourProvider>
  );
}

function GuestHomepageContent() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { startTour } = useTour();
  const [bgLoaded, setBgLoaded] = useState(false);
  const [componentsLoaded, setComponentsLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Optimized preloading with progress tracking
  useEffect(() => {
    let mounted = true;
    const loadResources = async () => {
      try {
        // Step 1: Load background (50%)
        setLoadingProgress(10);
        const bgImage = new Image();
        bgImage.src = '/JuanderBGWeb.svg';
        
        await new Promise((resolve) => {
          bgImage.onload = resolve;
          bgImage.onerror = resolve;
        });
        
        if (!mounted) return;
        setBgLoaded(true);
        setLoadingProgress(50);

        // Step 2: Preload logo (80%)
        const logo = new Image();
        logo.src = '/icons/logo.png';
        await new Promise((resolve) => {
          logo.onload = resolve;
          logo.onerror = resolve;
        });
        
        if (!mounted) return;
        setLoadingProgress(80);

        // Step 3: Final preparations (100%)
        await new Promise(resolve => setTimeout(resolve, 300));
        if (!mounted) return;
        setLoadingProgress(100);
        
        await new Promise(resolve => setTimeout(resolve, 200));
        if (!mounted) return;
        setComponentsLoaded(true);
      } catch (error) {
        console.error('Error loading resources:', error);
        if (mounted) {
          setBgLoaded(true);
          setComponentsLoaded(true);
          setLoadingProgress(100);
        }
      }
    };

    loadResources();
    return () => { mounted = false; };
  }, []);

  // Load guest language preference on mount
  useEffect(() => {
    const savedLang = sessionStorage.getItem("guestLanguage");
    if (savedLang) {
      i18n.changeLanguage(savedLang);
    }
  }, [i18n]);

  // Announce page load with TTS
  useEffect(() => {
    ttsService.speak(t('tts_welcome'));
  }, [t]);

  // Auto-start guest tutorial when flagged from GuestSettings
  useEffect(() => {
    const replay = sessionStorage.getItem("guestReplayTutorial") === "true";
    if (replay) {
      setTimeout(() => {
        startTour();
        sessionStorage.removeItem("guestReplayTutorial");
      }, 800);
    }
  }, [startTour]);

  // Don't render until components are loaded
  if (!componentsLoaded) {
    return <ModernLoader progress={loadingProgress} />;
  }

  return (
    <>
      
      <div
        className="min-h-screen flex flex-col items-center justify-start overflow-hidden relative"
        style={{
          backgroundImage: "url('/JuanderBGWeb.svg')",
          backgroundColor: "#d9d9d9",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
          touchAction: "none",
          overscrollBehavior: "none",
          WebkitOverscrollBehavior: "none",
        }}
      >
        {/* Logo Header */}
        <div className="w-full mt-10 flex justify-center px-4">
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

      {/* Side Buttons - Using shared component with guest filter */}
      <SideButtons userType="guest" />

      {/* Explore Button (Mobile Only) */}
      <button
        onClick={() => navigate("/GuestItinerary")}
        className="absolute lg:top-[83%] lg:bottom-auto 
        left-1/2 -translate-x-1/2
        bg-white text-black font-semibold shadow-md rounded-lg sm:rounded-xl lg:rounded-2xl 
        w-40 sm:w-40 lg:w-52 
        h-12 sm:h-12 lg:h-14 
        text-sm sm:text-base lg:text-lg 
        hover:bg-yellow-500 focus:outline-none transition duration-200
        block md:hidden"
        style={{
          bottom: "calc(env(safe-area-inset-bottom) + 40px)",
        }}
      >
        Explore
      </button>

      {/* Sign Up to Explore Button (Desktop Only) */}
      <button
        onClick={() => navigate("/login")}
        className="absolute lg:top-[83%] lg:bottom-auto 
        left-1/2 -translate-x-1/2
        bg-white text-black font-semibold shadow-md rounded-lg sm:rounded-xl lg:rounded-2xl 
        w-40 sm:w-40 lg:w-52 
        h-12 sm:h-12 lg:h-14 
        text-sm sm:text-base lg:text-lg 
        hover:bg-yellow-500 focus:outline-none transition duration-200
        hidden md:block"
        style={{
          bottom: "calc(env(safe-area-inset-bottom) + 40px)",
        }}
      >
        Sign up to Explore
      </button>

      {/* Floating Chatbot (Juan Mascot) */}
      <FloatingChatbot />
    </div>
    </>
  );
}
