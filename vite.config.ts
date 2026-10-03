/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import paquete from './package.json' with { type: 'json' }

export default defineConfig({
  // rutas relativas: la misma compilación sirve en GitHub Pages (/calibra/) y en Netlify (/)
  base: './',
  define: { __VERSION__: JSON.stringify(paquete.version) },
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
})
