import { scaleBand, scaleLinear } from '@visx/scale'
import { useReducedMotion } from 'framer-motion'
import { BANDAS, type Analisis } from '../../domain/calibracion'
import s from './BarrasPareadas.module.css'

const W = 340
const H = 220
const M = { l: 28, r: 4, t: 18, b: 40 }
const CORTOS = ['casi no', 'poco', 'moneda', 'probable', 'casi sí']

/** Lo que dijiste vs. lo que pasó, banda por banda, una barra al lado de la otra. */
export function BarrasPareadas({ a }: { a: Analisis }) {
  const reducir = useReducedMotion()
  const x = scaleBand<number>({ domain: BANDAS.map((b) => b.lo), range: [M.l, W - M.r], padding: 0.22 })
  const y = scaleLinear<number>({ domain: [0, 100], range: [H - M.b, M.t] })
  const bw = x.bandwidth() / 2 - 1.5
  const porLo = new Map(a.bandas.map((b) => [b.lo, b]))

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Para cada grupo de confianza, una barra con lo que dijiste y otra con lo que pasó."
      className={reducir ? '' : s.animada}
    >
      {[0, 50, 100].map((t) => (
        <g key={t}>
          <line x1={M.l} x2={W - M.r} y1={y(t)} y2={y(t)} className={s.rejilla} />
          <text x={M.l - 5} y={y(t) + 3} textAnchor="end" className={s.eje}>
            {t}
          </text>
        </g>
      ))}
      {BANDAS.map((banda, i) => {
        const b = porLo.get(banda.lo)
        const x0 = x(banda.lo) ?? 0
        const centro = x0 + x.bandwidth() / 2
        return (
          <g key={banda.lo}>
            {b ? (
              <>
                <rect x={x0} y={y(b.dices)} width={bw} height={y(0) - y(b.dices)} rx={2} className={`${s.dijiste} ${s.barra}`} style={{ animationDelay: `${i * 60}ms` }} />
                <rect
                  x={x0 + bw + 3}
                  y={y(b.ocurre)}
                  width={bw}
                  height={Math.max(1, y(0) - y(b.ocurre))}
                  rx={2}
                  className={`${b.ocurre < b.dices - 8 ? s.pasoMenos : b.ocurre > b.dices + 8 ? s.pasoMas : s.pasoIgual} ${s.barra}`}
                  style={{ animationDelay: `${i * 60 + 120}ms` }}
                />
                <text x={x0 + bw / 2} y={y(b.dices) - 4} textAnchor="middle" className={s.valor}>
                  {Math.round(b.dices)}
                </text>
                <text x={x0 + bw * 1.5 + 3} y={y(b.ocurre) - 4} textAnchor="middle" className={s.valor}>
                  {Math.round(b.ocurre)}
                </text>
              </>
            ) : (
              <text x={centro} y={y(0) - 6} textAnchor="middle" className={s.vacio}>
                sin datos
              </text>
            )}
            <text x={centro} y={H - M.b + 14} textAnchor="middle" className={s.banda}>
              {CORTOS[i]}
            </text>
            <text x={centro} y={H - M.b + 26} textAnchor="middle" className={s.eje}>
              {b ? `${b.n} reg.` : ''}
            </text>
          </g>
        )
      })}
      <line x1={M.l} x2={W - M.r} y1={y(0)} y2={y(0)} className={s.base} />
    </svg>
  )
}

export function LeyendaBarras() {
  return (
    <div className={s.leyenda}>
      <span>
        <i className={s.dijiste} /> lo que dijiste
      </span>
      <span>
        <i className={s.pasoIgual} /> lo que pasó
      </span>
      <span>
        <i className={s.pasoMenos} /> pasó bastante menos
      </span>
    </div>
  )
}
