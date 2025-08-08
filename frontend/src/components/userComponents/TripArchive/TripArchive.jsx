import React from "react";
import SideButtons from "../sideButtons";
import { FaStar } from "react-icons/fa";
import BackHeader from "../BackButton"; // ✅ import BackHeader

export default function TripArchivesPage() {
  const archives = [
    {
      name: "San Ignacio Church",
      subtitle: "Museo de Intramuros",
      description:
        "Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra, est eros bibendum elit.",
      image:
        "https://images.unsplash.com/photo-1605379399642-870262d3d051?w=400&q=80",
    },
    {
      name: "San Nicolas de Tolentino",
      subtitle: "Home of the original image of the Black Nazarene",
      description:
        "Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra, est eros bibendum elit.",
      image:
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&q=80",
    },
  ];

  const reviews = [
    {
      date: "06/05/25",
      rating: 5,
      text: "Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra, est eros bibendum elit.",
      image:
        "https://images.unsplash.com/photo-1549640376-1957636d1ab0?w=400&q=80",
      place: "San Ignacio Church",
    },
    {
      date: "07/14/25",
      rating: 4,
      text: "Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra, est eros bibendum elit.",
      image:
        "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&q=80",
      place: "San Nicolas de Tolentino",
    },
    {
      date: "08/10/26",
      rating: 3,
      text: "Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra, est eros bibendum elit.",
      image:
        "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=400&q=80",
      place: "Fort Santiago",
    },
  ];

  const renderStars = (rating) =>
    Array.from({ length: 5 }, (_, i) => (
      <FaStar
        key={i}
        className={i < rating ? "text-yellow-400" : "text-gray-300"}
      />
    ));

  return (
    <div className="min-h-screen bg-[#f04e37] flex flex-col items-center text-sm relative px-4 md:px-0 text-white">
      <div className="w-full max-w-xl">
        {/* ✅ Sticky back header (matching profile layout) */}
        <div className="pt-4 z-10 sticky top-0 bg-[#f04e37]">
          <BackHeader title="Trip Archives" />
        </div>

        {/* Page content */}
        <div className="mt-4 text-center">
          {/* Trip Archives */}
          <h2 className="text-3xl font-bold mb-6">Trip Archives</h2>
          <div className="flex flex-col items-center gap-6">
            {archives.map((place, index) => (
              <div
                key={index}
                className="bg-[#f4cc27] text-black rounded-2xl shadow-md flex gap-4 p-4 items-center w-full"
              >
                <img
                  src={place.image}
                  alt={place.name}
                  className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                />
                <div className="text-left">
                  <h3 className="text-lg font-bold text-[#f04e37]">
                    {place.name}
                  </h3>
                  <p className="text-sm text-gray-700">{place.subtitle}</p>
                  <p className="text-xs mt-1 text-gray-600 line-clamp-2">
                    {place.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Manage Reviews */}
          <h2 className="text-3xl font-bold mt-10 mb-6">Manage Reviews</h2>
          <div className="flex flex-col items-center gap-6">
            {reviews.map((review, index) => (
              <div
                key={index}
                className="bg-white text-black rounded-2xl shadow-md p-4 flex gap-4 items-start w-full"
              >
                <img
                  src={review.image}
                  alt={review.place}
                  className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                />
                <div className="flex-1 text-left">
                  <h3 className="font-bold text-[#f04e37]">
                    Trip last {review.date}
                  </h3>
                  <div className="flex items-center gap-1 mb-1">
                    {renderStars(review.rating)}
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-3">
                    {review.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-10 text-xs text-center text-white opacity-70">
        ©2025 Intramuros Administration
      </p>
    </div>
  );
}
