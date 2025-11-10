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
import { Compass, UserPlus } from "lucide-react";

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
    let progressLocked = false; // Prevent progress from going backwards
    
    const updateProgress = (value) => {
      if (!progressLocked && mounted) {
        setLoadingProgress(prev => Math.max(prev, value)); // Never go backwards
      }
    };
    
    const loadResources = async () => {
      try {
        // Step 1: Initial load (20%)
        updateProgress(20);
        
        // Step 2: Load background (50%)
        const isMobile = window.innerWidth < 640;
        const bgImage = new Image();
        bgImage.src = isMobile ? '/icons/BGEnhanced4.png' : '/JuanderBGWeb.svg';
        
        await new Promise((resolve) => {
          bgImage.onload = resolve;
          bgImage.onerror = resolve;
          setTimeout(resolve, 2000); // Timeout fallback
        });
        
        if (!mounted) return;
        setBgLoaded(true);
        updateProgress(50);

        // Step 3: Preload logo (70%)
        const logo = new Image();
        logo.src = '/icons/logo.png';
        await new Promise((resolve) => {
          logo.onload = resolve;
          logo.onerror = resolve;
          setTimeout(resolve, 1000); // Timeout fallback
        });
        
        if (!mounted) return;
        updateProgress(70);

        // Step 4: Wait for components (85%)
        await new Promise(resolve => setTimeout(resolve, 200));
        if (!mounted) return;
        updateProgress(85);

        // Step 5: Final preparations (100%)
        await new Promise(resolve => setTimeout(resolve, 150));
        if (!mounted) return;
        updateProgress(100);
        progressLocked = true; // Lock at 100%
        
        await new Promise(resolve => setTimeout(resolve, 200));
        if (!mounted) return;
        setComponentsLoaded(true);
      } catch (error) {
        console.error('Error loading resources:', error);
        if (mounted) {
          setBgLoaded(true);
          updateProgress(100);
          progressLocked = true;
          setComponentsLoaded(true);
        }
      }
    };

    loadResources();
    return () => { 
      mounted = false;
      progressLocked = true; // Prevent any updates after unmount
    };
  }, []);

  // Load guest language preference on mount
  useEffect(() => {
    const savedLang = localStorage.getItem("guestLanguage");
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
    const replay = localStorage.getItem("guestReplayTutorial") === "true";
    if (replay) {
      setTimeout(() => {
        startTour();
        localStorage.removeItem("guestReplayTutorial");
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
        className="min-h-screen flex flex-col items-center justify-start overflow-hidden relative
          bg-[url('/icons/BGEnhanced4.png')] sm:bg-[url('/JuanderBGWeb.svg')]"
        style={{
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
        <div className="w-full mt-6 flex justify-center px-4">
        <LogoHeader />
      </div>

      {/* Title with modern, clean styling */}
      <div className="mt-10 sm:mt-12 md:mt-16 lg:mt-20 text-center relative z-10 px-6">
        <h1
          className="text-[44px] sm:text-[56px] md:text-[68px] lg:text-[76px]
             font-bold tracking-tight leading-[1.1] 
             text-white
             drop-shadow-[0_2px_20px_rgba(0,0,0,0.3)]
             mb-3"
        >
          {t("homepageTitle")}
        </h1>
        <p className="text-sm sm:text-base md:text-lg text-white/95 font-normal
           drop-shadow-[0_2px_12px_rgba(0,0,0,0.25)]
           max-w-sm mx-auto">
          Discover the historic walled city
        </p>
      </div>

      {/* Side Buttons - Using shared component with guest filter */}
      <SideButtons userType="guest" />

      {/* Explore Button (Mobile Only) - Ultra Modern */}
      <button
        onClick={() => navigate("/GuestItinerary")}
        className="absolute lg:top-[83%] lg:bottom-auto 
        left-1/2 -translate-x-1/2
        bg-white/95 backdrop-blur-md
        text-[#f04e37] font-bold shadow-[0_4px_24px_rgba(0,0,0,0.15)] rounded-2xl
        w-48 sm:w-52 lg:w-56 
        h-14 sm:h-16 lg:h-16 
        text-lg sm:text-xl lg:text-xl 
        hover:bg-[#f04e37]
        hover:text-white
        hover:shadow-[0_8px_32px_rgba(240,78,55,0.4)]
        hover:-translate-y-0.5
        active:translate-y-0
        focus:outline-none 
        transition-all duration-300 ease-out
        border border-white/50
        flex items-center justify-center gap-2
        block md:hidden"
        style={{
          bottom: "calc(env(safe-area-inset-bottom) + 50px)",
        }}
      >
        <Compass className="w-5 h-5" />
        <span>Explore</span>
      </button>

      {/* Sign Up to Explore Button (Desktop Only) - Ultra Modern */}
      <button
        onClick={() => navigate("/login")}
        className="absolute lg:top-[83%] lg:bottom-auto 
        left-1/2 -translate-x-1/2
        bg-white/95 backdrop-blur-md
        text-[#f04e37] font-bold shadow-[0_4px_24px_rgba(0,0,0,0.15)] rounded-2xl
        w-52 sm:w-56 lg:w-64 
        h-14 sm:h-16 lg:h-16 
        text-lg sm:text-xl lg:text-xl 
        hover:bg-[#f04e37]
        hover:text-white
        hover:shadow-[0_8px_32px_rgba(240,78,55,0.4)]
        hover:-translate-y-0.5
        active:translate-y-0
        focus:outline-none 
        transition-all duration-300 ease-out
        border border-white/50
        flex items-center justify-center gap-2
        hidden md:block"
        style={{
          bottom: "calc(env(safe-area-inset-bottom) + 50px)",
        }}
      >
        <UserPlus className="w-5 h-5" />
        <span>Sign Up to Explore</span>
      </button>

      {/* Floating Chatbot (Juan Mascot) */}
      <FloatingChatbot />
    </div>
    </>
  );
}
