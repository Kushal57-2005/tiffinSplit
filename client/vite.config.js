import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.png", "apple-touch-icon.png", "icons/*.png"],
      manifest: {
        name: "TiffinSplit",
        short_name: "TiffinSplit",
        description: "Shared tiffin billing and expense management for roommates",
        start_url: "/",
        display: "standalone",
        orientation: "portrait-primary",
        theme_color: "#FAFAF8",
        background_color: "#FAFAF8",
        icons: [
          {
            src: "/icons/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/icons/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/icons/maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable"
          }
        ]
      },
      workbox: {
        // Cache static application shell assets
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
        navigateFallback: "/index.html",
        // Exclude API routes from SW caching to prevent stale invoice/payment/auth data
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          {
            // Always use NetworkOnly for API requests (never cache sensitive financial data)
            urlPattern: /^\/api\/.*/i,
            handler: "NetworkOnly",
            options: {
              cacheName: "api-no-cache"
            }
          }
        ]
      }
    })
  ],

  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },

  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
