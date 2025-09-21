import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Juander",
        short_name: "Juander",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#ffffff",
        icons: [
          {
            src: "/icons/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icons/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10MB
      },
    }),
  ],
  build: {
    target: "esnext", // Use modern JS
    minify: "esbuild", // esbuild is fastest
    cssCodeSplit: true, // Split CSS
    sourcemap: false, // Disable maps in prod
    chunkSizeWarningLimit: 2000,
  },
  optimizeDeps: {
    include: ["three", "@react-three/fiber", "@react-three/drei"],
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        // target: "https://juander.onrender.com",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
