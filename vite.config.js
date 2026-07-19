import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/Wohnung/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'Mietwohnungs-Tracker',
        short_name: 'Wohnung',
        description: 'Einnahmen & Ausgaben für Mietwohnungen',
        theme_color: '#1a2744',
        background_color: '#f8f9fb',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/Wohnung/',
        scope: '/Wohnung/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      }
    })
  ]
})
