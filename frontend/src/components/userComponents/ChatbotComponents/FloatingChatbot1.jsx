import { useState } from "react";
import { X } from "lucide-react";
import Chatbot from "./Chatbot2";

export default function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Juan Button */}
      <div
        className={`fixed left-4 z-50 transition-all duration-700 ease-in-out
        ${
          isOpen
            ? "-translate-x-1/2 rotate-[45deg] scale-75"
            : "translate-x-0 rotate-0 scale-100"
        }
        bottom-28 sm:bottom-4`}
      >
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-transparent flex items-center justify-center
                     w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 lg:w-96 lg:h-96"
        >
          <img
            src={isOpen ? "/icons/juan_close.svg" : "/icons/juan_open.svg"}
            alt="Juan"
            className="w-full h-full object-contain transition-all duration-500 ease-in-out"
          />
        </button>
      </div>

      {/* Chatbox (centered) */}
      {isOpen && (
        <div
          className="relative bg-white shadow-2xl rounded-xl flex flex-col
         w-[70vw] h-[60vh] sm:w-[20rem] sm:h-[30rem] lg:w-[24rem] lg:h-[36rem]"
        >
          {/* Header */}
          <div className="bg-yellow-400 flex justify-between items-center p-4 rounded-t-xl">
            <h2 className="font-bold text-lg text-black">AskJuan</h2>
            <button onClick={() => setIsOpen(false)}>
              <X className="w-7 h-7 text-black" />
            </button>
          </div>

          {/* Actual Chatbot Component */}
          <div className="flex-1 overflow-hidden">
            <Chatbot />
          </div>
        </div>
      )}
    </>
  );
}
