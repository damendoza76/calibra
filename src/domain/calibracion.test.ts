import { describe, expect, it } from 'vitest'
import {
  analiza,
  bandaDe,
  cierresDe,
  fraseBarras,
  fraseContradiccion,
  fraseCurva,
  fraseMapa,
  fraseSesgo,
  lectura,
  lecturaCorta,
  mapaAciertos,
  rachaSemanas,
  sesgoMensual,
  veredicto,
  wilson,
  type Cierre,
} from './calibracion'
import { ejemploCierres } from './ejemplo'
import type { Prediccion } from './tipos'

const c = (confianza: number, resultado: boolean, cerradaEn = '2026-09-15T15:00:00.000Z'): Cierre => ({
  confianza,
  resultado,
  cerradaEn,
})

describe('bandas', () => {
  it('ubica cada confianza en su banda, con 100 en «casi seguro que sí»', () => {
    expect(bandaDe(0).nombre).toBe('Casi seguro que no')
    expect(bandaDe(20).nombre).toBe('Poco probable')
    expect(bandaDe(50).nombre).toBe('Moneda al aire')
    expect(bandaDe(79).nombre).toBe('Probable')
    expect(bandaDe(100).nombre).toBe('Casi seguro que sí')
  })
})

describe('analiza', () => {
  it('sin cierres devuelve null', () => {
    expect(analiza([])).toBeNull()
  })

  it('calcula promedio dicho, frecuencia observada y sesgo', () => {
    const a = analiza([c(90, true), c(90, false), c(80, true), c(80, false)])!
    expect(a.n).toBe(4)
    expect(a.dices).toBe(85)
    expect(a.ocurre).toBe(50)
    expect(a.sesgo).toBe(35)
    expect(a.bandas).toHaveLength(1)
    expect(a.bandas[0]).toMatchObject({ nombre: 'Casi seguro que sí', n: 4, aciertos: 2, ocurre: 50 })
  })

  it('reproduce el ejemplo de la v1 (20 pronósticos de demostración)', () => {
    const v1 = [
      [85, 1], [90, 1], [80, 0], [75, 1], [95, 1], [85, 0], [70, 1], [60, 1], [90, 0], [55, 1],
      [65, 0], [80, 1], [75, 0], [85, 1], [50, 1], [95, 0], [30, 0], [40, 1], [25, 0], [70, 0],
    ].map(([conf, ok]) => c(conf, !!ok))
    const a = analiza(v1)!
    expect(a.dices).toBe(70)
    expect(a.ocurre).toBeCloseTo(55)
    expect(veredicto(a).tipo).toBe('sobre')
    expect(veredicto(a).titular).toBe('Tiendes a sobreestimar, ~15 puntos.')
  })
})

describe('wilson', () => {
  it('es ancho con pocos datos y se angosta con muchos', () => {
    const [a1, b1] = wilson(2, 3)
    const [a2, b2] = wilson(200, 300)
    expect(b1 - a1).toBeGreaterThan(50)
    expect(b2 - a2).toBeLessThan(12)
    expect(a2).toBeLessThan(66.7)
    expect(b2).toBeGreaterThan(66.7)
  })
  it('queda dentro de 0-100', () => {
    expect(wilson(0, 4)[0]).toBe(0)
    expect(wilson(4, 4)[1]).toBe(100)
  })
})

describe('frases', () => {
  it('veredicto de buena calibración', () => {
    const a = analiza([c(50, true), c(50, false), c(50, true), c(50, false)])!
    expect(veredicto(a).tipo).toBe('bien')
    expect(lecturaCorta(a)).toMatch(/bien calibrado/)
  })

  it('subestimación', () => {
    const a = analiza([c(30, true), c(30, true), c(40, true), c(30, false)])!
    expect(veredicto(a).tipo).toBe('sub')
    expect(lectura(a)).toMatch(/quedando corto/)
    expect(lecturaCorta(a)).toMatch(/^Ahora mismo subestimas ~\d+ puntos/)
  })

  it('advierte sobre los «casi seguro» que fallan', () => {
    const a = analiza([c(90, false), c(90, false), c(85, true), c(90, false), c(50, true)])!
    expect(lectura(a)).toMatch(/de 4 veces que lo dijiste, ocurrió 1/)
  })

  it('frase honesta al cerrar contra una confianza alta o baja', () => {
    expect(fraseContradiccion(90, false)).toBe(
      'Dijiste 90% y no pasó — eso es exactamente lo que esta bitácora existe para mostrarte.',
    )
    expect(fraseContradiccion(10, true)).toMatch(/^Dijiste 10% y pasó/)
    expect(fraseContradiccion(90, true)).toBeNull()
    expect(fraseContradiccion(60, false)).toBeNull()
  })

  it('cada gráfico tiene una frase no vacía', () => {
    const datos = ejemploCierres('2026-10-03')
    const a = analiza(datos)!
    expect(fraseCurva(a).length).toBeGreaterThan(20)
    expect(fraseBarras(a).length).toBeGreaterThan(20)
    expect(fraseSesgo(sesgoMensual(datos)).length).toBeGreaterThan(20)
    expect(fraseMapa(mapaAciertos(datos, '2026-10-03')).length).toBeGreaterThan(20)
  })
})

