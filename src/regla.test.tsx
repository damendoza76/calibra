// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { borrarTodo, cargarEjemplo, db, guardarAjustes } from './db'
import { hoyISO } from './domain/lenguaje'
import type { Prediccion } from './domain/tipos'
import { RUTAS } from './rutas'

/*
 * Criterio de aceptación: «No existe ninguna ruta en la interfaz que permita
 * editar la confianza de una predicción cerrada.»
 *
 * Este test abre cada pantalla de la app con datos reales en la base, toca todos
 * los botones, mueve todos los deslizadores y escribe en todos los campos. Al
 * final, cada predicción cerrada debe seguir exactamente igual.
 */

beforeAll(() => {
  window.matchMedia ??= ((q: string) => ({
    matches: false,
    media: q,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo
  // los «¿seguro?» de borrar todo usan confirm en algunos navegadores: siempre decimos que no
  window.confirm = () => false
})

beforeEach(async () => {
  await borrarTodo(db)
  await guardarAjustes(db, { rol: 'deportivo', introVista: true, migradoV1En: new Date().toISOString() })
  await cargarEjemplo(db, 'deportivo', hoyISO(), 3)
})
afterEach(cleanup)

const huella = (p: Prediccion) => ({
  confianza: p.confianza,
  etiqueta: p.etiqueta,
  resultado: p.resultado,
  cerradaEn: p.cerradaEn,
  creadaEn: p.creadaEn,
})

async function abrir(ruta: string) {
  window.location.hash = '#' + ruta
  render(<App />)
  await screen.findAllByRole('navigation', {}, { timeout: 3000 })
  await act(() => new Promise((r) => setTimeout(r, 50)))
}

/** Toca todo lo que se pueda tocar en la pantalla actual, salvo los borrados (borrar no es editar). */
async function tocarTodo() {
  const raiz = document.querySelector('main')!
  for (const el of Array.from(raiz.querySelectorAll<HTMLInputElement>('input, textarea'))) {
    if (!el.isConnected) continue
    if (el.type === 'range') fireEvent.change(el, { target: { value: '5' } })
    else if (el.type === 'date') fireEvent.change(el, { target: { value: '2020-01-01' } })
    else if (el.type !== 'file') fireEvent.change(el, { target: { value: '5' } })
  }
  for (const b of Array.from(raiz.querySelectorAll<HTMLButtonElement>('button'))) {
    if (!b.isConnected || /borrar|eliminar/i.test(b.textContent ?? '')) continue
    await act(async () => {
      fireEvent.click(b)
    })
  }
  await act(() => new Promise((r) => setTimeout(r, 50)))
}

describe('la regla en la interfaz: la confianza de una cerrada no se puede editar', () => {
  for (const patron of RUTAS) {
    it(`en ${patron}, tocar todo no altera ninguna predicción cerrada`, async () => {
      const antes = (await db.predicciones.toArray()).filter((p) => p.estado === 'cerrada')
      expect(antes.length).toBeGreaterThan(5)
      const ruta = patron.replace(':id', 'ejd0')

      await abrir(ruta)
      await tocarTodo()

      const despues = new Map((await db.predicciones.toArray()).map((p) => [p.id, p]))
      for (const p of antes) {
        const ahora = despues.get(p.id)
        expect(ahora, `la cerrada ${p.id} desapareció en ${ruta}`).toBeDefined()
        expect(huella(ahora!)).toEqual(huella(p))
      }
    })
  }

  it('el historial de cerradas no tiene ningún control', async () => {
    await abrir('/pendientes')
    const historial = await screen.findByTestId('historial')
    const filas = within(historial).getAllByRole('listitem')
    expect(filas.length).toBeGreaterThan(5)
    for (const fila of filas) {
      expect(fila.querySelectorAll('input, button, select, textarea, [contenteditable]')).toHaveLength(0)
    }
    expect(historial.textContent).toMatch(/no se puede editar/)
  })

  it('ninguna ruta de la app se llama «editar»', () => {
    expect(RUTAS.filter((r) => /editar|edit/i.test(r))).toEqual([])
  })
})
