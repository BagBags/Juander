import React, { useState, useEffect } from "react";
import axios from "axios";
import { Star, Trash2, Eye, Search, Filter, Calendar, MapPin, User } from "lucide-react";
import ConfirmModal from "../../shared/ConfirmModal";

export default function AdminReviewsMain() {
  const [reviews, setReviews] = useState([]);
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sites, setSites] = useState([]);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSite, setSelectedSite] = useState("");
  const [sortBy, setSortBy] = useState("latest"); // latest, oldest, highest, lowest
  
  // Modal states
  const [selectedReview, setSelectedReview] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: "warning",
    title: "",
    message: "",
    onConfirm: null,
    loading: false,
  });

  useEffect(() => {
    fetchReviews();
    fetchSites();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [reviews, searchTerm, selectedSite, sortBy]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/reviews/admin/all`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setReviews(res.data);
    } catch (err) {
      console.error("Error fetching reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSites = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/pins`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSites(res.data);
    } catch (err) {
      console.error("Error fetching sites:", err);
    }
  };

  const applyFilters = () => {
    let filtered = [...reviews];

    // Search filter (user name, review text, site name)
    if (searchTerm) {
      filtered = filtered.filter((review) => {
        const userName = `${review.userId?.firstName || ""} ${review.userId?.lastName || ""}`.toLowerCase();
        const reviewText = (review.reviewText || "").toLowerCase();
        const siteName = (review.siteId?.siteName || "").toLowerCase();
        const search = searchTerm.toLowerCase();
        
        return userName.includes(search) || reviewText.includes(search) || siteName.includes(search);
      });
    }

    // Site filter
    if (selectedSite) {
      filtered = filtered.filter((review) => review.siteId?._id === selectedSite);
    }

    // Sort
    switch (sortBy) {
      case "latest":
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case "oldest":
        filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case "highest":
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case "lowest":
        filtered.sort((a, b) => a.rating - b.rating);
        break;
      default:
        break;
    }

    setFilteredReviews(filtered);
  };

  const handleDeleteReview = (review) => {
    setConfirmModal({
      isOpen: true,
      type: "danger",
      title: "Delete Review",
      message: `Are you sure you want to delete this review by ${review.userId?.firstName || "Unknown"} ${review.userId?.lastName || "User"}?`,
      onConfirm: async () => {
        try {
          setConfirmModal((prev) => ({ ...prev, loading: true }));
          const token = localStorage.getItem("token");
          await axios.delete(
            `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/reviews/admin/${review._id}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          
          // Log the action
          try {
            await axios.post(
              `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/admin/logs`,
              {
                action: `Deleted review for ${review.siteId?.siteName || "Unknown Site"} by ${review.userId?.firstName || "Unknown"} ${review.userId?.lastName || "User"}`,
              },
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
          } catch (logErr) {
            console.error("Error logging action:", logErr);
          }
          
          setReviews((prev) => prev.filter((r) => r._id !== review._id));
          setConfirmModal({ isOpen: false, type: "warning", title: "", message: "", onConfirm: null, loading: false });
        } catch (err) {
          console.error("Error deleting review:", err);
          alert("Failed to delete review");
          setConfirmModal((prev) => ({ ...prev, loading: false }));
        }
      },
      loading: false,
    });
  };

  const handleViewDetails = (review) => {
    setSelectedReview(review);
    setShowDetailModal(true);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderStars = (rating) => {
    return (
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-300 text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header with Filters */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <h2 className="text-xl font-bold text-gray-800">All Reviews</h2>
          <div className="text-sm text-gray-600">
            Total: <span className="font-semibold text-[#f04e37]">{filteredReviews.length}</span> reviews
          </div>
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by user, site, or review text..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f04e37] focus:border-transparent"
            />
          </div>

          {/* Site Filter */}
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f04e37] focus:border-transparent appearance-none bg-white"
            >
              <option value="">All Sites</option>
              {sites.map((site) => (
                <option key={site._id} value={site._id}>
                  {site.siteName || site.title}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f04e37] focus:border-transparent appearance-none bg-white"
            >
              <option value="latest">Latest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Rating</option>
              <option value="lowest">Lowest Rating</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reviews Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f04e37]"></div>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="text-center py-12">
          <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No reviews found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">User</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Site</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Rating</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Review</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReviews.map((review) => (
                <tr key={review._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#f04e37] to-[#ff6b54] flex items-center justify-center text-white font-bold">
                        {(review.userId?.firstName?.[0] || "U").toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {review.userId?.firstName || "Unknown"} {review.userId?.lastName || "User"}
                        </div>
                        <div className="text-xs text-gray-500">{review.userId?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-medium text-gray-900">{review.siteId?.siteName || "Unknown Site"}</div>
                    {review.itineraryId?.name && (
                      <div className="text-xs text-gray-500">
                        Itinerary: {review.itineraryId.name}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4">{renderStars(review.rating)}</td>
                  <td className="px-4 py-4">
                    <div className="max-w-xs">
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {review.reviewText || <span className="text-gray-400 italic">No text</span>}
                      </p>
                      {review.photos && review.photos.length > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          {review.photos.length} photo{review.photos.length > 1 ? "s" : ""}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-gray-600">{formatDate(review.createdAt)}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleViewDetails(review)}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all duration-200 border border-blue-200 hover:border-blue-300"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View</span>
                      </button>
                      <button
                        onClick={() => handleDeleteReview(review)}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-all duration-200 border border-red-200 hover:border-red-300"
                        title="Delete Review"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedReview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowDetailModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-[#f04e37] to-[#ff6b54] px-6 py-4 rounded-t-2xl">
              <h3 className="text-xl font-bold text-white">Review Details</h3>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* User Info */}
              <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#f04e37] to-[#ff6b54] flex items-center justify-center text-white font-bold text-2xl">
                  {(selectedReview.userId?.firstName?.[0] || "U").toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-lg text-gray-900">
                    {selectedReview.userId?.firstName || "Unknown"} {selectedReview.userId?.lastName || "User"}
                  </div>
                  <div className="text-sm text-gray-600">{selectedReview.userId?.email}</div>
                </div>
              </div>

              {/* Site & Itinerary Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#f04e37]" />
                    Site
                  </div>
                  <div className="text-gray-900">{selectedReview.siteId?.siteName || "Unknown Site"}</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-700 mb-1">Itinerary</div>
                  <div className="text-gray-900">{selectedReview.itineraryId?.name || "N/A"}</div>
                </div>
              </div>

              {/* Rating */}
              <div>
                <div className="text-sm font-semibold text-gray-700 mb-2">Rating</div>
                <div className="flex items-center gap-2">
                  {renderStars(selectedReview.rating)}
                  <span className="text-lg font-bold text-gray-900">{selectedReview.rating}/5</span>
                </div>
              </div>

              {/* Review Text */}
              {selectedReview.reviewText && (
                <div>
                  <div className="text-sm font-semibold text-gray-700 mb-2">Review</div>
                  <div className="bg-gray-50 rounded-lg p-4 text-gray-800 leading-relaxed">
                    {selectedReview.reviewText}
                  </div>
                </div>
              )}

              {/* Photos */}
              {selectedReview.photos && selectedReview.photos.length > 0 && (
                <div>
                  <div className="text-sm font-semibold text-gray-700 mb-2">Photos</div>
                  <div className="grid grid-cols-3 gap-3">
                    {selectedReview.photos.map((photo, idx) => (
                      <img
                        key={idx}
                        src={photo.startsWith("http") ? photo : `${import.meta.env.VITE_API_BASE_URL?.replace("/api", "") || "http://localhost:5000"}${photo}`}
                        alt={`Review photo ${idx + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-gray-200 hover:scale-105 transition-transform cursor-pointer"
                        onClick={() => window.open(photo.startsWith("http") ? photo : `${import.meta.env.VITE_API_BASE_URL?.replace("/api", "") || "http://localhost:5000"}${photo}`, "_blank")}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Date */}
              <div className="flex items-center gap-2 text-sm text-gray-600 pt-4 border-t border-gray-200">
                <Calendar className="w-4 h-4" />
                <span>Submitted on {formatDate(selectedReview.createdAt)}</span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 rounded-b-2xl flex justify-end gap-3">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  handleDeleteReview(selectedReview);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        type={confirmModal.type}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ isOpen: false, type: "warning", title: "", message: "", onConfirm: null, loading: false })}
        loading={confirmModal.loading}
      />
    </div>
  );
}
