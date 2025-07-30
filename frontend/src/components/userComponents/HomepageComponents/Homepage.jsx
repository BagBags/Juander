import LogoHeader from "./logoHeader";
import SideButtons from "../sideButtons";
import Button from "./Button";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import EmergencyPage from "../EmegencyComponents/EmergencyPage";

export default function Homepage() {
  return (
    <div
      className="min-h-screen bg-cover bg-center flex flex-col items-center justify-start px-4 sm:px-6 md:px-8 lg:px-10 relative"
      style={{
        backgroundImage: "url('/login-background.svg')",
        backgroundColor: "#f04e37",
      }}
    >
      {/* Logo Header */}
      <div className="absolute top-4 left-0 right-0 flex justify-end px-4">
        <LogoHeader />
      </div>

      {/* Title: Juander with salakot */}
      <div className="mt-32 sm:mt-36 text-center relative z-10">
        <h3 className="text-4xl sm:text-5xl md:text-6xl lg:text-6xl xl:text-6xl font-extrabold text-white">
          Welcome To Intramuros!
        </h3>
      </div>

      {/* Form Container */}
      <div className="mt-8 w-full max-w-[90%] sm:max-w-sm md:max-w-md z-10 transition-all duration-300"></div>
      <SideButtons />
      <Button />
    </div>
  );
}
