import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AnimatePresence } from "framer-motion";

// Admin Side
import AdminHome from "./components/adminComponents/adminHomeComponents/adminHome";
import AdminContent from "./components/adminComponents/adminContentComponents/adminContent";
import ManageEmergency from "./components/adminComponents/manageEmergencyComponents/manageEmergency";
import LoginPage from "./components/loginComponents/loginPage";
import AdminRole from "./components/adminComponents/adminRoleComponents/adminRole";
import AdminLog from "./components/adminComponents/adminLogComponents/adminLog";
import AdminChatbot from "./components/adminComponents/adminChatbotComponents/adminChatbot";
import AdminMap from "./components/adminComponents/adminTourMapComponents/AdminTourMap";
import AdminItinerary from "./components/adminComponents/adminItineraryComponents/adminItinerary";
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
import TripArchives from "./components/userComponents/TripArchive/TripArchive";
import CreateItineraryPage from "./components/userComponents/CreateItinerary/CreateItinerary";
import TourMap from "./components/userComponents/TourMap/TourMap";
import Chatbot from "./components/userComponents/ChatbotComponents/Chatbot";

// Guest Side
import GuestHomepage from "./components/userComponents/HomepageComponents/GuestHomepage";

import AdminProtectedRoute from "./components/AdminProtectedRoute";
import TouristProtectedRoute from "./components/TouristProtectedRoute";
// import GuestProtectedRoute from "./components/GuestProtectedRoute";

// Helper wrapper to inject location for AnimatePresence
function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        {/* Public Pages */}\
        <Route path="/GuestHomepage" element={<GuestHomepage />} />
        <Route path="/TourMap" element={<TourMap />} />
        <Route path="/Chatbot" element={<Chatbot />} />
        <Route path="/Emergency" element={<EmergencyPage />} />
        <Route path="/Photobooth" element={<Photobooth />} />
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
        </Route>
        <Route element={<TouristProtectedRoute />}>
          {/* Tourist */}
          <Route path="/Homepage" element={<Homepage />} />{" "}
          <Route path="/TripArchive" element={<TripArchives />} />
          <Route path="/CreateItinerary" element={<CreateItineraryPage />} />
          {/* Profile Section with Persistent Header */}
          <Route path="/Profile" element={<ProfileLayout />}>
            <Route index element={<ProfilePage />} />
            <Route path="Account" element={<Account />} />
            <Route path="Birthday" element={<Birthday />} />
            <Route path="Gender" element={<Gender />} />
            <Route path="Country" element={<Country />} />
            <Route path="Language" element={<Language />} />
          </Route>
        </Route>
        {/* <Route element={<GuestProtectedRoute />}> */}
        {/* </Route> */}
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <Router>
      <AnimatedRoutes />
    </Router>
  );
}
