import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Avatar } from '../components/Avatar'
import { DeslizadorConfianza } from '../components/DeslizadorConfianza'
import { Encabezado } from '../components/Encabezado'
import { IconoCandado } from '../components/Iconos'
import { Sello } from '../components/Sello'
import { useDatos } from '../datos'
import { anotar, db } from '../db'
import { fechaCorta, sumarDias } from '../domain/lenguaje'
import { ReglaRota } from '../domain/predicciones'
import { ROLES } from '../domain/roles'
import type { Prediccion } from '../domain/tipos'
import s from './Anotar.module.css'

const CONFIANZA_INICIAL = 70
const MUCHAS_FICHAS = 8

export function Anotar() {
  const { deportistas, predicciones, rol, hoy, porId } = useDatos()
  const [params] = useSearchParams()

  const inicial = params.get('d')

  // fichas activas: la que viene en el enlace primero, luego las usadas más recientemente
  const fichas = useMemo(() => {
    const ultimo = new Map<string, string>()
    for (const p of predicciones) {
      if (p.deportistaId && (ultimo.get(p.deportistaId) ?? '') < p.creadaEn) ultimo.set(p.deportistaId, p.creadaEn)
    }
    return deportistas
      .filter((d) => !d.archivado)
      .sort(
        (a, b) =>
          Number(b.id === inicial) - Number(a.id === inicial) ||
          (ultimo.get(b.id) ?? '').localeCompare(ultimo.get(a.id) ?? '') ||
          a.nombre.localeCompare(b.nombre, 'es'),
      )
  }, [deportistas, predicciones, inicial])
  const [quien, setQuien] = useState<string | null>(inicial && porId.has(inicial) ? inicial : null)
  const [buscar, setBuscar] = useState('')
  const [etiqueta, setEtiqueta] = useState('')
  const [confianza, setConfianza] = useState(CONFIANZA_INICIAL)
  const [fecha, setFecha] = useState(hoy)
  const [error, setError] = useState('')
  const [guardada, setGuardada] = useState<Prediccion | null>(null)
  const campo = useRef<HTMLInputElement>(null)

  // si se llega desde una ficha («anotar sobre…»), esa persona queda elegida
  useEffect(() => {
    if (inicial && porId.has(inicial)) {
      setQuien(inicial)
      setGuardada(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo cuando cambia la persona del enlace
  }, [inicial])

  const visibles = buscar.trim()
    ? fichas.filter((d) => d.nombre.toLocaleLowerCase('es').includes(buscar.trim().toLocaleLowerCase('es')))
    : fichas
  // la elegida siempre visible y al frente
  const fila = quien && !visibles.some((d) => d.id === quien) ? [porId.get(quien)!, ...visibles] : visibles

  const atajosFecha = [
    { k: 'Hoy', f: hoy },
    { k: 'Mañana', f: sumarDias(hoy, 1) },
    { k: 'En 1 semana', f: sumarDias(hoy, 7) },
    { k: 'En 1 mes', f: sumarDias(hoy, 30) },
  ]

  async function guardar() {
    try {
      const p = await anotar(db, { deportistaId: quien, etiqueta, confianza, fecha, rol })
      setGuardada(p)
      setError('')
    } catch (e) {
      setError(e instanceof ReglaRota ? e.message : 'No se pudo guardar. Intenta de nuevo.')
      if (!etiqueta.trim()) campo.current?.focus()
    }
  }

  function otra() {
    setGuardada(null)
    setEtiqueta('')
    setConfianza(CONFIANZA_INICIAL)
    setFecha(hoy)
    window.scrollTo(0, 0)
  }

  if (guardada) {
    const d = guardada.deportistaId ? porId.get(guardada.deportistaId) : null
    return (
      <>
        <Encabezado volver />
        <motion.div
          className={s.listo}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          role="status"
        >
          <Sello confianza={guardada.confianza} estado="pendiente" estampar />
          <h1>Anotada</h1>
          <p className={s.listoEtiqueta}>«{guardada.etiqueta}»</p>
          <p className={s.listoMeta}>
            {d ? d.nombre : 'General'} · se sabe el {fechaCorta(guardada.fecha)}
          </p>
          <p className={s.listoCandado}>
            <IconoCandado /> Tu {guardada.confianza}% ya quedó congelado. Vuelve cuando sepas qué pasó.
          </p>
          <div className={s.listoAcciones}>
            <button type="button" className="btn btn-primary" onClick={otra}>
              Anotar otra
            </button>
            <Link to="/" className="btn btn-ghost">
              Volver a Hoy
            </Link>
          </div>
        </motion.div>
      </>
    )
  }

  return (
    <>
      <Encabezado volver />
      <h1 className={s.titulo}>Anota tu pronóstico</h1>
      <p className={s.bajada}>Antes de saber qué pasa. Lo que pongas aquí ya no se podrá cambiar.</p>

      <form
        className={s.forma}
        onSubmit={(e) => {
          e.preventDefault()
          guardar()
        }}
      >
        {/* ---------- sobre quién ---------- */}
        <div className={s.bloque} role="group" aria-labelledby="l-quien">
          <span className="lbl" id="l-quien">¿Sobre quién?</span>
          {fichas.length > MUCHAS_FICHAS && (
            <input
              className={`input ${s.buscar}`}
              type="search"
              placeholder="Buscar ficha…"
              value={buscar}
              onChange={(e) => setBuscar(e.target.value)}
              aria-label="Buscar ficha por nombre"
            />
          )}
          <div className={s.fichas} role="radiogroup" aria-label="Deportista">
            <BotonFicha activa={quien === null} onClick={() => setQuien(null)} nombre="General" sub="sin persona" d={null} />
            {fila.map((d) => (
              <BotonFicha key={d.id} activa={quien === d.id} onClick={() => setQuien(d.id)} nombre={d.nombre} sub={d.nota} d={d} />
            ))}
            {fichas.length === 0 && (
              <Link to="/deportistas?nueva=1" className={s.nuevaFicha}>
                + crear una ficha
              </Link>
            )}
          </div>
        </div>

        {/* ---------- qué ---------- */}
        <div className={s.bloque}>
          <label className="lbl" htmlFor="etiqueta">
            ¿Qué crees que va a pasar?
          </label>
          <input
            ref={campo}
            id="etiqueta"
            className="input"
            type="text"
            value={etiqueta}
            onChange={(e) => setEtiqueta(e.target.value)}
            placeholder={ROLES[rol].sugerencias[0]}
            maxLength={120}
            autoComplete="off"
            enterKeyHint="done"
          />
          <div className={s.chips}>
            {ROLES[rol].sugerencias.map((sug) => (
              <button
                key={sug}
                type="button"
                className={`${s.chip} ${etiqueta === sug ? s.chipActiva : ''}`}
                onClick={() => setEtiqueta(sug)}
              >
                {sug}
              </button>
            ))}
          </div>
        </div>

        {/* ---------- confianza ---------- */}
        <div className={s.bloque}>
          <DeslizadorConfianza valor={confianza} onCambio={setConfianza} />
        </div>

        {/* ---------- cuándo ---------- */}
        <div className={s.bloque} role="group" aria-labelledby="l-cuando">
          <span className="lbl" id="l-cuando">¿Cuándo vas a saber si pasó?</span>
          <div className={s.fechas}>
            {atajosFecha.map((a) => (
              <button
                key={a.k}
                type="button"
                className={`${s.fechaBtn} ${fecha === a.f ? s.fechaActiva : ''}`}
                aria-pressed={fecha === a.f}
                onClick={() => setFecha(a.f)}
              >
                {a.k}
              </button>
            ))}
          </div>
          <input
            className={`input ${s.fechaInput}`}
            type="date"
            value={fecha}
            onChange={(e) => e.target.value && setFecha(e.target.value)}
            aria-label="Otra fecha"
          />
        </div>

        <div className={s.pie}>
          <AnimatePresence>
            {error && (
              <motion.p className="status-line bad" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="alert">
                {error}
              </motion.p>
            )}
          </AnimatePresence>
          <button type="submit" className="btn btn-primary">
            Guardar como pendiente
          </button>
        </div>
      </form>
    </>
  )
}

function BotonFicha(props: {
  activa: boolean
  onClick: () => void
  nombre: string
  sub?: string
  d: Parameters<typeof Avatar>[0]['d']
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={props.activa}
      className={`${s.ficha} ${props.activa ? s.fichaActiva : ''}`}
      onClick={props.onClick}
    >
      <Avatar d={props.d} tam={38} />
      <span className={s.fichaNombre}>{props.nombre}</span>
      {props.sub && <span className={s.fichaSub}>{props.sub}</span>}
    </button>
  )
}
