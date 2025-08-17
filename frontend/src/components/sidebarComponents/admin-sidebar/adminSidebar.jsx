import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  House,
  FolderClosed,
  UserRound,
  Newspaper,
  History,
  ChevronsLeft,
  ChevronsRight,
  LogOut,
} from "lucide-react";
import axios from "axios";

export default function AdminSidebar({ isExpanded, toggleSidebar }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentAdmin, setCurrentAdmin] = useState(null);

  const sidebarLinks = [
    { icon: House, label: "Home", to: "/AdminHome" },
    { icon: FolderClosed, label: "Contents", to: "/AdminManageContent" },
    { icon: UserRound, label: "Roles", to: "/AdminManageRole" },
    { icon: Newspaper, label: "Reports", to: "/AdminReports" },
    { icon: History, label: "Logs", to: "/AdminLog" },
  ];

  // Fetch logged-in admin info
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await axios.get("http://localhost:5000/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCurrentAdmin(res.data);
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/"); // redirect to login/homepage
  };

  return (
    <div
      className={`bg-[#f04e37] fixed top-0 left-0 h-full flex flex-col justify-between transition-all duration-300 z-40 ${
        isExpanded ? "w-80" : "w-20"
      }`}
    >
      {/* Top: Logo and toggle */}
      <div>
        <div className="flex items-center justify-between px-4 py-3">
          {isExpanded && (
            <div className="flex items-center gap-4 mx-auto">
              <img
                src="/IA Logo.svg"
                alt="IA Logo"
                className="w-20 h-20 object-contain"
              />
              <img
                src="/Juander Logo.svg"
                alt="Juander Logo"
                className="w-20 h-20 object-contain"
              />
            </div>
          )}
          <div
            className={`${
              isExpanded ? "ml-auto" : "mx-auto"
            } text-white hover:text-yellow-300`}
          >
            <button onClick={toggleSidebar}>
              {isExpanded ? <ChevronsLeft /> : <ChevronsRight />}
            </button>
          </div>
        </div>

        <hr className="border-white/30 mx-2" />

        {/* Links */}
        <ul className="mt-3 font-semibold">
          {sidebarLinks.map(({ icon: Icon, label, to }) => {
            const isActive = location.pathname === to;
            return (
              <li
                key={label}
                className={`mb-2 rounded py-3 px-3 transition-all duration-200 ${
                  isActive ? "bg-white" : "hover:bg-white group"
                }`}
              >
                <Link
                  to={to}
                  className={`flex items-center transition-all duration-200 ${
                    isExpanded ? "justify-start space-x-3" : "justify-center"
                  }`}
                >
                  <Icon
                    size={28}
                    className={`transition-all duration-200 ${
                      isActive
                        ? "text-[#f04e37]"
                        : "text-white group-hover:text-[#f04e37]"
                    }`}
                  />
                  {isExpanded && (
                    <span
                      className={`text-lg font-bold transition-all duration-200 ${
                        isActive
                          ? "text-[#f04e37]"
                          : "text-white group-hover:text-[#f04e37]"
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

      <div
        className={`px-4 py-4 border-t border-white/30 flex flex-col items-center gap-3 transition-all duration-200 ${
          isExpanded ? "justify-end" : "justify-center"
        }`}
      >
        {isExpanded && currentAdmin && (
          <>
            {/* Avatar + name */}
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-white text-[#f04e37] flex items-center justify-center font-bold text-lg">
                {currentAdmin.firstName.charAt(0)}
                {currentAdmin.lastName?.charAt(0)}
              </div>
              <span className="text-white text-xs mt-2">Logged in as</span>
              <h2 className="text-white font-semibold text-sm text-center truncate w-full">
                {currentAdmin.firstName} {currentAdmin.lastName}
              </h2>
            </div>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-white text-[#f04e37] px-4 py-2 rounded-full hover:bg-gray-100 transition-colors shadow-sm text-sm font-medium"
            >
              <LogOut size={18} />
              Logout
            </button>
          </>
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
