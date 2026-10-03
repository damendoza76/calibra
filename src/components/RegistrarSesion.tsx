import { useState } from 'react'
import { db, registrarSesion } from '../db'
import { cargaSesion, ESCALA_FOSTER, etiquetaRPE } from '../domain/carga'
import { fechaCorta, sumarDias } from '../domain/lenguaje'
import { ReglaRota } from '../domain/predicciones'
import type { Deportista, Sesion } from '../domain/tipos'
import { CaraRPE } from './CaraRPE'
import r from './DeslizadorConfianza.module.css'
import { Hoja } from './Hoja'
import s from './RegistrarSesion.module.css'

const TIPOS = ['fuerza', 'pista', 'técnica', 'partido', 'resistencia']

/** RPE de sesión (Foster): esfuerzo percibido 0-10 × minutos. La carga se calcula en vivo. */
export function RegistrarSesion({
  d,
  hoy,
  onCerrar,
  onGuardada,
}: {
  d: Deportista
  hoy: string
  onCerrar: () => void
  onGuardada: (s: Sesion) => void
}) {
  const [rpe, setRpe] = useState(5)
  const [minutos, setMinutos] = useState(60)
  const [fecha, setFecha] = useState(hoy)
  const [tipo, setTipo] = useState<string | undefined>()
  const [error, setError] = useState('')
  const carga = cargaSesion(rpe, minutos)

  async function guardar() {
    try {
      const nueva = await registrarSesion(db, { deportistaId: d.id, fecha, rpe, minutos, tipo })
      onGuardada(nueva)
    } catch (e) {
      setError(e instanceof ReglaRota ? e.message : 'No se pudo guardar la sesión.')
    }
  }

  return (
    <Hoja titulo="Registrar sesión" onCerrar={onCerrar}>
      <p className={s.quien}>
        {d.nombre} · {fecha === hoy ? 'hoy' : fechaCorta(fecha)}
      </p>

      <div className={s.bloque}>
        <label className="lbl" htmlFor="rpe">
          ¿Qué tan dura fue la sesión? (RPE 0-10)
        </label>
        <div className={s.rpeCabeza}>
          <CaraRPE rpe={rpe} />
          <span className={`${s.rpeNum} num`}>{rpe}</span>
          <span className={s.rpeTxt}>{etiquetaRPE(rpe)}</span>
        </div>
        <input
          id="rpe"
          className={r.rango}
          type="range"
          min={0}
          max={10}
          step={1}
          value={rpe}
          onChange={(e) => setRpe(parseInt(e.target.value, 10))}
          aria-valuetext={`${rpe}, ${etiquetaRPE(rpe)}`}
          style={{ ['--p' as string]: `${rpe * 10}%` }}
        />
        <div className={s.marcas} aria-hidden="true">
          {ESCALA_FOSTER.map((x) => (
            <span key={x.valor} className={x.valor === rpe ? s.marcaActiva : ''}>
              {x.valor}
            </span>
          ))}
        </div>
        <p className="note" style={{ marginTop: 4 }}>
          Pregúntalo unos 30 minutos después de terminar: «¿qué tan dura fue la sesión?»
        </p>
      </div>

      <div className={s.bloque}>
        <label className="lbl" htmlFor="minutos">
          ¿Cuántos minutos?
        </label>
        <div className={s.rpeCabeza}>
          <span className={`${s.rpeNum} num`}>{minutos}</span>
          <span className={s.rpeTxt}>minutos</span>
        </div>
        <input
          id="minutos"
          className={r.rango}
          type="range"
          min={5}
          max={180}
          step={5}
          value={minutos}
          onChange={(e) => setMinutos(parseInt(e.target.value, 10))}
          aria-valuetext={`${minutos} minutos`}
          style={{ ['--p' as string]: `${((minutos - 5) / 175) * 100}%` }}
        />
        <div className={r.escala} aria-hidden="true">
          <span>5</span>
          <span>90</span>
          <span>180 min</span>
        </div>
      </div>

      <div className={s.carga} aria-live="polite">
        <span className={s.cargaK}>carga de la sesión</span>
        <span className={`${s.cargaV} num`}>{carga}</span>
        <span className={s.cargaF}>
          {rpe} × {minutos} min
        </span>
      </div>

      <div className={s.bloque}>
        <span className="lbl">Tipo y fecha (opcional)</span>
        <div className={s.chips}>
          {TIPOS.map((t) => (
            <button
              key={t}
              type="button"
              className={`${s.chip} ${tipo === t ? s.chipActiva : ''}`}
              aria-pressed={tipo === t}
              onClick={() => setTipo(tipo === t ? undefined : t)}
            >
              {t}
            </button>
          ))}
        </div>
        <div className={s.fechas}>
          <button type="button" className={`${s.chip} ${fecha === hoy ? s.chipActiva : ''}`} onClick={() => setFecha(hoy)}>
            hoy
          </button>
          <button
            type="button"
            className={`${s.chip} ${fecha === sumarDias(hoy, -1) ? s.chipActiva : ''}`}
            onClick={() => setFecha(sumarDias(hoy, -1))}
          >
            ayer
          </button>
          <input
            type="date"
            className="input"
            value={fecha}
            max={hoy}
            onChange={(e) => e.target.value && setFecha(e.target.value)}
            aria-label="Fecha de la sesión"
          />
        </div>
      </div>

      {error && (
        <p className="status-line bad" role="alert">
          {error}
        </p>
      )}
      <div className={s.pie}>
        <button type="button" className="btn btn-primary" onClick={guardar}>
          Guardar sesión · carga {carga}
        </button>
      </div>
    </Hoja>
  )
}
