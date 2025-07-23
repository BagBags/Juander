import React from "react";
import { useNavigate } from "react-router-dom";

export default function AdminContentMain() {
  const navigate = useNavigate();

  const cardData = [
    {
      title: "Tour Map",
      iconPath: "/icons/tour-map.svg",
      route: "/admin/tour-map",
    },
    {
      title: "Photobooth",
      iconPath: "/icons/photobooth.svg",
      route: "/admin/photobooth",
    },
    {
      title: "Emergency Hotlines",
      iconPath: "/icons/emergency-hotlines.svg",
      route: "/admin/emergency-hotlines",
    },
    {
      title: "Chatbot",
      iconPath: "/icons/chatbot.svg",
      route: "/admin/chatbot",
    },
    {
      title: "Placeholder 1",
      iconPath: "/icons/placeholder.svg",
      route: "#",
    },
    {
      title: "Placeholder 2",
      description: "Coming soon...",
      iconPath: "/icons/placeholder.svg",
      route: "#",
    },
  ];

  const handleCardClick = (route) => {
    if (route !== "#") {
      navigate(route);
    }
  };

  return (
    <section>
      <h1 className="text-4xl font-bold text-[#f04e37] mb-6">Manage Content</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cardData.map((card, idx) => (
          <div
            key={idx}
            onClick={() => handleCardClick(card.route)}
            className={`cursor-pointer bg-white rounded-lg shadow transition-all px-6 py-8 text-center 
              hover:shadow-lg hover:bg-gray-50 ${
                card.route === "#" ? "opacity-60 cursor-not-allowed" : ""
              }`}
          >
            {/* Title */}
            {card.title && (
              <h3 className="text-lg font-bold text-[#f04e37] mb-4">
                {card.title}
              </h3>
            )}

            {/* SVG Icon */}
            <img
              src={card.iconPath}
              alt={`${card.title || "Add"} Icon`}
              className="w-20 h-20 mx-auto"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
