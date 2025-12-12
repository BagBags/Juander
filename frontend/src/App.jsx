import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AnimatePresence } from "framer-motion";

// i18n setup
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";

// PWA Components
import ConnectionStatus from "./components/shared/ConnectionStatus";
import PWAInstallPrompt from "./components/shared/PWAInstallPrompt";
import LazyLoadErrorBoundary from "./components/shared/LazyLoadErrorBoundary";
import AuthPersistence from "./components/AuthPersistence";

const lazyWithRetry = (importer) => {
  const max = 2;
  return React.lazy(() => {
    let attempt = 0;
    const tryImport = () =>
      importer().catch((error) => {
        attempt += 1;
        try {
          console.warn("lazy import failed", {
            errorMessage: error?.message,
            online: navigator.onLine,
            ua: navigator.userAgent,
            attempt,
          });
        } catch {}
        if (!navigator.onLine || attempt >= max) throw error;
        const delay = 800 * Math.pow(2, attempt - 1);
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            tryImport().then(resolve).catch(reject);
          }, delay);
        });
      });
    return tryImport();
  });
};
import SignupForm from "./components/loginComponents/signupForm";
import LoginPage from "./components/loginComponents/loginPage";

// Contexts
import { UserProvider } from "./contexts/UserContext";

// Admin Side
const LazyAdminHome = lazyWithRetry(() =>
  import("./components/adminComponents/adminHomeComponents/adminHome")
);
const LazyAdminContent = lazyWithRetry(() =>
  import("./components/adminComponents/adminContentComponents/adminContent")
);
const LazyManageEmergency = lazyWithRetry(() =>
  import(
    "./components/adminComponents/manageEmergencyComponents/manageEmergency"
  )
);
const LazyAdminPhotobooth = lazyWithRetry(() =>
  import(
    "./components/adminComponents/adminPhotoboothComponents/adminPhotobooth"
  )
);
const LazyAdminRole = lazyWithRetry(() =>
  import("./components/adminComponents/adminRoleComponents/adminRole")
);
const LazyAdminLog = lazyWithRetry(() =>
  import("./components/adminComponents/adminLogComponents/adminLog")
);
const LazyAdminChatbot = lazyWithRetry(() =>
  import("./components/adminComponents/adminChatbotComponents/adminChatbot")
);
const LazyAdminMap = lazyWithRetry(() =>
  import("./components/adminComponents/adminTourMapComponents/AdminTourMap")
);
const LazyAdminItinerary = lazyWithRetry(() =>
  import("./components/adminComponents/adminItineraryComponents/adminItinerary")
);
const LazyAdminReviews = lazyWithRetry(() =>
  import("./components/adminComponents/adminReviewsComponents/adminReviews")
);
const LazyAdminReports = lazyWithRetry(() =>
  import("./components/adminComponents/adminReportsComponents/adminReports")
);
const LazyAdminProfileLayout = lazyWithRetry(() =>
  import(
    "./components/adminComponents/adminProfileComponents/adminProfileLayout"
  )
);
const LazyAdminProfile = lazyWithRetry(() =>
  import("./components/adminComponents/adminProfileComponents/adminProfile")
);
const LazyAdminAccount = lazyWithRetry(() =>
  import("./components/adminComponents/adminProfileComponents/adminAccount")
);
const LazyAdminBirthday = lazyWithRetry(() =>
  import("./components/adminComponents/adminProfileComponents/adminBirthday")
);
const LazyAdminGender = lazyWithRetry(() =>
  import("./components/adminComponents/adminProfileComponents/adminGender")
);
const LazyAdminCountry = lazyWithRetry(() =>
  import("./components/adminComponents/adminProfileComponents/adminCountry")
);
const LazyAdminLanguage = lazyWithRetry(() =>
  import("./components/adminComponents/adminProfileComponents/adminLanguage")
);
// Tourist Side
const LazyHomepage = lazyWithRetry(() =>
  import("./components/userComponents/HomepageComponents/Homepage")
);
const LazyEmergencyPage = lazyWithRetry(() =>
  import("./components/userComponents/EmegencyComponents/EmergencyPage")
);
const LazyProfilePage = lazyWithRetry(() =>
  import("./components/userComponents/ProfileComponents/Profile")
);
const LazyPhotobooth = lazyWithRetry(() =>
  import("./components/userComponents/photoboothComponents/Photobooth")
);
const LazyAccount = lazyWithRetry(() =>
  import("./components/userComponents/ProfileComponents/Account")
);
const LazyProfileLayout = lazyWithRetry(() =>
  import("./components/userComponents/ProfileComponents/ProfileLayout")
);
import "./App.css";
const LazyBirthday = lazyWithRetry(() =>
  import("./components/userComponents/ProfileComponents/Birthday")
);
const LazyGender = lazyWithRetry(() =>
  import("./components/userComponents/ProfileComponents/Gender")
);
const LazyCountry = lazyWithRetry(() =>
  import("./components/userComponents/ProfileComponents/Country")
);
const LazyLanguage = lazyWithRetry(() =>
  import("./components/userComponents/ProfileComponents/Language")
);
const LazySettings = lazyWithRetry(() =>
  import("./components/userComponents/ProfileComponents/Settings")
);
const LazyTripArchives = lazyWithRetry(() =>
  import("./components/userComponents/TripArchive/TripArchive")
);
const LazyCreateItineraryPage = lazyWithRetry(() =>
  import("./components/userComponents/CreateItinerary/CreateItinerary")
);
import TourMap from "./components/userComponents/TourMap/LazyUserMap";
const LazyChatbot = lazyWithRetry(() =>
  import("./components/userComponents/ChatbotComponents/Chatbot")
);
const LazyTouristItinerary = lazyWithRetry(() =>
  import("./components/userComponents/HomepageComponents/TouristItinerary")
);
const LazyTouristItineraryMap = lazyWithRetry(() =>
  import("./components/userComponents/HomepageComponents/TouristItinerariesMap")
);
import ttsService from "./utils/textToSpeech";
import {
  setPhotoboothRouteActive,
  scheduleCameraStop,
  cancelCameraStop,
} from "./utils/cameraLifecycle";

