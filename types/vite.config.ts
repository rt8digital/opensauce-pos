import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path, { dirname } from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";

// Detect if running for Electron build
const isElectron = process.env.VITE_ELECTRON === 'true';

// We'll conditionally add PWA plugin only for web builds
let pwaPlugin = [];
if (!isElectron) {
  try {
    // Dynamically import the PWA plugin for web builds only
    const { VitePWA } = require('vite-plugin-pwa');
    pwaPlugin = [VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'sitemap.xml', 'apple-touch-icon.png', '.htaccess'],
      manifest: {
        name: 'OpenSauce P.O.S.',
        short_name: 'POS',
        description: 'Modern Point of Sale System',
        theme_color: '#000000',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          {
            urlPattern: /^\/api\/.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5, // 5 minutes
              },
            },
          },
        ],
      },
    })];
  } catch (e) {
    console.warn('VitePWA plugin not available:', e.message);
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  base: isElectron ? "./" : "/",
  plugins: [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
    ...pwaPlugin,
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, isElectron ? "dist/renderer" : "dist/public"),
    emptyOutDir: true,
    // Optimize for mobile/desktop
    target: 'es2020',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production', // Remove console.logs in production
        drop_debugger: true,
      },
    },
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'client/index.html'),
      },
      // Temporarily disable manualChunks to test if code splitting is causing the issue
      output: {
        // manualChunks: (id) => {
        //   if (id.includes('node_modules')) {
        //     if (id.includes('react') || id.includes('react-dom') || id.includes('@tanstack')) {
        //       return 'react-vendor';
        //     }
        //     if (id.includes('@radix-ui') || id.includes('lucide-react') || id.includes('framer-motion')) {
        //       return 'ui-vendor';
        //     }
        //     return 'vendor';
        //   }
        // }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  server: {
    port: 5173,
    host: true,
    // No proxy needed when using direct database access in Electron
    proxy: !isElectron ? {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
    } : undefined,
  },
});