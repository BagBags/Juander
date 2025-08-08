import React, { useState } from "react";
import SideButtons from "../sideButtons";
import BackHeader from "../BackButton";
import { FaCheck, FaPlus, FaChevronDown, FaChevronUp } from "react-icons/fa";

export default function CreateItineraryPage() {
  const [selected, setSelected] = useState([]);
  const [itineraries, setItineraries] = useState([]);
  const [itineraryName, setItineraryName] = useState("");
  const [expandedIndex, setExpandedIndex] = useState(null);

  const sites = [
    {
      name: "San Ignacio Church",
      subtitle: "Museo de Intramuros",
      description:
        "A historic church housing the Museo de Intramuros with religious artifacts and art.",
      image: "https://picsum.photos/seed/sanignacio/320/240",
    },
    {
      name: "San Nicolas de Tolentino",
      subtitle: "Home of the original image of the Black Nazarene",
      description:
        "Famous for its historical significance and as the home of the original Black Nazarene image.",
      image: "https://picsum.photos/seed/sannicolas/320/240",
    },
    {
      name: "San Agustin Church",
      subtitle: "Shrine of Nuestra Señora de Consolacion y Correa",
      description:
        "A UNESCO World Heritage Site and one of the oldest stone churches in the Philippines.",
      image: "https://picsum.photos/seed/sanagustin/320/240",
    },
  ];

  const toggleSelection = (index) => {
    if (selected.includes(index)) {
      setSelected(selected.filter((i) => i !== index));
    } else {
      setSelected([...selected, index]);
    }
  };

  const handleSave = () => {
    if (!itineraryName.trim() || selected.length === 0) return;

    // Create a grouped itinerary object
    const newItinerary = {
      name: itineraryName.trim(),
      sites: selected.map((index) => sites[index]),
    };

    setItineraries((prev) => [...prev, newItinerary]);
    setSelected([]);
    setItineraryName("");
  };

  const toggleExpand = (idx) => {
    setExpandedIndex(expandedIndex === idx ? null : idx);
  };

  return (
    <div className="min-h-screen bg-[#f04e37] flex flex-col items-center text-sm relative px-4 md:px-0 text-white">
      <div className="w-full max-w-xl relative">
        <div className="pt-4 z-10 sticky top-0 bg-[#f04e37]">
          <BackHeader title="Create Itinerary" />
        </div>

        <div className="mt-4 text-center">
          <h1 className="text-2xl font-bold mb-2">Create Your Own Itinerary</h1>
          <p className="text-sm opacity-90 mb-6">
            Select from the options below. Once saved, they’ll appear in the
            list of created itineraries.
          </p>

          <input
            type="text"
            value={itineraryName}
            onChange={(e) => setItineraryName(e.target.value)}
            placeholder="Enter itinerary name"
            className="w-full p-3 rounded-xl border border-transparent bg-white/90 text-gray-900 placeholder-gray-500 shadow-sm focus:border-[#f4cc27] focus:ring-2 focus:ring-[#f4cc27] outline-none transition-all duration-300 mb-6"
          />

          <h2 className="text-3xl font-bold mb-6">Sites</h2>

          <div className="flex flex-col items-center gap-6">
            {sites.map((site, index) => (
              <div
                key={index}
                className="bg-[#f4cc27] text-black rounded-2xl shadow-md p-4 flex flex-col justify-between w-full min-h-[200px]"
              >
                <div className="flex gap-4 items-center">
                  <img
                    src={site.image}
                    alt={site.name}
                    className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="text-left flex-1">
                    <h3 className="text-lg font-bold text-[#f04e37]">
                      {site.name}
                    </h3>
                    <p className="text-sm text-gray-700">{site.subtitle}</p>
                    <p className="text-xs mt-1 text-gray-600 line-clamp-2">
                      {site.description}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex justify-center">
                  <button
                    onClick={() => toggleSelection(index)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
                      selected.includes(index)
                        ? "bg-green-500 text-white"
                        : "bg-white text-[#f04e37]"
                    }`}
                  >
                    {selected.includes(index) ? (
                      <>
                        <FaCheck /> Added
                      </>
                    ) : (
                      <>
                        <FaPlus /> Add
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Created Itineraries */}
          <div className="mt-10 text-left w-full">
            <h2 className="text-xl font-bold mb-3">Created Itineraries</h2>
            {itineraries.length === 0 ? (
              <p className="text-white opacity-80">
                No itineraries created yet.
              </p>
            ) : (
              itineraries.map((itinerary, idx) => (
                <div
                  key={idx}
                  className="bg-white text-black rounded-xl shadow-lg p-4 mb-4 cursor-pointer"
                  onClick={() => toggleExpand(idx)}
                >
                  <div className="flex justify-between items-center">
                    <p className="font-bold text-lg">{itinerary.name}</p>
                    {expandedIndex === idx ? (
                      <FaChevronUp />
                    ) : (
                      <FaChevronDown />
                    )}
                  </div>

                  {expandedIndex === idx && (
                    <div className="mt-3 space-y-2">
                      {itinerary.sites.map((item, siteIdx) => (
                        <div
                          key={siteIdx}
                          className="flex items-center gap-3 bg-gray-100 p-3 rounded-lg"
                        >
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-12 h-12 rounded object-cover"
                          />
                          <div>
                            <p className="font-semibold">{item.name}</p>
                            <p className="text-xs text-gray-600">
                              {item.subtitle}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          <button
            onClick={handleSave}
            className="bg-white text-[#f04e37] font-bold py-3 px-8 rounded-full mt-8"
          >
            Save
          </button>
        </div>
      </div>

      <p className="mt-10 text-xs text-center text-white opacity-70">
        ©2025 Intramuros Administration
      </p>
    </div>
  );
}
