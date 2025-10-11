import React from "react";
import { useNavigate } from "react-router-dom";
import { Home, MapPin } from "lucide-react";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4 bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50">
      {/* 404 Illustration */}
      <div className="mb-8">
        <div className="text-9xl font-bold text-[#f04e37] opacity-20">404</div>
        <div className="text-8xl -mt-20">🗺️</div>
      </div>

      <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-4">
        Lost Your Way?
      </h1>

      <p className="mt-2 text-gray-600 text-base md:text-lg max-w-md mb-8">
        Oops! Looks like you've wandered off the map. <br />
        This destination doesn't exist in our itinerary! 🧭
      </p>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-6 py-3 bg-white text-gray-700 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border border-gray-200 hover:border-[#f04e37] active:scale-95"
        >
          <MapPin size={20} />
          Go Back
        </button>
        <button
          onClick={() => navigate("/Homepage")}
          className="flex items-center gap-2 px-6 py-3 bg-[#f04e37] text-white rounded-lg shadow-md hover:bg-[#d9442f] transition-all duration-200 active:scale-95"
        >
          <Home size={20} />
          Back to Home
        </button>
      </div>

      {/* Fun Travel Quote */}
      <div className="mt-12 text-gray-500 italic text-sm">
        "Not all who wander are lost... but you might be!" 😄
      </div>
    </div>
  );
}
