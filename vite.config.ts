/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import paquete from './package.json' with { type: 'json' }

export default defineConfig({
  // rutas relativas: la misma compilación sirve en GitHub Pages (/calibra/) y en Netlify (/)
  base: './',
  define: { __VERSION__: JSON.stringify(paquete.version) },
  plugins: [
    react(),
    VitePWA({
      // la app se actualiza sola cuando hay una versión nueva publicada
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png', 'icono.svg'],
      manifest: {
        name: 'Calibra · bitácora de pronósticos',
        short_name: 'Calibra',
        description: 'Anota lo que crees que va a pasar antes de saberlo, compáralo después y calibra tu criterio.',
        lang: 'es',
        dir: 'ltr',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#F5F1E6',
        theme_color: '#E39A00',
        categories: ['sports', 'education', 'productivity'],
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // todo lo necesario para abrir sin conexión; de las fuentes, solo el alfabeto latino
        globPatterns: ['**/*.{js,css,html,ico,png,svg}', '**/*latin*.woff2'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
})
