import React from "react";

export default function LogoHeader() {
  return (
    <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 md:gap-8 p-2">
      {/* ✅ Removed: absolute top-2 left-3 
        ✅ Changed: justify-start to justify-center 
        The parent component (Homepage) will now center this block.
      */}
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
      <img src="/Logo2.png" alt="Juander" className="h-16 sm:h-18 md:h-22" />
    </div>
  );
}
