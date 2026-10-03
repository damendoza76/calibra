import type { DiaMapa } from '../../domain/calibracion'
import { fechaCorta, mesCorto } from '../../domain/lenguaje'
import s from './MapaConstancia.module.css'

const DIAS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

/** Calendario de cierres: cada cuadro es un día, más intenso cuantos más pronósticos cerraste. */
export function MapaConstancia({ dias }: { dias: DiaMapa[] }) {
  const semanas: DiaMapa[][] = []
  for (let i = 0; i < dias.length; i += 7) semanas.push(dias.slice(i, i + 7))
  const max = Math.max(1, ...dias.map((d) => d.n))
  const nivel = (n: number) => (n === 0 ? 0 : Math.min(4, Math.ceil((n / max) * 4)))
  const C = 18
  const G = 4
  const izq = 16
  const arriba = 14
  const W = izq + semanas.length * (C + G)
  const H = arriba + 7 * (C + G)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Calendario de las últimas semanas: cada cuadro es un día y su color, cuántos pronósticos cerraste.">
      {DIAS.map((d, i) =>
        i % 2 === 0 ? (
          <text key={i} x={0} y={arriba + i * (C + G) + C * 0.7} className={s.eje}>
            {d}
          </text>
        ) : null,
      )}
      {semanas.map((sem, k) => (
        <g key={k}>
          {sem[0] && (k === 0 || sem[0].fecha.slice(5, 7) !== semanas[k - 1][0].fecha.slice(5, 7)) && (
            <text x={izq + k * (C + G)} y={9} className={s.eje}>
              {mesCorto(sem[0].fecha.slice(0, 7))}
            </text>
          )}
          {sem.map((d, j) => (
            <rect
              key={d.fecha}
              x={izq + k * (C + G)}
              y={arriba + j * (C + G)}
              width={C}
              height={C}
              rx={4}
              className={s[`n${nivel(d.n)}`]}
            >
              <title>
                {fechaCorta(d.fecha)}: {d.n === 0 ? 'sin cierres' : `${d.n} cerrados, ${d.aciertos} ocurrieron`}
              </title>
            </rect>
          ))}
        </g>
      ))}
    </svg>
  )
}

export function LeyendaMapa() {
  return (
    <div className={s.leyenda}>
      menos
      {[0, 1, 2, 3, 4].map((n) => (
        <i key={n} className={s[`n${n}`]} />
      ))}
      más cierres
    </div>
  )
}
