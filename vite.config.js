import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(),],
  server: {
    host: true, // Expone el servidor a todos los dispositivos en la red local
    port: 5173, // Puerto fijo (puedes cambiarlo si lo prefieres)
    strictPort: true, // Falla si el puerto está ocupado, evita que Vite use otro puerto
    open: false // Opcional: no abre el navegador automáticamente
  }
})
