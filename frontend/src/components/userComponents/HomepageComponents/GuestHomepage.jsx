import { React, useState, useEffect } from "react";
import LogoHeader from "./logoHeader";
import { useNavigate } from "react-router-dom";
import FloatingChatbot from "../ChatbotComponents/FloatingChatbot";
import SideButtons from "../sideButtons";
import { useTranslation } from "react-i18next";
import GlobalTTSButton from "../../GlobalTTSButton";
import ttsService from "../../../utils/textToSpeech";

export default function GuestHomepage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  // Load guest language preference on mount
  useEffect(() => {
    const savedLang = sessionStorage.getItem("guestLanguage");
    if (savedLang) {
      i18n.changeLanguage(savedLang);
    }
  }, [i18n]);

  // Announce page load with TTS
  useEffect(() => {
    ttsService.speak(t('tts_welcome'));
  }, [t]);

  return (
    <div
      className="fixed inset-0 bg-cover bg-center bg-no-repeat flex flex-col items-center justify-start px-4 sm:px-6 md:px-8 lg:px-10 overflow-hidden"
      style={{
        backgroundImage: "url('/JuanderBGWeb.svg')",
        backgroundColor: "#f04e37",
        backgroundAttachment: "fixed",
        backgroundSize: "cover",
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
        touchAction: "none",
        overscrollBehavior: "none",
        WebkitOverscrollBehavior: "none",
      }}
    >
      {/* Logo Header */}
      <div className="w-full mt-10 flex justify-center px-4">
        <LogoHeader />
      </div>

      {/* Title */}
      <div className="mt-40 sm:mt-26 md:mt-40 lg:mt-48 text-center relative z-10 px-4">
        <h5
          className="text-[38px] sm:text-[56px] md:text-[68px] 
             font-poppins font-extrabold tracking-tight leading-[1.1] 
             text-[#f5f5dc] drop-shadow-[0_4px_10px_rgba(0,0,0,0.45)]"
        >
          {t("homepageTitle")}
        </h5>
      </div>

      {/* Side Buttons - Using shared component with guest filter */}
      <SideButtons userType="guest" />

      {/* Explore Button (Mobile Only) */}
      <button
        onClick={() => navigate("/GuestItinerary")}
        className="absolute bottom-10 lg:top-[83%] lg:bottom-auto 
        left-1/2 -translate-x-1/2
        bg-white text-black font-semibold shadow-md rounded-lg sm:rounded-xl lg:rounded-2xl 
        w-40 sm:w-40 lg:w-52 
        h-12 sm:h-12 lg:h-14 
        text-sm sm:text-base lg:text-lg 
        hover:bg-yellow-500 focus:outline-none transition duration-200
        block md:hidden"
      >
        Explore
      </button>

      {/* Sign Up to Explore Button (Desktop Only) */}
      <button
        onClick={() => navigate("/login")}
        className="absolute bottom-10 lg:top-[83%] lg:bottom-auto 
        left-1/2 -translate-x-1/2
        bg-white text-black font-semibold shadow-md rounded-lg sm:rounded-xl lg:rounded-2xl 
        w-40 sm:w-40 lg:w-52 
        h-12 sm:h-12 lg:h-14 
        text-sm sm:text-base lg:text-lg 
        hover:bg-yellow-500 focus:outline-none transition duration-200
        hidden md:block"
      >
        Sign up to Explore
      </button>

      {/* Floating Chatbot (Juan Mascot) */}
      <FloatingChatbot />
      
      {/* Global TTS Button */}
      <GlobalTTSButton />
    </div>
  );
}
