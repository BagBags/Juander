import axios from 'axios';

/**
 * Wrapper for API calls that handles offline scenarios
 * Automatically detects network errors and provides user-friendly messages
 */
export const apiWithOfflineHandler = async (apiCall, options = {}) => {
  const {
    requiresAuth = false,
    offlineMessage = 'This action requires an internet connection',
    onOffline = null,
    onError = null,
  } = options;

  try {
    // Check if online
    if (!navigator.onLine) {
      const error = new Error(offlineMessage);
      error.isOffline = true;
      throw error;
    }

    // Execute the API call
    const response = await apiCall();
    return {
      success: true,
      data: response.data || response,
    };

  } catch (error) {
    // Handle network errors
    if (!navigator.onLine || error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
      const offlineError = {
        success: false,
        offline: true,
        message: offlineMessage,
        error: error,
      };

      if (onOffline) {
        onOffline(offlineError);
      }

      return offlineError;
    }

    // Handle authentication errors
    if (error.response?.status === 401 && requiresAuth) {
      const authError = {
        success: false,
        unauthorized: true,
        message: 'Please login to access this feature',
        error: error,
      };

      if (onError) {
        onError(authError);
      }

      return authError;
    }

    // Handle other errors
    const generalError = {
      success: false,
      message: error.response?.data?.message || error.message || 'An error occurred',
      error: error,
    };

    if (onError) {
      onError(generalError);
    }

    return generalError;
  }
};

/**
 * Create an axios instance with offline handling interceptors
 */
export const createOfflineAwareAxios = () => {
  const instance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000',
  });

  // Request interceptor - check online status before request
  instance.interceptors.request.use(
    (config) => {
      if (!navigator.onLine) {
        return Promise.reject({
          message: 'No internet connection',
          isOffline: true,
          config,
        });
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor - handle network errors
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (!navigator.onLine || error.message === 'Network Error') {
        error.isOffline = true;
        error.userMessage = 'Internet connection required for this action';
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

/**
 * Helper to wrap async functions with try-catch and offline detection
 */
export const withOfflineDetection = (fn, errorMessage) => {
  return async (...args) => {
    try {
      if (!navigator.onLine) {
        throw new Error(errorMessage || 'Internet connection required');
      }
      return await fn(...args);
    } catch (error) {
      if (!navigator.onLine || error.message === 'Network Error') {
        throw new Error(errorMessage || 'Internet connection required');
      }
      throw error;
    }
  };
};

export default apiWithOfflineHandler;
