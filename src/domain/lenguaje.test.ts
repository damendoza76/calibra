import { describe, expect, it } from 'vitest'
import { confWord, cuando, diasDesde, fechaCorta, iniciales, sumarDias } from './lenguaje'

describe('lenguaje', () => {
  it('las palabras del deslizador son las de la v1', () => {
    expect(confWord(5)).toBe('casi imposible')
    expect(confWord(50)).toBe('moneda al aire')
    expect(confWord(70)).toBe('probable')
    expect(confWord(90)).toBe('casi seguro')
    expect(confWord(100)).toBe('seguro — cuidado con los 100%')
  })
  it('fechas', () => {
    expect(diasDesde('2026-09-26', '2026-10-03')).toBe(7)
    expect(sumarDias('2026-10-30', 3)).toBe('2026-11-02')
    expect(fechaCorta('2026-09-19')).toBe('19 sep 2026')
    expect(cuando('2026-10-03', '2026-10-03')).toBe('hoy')
    expect(cuando('2026-10-05', '2026-10-03')).toBe('en 2 días')
    expect(cuando('2026-09-30', '2026-10-03')).toBe('hace 3 días')
  })
  it('iniciales', () => {
    expect(iniciales('Camila Rojas')).toBe('CR')
    expect(iniciales('Juan David Mora')).toBe('JM')
    expect(iniciales('10B')).toBe('10')
  })
})
