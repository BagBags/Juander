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

import SignupForm from "./components/loginComponents/signupForm";
import LoginPage from "./components/loginComponents/loginPage";

// Contexts
import { UserProvider } from "./contexts/UserContext";

// Admin Side
import AdminHome from "./components/adminComponents/adminHomeComponents/adminHome";
import AdminContent from "./components/adminComponents/adminContentComponents/adminContent";
import ManageEmergency from "./components/adminComponents/manageEmergencyComponents/manageEmergency";
import AdminPhotobooth from "./components/adminComponents/adminPhotoboothComponents/adminPhotobooth";
import AdminRole from "./components/adminComponents/adminRoleComponents/adminRole";
import AdminLog from "./components/adminComponents/adminLogComponents/adminLog";
import AdminChatbot from "./components/adminComponents/adminChatbotComponents/adminChatbot";
import AdminMap from "./components/adminComponents/adminTourMapComponents/AdminTourMap";
import AdminItinerary from "./components/adminComponents/adminItineraryComponents/adminItinerary";
import AdminReviews from "./components/adminComponents/adminReviewsComponents/adminReviews";
import AdminReports from "./components/adminComponents/adminReportsComponents/adminReports";
import AdminProfileLayout from "./components/adminComponents/adminProfileComponents/adminProfileLayout";
import AdminProfile from "./components/adminComponents/adminProfileComponents/adminProfile";
import AdminAccount from "./components/adminComponents/adminProfileComponents/adminAccount";
import AdminBirthday from "./components/adminComponents/adminProfileComponents/adminBirthday";
import AdminGender from "./components/adminComponents/adminProfileComponents/adminGender";
import AdminCountry from "./components/adminComponents/adminProfileComponents/adminCountry";
import AdminLanguage from "./components/adminComponents/adminProfileComponents/adminLanguage";
// Tourist Side
import Homepage from "./components/userComponents/HomepageComponents/Homepage";
import EmergencyPage from "./components/userComponents/EmegencyComponents/EmergencyPage";
import ProfilePage from "./components/userComponents/ProfileComponents/Profile";
import Photobooth from "./components/userComponents/photoboothComponents/Photobooth";
import Account from "./components/userComponents/ProfileComponents/Account";
import ProfileLayout from "./components/userComponents/ProfileComponents/ProfileLayout";
import "./App.css";
import Birthday from "./components/userComponents/ProfileComponents/Birthday";
import Gender from "./components/userComponents/ProfileComponents/Gender";
import Country from "./components/userComponents/ProfileComponents/Country";
import Language from "./components/userComponents/ProfileComponents/Language";
import Settings from "./components/userComponents/ProfileComponents/Settings";
import TripArchives from "./components/userComponents/TripArchive/TripArchive";
import CreateItineraryPage from "./components/userComponents/CreateItinerary/CreateItinerary";
import TourMap from "./components/userComponents/TourMap/LazyUserMap";
import Chatbot from "./components/userComponents/ChatbotComponents/Chatbot";
import TouristItinerary from "./components/userComponents/HomepageComponents/TouristItinerary";
import TouristItineraryMap from "./components/userComponents/HomepageComponents/TouristItinerariesMap";
import ttsService from "./utils/textToSpeech";
import {
  setPhotoboothRouteActive,
  scheduleCameraStop,
  cancelCameraStop,
} from "./utils/cameraLifecycle";

