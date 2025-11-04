import React, { useEffect, useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faFolder,
  faUser,
  faHistory,
  faChartBar,
} from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { useContext } from "react";
import { UserContext } from "../../../contexts/UserContext";

export default function AdminSidebar({ isExpanded, toggleSidebar }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentAdmin, setCurrentAdmin } = useContext(UserContext);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const sidebarLinks = [
    { icon: faHome, label: "Home", to: "/AdminHome" },
    { icon: faFolder, label: "Contents", to: "/AdminManageContent" },
    { icon: faUser, label: "Roles", to: "/AdminManageRole" },
    { icon: faChartBar, label: "Reports", to: "/AdminReports" },
    { icon: faHistory, label: "Logs", to: "/AdminLog" },
  ];

  // Close dropdown if clicked outside
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Fetch logged-in admin info
  useEffect(() => {
    const stored = localStorage.getItem("admin");
    if (stored) {
      setCurrentAdmin(JSON.parse(stored));
    } else {
      const fetchUser = async () => {
        try {
          const token = localStorage.getItem("token");
          if (!token) return;
          const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          // Append timestamp to avoid caching old images
          const adminData = {
            ...res.data,
            profilePicture: res.data.profilePicture
              ? `${res.data.profilePicture}?t=${Date.now()}`
              : null,
          };
          setCurrentAdmin(adminData);
          localStorage.setItem("admin", JSON.stringify(adminData));
        } catch (err) {
          console.error("Error fetching user:", err);
        }
      };
      fetchUser();
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("admin");
    navigate("/");
  };

  return (
    <div
      className={`fixed top-0 left-0 h-full flex flex-col justify-between transition-all duration-300 z-40 shadow-xl
        bg-gradient-to-b from-[#f04e37] via-[#e03d2d] to-[#c72b1f]
        ${isExpanded ? "w-80" : "w-20"}`}
    >
      {/* Top: Logo and toggle */}
      <div>
        <div className="relative px-4 h-20 flex items-center">
          {isExpanded && (
            <div className="flex items-center">
              <img
                src="/IA Logo White.png"
                alt="IA Logo"
                className="h-12 w-auto object-contain drop-shadow-md pointer-events-none select-none"
              />
            </div>
          )}

          <div
            className={`absolute top-1/2 -translate-y-1/2 text-white ${
              isExpanded ? "right-4" : "left-1/2 -translate-x-1/2"
            }`}
          >
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-full hover:bg-white/20 transition"
            >
              {isExpanded ? <ChevronLeft /> : <ChevronRight />}
            </button>
          </div>
        </div>

        <hr className="border-white/30 mx-4" />

        {/* Links */}
        <ul className="mt-6 font-medium space-y-1 px-2">
          {sidebarLinks.map(({ icon: Icon, label, to }) => {
            const isActive = location.pathname === to;
            return (
              <li
                key={label}
                className={`rounded-xl transition-all duration-200 ${
                  isActive
                    ? "bg-white shadow-md"
                    : "hover:bg-white/10 hover:backdrop-blur-sm"
                }`}
              >
                <Link
                  to={to}
                  className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${
                    isExpanded ? "justify-start space-x-3" : "justify-center"
                  }`}
                >
                  <FontAwesomeIcon
                    icon={Icon}
                    className={`transition-colors duration-200 ${
                      isActive
                        ? "text-[#f04e37]"
                        : "text-white group-hover:text-[#f04e37]"
                    }`}
                    style={{ fontSize: 24 }}
                  />
                  {isExpanded && (
                    <span
                      className={`text-base transition-colors duration-200 ${
                        isActive ? "text-[#f04e37] font-semibold" : "text-white"
                      }`}
                    >
                      {label}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Bottom: Admin info + logout */}
      <div
        className={`px-4 py-5 border-t border-white/20 flex flex-col items-left gap-4 transition-all duration-200
          ${isExpanded ? "justify-end" : "justify-center items-center"}`}
      >
        {isExpanded && currentAdmin && (
          <div className="flex items-center space-x-3" ref={dropdownRef}>
            {/* Avatar */}
            {currentAdmin ? (
              currentAdmin.profilePicture ? (
                <img
                  src={
                    currentAdmin.profilePicture.startsWith("http")
                      ? currentAdmin.profilePicture + `?t=${Date.now()}`
                      : `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || "http://localhost:5000"}${
                          currentAdmin.profilePicture
                        }?t=${Date.now()}`
                  }
                  alt={`${currentAdmin.firstName} ${currentAdmin.lastName}`}
                  className="w-12 h-12 rounded-full object-cover shadow"
                  onError={(e) => {
                    // fallback if image fails to load
                    e.target.onerror = null;
                    e.target.src = null;
                  }}
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-white text-[#f04e37] flex items-center justify-center font-bold text-lg shadow">
                  {currentAdmin.firstName?.charAt(0) || "A"}
                  {currentAdmin.lastName?.charAt(0) || "D"}
                </div>
              )
            ) : (
              <div className="w-12 h-12 rounded-full bg-white text-[#f04e37] flex items-center justify-center font-bold text-lg shadow">
                A D
              </div>
            )}

            {/* Name + role */}
            <div className="flex flex-col">
              <span className="text-white/80 text-xs">Logged in as</span>
              <h2 className="text-white font-medium text-sm truncate max-w-[140px]">
                {currentAdmin.firstName} {currentAdmin.lastName}
              </h2>
            </div>

            {/* Dropdown */}
            <div className="relative">
              <button
                onClick={() => setOpen(!open)}
                className="ml-2 text-white hover:text-gray-300 focus:outline-none transition-transform duration-200"
              >
                <span
                  className={`inline-block transform transition-transform duration-200 ${
                    open ? "rotate-180" : "rotate-0"
                  }`}
                >
                  ▾
                </span>
              </button>

              {open && (
                <div className="absolute right-0 bottom-full mb-2 w-40 bg-white rounded-lg shadow-lg py-2 z-50">
                  <button
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-red-500"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                  <button
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-blue-500"
                    onClick={() => navigate("/AdminProfile")}
                  >
                    Profile
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {!isExpanded && (
          <button
            onClick={handleLogout}
            className="text-white hover:text-yellow-300 transition-colors"
            title="Logout"
          >
            <LogOut size={24} />
          </button>
        )}
      </div>
    </div>
  );
}
