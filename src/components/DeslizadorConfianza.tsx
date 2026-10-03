import { confWord } from '../domain/lenguaje'
import s from './DeslizadorConfianza.module.css'

/** «¿Qué tan seguro estás?»: número grande, lectura en palabras y un deslizador amplio. */
export function DeslizadorConfianza({ valor, onCambio, id = 'confianza' }: { valor: number; onCambio: (v: number) => void; id?: string }) {
  return (
    <div className={s.caja}>
      <div className={s.cabeza}>
        <label className="lbl" htmlFor={id} style={{ marginBottom: 0 }}>
          ¿Qué tan seguro estás?
        </label>
      </div>
      <div className={s.lectura} aria-hidden="true">
        <span className={`${s.valor} num`}>{valor}%</span>
        <span className={s.palabra}>{confWord(valor)}</span>
      </div>
      <input
        id={id}
        className={s.rango}
        type="range"
        min={0}
        max={100}
        step={5}
        value={valor}
        onChange={(e) => onCambio(parseInt(e.target.value, 10))}
        aria-valuetext={`${valor}%, ${confWord(valor)}`}
        style={{ ['--p' as string]: `${valor}%` }}
      />
      <div className={s.escala} aria-hidden="true">
        <span>0 · no pasa</span>
        <span>50 · moneda al aire</span>
        <span>100 · seguro</span>
      </div>
    </div>
  )
}
