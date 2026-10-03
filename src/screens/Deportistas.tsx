import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Avatar } from '../components/Avatar'
import { Encabezado } from '../components/Encabezado'
import { FormularioFicha } from '../components/FormularioFicha'
import { IconoMas } from '../components/Iconos'
import { MiniCalibracion } from '../components/MiniCalibracion'
import { Sparkline } from '../components/Sparkline'
import { useDatos } from '../datos'
import type { Cierre } from '../domain/calibracion'
import { cargaSemanal } from '../domain/carga'
import { plural } from '../domain/lenguaje'
import type { Deportista, Sesion } from '../domain/tipos'
import s from './Deportistas.module.css'

const SEMANAS = 8
const CON_BUSCADOR = 8

type Resumen = { semanas: number[]; cierres: Cierre[]; pendientes: number }

export function Deportistas() {
  const { deportistas, predicciones, sesiones, hoy } = useDatos()
  const [params, setParams] = useSearchParams()
  const nav = useNavigate()
  const [buscar, setBuscar] = useState('')
  const [verArchivo, setVerArchivo] = useState(false)
  const [editando, setEditando] = useState<Deportista | null>(null)
  const creando = params.get('nueva') === '1'

  // una sola pasada por sesiones y predicciones: rápido aunque haya 60 fichas
  const resumen = useMemo(() => {
    const porSesion = new Map<string, Sesion[]>()
    for (const x of sesiones) {
      const l = porSesion.get(x.deportistaId) ?? []
      l.push(x)
      porSesion.set(x.deportistaId, l)
    }
    const r = new Map<string, Resumen>()
    for (const d of deportistas) r.set(d.id, { semanas: cargaSemanal(porSesion.get(d.id) ?? [], hoy, SEMANAS), cierres: [], pendientes: 0 })
    for (const p of predicciones) {
      const e = p.deportistaId ? r.get(p.deportistaId) : undefined
      if (!e) continue
      if (p.estado === 'pendiente') e.pendientes++
      else if (p.resultado !== null) e.cierres.push({ confianza: p.confianza, resultado: p.resultado, cerradaEn: p.cerradaEn })
    }
    return r
  }, [deportistas, predicciones, sesiones, hoy])

  const activas = deportistas.filter((d) => !d.archivado)
  const archivadas = deportistas.filter((d) => d.archivado)
  const base = verArchivo ? archivadas : activas
  const q = buscar.trim().toLocaleLowerCase('es')
  const lista = base
    .filter((d) => !q || d.nombre.toLocaleLowerCase('es').includes(q) || (d.nota ?? '').toLocaleLowerCase('es').includes(q))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))

  const cerrarCreacion = () => {
    params.delete('nueva')
    setParams(params, { replace: true })
  }

  return (
    <>
      <Encabezado />
      <div className={s.cabeza}>
        <div>
          <h1 className={s.titulo}>Fichas</h1>
          <p className={s.sub}>
            {activas.length ? plural(activas.length, 'persona o grupo', 'personas o grupos') : 'Deportistas, clientes, grupos'}
          </p>
        </div>
        <button type="button" className="btn btn-acento" onClick={() => setParams({ nueva: '1' })}>
          <IconoMas width={18} height={18} /> Nueva
        </button>
      </div>

      {deportistas.length > CON_BUSCADOR && (
        <input
          className={`input ${s.buscar}`}
          type="search"
          placeholder="Buscar por nombre o nota…"
          value={buscar}
          onChange={(e) => setBuscar(e.target.value)}
          aria-label="Buscar ficha"
        />
      )}

      {archivadas.length > 0 && (
        <div className={s.pestanas} role="tablist" aria-label="Fichas activas o archivadas">
          <button type="button" role="tab" aria-selected={!verArchivo} onClick={() => setVerArchivo(false)}>
            Activas · {activas.length}
          </button>
          <button type="button" role="tab" aria-selected={verArchivo} onClick={() => setVerArchivo(true)}>
            Archivadas · {archivadas.length}
          </button>
        </div>
      )}

      {deportistas.length === 0 ? (
        <div className="empty">
          <h3>Todavía no hay fichas</h3>
          <p>
            Crea una por cada deportista, cliente o grupo sobre el que pronosticas. Si quieres ver cómo se ve primero, en
            Ajustes puedes cargar fichas de ejemplo.
          </p>
          <button type="button" className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setParams({ nueva: '1' })}>
            Crear la primera ficha
          </button>
        </div>
      ) : lista.length === 0 ? (
        <div className="empty">
          <p>{q ? `Ninguna ficha coincide con «${buscar}».` : 'No hay fichas archivadas.'}</p>
        </div>
      ) : (
        <>
          <ul className={s.lista}>
            {lista.map((d) => {
              const r = resumen.get(d.id)!
              return (
                <li key={d.id} className={s.fila}>
                  <Link to={`/deportistas/${d.id}`} className={s.enlace}>
                    <Avatar d={d} tam={44} />
                    <span className={s.texto}>
                      <span className={s.nombre}>{d.nombre}</span>
                      <span className={s.nota}>
                        {d.nota ?? ''}
                        {d.nota && r.pendientes > 0 && ' · '}
                        {r.pendientes > 0 && <span className={s.pend}>{plural(r.pendientes, 'pendiente', 'pendientes')}</span>}
                      </span>
                      <span className={s.etiquetas}>
                        <MiniCalibracion cierres={r.cierres} />
                        {d.ejemplo && <span className={s.ejemplo}>ejemplo</span>}
                      </span>
                    </span>
                    <Sparkline valores={r.semanas} color={d.color} ancho={72} alto={34} />
                  </Link>
                  <button type="button" className={s.mas} aria-label={`Editar o archivar ${d.nombre}`} onClick={() => setEditando(d)}>
                    ⋯
                  </button>
                </li>
              )
            })}
          </ul>
          <p className="note" style={{ marginTop: 12 }}>
            La curva es la carga semanal (RPE × minutos). La etiqueta dice cuánto te desvías cuando pronosticas sobre esa
            persona; los puntos, cuántos cierres faltan para saberlo.
          </p>
        </>
      )}

      {creando && <FormularioFicha onCerrar={cerrarCreacion} onCreada={(d) => nav(`/deportistas/${d.id}`, { replace: true })} />}
      {editando && <FormularioFicha ficha={editando} onCerrar={() => setEditando(null)} />}
    </>
  )
}
