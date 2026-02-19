import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico'], 
      manifest: {
        name: "Brasa Primal",
        short_name: "Brasa Primal",
        start_url: "/",
        display: "standalone",
        background_color: "#09090b",
        theme_color: "#f97316",
        description: "O Fogo Perfeito. Sem Espera.",
        icons: [
          {
            src: "/icon-192.png?v=2",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: "/icon-512.png?v=2",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          }
        ]
      }
    })
  ],
})
