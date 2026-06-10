import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5174,
    // Bind to all interfaces so the dev server is reachable from a phone on the LAN (Vite prints a
    // "Network:" URL). On WSL2 see the notes below if the phone can't reach it.
    host: true,
  },
})
