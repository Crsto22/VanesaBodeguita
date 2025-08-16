import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [react(), tailwindcss(), VitePWA({
    registerType: 'autoUpdate',
    workbox: {
      // Aumentar el límite de tamaño de archivo para el service worker
      maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
      // Excluir archivos grandes del caché automático
      globIgnores: ['**/assets/Logo-*.svg', '**/assets/*-*.svg']
    },
    manifest: {
      name: 'VanesaBodeguita',
      short_name: 'VanesaBodeguita',
      description: 'Una app optimizada para móviles',
      theme_color: '#ffffff',
      icons: [  
        {
          src: '/icon-192x192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: '/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png'
        }
      ]
    }
  })],
  build: {
    // Aumentar el límite de advertencia de chunk
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      output: {
        // Configurar manual chunks para dividir el bundle
        manualChunks: {
          // Separar vendor libraries
          vendor: ['react', 'react-dom', 'react-router-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          ui: ['lucide-react', 'framer-motion', 'lottie-react'],
          // Separar HTML5-QRCode que es grande
          scanner: ['html5-qrcode']
        }
      }
    }
  },
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    open: false
  }
})