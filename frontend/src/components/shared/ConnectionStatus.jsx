import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, X } from 'lucide-react';

/**
 * Standardized Connection Status Notification
 * Shows floating notifications for offline/online status
 * Consistent design across the entire application
 */
const ConnectionStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showNotification, setShowNotification] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowNotification(true);
      setIsDismissed(false);
      
      // Auto-hide online notification after 3 seconds
      setTimeout(() => {
        setShowNotification(false);
      }, 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowNotification(true);
      setIsDismissed(false);
      // Offline notification stays until dismissed or back online
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial status
    if (!navigator.onLine) {
      setIsOnline(false);
      setShowNotification(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    setShowNotification(false);
  };

  // Don't show if dismissed or not needed
  if (!showNotification || isDismissed) return null;

  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-[10000] 
        ${isOnline ? 'bg-green-500' : 'bg-red-600'} 
        text-white px-8 py-4 rounded-lg shadow-2xl 
        flex items-center gap-3 max-w-lg w-[90%] sm:w-auto
        animate-slide-down`}
      role="alert"
      aria-live="polite"
    >
      {isOnline ? (
        <Wifi className="w-5 h-5 flex-shrink-0" />
      ) : (
        <WifiOff className="w-5 h-5 flex-shrink-0" />
      )}
      
      <div className="flex-1">
        <p className="font-semibold text-sm">
          {isOnline ? 'Connection Restored!' : 'No Internet Connection'}
        </p>
        <p className="text-xs text-white/90">
          {isOnline 
            ? 'You are back online' 
            : 'Some features may be limited'}
        </p>
      </div>

      <button
        onClick={handleDismiss}
        className="ml-2 hover:bg-white/20 rounded-full p-1 transition-colors flex-shrink-0"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default ConnectionStatus;