describe('sesgo mes a mes', () => {
  it('agrupa por mes y marca fiables los meses con 3 o más cierres', () => {
    const m = sesgoMensual([
      c(90, false, '2026-07-10T15:00:00Z'),
      c(90, false, '2026-07-11T15:00:00Z'),
      c(80, true, '2026-07-12T15:00:00Z'),
      c(70, true, '2026-08-01T15:00:00Z'),
    ])
    expect(m.map((x) => x.mes)).toEqual(['2026-07', '2026-08'])
    expect(m[0].fiable).toBe(true)
    expect(m[1].fiable).toBe(false)
  })

  it('el ejemplo ilustrativo muestra a alguien que se calibra', () => {
    expect(fraseSesgo(sesgoMensual(ejemploCierres('2026-10-03')))).toMatch(/^Te estás calibrando/)
  })

  it('pide más datos si no hay dos meses fiables', () => {
    expect(fraseSesgo([])).toMatch(/al menos dos meses/)
  })
})

describe('mapa de constancia', () => {
  it('cubre semanas completas desde un lunes hasta hoy', () => {
    const dias = mapaAciertos([], '2026-10-03', 12) // sábado
    expect(dias[0].fecha).toBe('2026-07-13') // lunes
    expect(dias[dias.length - 1].fecha).toBe('2026-10-03')
    expect(dias.length).toBe(11 * 7 + 6)
  })

  it('cuenta los cierres por día y la racha de semanas', () => {
    const dias = mapaAciertos(
      [
        c(80, true, '2026-09-22T15:00:00Z'),
        c(80, false, '2026-09-22T16:00:00Z'),
        c(60, true, '2026-09-15T15:00:00Z'),
      ],
      '2026-10-03',
      4,
    )
    expect(dias.find((d) => d.fecha === '2026-09-22')).toMatchObject({ n: 2, aciertos: 1 })
    expect(rachaSemanas(dias)).toBe(2) // la semana en curso aún vacía no rompe la racha
    const dias2 = mapaAciertos([c(80, true, '2026-09-29T15:00:00Z'), c(80, true, '2026-09-15T15:00:00Z')], '2026-10-03', 4)
    expect(rachaSemanas(dias2)).toBe(1) // la semana del 21 quedó vacía
  })
})

describe('cierresDe', () => {
  const base: Prediccion = {
    id: 'x',
    deportistaId: 'd1',
    etiqueta: 'algo',
    confianza: 70,
    fecha: '2026-09-01',
    creadaEn: '2026-08-30T10:00:00Z',
    estado: 'cerrada',
    resultado: true,
    cerradaEn: '2026-09-01T18:00:00Z',
    rol: 'deportivo',
  }
  const ps: Prediccion[] = [
    base,
    { ...base, id: 'y', deportistaId: null, rol: 'docente' },
    { ...base, id: 'z', estado: 'pendiente', resultado: null, cerradaEn: null },
    { ...base, id: 'w', cerradaEn: '2026-06-01T18:00:00Z' },
  ]
  it('solo usa cerradas y respeta los filtros', () => {
    expect(cierresDe(ps)).toHaveLength(3)
    expect(cierresDe(ps, { deportistaId: 'general' })).toHaveLength(1)
    expect(cierresDe(ps, { deportistaId: 'd1' })).toHaveLength(2)
    expect(cierresDe(ps, { rol: 'docente' })).toHaveLength(1)
    expect(cierresDe(ps, { dias: 60 }, '2026-10-03')).toHaveLength(2)
  })
})
