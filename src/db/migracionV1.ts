import { colorPara } from '../domain/colores'
import { uid } from '../domain/ids'
import { aISO } from '../domain/lenguaje'
import { esRol } from '../domain/roles'
import type { Deportista, Prediccion, Rol } from '../domain/tipos'
import { guardarAjustes, leerAjustes, type CalibraDB } from './esquema'

/*
 * Migración desde la v1 (un solo HTML que guardaba todo en localStorage, clave «calibra.v1»).
 * - Cada nombre distinto del campo «sobre quién» se vuelve una ficha
 *   (sin importar mayúsculas ni espacios) y sus predicciones quedan enlazadas.
 * - El texto original se conserva en `quienV1`.
 * - La clave de la v1 NO se borra: queda como red de seguridad.
 */

export const CLAVE_V1 = 'calibra.v1'

type ItemV1 = {
  id: string
  label: string
  who?: string
  conf: number
  date?: string
  createdAt?: string
  status?: string
  outcome?: boolean | null
  closedAt?: string | null
}

function itemValido(x: unknown): x is ItemV1 {
  const it = x as ItemV1
  return (
    !!it &&
    typeof it.id === 'string' &&
    typeof it.label === 'string' &&
    typeof it.conf === 'number' &&
    it.conf >= 0 &&
    it.conf <= 100
  )
}

export function normalizarNombre(s: string): string {
  return s.normalize('NFC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('es')
}

const esFecha = (s: unknown): s is string => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s)

export type ResultadoV1 = {
  rol: Rol | null
  introVista: boolean
  deportistas: Deportista[] // solo las fichas nuevas
  predicciones: Prediccion[]
}

/** Convierte el estado de la v1 al modelo nuevo. Puro: no toca la base de datos. */
export function transformarV1(raw: unknown, ahora: Date, existentes: Deportista[] = []): ResultadoV1 | null {
  if (!raw || typeof raw !== 'object') return null
  const v1 = raw as { role?: unknown; onboarded?: unknown; items?: unknown }
  if (!Array.isArray(v1.items)) return null
  const rol: Rol | null = esRol(v1.role) ? v1.role : null
  const ahoraISO = ahora.toISOString()

  const porNombre = new Map<string, string>()
  // nunca se enlaza con una ficha de ejemplo: lo real no debe depender de algo que se puede borrar
  existentes.filter((d) => !d.ejemplo).forEach((d) => porNombre.set(normalizarNombre(d.nombre), d.id))
  const nuevas: Deportista[] = []

  const predicciones = v1.items.filter(itemValido).map((it): Prediccion => {
    let deportistaId: string | null = null
    const quien = typeof it.who === 'string' ? it.who.trim().replace(/\s+/g, ' ') : ''
    if (quien) {
      const clave = normalizarNombre(quien)
      let id = porNombre.get(clave)
      if (!id) {
        id = uid('d')
        porNombre.set(clave, id)
        nuevas.push({
          id,
          nombre: quien,
          color: colorPara(existentes.length + nuevas.length),
          archivado: false,
          creadoEn: it.createdAt ?? ahoraISO,
        })
      }
      deportistaId = id
    }
    const cerrada = it.status === 'cerrada' && typeof it.outcome === 'boolean'
    const creadaEn = typeof it.createdAt === 'string' ? it.createdAt : ahoraISO
    const fecha = esFecha(it.date) ? it.date : aISO(new Date(creadaEn))
    const p: Prediccion = {
      id: it.id,
      deportistaId,
      etiqueta: it.label.trim() || '(sin texto)',
      confianza: Math.round(it.conf),
      fecha,
      creadaEn,
      estado: cerrada ? 'cerrada' : 'pendiente',
      resultado: cerrada ? (it.outcome as boolean) : null,
      cerradaEn: cerrada ? (typeof it.closedAt === 'string' ? it.closedAt : creadaEn) : null,
      rol: rol ?? 'deportivo',
    }
    if (quien) p.quienV1 = it.who
    return p
  })

  return { rol, introVista: !!v1.onboarded, deportistas: nuevas, predicciones }
}

/** Guarda en la base lo transformado, sin duplicar ni sobreescribir nada. Devuelve cuántas predicciones entraron. */
export async function aplicarV1(db: CalibraDB, r: ResultadoV1): Promise<{ predicciones: number; deportistas: number }> {
  return db.transaction('rw', db.deportistas, db.predicciones, async () => {
    const ya = new Set(await db.predicciones.where('id').anyOf(r.predicciones.map((p) => p.id)).primaryKeys())
    const nuevas = r.predicciones.filter((p) => !ya.has(p.id))
    // solo las fichas que de verdad se usan
    const usadas = new Set(nuevas.map((p) => p.deportistaId))
    const fichas = r.deportistas.filter((d) => usadas.has(d.id))
    await db.deportistas.bulkAdd(fichas)
    await db.predicciones.bulkAdd(nuevas)
    return { predicciones: nuevas.length, deportistas: fichas.length }
  })
}

/**
 * Se ejecuta al abrir la app. Solo corre una vez por dispositivo: después queda la marca
 * `migradoV1En` y no vuelve a mirar (así «borrar todo» no resucita los datos viejos).
 */
export async function migrarDesdeV1(
  db: CalibraDB,
  almacen: Pick<Storage, 'getItem'> | null = typeof localStorage !== 'undefined' ? localStorage : null,
  ahora: Date = new Date(),
): Promise<{ predicciones: number; deportistas: number } | null> {
  const ajustes = await leerAjustes(db)
  if (ajustes.migradoV1En) return null
  let crudo: string | null = null
  try {
    crudo = almacen?.getItem(CLAVE_V1) ?? null
  } catch {
    crudo = null
  }
  let resultado: { predicciones: number; deportistas: number } | null = null
  if (crudo) {
    let parseado: unknown = null
    try {
      parseado = JSON.parse(crudo)
    } catch {
      parseado = null
    }
    const r = transformarV1(parseado, ahora, await db.deportistas.toArray())
    if (r) {
      resultado = await aplicarV1(db, r)
      await guardarAjustes(db, {
        rol: ajustes.rol ?? r.rol,
        introVista: ajustes.introVista || r.introVista,
      })
    }
  }
  await guardarAjustes(db, { migradoV1En: ahora.toISOString() })
  return resultado
}
