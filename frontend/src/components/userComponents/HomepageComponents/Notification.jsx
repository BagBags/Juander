import React from "react";
import { FaExclamationTriangle } from "react-icons/fa";

export default function Notification({ message }) {
  return (
    <div className="bg-red-500 text-white px-4 py-3 rounded-lg shadow flex items-center space-x-3 w-full transition-transform transform animate-slide-in">
      <FaExclamationTriangle className="text-yellow-300 w-5 h-5 flex-shrink-0" />
      <span className="text-sm sm:text-base flex-1">{message}</span>
    </div>
  );
}
