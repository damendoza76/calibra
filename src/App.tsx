import { domAnimation, LazyMotion } from 'framer-motion'
import { lazy, Suspense, useEffect } from 'react'
import { HashRouter, Route, Routes, useLocation } from 'react-router-dom'
import { BarraInferior } from './components/BarraInferior'
import { ProveedorDatos, useDatos } from './datos'
import { estadoPendiente } from './domain/predicciones'
import { Anotar } from './screens/Anotar'
import { Hoy } from './screens/Hoy'
import { Introduccion } from './screens/Introduccion'
import { Pendientes } from './screens/Pendientes'
import { useTema } from './theme/useTema'

// las pantallas con gráficos se cargan cuando se abren; Hoy, Anotar y Pendientes van siempre listas
const Ajustes = lazy(() => import('./screens/Ajustes').then((m) => ({ default: m.Ajustes })))
const Calibracion = lazy(() => import('./screens/Calibracion').then((m) => ({ default: m.Calibracion })))
const Deportistas = lazy(() => import('./screens/Deportistas').then((m) => ({ default: m.Deportistas })))
const Ficha = lazy(() => import('./screens/Ficha').then((m) => ({ default: m.Ficha })))
import s from './App.module.css'

function SubirAlCambiar() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function Marco() {
  const { ajustes, predicciones, hoy } = useDatos()
  useTema(ajustes.tema)
  const listas = predicciones.filter((p) => p.estado === 'pendiente' && estadoPendiente(p, hoy) !== 'esperando').length

  return (
    <>
      <SubirAlCambiar />
      <main className={s.marco}>
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<Hoy />} />
            <Route path="/deportistas" element={<Deportistas />} />
            <Route path="/deportistas/:id" element={<Ficha />} />
            <Route path="/anotar" element={<Anotar />} />
            <Route path="/pendientes" element={<Pendientes />} />
            <Route path="/calibracion" element={<Calibracion />} />
            <Route path="/ajustes" element={<Ajustes />} />
            <Route path="*" element={<Hoy />} />
          </Routes>
        </Suspense>
      </main>
      <BarraInferior pendientesListas={listas} />
      {!ajustes.introVista && <Introduccion rolActual={ajustes.rol} />}
    </>
  )
}

export default function App() {
  return (
    <HashRouter>
      <LazyMotion features={domAnimation} strict>
        <ProveedorDatos cargando={<div className={s.cargando}>Calibra</div>}>
          <Marco />
        </ProveedorDatos>
      </LazyMotion>
    </HashRouter>
  )
}
