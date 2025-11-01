import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function BackHeader({ title, fallback = "/Profile" }) {
  const navigate = useNavigate();

  const handleBack = () => {
    // safest: always go to fallback
    navigate(fallback);
  };

  return (
    <div className="sticky top-0 z-20 bg-white pb-2 px-4 flex items-center border-b border-gray-200" style={{ paddingTop: "max(env(safe-area-inset-top), 16px)" }}>
      <span
        className="text-xl font-bold text-black cursor-pointer hover:text-[#cf3325]"
        onClick={handleBack}
      >
        &lt;
      </span>
      <h1 className="ml-2 font-bold text-xl">{title}</h1>
    </div>
  );
}
