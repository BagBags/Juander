import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Bell, BellOff, Play } from "lucide-react";
import axios from "axios";
import { resetTour } from "../../../utils/tourApi";

export default function Settings() {
  const { t } = useTranslation();
  const [showFortModal, setShowFortModal] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [tourLoading, setTourLoading] = useState(false);

  const token = localStorage.getItem("token");
  const config = { headers: { Authorization: `Bearer ${token}` } };

  // Load current setting from database
  useEffect(() => {
    const fetchUserPreference = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/auth/me`,
          config
        );
        setShowFortModal(!res.data.hideFortSantiagoModal);
      } catch (err) {
        console.error("Error fetching user preference:", err);
      }
    };
    fetchUserPreference();
  }, []);

  const handleToggleFortModal = async () => {
    const newValue = !showFortModal;
    setShowFortModal(newValue);
    setLoading(true);
    
    try {
      await axios.put(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/auth/fort-santiago-modal`,
        { hideFortSantiagoModal: !newValue },
        config
      );
      
      setSuccessMessage(
        newValue 
          ? "Fort Santiago notifications enabled" 
          : "Fort Santiago notifications disabled"
      );
    } catch (err) {
      console.error("Error updating preference:", err);
      setSuccessMessage("Failed to update preference");
      // Revert on error
      setShowFortModal(!newValue);
    } finally {
      setLoading(false);
    }

    // Clear success message after 3 seconds
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const handleReplayTutorial = async () => {
    setTourLoading(true);
    try {
      await resetTour();
      setSuccessMessage("Tutorial reset! Return to the homepage to replay it.");
      
      // Redirect to homepage after a short delay
      setTimeout(() => {
        window.location.href = "/Homepage";
      }, 2000);
    } catch (err) {
      console.error("Error resetting tour:", err);
      setSuccessMessage("Failed to reset tutorial. Please try again.");
    } finally {
      setTourLoading(false);
    }

    // Clear success message after 5 seconds
    setTimeout(() => setSuccessMessage(""), 5000);
  };

  return (
    <motion.div
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-white flex flex-col items-center text-sm relative px-4 md:px-0"
    >
      <div className="w-full max-w-md">
        <div className="mt-4 w-full bg-white rounded-2xl p-6 shadow-md">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Notification Settings</h2>
          
          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700">{successMessage}</p>
            </div>
          )}

          {/* Fort Santiago Modal Setting */}
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-1">
                {showFortModal ? (
                  <Bell className="w-6 h-6 text-[#f04e37]" />
                ) : (
                  <BellOff className="w-6 h-6 text-gray-400" />
                )}
              </div>
              
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 mb-2">
                  Fort Santiago Entrance Notice
                </h3>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                  Show a notification when adding sites inside Fort Santiago to your itinerary.
                </p>
                
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={showFortModal}
                      onChange={handleToggleFortModal}
                      disabled={loading}
                      className="sr-only peer"
                    />
                    <div className={`w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-[#f04e37] transition-colors ${loading ? 'opacity-50' : ''}`}></div>
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                    {loading ? "Updating..." : showFortModal ? "Enabled" : "Disabled"}
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Replay Tutorial Setting */}
          <div className="mt-4 bg-gray-50 rounded-xl p-5 border border-gray-200">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-1">
                <Play className="w-6 h-6 text-[#f04e37]" />
              </div>
              
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 mb-2">
                  Replay Tutorial
                </h3>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                  Restart the interactive tour guide to learn about app features again.
                </p>
                
                <button
                  onClick={handleReplayTutorial}
                  disabled={tourLoading}
                  className="px-4 py-2 bg-[#f04e37] hover:bg-[#e03d2d] text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {tourLoading ? "Resetting..." : "Replay Tutorial"}
                </button>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-xs text-gray-600 leading-relaxed">
              <span className="font-semibold text-gray-700">Note:</span> When enabled, 
              you'll receive a reminder about entrance fees when selecting sites located 
              inside Fort Santiago for your itinerary.
            </p>
          </div>
        </div>

        <p className="mt-20 text-xs text-center text-[#cf3325] opacity-70">
          ©2025 Intramuros Administration
        </p>
      </div>
    </motion.div>
  );
}
