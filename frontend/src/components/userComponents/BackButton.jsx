import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function BackHeader({ title }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="sticky top-0 z-20 pt-4 pb-2 px-4 flex items-center border-gray-200">
      <span
        className="text-xl font-bold text-black cursor-pointer hover:text-[#cf3325]"
        onClick={() => {
          if (location.key !== "default") {
            navigate(-1); // go back if possible
          } else {
            navigate("/"); // fallback if user opened page directly
          }
        }}
      >
        &lt;
      </span>
      <h1 className="ml-2 font-bold text-xl">{title || "Back"}</h1>
    </div>
  );
}
