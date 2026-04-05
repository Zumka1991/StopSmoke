import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icon.svg', 'robots.txt', 'apple-touch-icon.png'],
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      manifest: {
        name: 'StopSmoke - Брось курить!',
        short_name: 'StopSmoke',
        description: 'Трекер отказа от курения, марафоны и поддержка сообщества.',
        theme_color: '#1e293b',
        background_color: '#0f172a',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
      }
    })
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5216',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://localhost:5216',
        changeOrigin: true,
        secure: false,
      },
      '/chatHub': {
        target: 'http://localhost:5216',
        changeOrigin: true,
        secure: false,
        ws: true,
      }
    }
  }
})
