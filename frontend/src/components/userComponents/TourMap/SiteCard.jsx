import React, { Suspense, lazy, useState, useEffect } from "react";
import { Volume2, X, Star } from "lucide-react";
import ttsService from "../../../utils/textToSpeech";
import MediaCarousel from "../../shared/MediaCarousel";
import axios from "axios";

const ModelPreview = lazy(() => import("./SiteCardModelPreview"));

const SiteCard = ({ pin, onClose, distance }) => {
  const [showAR, setShowAR] = useState(false);
  const [siteReviews, setSiteReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  // Announce site when card opens
  useEffect(() => {
    if (pin) {
      const siteName = pin.title || "site";
      const distanceText = distance ? `. Distance: ${(distance / 1000).toFixed(2)} kilometers` : "";
      ttsService.speak(`Viewing ${siteName}${distanceText}`);
    }
  }, [pin?._id]);

  // Fetch reviews for this site
  useEffect(() => {
    const fetchReviews = async () => {
      if (!pin?._id) {
        setSiteReviews([]);
        setReviewsLoading(false);
        return;
      }
      
      try {
        setReviewsLoading(true);
        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/reviews/site/${pin._id}`
        );
        // Backend returns { reviews, averageRating, totalReviews }
        const reviews = Array.isArray(response.data.reviews) ? response.data.reviews : [];
        setSiteReviews(reviews);
      } catch (error) {
        console.error('Error fetching reviews:', error);
        setSiteReviews([]);
      } finally {
        setReviewsLoading(false);
      }
    };

    fetchReviews();
  }, [pin?._id]);

  return (
    <div 
      className="absolute inset-0 z-50 bg-white overflow-y-auto"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* Header with Close Button */}
      <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between shadow-sm z-10">
        <h2 className="text-xl font-bold text-gray-800">Site Information</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 pb-20">

        {/* AR Mode fullscreen inside modal */}
        {showAR ? (
          <div className="flex flex-col h-[70vh]">
            <iframe
              src={pin.arLink}
              title="AR Mode"
              className="flex-1 w-full rounded-lg border border-gray-200"
              allow="camera; gyroscope; accelerometer; fullscreen"
            />
            <button
              onClick={() => setShowAR(false)}
              className="mt-3 w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 text-base font-medium rounded-lg shadow transition-colors"
            >
              Exit AR Mode
            </button>
          </div>
        ) : (
          <>
            {/* 3D Model Preview */}
            {pin.glbUrl && pin.glbUrl.endsWith(".glb") && (
              <div className="mb-8 w-full h-64 md:h-80 border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-500">Loading 3D model...</p>
                    </div>
                  }
                >
                  <ModelPreview url={pin.glbUrl} />
                </Suspense>
              </div>
            )}

            {/* Title */}
            <h3 className="text-2xl font-bold text-gray-800 mb-6">
              {pin.title}
            </h3>

            {/* Media Files Carousel */}
            {pin.mediaFiles && pin.mediaFiles.length > 0 && (
              <div className="mb-8">
                <MediaCarousel mediaFiles={pin.mediaFiles} />
              </div>
            )}

            {/* Fallback to old mediaUrl if mediaFiles not available */}
            {(!pin.mediaFiles || pin.mediaFiles.length === 0) && pin.mediaUrl && (
              <div className="mb-8">
                {pin.mediaType === "video" ? (
                  <video
                    src={pin.mediaUrl}
                    className="w-full h-56 md:h-72 object-cover rounded-lg border border-gray-200"
                    muted
                    controls
                    crossOrigin="anonymous"
                  />
                ) : (
                  <img
                    src={pin.mediaUrl}
                    alt={pin.title}
                    className="w-full h-56 md:h-72 object-cover rounded-lg border border-gray-200"
                  />
                )}
              </div>
            )}

            {/* Read Description Button */}
            <button
              onClick={() => {
                const description = pin.description || "No description available";
                ttsService.enable(); // Enable TTS
                ttsService.speak(`${pin.title}. ${description}`, { rate: 0.9 });
              }}
              className="mb-6 w-full bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              aria-label="Read site description aloud"
            >
              <Volume2 className="w-4 h-4" />
              Read Description Aloud
            </button>

            {/* Description */}
            <div className="text-base leading-relaxed text-gray-700 mb-8 space-y-3">
              {pin.description?.split('\n\n').map((paragraph, index) => (
                <p key={index}>{paragraph.trim()}</p>
              ))}
            </div>

            {/* AR Mode Button */}
            {pin.arEnabled && pin.arLink && (
              <button
                onClick={() => {
                  setShowAR(true);
                  ttsService.speak("Opening AR Mode");
                }}
                className="w-full text-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 text-base font-semibold rounded-lg shadow-md mb-8 transition-colors"
                aria-label="View in AR Mode"
              >
                🔍 View in AR Mode
              </button>
            )}
<<<<<<< Updated upstream

            {/* User Reviews Section */}
            <div className="mb-6 bg-gray-50 rounded-lg border border-gray-200 p-4">
              <h4 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                User Reviews
              </h4>
              
              {reviewsLoading ? (
                <p className="text-sm text-gray-500">Loading reviews...</p>
              ) : !Array.isArray(siteReviews) || siteReviews.length === 0 ? (
                <p className="text-sm text-gray-500">No reviews yet. Be the first to review!</p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {siteReviews.map((review, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm text-gray-800">
                          {review.userId?.firstName && review.userId?.lastName
                            ? `${review.userId.firstName} ${review.userId.lastName}`
                            : review.userId?.firstName || review.userId?.lastName || "Anonymous"}
                        </span>
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      {review.reviewText && (
                        <p className="text-xs text-gray-600 mt-1">{review.reviewText}</p>
                      )}
                      {review.photos && review.photos.length > 0 && (
                        <div className="flex gap-2 mt-2 overflow-x-auto">
                          {review.photos.map((photo, photoIdx) => (
                            <img
                              key={photoIdx}
                              src={photo.startsWith('http') ? photo : `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000'}${photo}`}
                              alt={`Review ${photoIdx + 1}`}
                              className="w-16 h-16 object-cover rounded border border-gray-200"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

=======
>>>>>>> Stashed changes
          </>
        )}
      </div>
    </div>
  );
};

export default SiteCard;