// Guest Side
const LazyGuestHomepage = lazyWithRetry(() =>
  import("./components/userComponents/HomepageComponents/GuestHomepage")
);
const LazyGuestProfile = lazyWithRetry(() =>
  import("./components/userComponents/GuestProfileComponents/GuestProfile")
);
const LazyGuestProfileLayout = lazyWithRetry(() =>
  import(
    "./components/userComponents/GuestProfileComponents/GuestProfileLayout"
  )
);
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import TouristProtectedRoute from "./components/TouristProtectedRoute";
const LazyGuestLanguage = lazyWithRetry(() =>
  import("./components/userComponents/GuestProfileComponents/GuestLanguage")
);
const LazyGuestItinerary = lazyWithRetry(() =>
  import("./components/userComponents/GuestItineraryComponents/GuestItinerary")
);
const LazyGuestItineraryMap = lazyWithRetry(() =>
  import(
    "./components/userComponents/GuestItineraryComponents/GuestItineraryMap"
  )
);
import TourProvider from "./components/TourComponents/TourProvider";
import {
  mapTourSteps,
  emergencyTourSteps,
  profileTourSteps,
  guestProfileTourSteps,
  tourMapSteps,
  photoboothTourSteps,
  tripArchiveTourSteps,
} from "./components/TourComponents/tourSteps";
const LazyGuestSettings = lazyWithRetry(() =>
  import("./components/userComponents/GuestProfileComponents/GuestSettings")
);
const LazyNotFound = lazyWithRetry(() => import("./components/NotFound"));
import ModernLoader from "./components/shared/ModernLoader";
const LazyCompleteProfile = lazyWithRetry(() =>
  import("./components/userComponents/CompleteProfile")
);
// import GuestProtectedRoute from "./components/GuestProtectedRoute";

