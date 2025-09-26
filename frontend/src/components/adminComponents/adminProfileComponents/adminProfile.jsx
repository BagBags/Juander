import React, { useEffect, useState } from "react";
import { FaUser, FaBirthdayCake, FaVenusMars, FaCamera } from "react-icons/fa";
import { MdLanguage } from "react-icons/md";
import { GiEarthAsiaOceania } from "react-icons/gi";
import { IoChevronForwardSharp } from "react-icons/io5";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { useContext } from "react";
import { UserContext } from "../../../contexts/UserContext";

export default function AdminProfile() {
  const { currentAdmin, setCurrentAdmin } = useContext(UserContext);
  const [previewImage, setPreviewImage] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem("admin");
    if (stored) setCurrentAdmin(JSON.parse(stored));
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
      className="min-h-screen bg-white flex flex-col items-center text-sm relative px-4 md:px-0"
    >
      <div className="w-full max-w-md">
        {/* Profile Card */}
        <div className="mt-4 w-full bg-[#f04e37] rounded-2xl p-6 flex items-center text-white">
          <div className="relative flex-shrink-0 w-24 h-24 md:w-28 md:h-28">
            <img
              src={
                previewImage
                  ? previewImage
                  : currentAdmin?.authProvider === "google"
                  ? currentAdmin?.profilePicture
                  : currentAdmin?.profilePicture
                  ? currentAdmin.profilePicture.startsWith("http")
                    ? currentAdmin.profilePicture
                    : `https://juander.onrender.com${currentAdmin.profilePicture}`
                  : "https://i.pravatar.cc/100?img=68"
              }
              alt="Profile"
              className="w-full h-full rounded-full border-4 border-white object-cover"
            />

            {/* Upload button */}
            {currentAdmin?.authProvider === "local" && (
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
          <div className="text ml-5">
            <p className="text-base">Mabuhay!</p>
            <h1 className="text-3xl font-bold leading-tight">
              {currentAdmin
                ? `${currentAdmin.firstName} ${currentAdmin.lastName}`
                : "Admin"}
            </h1>
          </div>
        </div>

        {/* Options */}
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

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="absolute bottom-30 left-1/2 -translate-x-1/2 w-11/12 max-w-md bg-[#f04e37] text-white font-semibold py-4 rounded-xl shadow-md hover:bg-[#b42c21] transition-colors"
        >
          Log out
        </button>

        <p className="mt-80 md:mt-30 text-xs text-center text-[#cf3325] opacity-70">
          ©2025 Intramuros Administration
        </p>
      </div>
    </motion.div>
  );
}
