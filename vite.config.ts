import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff,woff2,ttf,otf,png,jpg,jpeg,svg}'],
      },
      manifest: {
        name: 'Software STEAM Rural',
        short_name: 'STEAM',
        description: 'Herramienta educativa offline para talleres de robótica creativa',
        theme_color: '#ffffff',
        background_color: '#f0fdf4',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  base: '/steam-rural/'
})
