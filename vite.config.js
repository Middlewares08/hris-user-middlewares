import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        // Keep the heavy PSGC dataset in its own chunk so the service worker can
        // exclude it from the precache manifest (see workbox.globIgnores below).
        manualChunks: (id) => (id.includes('node_modules/addresspinas') ? 'address-data' : undefined),
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      devOptions: {
        enabled: true // 👈 Essential for virtual modules to work in 'npm run dev'
      },
      workbox: {
        // Large, feature-specific bundles that aren't needed on first paint:
        //  - FaceLivenessCheck: the Amplify liveness UI (liveness checks only)
        //  - address-data: the full PSGC dataset from `addresspinas` (~1.9 MB),
        //    only pulled when an employee edits their profile Home Address.
        // Load both on demand and runtime-cache them; don't precache.
        globIgnores: ['**/FaceLivenessCheck-*', '**/address-data-*'],
        runtimeCaching: [
          {
            urlPattern: /\/assets\/FaceLivenessCheck-.*\.(js|css)$/,
            handler: 'CacheFirst',
            options: { cacheName: 'face-liveness', expiration: { maxEntries: 4 } },
          },
          {
            urlPattern: /\/assets\/address-data-.*\.js$/,
            handler: 'CacheFirst',
            options: { cacheName: 'address-data', expiration: { maxEntries: 2 } },
          },
        ],
      },
      manifest: {
        name: 'My PWA App',
        short_name: 'PWAApp',
        description: 'My awesome progressive web app',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any' // 👈 Essential! Tells Chrome this icon can be used on any home screen
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any' // 👈 Essential!
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable' // Optional separate entry for adaptive Android icons
          }
        ],
        screenshots: [
          {
            src: '/screenshots/desktop-wide.png',
            sizes: '1280x800',
            type: 'image/png',
            form_factor: 'wide'
          },
          {
            src: '/screenshots/mobile-narrow.png',
            sizes: '390x844',
            type: 'image/png',
            form_factor: 'narrow'
          }
        ]
      }
    })
  ]
});