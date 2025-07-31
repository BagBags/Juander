// main.jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App.jsx";

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

console.log("Client ID from .env:", clientId); // ← This should log the correct string

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <GoogleOAuthProvider clientId="38978635271-csegs91r79kji3tu78f238bso66e36ne.apps.googleusercontent.com">
      <App />
    </GoogleOAuthProvider>
  </StrictMode>
);
