import React, { useState } from "react";
import LoginForm from "./loginForm";
import SignupForm from "./signupForm";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);

  const toggleForm = () => setIsLogin((prev) => !prev);

  return (
    <div 
      className="h-screen flex flex-col items-center justify-center p-4 sm:p-6 relative"
      style={{
        paddingTop: "max(env(safe-area-inset-top), 16px)",
        paddingBottom: "max(env(safe-area-inset-bottom), 16px)",
      }}
    >
      {/* Main Two-Column Container */}
      <div className="w-full max-w-5xl h-full bg-white rounded-2xl shadow-xl grid grid-cols-1 md:grid-cols-2 border border-gray-100 overflow-hidden">
        {/* Hidden h1 for accessibility */}
        <h1 className="sr-only">Juander - Login or Sign Up</h1>
        
        {/* Left Side (fixed area, does not move) */}
        <div className="hidden md:flex items-center justify-center h-full p-6">
          <img
            src="/Logo2.png"
            alt="Login Illustration"
            className="max-w-full max-h-full object-contain"
          />
        </div>

        {/* Right Side (scrolls internally if content is taller) */}
        <div className="flex flex-col items-center px-4 sm:px-6 md:px-8 lg:px-10 py-3 sm:py-8 md:py-10 h-full overflow-y-auto">
          {/* Mobile Logo (visible only on small screens) */}
          <div className="block md:hidden mb-6 mt-4">
            <img
              src="/Logo2.png"
              alt="Mobile Logo"
              className="w-32 sm:w-40 mx-auto"
            />
          </div>

          <div className="text-center relative mb-6 mt-2">
            <img
              src="/salakot.svg"
              alt="Salakot"
              className="absolute w-12 sm:w-20 md:w-24 lg:w-28 
                -top-5 sm:-top-7 md:-top-8 lg:-top-9
                left-[60%] sm:left-[68%] md:left-[70%] lg:left-[72%]
                rotate-[12deg] z-20"
            />
          </div>

          {/* Form Container */}
          <div className="w-full max-w-[90%] sm:max-w-sm md:max-w-md flex flex-col justify-center mt-2 relative">
            <AnimatePresence mode="wait">
              {isLogin ? (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.4 }}
                >
                  <LoginForm toggleForm={toggleForm} />
                </motion.div>
              ) : (
                <motion.div
                  key="signup"
                  initial={{ opacity: 0, x: -40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 40 }}
                  transition={{ duration: 0.4 }}
                >
                  <SignupForm toggleForm={toggleForm} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
