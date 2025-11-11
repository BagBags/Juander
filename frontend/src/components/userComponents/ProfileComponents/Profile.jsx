import React, { useEffect, useState } from "react";
import { FaUser, FaBirthdayCake, FaVenusMars, FaCamera } from "react-icons/fa";
import { MdLanguage } from "react-icons/md";
import { GiEarthAsiaOceania } from "react-icons/gi";
import { IoChevronForwardSharp, IoSettingsSharp } from "react-icons/io5";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Facebook, Instagram, Linkedin, Youtube, Twitter } from "lucide-react";
import { FaTiktok } from "react-icons/fa";
import axios from "axios";
import ttsService from "../../../utils/textToSpeech";
import { clearAuth } from "../../../utils/authStorage";
import PullToRefresh from "../../shared/PullToRefresh";

export default function ProfilePage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleRefresh = async () => {
    setRefreshKey(prev => prev + 1);
    const storedUser = localStorage.getItem("user");
    if (storedUser) setCurrentUser(JSON.parse(storedUser));
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  // Announce page load
  useEffect(() => {
    ttsService.speak(t('tts_profilePage'));
  }, [t]);

  // Load user from localStorage
  useEffect(() => {
    const loadUser = () => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) setCurrentUser(JSON.parse(storedUser));
    };

    loadUser();
    window.addEventListener("storage", loadUser);
    return () => window.removeEventListener("storage", loadUser);
  }, []);

  const options = [
    { icon: <FaUser />, label: t("account"), to: "/Profile/Account" },
    { icon: <FaBirthdayCake />, label: t("birthday"), to: "/Profile/Birthday" },
    { icon: <FaVenusMars />, label: t("gender"), to: "/Profile/Gender" },
    {
      icon: <GiEarthAsiaOceania />,
      label: t("country"),
      to: "/Profile/Country",
    },
    { icon: <MdLanguage />, label: t("language"), to: "/Profile/Language" },
    { icon: <IoSettingsSharp />, label: "Settings", to: "/Profile/Settings" },
  ];

  // Handle profile picture upload
  const handleFileChange = async (e) => {
    if (currentUser?.authProvider !== "local") return;

    const file = e.target.files[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => setPreviewImage(reader.result);
    reader.readAsDataURL(file);

    try {
      const formData = new FormData();
      formData.append("profilePicture", file);

      // get token from either sessionStorage or localStorage (like Birthday.jsx)
      const token =
        sessionStorage.getItem("token") || localStorage.getItem("token");
      if (!token) {
        alert("Not logged in");
        return;
      }

      // ✅ Use proxy-friendly relative path (/api)
      const res = await axios.post(
        "/api/auth/upload-profile-picture",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // ✅ Append timestamp to force browser to fetch new image
      const newProfilePic = `${res.data.profilePicture}?t=${Date.now()}`;

      const updatedUser = {
        ...currentUser,
        profilePicture: newProfilePic,
      };

      setCurrentUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
    } catch (err) {
      console.error("Upload failed:", err.response?.data || err.message);
      alert("Failed to upload profile picture.");
    }
  };

  const handleLogout = () => {
    clearAuth();
    navigate("/");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="min-h-screen bg-gray-50 flex flex-col items-center text-sm relative px-4 md:px-0"
      style={{
        paddingTop: "max(env(safe-area-inset-top), 16px)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#f04e37]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* Global TTS Button */}

      <PullToRefresh onRefresh={handleRefresh}>
      <div className="w-full max-w-md relative z-10" key={refreshKey}>
        {/* Profile Card */}
        <div className="mt-4 w-full bg-gradient-to-br from-[#f04e37] to-[#d9442f] rounded-3xl p-8 flex items-center text-white gap-6 shadow-2xl relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
          <div className="relative flex-shrink-0 w-28 h-28 z-10">
            <div className="absolute inset-0 bg-white/20 rounded-full blur-md animate-pulse"></div>
            {!imageError ? (
              <img
                src={
                  previewImage
                    ? previewImage
                    : currentUser?.authProvider === "google"
                    ? currentUser?.profilePicture
                    : currentUser?.profilePicture
                    ? currentUser.profilePicture.startsWith("http")
                      ? currentUser.profilePicture
                      : `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || "http://localhost:5000"}${currentUser.profilePicture}`
                    : "https://ui-avatars.com/api/?name=" + 
                      encodeURIComponent(`${currentUser?.firstName || 'User'} ${currentUser?.lastName || ''}`) +
                      "&background=ffffff&color=f04e37&size=200&bold=true"
                }
                alt="Profile"
                className="w-full h-full rounded-full border-4 border-white object-cover bg-white shadow-2xl relative"
                onError={(e) => {
                  console.log('Image failed to load, using fallback');
                  setImageError(true);
                }}
                crossOrigin="anonymous"
              />
            ) : (
              <div className="w-full h-full rounded-full border-4 border-white bg-white flex items-center justify-center text-[#f04e37] font-bold text-3xl shadow-2xl relative">
                {currentUser?.firstName?.[0]?.toUpperCase() || 'U'}
                {currentUser?.lastName?.[0]?.toUpperCase() || ''}
              </div>
            )}

            {/* Upload button */}
            {currentUser?.authProvider === "local" && (
              <>
                <label
                  htmlFor="profileUpload"
                  className="absolute bottom-0 right-0 bg-white text-[#f04e37] p-3 rounded-full shadow-lg cursor-pointer hover:scale-110 transition-transform z-10"
                >
                  <FaCamera className="w-4 h-4" />
                </label>
                <input
                  id="profileUpload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </>
            )}
          </div>

          <div className="z-10">
            <p className="text-sm text-white/80 mb-1">{t("welcome")}</p>
            <h1 className="text-3xl font-bold leading-tight mb-1">
              {currentUser
                ? `${currentUser.firstName} ${currentUser.lastName}`
                : t("guest")}
            </h1>
            {currentUser?.authProvider === "google" && (
              <div className="flex items-center gap-2 mt-2">
                <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                  <span className="text-xs">G</span>
                </div>
                <p className="text-xs text-white/80">Google Account</p>
              </div>
            )}
          </div>
        </div>

        {/* Option Buttons */}
        <div className="mt-6 w-full space-y-3">
          {options.map((opt, index) => (
            <Link
              key={index}
              to={opt.to}
              className="flex items-center justify-between px-5 py-4 bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-200 group border border-gray-100"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#f04e37] to-[#d9442f] rounded-xl flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform">
                  <span className="text-xl">{opt.icon}</span>
                </div>
                <span className="font-semibold text-gray-800 group-hover:text-[#f04e37] transition-colors">{opt.label}</span>
              </div>
              <IoChevronForwardSharp className="text-gray-400 group-hover:text-[#f04e37] group-hover:translate-x-1 transition-all" />
            </Link>
          ))}
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="mt-8 w-full bg-gradient-to-r from-red-600 to-red-700 text-white font-bold py-4 rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all duration-200"
        >
          {t("logout")}
        </button>

        {/* Social Media Icons */}
        <div className="mt-12 mb-4 flex items-center justify-center gap-4">
          <a
            href="https://www.facebook.com/share/17YomjzorW/?mibextid=wwXIfr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Facebook"
          >
            <Facebook className="w-5 h-5" />
          </a>
          <a
            href="https://www.instagram.com/intramurosph?igsh=MXUwb3o0YTBkN3cycw=="
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Instagram"
          >
            <Instagram className="w-5 h-5" />
          </a>
          <a
            href="https://www.tiktok.com/@intramurosph?_r=1&_t=ZS-91HcteutvZR"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="TikTok"
          >
            <FaTiktok className="w-5 h-5" />
          </a>
          <a
            href="https://youtube.com/@intramurosadministration?si=NxzDejo3UOFWI6x3"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="YouTube"
          >
            <Youtube className="w-5 h-5" />
          </a>
          <a
            href="https://www.linkedin.com/company/intramuros-administration/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="LinkedIn"
          >
            <Linkedin className="w-5 h-5" />
          </a>
          <a
            href="https://x.com/intramuros?s=21"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="X (Twitter)"
          >
            <Twitter className="w-5 h-5" />
          </a>
        </div>

        {/* Footer */}
        <p className="mb-8 text-xs text-center text-gray-400">
          © 2025 {t("intramurosAdmin")}. All rights reserved.
        </p>
      </div>
      </PullToRefresh>
    </motion.div>
  );
}
