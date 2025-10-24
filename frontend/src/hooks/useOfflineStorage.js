import { useState, useEffect } from 'react';

/**
 * Custom hook for managing offline data storage
 * Automatically syncs data to IndexedDB for offline access
 */
export const useOfflineStorage = (key, initialValue = null) => {
  const [data, setData] = useState(initialValue);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        setData(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading offline data:', error);
    }
  }, [key]);

  // Save data to localStorage whenever it changes
  const saveData = (newData) => {
    try {
      setData(newData);
      localStorage.setItem(key, JSON.stringify(newData));
    } catch (error) {
      console.error('Error saving offline data:', error);
    }
  };

  return {
    data,
    saveData,
    isOnline,
    clearData: () => {
      localStorage.removeItem(key);
      setData(initialValue);
    },
  };
};

/**
 * Hook for caching API responses
 */
export const useCachedAPI = (apiCall, cacheKey, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFromCache, setIsFromCache] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Try to load from cache first
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          setData(JSON.parse(cached));
          setIsFromCache(true);
          setLoading(false);
        }

        // Try to fetch fresh data if online
        if (navigator.onLine) {
          const response = await apiCall();
          setData(response);
          setIsFromCache(false);
          localStorage.setItem(cacheKey, JSON.stringify(response));
        }
      } catch (err) {
        console.error('API call failed:', err);
        setError(err);
        
        // If fetch fails but we have cache, use it
        const cached = localStorage.getItem(cacheKey);
        if (cached && !data) {
          setData(JSON.parse(cached));
          setIsFromCache(true);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, dependencies);

  return { data, loading, error, isFromCache };
};

export default useOfflineStorage;
