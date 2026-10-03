import { plural, sumarDias } from './lenguaje'
import type { Sesion } from './tipos'

/*
 * Carga de entrenamiento con el RPE de sesión (Foster, 2001):
 *   carga = esfuerzo percibido (0-10) × minutos.
 * Es una cuantificación de la carga interna, NO un predictor de lesión.
 *
 * La expectativa se actualiza con la regla de la charla:
 *   nueva expectativa = previa + (1/n) × (real − previa)
 * que equivale al promedio de todas las sesiones. Es una simplificación pensada
 * para hacerse a mano; la variante usada en la literatura pondera más lo reciente
 * (EWMA, Williams et al., 2017), y su validez para predecir lesiones está en
 * discusión (Impellizzeri et al., 2020).
 */

export const ESCALA_FOSTER: { valor: number; etiqueta: string }[] = [
  { valor: 0, etiqueta: 'Reposo' },
  { valor: 1, etiqueta: 'Muy, muy fácil' },
  { valor: 2, etiqueta: 'Fácil' },
  { valor: 3, etiqueta: 'Moderado' },
  { valor: 4, etiqueta: 'Algo duro' },
  { valor: 5, etiqueta: 'Duro' },
  { valor: 6, etiqueta: 'Duro +' },
  { valor: 7, etiqueta: 'Muy duro' },
  { valor: 8, etiqueta: 'Muy duro +' },
  { valor: 9, etiqueta: 'Casi máximo' },
  { valor: 10, etiqueta: 'Máximo' },
]

export function etiquetaRPE(rpe: number): string {
  return ESCALA_FOSTER[Math.max(0, Math.min(10, Math.round(rpe)))].etiqueta
}

export function cargaSesion(rpe: number, minutos: number): number {
  return Math.round(rpe * minutos)
}

/** Paso de actualización: previa + (1/n)(real − previa). */
export function actualizar(previa: number, real: number, n: number): number {
  return previa + (real - previa) / n
}

/** Desvío marcado cuando la sesión se aparta más de este porcentaje de lo esperado. */
export const UMBRAL_DESVIO = 0.25
/** Hacen falta algunas sesiones previas antes de hablar de desvío. */
export const MIN_SESIONES_DESVIO = 3

export type PuntoCarga = {
  sesion: Sesion
  n: number // número de esta sesión (1, 2, 3…)
  previa: number | null // lo que esperabas antes de esta sesión
  nueva: number // expectativa para la siguiente
  desvio: 'arriba' | 'abajo' | null
}

export function ordenarSesiones(s: Sesion[]): Sesion[] {
  return [...s].sort((a, b) => (a.fecha === b.fecha ? a.id.localeCompare(b.id) : a.fecha.localeCompare(b.fecha)))
}

export function expectativas(sesiones: Sesion[]): PuntoCarga[] {
  const out: PuntoCarga[] = []
  let previa: number | null = null
  ordenarSesiones(sesiones).forEach((s, i) => {
    const n = i + 1
    const nueva = previa === null ? s.carga : actualizar(previa, s.carga, n)
    let desvio: PuntoCarga['desvio'] = null
    if (previa !== null && i >= MIN_SESIONES_DESVIO && previa > 0) {
      const rel = (s.carga - previa) / previa
      if (rel > UMBRAL_DESVIO) desvio = 'arriba'
      else if (rel < -UMBRAL_DESVIO) desvio = 'abajo'
    }
    out.push({ sesion: s, n, previa, nueva, desvio })
    previa = nueva
  })
  return out
}

export type Actualizacion = { previa: number; real: number; nueva: number; n: number }

/** Lo que muestra la animación al registrar una sesión: previa → real → nueva. */
export function actualizacionPorSesion(anteriores: Sesion[], cargaNueva: number): Actualizacion | null {
  const pts = expectativas(anteriores)
  if (!pts.length) return null
  const previa = pts[pts.length - 1].nueva
  const n = pts.length + 1
  return { previa, real: cargaNueva, nueva: actualizar(previa, cargaNueva, n), n }
}

export function fraseActualizacion(a: Actualizacion): string {
  const p = Math.round(a.previa)
  const q = Math.round(a.nueva)
  if (q < p) return `Tu expectativa para la próxima sesión baja de ${p} a ${q}.`
  if (q > p) return `Tu expectativa para la próxima sesión sube de ${p} a ${q}.`
  return `Tu expectativa para la próxima sesión se queda en ${q}.`
}

export type DiaCarga = { fecha: string; carga: number; expectativa: number | null; desvio: 'arriba' | 'abajo' | null }

/** Serie diaria para la curva: carga del día (barras) y expectativa vigente (línea). */
export function serieDiaria(sesiones: Sesion[], hoy: string, dias = 42): DiaCarga[] {
  const pts = expectativas(sesiones)
  const inicio = sumarDias(hoy, -(dias - 1))
  const out: DiaCarga[] = []
  let k = 0
  let expectativa: number | null = null
  for (let f = inicio; f <= hoy; f = sumarDias(f, 1)) {
    let carga = 0
    let desvio: DiaCarga['desvio'] = null
    while (k < pts.length && pts[k].sesion.fecha <= f) {
      if (pts[k].sesion.fecha === f) {
        carga += pts[k].sesion.carga
        desvio = pts[k].desvio ?? desvio
      }
      expectativa = pts[k].nueva
      k++
    }
    out.push({ fecha: f, carga, expectativa, desvio })
  }
  return out
}

/** Suma de carga por bloques de 7 días que terminan hoy (la más reciente al final). */
export function cargaSemanal(sesiones: Sesion[], hoy: string, semanas = 8): number[] {
  const out = new Array<number>(semanas).fill(0)
  const inicio = sumarDias(hoy, -(semanas * 7 - 1))
  for (const s of sesiones) {
    if (s.fecha < inicio || s.fecha > hoy) continue
    const dia = Math.round((Date.parse(s.fecha + 'T12:00:00Z') - Date.parse(inicio + 'T12:00:00Z')) / 86400000)
    out[Math.floor(dia / 7)] += s.carga
  }
  return out
}

export function fraseCurvaCarga(serie: DiaCarga[]): string {
  const conSesion = serie.filter((d) => d.carga > 0)
  if (!conSesion.length) return 'Registra la primera sesión y aquí aparece su carga del día.'
  const desvios = serie.filter((d) => d.desvio)
  const semanas = Math.round(serie.length / 7)
  if (!desvios.length)
    return `En las últimas ${semanas} semanas, ninguna sesión se salió mucho de lo que esperabas. La línea es tu expectativa; las barras, lo que pasó.`
  return `En las últimas ${semanas} semanas, ${plural(desvios.length, 'día se salió', 'días se salieron')} más de un 25 % de lo que esperabas (marcados con un punto). La línea es tu expectativa; las barras, lo que pasó.`
}
