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