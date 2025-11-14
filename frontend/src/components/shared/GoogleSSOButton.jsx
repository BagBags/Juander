import React, { useState, useRef, useEffect } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import './GoogleSSOButton.css';

export default function GoogleSSOButton({
  onSuccess,
  onError,
  text = 'signin_with',
  className = '',
  disabled = false,
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const googleButtonRef = useRef(null);
  const containerRef = useRef(null);

  // Detect PWA mode
  const isPWA = typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone ||
    document.referrer.includes('android-app://')
  );

  useEffect(() => {
    // Ensure Google button is properly initialized
    const timer = setTimeout(() => {
      setIsInitialized(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const handleSuccess = (credentialResponse) => {
    setIsLoading(false);
    onSuccess(credentialResponse);
  };

  const handleError = () => {
    setIsLoading(false);
    onError();
  };

  const handleCustomClick = () => {
    if (disabled || isLoading) return;
    
    setIsLoading(true);
    
    // Trigger the hidden Google button
    const googleButton = googleButtonRef.current?.querySelector('div[role="button"]');
    if (googleButton) {
      googleButton.click();
    } else {
      // Fallback: try to find any clickable element in the Google button
      const clickableElement = googleButtonRef.current?.querySelector('[tabindex="0"]') || 
                              googleButtonRef.current?.querySelector('button') ||
                              googleButtonRef.current?.querySelector('div');
      if (clickableElement) {
        clickableElement.click();
      } else {
        setIsLoading(false);
        onError();
      }
    }
  };

  const buttonHeight = isPWA ? 'h-[42px]' : 'h-[44px] sm:h-[48px]';
  const textSize = isPWA ? 'text-sm' : 'text-sm sm:text-base';

  return (
    <div className={`google-sso-container relative w-full ${className}`} ref={containerRef}>
      {/* Fixed-size container to prevent shrinking */}
      <div 
        className={`google-sso-button w-full ${buttonHeight} relative overflow-hidden rounded-lg border border-gray-300 hover:border-gray-400 transition-all duration-200 shadow-sm hover:shadow-md`}
        style={{ 
          minHeight: isPWA ? '42px' : '44px',
          maxHeight: isPWA ? '42px' : '48px'
        }}
      >
        {/* Loading overlay */}
        {isLoading && (
          <div className="google-sso-loading absolute inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center z-20 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-[#4285f4] rounded-full animate-spin"></div>
              <span className={`${textSize} text-gray-600 font-medium`}>
                {isPWA ? 'Loading...' : 'Connecting...'}
              </span>
            </div>
          </div>
        )}

        {/* Custom Google button overlay for consistent styling */}
        <div 
          className={`absolute inset-0 flex items-center justify-center bg-white hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer rounded-lg ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          } ${isLoading ? 'pointer-events-none' : ''}`}
          onClick={handleCustomClick}
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label={`${text === 'signin_with' ? 'Sign in' : text === 'signup_with' ? 'Sign up' : 'Continue'} with Google`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleCustomClick();
            }
          }}
        >
          <div className={`flex items-center gap-3 px-4 ${isPWA ? 'px-3' : 'px-4'}`}>
            {/* Google Logo */}
            <svg 
              width={isPWA ? "16" : "18"} 
              height={isPWA ? "16" : "18"} 
              viewBox="0 0 18 18" 
              className="flex-shrink-0"
              aria-hidden="true"
            >
              <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
              <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.04a4.8 4.8 0 0 1-2.7.75 4.8 4.8 0 0 1-4.52-3.36H1.83v2.07A8 8 0 0 0 8.98 17z"/>
              <path fill="#FBBC05" d="M4.46 10.41a4.8 4.8 0 0 1 0-3.06V5.28H1.83a8 8 0 0 0 0 7.17l2.63-2.04z"/>
              <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 8.98 1 8 8 0 0 0 1.83 5.28L4.46 7.35A4.8 4.8 0 0 1 8.98 4.18z"/>
            </svg>
            
            {/* Text */}
            <span className={`${textSize} font-medium text-gray-700 select-none whitespace-nowrap`}>
              {text === 'signin_with' ? 'Sign in with Google' : 
               text === 'signup_with' ? 'Sign up with Google' : 
               text === 'continue_with' ? 'Continue with Google' : 
               'Sign in with Google'}
            </span>
          </div>
        </div>

        {/* Hidden actual GoogleLogin component - positioned off-screen but functional */}
        <div 
          ref={googleButtonRef}
          className="google-sso-hidden"
        >
          {isInitialized && (
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={handleError}
              theme="outline"
              size="large"
              shape="rectangular"
              width="100%"
              text={text}
              logo_alignment="left"
              useOneTap={false}
            />
          )}
        </div>
      </div>
    </div>
  );
}
