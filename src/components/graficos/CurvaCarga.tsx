import { scaleBand, scaleLinear } from '@visx/scale'
import { useReducedMotion } from 'framer-motion'
import type { DiaCarga } from '../../domain/carga'
import { fechaCorta } from '../../domain/lenguaje'
import s from './CurvaCarga.module.css'

const W = 340
const H = 190
const M = { l: 34, r: 6, t: 14, b: 24 }

/** Carga diaria (barras) y la expectativa que se va actualizando (línea). Los desvíos llevan un punto. */
export function CurvaCarga({ serie, color }: { serie: DiaCarga[]; color: string }) {
  const reducir = useReducedMotion()
  const max = Math.max(1, ...serie.map((d) => Math.max(d.carga, d.expectativa ?? 0))) * 1.12
  const x = scaleBand<string>({ domain: serie.map((d) => d.fecha), range: [M.l, W - M.r], padding: 0.25 })
  const y = scaleLinear<number>({ domain: [0, max], range: [H - M.b, M.t], nice: true })
  const ticks = y.ticks(3)
  const bw = x.bandwidth()
  const centro = (f: string) => (x(f) ?? 0) + bw / 2

  const linea = serie
    .filter((d) => d.expectativa !== null)
    .map((d, i) => `${i ? 'L' : 'M'}${centro(d.fecha).toFixed(1)},${y(d.expectativa!).toFixed(1)}`)
    .join(' ')

  const etiquetasX = [serie[0], serie[Math.floor(serie.length / 2)], serie[serie.length - 1]].filter(Boolean)

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Carga de cada día en barras y tu expectativa en una línea. Los puntos marcan los días que se salieron mucho de lo esperado."
      className={reducir ? '' : s.animada}
    >
      {ticks.map((t) => (
        <g key={t}>
          <line x1={M.l} x2={W - M.r} y1={y(t)} y2={y(t)} className={s.rejilla} />
          <text x={M.l - 6} y={y(t) + 3} textAnchor="end" className={s.eje}>
            {t}
          </text>
        </g>
      ))}
      {serie.map((d, i) =>
        d.carga > 0 ? (
          <rect
            key={d.fecha}
            x={x(d.fecha)}
            y={y(d.carga)}
            width={bw}
            height={H - M.b - y(d.carga)}
            rx={Math.min(2, bw / 3)}
            fill={color}
            opacity={d.desvio ? 1 : 0.62}
            className={s.barra}
            style={{ animationDelay: `${i * 8}ms` }}
          />
        ) : null,
      )}
      {linea && <path d={linea} className={s.linea} />}
      {serie
        .filter((d) => d.desvio)
        .map((d) => (
          <circle
            key={'dv' + d.fecha}
            cx={centro(d.fecha)}
            cy={y(d.carga) - 7}
            r={3.6}
            className={d.desvio === 'arriba' ? s.desvioArriba : s.desvioAbajo}
          />
        ))}
      <line x1={M.l} x2={W - M.r} y1={H - M.b} y2={H - M.b} className={s.base} />
      {etiquetasX.map((d, i) => (
        <text
          key={d.fecha + i}
          x={i === 0 ? M.l : i === 2 ? W - M.r : centro(d.fecha)}
          y={H - 6}
          textAnchor={i === 0 ? 'start' : i === 2 ? 'end' : 'middle'}
          className={s.eje}
        >
          {fechaCorta(d.fecha).replace(/ \d{4}$/, '')}
        </text>
      ))}
    </svg>
  )
}

export function LeyendaCarga({ color }: { color: string }) {
  return (
    <div className={s.leyenda}>
      <span>
        <i style={{ background: color }} /> carga del día
      </span>
      <span>
        <i className={s.lLinea} /> lo que esperabas
      </span>
      <span>
        <i className={s.lArriba} /> se pasó
      </span>
      <span>
        <i className={s.lAbajo} /> se quedó corta
      </span>
    </div>
  )
}
