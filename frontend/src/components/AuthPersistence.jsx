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
    // Check if user is in guest mode
    const isGuest = localStorage.getItem('guest') === 'true';
    
    // Check and restore authentication on mount
    const token = getToken();
    const user = getUser();

    if (token && user) {
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
    } else if (isGuest) {
      console.log('✅ Guest mode active - session persisted');
      
      // If guest is on login page, redirect to guest homepage
      if (location.pathname === '/' || location.pathname === '/login') {
        navigate('/GuestHomepage');
      }
    } else {
      console.log('❌ No valid session found');
      
      // Only redirect to login if on protected routes (not guest routes)
      const publicRoutes = ['/', '/login', '/signup', '/forgot-password'];
      const guestRoutes = ['/GuestHomepage', '/GuestItinerary', '/GuestItineraryMap', '/TourMap', '/Chatbot', '/Emergency', '/Photobooth', '/GuestProfile'];
      const isGuestRoute = guestRoutes.some(route => location.pathname.startsWith(route));
      
      if (!publicRoutes.includes(location.pathname) && !isGuestRoute) {
        clearAuth();
        navigate('/');
      }
    }
  }, []);

  // Listen for cross-tab logout events
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'logout') {
        try { clearAuth(); } catch (e) {}
        if (location.pathname !== '/login') {
          navigate('/login', { replace: true });
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [navigate, location.pathname]);

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
        const isGuest = localStorage.getItem('guest') === 'true';
        
        if (token && user) {
          console.log('✅ App resumed - session still valid');
          extendTokenExpiry();
        } else if (isGuest) {
          console.log('✅ App resumed - guest mode active');
          // Guest mode is still active, no need to redirect
        } else {
          console.log('❌ App resumed - session lost');
          const publicRoutes = ['/', '/login', '/signup', '/forgot-password'];
          const guestRoutes = ['/GuestHomepage', '/GuestItinerary', '/GuestItineraryMap', '/TourMap', '/Chatbot', '/Emergency', '/Photobooth', '/GuestProfile'];
          const isGuestRoute = guestRoutes.some(route => location.pathname.startsWith(route));
          
          if (!publicRoutes.includes(location.pathname) && !isGuestRoute) {
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
