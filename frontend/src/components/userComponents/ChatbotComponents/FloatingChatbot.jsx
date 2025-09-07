import { useState, useRef } from "react";
import { X } from "lucide-react";
import Chatbot from "./Chatbot";
import Draggable from "react-draggable";

export default function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 50 }); // default pos
  const nodeRef = useRef(null);

  const handleStop = (_, data) => {
    // Save final drag position
    setPosition({ x: data.x, y: data.y });
  };

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <>
      {/* Fullscreen container for bounds */}
      <div className="fixed inset-0 z-50 pointer-events-none">
        <Draggable
          nodeRef={nodeRef}
          bounds="parent"
          handle=".drag-handle"
          position={position}
          onStop={handleStop}
        >
          <div
            ref={nodeRef}
            className={`absolute pointer-events-auto transition-transform duration-500 ease-in-out
              ${isOpen ? "rotate-[45deg] scale-75" : "rotate-0 scale-100"}`}
          >
            {/* Drag handle */}
            <div
              className="drag-handle flex items-center justify-center cursor-grab active:cursor-grabbing
                         w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32"
              onClick={handleToggle}
            >
              <img
                src={isOpen ? "/icons/juan_close.svg" : "/icons/juan_open.svg"}
                alt="Juan"
                className="w-full h-full object-contain pointer-events-none"
              />
            </div>
          </div>
        </Draggable>
      </div>

      {/* Chatbox */}
      {isOpen && (
        <div
          style={{
            // Center the chatbox regardless of Juan's position
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            position: "fixed",
          }}
          className="bg-white shadow-2xl rounded-xl flex flex-col
                     w-[70vw] h-[60vh] sm:w-[20rem] sm:h-[30rem] lg:w-[24rem] lg:h-[36rem] z-[60]"
        >
          {/* Header */}
          <div className="bg-yellow-400 flex justify-between items-center p-4 rounded-t-xl">
            <h2 className="font-bold text-lg text-black">AskJuan</h2>
            <button onClick={() => setIsOpen(false)}>
              <X className="w-7 h-7 text-black" />
            </button>
          </div>

          {/* Chatbot */}
          <div className="flex-1 overflow-hidden">
            <Chatbot />
          </div>
        </div>
      )}
    </>
  );
}
