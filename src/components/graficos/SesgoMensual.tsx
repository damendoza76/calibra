import { scaleLinear, scalePoint } from '@visx/scale'
import { m, useReducedMotion } from 'framer-motion'
import { MARGEN_CALIBRADO, type PuntoMes } from '../../domain/calibracion'
import { mesCorto } from '../../domain/lenguaje'
import s from './SesgoMensual.module.css'

const W = 340
const H = 200
const M = { l: 30, r: 14, t: 16, b: 26 }

/** El desvío mes a mes. La franja verde es «bien calibrado»: acercarse a ella es el premio del hábito. */
export function SesgoMensual({ meses }: { meses: PuntoMes[] }) {
  const reducir = useReducedMotion()
  const lim = Math.max(20, ...meses.map((pt) => Math.abs(pt.sesgo))) + 4
  const x = scalePoint<string>({ domain: meses.map((pt) => pt.mes), range: [M.l + 14, W - M.r - 14], padding: 0 })
  const y = scaleLinear<number>({ domain: [-lim, lim], range: [H - M.b, M.t] })
  const fiables = meses.filter((pt) => pt.fiable)
  const linea = fiables.map((pt, i) => `${i ? 'L' : 'M'}${x(pt.mes)!.toFixed(1)},${y(pt.sesgo).toFixed(1)}`).join(' ')

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Cuántos puntos te desviaste cada mes. Arriba de cero prometes de más; abajo, te quedas corto.">
      <rect x={M.l} width={W - M.l - M.r} y={y(MARGEN_CALIBRADO)} height={y(-MARGEN_CALIBRADO) - y(MARGEN_CALIBRADO)} className={s.zona} />
      <line x1={M.l} x2={W - M.r} y1={y(0)} y2={y(0)} className={s.cero} />
      <text x={W - M.r} y={y(0) - 4} textAnchor="end" className={s.zonaTxt}>
        bien calibrado
      </text>
      <text x={M.l + 2} y={M.t + 2} className={s.lado}>
        ↑ prometes de más
      </text>
      <text x={M.l + 2} y={H - M.b - 4} className={s.lado}>
        ↓ te quedas corto
      </text>
      {[-20, 20].map((t) => (
        <text key={t} x={M.l - 5} y={y(t) + 3} textAnchor="end" className={s.eje}>
          {t > 0 ? '+' : '−'}
          {Math.abs(t)}
        </text>
      ))}
      <text x={M.l - 5} y={y(0) + 3} textAnchor="end" className={s.eje}>
        0
      </text>

      {linea && (
        <m.path
          d={linea}
          className={s.linea}
          initial={reducir ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.9, ease: 'easeInOut' }}
        />
      )}
      {meses.map((pt) => (
        <g key={pt.mes}>
          <circle
            cx={x(pt.mes)}
            cy={y(pt.sesgo)}
            r={pt.fiable ? 4 + Math.min(Math.sqrt(pt.n), 5) : 4}
            className={pt.fiable ? (Math.abs(pt.sesgo) < MARGEN_CALIBRADO ? s.puntoBien : s.punto) : s.puntoDebil}
          />
          <text x={x(pt.mes)} y={H - 8} textAnchor="middle" className={s.eje}>
            {mesCorto(pt.mes)}
          </text>
        </g>
      ))}
    </svg>
  )
}