// Helper wrapper to inject location for AnimatePresence
function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupForm />} />
        <Route
          path="/CompleteProfile"
          element={
            <React.Suspense fallback={<ModernLoader progress={95} />}>
              {" "}
              <LazyCompleteProfile />{" "}
            </React.Suspense>
          }
        />
        {/* Public Pages */}\
        <Route
          path="/GuestHomepage"
          element={
            <React.Suspense fallback={<ModernLoader progress={95} />}>
              {" "}
              <LazyGuestHomepage />{" "}
            </React.Suspense>
          }
        />
        <Route
          path="/GuestItinerary"
          element={
            <React.Suspense fallback={<ModernLoader progress={95} />}>
              {" "}
              <LazyGuestItinerary />{" "}
            </React.Suspense>
          }
        />
        <Route
          path="/GuestItineraryMap/:itineraryId"
          element={
            <TourProvider
              steps={mapTourSteps}
              userRole="guest"
              scrollToFirstStep={false}
              disableScrolling={true}
              tourType="map"
            >
              <React.Suspense fallback={<ModernLoader progress={95} />}>
                {" "}
                <LazyGuestItineraryMap />{" "}
              </React.Suspense>
            </TourProvider>
          }
        />
        <Route
          path="/TourMap"
          element={
            <TourProvider
              steps={tourMapSteps}
              userRole="tourist"
              scrollToFirstStep={true}
              disableScrolling={true}
              tourType="tourMap"
            >
              <TourMap />
            </TourProvider>
          }
        />
        <Route
          path="/Chatbot"
          element={
            <React.Suspense fallback={<ModernLoader progress={95} />}>
              {" "}
              <LazyChatbot />{" "}
            </React.Suspense>
          }
        />
        <Route
          path="/Emergency"
          element={
            <TourProvider
              steps={emergencyTourSteps}
              userRole="tourist"
              scrollToFirstStep={true}
              disableScrolling={true}
              tourType="emergency"
            >
              <React.Suspense fallback={<ModernLoader progress={95} />}>
                {" "}
                <LazyEmergencyPage />{" "}
              </React.Suspense>
            </TourProvider>
          }
        />
        <Route
          path="/Photobooth"
          element={
            <TourProvider
              steps={photoboothTourSteps}
              userRole="tourist"
              scrollToFirstStep={true}
              disableScrolling={true}
              tourType="photobooth"
            >
              <React.Suspense fallback={<ModernLoader progress={95} />}>
                {" "}
                <LazyPhotobooth />{" "}
              </React.Suspense>
            </TourProvider>
          }
        />
        {/* Guest Profile Section */}
        <Route
          path="/GuestProfile"
          element={
            <React.Suspense fallback={<ModernLoader progress={95} />}>
              {" "}
              <LazyGuestProfileLayout />{" "}
            </React.Suspense>
          }
        >
          <Route
            index
            element={
              <TourProvider
                steps={guestProfileTourSteps}
                userRole="guest"
                scrollToFirstStep={true}
                disableScrolling={true}
                tourType="guestProfile"
              >
                <React.Suspense fallback={<ModernLoader progress={95} />}>
                  {" "}
                  <LazyGuestProfile />{" "}
                </React.Suspense>
              </TourProvider>
            }
          />
          <Route
            path="GuestLanguage"
            element={
              <React.Suspense fallback={<ModernLoader progress={95} />}>
                {" "}
                <LazyGuestLanguage />{" "}
              </React.Suspense>
            }
          />
          <Route
            path="GuestSettings"
            element={
              <React.Suspense fallback={<ModernLoader progress={95} />}>
                {" "}
                <LazyGuestSettings />{" "}
              </React.Suspense>
            }
          />
        </Route>
        <Route element={<AdminProtectedRoute />}>
          {/* Admin */}
          <Route
            path="/AdminHome"
            element={
              <React.Suspense fallback={<ModernLoader progress={95} />}>
                {" "}
                <LazyAdminHome />{" "}
              </React.Suspense>
            }
          />
          <Route
            path="/AdminManageContent"
            element={
              <React.Suspense fallback={<ModernLoader progress={95} />}>
                {" "}
                <LazyAdminContent />{" "}
              </React.Suspense>
            }
          />
          <Route
            path="/AdminManageEmergency"
            element={
              <React.Suspense fallback={<ModernLoader progress={95} />}>
                {" "}
                <LazyManageEmergency />{" "}
              </React.Suspense>
            }
          />
          <Route
            path="/AdminManageRole"
            element={
              <React.Suspense fallback={<ModernLoader progress={95} />}>
                {" "}
                <LazyAdminRole />{" "}
              </React.Suspense>
            }
          />
          <Route
            path="/AdminLog"
            element={
              <React.Suspense fallback={<ModernLoader progress={95} />}>
                {" "}
                <LazyAdminLog />{" "}
              </React.Suspense>
            }
          />
          <Route
            path="/AdminTourMap"
            element={
              <React.Suspense fallback={<ModernLoader progress={95} />}>
                {" "}
                <LazyAdminMap />{" "}
              </React.Suspense>
            }
          />
          <Route
            path="/AdminManageChatbot"
            element={
              <React.Suspense fallback={<ModernLoader progress={95} />}>
                {" "}
                <LazyAdminChatbot />{" "}
              </React.Suspense>
            }
          />
          <Route
            path="/AdminItinerary"
            element={
              <React.Suspense fallback={<ModernLoader progress={95} />}>
                {" "}
                <LazyAdminItinerary />{" "}
              </React.Suspense>
            }
          />
          <Route
            path="/AdminPhotobooth"
            element={
              <React.Suspense fallback={<ModernLoader progress={95} />}>
                {" "}
                <LazyAdminPhotobooth />{" "}
              </React.Suspense>
            }
          />
          <Route
            path="/AdminReviews"
            element={
              <React.Suspense fallback={<ModernLoader progress={95} />}>
                {" "}
                <LazyAdminReviews />{" "}
              </React.Suspense>
            }
          />
          <Route
            path="/AdminReports"
            element={
              <React.Suspense fallback={<ModernLoader progress={95} />}>
                {" "}
                <LazyAdminReports />{" "}
              </React.Suspense>
            }
          />
          <Route
            path="/AdminProfile"
            element={
              <React.Suspense fallback={<ModernLoader progress={95} />}>
                {" "}
                <LazyAdminProfileLayout />{" "}
              </React.Suspense>
            }
          >
            <Route
              index
              element={
                <React.Suspense fallback={<ModernLoader progress={95} />}>
                  {" "}
                  <LazyAdminProfile />{" "}
                </React.Suspense>
              }
            />
            <Route
              path="Account"
              element={
                <React.Suspense fallback={<ModernLoader progress={95} />}>
                  {" "}
                  <LazyAdminAccount />{" "}
                </React.Suspense>
              }
            />
            <Route
              path="Birthday"
              element={
                <React.Suspense fallback={<ModernLoader progress={95} />}>
                  {" "}
                  <LazyAdminBirthday />{" "}
                </React.Suspense>
              }
            />
            <Route
              path="Gender"
              element={
                <React.Suspense fallback={<ModernLoader progress={95} />}>
                  {" "}
                  <LazyAdminGender />{" "}
                </React.Suspense>
              }
            />
            <Route
              path="Country"
              element={
                <React.Suspense fallback={<ModernLoader progress={95} />}>
                  {" "}
                  <LazyAdminCountry />{" "}
                </React.Suspense>
              }
            />
            <Route
              path="Language"
              element={
                <React.Suspense fallback={<ModernLoader progress={95} />}>
                  {" "}
                  <LazyAdminLanguage />{" "}
                </React.Suspense>
              }
            />
          </Route>
        </Route>
        <Route element={<TouristProtectedRoute />}>
          {/* Tourist */}
          <Route
            path="/Homepage"
            element={
              <React.Suspense fallback={<ModernLoader progress={95} />}>
                {" "}
                <LazyHomepage />{" "}
              </React.Suspense>
            }
          />{" "}
          <Route
            path="/TripArchive"
            element={
              <TourProvider
                steps={tripArchiveTourSteps}
                userRole="tourist"
                scrollToFirstStep={true}
                disableScrolling={true}
                tourType="tripArchive"
              >
                <React.Suspense fallback={<ModernLoader progress={95} />}>
                  {" "}
                  <LazyTripArchives />{" "}
                </React.Suspense>
              </TourProvider>
            }
          />
          <Route
            path="/CreateItinerary"
            element={
              <React.Suspense fallback={<ModernLoader progress={95} />}>
                {" "}
                <LazyCreateItineraryPage />{" "}
              </React.Suspense>
            }
          />
          <Route
            path="/TouristItinerary"
            element={
              <React.Suspense fallback={<ModernLoader progress={95} />}>
                {" "}
                <LazyTouristItinerary />{" "}
              </React.Suspense>
            }
          />
          <Route
            path="/TouristItineraryMap/:itineraryId"
            element={
              <TourProvider
                steps={mapTourSteps}
                userRole="tourist"
                scrollToFirstStep={false}
                disableScrolling={true}
                tourType="map"
              >
                <React.Suspense fallback={<ModernLoader progress={95} />}>
                  {" "}
                  <LazyTouristItineraryMap />{" "}
                </React.Suspense>
              </TourProvider>
            }
          />
          {/* Profile Section with Persistent Header */}
          <Route
            path="/Profile"
            element={
              <React.Suspense fallback={<ModernLoader progress={95} />}>
                <LazyProfileLayout />
              </React.Suspense>
            }
          >
            <Route
              index
              element={
                <TourProvider
                  steps={profileTourSteps}
                  userRole="tourist"
                  scrollToFirstStep={true}
                  disableScrolling={true}
                  tourType="profile"
                >
                  <React.Suspense fallback={<ModernLoader progress={95} />}>
                    {" "}
                    <LazyProfilePage />{" "}
                  </React.Suspense>
                </TourProvider>
              }
            />
            <Route
              path="Account"
              element={
                <React.Suspense fallback={<ModernLoader progress={95} />}>
                  {" "}
                  <LazyAccount />{" "}
                </React.Suspense>
              }
            />
            <Route
              path="Birthday"
              element={
                <React.Suspense fallback={<ModernLoader progress={95} />}>
                  {" "}
                  <LazyBirthday />{" "}
                </React.Suspense>
              }
            />
            <Route
              path="Gender"
              element={
                <React.Suspense fallback={<ModernLoader progress={95} />}>
                  {" "}
                  <LazyGender />{" "}
                </React.Suspense>
              }
            />
            <Route
              path="Country"
              element={
                <React.Suspense fallback={<ModernLoader progress={95} />}>
                  {" "}
                  <LazyCountry />{" "}
                </React.Suspense>
              }
            />
            <Route
              path="Language"
              element={
                <React.Suspense fallback={<ModernLoader progress={95} />}>
                  {" "}
                  <LazyLanguage />{" "}
                </React.Suspense>
              }
            />
            <Route
              path="Settings"
              element={
                <React.Suspense fallback={<ModernLoader progress={95} />}>
                  {" "}
                  <LazySettings />{" "}
                </React.Suspense>
              }
            />
          </Route>
        </Route>
        {/* <Route element={<GuestProtectedRoute />}> */}
        {/* </Route> */}
        {/* 404 Not Found - Must be last */}
        <Route
          path="*"
          element={
            <React.Suspense fallback={<ModernLoader progress={95} />}>
              {" "}
              <LazyNotFound />{" "}
            </React.Suspense>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}

