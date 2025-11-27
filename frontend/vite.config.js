import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import { visualizer } from "rollup-plugin-visualizer";
import fs from "fs";
import path from "path";

export default defineConfig({
  base: "", // Empty string for relative paths
  optimizeDeps: {
    include: [
      // Ensure stable resolution for transitive deps used by UI libs
      "use-sync-external-store",
      "use-sync-external-store/with-selector",
      "react-redux",
      // Prebundle map libs to ensure proper ESM default exports in dev
      "mapbox-gl",
      "react-map-gl",
    ],
    exclude: [
      // Defer heavy libs; keep UI libs for correct ESM resolution in dev
      "jspdf",
      "jspdf-autotable",
      "react-chartjs-2",
      "chart.js",
      "jsqr",
      "lucide-react",
      "framer-motion",
    ],
    esbuildOptions: {
      minify: true,
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "**/*.{png,jpg,jpeg,svg,gif,ico,webp,woff,woff2,ttf,eot}",
      ],
      manifest: {
        name: "Juander - Intramuros Tour Guide",
        short_name: "Juander",
        description: "Your personal guide to exploring Intramuros, Manila",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait-primary",
        background_color: "#ffffff",
        theme_color: "#f04e37",
        icons: [
          {
            src: "/juan/JuanderPWAIcon.svg",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "/juan/JuanderPWAIcon.svg",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      manifestFilename: "manifest.json",
      workbox: {
        maximumFileSizeToCacheInBytes: 50 * 1024 * 1024, // 50MB for videos/3D models
        globPatterns: ["**/*.{js,css,html,ico,png,jpg,jpeg,svg,woff,woff2}"],
        // Ensure all JS chunks are cached (including lazy-loaded ones)
        globDirectory: "dist",
        cleanupOutdatedCaches: true,
        // Skip waiting to activate new service worker immediately
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          // ========================================
          // CRITICAL: NEVER CACHE (Dynamic/Sensitive Data)
          // ========================================
          
          // Authentication & User-specific endpoints - NetworkOnly
          {
            urlPattern:
              /^https:\/\/d3des4qdhz53rp\.cloudfront\.net\/api\/(admin|auth|users|userItineraries|visited-sites|itinerary-progress|logs)\/.*/i,
            handler: "NetworkOnly",
          },
          
          // User review mutations - NetworkOnly
          {
            urlPattern:
              /^https:\/\/d3des4qdhz53rp\.cloudfront\.net\/api\/reviews$/i,
            handler: "NetworkOnly",
            method: "POST",
          },
          {
            urlPattern:
              /^https:\/\/d3des4qdhz53rp\.cloudfront\.net\/api\/reviews\/.*/i,
            handler: "NetworkOnly",
            method: "PUT",
          },
          {
            urlPattern:
              /^https:\/\/d3des4qdhz53rp\.cloudfront\.net\/api\/reviews\/.*/i,
            handler: "NetworkOnly",
            method: "DELETE",
          },
          
          // Emergency contacts - StaleWhileRevalidate (SAFETY-CRITICAL - MUST WORK OFFLINE!)
          {
            urlPattern:
              /^https:\/\/d3des4qdhz53rp\.cloudfront\.net\/api\/emergency.*/i,
            handler: "StaleWhileRevalidate",
            method: "GET",
            options: {
              cacheName: "emergency-contacts-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days (rarely change)
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },

          // ========================================
          // TOUR-CRITICAL: OFFLINE-READY PUBLIC DATA
          // ========================================
          
          // All pins (GET) - StaleWhileRevalidate (FAST + OFFLINE-READY)
          {
            urlPattern: /^https:\/\/d3des4qdhz53rp\.cloudfront\.net\/api\/pins(\/.*)?$/i,
            handler: "StaleWhileRevalidate",
            method: "GET",
            options: {
              cacheName: "tour-pins-cache",
              expiration: {
                maxEntries: 150,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          
          // All public itineraries (GET) - StaleWhileRevalidate (OFFLINE-READY)
          {
            urlPattern:
              /^https:\/\/d3des4qdhz53rp\.cloudfront\.net\/api\/itineraries\/.*/i,
            handler: "StaleWhileRevalidate",
            method: "GET",
            options: {
              cacheName: "tour-itineraries-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          
          // All public reviews (GET) - StaleWhileRevalidate
          {
            urlPattern:
              /^https:\/\/d3des4qdhz53rp\.cloudfront\.net\/api\/reviews(\/[^\/]+)?(\?.*)?$/i,
            handler: "StaleWhileRevalidate",
            method: "GET",
            options: {
              cacheName: "tour-reviews-cache",
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 3, // 3 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },

          // ========================================
          // S3 CLOUDFRONT ASSETS - TOUR-CRITICAL
          // ========================================
          
          // Pin facades, AR models & Emergency icons - CacheFirst (OFFLINE-READY)
          {
            urlPattern:
              /^https:\/\/(d39zx5gyblzxjs\.cloudfront\.net|d3des4qdhz53rp\.cloudfront\.net|juander-frontend\.s3\.ap-southeast-2\.amazonaws\.com)\/uploads\/(facades|arModels|emergency)\/.*/i,
handler: "StaleWhileRevalidate",
            options: {
              cacheName: "tour-static-assets",
              expiration: {
                maxEntries: 250,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          
          // Admin itinerary images - StaleWhileRevalidate
          {
            urlPattern:
              /^https:\/\/(d39zx5gyblzxjs\.cloudfront\.net|d3des4qdhz53rp\.cloudfront\.net|juander-frontend\.s3\.ap-southeast-2\.amazonaws\.com)\/uploads\/itineraries\/.*/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "tour-itinerary-images",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          
          // User-uploaded content - NetworkFirst (updates priority)
          {
            urlPattern:
              /^https:\/\/(d39zx5gyblzxjs\.cloudfront\.net|d3des4qdhz53rp\.cloudfront\.net|juander-frontend\.s3\.ap-southeast-2\.amazonaws\.com)\/uploads\/(profile|reviews|userItineraries|media)\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "s3-user-content",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 2, // 2 days
              },
              networkTimeoutSeconds: 5,
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },

          // ========================================
          // OTHER API ENDPOINTS
          // ========================================
          
          // Chatbot API - NetworkFirst (AI responses)
          {
            urlPattern:
              /^https:\/\/d3des4qdhz53rp\.cloudfront\.net\/api\/(bot|openai|gemini).*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "chatbot-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 1 day
              },
              networkTimeoutSeconds: 30,
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },

          // ========================================
          // STATIC ASSETS - AGGRESSIVE CACHING
          // ========================================
          
          // Local images - CacheFirst (versioned by build)
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
handler: "StaleWhileRevalidate",
            options: {
              cacheName: "local-images-cache",
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          
          // Videos - CacheFirst
          {
            urlPattern: /\.(?:mp4|webm|ogg|mov)$/i,
handler: "StaleWhileRevalidate",
            options: {
              cacheName: "videos-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 90, // 90 days
              },
              rangeRequests: true,
            },
          },
          {
  urlPattern: /index\.html/,
  handler: "NetworkFirst",
},

          
          // 3D Models - CacheFirst
          {
            urlPattern: /\.(?:glb|gltf)$/i,
handler: "StaleWhileRevalidate",
            options: {
              cacheName: "3d-models-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 90, // 90 days
              },
            },
          },
          
          // Fonts - CacheFirst
          {
            urlPattern: /\.(?:woff|woff2|ttf|eot)$/i,
handler: "StaleWhileRevalidate",
            options: {
              cacheName: "fonts-cache",
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },

          // ========================================
          // EXTERNAL RESOURCES - TOUR-CRITICAL
          // ========================================
          
          // Mapbox tiles - CacheFirst (OFFLINE MAPS)
          {
            urlPattern: /^https:\/\/api\.mapbox\.com\/.*/i,
handler: "StaleWhileRevalidate",
            options: {
              cacheName: "mapbox-tiles-cache",
              expiration: {
                maxEntries: 2000, // Large cache for offline maps
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          
          // Google Fonts & CDN - CacheFirst
          {
            urlPattern:
              /^https:\/\/(fonts\.googleapis|fonts\.gstatic|cdn\.jsdelivr\.net|unpkg\.com|www\.gstatic)\.com\/.*/i,
handler: "StaleWhileRevalidate",
            options: {
              cacheName: "external-cdn-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [
          /^\/api/, // Prevent API calls from falling back to index.html
        ],
      },
      devOptions: {
        enabled: false, // Disable in development to avoid offline cache issues
        type: "module",
      },
    }),
    visualizer({
      filename: "dist/stats.html",
      template: "treemap", // "sunburst" or "network" also work
    }),
  ],
  build: {
    target: "esnext",
    minify: "esbuild",
    cssCodeSplit: true,
    sourcemap: false,
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          three: ["three", "@react-three/fiber", "@react-three/drei"],
          mapbox: ["mapbox-gl", "react-map-gl"],
          icons_fa: ["react-icons/fa"],
          icons_md: ["react-icons/md"],
          icons_gi: ["react-icons/gi"],
          icons_io5: ["react-icons/io5"],
          icons_fa6: ["react-icons/fa6"],
          fontawesome: [
            "@fortawesome/react-fontawesome",
            "@fortawesome/free-solid-svg-icons",
            "@fortawesome/fontawesome-svg-core",
          ],
          pdf: ["jspdf", "jspdf-autotable"],
          charts: ["react-chartjs-2", "chart.js/auto"],
          qr: ["jsqr"],
          joyride: ["react-joyride"],
          dnd: ["@hello-pangea/dnd"],
          framer: ["framer-motion"],
          admin: [
            "./src/components/adminComponents/adminTourMapComponents/AdminPinCard.jsx",
            "./src/components/adminComponents/adminTourMapComponents/AddPinModal.jsx",
            "./src/components/adminComponents/adminTourMapComponents/ManualAddModal.jsx",
          ],
          userMap: ["./src/components/userComponents/TourMap/TourMap.jsx"],
        },
      },
    },
  },
  server: {
    host: "localhost",
    port: 5173,
    cors: true,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
