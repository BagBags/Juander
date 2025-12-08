// main.jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";

import App from "./App.jsx";
import { registerServiceWorker } from "./registerSW.js";

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  window.__deferredPWAInstallPrompt = e;
});

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <GoogleOAuthProvider clientId="38978635271-csegs91r79kji3tu78f238bso66e36ne.apps.googleusercontent.com">
      <App />
    </GoogleOAuthProvider>
  </StrictMode>
);

registerServiceWorker();
