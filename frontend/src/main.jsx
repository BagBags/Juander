// main.jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { GoogleOAuthProvider } from "@react-oauth/google";

import App from "./App.jsx";

// Register service worker with update notification
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    if (confirm("New content available. Reload to update?")) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log("✅ App ready to work offline");
  },
  onRegistered(registration) {
    console.log("✅ Service Worker registered");
    // Check for updates every hour
    setInterval(() => {
      registration?.update();
    }, 60 * 60 * 1000);
  },
  onRegisterError(error) {
    console.error("❌ Service Worker registration failed:", error);
  },
});

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

console.log("Client ID from .env:", clientId); // ← This should log the correct string

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <GoogleOAuthProvider clientId="38978635271-csegs91r79kji3tu78f238bso66e36ne.apps.googleusercontent.com">
      <App />
    </GoogleOAuthProvider>
  </StrictMode>
);
