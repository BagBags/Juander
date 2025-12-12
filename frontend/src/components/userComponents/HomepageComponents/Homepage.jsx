import React, { useEffect, useState, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useTranslation } from "react-i18next";
import ttsService from "../../../utils/textToSpeech";
import { WifiOff, X, Compass } from "lucide-react";
import { useTour } from "../../TourComponents/TourContext";
import ModernLoader from "../../shared/ModernLoader";
import {
  resetTour,
  resetCreateItineraryTour,
  resetEmergencyTour,
  resetProfileTour,
  resetTourMapTour,
  resetPhotoboothTour,
  resetTripArchiveTour,
  completeTour,
  completeCreateItineraryTour,
  completeEmergencyTour,
  completeProfileTour,
  completeTourMapTour,
  completePhotoboothTour,
  completeTripArchiveTour,
} from "../../../utils/tourApi";

// Lazy load heavy components
const LogoHeader = lazy(() => import("./logoHeader"));
const MainLayout = lazy(() => import("../MainLayout"));
const Button = lazy(() => import("./Button"));
const FloatingChatbot = lazy(() =>
  import("../ChatbotComponents/FloatingChatbot")
);
const TourProvider = lazy(() => import("../../TourComponents/TourProvider"));
const { homepageTourSteps } = await import("../../TourComponents/tourSteps");

