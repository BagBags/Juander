import React, { useEffect, useState } from "react";

export default function LogoHeader() {
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    const onStart = () => setIsSpeaking(true);
    const onStop = () => setIsSpeaking(false);
    window.addEventListener("chatbot-tts-started", onStart);
    window.addEventListener("chatbot-tts-stopped", onStop);
    return () => {
      window.removeEventListener("chatbot-tts-started", onStart);
      window.removeEventListener("chatbot-tts-stopped", onStop);
    };
  }, []);

  return (
    <div className="flex justify-center items-center p-1 ml-4">
      <picture>
        <source srcSet="/icons/LogoHeader.webp" media="(min-width: 768px)" />
        <img
          src="/icons/LogoHeader2.webp"
          alt="Logo Header"
          className={`${isSpeaking ? "animate-pulse" : ""} h-14 sm:h-16 md:h-24 lg:h-24 w-auto object-contain`}
        />
      </picture>
    </div>
  );
}
