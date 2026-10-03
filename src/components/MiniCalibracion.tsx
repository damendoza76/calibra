import { analiza, MIN_CIERRES, tipoVeredicto, type Cierre } from '../domain/calibracion'
import s from './MiniCalibracion.module.css'

/** Micro-indicador de calibración de una persona: cuánto te desvías al pronosticar sobre ella. */
export function MiniCalibracion({ cierres }: { cierres: Cierre[] }) {
  if (cierres.length < MIN_CIERRES) {
    return (
      <span className={`${s.mini} ${s.pocos}`} title="Cierres que faltan para tener lectura">
        <span className={s.puntos} aria-hidden="true">
          {Array.from({ length: MIN_CIERRES }, (_, i) => (
            <i key={i} className={i < cierres.length ? s.lleno : ''} />
          ))}
        </span>
        <span className="sr-only">
          {cierres.length} de {MIN_CIERRES} cierres para tener lectura
        </span>
      </span>
    )
  }
  const a = analiza(cierres)!
  const tipo = tipoVeredicto(a)
  const n = Math.round(Math.abs(a.sesgo))
  const texto = tipo === 'bien' ? 'calibrado' : tipo === 'sobre' ? `+${n} de más` : `−${n} corto`
  const largo =
    tipo === 'bien'
      ? 'Con esta persona estás bien calibrado'
      : tipo === 'sobre'
        ? `Con esta persona sobreestimas unos ${n} puntos`
        : `Con esta persona subestimas unos ${n} puntos`
  return (
    <span className={`${s.mini} ${s[tipo]}`} aria-label={largo} title={largo}>
      {texto}
    </span>
  )
}
