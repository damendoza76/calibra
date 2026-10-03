import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// genera los iconos de la app a partir de public/icono.svg: npx pwa-assets-generator
export default defineConfig({
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, padding: 0.12, resizeOptions: { background: '#E39A00' } },
    apple: { ...minimal2023Preset.apple, padding: 0.12, resizeOptions: { background: '#E39A00' } },
  },
  images: ['public/icono.svg'],
})
