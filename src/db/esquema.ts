import Dexie, { type EntityTable } from 'dexie'
import { motivoRechazo, ReglaRota } from '../domain/predicciones'
import type { Ajustes, Deportista, Prediccion, Sesion } from '../domain/tipos'

export class CalibraDB extends Dexie {
  deportistas!: EntityTable<Deportista, 'id'>
  predicciones!: EntityTable<Prediccion, 'id'>
  sesiones!: EntityTable<Sesion, 'id'>
  ajustes!: EntityTable<Ajustes, 'clave'>

  constructor(nombre = 'calibra') {
    super(nombre)
    this.version(1).stores({
      deportistas: 'id, nombre',
      predicciones: 'id, deportistaId, estado, fecha, cerradaEn',
      sesiones: 'id, deportistaId, fecha',
      ajustes: 'clave',
    })

    /*
     * Guardián de la regla. Cualquier actualización de una predicción —venga de donde
     * venga: pantalla, importación o un error de código— pasa por aquí. Si intenta
     * tocar la confianza, la etiqueta o una predicción ya cerrada, la base de datos
     * aborta la transacción.
     */
    this.predicciones.hook('updating', (cambios, _id, antes) => {
      const despues = { ...antes } as Record<string, unknown>
      for (const [k, v] of Object.entries(cambios as Record<string, unknown>)) {
        if (v === undefined) delete despues[k]
        else despues[k] = v
      }
      const motivo = motivoRechazo(antes, despues as Prediccion)
      if (motivo) throw new ReglaRota(motivo)
    })
  }
}

export const AJUSTES_INICIALES: Ajustes = { clave: 'app', rol: null, tema: 'auto', introVista: false }

export async function leerAjustes(db: CalibraDB): Promise<Ajustes> {
  return (await db.ajustes.get('app')) ?? AJUSTES_INICIALES
}

export async function guardarAjustes(db: CalibraDB, cambios: Partial<Omit<Ajustes, 'clave'>>): Promise<void> {
  await db.transaction('rw', db.ajustes, async () => {
    const actual = await leerAjustes(db)
    await db.ajustes.put({ ...actual, ...cambios, clave: 'app' })
  })
}
