import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Bell, BellOff, Play } from "lucide-react";
import NotificationModal from "../../shared/NotificationModal";
import axios from "axios";
import { resetTour, completeTour, getTourStatus } from "../../../utils/tourApi";

export default function Settings() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [showFortModal, setShowFortModal] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [tourLoading, setTourLoading] = useState(false);
  const [homepageTutorialEnabled, setHomepageTutorialEnabled] = useState(false);
  const [mapTutorialEnabled, setMapTutorialEnabled] = useState(false);
  const [notification, setNotification] = useState({ isOpen: false, type: "info", title: "", message: "" });

  const token = localStorage.getItem("token");
  const config = { headers: { Authorization: `Bearer ${token}` } };

  // Load current setting from database
  useEffect(() => {
    const fetchUserPreference = async () => {
      try {
        const res = await axios.get(
          `${
            import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
          }/auth/me`,
          config
        );
        setShowFortModal(!res.data.hideFortSantiagoModal);
        try {
          const status = await getTourStatus();
          setHomepageTutorialEnabled(!status.hasCompletedTour);
        } catch {}
      } catch (err) {
        console.error("Error fetching user preference:", err);
      }
    };
    fetchUserPreference();
    // Map tutorial auto-start remains client-side for now
    setMapTutorialEnabled(localStorage.getItem("mapTourForceStart") === "true");
  }, []);

  const handleToggleFortModal = async () => {
    const newValue = !showFortModal;
    setShowFortModal(newValue);
    setLoading(true);

    try {
      await axios.put(
        `${
          import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
        }/auth/fort-santiago-modal`,
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

  const toggleHomepageTutorial = async () => {
    const next = !homepageTutorialEnabled;
    setHomepageTutorialEnabled(next);
    try {
      if (next) {
        await resetTour();
        setNotification({
          isOpen: true,
          type: "info",
          title: "Homepage Tutorial Enabled",
          message: "When you visit the Homepage, the guide will auto-start.",
        });
      } else {
        await completeTour();
        setNotification({
          isOpen: true,
          type: "info",
          title: "Homepage Tutorial Disabled",
          message: "The guide will not auto-start on the Homepage.",
        });
      }
    } catch (err) {
      console.error("Error updating homepage tutorial status:", err);
    }
  };

  const toggleMapTutorial = () => {
    const next = !mapTutorialEnabled;
    setMapTutorialEnabled(next);
    try {
      if (next) {
        localStorage.setItem("mapTourForceStart", "true");
        setNotification({
          isOpen: true,
          type: "info",
          title: "Map Tutorial Enabled",
          message: "When you go to the Itinerary Map, the guide will start automatically. It will turn off after you finish or skip.",
        });
      } else {
        localStorage.removeItem("mapTourForceStart");
        setNotification({
          isOpen: true,
          type: "info",
          title: "Map Tutorial Disabled",
          message: "The guide will not auto-start on the Itinerary Map.",
        });
      }
    } catch (err) {
      console.error("Error updating map tutorial flag:", err);
    }
  };

  return (
    <motion.div
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-white flex flex-col items-center text-sm relative px-4 md:px-0"
    >
      <div className="w-full max-w-md flex flex-col flex-1">
        <div className="mt-4 w-full bg-white rounded-2xl p-6 shadow-md">
          <h2 className="text-xl font-bold text-gray-800 mb-6">
            Notification Settings
          </h2>

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
                  Show a notification when adding sites inside Fort Santiago to
                  your itinerary.
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
                    <div
                      className={`w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-[#f04e37] transition-colors ${
                        loading ? "opacity-50" : ""
                      }`}
                    ></div>
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                    {loading
                      ? "Updating..."
                      : showFortModal
                      ? "Enabled"
                      : "Disabled"}
                  </span>
                </label>
                {/* Note under Fort Santiago toggle */}
                <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <p className="text-xs text-gray-600 leading-relaxed">
                    <span className="font-semibold text-gray-700">Note:</span> When enabled, you'll receive a reminder about entrance fees when selecting sites located inside Fort Santiago for your itinerary.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tutorial (Homepage) Switch */}
          <div className="mt-4 bg-gray-50 rounded-xl p-5 border border-gray-200">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-1">
                <Play className="w-6 h-6 text-[#f04e37]" />
              </div>

              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 mb-2">Tutorial (Homepage)</h3>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">Enable auto-start of the guide when you visit the Homepage.</p>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={homepageTutorialEnabled}
                      onChange={toggleHomepageTutorial}
                      className="sr-only peer"
                    />
                    <div className={`w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-[#f04e37] transition-colors`}></div>
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{homepageTutorialEnabled ? "Enabled" : "Disabled"}</span>
                </label>
              </div>
            </div>
          </div>

          {/* Tutorial (Start Tour) Switch for Map */}
          <div className="mt-4 bg-gray-50 rounded-xl p-5 border border-gray-200">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-1">
                <Play className="w-6 h-6 text-[#f04e37]" />
              </div>

              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 mb-2">Tutorial (Start Tour)</h3>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">Enable auto-start of the guide on the Itinerary Map when you go there.</p>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={mapTutorialEnabled}
                      onChange={toggleMapTutorial}
                      className="sr-only peer"
                    />
                    <div className={`w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-[#f04e37] transition-colors`}></div>
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{mapTutorialEnabled ? "Enabled" : "Disabled"}</span>
                </label>
              </div>
            </div>
          </div>

          {/* Removed global note; now shown under the Fort Santiago card */}
        </div>

        {/* Notification Modal */}
        <NotificationModal
          isOpen={notification.isOpen}
          onClose={() => setNotification({ ...notification, isOpen: false })}
          type={notification.type}
          title={notification.title}
          message={notification.message}
          autoClose
          autoCloseDuration={3000}
        />

        <p className="mt-auto mb-8 text-xs text-center text-gray-400">
          © {new Date().getFullYear()} {t("intramurosAdmin")}. Developed by UST
          College of Information and Computing Sciences.
        </p>
      </div>
    </motion.div>
  );
}
