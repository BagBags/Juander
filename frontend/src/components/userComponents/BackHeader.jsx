// BackHeader.jsx
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function BackHeader({ title }) {
  const navigate = useNavigate();
  const location = useLocation();
  const fromPath = location.state?.fromPath; // "/GuestHomepage", "/Homepage", etc.

  const handleBack = () => {
    if (fromPath) {
      // Go exactly where we came from (guest or tourist)
      navigate(fromPath, { replace: true });
      return;
    }

    // If a real history entry exists, go back
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
      return;
    }

    // Final fallback by role
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "null");

    if (token && user?.role === "tourist") {
      navigate("/Homepage", { replace: true });
    } else if (token && user?.role === "admin") {
      navigate("/AdminHome", { replace: true });
    } else {
      navigate("/GuestHomepage", { replace: true });
    }
  };

  return (
    <div className="sticky top-0 z-20 pb-2 px-4 flex items-center border-gray-200" style={{ paddingTop: "max(env(safe-area-inset-top), 16px)" }}>
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
