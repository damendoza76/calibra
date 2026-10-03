import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Encabezado } from '../components/Encabezado'
import { IconoCandado } from '../components/Iconos'
import { TarjetaPendiente } from '../components/TarjetaPendiente'
import { useCierres } from '../components/useCierres'
import { useDatos } from '../datos'
import { fechaCorta, plural } from '../domain/lenguaje'
import { estadoPendiente, ordenarCerradas, ordenarPendientes } from '../domain/predicciones'
import type { Prediccion } from '../domain/tipos'
import s from './Pendientes.module.css'

const PAGINA_CERRADAS = 40

export function Pendientes() {
  const { predicciones, porId, hoy } = useDatos()
  const { cerrarConSello, borrar, conRecientes } = useCierres()
  const [verCerradas, setVerCerradas] = useState(PAGINA_CERRADAS)

  const todas = conRecientes(ordenarPendientes(predicciones), (ps) =>
    [...ps].sort((a, b) => a.fecha.localeCompare(b.fecha) || a.creadaEn.localeCompare(b.creadaEn)),
  )
  // una recién cerrada se queda en su grupo mientras se ve el sello, para que nada salte
  const grupo = (p: Prediccion) => estadoPendiente(p, hoy)
  const vencidas = todas.filter((p) => grupo(p) === 'vencida')
  const listas = todas.filter((p) => grupo(p) === 'lista')
  const esperando = todas.filter((p) => grupo(p) === 'esperando')
  const abiertas = todas.filter((p) => p.estado === 'pendiente').length

  const cerradas = ordenarCerradas(predicciones)

  const tarjetas = (ps: Prediccion[]) => (
    <div className={s.lista}>
      {ps.map((p) => (
        <TarjetaPendiente
          key={p.id}
          p={p}
          deportista={p.deportistaId ? porId.get(p.deportistaId) ?? null : null}
          hoy={hoy}
          onCerrar={(r) => cerrarConSello(p, r)}
          onBorrar={() => borrar(p)}
        />
      ))}
    </div>
  )

  return (
    <>
      <Encabezado />
      <div className="sec-title">
        <h1 className={s.titulo}>Pendientes</h1>
        {abiertas > 0 && <span className="count">{plural(abiertas, 'abierta', 'abiertas')}</span>}
      </div>

      {vencidas.some((p) => p.estado === 'pendiente') && (
        <div className="banner banner-warn">
          <span className="ic">◷</span>
          <span>
            <strong>
              {vencidas.length === 1 ? '1 pronóstico lleva' : `${vencidas.length} pronósticos llevan`} más de una semana sin
              cerrar.
            </strong>{' '}
            El hábito no es pronosticar: es pronosticar y después comparar. Ciérralos aunque el resultado no te guste.
          </span>
        </div>
      )}

      {todas.length === 0 && (
        <div className="empty">
          <h3>Nada pendiente</h3>
          <p>Cuando anotes un pronóstico aparecerá aquí, esperando a que sepas qué pasó.</p>
          <Link to="/anotar" className="btn btn-primary" style={{ marginTop: 16 }}>
            Anotar predicción
          </Link>
        </div>
      )}

      {vencidas.length > 0 && (
        <section aria-labelledby="g-vencidas">
          <h2 id="g-vencidas" className={`${s.grupo} ${s.grupoTarde}`}>
            Vencidas · más de una semana
          </h2>
          {tarjetas(vencidas)}
        </section>
      )}
      {listas.length > 0 && (
        <section aria-labelledby="g-listas">
          <h2 id="g-listas" className={s.grupo}>
            Ya se pueden cerrar
          </h2>
          {tarjetas(listas)}
        </section>
      )}
      {esperando.length > 0 && (
        <section aria-labelledby="g-esperando">
          <h2 id="g-esperando" className={s.grupo}>
            Todavía no llega la fecha
          </h2>
          {tarjetas(esperando)}
        </section>
      )}

      <div className="sec-title" style={{ marginTop: 36 }}>
        <h2>Ya cerradas</h2>
        {cerradas.length > 0 && <span className="count">{cerradas.length}</span>}
      </div>

      {cerradas.length === 0 ? (
        <div className="empty">
          <p>Todavía no has cerrado ninguna. La primera vez que marques un resultado empieza tu historial.</p>
        </div>
      ) : (
        <div className={`card ${s.historial}`} data-testid="historial">
          <ul className={s.filas}>
            {cerradas.slice(0, verCerradas).map((p) => {
              const d = p.deportistaId ? porId.get(p.deportistaId) ?? null : null
              return (
                <li key={p.id} className={s.fila}>
                  <span className={`${s.marca} ${p.resultado ? s.si : s.no}`} aria-hidden="true">
                    {p.resultado ? '✓' : '✗'}
                  </span>
                  <span className={s.texto}>
                    {p.etiqueta}
                    <small>
                      <span className={s.punto} style={{ background: d?.color ?? 'var(--line-2)' }} aria-hidden="true" />
                      {d ? d.nombre : 'General'} · {fechaCorta(p.fecha)} · {p.resultado ? 'ocurrió' : 'no ocurrió'}
                    </small>
                  </span>
                  <span className={`${s.conf} num`} aria-label={`Confianza ${p.confianza}%`}>
                    {p.confianza}%
                  </span>
                </li>
              )
            })}
          </ul>
          {cerradas.length > verCerradas && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setVerCerradas((n) => n + PAGINA_CERRADAS)}>
              Ver {Math.min(PAGINA_CERRADAS, cerradas.length - verCerradas)} más de {cerradas.length - verCerradas}
            </button>
          )}
          <p className={s.congelada}>
            <IconoCandado /> La confianza de una predicción cerrada queda congelada: no se puede editar ni borrar.
          </p>
        </div>
      )}
    </>
  )
}
