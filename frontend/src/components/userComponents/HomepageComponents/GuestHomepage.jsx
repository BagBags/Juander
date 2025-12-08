import React, { useEffect, useState } from "react";
import LogoHeader from "./logoHeader";
import { useNavigate } from "react-router-dom";
import FloatingChatbot from "../ChatbotComponents/FloatingChatbot";
import SideButtons from "../sideButtons";
import { useTranslation } from "react-i18next";
import ttsService from "../../../utils/textToSpeech";
import TourProvider from "../../TourComponents/TourProvider";
import { useTour } from "../../TourComponents/TourContext";
import { guestTourSteps } from "../../TourComponents/tourSteps";
import ModernLoader from "../../shared/ModernLoader";
import { Compass, UserPlus } from "lucide-react";

export default function GuestHomepage() {
  return (
    <TourProvider
      steps={guestTourSteps}
      userRole="guest"
      scrollToFirstStep={false}
      disableScrolling={true}
      tourType="homepage"
    >
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
        setLoadingProgress((prev) => Math.max(prev, value)); // Never go backwards
      }
    };

    const loadResources = async () => {
      try {
        const alreadyLoaded =
          localStorage.getItem("guest_homepage_preloaded") === "true";
        if (alreadyLoaded) {
          setBgLoaded(true);
          setComponentsLoaded(true);
          setLoadingProgress(100);
          progressLocked = true;
          return;
        }
        // Step 1: Initial load (20%)
        updateProgress(20);

        // Step 2: Load background (50%)
        const isMobile = window.innerWidth < 640;
        const bgImage = new Image();
        bgImage.src = isMobile ? "/icons/BGEnhanced4.png" : "/JuanderBGWeb.svg";

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
        logo.src = "/icons/logo.png";
        await new Promise((resolve) => {
          logo.onload = resolve;
          logo.onerror = resolve;
          setTimeout(resolve, 1000); // Timeout fallback
        });

        if (!mounted) return;
        updateProgress(70);

        // Step 4: Wait for components (85%)
        await new Promise((resolve) => setTimeout(resolve, 200));
        if (!mounted) return;
        updateProgress(85);

        // Step 5: Final preparations (100%)
        await new Promise((resolve) => setTimeout(resolve, 150));
        if (!mounted) return;
        updateProgress(100);
        progressLocked = true; // Lock at 100%

        await new Promise((resolve) => setTimeout(resolve, 200));
        if (!mounted) return;
        setComponentsLoaded(true);
        localStorage.setItem("guest_homepage_preloaded", "true");
      } catch (error) {
        console.error("Error loading resources:", error);
        if (mounted) {
          setBgLoaded(true);
          updateProgress(100);
          progressLocked = true;
          setComponentsLoaded(true);
          localStorage.setItem("guest_homepage_preloaded", "true");
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

  // No TTS here; voice guidance is exclusive to itinerary maps

  // Auto-start guest tutorial only when explicitly enabled via settings
  useEffect(() => {
    const disabled = localStorage.getItem("guestTutorialsDisabled") === "true";
    const replay = localStorage.getItem("guestReplayTutorial") === "true";
    if (!disabled && replay) {
      setTimeout(() => {
        startTour();
      }, 800);
    }
  }, [startTour]);

  const isRealPhone = () => {
    const ua = navigator.userAgent.toLowerCase();
    const uaMobile =
      navigator.userAgentData?.mobile ?? /android|iphone|ipad|ipod/.test(ua);
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const noHover = window.matchMedia("(hover: none)").matches;
    const touchPoints = navigator.maxTouchPoints || 0;
    return !!uaMobile && coarse && noHover && touchPoints > 0;
  };
  const isPhone = isRealPhone();

  // Don't render until components are loaded
  if (!componentsLoaded) {
    return <ModernLoader progress={loadingProgress} />;
  }

  return (
    <>
      <div
        className="min-h-screen flex flex-col items-center justify-start overflow-hidden relative
          bg-[url('/icons/BGEnhanced4.png')] sm:bg-[url('/JuanderBG3.png')] select-none"
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
          WebkitUserSelect: "none",
          userSelect: "none",
          WebkitTouchCallout: "none",
        }}
        draggable={false}
      >
        {/* Logo Header */}
        <header className="w-full mt-6 flex justify-center px-4">
          <LogoHeader />
        </header>

        {/* Main Content Area */}
        <main className="mt-10 sm:mt-12 md:mt-16 lg:mt-20 text-center relative z-10 px-6 flex-1 w-full">
          <h1
            className="text-[44px] sm:text-[56px] md:text-[68px] lg:text-[76px]
             font-bold tracking-tight leading-[1.1] 
             text-white
             drop-shadow-[0_2px_20px_rgba(0,0,0,0.3)]
             mb-3"
          >
            {t("homepageTitle")}
          </h1>
          <p
            className="text-sm sm:text-base md:text-lg text-white/95 font-normal
           drop-shadow-[0_2px_12px_rgba(0,0,0,0.25)]
           max-w-sm mx-auto"
          >
            Discover the historic walled city
          </p>
        </main>

        {/* Side Buttons - Using shared component with guest filter */}
        <SideButtons userType="guest" />

        {/* Dynamic Explore / Start Tour Button */}
        <button
          onClick={() => navigate(isPhone ? "/GuestItinerary" : "/TourMap")}
          className="fixed bottom-16 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md text-[#f04e37] font-bold shadow-[0_6px_24px_rgba(0,0,0,0.15)] rounded-2xl px-6 min-w-[12rem] sm:min-w-[13rem] lg:min-w-[18rem] h-14 sm:h-16 text-lg sm:text-xl hover:bg-[#f04e37] hover:text-white hover:shadow-[0_10px_36px_rgba(240,78,55,0.35)] hover:-translate-y-0.5 active:translate-y-0 focus:outline-none transition-all duration-300 ease-out border border-white/60 flex items-center justify-center gap-3 z-40"
        >
          <Compass className="w-5 h-5" />
          <span
            className={
              isPhone ? "leading-tight" : "whitespace-nowrap leading-none"
            }
          >
            {isPhone ? t("startTour") : t("explore")}
          </span>
        </button>

        {/* Floating Chatbot (Juan Mascot) */}
        <FloatingChatbot />
      </div>
    </>
  );
}
