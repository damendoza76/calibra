import { useEffect, useState } from 'react'
import { HashRouter, Route, Routes, useLocation } from 'react-router-dom'
import { BarraInferior } from './components/BarraInferior'
import { Encabezado } from './components/Encabezado'
import { ProveedorDatos, useDatos } from './datos'
import { estadoPendiente } from './domain/predicciones'
import { Anotar } from './screens/Anotar'
import { Hoy } from './screens/Hoy'
import { Introduccion } from './screens/Introduccion'
import { useTema } from './theme/useTema'
import s from './App.module.css'

function Pronto({ titulo }: { titulo: string }) {
  return (
    <>
      <Encabezado />
      <div className="sec-title">
        <h2>{titulo}</h2>
      </div>
      <div className="empty">
        <p>Esta pantalla llega en el siguiente paso.</p>
      </div>
    </>
  )
}

function SubirAlCambiar() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function Marco() {
  const { ajustes, predicciones, hoy } = useDatos()
  const [introAbierta, setIntroAbierta] = useState(!ajustes.introVista)
  useTema(ajustes.tema)
  const listas = predicciones.filter((p) => p.estado === 'pendiente' && estadoPendiente(p, hoy) !== 'esperando').length

  return (
    <>
      <SubirAlCambiar />
      <main className={s.marco}>
        <Routes>
          <Route path="/" element={<Hoy />} />
          <Route path="/deportistas" element={<Pronto titulo="Deportistas" />} />
          <Route path="/deportistas/:id" element={<Pronto titulo="Ficha" />} />
          <Route path="/anotar" element={<Anotar />} />
          <Route path="/pendientes" element={<Pronto titulo="Pendientes" />} />
          <Route path="/calibracion" element={<Pronto titulo="Calibración" />} />
          <Route path="/ajustes" element={<Pronto titulo="Ajustes" />} />
          <Route path="*" element={<Hoy />} />
        </Routes>
      </main>
      <BarraInferior pendientesListas={listas} />
      {introAbierta && <Introduccion rolActual={ajustes.rol} onListo={() => setIntroAbierta(false)} />}
    </>
  )
}

export default function App() {
  return (
    <HashRouter>
      <ProveedorDatos cargando={<div className={s.cargando}>Calibra</div>}>
        <Marco />
      </ProveedorDatos>
    </HashRouter>
  )
}
