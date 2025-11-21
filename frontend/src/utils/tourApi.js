import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// Get auth token
const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Get tour status for the current user
 */
export const getTourStatus = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/tour/status`, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching tour status:", error);
    throw error;
  }
};

/**
 * Mark tour as completed
 */
export const completeTour = async () => {
  try {
    const response = await axios.patch(
      `${API_BASE_URL}/tour/complete`,
      {},
      {
        headers: getAuthHeader(),
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error completing tour:", error);
    throw error;
  }
};

/**
 * Reset tour (for replay)
 */
export const resetTour = async () => {
  try {
    const response = await axios.patch(
      `${API_BASE_URL}/tour/reset`,
      {},
      {
        headers: getAuthHeader(),
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error resetting tour:", error);
    throw error;
  }
};

// Create Itinerary tutorial APIs
export const getCreateItineraryTourStatus = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/tour/create-itinerary/status`, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching create itinerary tour status:", error);
    throw error;
  }
};

export const completeCreateItineraryTour = async () => {
  try {
    const response = await axios.patch(`${API_BASE_URL}/tour/create-itinerary/complete`, {}, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error("Error completing create itinerary tour:", error);
    throw error;
  }
};

export const resetCreateItineraryTour = async () => {
  try {
    const response = await axios.patch(`${API_BASE_URL}/tour/create-itinerary/reset`, {}, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error("Error resetting create itinerary tour:", error);
    throw error;
  }
};

export const getEmergencyTourStatus = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/tour/emergency/status`, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching emergency tour status:", error);
    throw error;
  }
};

export const completeEmergencyTour = async () => {
  try {
    const response = await axios.patch(`${API_BASE_URL}/tour/emergency/complete`, {}, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error("Error completing emergency tour:", error);
    throw error;
  }
};

export const resetEmergencyTour = async () => {
  try {
    const response = await axios.patch(`${API_BASE_URL}/tour/emergency/reset`, {}, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error("Error resetting emergency tour:", error);
    throw error;
  }
};

export const getProfileTourStatus = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/tour/profile/status`, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching profile tour status:", error);
    throw error;
  }
};

export const completeProfileTour = async () => {
  try {
    const response = await axios.patch(`${API_BASE_URL}/tour/profile/complete`, {}, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error("Error completing profile tour:", error);
    throw error;
  }
};

export const resetProfileTour = async () => {
  try {
    const response = await axios.patch(`${API_BASE_URL}/tour/profile/reset`, {}, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error("Error resetting profile tour:", error);
    throw error;
  }
};

export const getGuestProfileTourStatus = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/tour/guest-profile/status`, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching guest profile tour status:", error);
    throw error;
  }
};

export const completeGuestProfileTour = async () => {
  try {
    const response = await axios.patch(`${API_BASE_URL}/tour/guest-profile/complete`, {}, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error("Error completing guest profile tour:", error);
    throw error;
  }
};

export const resetGuestProfileTour = async () => {
  try {
    const response = await axios.patch(`${API_BASE_URL}/tour/guest-profile/reset`, {}, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error("Error resetting guest profile tour:", error);
    throw error;
  }
};

export const getTouristItineraryTourStatus = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/tour/tourist-itinerary/status`, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching tourist itinerary tour status:", error);
    throw error;
  }
};

export const completeTouristItineraryTour = async () => {
  try {
    const response = await axios.patch(`${API_BASE_URL}/tour/tourist-itinerary/complete`, {}, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error("Error completing tourist itinerary tour:", error);
    throw error;
  }
};

export const resetTouristItineraryTour = async () => {
  try {
    const response = await axios.patch(`${API_BASE_URL}/tour/tourist-itinerary/reset`, {}, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error("Error resetting tourist itinerary tour:", error);
    throw error;
  }
};

// Tour Map tutorial APIs
export const getTourMapTourStatus = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/tour/tour-map/status`, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching tour map tour status:", error);
    throw error;
  }
};

export const completeTourMapTour = async () => {
  try {
    const response = await axios.patch(`${API_BASE_URL}/tour/tour-map/complete`, {}, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error("Error completing tour map tour:", error);
    throw error;
  }
};

export const resetTourMapTour = async () => {
  try {
    const response = await axios.patch(`${API_BASE_URL}/tour/tour-map/reset`, {}, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error("Error resetting tour map tour:", error);
    throw error;
  }
};

// Photobooth tutorial APIs
export const getPhotoboothTourStatus = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/tour/photobooth/status`, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching photobooth tour status:", error);
    throw error;
  }
};

export const completePhotoboothTour = async () => {
  try {
    const response = await axios.patch(`${API_BASE_URL}/tour/photobooth/complete`, {}, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error("Error completing photobooth tour:", error);
    throw error;
  }
};

export const resetPhotoboothTour = async () => {
  try {
    const response = await axios.patch(`${API_BASE_URL}/tour/photobooth/reset`, {}, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error("Error resetting photobooth tour:", error);
    throw error;
  }
};

export const getTripArchiveTourStatus = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/tour/trip-archive/status`, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching trip archive tour status:", error);
    throw error;
  }
};

export const completeTripArchiveTour = async () => {
  try {
    const response = await axios.patch(`${API_BASE_URL}/tour/trip-archive/complete`, {}, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error("Error completing trip archive tour:", error);
    throw error;
  }
};

export const resetTripArchiveTour = async () => {
  try {
    const response = await axios.patch(`${API_BASE_URL}/tour/trip-archive/reset`, {}, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error("Error resetting trip archive tour:", error);
    throw error;
  }
};