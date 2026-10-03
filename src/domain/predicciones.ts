import { uid } from './ids'
import { diasDesde } from './lenguaje'
import type { Prediccion, Rol } from './tipos'

/*
 * La regla de Calibra, en código:
 * la predicción se anota antes de conocer el resultado y la confianza queda congelada.
 * Aquí solo existen dos operaciones: crear y cerrar. No hay «editar».
 */

export const DIAS_VENCIDA = 7

export type NuevaPrediccion = {
  deportistaId: string | null
  etiqueta: string
  confianza: number
  fecha: string
  rol: Rol
}

export class ReglaRota extends Error {
  constructor(mensaje: string) {
    super(mensaje)
    this.name = 'ReglaRota'
  }
}

export function crearPrediccion(d: NuevaPrediccion, ahora: Date = new Date()): Prediccion {
  const etiqueta = d.etiqueta.trim()
  if (!etiqueta) throw new ReglaRota('Escribe en una línea qué crees que va a pasar.')
  if (!Number.isFinite(d.confianza) || d.confianza < 0 || d.confianza > 100)
    throw new ReglaRota('La confianza va de 0 a 100.')
  return {
    id: uid('p'),
    deportistaId: d.deportistaId,
    etiqueta,
    confianza: Math.round(d.confianza),
    fecha: d.fecha,
    creadaEn: ahora.toISOString(),
    estado: 'pendiente',
    resultado: null,
    cerradaEn: null,
    rol: d.rol,
  }
}

/** Cierra una pendiente. La confianza no es un parámetro: se conserva tal cual. */
export function cerrarPrediccion(p: Prediccion, resultado: boolean, ahora: Date = new Date()): Prediccion {
  if (p.estado === 'cerrada') throw new ReglaRota('Esta predicción ya está cerrada: no se puede volver a cerrar.')
  return { ...p, estado: 'cerrada', resultado, cerradaEn: ahora.toISOString() }
}

/** Campos que nunca cambian después de anotar. */
export const CAMPOS_CONGELADOS = ['id', 'etiqueta', 'confianza', 'creadaEn', 'rol'] as const
/** Lo único que cerrar puede tocar. */
const CAMPOS_DE_CIERRE = ['estado', 'resultado', 'cerradaEn']
/** Siempre se puede reasignar a otra ficha (o a «general» si una ficha se borra). */
const CAMPOS_LIBRES = ['deportistaId']

/**
 * ¿Se permite pasar de `antes` a `despues`? Devuelve el motivo si no.
 * Es el guardián que usa la base de datos ante cualquier actualización.
 */
export function motivoRechazo(antes: Prediccion, despues: Prediccion): string | null {
  for (const k of CAMPOS_CONGELADOS) {
    if (antes[k] !== despues[k]) return `El campo «${k}» queda congelado desde que se anota la predicción.`
  }
  const cambiados = (Object.keys({ ...antes, ...despues }) as (keyof Prediccion)[]).filter(
    (k) => antes[k] !== despues[k],
  )
  if (antes.estado === 'cerrada') {
    const prohibido = cambiados.find((k) => !CAMPOS_LIBRES.includes(k))
    if (prohibido) return 'Una predicción cerrada no se puede editar.'
    return null
  }
  // pendiente: solo se puede cerrar (o reasignar)
  const prohibido = cambiados.find((k) => !CAMPOS_DE_CIERRE.includes(k) && !CAMPOS_LIBRES.includes(k))
  if (prohibido) return `El campo «${prohibido}» no se edita: si te equivocaste, borra la pendiente y anótala de nuevo.`
  if (cambiados.some((k) => CAMPOS_DE_CIERRE.includes(k))) {
    if (despues.estado !== 'cerrada' || typeof despues.resultado !== 'boolean' || !despues.cerradaEn)
      return 'Una pendiente solo puede pasar a cerrada, con su resultado.'
  }
  return null
}

export type EstadoPendiente = 'esperando' | 'lista' | 'vencida'

/** esperando = todavía no llega la fecha; lista = ya se puede cerrar; vencida = más de una semana sin cerrar. */
export function estadoPendiente(p: Prediccion, hoy: string): EstadoPendiente {
  const d = diasDesde(p.fecha, hoy)
  if (d > DIAS_VENCIDA) return 'vencida'
  if (d >= 0) return 'lista'
  return 'esperando'
}

export function ordenarPendientes(ps: Prediccion[]): Prediccion[] {
  return ps
    .filter((p) => p.estado === 'pendiente')
    .sort((a, b) => (a.fecha === b.fecha ? a.creadaEn.localeCompare(b.creadaEn) : a.fecha.localeCompare(b.fecha)))
}

export function ordenarCerradas(ps: Prediccion[]): Prediccion[] {
  return ps
    .filter((p) => p.estado === 'cerrada')
    .sort((a, b) => (b.cerradaEn ?? '').localeCompare(a.cerradaEn ?? ''))
}
