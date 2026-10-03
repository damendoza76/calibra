import { animate, m, useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { fraseActualizacion, type Actualizacion } from '../domain/carga'
import s from './ActualizacionAnimada.module.css'

/**
 * El corazón pedagógico de la charla: lo que esperabas → lo que pasó → tu nueva expectativa.
 * Cada vez que cambia `clave` (una sesión nueva), la secuencia se vuelve a reproducir.
 */
export function ActualizacionAnimada({ a, clave, nombre }: { a: Actualizacion; clave: string; nombre?: string }) {
  const reducir = useReducedMotion()
  const p = Math.round(a.previa)
  const r = Math.round(a.real)
  const q = Math.round(a.nueva)
  const [mostrado, setMostrado] = useState(reducir ? q : p)

  useEffect(() => {
    if (reducir) {
      setMostrado(q)
      return
    }
    setMostrado(p)
    const ctl = animate(p, q, {
      duration: 0.9,
      delay: 0.85,
      ease: [0.2, 0.7, 0.2, 1],
      onUpdate: (v) => setMostrado(Math.round(v)),
    })
    return () => ctl.stop()
  }, [clave, p, q, reducir])

  const paso = (i: number) =>
    reducir
      ? {}
      : {
          initial: { opacity: 0, y: 8 },
          animate: { opacity: 1, y: 0 },
          transition: { delay: i * 0.35, duration: 0.22 },
        }

  return (
    <div className={s.caja} key={clave}>
      <div className={s.fila} aria-hidden="true">
        <m.div className={s.col} {...paso(0)}>
          <span className={`${s.n} num`}>{p}</span>
          <span className={s.k}>lo que esperabas</span>
        </m.div>
        <m.span className={s.flecha} {...paso(1)}>
          →
        </m.span>
        <m.div className={s.col} {...paso(1)}>
          <span className={`${s.n} ${s.real} num`}>{r}</span>
          <span className={s.k}>lo que pasó</span>
        </m.div>
        <m.span className={s.flecha} {...paso(2)}>
          →
        </m.span>
        <m.div className={s.col} {...paso(2)}>
          <span className={`${s.n} ${s.nueva} num`}>{mostrado}</span>
          <span className={s.k}>tu nueva expectativa</span>
        </m.div>
      </div>
      <m.p className={s.frase} {...paso(3)}>
        {fraseActualizacion(a)}
        {nombre ? ` (${nombre})` : ''}
      </m.p>
      <p className={s.formula}>
        {p} + (1/{a.n}) × ({r} − {p}) = {q}
      </p>
      {a.n >= 12 && (
        <p className={s.pie}>
          Con {a.n} sesiones, cada una nueva pesa 1/{a.n}: la expectativa ya se mueve poco. Por eso en la práctica se usan
          promedios que pesan más lo reciente.
        </p>
      )}
    </div>
  )
}
