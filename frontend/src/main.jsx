// main.jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";

import App from "./App.jsx";
import { registerServiceWorker } from "./registerSW.js";

// CONDITIONAL SERVICE WORKER CLEANUP - Only in development mode
// This runs BEFORE React renders to ensure clean state
const isDevelopment = import.meta.env.DEV;

if (isDevelopment && 'serviceWorker' in navigator) {
  // Unregister all service workers
  navigator.serviceWorker.getRegistrations().then(registrations => {
    const unregisterPromises = registrations.map(registration => {
      return registration.unregister();
    });
    
    return Promise.all(unregisterPromises);
  }).then(() => {
    // Clear all caches
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            return caches.delete(cacheName);
          })
        );
      });
    }
  });
  
  // Prevent any new service worker registration in dev mode
  navigator.serviceWorker.register = () => {
    return Promise.reject(new Error('Service worker disabled in development'));
  };
}

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <GoogleOAuthProvider clientId="38978635271-csegs91r79kji3tu78f238bso66e36ne.apps.googleusercontent.com">
      <App />
    </GoogleOAuthProvider>
  </StrictMode>
);

// Register service worker in production
registerServiceWorker();
