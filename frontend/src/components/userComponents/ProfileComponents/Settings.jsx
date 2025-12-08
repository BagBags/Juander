import React, { useState, useEffect } from "react";
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
import axios from "axios";
import {
  resetTour,
  completeTour,
  getTourStatus,
  getCreateItineraryTourStatus,
  resetCreateItineraryTour,
  completeCreateItineraryTour,
  getEmergencyTourStatus,
  resetEmergencyTour,
  completeEmergencyTour,
  getProfileTourStatus,
  resetProfileTour,
  completeProfileTour,
  getTourMapTourStatus,
  resetTourMapTour,
  completeTourMapTour,
  getPhotoboothTourStatus,
  resetPhotoboothTour,
  completePhotoboothTour,
  getTripArchiveTourStatus,
  resetTripArchiveTour,
  completeTripArchiveTour,
} from "../../../utils/tourApi";

export default function Settings() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [installPrompt, setInstallPrompt] = useState(null);
  const [installAvailable, setInstallAvailable] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [isWebDesktop, setIsWebDesktop] = useState(false);
  const [showFortModal, setShowFortModal] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [tourLoading, setTourLoading] = useState(false);
  const [homepageTutorialEnabled, setHomepageTutorialEnabled] = useState(false);
  const [mapTutorialEnabled, setMapTutorialEnabled] = useState(false);
  const [createItineraryTutorialEnabled, setCreateItineraryTutorialEnabled] =
    useState(true);
  const [notification, setNotification] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
  });
  const [emergencyTutorialEnabled, setEmergencyTutorialEnabled] =
    useState(true);
  const [profileTutorialEnabled, setProfileTutorialEnabled] = useState(true);
  const [tourMapTutorialEnabled, setTourMapTutorialEnabled] = useState(true);
  const [photoboothTutorialEnabled, setPhotoboothTutorialEnabled] =
    useState(true);
  const [tripArchiveTutorialEnabled, setTripArchiveTutorialEnabled] =
    useState(true);
  const [allTutorialsEnabled, setAllTutorialsEnabled] = useState(true);

  const token = localStorage.getItem("token");
  const config = { headers: { Authorization: `Bearer ${token}` } };

  // Load current setting from database
  useEffect(() => {
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
    const initCreateItineraryStatus = async () => {
      try {
        const ciStatus = await getCreateItineraryTourStatus();
        setCreateItineraryTutorialEnabled(
          !ciStatus.hasCompletedCreateItineraryTour
        );
      } catch {
        setCreateItineraryTutorialEnabled(true);
      }
    };
    initCreateItineraryStatus();
    const initEmergencyStatus = async () => {
      try {
        const eStatus = await getEmergencyTourStatus();
        setEmergencyTutorialEnabled(!eStatus.hasCompletedEmergencyTour);
      } catch {
        setEmergencyTutorialEnabled(true);
      }
    };
    initEmergencyStatus();
    const initProfileStatus = async () => {
      try {
        const pStatus = await getProfileTourStatus();
        setProfileTutorialEnabled(!pStatus.hasCompletedProfileTour);
      } catch {
        setProfileTutorialEnabled(true);
      }
    };
    initProfileStatus();
    const initTourMapStatus = async () => {
      try {
        const mStatus = await getTourMapTourStatus();
        setTourMapTutorialEnabled(!mStatus.hasCompletedTourMapTour);
      } catch {
        setTourMapTutorialEnabled(true);
      }
    };
    initTourMapStatus();
    const initPhotoboothStatus = async () => {
      try {
        const pStatus = await getPhotoboothTourStatus();
        setPhotoboothTutorialEnabled(!pStatus.hasCompletedPhotoboothTour);
      } catch {
        setPhotoboothTutorialEnabled(true);
      }
    };
    initPhotoboothStatus();
    const initTripArchiveStatus = async () => {
      try {
        const taStatus = await getTripArchiveTourStatus();
        setTripArchiveTutorialEnabled(!taStatus.hasCompletedTripArchiveTour);
      } catch {
        setTripArchiveTutorialEnabled(true);
      }
    };
    initTripArchiveStatus();
    const computeAll = async () => {
      try {
        const statuses = await Promise.all([
          getTourStatus(),
          getCreateItineraryTourStatus(),
          getEmergencyTourStatus(),
          getProfileTourStatus(),
          getTourMapTourStatus(),
          getPhotoboothTourStatus(),
          getTripArchiveTourStatus(),
        ]);
        // Check if ALL tutorials are completed by checking each specific property
        const allCompleted =
          statuses[0]?.hasCompletedTour &&
          statuses[1]?.hasCompletedCreateItineraryTour &&
          statuses[2]?.hasCompletedEmergencyTour &&
          statuses[3]?.hasCompletedProfileTour &&
          statuses[4]?.hasCompletedTourMapTour &&
          statuses[5]?.hasCompletedPhotoboothTour &&
          statuses[6]?.hasCompletedTripArchiveTour;
        setAllTutorialsEnabled(!allCompleted);
      } catch {
        setAllTutorialsEnabled(true);
      }
    };
    computeAll();
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

  const toggleAllTutorials = async () => {
    const next = !allTutorialsEnabled;
    setAllTutorialsEnabled(next);
    try {
      if (next) {
        await Promise.all([
          resetTour(),
          resetCreateItineraryTour(),
          resetEmergencyTour(),
          resetProfileTour(),
          resetTourMapTour(),
          resetPhotoboothTour(),
          resetTripArchiveTour(),
        ]);
        setHomepageTutorialEnabled(true);
        setMapTutorialEnabled(true);
        setCreateItineraryTutorialEnabled(true);
        setEmergencyTutorialEnabled(true);
        setProfileTutorialEnabled(true);
        setTourMapTutorialEnabled(true);
        setPhotoboothTutorialEnabled(true);
        setTripArchiveTutorialEnabled(true);
        setNotification({
          isOpen: true,
          type: "info",
          title: "All Tutorials Enabled",
          message: "All guides across the app will auto-start when relevant.",
        });
      } else {
        try {
          localStorage.removeItem("tourMapReplayTutorial");
        } catch {}
        await Promise.all([
          completeTour(),
          completeCreateItineraryTour(),
          completeEmergencyTour(),
          completeProfileTour(),
          completeTourMapTour(),
          completePhotoboothTour(),
          completeTripArchiveTour(),
        ]);
        try {
          localStorage.removeItem("tourMapReplayTutorial");
        } catch {}
        setHomepageTutorialEnabled(false);
        setMapTutorialEnabled(false);
        setCreateItineraryTutorialEnabled(false);
        setEmergencyTutorialEnabled(false);
        setProfileTutorialEnabled(false);
        setTourMapTutorialEnabled(false);
        setPhotoboothTutorialEnabled(false);
        setTripArchiveTutorialEnabled(false);
        setNotification({
          isOpen: true,
          type: "info",
          title: "All Tutorials Disabled",
          message: "No guides will auto-start anywhere in the app.",
        });
      }
    } catch (err) {
      console.error("Error toggling all tutorials:", err);
    }
  };

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
          message:
            "When you go to the Itinerary Map, the guide will start automatically. It will turn off after you finish or skip.",
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

  const toggleCreateItineraryTutorial = async () => {
    const next = !createItineraryTutorialEnabled;
    setCreateItineraryTutorialEnabled(next);
    try {
      if (next) {
        await resetCreateItineraryTour();
        setNotification({
          isOpen: true,
          type: "info",
          title: "Create Itinerary Tutorial Enabled",
          message:
            "When you visit Create Itinerary, the guide will auto-start.",
        });
      } else {
        await completeCreateItineraryTour();
        setNotification({
          isOpen: true,
          type: "info",
          title: "Create Itinerary Tutorial Disabled",
          message: "The guide will not auto-start on Create Itinerary.",
        });
      }
    } catch (err) {
      console.error("Error updating create itinerary tutorial status:", err);
    }
  };

  const toggleEmergencyTutorial = async () => {
    const next = !emergencyTutorialEnabled;
    setEmergencyTutorialEnabled(next);
    try {
      if (next) {
        await resetEmergencyTour();
        setNotification({
          isOpen: true,
          type: "info",
          title: "Emergency Tutorial Enabled",
          message: "When you visit Emergency, the guide will auto-start.",
        });
      } else {
        await completeEmergencyTour();
        setNotification({
          isOpen: true,
          type: "info",
          title: "Emergency Tutorial Disabled",
          message: "The guide will not auto-start on Emergency.",
        });
      }
    } catch (err) {
      console.error("Error updating emergency tutorial status:", err);
    }
  };

  const toggleProfileTutorial = async () => {
    const next = !profileTutorialEnabled;
    setProfileTutorialEnabled(next);
    try {
      if (next) {
        await resetProfileTour();
        setNotification({
          isOpen: true,
          type: "info",
          title: "Profile Tutorial Enabled",
          message: "The guide will auto-start on Profile.",
        });
      } else {
        await completeProfileTour();
        setNotification({
          isOpen: true,
          type: "info",
          title: "Profile Tutorial Disabled",
          message: "The guide will not auto-start on Profile.",
        });
      }
    } catch (err) {
      console.error("Error updating profile tutorial status:", err);
    }
  };

  const toggleTourMapTutorial = async () => {
    const next = !tourMapTutorialEnabled;
    setTourMapTutorialEnabled(next);
    try {
      if (next) {
        await resetTourMapTour();
        setNotification({
          isOpen: true,
          type: "info",
          title: "Tutorial (Tour Map) Enabled",
          message: "The guide will auto-start on Tour Map.",
        });
      } else {
        try {
          localStorage.removeItem("tourMapReplayTutorial");
        } catch {}
        await completeTourMapTour();
        try {
          localStorage.removeItem("tourMapReplayTutorial");
        } catch {}
        setNotification({
          isOpen: true,
          type: "info",
          title: "Tutorial (Tour Map) Disabled",
          message: "The guide will not auto-start on Tour Map.",
        });
      }
    } catch (err) {
      console.error("Error updating Tour Map tutorial status:", err);
    }
  };

  const togglePhotoboothTutorial = async () => {
    const next = !photoboothTutorialEnabled;
    setPhotoboothTutorialEnabled(next);
    try {
      if (next) {
        await resetPhotoboothTour();
        setNotification({
          isOpen: true,
          type: "info",
          title: "Tutorial (Photobooth) Enabled",
          message: "The guide will auto-start on Photobooth.",
        });
      } else {
        await completePhotoboothTour();
        setNotification({
          isOpen: true,
          type: "info",
          title: "Tutorial (Photobooth) Disabled",
          message: "The guide will not auto-start on Photobooth.",
        });
      }
    } catch (err) {
      console.error("Error updating Photobooth tutorial status:", err);
    }
  };

  const toggleTripArchiveTutorial = async () => {
    const next = !tripArchiveTutorialEnabled;
    setTripArchiveTutorialEnabled(next);
    try {
      if (next) {
        await resetTripArchiveTour();
        setNotification({
          isOpen: true,
          type: "info",
          title: "Tutorial (Trip Archive) Enabled",
          message: "The guide will auto-start on Trip Archive.",
        });
      } else {
        await completeTripArchiveTour();
        setNotification({
          isOpen: true,
          type: "info",
          title: "Tutorial (Trip Archive) Disabled",
          message: "The guide will not auto-start on Trip Archive.",
        });
      }
    } catch (err) {
      console.error("Error updating Trip Archive tutorial status:", err);
    }
  };

  return (
    <motion.div
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="h-screen overflow-hidden bg-white flex flex-col items-center text-sm relative px-4 md:px-0 overscroll-contain touch-pan-y"
    >
      <PullToRefresh
        onRefresh={async () => {
          await new Promise((r) => setTimeout(r, 1000));
        }}
      >
        <div className="w-full max-w-md flex flex-col flex-1 min-h-0">
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
                    Show a notification when adding sites inside Fort Santiago
                    to your itinerary.
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
                      <span className="font-semibold text-gray-700">Note:</span>{" "}
                      When enabled, you'll receive a reminder about entrance
                      fees when selecting sites located inside Fort Santiago for
                      your itinerary.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Tutorial Toggle */}
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
                    Control all tutorials across the app with a single switch.
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

            <div className="mt-4 grid grid-cols-1 gap-4">
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
                      disabled={!installAvailable || installed}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        background:
                          "linear-gradient(to right, #f04e37, #ff6b54)",
                      }}
                    >
                      <Download className="w-5 h-5" />
                      {installed
                        ? "Already Installed"
                        : installAvailable
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

            <NotificationModal
              isOpen={notification.isOpen}
              onClose={() =>
                setNotification({ ...notification, isOpen: false })
              }
              type={notification.type}
              title={notification.title}
              message={notification.message}
              autoClose
              autoCloseDuration={3000}
            />
          </div>
          <div className="mt-auto">
            <div
              className="border-t border-gray-100 pt-4"
              style={{
                paddingBottom: "max(env(safe-area-inset-bottom), 16px)",
              }}
            >
              <p className="text-center text-xs text-gray-400">
                © {new Date().getFullYear()} Intramuros Administration.
                Developed by UST College of Information and Computing Sciences.
              </p>
            </div>
          </div>
        </div>
      </PullToRefresh>
    </motion.div>
  );
}
