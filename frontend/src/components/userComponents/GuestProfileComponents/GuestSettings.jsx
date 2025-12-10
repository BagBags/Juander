import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Bell,
  BellOff,
  Play,
  Download,
  Smartphone,
  Share,
  Monitor,
} from "lucide-react";
import NotificationModal from "../../shared/NotificationModal";
import PullToRefresh from "../../shared/PullToRefresh";

export default function GuestSettings() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [showFortModal, setShowFortModal] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [tourLoading, setTourLoading] = useState(false);
  const [homepageTutorialEnabled, setHomepageTutorialEnabled] = useState(false);
  const [mapTutorialEnabled, setMapTutorialEnabled] = useState(false);
  const [allTutorialsEnabled, setAllTutorialsEnabled] = useState(true);
  const [notification, setNotification] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [installAvailable, setInstallAvailable] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [isWebDesktop, setIsWebDesktop] = useState(false);

  // Load guest preference from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("guestHideFortSantiagoModal");
    // stored === "true" means hide; we invert for showFortModal
    setShowFortModal(!(stored === "true"));
    // Load tutorial switches from localStorage
    const homepage = localStorage.getItem("guestReplayTutorial") === "true";
    const map = localStorage.getItem("mapTourForceStart") === "true";
    const guestProfile =
      localStorage.getItem("guestProfileTourForceStart") === "true";
    const guestPhotobooth =
      localStorage.getItem("guestPhotoboothTourForceStart") === "true";
    const guestEmergency =
      localStorage.getItem("guestEmergencyTourForceStart") === "true";
    const tutorialsDisabled =
      localStorage.getItem("guestTutorialsDisabled") === "true";

    setHomepageTutorialEnabled(homepage);
    setMapTutorialEnabled(map);

    // Check if ALL tutorials are disabled (not if ANY are enabled)
    setAllTutorialsEnabled(!tutorialsDisabled);

    try {
      const isStandalone =
        window.matchMedia &&
        window.matchMedia("(display-mode: standalone)").matches;
      const isIosStandalone =
        typeof navigator !== "undefined" && navigator.standalone === true;
      setInstalled(!!(isStandalone || isIosStandalone));
      const ua = navigator.userAgent || "";
      const isAndroid = /Android/i.test(ua);
      const isIOS = /iPhone|iPad|iPod/i.test(ua);
      setIsWebDesktop(!isAndroid && !isIOS);
    } catch {}
  }, []);

  useEffect(() => {
    const existing = window.__deferredPWAInstallPrompt;
    if (existing) {
      setInstallPrompt(existing);
      setInstallAvailable(true);
    }
    const onBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      setInstallAvailable(true);
    };
    const onAppInstalled = () => {
      setInstalled(true);
      setInstallAvailable(false);
      setInstallPrompt(null);
      setNotification({
        isOpen: true,
        type: "success",
        title: "App Installed",
        message: "Juander has been installed on your device.",
      });
    };
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready
        .then(() => {
          if (!installed) setInstallAvailable(true);
        })
        .catch(() => {});
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const triggerAndroidInstall = async () => {
    try {
      if (!installPrompt) return;
      const ev = installPrompt;
      await ev.prompt();
      const choice = await ev.userChoice;
      if (choice && choice.outcome === "accepted") {
        setNotification({
          isOpen: true,
          type: "success",
          title: "Install Started",
          message: "Follow your browser prompts to finish installation.",
        });
      } else {
        setNotification({
          isOpen: true,
          type: "info",
          title: "Install Dismissed",
          message: "You can install later from this screen.",
        });
      }
    } catch {
      setNotification({
        isOpen: true,
        type: "error",
        title: "Install Failed",
        message: "Unable to start installation on this browser.",
      });
    }
  };

  const handleToggleFortModal = () => {
    const newValue = !showFortModal; // whether to show
    setShowFortModal(newValue);
    setLoading(true);

    try {
      // Persist guest preference locally (no backend in guest mode)
      localStorage.setItem(
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

  const toggleHomepageTutorial = () => {
    const next = !homepageTutorialEnabled;
    setHomepageTutorialEnabled(next);
    try {
      if (next) {
        localStorage.setItem("guestReplayTutorial", "true");
        setNotification({
          isOpen: true,
          type: "info",
          title: "Homepage Tutorial Enabled",
          message:
            "When you go to the Guest Homepage, the guide will start automatically. It will turn off after you finish or skip.",
        });
      } else {
        localStorage.removeItem("guestReplayTutorial");
        setNotification({
          isOpen: true,
          type: "info",
          title: "Homepage Tutorial Disabled",
          message: "The guide will not auto-start on the Guest Homepage.",
        });
      }
    } catch (err) {
      console.error("Error updating homepage tutorial flag:", err);
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
          message:
            "When you go to the Guest Itinerary Map, the guide will start automatically. It will turn off after you finish or skip.",
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

  const toggleAllTutorials = () => {
    const next = !allTutorialsEnabled;
    setAllTutorialsEnabled(next);
    try {
      if (next) {
        localStorage.setItem("guestReplayTutorial", "true");
        localStorage.setItem("mapTourForceStart", "true");
        localStorage.setItem("guestProfileTourForceStart", "true");
        localStorage.removeItem("guestTourMapTourCompleted");
        localStorage.setItem("tourMapReplayTutorial", "true");
        localStorage.setItem("guestPhotoboothTourForceStart", "true");
        localStorage.setItem("guestEmergencyTourForceStart", "true");
        localStorage.removeItem("guestTutorialsDisabled");
        setHomepageTutorialEnabled(true);
        setMapTutorialEnabled(true);
        setNotification({
          isOpen: true,
          type: "info",
          title: "Animated Guides Enabled",
          message: "All available guest tutorials will auto-start.",
        });
      } else {
        localStorage.removeItem("guestReplayTutorial");
        localStorage.removeItem("mapTourForceStart");
        localStorage.removeItem("guestProfileTourForceStart");
        localStorage.removeItem("guestPhotoboothTourForceStart");
        localStorage.removeItem("guestEmergencyTourForceStart");
        localStorage.setItem("guestTutorialsDisabled", "true");
        localStorage.setItem("guestTourMapTourCompleted", "true");
        localStorage.removeItem("tourMapReplayTutorial");
        setHomepageTutorialEnabled(false);
        setMapTutorialEnabled(false);
        setNotification({
          isOpen: true,
          type: "info",
          title: "Animated Guides Disabled",
          message: "No guest tutorials will auto-start.",
        });
      }
    } catch (err) {
      console.error("Error toggling all guest tutorials:", err);
    }
  };

  const handleRefresh = async () => {
    setShowFortModal(
      !(localStorage.getItem("guestHideFortSantiagoModal") === "true")
    );
    setHomepageTutorialEnabled(
      localStorage.getItem("guestReplayTutorial") === "true"
    );
    setMapTutorialEnabled(localStorage.getItem("mapTourForceStart") === "true");
    setRefreshKey((prev) => prev + 1);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  };

  return (
    <motion.div
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="h-screen overflow-hidden bg-white flex flex-col items-center text-sm relative px-4 md:px-0 overscroll-contain touch-pan-y"
    >
      <PullToRefresh onRefresh={handleRefresh}>
        <div
          className="w-full max-w-md flex flex-col flex-1 min-h-0"
          key={refreshKey}
        >
          <div className="mt-4 w-full bg-white rounded-2xl p-6 shadow-md">
            <h2 className="text-xl font-bold text-gray-800 mb-6">
              Notification Settings
            </h2>

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
                    Show a notification when adding sites inside Fort Santiago
                    to your itinerary. This setting is currently unavailable in
                    guest mode.
                  </p>

                  <label className="flex items-center gap-3 cursor-not-allowed group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={showFortModal}
                        disabled
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
                      {showFortModal ? "Enabled" : "Disabled"}
                    </span>
                  </label>

                  {/* Note under Fort Santiago toggle */}
                  <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <p className="text-xs text-gray-600 leading-relaxed">
                      <span className="font-semibold text-gray-700">Note:</span>{" "}
                      When enabled, you'll receive a reminder about entrance
                      fees when selecting sites located inside Fort Santiago for
                      your itinerary.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Tutorial Toggle (Guest) */}
            <div className="mt-4 bg-gray-50 rounded-xl p-5 border border-gray-200">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  <Play className="w-6 h-6 text-[#f04e37]" />
                </div>

                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 mb-2">
                    Animated Guides
                  </h3>
                  <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                    Control all available guest tutorials with a single switch.
                  </p>

                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={allTutorialsEnabled}
                        onChange={toggleAllTutorials}
                        className="sr-only peer"
                      />
                      <div
                        className={`w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-[#f04e37] transition-colors`}
                      ></div>
                      <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                    </div>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                      {allTutorialsEnabled ? "Enabled" : "Disabled"}
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="mt-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-xs text-gray-600 leading-relaxed">
                <span className="font-semibold text-gray-700">Note:</span> Guest
                preferences are stored on your device and may reset when you
                clear browser storage or switch devices.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4">
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <Smartphone className="w-6 h-6 text-[#f04e37]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 mb-2">
                      Install App (Android/Web)
                    </h3>
                    <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                      Install the app to your home screen for a full-screen
                      experience.
                    </p>
                    <button
                      onClick={triggerAndroidInstall}
                      disabled={!installPrompt || installed}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        background:
                          "linear-gradient(to right, #f04e37, #ff6b54)",
                      }}
                    >
                      <Download className="w-5 h-5" />
                      {installed
                        ? "Already Installed"
                        : installPrompt
                        ? "Install App"
                        : "Install Not Available"}
                    </button>
                    <p className="mt-2 text-xs text-gray-500">
                      If install is not available, open the browser menu and
                      choose Install App (Chrome/Edge).
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <Share className="w-6 h-6 text-[#f04e37]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 mb-2">
                      How to Install on iOS
                    </h3>
                    <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
                      <li>Open this app in Safari.</li>
                      <li>Tap the Share icon.</li>
                      <li>Select Add to Home Screen.</li>
                      <li>Tap Add to finish.</li>
                    </ol>
                    <p className="mt-3 text-xs text-gray-500">
                      iOS does not support a direct install prompt. Use Add to
                      Home Screen to install.
                    </p>
                  </div>
                </div>
              </div>
            </div>
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
            © {new Date().getFullYear()} {t("intramurosAdmin")}. Developed by
            UST College of Information and Computing Sciences.
          </p>
        </div>
      </PullToRefresh>
    </motion.div>
  );
}
