import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

/**
 * Error Boundary specifically for catching lazy loading failures
 * Shows offline-friendly message when chunks fail to load
 */
class LazyLoadErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      isOffline: !navigator.onLine,
    };
  }

  static getDerivedStateFromError(error) {
    // Check if it's a chunk loading error
    const isChunkError = 
      error?.message?.includes('Failed to fetch dynamically imported module') ||
      error?.message?.includes('Loading chunk') ||
      error?.message?.includes('ChunkLoadError') ||
      error?.name === 'ChunkLoadError';

    return {
      hasError: true,
      error: error,
      isChunkError: isChunkError,
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Lazy load error:', error, errorInfo);
    
    // Check online status
    this.setState({ isOffline: !navigator.onLine });
  }

  componentDidMount() {
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  componentWillUnmount() {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
  }

  handleOnline = () => {
    this.setState({ isOffline: false });
  };

  handleOffline = () => {
    this.setState({ isOffline: true });
  };

  handleRetry = () => {
    // Clear error state and reload
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { isOffline, isChunkError } = this.state;

      return (
        <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
          <div className="max-w-md w-full mx-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              {/* Icon */}
              <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${
                isOffline ? 'bg-red-100' : 'bg-orange-100'
              }`}>
                {isOffline ? (
                  <WifiOff className="w-10 h-10 text-red-600" />
                ) : (
                  <RefreshCw className="w-10 h-10 text-orange-600" />
                )}
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                {isOffline ? 'No Internet Connection' : 'Failed to Load Page'}
              </h2>

              {/* Message */}
              <p className="text-gray-600 mb-6">
                {isOffline ? (
                  <>
                    This page requires an internet connection to load for the first time.
                    <br />
                    <span className="text-sm text-gray-500 mt-2 block">
                      Once loaded, you can view cached content offline.
                    </span>
                  </>
                ) : isChunkError ? (
                  <>
                    The page content couldn't be loaded. This might be due to a network issue.
                    <br />
                    <span className="text-sm text-gray-500 mt-2 block">
                      Please check your connection and try again.
                    </span>
                  </>
                ) : (
                  <>
                    Something went wrong while loading this page.
                    <br />
                    <span className="text-sm text-gray-500 mt-2 block">
                      {this.state.error?.message || 'Unknown error'}
                    </span>
                  </>
                )}
              </p>

              {/* Actions */}
              <div className="space-y-3">
                <button
                  onClick={this.handleRetry}
                  className="w-full bg-[#f04e37] text-white font-semibold py-3 px-6 rounded-lg hover:bg-[#d43e2a] transition flex items-center justify-center gap-2 shadow-md"
                >
                  <RefreshCw className="w-5 h-5" />
                  Retry
                </button>

                <button
                  onClick={() => window.history.back()}
                  className="w-full bg-gray-100 text-gray-700 font-semibold py-3 px-6 rounded-lg hover:bg-gray-200 transition"
                >
                  Go Back
                </button>
              </div>

              {/* Offline Tips */}
              {isOffline && (
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                  <p className="text-sm font-semibold text-blue-900 mb-2">
                    💡 Available Offline:
                  </p>
                  <ul className="text-xs text-blue-800 space-y-1">
                    <li>✓ Previously viewed pages</li>
                    <li>✓ Cached tour sites</li>
                    <li>✓ Downloaded images</li>
                    <li>✓ Guest itineraries</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default LazyLoadErrorBoundary;
