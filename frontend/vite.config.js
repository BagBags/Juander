import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  base: '', // Empty string for relative paths
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ['**/*.{png,jpg,jpeg,svg,gif,ico,webp,woff,woff2,ttf,eot}'],
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
            src: "/icons/logo.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: "/icons/logo.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          },
        ],
      },
      manifestFilename: 'manifest.json',
      workbox: {
        maximumFileSizeToCacheInBytes: 50 * 1024 * 1024, // 50MB for videos/3D models
        globPatterns: ['**/*.{js,css,html,ico,png,jpg,jpeg,svg,woff,woff2}'],
        // Ensure all JS chunks are cached (including lazy-loaded ones)
        globDirectory: 'dist',
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          // Guest API calls - Public endpoints only (pins, reviews)
          {
            urlPattern: /^https:\/\/d3des4qdhz53rp\.cloudfront\.net\/api\/(pins|reviews|itineraries\/admin)\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'guest-api-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days for guest content
              },
              networkTimeoutSeconds: 10,
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // Exclude authenticated endpoints from caching
          {
            urlPattern: /^https:\/\/d3des4qdhz53rp\.cloudfront\.net\/api\/(admin|auth|users|userItineraries)\/.*/i,
            handler: 'NetworkOnly',
          },
          // Images - Cache First (with stale-while-revalidate)
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          // Videos - Cache First
          {
            urlPattern: /\.(?:mp4|webm|ogg|mov)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'video-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              rangeRequests: true,
            },
          },
          // 3D Models - Cache First
          {
            urlPattern: /\.(?:glb|gltf)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: '3d-model-cache',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          // Fonts - Cache First
          {
            urlPattern: /\.(?:woff|woff2|ttf|eot)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'font-cache',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
          // Mapbox tiles - Cache First (better for offline)
          {
            urlPattern: /^https:\/\/api\.mapbox\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'mapbox-cache',
              expiration: {
                maxEntries: 1000,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
              // Add plugins for better offline handling
              plugins: [
                {
                  handlerDidError: async () => {
                    // Return a fallback response when map tiles fail
                    return new Response(
                      JSON.stringify({ error: 'Offline - Map tiles unavailable' }),
                      {
                        status: 503,
                        statusText: 'Service Unavailable',
                        headers: { 'Content-Type': 'application/json' }
                      }
                    );
                  },
                },
              ],
            },
          },
          // External CDN resources
          {
            urlPattern: /^https:\/\/(cdn|unpkg|fonts\.googleapis|fonts\.gstatic)\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'cdn-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
        ],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [
          /^\/api/,  // Only block API calls
        ],
      },
      devOptions: {
        enabled: true, // Enable in development for testing
        type: 'module',
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
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
