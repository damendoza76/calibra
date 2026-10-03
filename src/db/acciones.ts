import { cargaSesion } from '../domain/carga'
import { colorPara } from '../domain/colores'
import { generarEjemplo } from '../domain/ejemplo'
import { uid } from '../domain/ids'
import { cerrarPrediccion, crearPrediccion, ReglaRota, type NuevaPrediccion } from '../domain/predicciones'
import type { Deportista, Prediccion, Rol, Sesion } from '../domain/tipos'
import type { CalibraDB } from './esquema'

/* Todas las escrituras de la app pasan por estas funciones. */

/** Quita los campos opcionales vacíos, para que lo guardado y lo exportado coincidan exactamente. */
function sinVacios<T extends object>(o: T): T {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as T
}

export async function anotar(db: CalibraDB, d: NuevaPrediccion): Promise<Prediccion> {
  const p = crearPrediccion(d)
  await db.predicciones.add(p)
  return p
}

export async function cerrar(db: CalibraDB, id: string, resultado: boolean): Promise<Prediccion> {
  return db.transaction('rw', db.predicciones, async () => {
    const p = await db.predicciones.get(id)
    if (!p) throw new ReglaRota('No encontré esa predicción.')
    const cerrada = cerrarPrediccion(p, resultado)
    await db.predicciones.put(cerrada)
    return cerrada
  })
}

/** Solo una pendiente se puede borrar. Las cerradas son el historial: se quedan. */
export async function borrarPendiente(db: CalibraDB, id: string): Promise<void> {
  await db.transaction('rw', db.predicciones, async () => {
    const p = await db.predicciones.get(id)
    if (!p) return
    if (p.estado === 'cerrada') throw new ReglaRota('Una predicción cerrada no se borra: es parte de tu historial.')
    await db.predicciones.delete(id)
  })
}

export type DatosDeportista = { nombre: string; nota?: string; foto?: string }

export async function crearDeportista(db: CalibraDB, d: DatosDeportista): Promise<Deportista> {
  const nombre = d.nombre.trim()
  if (!nombre) throw new ReglaRota('Escribe al menos el nombre.')
  const total = await db.deportistas.count()
  const nuevo: Deportista = sinVacios({
    id: uid('d'),
    nombre,
    nota: d.nota?.trim() || undefined,
    foto: d.foto,
    color: colorPara(total),
    archivado: false,
    creadoEn: new Date().toISOString(),
  })
  await db.deportistas.add(nuevo)
  return nuevo
}

export async function editarDeportista(
  db: CalibraDB,
  id: string,
  cambios: Partial<Pick<Deportista, 'nombre' | 'nota' | 'foto' | 'archivado'>>,
): Promise<void> {
  if (cambios.nombre !== undefined && !cambios.nombre.trim()) throw new ReglaRota('El nombre no puede quedar vacío.')
  await db.deportistas.update(id, cambios)
}

export type DatosSesion = { deportistaId: string; fecha: string; rpe: number; minutos: number; tipo?: string; nota?: string }

export async function registrarSesion(db: CalibraDB, d: DatosSesion): Promise<Sesion> {
  if (d.rpe < 0 || d.rpe > 10) throw new ReglaRota('El RPE va de 0 a 10.')
  if (!(d.minutos > 0)) throw new ReglaRota('La sesión necesita minutos.')
  const s: Sesion = sinVacios({
    id: uid('s'),
    deportistaId: d.deportistaId,
    fecha: d.fecha,
    rpe: Math.round(d.rpe),
    minutos: Math.round(d.minutos),
    carga: cargaSesion(d.rpe, d.minutos),
    tipo: d.tipo?.trim() || undefined,
    nota: d.nota?.trim() || undefined,
  })
  await db.sesiones.add(s)
  return s
}

export async function borrarSesion(db: CalibraDB, id: string): Promise<void> {
  await db.sesiones.delete(id)
}

/* ---------------- datos de ejemplo ---------------- */

export async function cargarEjemplo(db: CalibraDB, rol: Rol, hoy: string, cuantos = 3): Promise<void> {
  const ej = generarEjemplo({ cuantos, hoy, rol })
  await db.transaction('rw', db.deportistas, db.predicciones, db.sesiones, async () => {
    await db.deportistas.bulkPut(ej.deportistas)
    const existentes = new Set(await db.predicciones.where('id').anyOf(ej.predicciones.map((p) => p.id)).primaryKeys())
    await db.predicciones.bulkAdd(ej.predicciones.filter((p) => !existentes.has(p.id)))
    await db.sesiones.bulkPut(ej.sesiones)
  })
}

export async function hayEjemplo(db: CalibraDB): Promise<boolean> {
  return (await db.deportistas.filter((d) => d.ejemplo === true).count()) > 0
}

/** Quita solo lo marcado como ejemplo. Lo tuyo que apunte a una ficha de ejemplo pasa a «general». */
export async function borrarEjemplo(db: CalibraDB): Promise<void> {
  await db.transaction('rw', db.deportistas, db.predicciones, db.sesiones, async () => {
    const fichas = await db.deportistas.filter((d) => d.ejemplo === true).primaryKeys()
    await db.deportistas.bulkDelete(fichas)
    await db.predicciones.filter((p) => p.ejemplo === true).delete()
    await db.sesiones.filter((s) => s.ejemplo === true).delete()
    await db.predicciones.where('deportistaId').anyOf(fichas).modify({ deportistaId: null })
    await db.sesiones.where('deportistaId').anyOf(fichas).delete()
  })
}

/** Borra todos los registros. Los ajustes (rol, tema) se conservan. */
export async function borrarTodo(db: CalibraDB): Promise<void> {
  await db.transaction('rw', db.deportistas, db.predicciones, db.sesiones, async () => {
    await db.deportistas.clear()
    await db.predicciones.clear()
    await db.sesiones.clear()
  })
}
