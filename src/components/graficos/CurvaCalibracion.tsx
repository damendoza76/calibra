import { scaleLinear } from '@visx/scale'
import { m, useReducedMotion } from 'framer-motion'
import type { Analisis } from '../../domain/calibracion'
import s from './CurvaCalibracion.module.css'

const W = 320
const H = 300
const M = { l: 40, r: 12, t: 12, b: 44 }

/**
 * Lo que dijiste (eje horizontal) contra lo que pasó (vertical), por banda de confianza.
 * La diagonal es la calibración perfecta; la franja sombreada, dónde podría estar
 * cada punto con tan pocos registros. Se dibuja al entrar.
 */
export function CurvaCalibracion({ a }: { a: Analisis }) {
  const reducir = useReducedMotion()
  const x = scaleLinear<number>({ domain: [0, 100], range: [M.l, W - M.r] })
  const y = scaleLinear<number>({ domain: [0, 100], range: [H - M.b, M.t] })
  const ticks = [0, 25, 50, 75, 100]
  const radio = (n: number) => 5 + Math.min(Math.sqrt(n) * 2.3, 9)
  const linea = a.bandas.map((b, i) => `${i ? 'L' : 'M'}${x(b.dices).toFixed(1)},${y(b.ocurre).toFixed(1)}`).join(' ')
  const angulo = (-Math.atan2(y(0) - y(100), x(100) - x(0)) * 180) / Math.PI

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Curva de calibración: qué tan seguro estabas frente a cuántas veces ocurrió, por grupo de confianza. La diagonal marca la calibración perfecta."
    >
      {ticks.map((t) => (
        <g key={t}>
          <line x1={x(t)} x2={x(t)} y1={y(0)} y2={y(100)} className={s.rejilla} />
          <line x1={x(0)} x2={x(100)} y1={y(t)} y2={y(t)} className={s.rejilla} />
          <text x={x(t)} y={y(0) + 14} textAnchor="middle" className={s.eje}>
            {t}
          </text>
          <text x={x(0) - 6} y={y(t) + 3} textAnchor="end" className={s.eje}>
            {t}
          </text>
        </g>
      ))}
      {/* zonas: debajo = prometes de más; encima = te quedas corto */}
      <path d={`M${x(0)},${y(0)} L${x(100)},${y(100)} L${x(100)},${y(0)} Z`} className={s.zonaSobre} />
      <text x={x(96)} y={y(6)} textAnchor="end" className={s.zonaTxt}>
        prometes de más
      </text>
      <text x={x(4)} y={y(92)} className={s.zonaTxt}>
        te quedas corto
      </text>

      <line x1={x(0)} y1={y(0)} x2={x(100)} y2={y(100)} className={s.diagonal} />
      <text
        x={x(22)}
        y={y(22) - 7}
        className={s.diagTxt}
        transform={`rotate(${angulo} ${x(22)} ${y(22) - 7})`}
      >
        calibración perfecta
      </text>

      {/* franja de incertidumbre (Wilson 95 %) */}
      {a.bandas.map((b) => (
        <rect
          key={'f' + b.lo}
          x={x(b.dices) - 7}
          width={14}
          y={y(b.maximo)}
          height={Math.max(2, y(b.minimo) - y(b.maximo))}
          rx={7}
          className={s.franja}
        />
      ))}

      {a.bandas.length > 1 && (
        <m.path
          d={linea}
          className={s.linea}
          initial={reducir ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, ease: 'easeInOut', delay: 0.15 }}
        />
      )}
      {a.bandas.map((b, i) => (
        <m.g
          key={'p' + b.lo}
          initial={reducir ? false : { opacity: 0, scale: 0.3 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 + (i / Math.max(a.bandas.length, 1)) * 0.8, duration: 0.25 }}
          style={{ transformOrigin: `${x(b.dices)}px ${y(b.ocurre)}px`, transformBox: 'view-box' }}
        >
          <circle cx={x(b.dices)} cy={y(b.ocurre)} r={radio(b.n)} className={s.punto} />
          <text x={x(b.dices)} y={y(b.ocurre) + 3} textAnchor="middle" className={s.puntoN}>
            {b.n}
          </text>
        </m.g>
      ))}

      <text x={(M.l + W - M.r) / 2} y={H - 8} textAnchor="middle" className={s.titEje}>
        qué tan seguro estabas (%)
      </text>
      <text
        x={12}
        y={(M.t + H - M.b) / 2}
        textAnchor="middle"
        className={s.titEje}
        transform={`rotate(-90 12 ${(M.t + H - M.b) / 2})`}
      >
        cuántas veces ocurrió (%)
      </text>
    </svg>
  )
}

export function TablaBandas({ a }: { a: Analisis }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Grupo</th>
          <th>dijiste</th>
          <th>pasó</th>
          <th>veces</th>
        </tr>
      </thead>
      <tbody>
        {a.bandas.map((b) => (
          <tr key={b.lo}>
            <td>{b.nombre}</td>
            <td>{Math.round(b.dices)}%</td>
            <td>{Math.round(b.ocurre)}%</td>
            <td>
              {b.aciertos} de {b.n}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
