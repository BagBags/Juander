import React from "react";
import { useNavigate } from "react-router-dom";

export default function BackHeader({ title }) {
  const navigate = useNavigate();

  return (
    <div className="sticky top-0 z-20 pt-4 pb-2 px-4 flex items-center  border-gray-200">
      <span
        className="text-xl font-bold text-black cursor-pointer hover:text-[#cf3325]"
        onClick={() => {
          if (window.history.state && window.history.state.idx > 0) {
            navigate(-1);
          } else {
            navigate("Homepage"); // fallback
          }
        }}
      >
        &lt;
      </span>
      <h1 className="ml-2 font-bold text-xl">{title}</h1>
    </div>
  );
}
