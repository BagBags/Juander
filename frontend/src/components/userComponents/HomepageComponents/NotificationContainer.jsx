import React, { useState } from "react";
import Notification from "./Notification";
import { FaBell } from "react-icons/fa"; // Bell icon for the header

export default function NotificationContainer({ notifications }) {
  // State to toggle notification visibility
  const [isVisible, setIsVisible] = useState(false);

  // Toggle visibility when user clicks on the header
  const toggleVisibility = () => {
    setIsVisible((prev) => !prev);
  };

  return (
    <div
      className="
        fixed top-[15%] left-1/2 transform -translate-x-1/2 z-50
        max-h-[120px] sm:max-h-[160px] md:max-h-[200px]
        w-3/5 sm:w-80 md:w-96
        bg-white rounded-xl shadow-xl flex flex-col overflow-hidden
        transition-all duration-300 ease-in-out
      "
    >
      {/* Sticky Header with Clickable Title */}
      <div
        className="
          sticky top-0 z-20 px-4 py-3 border-b border-gray-200 font-semibold text-sm sm:text-base 
          bg-white cursor-pointer flex items-center justify-between 
          hover:bg-gray-100 hover:shadow-md transition-all
        "
        onClick={toggleVisibility}
      >
        <div className="flex items-center space-x-2">
          <FaBell className="text-red-500 w-5 h-5" />
          <span>Site Notifications ({notifications.length})</span>
        </div>
        <div>
          <span className="text-gray-500">{isVisible ? "Hide" : "View"}</span>
        </div>
      </div>

      {/* Conditionally render notifications */}
      {isVisible && (
        <div className="flex flex-col gap-3 p-3 overflow-y-auto transition-all">
          {notifications.length === 0 ? (
            <div className="text-gray-600 text-center text-sm">
              No inactive sites
            </div>
          ) : (
            notifications.map((notif) => (
              <Notification
                key={notif._id}
                message={`"${notif.siteName}" is currently unavailable.`}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
