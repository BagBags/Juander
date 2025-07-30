import React from "react";

export default function Button() {
  return (
    <button
      className="absolute bottom-10 lg:top-[83%] lg:bottom-auto 
      left-1/2 -translate-x-1/2
      bg-white text-black font-semibold shadow-md rounded-lg sm:rounded-xl lg:rounded-2xl 
      w-40 sm:w-40 lg:w-52 
      h-12 sm:h-12 lg:h-14 
      text-sm sm:text-base lg:text-lg 
      hover:bg-gray-100 focus:outline-none transition duration-200"
    >
      {/* Label for Mobile/Tablet */}
      <span className="block lg:hidden">Start Tour</span>
      {/* Label for Desktop */}
      <span className="hidden lg:block">Explore</span>
    </button>
  );
}
