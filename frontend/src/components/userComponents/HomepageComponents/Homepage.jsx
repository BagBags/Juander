import React, { useEffect, useState, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useTranslation } from "react-i18next";
import ttsService from "../../../utils/textToSpeech";
import { WifiOff, X } from "lucide-react";
import ModernLoader from "../../shared/ModernLoader";

// Lazy load heavy components
const LogoHeader = lazy(() => import("./logoHeader"));
const MainLayout = lazy(() => import("../MainLayout"));
const Button = lazy(() => import("./Button"));
const FloatingChatbot = lazy(() => import("../ChatbotComponents/FloatingChatbot"));
const TourProvider = lazy(() => import("../../TourComponents/TourProvider"));
const { homepageTourSteps } = await import("../../TourComponents/tourSteps");

export default function Homepage() {
  const { t } = useTranslation(); // 👈 initialize translations
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [fromCache, setFromCache] = useState(false);
  const [showOfflineBanner, setShowOfflineBanner] = useState(true);
  const [bgLoaded, setBgLoaded] = useState(false);
  const [componentsLoaded, setComponentsLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

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

  // Optimized preloading with progress tracking
  useEffect(() => {
    let mounted = true;
    const loadResources = async () => {
      try {
        // Step 1: Load background image (40%)
        setLoadingProgress(10);
        const isMobile = window.innerWidth < 640;
        const bgImage = new Image();
        bgImage.src = isMobile ? '/JuanderBGPhone.png' : '/JuanderBGWeb1.svg';
        
        await new Promise((resolve) => {
          bgImage.onload = resolve;
          bgImage.onerror = resolve;
        });
        
        if (!mounted) return;
        setBgLoaded(true);
        setLoadingProgress(40);

        // Step 2: Preload logo (60%)
        const logo = new Image();
        logo.src = '/icons/logo.png';
        await new Promise((resolve) => {
          logo.onload = resolve;
          logo.onerror = resolve;
        });
        
        if (!mounted) return;
        setLoadingProgress(60);

        // Step 3: Wait for critical components (80%)
        await new Promise(resolve => setTimeout(resolve, 300));
        if (!mounted) return;
        setLoadingProgress(80);

        // Step 4: Final preparations (100%)
        await new Promise(resolve => setTimeout(resolve, 200));
        if (!mounted) return;
        setLoadingProgress(100);
        
        // Small delay before showing content for smooth transition
        await new Promise(resolve => setTimeout(resolve, 300));
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
        // Only log non-401 errors (401 is expected when token expires)
        if (err.response?.status !== 401) {
          console.error("Error fetching user:", err);
        }
        
        // Try cache on error
        const cachedUser = localStorage.getItem('cached_user');
        if (cachedUser) {
          setCurrentUser(JSON.parse(cachedUser));
          setFromCache(true);
        } else if (err.response?.status === 401) {
          // Token expired or invalid, clear it
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
    };

    fetchUser();
  }, []);

  // Don't render anything until all components are loaded
  if (!componentsLoaded) {
    return <ModernLoader progress={loadingProgress} />;
  }

  return (
    <Suspense fallback={<ModernLoader progress={loadingProgress} />}>
      <TourProvider steps={homepageTourSteps} userRole="tourist">
      
      <div
        className="
      min-h-screen bg-cover bg-no-repeat bg-center 
      flex flex-col items-center justify-start 
      overflow-hidden relative
      bg-[url('/JuanderBGPhone.png')] 
      sm:bg-[url('/JuanderBGWeb1.svg')]
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
      </div>
      </TourProvider>
    </Suspense>
  );
}
