import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// Admin Side
import AdminHome from "./components/adminComponents/adminHomeComponents/adminHome";
import AdminContent from "./components/adminComponents/adminContentComponents/adminContent";
import ManageEmergency from "./components/adminComponents/manageEmergencyComponents/manageEmergency";
import LoginPage from "./components/loginComponents/loginPage";
import Homepage from "./components/userComponents/HomepageComponents/Homepage";
import EmergencyPage from "./components/userComponents/EmegencyComponents/EmergencyPage";
//Tourist Side

// Guest Side
import "./App.css";
import Photobooth from "./components/userComponents/photoboothComponents/Photobooth";

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Redirect root to /AdminHome */}
        <Route path="/" element={<Navigate to="/Homepage" replace />} />
        {/* Login Page */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Routes */}
        {/* Admin Side */}
        <Route path="/AdminHome" element={<AdminHome />} />
        <Route path="/AdminManageContent" element={<AdminContent />} />
        <Route path="/AdminManageEmergency" element={<ManageEmergency />} />
        {/* Tourist Side

        Guest Side */}
        <Route path="Homepage" element={<Homepage />} />
        <Route path="Emergency" element={<EmergencyPage />} />

        <Route path="Photobooth" element={<Photobooth />} />
      </Routes>
    </Router>
  );
}