// Global guard: cancel any ongoing speech when not on itinerary map routes
function TTSCancelOnRouteLeave() {
  const location = useLocation();

  useEffect(() => {
    const allowed =
      location.pathname.startsWith("/TouristItineraryMap/") ||
      location.pathname.startsWith("/GuestItineraryMap/");
    if (!allowed) {
      ttsService.cancel();
    }
  }, [location.pathname]);

  // Also cancel on page hide/unload or when tab becomes hidden
  useEffect(() => {
    const cancel = () => ttsService.cancel();
    const onVisibility = () => {
      if (document.hidden) cancel();
    };
    window.addEventListener("pagehide", cancel);
    window.addEventListener("beforeunload", cancel);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", cancel);
      window.removeEventListener("beforeunload", cancel);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return null;
}

// Camera lifecycle: schedule stop when leaving Photobooth or app becomes hidden
function CameraLifecycleOnRouteLeave() {
  const location = useLocation();
  useEffect(() => {
    const isPhotobooth =
      location.pathname.startsWith("/Photobooth") ||
      location.pathname.startsWith("/PhotoboothJeeliz");
    // Update active route flag
    setPhotoboothRouteActive(isPhotobooth);

    // If we just left Photobooth, stop camera after a short delay. This gives
    // components like QRScanner a chance to mount, acquire the camera and
    // cancel the stop before it triggers.
    if (!isPhotobooth) {
      scheduleCameraStop(0);
    } else {
      // If we're on Photobooth, ensure any pending stop is canceled
      cancelCameraStop();
    }
  }, [location.pathname]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        // App/tab hidden: stop camera immediately
        scheduleCameraStop(0);
      } else {
        // Returned: cancel any pending stop; Photobooth re-init handles itself
        cancelCameraStop();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", () => scheduleCameraStop(0));
    window.addEventListener("beforeunload", () => scheduleCameraStop(0));
    document.addEventListener("freeze", () => scheduleCameraStop(0));
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", () => scheduleCameraStop(0));
      window.removeEventListener("beforeunload", () => scheduleCameraStop(0));
      document.removeEventListener("freeze", () => scheduleCameraStop(0));
    };
  }, []);

  return null;
}

