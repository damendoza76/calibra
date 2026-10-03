import { describe, expect, it } from 'vitest'
import * as dominio from './predicciones'
import {
  cerrarPrediccion,
  crearPrediccion,
  estadoPendiente,
  motivoRechazo,
  ordenarPendientes,
  ReglaRota,
} from './predicciones'

const nueva = () =>
  crearPrediccion(
    { deportistaId: null, etiqueta: '  Cumple la carga  ', confianza: 72.4, fecha: '2026-10-05', rol: 'deportivo' },
    new Date('2026-10-03T12:00:00Z'),
  )

describe('crear', () => {
  it('queda pendiente, con etiqueta limpia y confianza entera', () => {
    const p = nueva()
    expect(p).toMatchObject({ etiqueta: 'Cumple la carga', confianza: 72, estado: 'pendiente', resultado: null })
  })
  it('rechaza etiquetas vacías y confianzas fuera de rango', () => {
    expect(() => crearPrediccion({ deportistaId: null, etiqueta: ' ', confianza: 50, fecha: '2026-10-05', rol: 'gimnasio' })).toThrow(ReglaRota)
    expect(() => crearPrediccion({ deportistaId: null, etiqueta: 'x', confianza: 101, fecha: '2026-10-05', rol: 'gimnasio' })).toThrow(ReglaRota)
  })
})

describe('la regla: la confianza queda congelada', () => {
  it('cerrar conserva la confianza y no la recibe como parámetro', () => {
    const p = nueva()
    const cerrada = cerrarPrediccion(p, false, new Date('2026-10-05T18:00:00Z'))
    expect(cerrada.confianza).toBe(p.confianza)
    expect(cerrada).toMatchObject({ estado: 'cerrada', resultado: false, cerradaEn: '2026-10-05T18:00:00.000Z' })
    expect(cerrarPrediccion.length).toBeLessThanOrEqual(3)
  })

  it('no se puede cerrar dos veces', () => {
    const cerrada = cerrarPrediccion(nueva(), true)
    expect(() => cerrarPrediccion(cerrada, false)).toThrow(ReglaRota)
  })

  it('el dominio no ofrece ninguna operación de edición', () => {
    const nombres = Object.keys(dominio)
    expect(nombres.filter((n) => /editar|actualizar|modificar|cambiar|update|edit/i.test(n))).toEqual([])
  })

  it('el guardián rechaza cambiar la confianza, de una pendiente o de una cerrada', () => {
    const p = nueva()
    expect(motivoRechazo(p, { ...p, confianza: 40 })).toMatch(/congelado/)
    const cerrada = cerrarPrediccion(p, true)
    expect(motivoRechazo(cerrada, { ...cerrada, confianza: 40 })).toMatch(/congelado/)
    expect(motivoRechazo(cerrada, { ...cerrada, etiqueta: 'otra cosa' })).toMatch(/congelado/)
  })

  it('el guardián rechaza reabrir o cambiar el resultado de una cerrada', () => {
    const cerrada = cerrarPrediccion(nueva(), true)
    expect(motivoRechazo(cerrada, { ...cerrada, resultado: false })).toMatch(/cerrada no se puede editar/)
    expect(motivoRechazo(cerrada, { ...cerrada, estado: 'pendiente', resultado: null, cerradaEn: null })).not.toBeNull()
  })

  it('el guardián permite cerrar una pendiente y reasignar la ficha', () => {
    const p = nueva()
    expect(motivoRechazo(p, cerrarPrediccion(p, true))).toBeNull()
    expect(motivoRechazo(p, { ...p, deportistaId: 'd9' })).toBeNull()
    const cerrada = cerrarPrediccion(p, true)
    expect(motivoRechazo(cerrada, { ...cerrada, deportistaId: null })).toBeNull()
  })

  it('el guardián no deja cambiar la fecha de una pendiente', () => {
    const p = nueva()
    expect(motivoRechazo(p, { ...p, fecha: '2026-12-01' })).toMatch(/no se edita/)
  })
})

describe('pendientes', () => {
  it('distingue esperando, lista y vencida', () => {
    const p = nueva() // fecha 5 oct
    expect(estadoPendiente(p, '2026-10-03')).toBe('esperando')
    expect(estadoPendiente(p, '2026-10-05')).toBe('lista')
    expect(estadoPendiente(p, '2026-10-12')).toBe('lista')
    expect(estadoPendiente(p, '2026-10-13')).toBe('vencida')
  })
  it('ordena por fecha', () => {
    const a = { ...nueva(), id: 'a', fecha: '2026-10-09' }
    const b = { ...nueva(), id: 'b', fecha: '2026-10-01' }
    expect(ordenarPendientes([a, b]).map((x) => x.id)).toEqual(['b', 'a'])
  })
})
