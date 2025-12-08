import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import Chatbot from "./Chatbot";
import Draggable from "react-draggable";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

export default function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: -30, y: 550 }); // Start peeking from left
  const [draggedPosition, setDraggedPosition] = useState({ x: -30, y: 550 });

  const nodeRef = useRef(null);
  const modalRef = useRef(null);
  const wasDragged = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const touchStartPos = useRef({ x: 0, y: 0 });
  const touchStartTime = useRef(0);

  const handleStart = (_, data) => {
    wasDragged.current = false; // Reset at start of each interaction
    dragStartPos.current = { x: data.x, y: data.y };
  };

  // ✅ now updates live
  const handleDrag = (_, data) => {
    // Only mark as dragged if moved more than 5px from start
    const dragDistance = Math.sqrt(
      Math.pow(data.x - dragStartPos.current.x, 2) +
        Math.pow(data.y - dragStartPos.current.y, 2)
    );

    if (dragDistance > 5) {
      wasDragged.current = true;
    }

    setPosition({ x: data.x, y: data.y });
  };

  const handleStop = (_, data) => {
    // Always snap to left side (partially off-screen)
    const snappedX = -30;
    const newPos = { x: snappedX, y: data.y };

    setPosition(newPos);
    setDraggedPosition(newPos);

    // Reset wasDragged after a short delay to allow click handler to check it
    setTimeout(() => {
      wasDragged.current = false;
    }, 50);
  };

  const handleToggle = () => {
    if (wasDragged.current) return;

    if (!isOpen) {
      // When opening, move slightly inward from the left edge
      setPosition({ x: 10, y: draggedPosition.y });
      setIsOpen(true);
    } else {
      // When closing, snap back to hidden position on left
      setPosition(draggedPosition);
      setIsOpen(false);
    }
  };

  useEffect(() => {
    let prevOverflow = "";
    let prevTouchAction = "";
    let prevOverscroll = "";
    let prevViewport = "";

    if (isOpen) {
      prevOverflow = document.body.style.overflow;
      prevTouchAction = document.body.style.touchAction;
      prevOverscroll = document.body.style.overscrollBehavior;
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
      document.body.style.overscrollBehavior = "none";
      const meta = document.querySelector('meta[name="viewport"]');
      if (meta) prevViewport = meta.getAttribute("content") || "";
      if (meta) {
        meta.setAttribute(
          "content",
          "width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"
        );
      }
    }

    return () => {
      if (isOpen) {
        document.body.style.overflow = prevOverflow || "";
        document.body.style.touchAction = prevTouchAction || "";
        document.body.style.overscrollBehavior = prevOverscroll || "";
        const meta = document.querySelector('meta[name="viewport"]');
        if (meta && prevViewport) meta.setAttribute("content", prevViewport);
      }
    };
  }, [isOpen]);

  return (
    <>
      <div className="fixed inset-0 z-[12000] pointer-events-none">
        <Draggable
          nodeRef={nodeRef}
          bounds="parent"
          handle=".drag-handle"
          position={position}
          onStart={handleStart}
          onDrag={handleDrag}
          onStop={handleStop}
        >
          <motion.div
            ref={nodeRef}
            className={`absolute floating-chatbot ${
              isOpen ? "pointer-events-none" : "pointer-events-auto"
            }`}
            initial={{ x: position.x, y: position.y }}
            animate={{ x: position.x, y: position.y }}
            transition={
              wasDragged.current
                ? { duration: 0 } // instant while dragging
                : { duration: 0.5, ease: "easeInOut" } // smooth when opening/closing
            }
          >
            <div
              className={`drag-handle flex items-center justify-center cursor-grab active:cursor-grabbing
                w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32
                transition-transform duration-300 ease-in-out
                ${isOpen ? "rotate-0 scale-100" : "rotate-[30deg] scale-90"}`}
              onClick={handleToggle}
              onTouchStart={(e) => {
                const touch = e.touches[0];
                touchStartPos.current = { x: touch.clientX, y: touch.clientY };
                touchStartTime.current = Date.now();
              }}
              onTouchEnd={(e) => {
                const touch = e.changedTouches[0];
                const touchEndPos = { x: touch.clientX, y: touch.clientY };
                const touchDuration = Date.now() - touchStartTime.current;

                // Calculate distance moved
                const distance = Math.sqrt(
                  Math.pow(touchEndPos.x - touchStartPos.current.x, 2) +
                    Math.pow(touchEndPos.y - touchStartPos.current.y, 2)
                );

                // If moved less than 10px and duration less than 300ms, it's a tap
                if (distance < 10 && touchDuration < 300) {
                  e.preventDefault();
                  e.stopPropagation();
                  handleToggle();
                }
              }}
              style={{ position: "relative" }}
            >
              <button
                aria-label="Open chatbot"
                className="drag-handle"
                onClick={handleToggle}
                onTouchStart={(e) => {
                  const touch = e.touches[0];
                  touchStartPos.current = {
                    x: touch.clientX,
                    y: touch.clientY,
                  };
                  touchStartTime.current = Date.now();
                }}
                onTouchEnd={(e) => {
                  const touch = e.changedTouches[0];
                  const touchEndPos = { x: touch.clientX, y: touch.clientY };
                  const touchDuration = Date.now() - touchStartTime.current;
                  const distance = Math.sqrt(
                    Math.pow(touchEndPos.x - touchStartPos.current.x, 2) +
                      Math.pow(touchEndPos.y - touchStartPos.current.y, 2)
                  );
                  if (distance < 10 && touchDuration < 300) {
                    e.preventDefault();
                    e.stopPropagation();
                    handleToggle();
                  }
                }}
                style={{
                  position: "absolute",
                  top: -8,
                  right: -8,
                  bottom: -8,
                  left: -8,
                  background: "transparent",
                  pointerEvents: "auto",
                  zIndex: 5,
                }}
              />
              <img
                src="/icons/juan_open.svg"
                alt="Juan"
                className="w-full h-full object-contain pointer-events-none"
              />
            </div>
          </motion.div>
        </Draggable>
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 z-[12000] flex items-center justify-center"
          style={{
            overscrollBehavior: "contain",
            touchAction: "none",
            WebkitTextSizeAdjust: "100%",
          }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            ref={modalRef}
            className="bg-white shadow-2xl flex flex-col w-full h-full sm:w-[24rem] sm:h-[32rem] lg:w-[32rem] lg:h-[40rem] xl:w-[36rem] xl:h-[44rem] sm:rounded-2xl"
          >
            <div
              className="bg-gradient-to-r from-[#f04e37] via-[#e03d2d] to-[#f04e37] h-14 flex justify-between items-center px-5 py-3 sm:rounded-t-2xl shadow-lg backdrop-blur-md border-b border-white/20"
              style={{
                paddingTop: "calc(env(safe-area-inset-top) + 0.75rem)",
                height: "calc(3.5rem + env(safe-area-inset-top))",
              }}
            >
              <h2 className="font-bold text-lg text-white tracking-wide drop-shadow-sm">
                AskJuan
              </h2>
              <button
                onClick={handleToggle}
                className="p-2 rounded-full hover:bg-white/20 transition transform hover:scale-110 active:scale-95"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            <div className="flex-1 overflow-hidden">
              <Chatbot />
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
