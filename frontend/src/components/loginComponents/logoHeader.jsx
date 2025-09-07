import React from "react";

export default function LogoHeader() {
  return (
    <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 md:gap-8 mb-6 px-2">
      <img src="/IA Logo.svg" alt="IA" className="h-12 sm:h-16 md:h-20" />
      <img
        src="/love-the-philippines.svg"
        alt="Love the Philippines"
        className="h-14 sm:h-20 md:h-24"
      />
      <img
        src="/bagong-pilipinas.svg"
        alt="Bagong Pilipinas"
        className="h-12 sm:h-16 md:h-20"
      />
      <img src="/logo.png" alt="Juander" className="h-12 sm:h-16 md:h-20" />
    </div>
  );
}
