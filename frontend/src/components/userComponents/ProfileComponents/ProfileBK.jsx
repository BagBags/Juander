import React, { useEffect, useState } from "react";
import { FaUser, FaBirthdayCake, FaVenusMars, FaCamera } from "react-icons/fa";
import { MdLanguage } from "react-icons/md";
import { GiEarthAsiaOceania } from "react-icons/gi";
import { IoChevronForwardSharp } from "react-icons/io5";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import axios from "axios";
import ttsService from "../../../utils/textToSpeech";

export default function ProfilePageBK() {
  const [currentUser, setCurrentUser] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [imageError, setImageError] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

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

      const token =
        sessionStorage.getItem("token") || localStorage.getItem("token");
      if (!token) {
        alert("Not logged in");
        return;
      }

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
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="min-h-screen bg-white flex flex-col items-center text-sm relative px-4 md:px-0"
    >
      {/* Global TTS Button */}

      <div className="w-full max-w-md">
        {/* Profile Card */}
        <div className="mt-4 w-full bg-[#f04e37] rounded-2xl p-6 flex items-center text-white gap-6">
          <div className="relative flex-shrink-0 w-24 h-24 md:w-28 md:h-28">
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
                className="w-full h-full rounded-full border-4 border-white object-cover bg-white"
                onError={(e) => {
                  console.log('Image failed to load, using fallback');
                  setImageError(true);
                }}
                crossOrigin="anonymous"
              />
            ) : (
              <div className="w-full h-full rounded-full border-4 border-white bg-gradient-to-br from-[#f04e37] to-orange-600 flex items-center justify-center text-white font-bold text-2xl">
                {currentUser?.firstName?.[0]?.toUpperCase() || 'U'}
                {currentUser?.lastName?.[0]?.toUpperCase() || ''}
              </div>
            )}

            {/* Upload button */}
            {currentUser?.authProvider === "local" && (
              <>
                <label
                  htmlFor="profileUpload"
                  className="absolute bottom-1 right-1 md:bottom-2 md:right-2 bg-white text-[#f04e37] p-2 rounded-full shadow cursor-pointer hover:bg-gray-100 transition"
                >
                  <FaCamera className="w-3 h-3 md:w-4 md:h-4" />
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

          <div>
            <p className="text-base">{t("welcome")}</p>
            <h1 className="text-3xl font-bold leading-tight">
              {currentUser
                ? `${currentUser.firstName} ${currentUser.lastName}`
                : t("guest")}
            </h1>
          </div>
        </div>

        {/* Option Buttons */}
        <div className="mt-4 w-full space-y-2">
          {options.map((opt, index) => (
            <Link
              key={index}
              to={opt.to}
              className="flex items-center justify-between px-4 py-4 bg-[#f04e37] rounded-xl text-white hover:bg-[#b42c21] transition"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{opt.icon}</span>
                <span>{opt.label}</span>
              </div>
              <IoChevronForwardSharp />
            </Link>
          ))}
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="absolute bottom-30 left-1/2 -translate-x-1/2 w-11/12 max-w-md bg-[#f04e37] text-white font-semibold py-4 rounded-xl shadow-md hover:bg-[#b42c21] transition-colors"
        >
          {t("logout")}
        </button>

        {/* Footer */}
        <p className="mt-80 md:mt-30 text-xs text-center text-[#cf3325] opacity-70">
          ©2025 {t("intramurosAdmin")}
        </p>
      </div>
    </motion.div>
  );
}