function CameraPermissionKeeper() {
  const location = useLocation();
  useEffect(() => {
    const isCameraRoute = () => {
      const p = location.pathname || "";
      return (
        p.startsWith("/Photobooth") ||
        p.startsWith("/PhotoboothJeeliz") ||
        p.startsWith("/TouristItineraryMap/") ||
        p.startsWith("/GuestItineraryMap/")
      );
    };
    const hasActiveStream = () => {
      try {
        const videos = document.querySelectorAll("video");
        for (const v of videos) {
          const s = v.srcObject;
          if (s && typeof s.getTracks === "function") {
            const live = s.getTracks().some((t) => t.readyState === "live");
            if (live) return true;
          }
        }
      } catch {}
      return false;
    };

    const preflight = async () => {
      if (!isCameraRoute()) return;
      if (hasActiveStream()) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        try {
          stream.getTracks().forEach((t) => {
            try {
              t.stop();
            } catch {}
          });
        } catch {}
      } catch {}
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") preflight();
    };
    const onFocus = () => preflight();
    const onPageShow = () => preflight();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [location.pathname]);
  return null;
}

function JeelizErrorShield() {
  const location = useLocation();
  useEffect(() => {
    const isPhotobooth =
      location.pathname.startsWith("/Photobooth") ||
      location.pathname.startsWith("/PhotoboothJeeliz");
    const onError = (e) => {
      const src = e?.filename || "";
      if (!isPhotobooth && /jeelizFaceFilter\.js/i.test(src)) {
        if (typeof e.preventDefault === "function") e.preventDefault();
        return true;
      }
    };
    const onUnhandled = (e) => {
      const s = (e?.reason && e.reason.stack) || "";
      if (!isPhotobooth && /jeelizFaceFilter\.js/i.test(s)) {
        if (typeof e.preventDefault === "function") e.preventDefault();
      }
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandled);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandled);
    };
  }, [location.pathname]);
  return null;
}

