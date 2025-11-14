import React from 'react';
import { WifiOff, Wifi, LogIn, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/**
 * Modal that appears when user tries to use a feature requiring internet
 * Offers option to login for full features or continue in guest mode
 */
const OnlineRequiredModal = ({ isOpen, onClose, message, showLoginOption = true }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-close when connection is restored
  React.useEffect(() => {
    if (isOnline && isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, isOpen, onClose]);

  if (!isOpen) return null;

  const handleLogin = () => {
    onClose();
    navigate('/login');
  };

  const handleContinueGuest = () => {
    onClose();
  };

  // If online, show as floating notification instead of full modal
  if (isOnline) {
    return (
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[10000] animate-slide-down">
        <div className="bg-green-500 text-white rounded-lg shadow-2xl px-6 py-4 flex items-center gap-3 max-w-md">
          <Wifi className="w-6 h-6" />
          <div>
            <h2 className="text-lg font-bold">Connection Restored!</h2>
            <p className="text-sm text-white/90">You are back online</p>
          </div>
          <button
            onClick={onClose}
            className="ml-2 text-white hover:bg-white/20 rounded-full p-1 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-slideUp">
        {/* Header */}
        <div className="p-6 bg-red-500 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full p-1 transition"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <WifiOff className="w-8 h-8" />
            <div>
              <h2 className="text-xl font-bold">
                No Internet Connection
              </h2>
              <p className="text-sm text-white/90">
                Please check your connection
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 font-medium mb-2">
                  {message || 'This feature requires an internet connection'}
                </p>
                <p className="text-red-700 text-sm">
                  Please connect to WiFi or mobile data to continue.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 font-medium mb-2">Available Offline:</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>✓ Browse tour sites</li>
                  <li>✓ View cached images</li>
                  <li>✓ Read reviews</li>
                  <li>✓ View admin itineraries</li>
                  <li>✓ Navigate with cached maps</li>
                </ul>
              </div>

              <button
                onClick={onClose}
                className="w-full bg-gray-200 text-gray-800 font-semibold py-3 px-4 rounded-lg hover:bg-gray-300 transition"
              >
                Continue Browsing Offline
              </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnlineRequiredModal;
