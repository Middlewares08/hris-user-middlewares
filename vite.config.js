import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
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
        // The Amplify Face Liveness bundle is large and only used when an employee
        // runs a liveness check — load it on demand, don't precache it.
        globIgnores: ['**/FaceLivenessCheck-*'],
        runtimeCaching: [
          {
            urlPattern: /\/assets\/FaceLivenessCheck-.*\.(js|css)$/,
            handler: 'CacheFirst',
            options: { cacheName: 'face-liveness', expiration: { maxEntries: 4 } },
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