function JeelizDomShield() {
  const location = useLocation();
  useEffect(() => {
    try {
      if (!window.__JUANDER_ORIG_GETBYID) {
        window.__JUANDER_ORIG_GETBYID = document.getElementById.bind(document);
      }
      const placeholder =
        window.__JUANDER_JEE_PLACEHOLDER ||
        (() => {
          const p = {
            id: "jeeFaceFilterCanvas",
            width: 1,
            height: 1,
            clientWidth: 1,
            clientHeight: 1,
            style: {},
            parentElement: {
              getBoundingClientRect: () => ({
                width: 1,
                height: 1,
                left: 0,
                top: 0,
              }),
            },
            getBoundingClientRect: () => ({
              width: 1,
              height: 1,
              left: 0,
              top: 0,
            }),
            addEventListener: () => {},
            removeEventListener: () => {},
          };
          window.__JUANDER_JEE_PLACEHOLDER = p;
          return p;
        })();
      if (!window.__JUANDER_PATCHED_GETBYID) {
        const orig = window.__JUANDER_ORIG_GETBYID;
        document.getElementById = function (id) {
          const el = orig(id);
          if (!el && id === "jeeFaceFilterCanvas") return placeholder;
          return el;
        };
        window.__JUANDER_PATCHED_GETBYID = true;
      }
    } catch {}
    return () => {
      try {
        if (window.__JUANDER_ORIG_GETBYID) {
          document.getElementById = window.__JUANDER_ORIG_GETBYID;
          delete window.__JUANDER_PATCHED_GETBYID;
        }
      } catch {}
    };
  }, [location.pathname]);
  return null;
}

