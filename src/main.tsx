import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
// fuentes empaquetadas dentro de la app (solo alfabeto latino: cubre el español): funcionan sin internet
import '@fontsource/big-shoulders-display/latin-600'
import '@fontsource/big-shoulders-display/latin-700'
import '@fontsource/big-shoulders-display/latin-800'
import '@fontsource-variable/source-serif-4/opsz'
import '@fontsource-variable/source-serif-4/opsz-italic'
import '@fontsource/ibm-plex-mono/latin-400'
import '@fontsource/ibm-plex-mono/latin-500'
import '@fontsource/ibm-plex-mono/latin-600'
import './theme/base.css'
import './theme/ui.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
