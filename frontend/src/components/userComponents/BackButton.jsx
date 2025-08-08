import React from "react";
import { useNavigate } from "react-router-dom";

export default function BackHeader() {
  const navigate = useNavigate();

  return (
    <div className="sticky top-0 z-20  pt-4 pb-2 px-4 flex items-center  border-gray-200">
      <span
        className="text-xl font-bold text-black cursor-pointer hover:text-[#cf3325]"
        onClick={() => navigate("/Homepage")}
      >
        &lt;
      </span>
      <h1 className="ml-2 font-bold text-xl">Back</h1>
    </div>
  );
}
