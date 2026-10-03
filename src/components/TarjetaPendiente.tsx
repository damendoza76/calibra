import { AnimatePresence, m } from 'framer-motion'
import { useState } from 'react'
import { fraseContradiccion } from '../domain/calibracion'
import { cuando, fechaCorta } from '../domain/lenguaje'
import { estadoPendiente } from '../domain/predicciones'
import type { Deportista, Prediccion } from '../domain/tipos'
import { Avatar } from './Avatar'
import { Sello } from './Sello'
import s from './TarjetaPendiente.module.css'

type Props = {
  p: Prediccion
  deportista: Deportista | null
  hoy: string
  onCerrar: (resultado: boolean) => void
  onBorrar?: () => void
  mostrarPersona?: boolean
}

/** Una pendiente (o una recién cerrada, mientras se ve el sello). */
export function TarjetaPendiente({ p, deportista, hoy, onCerrar, onBorrar, mostrarPersona = true }: Props) {
  const [armado, setArmado] = useState(false)
  // un solo cierre por tarjeta, aunque se toque dos veces seguidas
  const [cerrando, setCerrando] = useState(false)
  const cerrarUnaVez = (r: boolean) => {
    if (cerrando) return
    setCerrando(true)
    onCerrar(r)
  }
  const cerrada = p.estado === 'cerrada'
  const est = estadoPendiente(p, hoy)
  const contradice = cerrada && p.resultado !== null ? fraseContradiccion(p.confianza, p.resultado) : null

  return (
    <article className={`${s.tarjeta} ${!cerrada && est === 'vencida' ? s.vencida : ''} ${cerrada ? s.cerrada : ''}`}>
      <div className={s.arriba}>
        <div className={s.texto}>
          <p className={s.etiqueta}>{p.etiqueta}</p>
          <div className={s.meta}>
            {mostrarPersona && (
              <span className={s.quien}>
                <Avatar d={deportista} tam={18} />
                {deportista ? deportista.nombre : 'General'}
              </span>
            )}
            <span>{fechaCorta(p.fecha)}</span>
            {!cerrada && <span className={est === 'vencida' ? s.tarde : ''}>{cuando(p.fecha, hoy)}</span>}
          </div>
        </div>
        <Sello
          confianza={p.confianza}
          estado={cerrada ? (p.resultado ? 'si' : 'no') : 'pendiente'}
          estampar={cerrada}
        />
      </div>

      {!cerrada && (
        <div className={s.acciones}>
          {est === 'esperando' && <p className={s.aviso}>Todavía no llega la fecha, pero puedes cerrarla si ya sabes qué pasó.</p>}
          <div className={s.pregunta}>¿Qué pasó?</div>
          <div className="btn-row">
            <button type="button" className="btn btn-yes" disabled={cerrando} onClick={() => cerrarUnaVez(true)}>
              Sí ocurrió
            </button>
            <button type="button" className="btn btn-no" disabled={cerrando} onClick={() => cerrarUnaVez(false)}>
              No ocurrió
            </button>
          </div>
          {onBorrar && (
            <button
              type="button"
              className={`${s.borrar} ${armado ? s.borrarArmado : ''}`}
              onClick={() => {
                if (armado) return onBorrar()
                setArmado(true)
                setTimeout(() => setArmado(false), 4000)
              }}
            >
              {armado ? '¿Seguro? Toca otra vez para borrarla' : 'Me equivoqué al anotarla: borrar'}
            </button>
          )}
        </div>
      )}

      <AnimatePresence>
        {cerrada && (
          <m.p
            className={`${s.cierre} ${contradice ? s.honesta : ''}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.22 }}
            role="status"
          >
            {contradice ?? 'Cerrada. Ya cuenta para tu calibración.'}
          </m.p>
        )}
      </AnimatePresence>
    </article>
  )
}
