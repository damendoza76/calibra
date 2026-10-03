import { useLiveQuery } from 'dexie-react-hooks'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { db, leerAjustes, migrarDesdeV1 } from './db'
import { hoyISO } from './domain/lenguaje'
import type { Ajustes, Deportista, Prediccion, Rol, Sesion } from './domain/tipos'

export type Datos = {
  ajustes: Ajustes
  rol: Rol
  deportistas: Deportista[]
  predicciones: Prediccion[]
  sesiones: Sesion[]
  porId: Map<string, Deportista>
  hoy: string
}

const Contexto = createContext<Datos | null>(null)

/** Carga todo una vez y lo mantiene vivo: cualquier escritura en la base refresca las pantallas. */
export function ProveedorDatos({ children, cargando }: { children: ReactNode; cargando: ReactNode }) {
  const [migrado, setMigrado] = useState(false)
  const [hoy, setHoy] = useState(hoyISO())

  useEffect(() => {
    migrarDesdeV1(db)
      .catch((e) => console.error('No se pudo migrar la v1', e))
      .finally(() => setMigrado(true))
  }, [])

  // si la app queda abierta de un día para otro, «hoy» se actualiza al volver
  useEffect(() => {
    const alVolver = () => setHoy(hoyISO())
    document.addEventListener('visibilitychange', alVolver)
    return () => document.removeEventListener('visibilitychange', alVolver)
  }, [])

  const base = useLiveQuery(
    async () => {
      if (!migrado) return null
      const [ajustes, deportistas, predicciones, sesiones] = await Promise.all([
        leerAjustes(db),
        db.deportistas.toArray(),
        db.predicciones.toArray(),
        db.sesiones.toArray(),
      ])
      return { ajustes, deportistas, predicciones, sesiones }
    },
    [migrado],
  )

  if (!base) return <>{cargando}</>
  const datos: Datos = {
    ...base,
    rol: base.ajustes.rol ?? 'deportivo',
    porId: new Map(base.deportistas.map((d) => [d.id, d])),
    hoy,
  }
  return <Contexto.Provider value={datos}>{children}</Contexto.Provider>
}

export function useDatos(): Datos {
  const d = useContext(Contexto)
  if (!d) throw new Error('useDatos fuera del proveedor')
  return d
}
