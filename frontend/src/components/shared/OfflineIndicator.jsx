import React, { useState, useEffect } from 'react';
import { Wifi } from 'lucide-react';

const OfflineIndicator = () => {
  const [showOnlineNotification, setShowOnlineNotification] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setShowOnlineNotification(true);
      setTimeout(() => setShowOnlineNotification(false), 3000);
    };

    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (!showOnlineNotification) return null;

  return (
    <div
      className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[10000] px-4 py-3 rounded-lg shadow-lg flex items-center justify-center gap-3 bg-green-500 text-white transition-all duration-300"
      style={{
        animation: 'slideDown 0.3s ease-out',
      }}
    >
      <Wifi className="w-5 h-5" />
      <span className="font-medium">Back online!</span>
    </div>
  );
};

export default OfflineIndicator;