export default function Homepage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [isOffline, setIsOffline] = useState(false); // Default to ONLINE for development
  const [fromCache, setFromCache] = useState(false);
  const [showOfflineBanner, setShowOfflineBanner] = useState(false); // Hide by default
  const [bgLoaded, setBgLoaded] = useState(false);
  const [componentsLoaded, setComponentsLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showTutorialPrompt, setShowTutorialPrompt] = useState(false);
  const [processingTutorial, setProcessingTutorial] = useState(false);

  // Monitor online/offline status - simplified (no backend health fetch)
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setShowOfflineBanner(false);
    };
    const handleOffline = () => {
      setIsOffline(true);
      setShowOfflineBanner(true);
    };

    // Initial state from browser
    if (
      typeof navigator !== "undefined" &&
      typeof navigator.onLine === "boolean"
    ) {
      navigator.onLine ? handleOnline() : handleOffline();
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

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
          localStorage.getItem("homepage_preloaded") === "true";
        if (alreadyLoaded) {
          setBgLoaded(true);
          setComponentsLoaded(true);
          setLoadingProgress(100);
          progressLocked = true;
          return;
        }
        // Step 1: Initial load (20%)
        updateProgress(20);

        // Step 2: Load background image (50%)
        const isMobile = window.innerWidth < 640;
        const bgImage = new Image();
        bgImage.src = isMobile ? "/icons/BGEnhanced4.png" : "/JuanderBG3.png";

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

        // Step 4: Wait for critical components (85%)
        await new Promise((resolve) => setTimeout(resolve, 200));
        if (!mounted) return;
        updateProgress(85);

        // Step 5: Final preparations (100%)
        await new Promise((resolve) => setTimeout(resolve, 150));
        if (!mounted) return;
        updateProgress(100);
        progressLocked = true; // Lock at 100%

        // Small delay before showing content
        await new Promise((resolve) => setTimeout(resolve, 200));
        if (!mounted) return;
        setComponentsLoaded(true);
        localStorage.setItem("homepage_preloaded", "true");
      } catch (error) {
        console.error("Error loading resources:", error);
        if (mounted) {
          setBgLoaded(true);
          updateProgress(100);
          progressLocked = true;
          setComponentsLoaded(true);
          localStorage.setItem("homepage_preloaded", "true");
        }
      }
    };

    loadResources();
    return () => {
      mounted = false;
      progressLocked = true; // Prevent any updates after unmount
    };
  }, []);

  // Remove non-itinerary TTS announcements
  // Intentionally no TTS here to keep voice guidance exclusive to itinerary maps

  // Autostart moved into a child inside TourProvider to ensure hook context

  // Fetch logged-in tourist info
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        // Always try to fetch from backend - don't check navigator.onLine
        const apiUrl =
          import.meta.env.VITE_API_BASE_URL || "http://192.168.100.10:5000/api";
        const res = await fetch(`${apiUrl}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const userData = await res.json();
          setCurrentUser(userData);
          localStorage.setItem("cached_user", JSON.stringify(userData));
          setFromCache(false);
        } else if (res.status === 401) {
          // Token expired
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        } else {
          // Other error - try cache
          const cachedUser = localStorage.getItem("cached_user");
          if (cachedUser) {
            setCurrentUser(JSON.parse(cachedUser));
            setFromCache(true);
          }
        }
      } catch (err) {
        console.error("[Homepage] Error fetching user:", err);
        // Network error - try cache
        const cachedUser = localStorage.getItem("cached_user");
        if (cachedUser) {
          setCurrentUser(JSON.parse(cachedUser));
          setFromCache(true);
        }
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    try {
      const hasToken = !!localStorage.getItem("token");
      const shown = localStorage.getItem("tutorialPromptShown") === "true";
      if (hasToken && !shown) setShowTutorialPrompt(true);
    } catch {}
  }, []);

  // Don't render anything until all components are loaded
  if (!componentsLoaded) {
    return <ModernLoader progress={loadingProgress} />;
  }

  return (
    <Suspense fallback={<ModernLoader progress={loadingProgress} />}>
      <TourProvider
        steps={homepageTourSteps}
        userRole="tourist"
        scrollToFirstStep={false}
        disableScrolling={true}
        tourType="homepage"
      >
        {/* Autostart inside Provider to satisfy hook context */}
        <HomepageTourAutostart />

        {showTutorialPrompt && (
          <HomepageTutorialPrompt
            onClosePrompt={() => {
              setShowTutorialPrompt(false);
              try {
                localStorage.setItem("tutorialPromptShown", "true");
              } catch {}
            }}
            onSkip={() => {
              setProcessingTutorial(true);
              try {
                localStorage.setItem("tutorialsDisabled", "true");
                localStorage.setItem("tutorialPromptShown", "true");
              } catch {}
              setProcessingTutorial(false);
              setShowTutorialPrompt(false);
            }}
            onGetStarted={() => {
              setProcessingTutorial(true);
              try {
                localStorage.removeItem("tutorialsDisabled");
                localStorage.setItem("tutorialPromptShown", "true");
              } catch {}
              setProcessingTutorial(false);
              setShowTutorialPrompt(false);
            }}
          />
        )}

        <div
          className="
      min-h-screen bg-cover bg-no-repeat bg-center 
      flex flex-col items-center justify-start 
      overflow-hidden relative
      bg-[url('/icons/BGEnhanced4.png')] 
      sm:bg-[url('/JuanderBG3.png')]
    "
          style={{
            backgroundColor: "#d9d9d9",
            backgroundSize: "cover",
            paddingTop: "env(safe-area-inset-top)",
            paddingBottom: "env(safe-area-inset-bottom)",
            touchAction: "none",
            overscrollBehavior: "none",
            WebkitOverscrollBehavior: "none",
          }}
        >
          {/* Logo Header */}
          <div className="w-full flex justify-center px-4 mt-6">
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
            <p
              className="text-sm sm:text-base md:text-lg text-white/95 font-normal
           drop-shadow-[0_2px_12px_rgba(0,0,0,0.25)]
           max-w-sm mx-auto"
            >
              Discover the historic walled city
            </p>
          </div>

          {/* Buttons */}
          <MainLayout>
            <Button navigate={navigate} />
          </MainLayout>
          <FloatingChatbot />
        </div>
      </TourProvider>
    </Suspense>
  );
}

function HomepageTourAutostart() {
  const { startTour, isTourRunning, hasCompletedTour } = useTour();
  const didAutoStartRef = React.useRef(false);

  useEffect(() => {
    if (didAutoStartRef.current) return;

    // Wait until the TourProvider finishes fetching the status
    if (hasCompletedTour === null) return;

    try {
      const promptShown =
        localStorage.getItem("tutorialPromptShown") === "true";
      if (!promptShown) return;
    } catch {}

    if (hasCompletedTour === false && !isTourRunning) {
      didAutoStartRef.current = true;
      setTimeout(() => {
        startTour();
      }, 600);
    }
  }, [hasCompletedTour, startTour, isTourRunning]);

  return null;
}

function HomepageTutorialPrompt({ onClosePrompt, onSkip, onGetStarted }) {
  const { i18n } = useTranslation();
  const { startTour } = useTour();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);

  return (
    <div className="fixed inset-0 z-[11000] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-sm mx-4">
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex flex-col items-center">
          <img src="/juan/Juan2.png" alt="Juan" className="w-14 h-14" />
        </div>
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200/60 overflow-hidden">
          <div className="px-4 sm:px-6 pt-4 sm:pt-5 pb-3 flex items-center justify-between border-b border-gray-100">
            <h3 className="text-gray-900 font-semibold text-base sm:text-lg">
              {(() => {
                const lang = (
                  localStorage.getItem("i18nextLng") ||
                  i18n.language ||
                  "en"
                ).toLowerCase();
                const isTl =
                  lang.startsWith("tl") ||
                  lang.startsWith("fil") ||
                  lang.startsWith("tagalog");
                return isTl ? "Animated Guides" : "Animated Guides";
              })()}
            </h3>
            <button
              onClick={() => {
                onClosePrompt();
              }}
              className="p-2 rounded-full hover:bg-gray-100"
              aria-label="Dismiss"
            >
              <X className="w-5 h-5 text-gray-700" />
            </button>
          </div>
          <div className="h-1 bg-gray-100">
            <div className="h-full bg-[#f04e37]" style={{ width: "24%" }}></div>
          </div>
          <div className="px-4 sm:px-6 py-4 sm:py-5">
            <p className="text-gray-700 text-sm leading-relaxed">
              {(() => {
                const lang = (
                  localStorage.getItem("i18nextLng") ||
                  i18n.language ||
                  "en"
                ).toLowerCase();
                const isTl =
                  lang.startsWith("tl") ||
                  lang.startsWith("fil") ||
                  lang.startsWith("tagalog");
                return isTl
                  ? "Gusto mo bang i-enable ang animated guides sa app?"
                  : "Would you like to enable animated guides across the app?";
              })()}
            </p>
            <p className="text-xs text-gray-500 mt-3">
              {(() => {
                const lang = (
                  localStorage.getItem("i18nextLng") ||
                  i18n.language ||
                  "en"
                ).toLowerCase();
                const isTl =
                  lang.startsWith("tl") ||
                  lang.startsWith("fil") ||
                  lang.startsWith("tagalog");
                return isTl
                  ? "Maaari mo itong i-reactivate sa Settings."
                  : "You can reactivate this anytime in Settings.";
              })()}
              <button
                onClick={() => navigate("/Profile/Settings")}
                className="ml-2 text-[#f04e37] hover:underline"
              >
                Settings
              </button>
            </p>
          </div>
          <div className="px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center justify-between gap-3">
              <button
                disabled={processing}
                onClick={async () => {
                  if (processing) return;
                  setProcessing(true);
                  try {
                    await Promise.all([
                      completeTour(),
                      completeCreateItineraryTour(),
                      completeEmergencyTour(),
                      completeProfileTour(),
                      completeTourMapTour(),
                      completePhotoboothTour(),
                      completeTripArchiveTour(),
                    ]).catch(() => {});
                    try {
                      localStorage.setItem("tutorialsDisabled", "true");
                      localStorage.setItem("tutorialPromptShown", "true");
                      localStorage.removeItem("tourMapReplayTutorial");
                    } catch {}
                    onSkip();
                  } finally {
                    setProcessing(false);
                  }
                }}
                className="px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg font-medium text-xs sm:text-sm"
              >
                {(() => {
                  const lang = (
                    localStorage.getItem("i18nextLng") ||
                    i18n.language ||
                    "en"
                  ).toLowerCase();
                  const isTl =
                    lang.startsWith("tl") ||
                    lang.startsWith("fil") ||
                    lang.startsWith("tagalog");
                  return isTl ? "Laktawan" : "Skip";
                })()}
              </button>
              <button
                disabled={processing}
                onClick={async () => {
                  if (processing) return;
                  setProcessing(true);
                  try {
                    await Promise.all([
                      resetTour(),
                      resetCreateItineraryTour(),
                      resetEmergencyTour(),
                      resetProfileTour(),
                      resetTourMapTour(),
                      resetPhotoboothTour(),
                      resetTripArchiveTour(),
                    ]).catch(() => {});
                    try {
                      localStorage.removeItem("tutorialsDisabled");
                      localStorage.setItem("tutorialPromptShown", "true");
                    } catch {}
                    onGetStarted();
                    setTimeout(() => {
                      try {
                        if (typeof startTour === "function") startTour();
                      } catch {}
                    }, 300);
                  } finally {
                    setProcessing(false);
                  }
                }}
                className="flex items-center gap-1 px-4 sm:px-5 py-1.5 bg-[#f04e37] hover:bg-[#e03d2d] text-white font-semibold text-xs sm:text-sm rounded-full shadow-sm"
              >
                {(() => {
                  const lang = (
                    localStorage.getItem("i18nextLng") ||
                    i18n.language ||
                    "en"
                  ).toLowerCase();
                  const isTl =
                    lang.startsWith("tl") ||
                    lang.startsWith("fil") ||
                    lang.startsWith("tagalog");
                  return isTl ? "Simulan" : "Get Started";
                })()}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
