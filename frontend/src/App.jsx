import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// Admin Side
import AdminHome from "./components/adminComponents/adminHomeComponents/adminHome";
//Tourist Side

// Guest Side
import "./App.css";

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Redirect root to /AdminHome */}
        <Route path="/" element={<Navigate to="/AdminHome" replace />} />

        {/* Admin Side */}
        <Route path="/AdminHome" element={<AdminHome />} />
        {/* Tourist Side

        Guest Side */}
      </Routes>
    </Router>
  );
}
