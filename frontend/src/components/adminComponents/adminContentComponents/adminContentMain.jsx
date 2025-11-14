import React from "react";
import { useNavigate } from "react-router-dom";

export default function AdminContentMain() {
  const navigate = useNavigate();

  const cardData = [
    {
      title: "Tour Map",
      iconPath: "/icons/Tourmap.svg",
      route: "/AdminTourMap",
    },
    {
      title: "Photobooth",
      iconPath: "/icons/Photobooth.svg",
      route: "/AdminPhotobooth",
    },
    {
      title: "Emergency Hotlines",
      iconPath: "/icons/Hotlines.svg",
      route: "/AdminManageEmergency",
    },
    {
      title: "Chatbot",
      iconPath: "/icons/Chatbot.svg",
      route: "/AdminManageChatbot",
    },
    {
      title: "Itineraries",
      iconPath: "/icons/Itineraries.svg",
      route: "/AdminItinerary",
    },
    {
      title: "Reviews",
      iconPath: "/icons/Reviews.svg",
      route: "/AdminReviews",
    },
  ];

  const handleCardClick = (route) => {
    if (route !== "#") {
      navigate(route);
    }
  };

  return (
    <section>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
        {cardData.map((card, idx) => (
          <div
            key={idx}
            onClick={() => handleCardClick(card.route)}
            className="cursor-pointer bg-white rounded-lg shadow transition-all px-6 py-8 text-center hover:shadow-lg hover:bg-gray-50"
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
              alt={`${card.title} Icon`}
              className="w-20 h-20 mx-auto"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
