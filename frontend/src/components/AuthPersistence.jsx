import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getToken, getUser, clearAuth, extendTokenExpiry } from '../utils/authStorage';

/**
 * AuthPersistence Component
 * Handles authentication persistence across PWA sessions
 * Restores user session on app launch and extends token expiry on activity
 */
export default function AuthPersistence({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check and restore authentication on mount
    const token = getToken();
    const user = getUser();

    if (token && user) {
      console.log('✅ Session restored from storage');
      
      // Extend token expiry on app launch (user activity)
      extendTokenExpiry();
      
      // If user is on login/signup page but authenticated, redirect to home
      if (location.pathname === '/' || location.pathname === '/login') {
        if (user.role === 'admin') {
          navigate('/AdminHome');
        } else if (!user.profileCompleted) {
          navigate('/CompleteProfile');
        } else {
          navigate('/Homepage');
        }
      }
    } else {
      console.log('❌ No valid session found');
      
      // Only redirect to login if on protected routes
      const publicRoutes = ['/', '/login', '/signup', '/forgot-password'];
      if (!publicRoutes.includes(location.pathname)) {
        clearAuth();
        navigate('/');
      }
    }
  }, []);

  // Extend token expiry on user activity
  useEffect(() => {
    const handleUserActivity = () => {
      const token = getToken();
      if (token) {
        extendTokenExpiry();
      }
    };

    // Listen for user activity events
    window.addEventListener('click', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('scroll', handleUserActivity);
    window.addEventListener('touchstart', handleUserActivity);

    return () => {
      window.removeEventListener('click', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('scroll', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
    };
  }, []);

  // Handle PWA visibility change (when app comes back from background)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const token = getToken();
        const user = getUser();
        
        if (token && user) {
          console.log('✅ App resumed - session still valid');
          extendTokenExpiry();
        } else {
          console.log('❌ App resumed - session lost');
          const publicRoutes = ['/', '/login', '/signup', '/forgot-password'];
          if (!publicRoutes.includes(location.pathname)) {
            clearAuth();
            navigate('/');
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [location.pathname, navigate]);

  return children;
}