export default function App() {
  useEffect(() => {
    const savedLang = localStorage.getItem("language") || "en";
    i18n.changeLanguage(savedLang);
  }, []);
  useEffect(() => {
    try {
      if (!window.__JUANDER_PATCHED_SRC_OBJECT) {
        const proto =
          HTMLMediaElement?.prototype || HTMLVideoElement?.prototype;
        const desc =
          proto && Object.getOwnPropertyDescriptor(proto, "srcObject");
        if (desc && typeof desc.set === "function") {
          const origSet = desc.set;
          const patchedSet = function (value) {
            try {
              if (value && typeof value.getTracks === "function") {
                if (!window.__JUANDER_TRACKED_STREAMS) {
                  window.__JUANDER_TRACKED_STREAMS = new Set();
                }
                window.__JUANDER_TRACKED_STREAMS.add(value);
              }
            } catch {}
            return origSet.call(this, value);
          };
          Object.defineProperty(proto, "srcObject", {
            ...desc,
            set: patchedSet,
          });
          window.__JUANDER_PATCHED_SRC_OBJECT = true;
        }
      }
    } catch {}
  }, []);
  return (
    <LazyLoadErrorBoundary>
      <I18nextProvider i18n={i18n}>
        <UserProvider>
          <Router>
            <AuthPersistence>
              <AnimatedRoutes />
              <TTSCancelOnRouteLeave />
              <CameraLifecycleOnRouteLeave />
              <CameraPermissionKeeper />
              <JeelizErrorShield />
              <JeelizDomShield />
              <ConnectionStatus />
              <PWAInstallPrompt />
            </AuthPersistence>
          </Router>
        </UserProvider>
      </I18nextProvider>
    </LazyLoadErrorBoundary>
  );
}
