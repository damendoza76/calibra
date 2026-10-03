import { esRol } from '../domain/roles'
import type { Deportista, Prediccion, Sesion, Tema } from '../domain/tipos'
import { guardarAjustes, leerAjustes, type CalibraDB } from './esquema'
import { aplicarV1, transformarV1 } from './migracionV1'

export type Respaldo = {
  app: 'calibra'
  v: 2
  exportado: string
  ajustes: { rol: string | null; tema: Tema }
  deportistas: Deportista[]
  predicciones: Prediccion[]
  sesiones: Sesion[]
}

const porId = <T extends { id: string }>(a: T, b: T) => a.id.localeCompare(b.id)

export async function exportar(db: CalibraDB, ahora: Date = new Date()): Promise<Respaldo> {
  const ajustes = await leerAjustes(db)
  return {
    app: 'calibra',
    v: 2,
    exportado: ahora.toISOString(),
    ajustes: { rol: ajustes.rol, tema: ajustes.tema },
    deportistas: (await db.deportistas.toArray()).sort(porId),
    predicciones: (await db.predicciones.toArray()).sort(porId),
    sesiones: (await db.sesiones.toArray()).sort(porId),
  }
}

export function respaldoComoTexto(r: Respaldo): string {
  return JSON.stringify(r)
}

export class RespaldoInvalido extends Error {}

export type ResumenImportacion = { deportistas: number; predicciones: number; sesiones: number; formato: 'v1' | 'v2' }

const esTexto = (x: unknown) => typeof x === 'string'

function deportistaValido(x: unknown): x is Deportista {
  const d = x as Deportista
  return !!d && esTexto(d.id) && esTexto(d.nombre) && esTexto(d.color) && typeof d.archivado === 'boolean'
}
function prediccionValida(x: unknown): x is Prediccion {
  const p = x as Prediccion
  if (!p || !esTexto(p.id) || !esTexto(p.etiqueta) || !esTexto(p.fecha) || !esTexto(p.creadaEn)) return false
  if (typeof p.confianza !== 'number' || p.confianza < 0 || p.confianza > 100) return false
  if (!esRol(p.rol)) return false
  if (p.estado === 'cerrada') return typeof p.resultado === 'boolean' && esTexto(p.cerradaEn)
  return p.estado === 'pendiente' && p.resultado === null
}
function sesionValida(x: unknown): x is Sesion {
  const s = x as Sesion
  return !!s && esTexto(s.id) && esTexto(s.deportistaId) && esTexto(s.fecha) && typeof s.rpe === 'number' && typeof s.minutos === 'number' && typeof s.carga === 'number'
}

/**
 * Trae un respaldo (de la v2, o el «copiar respaldo» de la v1).
 * Se suma a lo que ya hay: lo que tenga un id existente se ignora.
 * Nunca sobreescribe: una predicción ya guardada conserva su confianza.
 */
export async function importar(db: CalibraDB, texto: string, ahora: Date = new Date()): Promise<ResumenImportacion> {
  let p: unknown
  try {
    p = JSON.parse(texto)
  } catch {
    throw new RespaldoInvalido('Ese texto no es un respaldo de Calibra. Pega el contenido completo, desde la primera llave.')
  }
  const obj = p as Partial<Respaldo> & { items?: unknown; role?: unknown }

  if (obj && Array.isArray(obj.items)) {
    const r = transformarV1(obj, ahora, await db.deportistas.toArray())
    if (!r) throw new RespaldoInvalido('No encontré predicciones en ese respaldo.')
    const n = await aplicarV1(db, r)
    const aj = await leerAjustes(db)
    await guardarAjustes(db, { rol: aj.rol ?? r.rol, introVista: true })
    return { ...n, sesiones: 0, formato: 'v1' }
  }

  if (!obj || obj.app !== 'calibra' || !Array.isArray(obj.predicciones)) {
    throw new RespaldoInvalido('No encontré predicciones en ese respaldo.')
  }
  const deportistas = (obj.deportistas ?? []).filter(deportistaValido)
  const predicciones = obj.predicciones.filter(prediccionValida)
  const sesiones = (obj.sesiones ?? []).filter(sesionValida)

  const resumen = await db.transaction('rw', db.deportistas, db.predicciones, db.sesiones, async () => {
    const nuevos = async <T extends { id: string }>(tabla: { where(k: string): { anyOf(ids: string[]): { primaryKeys(): Promise<unknown[]> } } }, filas: T[]) => {
      const ya = new Set(await tabla.where('id').anyOf(filas.map((f) => f.id)).primaryKeys())
      return filas.filter((f) => !ya.has(f.id))
    }
    const d = await nuevos(db.deportistas, deportistas)
    const pr = await nuevos(db.predicciones, predicciones)
    const s = await nuevos(db.sesiones, sesiones)
    await db.deportistas.bulkAdd(d)
    await db.predicciones.bulkAdd(pr)
    await db.sesiones.bulkAdd(s)
    return { deportistas: d.length, predicciones: pr.length, sesiones: s.length }
  })
  const aj = await leerAjustes(db)
  // en un dispositivo nuevo, el respaldo trae también el rol y el tema
  const rolRespaldo = obj.ajustes?.rol
  const temaRespaldo = obj.ajustes?.tema
  await guardarAjustes(db, {
    rol: aj.rol ?? (esRol(rolRespaldo) ? rolRespaldo : null),
    tema: aj.tema === 'auto' && (temaRespaldo === 'claro' || temaRespaldo === 'oscuro') ? temaRespaldo : aj.tema,
    introVista: true,
  })
  return { ...resumen, formato: 'v2' }
}
