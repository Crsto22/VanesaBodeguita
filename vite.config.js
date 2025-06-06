import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [react(), tailwindcss(), VitePWA({
    registerType: 'autoUpdate',
    manifest: {
      name: 'VanesaBodeguita',
      short_name: 'VanesaBodeguita',
      description: 'Una app optimizada para móviles',
      theme_color: '#ffffff',
      icons: [  
        {
          src: '/assets/Logo.svg',
          sizes: '192x192',
          type: 'image/svg+xml'
        },
        {
          src: '/assets/Logo.svg',
          sizes: '512x512',
          type: 'image/svg+xml'
        }
      ]
    }
  })],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    open: false
  }
})