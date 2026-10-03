import { iniciales } from '../domain/lenguaje'
import type { Deportista } from '../domain/tipos'
import s from './Avatar.module.css'

export function Avatar({ d, tam = 40 }: { d: Pick<Deportista, 'nombre' | 'color' | 'foto'> | null; tam?: number }) {
  const estilo = { width: tam, height: tam, fontSize: tam * 0.4 }
  if (!d) {
    return (
      <span className={`${s.avatar} ${s.general}`} style={estilo} aria-hidden="true">
        ∗
      </span>
    )
  }
  if (d.foto) return <img className={s.avatar} src={d.foto} alt="" style={estilo} />
  return (
    <span className={s.avatar} style={{ ...estilo, background: d.color }} aria-hidden="true">
      {iniciales(d.nombre)}
    </span>
  )
}
