import { describe, expect, it } from 'vitest'
import {
  actualizacionPorSesion,
  actualizar,
  cargaSemanal,
  cargaSesion,
  etiquetaRPE,
  expectativas,
  fraseActualizacion,
  fraseCurvaCarga,
  serieDiaria,
} from './carga'
import { ejemploSesiones } from './ejemplo'
import type { Sesion } from './tipos'

const s = (fecha: string, carga: number, id = fecha): Sesion => ({
  id,
  deportistaId: 'd1',
  fecha,
  rpe: 5,
  minutos: carga / 5,
  carga,
})

describe('RPE de sesión (Foster)', () => {
  it('carga = RPE × minutos', () => {
    expect(cargaSesion(5, 80)).toBe(400)
    expect(cargaSesion(0, 60)).toBe(0)
  })
  it('etiquetas de la escala', () => {
    expect(etiquetaRPE(0)).toBe('Reposo')
    expect(etiquetaRPE(7)).toBe('Muy duro')
    expect(etiquetaRPE(10)).toBe('Máximo')
  })
})

describe('el ejemplo de la charla: 400 → 250 → 385', () => {
  it('actualizar(400, 250, 10) = 385', () => {
    expect(actualizar(400, 250, 10)).toBe(385)
  })

  it('con nueve sesiones de promedio 400, una de 250 deja la expectativa en 385', () => {
    const ej = ejemploSesiones('2026-10-03')
    const nueve = ej.slice(0, 9)
    const a = actualizacionPorSesion(nueve, 250)!
    expect(a.previa).toBeCloseTo(400)
    expect(a.n).toBe(10)
    expect(a.nueva).toBeCloseTo(385)
    expect(fraseActualizacion(a)).toBe('Tu expectativa para la próxima sesión baja de 400 a 385.')
  })

  it('sin sesiones previas no hay actualización que mostrar', () => {
    expect(actualizacionPorSesion([], 300)).toBeNull()
  })
})

describe('expectativas', () => {
  it('la regla 1/n es el promedio acumulado', () => {
    const pts = expectativas([s('2026-09-01', 300), s('2026-09-03', 500), s('2026-09-05', 400)])
    expect(pts.map((p) => p.previa)).toEqual([null, 300, 400])
    expect(pts.map((p) => p.nueva)).toEqual([300, 400, 400])
  })

  it('marca desvíos de más de 25 % solo cuando hay historial', () => {
    const pts = expectativas([
      s('2026-09-01', 400),
      s('2026-09-02', 600), // demasiado pronto para marcar
      s('2026-09-03', 400),
      s('2026-09-04', 420),
      s('2026-09-05', 200), // muy por debajo
      s('2026-09-06', 650), // muy por encima
    ])
    expect(pts.map((p) => p.desvio)).toEqual([null, null, null, null, 'abajo', 'arriba'])
  })

  it('ordena por fecha aunque lleguen desordenadas', () => {
    const pts = expectativas([s('2026-09-05', 100), s('2026-09-01', 300)])
    expect(pts[0].sesion.fecha).toBe('2026-09-01')
  })
})

describe('series', () => {
  it('serie diaria suma sesiones del mismo día y arrastra la expectativa', () => {
    const serie = serieDiaria(
      [s('2026-10-01', 300, 'a'), s('2026-10-01', 100, 'b'), s('2026-10-03', 400, 'c')],
      '2026-10-03',
      4,
    )
    expect(serie.map((d) => d.fecha)).toEqual(['2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03'])
    expect(serie.map((d) => d.carga)).toEqual([0, 400, 0, 400])
    expect(serie[0].expectativa).toBeNull()
    expect(serie[2].expectativa).toBe(200) // (300+100)/2
    expect(serie[3].expectativa).toBeCloseTo(266.67, 1)
  })

  it('carga semanal en bloques de 7 días que terminan hoy', () => {
    const sem = cargaSemanal([s('2026-10-03', 100), s('2026-09-27', 50), s('2026-09-26', 70)], '2026-10-03', 2)
    expect(sem).toEqual([70, 150])
  })

  it('la curva tiene frase', () => {
    expect(fraseCurvaCarga(serieDiaria([], '2026-10-03'))).toMatch(/primera sesión/)
    expect(fraseCurvaCarga(serieDiaria(ejemploSesiones('2026-10-03'), '2026-10-03'))).toMatch(/25 %/)
  })
})
