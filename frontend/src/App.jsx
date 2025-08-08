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
import AdminMap from "./components/userComponents/TourMap/AdminTourMap";
// Helper wrapper to inject location for AnimatePresence
function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Navigate to="/Homepage" replace />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Admin */}
        <Route path="/AdminHome" element={<AdminHome />} />
        <Route path="/AdminManageContent" element={<AdminContent />} />
        <Route path="/AdminManageEmergency" element={<ManageEmergency />} />
        <Route path="/AdminTourMap" element={<AdminMap />} />

        {/* Tourist */}
        <Route path="/Homepage" element={<Homepage />} />
        <Route path="/Emergency" element={<EmergencyPage />} />
        <Route path="/Photobooth" element={<Photobooth />} />
        <Route path="/TripArchive" element={<TripArchives />} />
        <Route path="/CreateItinerary" element={<CreateItineraryPage />} />
        <Route path="/TourMap" element={<TourMap />} />

        {/* Profile Section with Persistent Header */}
        <Route path="/Profile" element={<ProfileLayout />}>
          <Route index element={<ProfilePage />} />{" "}
          {/* default view under /Profile */}
          <Route path="Account" element={<Account />} />
          <Route path="/Profile/Birthday" element={<Birthday />} />
          <Route path="/Profile/Gender" element={<Gender />} />
          <Route path="/Profile/Country" element={<Country />} />
          <Route path="/Profile/Language" element={<Language />} />
          {/* Future: Add /Birthday, /Gender, /Country, /Language */}
        </Route>
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
