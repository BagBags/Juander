import React, { useState } from "react";
import LogoHeader from "./logoHeader";
import LoginForm from "./loginForm";
import SignupForm from "./signupForm";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);

  const toggleForm = () => setIsLogin((prev) => !prev);

  return (
    <div
      className="min-h-screen bg-cover bg-center flex flex-col items-center justify-start px-4 sm:px-6 md:px-8 lg:px-10 relative"
      style={{ backgroundImage: "url('/login-background.svg')" }}
    >
      {/* Logo Header */}
      <div className="absolute top-4 left-0 right-0 flex justify-center px-4">
        <LogoHeader />
      </div>

      {/* Title: Juander with salakot */}
      <div className="mt-32 sm:mt-36 text-center relative z-10">
        <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-8xl xl:text-9xl font-extrabold text-[#f04e37]">
          Juander
        </h1>
        <img
          src="/salakot.svg"
          alt="Salakot"
          className="absolute w-24 sm:w-28 md:w-32 lg:w-36 xl:w-44 
             -top-6 sm:-top-7 md:-top-8 lg:-top-9 xl:-top-10
                left-[78%]
               rotate-[12deg] z-20"
        />
      </div>

      {/* Form Container */}
      <div className="mt-8 w-full max-w-[90%] sm:max-w-sm md:max-w-md z-10 transition-all duration-300">
        {isLogin ? (
          <LoginForm toggleForm={toggleForm} />
        ) : (
          <SignupForm toggleForm={toggleForm} />
        )}
      </div>
    </div>
  );
}
