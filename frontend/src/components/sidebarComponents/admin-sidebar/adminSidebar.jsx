import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  House,
  FolderClosed,
  UserRound,
  Newspaper,
  History,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

export default function AdminSidebar({ isExpanded, toggleSidebar }) {
  const location = useLocation(); // ✅ get current route

  const sidebarLinks = [
    { icon: House, label: "Home", to: "/AdminHome" },
    { icon: FolderClosed, label: "Contents", to: "/AdminManageContent" },
    { icon: UserRound, label: "Roles", to: "/AdminManageRole" },
    { icon: Newspaper, label: "Reports", to: "/AdminReports" },
    { icon: History, label: "Logs", to: "/AdminLogs" },
  ];

  return (
    <div
      className={`bg-[#f04e37] fixed top-0 left-0 h-full transition-all duration-300 z-40 ${
        isExpanded ? "w-80" : "w-20"
      }`}
    >
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

        <button
          onClick={toggleSidebar}
          className="text-white hover:text-yellow-300 ml-auto"
        >
          {isExpanded ? <ChevronsLeft /> : <ChevronsRight />}
        </button>
      </div>

      <hr className="border-white/30 mx-2" />

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
              <Link to={to} className="flex items-center space-x-3">
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
  );
}