// Guest Side
import GuestHomepage from "./components/userComponents/HomepageComponents/GuestHomepage";
import GuestProfile from "./components/userComponents/GuestProfileComponents/GuestProfile";
import GuestProfileLayout from "./components/userComponents/GuestProfileComponents/GuestProfileLayout";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import TouristProtectedRoute from "./components/TouristProtectedRoute";
import GuestLanguage from "./components/userComponents/GuestProfileComponents/GuestLanguage";
import GuestItinerary from "./components/userComponents/GuestItineraryComponents/GuestItinerary";
import GuestItineraryMap from "./components/userComponents/GuestItineraryComponents/GuestItineraryMap";
import TourProvider from "./components/TourComponents/TourProvider";
import { mapTourSteps, emergencyTourSteps, profileTourSteps, guestProfileTourSteps, tourMapSteps, photoboothTourSteps, tripArchiveTourSteps } from "./components/TourComponents/tourSteps";
import GuestSettings from "./components/userComponents/GuestProfileComponents/GuestSettings";
import NotFound from "./components/NotFound";
import CompleteProfile from "./components/userComponents/CompleteProfile";
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
        <Route path="/CompleteProfile" element={<CompleteProfile />} />
        {/* Public Pages */}\
        <Route path="/GuestHomepage" element={<GuestHomepage />} />
        <Route path="/GuestItinerary" element={<GuestItinerary />} />
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
              <GuestItineraryMap />
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
        <Route path="/Chatbot" element={<Chatbot />} />
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
              <EmergencyPage />
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
              <Photobooth />
            </TourProvider>
          }
        />
        {/* Guest Profile Section */}
        <Route path="/GuestProfile" element={<GuestProfileLayout />}>
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
                <GuestProfile />
              </TourProvider>
            }
          />
          <Route path="GuestLanguage" element={<GuestLanguage />} />
          <Route path="GuestSettings" element={<GuestSettings />} />
        </Route>
        <Route element={<AdminProtectedRoute />}>
          {/* Admin */}
          <Route path="/AdminHome" element={<AdminHome />} />
          <Route path="/AdminManageContent" element={<AdminContent />} />
          <Route path="/AdminManageEmergency" element={<ManageEmergency />} />
          <Route path="/AdminManageRole" element={<AdminRole />} />
          <Route path="/AdminLog" element={<AdminLog />} />
          <Route path="/AdminTourMap" element={<AdminMap />} />
          <Route path="/AdminManageChatbot" element={<AdminChatbot />} />
          <Route path="/AdminItinerary" element={<AdminItinerary />} />
          <Route path="/AdminPhotobooth" element={<AdminPhotobooth />} />
          <Route path="/AdminReviews" element={<AdminReviews />} />
          <Route path="/AdminReports" element={<AdminReports />} />
          <Route path="/AdminProfile" element={<AdminProfileLayout />}>
            <Route index element={<AdminProfile />} />
            <Route path="Account" element={<AdminAccount />} />
            <Route path="Birthday" element={<AdminBirthday />} />
            <Route path="Gender" element={<AdminGender />} />
            <Route path="Country" element={<AdminCountry />} />
            <Route path="Language" element={<AdminLanguage />} />
          </Route>
        </Route>
        <Route element={<TouristProtectedRoute />}>
          {/* Tourist */}
          <Route path="/Homepage" element={<Homepage />} />{" "}
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
                <TripArchives />
              </TourProvider>
            }
          />
          <Route path="/CreateItinerary" element={<CreateItineraryPage />} />
          <Route path="/TouristItinerary" element={<TouristItinerary />} />
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
                <TouristItineraryMap />
              </TourProvider>
            }
          />
          {/* Profile Section with Persistent Header */}
          <Route path="/Profile" element={<ProfileLayout />}>
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
                  <ProfilePage />
                </TourProvider>
              }
            />
            <Route path="Account" element={<Account />} />
            <Route path="Birthday" element={<Birthday />} />
            <Route path="Gender" element={<Gender />} />
            <Route path="Country" element={<Country />} />
            <Route path="Language" element={<Language />} />
            <Route path="Settings" element={<Settings />} />
          </Route>
        </Route>
        {/* <Route element={<GuestProtectedRoute />}> */}
        {/* </Route> */}
        {/* 404 Not Found - Must be last */}
        <Route path="*" element={<NotFound />} />
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

    // If we just left Photobooth, stop camera immediately
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

export default function App() {
  useEffect(() => {
    const savedLang = localStorage.getItem("language") || "en";
    i18n.changeLanguage(savedLang);
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
              <ConnectionStatus />
              <PWAInstallPrompt />
            </AuthPersistence>
          </Router>
        </UserProvider>
      </I18nextProvider>
    </LazyLoadErrorBoundary>
  );
}
