import { useState, useEffect } from 'react';

/**
 * Hook to detect online/offline status and handle network-dependent actions
 */
export const useOnlineStatus = () => {
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

  /**
   * Execute an action that requires internet
   * Shows error if offline
   */
  const executeOnlineAction = async (action, errorMessage = 'This feature requires an internet connection') => {
    if (!isOnline) {
      throw new Error(errorMessage);
    }
    return await action();
  };

  /**
   * Check if online before executing action
   * Returns { success: boolean, error?: string, data?: any }
   */
  const tryOnlineAction = async (action, errorMessage) => {
    try {
      if (!isOnline) {
        return {
          success: false,
          error: errorMessage || 'Internet connection required',
          offline: true
        };
      }
      const result = await action();
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'An error occurred',
        offline: !isOnline
      };
    }
  };

  return {
    isOnline,
    executeOnlineAction,
    tryOnlineAction
  };
};

export default useOnlineStatus;
