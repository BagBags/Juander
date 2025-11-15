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
import PhotoboothJeeliz from "./components/userComponents/photoboothComponents/PhotoboothJeeliz";
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

// Guest Side
import GuestHomepage from "./components/userComponents/HomepageComponents/GuestHomepage";
import GuestProfile from "./components/userComponents/GuestProfileComponents/GuestProfile";
import GuestProfileLayout from "./components/userComponents/GuestProfileComponents/GuestProfileLayout";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import TouristProtectedRoute from "./components/TouristProtectedRoute";
import GuestLanguage from "./components/userComponents/GuestProfileComponents/GuestLanguage";
import GuestItinerary from "./components/userComponents/GuestItineraryComponents/GuestItinerary";
import GuestItineraryMap from "./components/userComponents/GuestItineraryComponents/GuestItineraryMap";
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
          element={<GuestItineraryMap />}
        />
        <Route path="/TourMap" element={<TourMap />} />
        <Route path="/Chatbot" element={<Chatbot />} />
        <Route path="/Emergency" element={<EmergencyPage />} />
        <Route path="/Photobooth" element={<Photobooth />} />
        <Route path="/PhotoboothJeeliz" element={<PhotoboothJeeliz />} />
        {/* Guest Profile Section */}
        <Route path="/GuestProfile" element={<GuestProfileLayout />}>
          <Route index element={<GuestProfile />} />
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
          <Route path="/TripArchive" element={<TripArchives />} />
          <Route path="/CreateItinerary" element={<CreateItineraryPage />} />
          <Route path="/TouristItinerary" element={<TouristItinerary />} />
          <Route
            path="/TouristItineraryMap/:itineraryId"
            element={<TouristItineraryMap />}
          />
          {/* Profile Section with Persistent Header */}
          <Route path="/Profile" element={<ProfileLayout />}>
            <Route index element={<ProfilePage />} />
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
              <ConnectionStatus />
              <PWAInstallPrompt />
            </AuthPersistence>
          </Router>
        </UserProvider>
      </I18nextProvider>
    </LazyLoadErrorBoundary>
  );
}
