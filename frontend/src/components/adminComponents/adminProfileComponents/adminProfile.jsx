import React, { useEffect, useState } from "react";
import { FaUser, FaBirthdayCake, FaVenusMars, FaCamera } from "react-icons/fa";
import { MdLanguage } from "react-icons/md";
import { GiEarthAsiaOceania } from "react-icons/gi";
import { IoChevronForwardSharp, IoSettingsSharp } from "react-icons/io5";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { useContext } from "react";
import { UserContext } from "../../../contexts/UserContext";

export default function AdminProfile() {
  const { currentAdmin, setCurrentAdmin } = useContext(UserContext);
  const [previewImage, setPreviewImage] = useState(null);
  const [imageError, setImageError] = useState(false);
  const navigate = useNavigate();

  // Load admin from localStorage
  useEffect(() => {
    const loadAdmin = () => {
      const stored = localStorage.getItem("admin");
      if (stored) setCurrentAdmin(JSON.parse(stored));
    };

    loadAdmin();
    window.addEventListener("storage", loadAdmin);
    return () => window.removeEventListener("storage", loadAdmin);
  }, []);

  const options = [
    { icon: <FaUser />, label: "Account", to: "/AdminProfile/Account" },
    {
      icon: <FaBirthdayCake />,
      label: "Birthday",
      to: "/AdminProfile/Birthday",
    },
    { icon: <FaVenusMars />, label: "Gender", to: "/AdminProfile/Gender" },
    {
      icon: <GiEarthAsiaOceania />,
      label: "Country",
      to: "/AdminProfile/Country",
    },
    { icon: <MdLanguage />, label: "Language", to: "/AdminProfile/Language" },
    { icon: <IoSettingsSharp />, label: "Settings", to: "/AdminProfile/Settings" },
  ];

  const handleFileChange = async (e) => {
    if (currentAdmin?.authProvider !== "local") return;

    const file = e.target.files[0];
    if (!file) return;

    // Preview immediately
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

      // ✅ Append timestamp to force browser to fetch new image
      const newProfilePic = `${res.data.profilePicture}?t=${Date.now()}`;

      const updatedAdmin = {
        ...currentAdmin,
        profilePicture: newProfilePic,
      };

      setCurrentAdmin(updatedAdmin);
      localStorage.setItem("admin", JSON.stringify(updatedAdmin));
    } catch (err) {
      console.error("Upload failed:", err.response?.data || err.message);
      alert("Failed to upload profile picture.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("admin");
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

      <div className="w-full max-w-md relative z-10">
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
                    : currentAdmin?.authProvider === "google"
                    ? currentAdmin?.profilePicture
                    : currentAdmin?.profilePicture
                    ? currentAdmin.profilePicture.startsWith("http")
                      ? currentAdmin.profilePicture
                      : `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || "http://localhost:5000"}${currentAdmin.profilePicture}`
                    : "https://ui-avatars.com/api/?name=" + 
                      encodeURIComponent(`${currentAdmin?.firstName || 'Admin'} ${currentAdmin?.lastName || ''}`) +
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
                {currentAdmin?.firstName?.[0]?.toUpperCase() || 'A'}
                {currentAdmin?.lastName?.[0]?.toUpperCase() || ''}
              </div>
            )}

            {/* Upload button */}
            {currentAdmin?.authProvider === "local" && (
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
            <p className="text-sm text-white/80 mb-1">Mabuhay!</p>
            <h1 className="text-3xl font-bold leading-tight mb-1">
              {currentAdmin
                ? `${currentAdmin.firstName} ${currentAdmin.lastName}`
                : "Admin"}
            </h1>
            {currentAdmin?.authProvider === "google" && (
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
          Log out
        </button>

        {/* Footer */}
        <p className="mt-12 mb-8 text-xs text-center text-gray-400">
          © 2025 Intramuros Administration. All rights reserved.
        </p>
      </div>
    </motion.div>
  );
}
