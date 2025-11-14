import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Bell, BellOff, Play } from "lucide-react";

export default function GuestSettings() {
  const { t } = useTranslation();
  const [showFortModal, setShowFortModal] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [tourLoading, setTourLoading] = useState(false);

  // Load guest preference from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem("guestHideFortSantiagoModal");
    // stored === "true" means hide; we invert for showFortModal
    setShowFortModal(!(stored === "true"));
  }, []);

  const handleToggleFortModal = () => {
    const newValue = !showFortModal; // whether to show
    setShowFortModal(newValue);
    setLoading(true);

    try {
      // Persist guest preference locally (no backend in guest mode)
      sessionStorage.setItem(
        "guestHideFortSantiagoModal",
        (!newValue).toString()
      );
      setSuccessMessage(
        newValue
          ? "Fort Santiago notifications enabled"
          : "Fort Santiago notifications disabled"
      );
    } catch (err) {
      console.error("Failed to update guest preference:", err);
      setSuccessMessage("Failed to update preference");
      setShowFortModal(!newValue); // revert on error
    } finally {
      setLoading(false);
    }

    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const handleReplayTutorial = () => {
    setTourLoading(true);
    try {
      // Set a flag for GuestHomepage to auto-start the tour
      sessionStorage.setItem("guestReplayTutorial", "true");
      setSuccessMessage(
        "Tutorial reset! Returning to guest homepage to replay it."
      );
      setTimeout(() => {
        window.location.href = "/GuestHomepage";
      }, 1500);
    } catch (err) {
      console.error("Error setting replay flag:", err);
      setSuccessMessage("Failed to reset tutorial. Please try again.");
    } finally {
      setTourLoading(false);
    }

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

          {/* Fort Santiago Modal Setting (disabled in guest mode) */}
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 opacity-60">
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
                  This setting is currently unavailable in guest mode.
                </p>

                <label className="flex items-center gap-3 cursor-not-allowed group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={showFortModal}
                      disabled
                      className="sr-only peer"
                    />
                    <div className={`w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-[#f04e37] transition-colors ${loading ? 'opacity-50' : ''}`}></div>
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                    {showFortModal ? "Enabled" : "Disabled"}
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
              <span className="font-semibold text-gray-700">Note:</span> Guest preferences are stored on your device and may reset when you clear browser storage or switch devices.
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