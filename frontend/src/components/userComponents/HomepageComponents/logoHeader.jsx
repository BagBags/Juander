import React from "react";

export default function LogoHeader() {
  return (
    <div className="flex justify-center items-center p-1 ml-4">
      <picture>
        {/* Desktop / Web View */}
        <source 
          srcSet="/icons/LogoHeader.webp" 
          media="(min-width: 768px)" 
        />

        {/* Mobile View (default) */}
        <img
          src="/icons/LogoHeader2.webp"
          alt="Logo Header"
          className="h-14 sm:h-16 md:h-24 lg:h-24 w-auto object-contain"
        />
      </picture>
    </div>
  );
}
