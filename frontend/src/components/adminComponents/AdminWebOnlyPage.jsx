import React from 'react';
import { Monitor, Smartphone, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminWebOnlyPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="p-6 text-center" style={{ background: 'linear-gradient(to right, #f04e37, #d9442f)' }}>
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Monitor className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Admin Panel
            </h1>
            <p className="text-white/90 text-sm">
              Desktop Access Required
            </p>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Alert Message */}
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-amber-900 text-sm mb-1">
                    Mobile Access Not Supported
                  </h3>
                  <p className="text-amber-800 text-xs leading-relaxed">
                    The admin panel is optimized for desktop and web browsers only. 
                    Please access this page from a computer for the best experience.
                  </p>
                </div>
              </div>
            </div>

            {/* Device Comparison */}
            <div className="grid grid-cols-2 gap-4">
              {/* Mobile - Not Supported */}
              <div className="text-center p-4 bg-red-50 rounded-xl border border-red-200">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Smartphone className="w-6 h-6 text-red-600" />
                </div>
                <p className="text-xs font-semibold text-red-900 mb-1">Mobile</p>
                <p className="text-xs text-red-700">Not Supported</p>
              </div>

              {/* Desktop - Supported */}
              <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Monitor className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-xs font-semibold text-green-900 mb-1">Desktop</p>
                <p className="text-xs text-green-700">Fully Supported</p>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-orange-50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 text-sm mb-3">
                How to Access Admin Panel:
              </h3>
              <ol className="space-y-2 text-xs text-gray-800">
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 text-white rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: '#f04e37' }}>
                    1
                  </span>
                  <span>Open a desktop or laptop computer</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 text-white rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: '#f04e37' }}>
                    2
                  </span>
                  <span>Launch your web browser (Chrome, Firefox, Edge, Safari)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 text-white rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: '#f04e37' }}>
                    3
                  </span>
                  <span>Navigate to this URL and log in with your admin credentials</span>
                </li>
              </ol>
            </div>

            {/* Action Button */}
            <button
              onClick={() => navigate('/login')}
              className="w-full text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
              style={{ 
                background: 'linear-gradient(to right, #f04e37, #d9442f)',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'linear-gradient(to right, #d9442f, #c23d2a)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'linear-gradient(to right, #f04e37, #d9442f)'}
            >
              Back to Login
            </button>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
            <p className="text-xs text-gray-600 text-center">
              For tourist features, please use the mobile app
            </p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Need help? Contact your system administrator
          </p>
        </div>
      </div>
    </div>
  );
}
