import React from "react";
import { useNavigate } from "react-router-dom";

export default function AdminContentMain() {
  const navigate = useNavigate();

  const cardData = [
    {
      title: "Tour Map",
      description: "Navigate the campus with the interactive map.",
      icon: (
        <svg
          className="w-8 h-8 text-blue-600"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 20l-5.447-2.724A2 2 0 013 15.382V5.618a2 2 0 011.553-1.947L9 2m0 18l6-3m-6 3V2m6 15l5.447-2.724A2 2 0 0021 13.382V3.618a2 2 0 00-1.553-1.947L15 0m0 18V0"
          />
        </svg>
      ),
      route: "/admin/tour-map",
    },
    {
      title: "Photobooth",
      description: "Capture and store event photos.",
      icon: (
        <svg
          className="w-8 h-8 text-pink-500"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 7h2l2-3h10l2 3h2a2 2 0 012 2v11a2 2 0 01-2 2H3a2 2 0 01-2-2V9a2 2 0 012-2z"
          />
          <circle cx="12" cy="13" r="4" />
        </svg>
      ),
      route: "/admin/photobooth",
    },
    {
      title: "Emergency Hotlines",
      description: "View and update emergency contact info.",
      icon: (
        <svg
          className="w-8 h-8 text-red-600"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 10a11.05 11.05 0 01-11 11 11.05 11.05 0 01-11-11C-1 5 3 1 8 1s9 4 9 9z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7v4l3 2" />
        </svg>
      ),
      route: "/admin/emergency-hotlines",
    },
    {
      title: "Chatbot",
      description: "Manage or test the student assistant bot.",
      icon: (
        <svg
          className="w-8 h-8 text-green-600"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12h6m-3 -6v6m-7 5a7 7 0 1114 0 7 7 0 01-14 0z"
          />
        </svg>
      ),
      route: "/admin/chatbot",
    },
    {
      title: "Placeholder 1",
      description: "Coming soon...",
      icon: (
        <svg
          className="w-8 h-8 text-gray-500"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4l2 2" />
        </svg>
      ),
      route: "#",
    },
    {
      title: "Placeholder 2",
      description: "Coming soon...",
      icon: (
        <svg
          className="w-8 h-8 text-gray-500"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M4 4h16v16H4z" />
        </svg>
      ),
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
            className={`cursor-pointer bg-white rounded-lg shadow transition-all p-6 
              hover:shadow-lg hover:bg-gray-50 ${
                card.route === "#" ? "opacity-60 cursor-not-allowed" : ""
              }`}
          >
            <div className="mb-4">{card.icon}</div>
            <h3 className="text-lg font-bold text-gray-800">{card.title}</h3>
            <p className="text-gray-600 text-sm">{card.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
