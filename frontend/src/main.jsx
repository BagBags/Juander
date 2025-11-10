// main.jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";

import App from "./App.jsx";

// CONDITIONAL SERVICE WORKER CLEANUP - Only in development mode
// This runs BEFORE React renders to ensure clean state
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

if (isDevelopment && 'serviceWorker' in navigator) {
  console.log('[DEV] Running in development mode - cleaning up service workers');
  
  // Unregister all service workers
  navigator.serviceWorker.getRegistrations().then(registrations => {
    const unregisterPromises = registrations.map(registration => {
      console.log('[DEV] Unregistering service worker:', registration.scope);
      return registration.unregister();
    });
    
    return Promise.all(unregisterPromises);
  }).then(() => {
    console.log('[DEV] All service workers unregistered');
    
    // Clear all caches
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            console.log('[DEV] Deleting cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      }).then(() => {
        console.log('[DEV] All caches cleared');
      });
    }
  }).catch(err => {
    console.error('[DEV] Error cleaning up:', err);
  });
  
  // Prevent any new service worker registration in dev mode
  navigator.serviceWorker.register = () => {
    console.log('[DEV] Service worker registration blocked');
    return Promise.reject(new Error('Service worker disabled in development'));
  };
} else if (!isDevelopment) {
  console.log('[PWA MODE] Running in production/PWA mode - service workers enabled');
}

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// DEBUG: Log all environment variables
console.log("=== ENVIRONMENT VARIABLES ===");
console.log("VITE_API_BASE_URL:", import.meta.env.VITE_API_BASE_URL);
console.log("VITE_FRONTEND_URL:", import.meta.env.VITE_FRONTEND_URL);
console.log("VITE_GOOGLE_CLIENT_ID:", clientId);
console.log("MODE:", import.meta.env.MODE);
console.log("DEV:", import.meta.env.DEV);
console.log("============================");

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <GoogleOAuthProvider clientId="38978635271-csegs91r79kji3tu78f238bso66e36ne.apps.googleusercontent.com">
      <App />
    </GoogleOAuthProvider>
  </StrictMode>
);
