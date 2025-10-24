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

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-slideUp">
        {/* Header */}
        <div className={`p-6 ${isOnline ? 'bg-green-500' : 'bg-red-500'} text-white relative`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full p-1 transition"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            {isOnline ? (
              <Wifi className="w-8 h-8" />
            ) : (
              <WifiOff className="w-8 h-8" />
            )}
            <div>
              <h2 className="text-xl font-bold">
                {isOnline ? 'Connection Restored!' : 'No Internet Connection'}
              </h2>
              <p className="text-sm text-white/90">
                {isOnline ? 'You are back online' : 'Please check your connection'}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {isOnline ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 text-sm">
                  ✓ Internet connection detected! You can now access all features.
                </p>
              </div>

              {showLoginOption && (
                <div className="space-y-3">
                  <p className="text-gray-700 font-medium">
                    Would you like to login to access all features?
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleLogin}
                      className="flex items-center justify-center gap-2 bg-[#f04e37] text-white font-semibold py-3 px-4 rounded-lg hover:bg-[#d43e2a] transition shadow-md"
                    >
                      <LogIn className="w-4 h-4" />
                      Login
                    </button>
                    
                    <button
                      onClick={handleContinueGuest}
                      className="bg-gray-100 text-gray-700 font-semibold py-3 px-4 rounded-lg hover:bg-gray-200 transition"
                    >
                      Continue as Guest
                    </button>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                    <p className="text-xs text-blue-800">
                      <strong>Logged in users can:</strong>
                      <br />• Create personal itineraries
                      <br />• Save favorite sites
                      <br />• Post reviews
                      <br />• Access trip history
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
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
          )}
        </div>
      </div>
    </div>
  );
};

export default OnlineRequiredModal;
