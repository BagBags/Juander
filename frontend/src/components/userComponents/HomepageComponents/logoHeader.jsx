import React from "react";

export default function LogoHeader() {
  return (
    <div className="flex justify-center items-center p-2 ml-4">
      <img 
        src="/icons/LogoHeader.png" 
        alt="Logo Header" 
        className="h-16 sm:h-18 md:h-20 lg:h-24 w-auto object-contain" 
      />
    </div>
  );
}
