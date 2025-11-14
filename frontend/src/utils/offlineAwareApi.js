import axios from 'axios';

/**
 * Offline-aware API utility for Guest and Tourist components
 * Automatically handles caching and offline scenarios
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';

/**
 * Create axios instance with offline detection
 */
export const createOfflineAwareApi = () => {
  const instance = axios.create({
    baseURL: BASE_URL,
  });

  // Add auth token if available
  instance.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  return instance;
};

/**
 * Fetch with offline fallback
 * Returns cached data if offline and cache exists
 */
export const fetchWithOfflineFallback = async (url, options = {}) => {
  const {
    onOffline = null,
    fallbackData = null,
    cacheKey = null,
  } = options;

  try {
    // Check if online
    if (!navigator.onLine) {
      console.warn(`Offline: Attempting to use cached data for ${url}`);
      
      // Try to get from localStorage cache
      if (cacheKey) {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          console.log(`Using cached data from ${new Date(timestamp).toLocaleString()}`);
          return { data, fromCache: true, offline: true };
        }
      }

      // Call offline callback if provided
      if (onOffline) {
        onOffline();
      }

      // Return fallback data if provided
      if (fallbackData) {
        return { data: fallbackData, fromCache: false, offline: true };
      }

      throw new Error('No internet connection and no cached data available');
    }

    // Online: Make the request
    const response = await axios.get(`${BASE_URL}${url}`);
    
    // Cache the response if cacheKey provided
    if (cacheKey && response.data) {
      localStorage.setItem(cacheKey, JSON.stringify({
        data: response.data,
        timestamp: Date.now(),
      }));
    }

    return { data: response.data, fromCache: false, offline: false };

  } catch (error) {
    // Network error - might be offline
    if (error.message === 'Network Error' || !navigator.onLine) {
      console.warn(`Network error: Attempting to use cached data for ${url}`);
      
      // Try cache
      if (cacheKey) {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          console.log(`Using cached data from ${new Date(timestamp).toLocaleString()}`);
          return { data, fromCache: true, offline: true };
        }
      }

      if (onOffline) {
        onOffline();
      }

      if (fallbackData) {
        return { data: fallbackData, fromCache: false, offline: true };
      }
    }

    throw error;
  }
};

/**
 * Hook for components to use offline-aware API
 */
export const useOfflineAwareData = (url, options = {}) => {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [isOffline, setIsOffline] = React.useState(!navigator.onLine);
  const [fromCache, setFromCache] = React.useState(false);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await fetchWithOfflineFallback(url, options);
        setData(result.data);
        setFromCache(result.fromCache);
        setIsOffline(result.offline);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url]);

  return { data, loading, error, isOffline, fromCache };
};

/**
 * Guest-specific API calls with caching
 */
export const guestApi = {
  // Fetch admin itineraries (cached for 7 days)
  getAdminItineraries: async () => {
    return fetchWithOfflineFallback('/api/itineraries/guest', {
      cacheKey: 'guest_admin_itineraries',
      fallbackData: [],
    });
  },

  // Fetch single itinerary (cached)
  getItinerary: async (id) => {
    return fetchWithOfflineFallback(`/api/itineraries/${id}`, {
      cacheKey: `guest_itinerary_${id}`,
      fallbackData: null,
    });
  },

  // Fetch all pins (cached for 7 days)
  getPins: async () => {
    return fetchWithOfflineFallback('/api/pins', {
      cacheKey: 'guest_pins',
      fallbackData: [],
    });
  },

  // Fetch single pin (cached)
  getPin: async (id) => {
    return fetchWithOfflineFallback(`/api/pins/${id}`, {
      cacheKey: `guest_pin_${id}`,
      fallbackData: null,
    });
  },

  // Fetch reviews (cached)
  getReviews: async (pinId) => {
    return fetchWithOfflineFallback(`/api/reviews/${pinId}`, {
      cacheKey: `guest_reviews_${pinId}`,
      fallbackData: [],
    });
  },
};

/**
 * Tourist-specific API calls (requires auth, less caching)
 */
export const touristApi = {
  // These require online access
  createItinerary: async (data) => {
    if (!navigator.onLine) {
      throw new Error('Creating itineraries requires an internet connection');
    }
    const api = createOfflineAwareApi();
    return api.post('/api/itineraries', data);
  },

  updateItinerary: async (id, data) => {
    if (!navigator.onLine) {
      throw new Error('Updating itineraries requires an internet connection');
    }
    const api = createOfflineAwareApi();
    return api.put(`/api/itineraries/${id}`, data);
  },

  deleteItinerary: async (id) => {
    if (!navigator.onLine) {
      throw new Error('Deleting itineraries requires an internet connection');
    }
    const api = createOfflineAwareApi();
    return api.delete(`/api/itineraries/${id}`);
  },

  getUserItineraries: async () => {
    return fetchWithOfflineFallback('/api/itineraries', {
      cacheKey: 'user_itineraries',
      fallbackData: [],
    });
  },
};

/**
 * Clear all cached data
 */
export const clearOfflineCache = () => {
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith('guest_') || key.startsWith('user_')) {
      localStorage.removeItem(key);
    }
  });
  console.log('Offline cache cleared');
};

/**
 * Get cache info
 */
export const getCacheInfo = () => {
  const keys = Object.keys(localStorage);
  const cacheKeys = keys.filter(key => key.startsWith('guest_') || key.startsWith('user_'));
  
  return cacheKeys.map(key => {
    const cached = localStorage.getItem(key);
    if (cached) {
      const { timestamp } = JSON.parse(cached);
      return {
        key,
        cachedAt: new Date(timestamp).toLocaleString(),
        age: Date.now() - timestamp,
      };
    }
    return null;
  }).filter(Boolean);
};

export default {
  createOfflineAwareApi,
  fetchWithOfflineFallback,
  guestApi,
  touristApi,
  clearOfflineCache,
  getCacheInfo,
};
