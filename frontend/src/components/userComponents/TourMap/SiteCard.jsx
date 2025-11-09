import React, { Suspense, useState, useEffect, lazy } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Center, Bounds } from "@react-three/drei";
import { X, MapPin, Clock, DollarSign, Glasses, ChevronDown, ChevronUp, Tag, Info, Volume2, Star } from "lucide-react";
import ttsService from "../../../utils/textToSpeech";
import { useTranslation } from "react-i18next";
import { FaStar } from "react-icons/fa";
import QRScanner from "../QRScannerSimple";
import axios from "axios";
import MediaCarousel from "../../shared/MediaCarousel";

const ModelPreview = lazy(() => import("./SiteCardModelPreview"));

const SiteCard = ({ pin, onClose, distance }) => {
  const [showAR, setShowAR] = useState(false);
  const [scannedArUrl, setScannedArUrl] = useState(null);
  const [siteReviews, setSiteReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [userLanguage, setUserLanguage] = useState('english');
  const [showFeeModal, setShowFeeModal] = useState(false);

  // Fetch user language preference
  useEffect(() => {
    const fetchUserLanguage = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await axios.get(
            `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/auth/user`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const language = response.data.language || 'english';
          setUserLanguage(language.toLowerCase());
        }
      } catch (error) {
        console.error('Failed to fetch user language:', error);
        setUserLanguage('english');
      }
    };
    fetchUserLanguage();
  }, []);

  // Announce site when card opens
  useEffect(() => {
    if (pin) {
      const siteName = pin.title || "site";
      ttsService.speak(`${siteName}`);
    }
    
    // Cleanup: stop TTS when component unmounts (modal closes)
    return () => {
      ttsService.cancel();
    };
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
      className="absolute inset-0 z-[10000] bg-gradient-to-b from-gray-50 to-white overflow-y-auto"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* Modern Header with Close Button */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-gray-200 px-5 py-4 flex items-center justify-between shadow-sm z-10">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Site Information</h2>
          <p className="text-xs text-gray-500 mt-0.5">Explore the details</p>
        </div>
        <button
          onClick={() => {
            ttsService.cancel(); // Stop any ongoing speech
            onClose();
          }}
          className="p-2.5 hover:bg-gray-100 rounded-full transition-all duration-200 hover:scale-110 active:scale-95"
          aria-label="Close site information"
        >
          <X className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      {/* Content */}
      <div className="px-5 py-6 pb-20 max-w-3xl mx-auto">

        {/* AR Mode fullscreen inside modal */}
        {showAR ? (
          <div className="h-[70vh] rounded-xl overflow-hidden">
            {scannedArUrl ? (
              <div className="flex flex-col h-full">
                <iframe
                  src={scannedArUrl}
                  title="AR Experience"
                  className="flex-1 w-full"
                  allow="camera *; gyroscope *; accelerometer *; magnetometer *; xr-spatial-tracking *; fullscreen *"
                  allowFullScreen
                />
                <button
                  onClick={() => {
                    setShowAR(false);
                    setScannedArUrl(null);
                  }}
                  className="mt-3 w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 text-base font-medium rounded-lg shadow transition-colors"
                >
                  Exit AR Experience
                </button>
              </div>
            ) : (
              <QRScanner
                onScanSuccess={(url) => {
                  setScannedArUrl(url);
                  ttsService.speak("QR Code scanned successfully");
                }}
                onClose={() => {
                  setShowAR(false);
                  setScannedArUrl(null);
                }}
              />
            )}
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
            <div className="mb-6">
              <div className="flex items-start justify-between gap-3 mb-3">
                <h3 className="text-3xl font-bold text-gray-900 leading-tight flex-1">
                  {pin.title}
                </h3>
              </div>
              
              {/* Badges Container */}
              <div className="flex flex-wrap gap-2">
                {/* Category Badge */}
                {pin.category && (
                  <div
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm"
                    style={{
                      backgroundColor: '#fef2f0',
                      color: '#f04e37'
                    }}
                  >
                    <Tag className="w-3.5 h-3.5" />
                    <span>{pin.category.name || pin.category}</span>
                  </div>
                )}
                
                {/* Entrance Fee Badge */}
                {pin.feeType && pin.feeType !== "none" && (
                  <button
                    onClick={() => setShowFeeModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm"
                    style={{
                      backgroundColor: pin.feeType === "fort_santiago" ? "#FEF3C7" : "#DBEAFE",
                      color: pin.feeType === "fort_santiago" ? "#92400E" : "#1E40AF"
                    }}
                  >
                    <span className="font-bold">₱</span>
                    <span>{pin.feeType === "fort_santiago" ? "Fort Santiago Fee" : "Entrance Fee"}</span>
                    <Info className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
            
            {/* Fee Hint Modal */}
            {showFeeModal && (
              <div 
                className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm"
                onClick={() => setShowFeeModal(false)}
              >
                <div 
                  className="bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div 
                    className="p-4 flex items-center gap-3"
                    style={{ backgroundColor: pin.feeType === "fort_santiago" ? "#f04e37" : "#2563EB" }}
                  >
                    <span className="text-white text-2xl font-bold">₱</span>
                    <h3 className="text-lg font-bold text-white">
                      {pin.feeType === "fort_santiago" ? "Fort Santiago Entrance" : "Entrance Fee Required"}
                    </h3>
                  </div>
                  
                  <div className="p-5">
                    {pin.feeType === "fort_santiago" ? (
                      <>
                        <p className="text-gray-700 text-sm mb-3">
                          This site is located within Fort Santiago and requires an entrance fee.
                        </p>
                        {pin.feeAmount ? (
                          <div className="bg-orange-50 p-3 rounded-lg border border-orange-200 mb-3">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-sm font-semibold text-gray-800">
                                Fort Santiago Entrance Fee:
                              </p>
                              <span className="text-[#f04e37] font-bold text-lg">₱{pin.feeAmount}</span>
                            </div>
                            {pin.feeAmountDiscounted && (
                              <div className="flex items-center justify-between bg-white/50 p-2 rounded-md mb-2">
                                <p className="text-xs font-medium text-gray-700">
                                  Student/PWD/Senior Citizen:
                                </p>
                                <span className="text-green-600 font-bold text-base">₱{pin.feeAmountDiscounted}</span>
                              </div>
                            )}
                            <div className="bg-white/60 p-2 rounded-md mt-2">
                              <p className="text-xs text-gray-700 font-medium">
                                Payment will be upon entrance at the gate. This will give you access to all sites within Fort Santiago.
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-orange-50 p-3 rounded-lg border border-orange-200 mb-3">
                            <p className="text-sm text-gray-700 mb-2">
                              Please check the current entrance fee at the Fort Santiago entrance.
                            </p>
                            <p className="text-xs text-gray-600">
                              Payment at the gate will give you access to all sites within Fort Santiago.
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="text-gray-700 text-sm mb-3">
                          An entrance fee is required to visit <span className="font-semibold">{pin.title}</span>.
                        </p>
                        {pin.feeAmount ? (
                          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 mb-3">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-sm font-semibold text-gray-800">
                                Entrance Fee:
                              </p>
                              <span className="text-blue-700 font-bold text-lg">₱{pin.feeAmount}</span>
                            </div>
                            {pin.feeAmountDiscounted && (
                              <div className="flex items-center justify-between bg-white/50 p-2 rounded-md mb-2">
                                <p className="text-xs font-medium text-gray-700">
                                  Student/PWD/Senior Citizen:
                                </p>
                                <span className="text-green-600 font-bold text-base">₱{pin.feeAmountDiscounted}</span>
                              </div>
                            )}
                            <p className="text-xs text-gray-600 mt-1">
                              Please have the fee ready when visiting this site.
                            </p>
                          </div>
                        ) : (
                          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 mb-3">
                            <p className="text-sm text-gray-700">
                              Please check on-site for current entrance fee rates.
                            </p>
                          </div>
                        )}
                      </>
                    )}
                    
                    <button
                      onClick={() => setShowFeeModal(false)}
                      className="w-full py-2.5 rounded-lg font-semibold text-sm transition-colors"
                      style={{
                        backgroundColor: pin.feeType === "fort_santiago" ? "#f04e37" : "#2563EB",
                        color: "white"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = "0.9";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = "1";
                      }}
                    >
                      Got it
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Media Files Carousel - Modern Design */}
            {pin.mediaFiles && pin.mediaFiles.length > 0 && (
              <div className="mb-10">
                <div className="rounded-xl overflow-hidden shadow-lg">
                  <MediaCarousel mediaFiles={pin.mediaFiles} />
                </div>
              </div>
            )}

            {/* Fallback to old mediaUrl if mediaFiles not available */}
            {(!pin.mediaFiles || pin.mediaFiles.length === 0) && pin.mediaUrl && (
              <div className="mb-10">
                {pin.mediaType === "video" ? (
                  <video
                    src={pin.mediaUrl}
                    className="w-full h-64 md:h-80 object-cover rounded-xl shadow-lg"
                    muted
                    controls
                    crossOrigin="anonymous"
                  >
                    <track kind="captions" />
                  </video>
                ) : (
                  <img
                    src={pin.mediaUrl}
                    alt={pin.title}
                    className="w-full h-64 md:h-80 object-cover rounded-xl shadow-lg"
                  />
                )}
              </div>
            )}

            {/* Read Description Button - Modern Design */}
            <button
              onClick={() => {
                const description = pin.description || "No description available";
                ttsService.enable(); // Enable TTS
                ttsService.speak(`${pin.title}. ${description}`, { rate: 0.9 });
              }}
              className="mb-6 w-full text-white px-5 py-3.5 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg active:scale-98"
              style={{ backgroundColor: '#f04e37' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#d9442f'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f04e37'}
              aria-label="Read site description aloud"
            >
              <Volume2 className="w-5 h-5" />
              <span>Listen to Description</span>
            </button>

            {/* Description - Enhanced Typography with Language Support */}
            <div className="bg-white rounded-xl p-5 mb-8 border border-gray-200 shadow-sm">
              <div className="prose prose-sm max-w-none">
                <div className="text-base leading-relaxed text-gray-700 space-y-4">
                  {(() => {
                    let description = '';
                    if (userLanguage === 'tagalog' && pin.siteDescriptionTagalog) {
                      description = pin.siteDescriptionTagalog;
                    } else if (userLanguage === 'english' && pin.siteDescription) {
                      description = pin.siteDescription;
                    } else {
                      description = pin.description || pin.siteDescription || pin.siteDescriptionTagalog || 'No description available';
                    }
                    
                    return description.split('\n\n').map((paragraph, index) => {
                      if (index === 0 || showFullDescription) {
                        return <p key={index} className="text-gray-800">{paragraph.trim()}</p>;
                      }
                      return null;
                    });
                  })()}
                </div>
                
                {/* Read More/Less Button */}
                {(() => {
                  let description = '';
                  if (userLanguage === 'tagalog' && pin.siteDescriptionTagalog) {
                    description = pin.siteDescriptionTagalog;
                  } else if (userLanguage === 'english' && pin.siteDescription) {
                    description = pin.siteDescription;
                  } else {
                    description = pin.description || pin.siteDescription || pin.siteDescriptionTagalog || '';
                  }
                  return description.split('\n\n').length > 1;
                })() && (
                  <button
                    onClick={() => setShowFullDescription(!showFullDescription)}
                    className="mt-4 font-semibold text-sm flex items-center gap-1 transition-colors"
                    style={{ color: '#f04e37' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#d9442f'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#f04e37'}
                  >
                    {showFullDescription ? (
                      <>
                        <span>Show Less</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </>
                    ) : (
                      <>
                        <span>Read More</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* AR Mode Button - Modern Design */}
            {pin.arEnabled && (
              <button
                onClick={() => {
                  setShowAR(true);
                  ttsService.speak("Opening AR Scanner");
                }}
                className="w-full text-center text-white px-5 py-4 text-base font-bold rounded-xl shadow-lg hover:shadow-xl mb-8 transition-all duration-200 active:scale-98 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(to right, #f04e37, #d9442f)' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'linear-gradient(to right, #d9442f, #c23d2a)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'linear-gradient(to right, #f04e37, #d9442f)'}
                aria-label="Scan QR Code for AR"
              >
                <Glasses className="w-5 h-5" />
                <span>Scan QR Code for AR</span>
              </button>
            )}

            {/* User Reviews Section - Modern Compact Design */}
            <div className="mb-8">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Reviews Header */}
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <div className="bg-yellow-400 p-1.5 rounded-lg">
                        <Star className="w-4 h-4 text-white fill-white" />
                      </div>
                      <span>Reviews</span>
                    </h4>
                    {!reviewsLoading && Array.isArray(siteReviews) && siteReviews.length > 0 && (
                      <span className="text-sm font-semibold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">
                        {siteReviews.length}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Reviews Content */}
                <div className="p-4">
                  {reviewsLoading ? (
                    <div className="flex items-center justify-center py-6">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: '#f04e37' }}></div>
                      <p className="text-sm text-gray-500 ml-3">Loading reviews...</p>
                    </div>
                  ) : !Array.isArray(siteReviews) || siteReviews.length === 0 ? (
                    <div className="text-center py-6">
                      <div className="bg-gray-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Star className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-sm font-medium text-gray-700">No reviews yet</p>
                      <p className="text-xs text-gray-500 mt-1">Be the first to review!</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3">
                        {siteReviews.slice(0, showAllReviews ? siteReviews.length : 2).map((review, idx) => (
                          <div key={idx} className="bg-gray-50 p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200">
                            {/* Reviewer Info - Compact */}
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                                  style={{ background: 'linear-gradient(135deg, #f04e37 0%, #ff6b54 100%)' }}
                                >
                                  {(review.userId?.firstName?.[0] || review.userId?.lastName?.[0] || "A").toUpperCase()}
                                </div>
                                <div className="flex-1">
                                  <span className="font-semibold text-xs text-gray-900 block leading-tight">
                                    {review.userId?.firstName && review.userId?.lastName
                                      ? `${review.userId.firstName} ${review.userId.lastName}`
                                      : review.userId?.firstName || review.userId?.lastName || "Anonymous"}
                                  </span>
                                  <div className="flex gap-0.5 mt-0.5">
                                    {Array.from({ length: 5 }, (_, i) => (
                                      <Star
                                        key={i}
                                        className={`w-3 h-3 ${
                                          i < review.rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-300 text-gray-300"
                                        }`}
                                      />
                                    ))}
                                  </div>
                                </div>
                              </div>
                              {review.createdAt && (
                                <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                                  {new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                              )}
                            </div>
                            
                            {/* Review Text - Compact */}
                            {review.reviewText && (
                              <p className="text-xs text-gray-700 leading-relaxed mb-2">{review.reviewText}</p>
                            )}
                            
                            {/* Review Photos - Compact */}
                            {review.photos && review.photos.length > 0 && (
                              <div className="flex gap-1.5 overflow-x-auto pb-1">
                                {review.photos.map((photo, photoIdx) => (
                                  <img
                                    key={photoIdx}
                                    src={photo.startsWith('http') ? photo : `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000'}${photo}`}
                                    alt={`Review ${photoIdx + 1}`}
                                    className="w-16 h-16 object-cover rounded-md border border-gray-300 hover:border-[#f04e37] transition-colors cursor-pointer flex-shrink-0"
                                    onClick={() => window.open(photo.startsWith('http') ? photo : `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000'}${photo}`, '_blank')}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      {/* View More/Less Button */}
                      {siteReviews.length > 2 && (
                        <button
                          onClick={() => setShowAllReviews(!showAllReviews)}
                          className="mt-3 w-full py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-1.5"
                          style={{ 
                            backgroundColor: showAllReviews ? '#f5f5f5' : '#f04e37',
                            color: showAllReviews ? '#f04e37' : 'white'
                          }}
                          onMouseEnter={(e) => {
                            if (!showAllReviews) {
                              e.currentTarget.style.backgroundColor = '#d9442f';
                            } else {
                              e.currentTarget.style.backgroundColor = '#ebebeb';
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = showAllReviews ? '#f5f5f5' : '#f04e37';
                          }}
                        >
                          {showAllReviews ? (
                            <>
                              <span>Show Less</span>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                            </>
                          ) : (
                            <>
                              <span>View All {siteReviews.length} Reviews</span>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </>
                          )}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>


          </>
        )}
      </div>
    </div>
  );
};

export default SiteCard;
