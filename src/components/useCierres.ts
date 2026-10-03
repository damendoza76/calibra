import { useCallback, useEffect, useRef, useState } from 'react'
import { borrarPendiente, cerrar, db } from '../db'
import { fraseContradiccion } from '../domain/calibracion'
import { ReglaRota } from '../domain/predicciones'
import type { Prediccion } from '../domain/tipos'

/**
 * Cierra en la base de inmediato, pero mantiene la tarjeta visible un momento
 * para que se vea el sello (y la frase honesta, si el resultado contradice la confianza).
 */
export function useCierres() {
  const [recientes, setRecientes] = useState<Map<string, Prediccion>>(new Map())
  const temporizadores = useRef<number[]>([])

  useEffect(() => () => temporizadores.current.forEach(clearTimeout), [])

  const cerrarConSello = useCallback(async (p: Prediccion, resultado: boolean) => {
    let cerrada: Prediccion
    try {
      cerrada = await cerrar(db, p.id, resultado)
    } catch (e) {
      // ya estaba cerrada (doble toque, u otra pestaña): la base la protegió, no hay nada que hacer
      if (e instanceof ReglaRota) return
      throw e
    }
    setRecientes((m) => new Map(m).set(cerrada.id, cerrada))
    const espera = fraseContradiccion(cerrada.confianza, resultado) ? 7000 : 2600
    temporizadores.current.push(
      window.setTimeout(() => {
        setRecientes((m) => {
          const n = new Map(m)
          n.delete(cerrada.id)
          return n
        })
      }, espera),
    )
  }, [])

  const borrar = useCallback((p: Prediccion) => borrarPendiente(db, p.id), [])

  /** Mezcla las pendientes vivas con las recién cerradas, conservando el orden. */
  const conRecientes = useCallback(
    (pendientes: Prediccion[], orden: (ps: Prediccion[]) => Prediccion[]) => {
      if (!recientes.size) return pendientes
      const ids = new Set(pendientes.map((p) => p.id))
      return orden([...pendientes, ...[...recientes.values()].filter((p) => !ids.has(p.id))])
    },
    [recientes],
  )

  return { cerrarConSello, borrar, conRecientes }
}
