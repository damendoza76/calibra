import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ReglaRota } from '../domain/predicciones'
import {
  anotar,
  borrarEjemplo,
  borrarPendiente,
  borrarTodo,
  cargarEjemplo,
  cerrar,
  crearDeportista,
  registrarSesion,
} from './acciones'
import { CalibraDB, guardarAjustes, leerAjustes } from './esquema'
import { CLAVE_V1, migrarDesdeV1, normalizarNombre, transformarV1 } from './migracionV1'
import { exportar, importar, respaldoComoTexto, RespaldoInvalido } from './respaldo'

let db: CalibraDB
let n = 0
beforeEach(async () => {
  db = new CalibraDB('prueba-' + n++)
  await db.open()
})
afterEach(async () => {
  await db.delete()
})

const almacen = (datos: Record<string, string>) => ({ getItem: (k: string) => datos[k] ?? null })

/* Estado real de la v1: mismo formato que guarda calibra-v1.html */
const V1 = {
  v: 1,
  role: 'gimnasio',
  onboarded: true,
  items: [
    { id: 'pa1', label: 'Completa las 3 sesiones', who: 'Camila', conf: 80, date: '2026-09-20', createdAt: '2026-09-18T10:00:00.000Z', status: 'cerrada', outcome: false, closedAt: '2026-09-21T10:00:00.000Z' },
    { id: 'pa2', label: 'Vuelve después del festivo', who: '  camila ', conf: 65, date: '2026-09-25', createdAt: '2026-09-19T10:00:00.000Z', status: 'pendiente', outcome: null, closedAt: null },
    { id: 'pa3', label: 'Sube de carga sin dolor', who: 'Grupo  10B', conf: 55, date: '2026-09-22', createdAt: '2026-09-19T11:00:00.000Z', status: 'cerrada', outcome: true, closedAt: '2026-09-22T19:00:00.000Z' },
    { id: 'pa4', label: 'La clase de la lluvia no se desordena', who: 'grupo 10b', conf: 30, date: '2026-09-23', createdAt: '2026-09-19T12:00:00.000Z', status: 'pendiente', outcome: null, closedAt: null },
    { id: 'pa5', label: 'Sigue viniendo dentro de un mes', who: '', conf: 90, date: '2026-10-20', createdAt: '2026-09-20T12:00:00.000Z', status: 'pendiente', outcome: null, closedAt: null },
    { id: 'malo', label: 'sin confianza' },
  ],
}

describe('guardián de la base de datos', () => {
  it('rechaza cambiar la confianza de una predicción cerrada', async () => {
    const p = await anotar(db, { deportistaId: null, etiqueta: 'Baja su marca', confianza: 90, fecha: '2026-10-03', rol: 'deportivo' })
    await cerrar(db, p.id, false)
    await expect(db.predicciones.update(p.id, { confianza: 40 })).rejects.toThrow(/congelado/)
    await expect(db.predicciones.put({ ...(await db.predicciones.get(p.id))!, confianza: 40 })).rejects.toThrow()
    await expect(db.predicciones.where('id').equals(p.id).modify({ confianza: 40 })).rejects.toThrow()
    expect((await db.predicciones.get(p.id))!.confianza).toBe(90)
  })

  it('rechaza cambiar la confianza incluso de una pendiente', async () => {
    const p = await anotar(db, { deportistaId: null, etiqueta: 'x', confianza: 70, fecha: '2026-10-03', rol: 'deportivo' })
    await expect(db.predicciones.update(p.id, { confianza: 20 })).rejects.toThrow(/congelado/)
  })

  it('rechaza cambiar el resultado de una cerrada y cerrarla dos veces', async () => {
    const p = await anotar(db, { deportistaId: null, etiqueta: 'x', confianza: 70, fecha: '2026-10-03', rol: 'deportivo' })
    await cerrar(db, p.id, true)
    await expect(db.predicciones.update(p.id, { resultado: false })).rejects.toThrow()
    await expect(cerrar(db, p.id, false)).rejects.toThrow(ReglaRota)
    expect((await db.predicciones.get(p.id))!.resultado).toBe(true)
  })

  it('una cerrada no se borra; una pendiente sí', async () => {
    const a = await anotar(db, { deportistaId: null, etiqueta: 'a', confianza: 70, fecha: '2026-10-03', rol: 'deportivo' })
    const b = await anotar(db, { deportistaId: null, etiqueta: 'b', confianza: 70, fecha: '2026-10-03', rol: 'deportivo' })
    await cerrar(db, a.id, true)
    await expect(borrarPendiente(db, a.id)).rejects.toThrow(ReglaRota)
    await borrarPendiente(db, b.id)
    expect(await db.predicciones.count()).toBe(1)
  })
})

describe('migración desde la v1', () => {
  it('normaliza nombres sin importar mayúsculas ni espacios', () => {
    expect(normalizarNombre('  Grupo   10B ')).toBe(normalizarNombre('grupo 10b'))
  })

  it('transforma sin perder nada y crea una ficha por persona', () => {
    const r = transformarV1(V1, new Date('2026-10-03T12:00:00Z'))!
    expect(r.rol).toBe('gimnasio')
    expect(r.predicciones).toHaveLength(5) // la inválida se descarta, igual que en la v1
    expect(r.deportistas.map((d) => d.nombre)).toEqual(['Camila', 'Grupo 10B'])
    const camila = r.deportistas[0].id
    expect(r.predicciones.filter((p) => p.deportistaId === camila).map((p) => p.id)).toEqual(['pa1', 'pa2'])
    expect(r.predicciones.find((p) => p.id === 'pa5')!.deportistaId).toBeNull()
    expect(r.predicciones.find((p) => p.id === 'pa2')!.quienV1).toBe('  camila ')
  })

  it('cada campo de la v1 llega intacto', () => {
    const r = transformarV1(V1, new Date('2026-10-03T12:00:00Z'))!
    for (const it of V1.items.filter((i) => typeof i.conf === 'number')) {
      const p = r.predicciones.find((x) => x.id === it.id)!
      expect(p.etiqueta).toBe(it.label)
      expect(p.confianza).toBe(it.conf)
      expect(p.fecha).toBe(it.date)
      expect(p.creadaEn).toBe(it.createdAt)
      expect(p.estado).toBe(it.status)
      expect(p.resultado).toBe(it.outcome)
      expect(p.cerradaEn).toBe(it.closedAt)
    }
  })

  it('se ejecuta sola una vez al abrir y no borra la clave de la v1', async () => {
    const datos = { [CLAVE_V1]: JSON.stringify(V1) }
    const r = await migrarDesdeV1(db, almacen(datos))
    expect(r).toEqual({ predicciones: 5, deportistas: 2 })
    expect(await db.predicciones.count()).toBe(5)
    expect(await db.deportistas.count()).toBe(2)
    const aj = await leerAjustes(db)
    expect(aj.rol).toBe('gimnasio')
    expect(aj.introVista).toBe(true)
    expect(aj.migradoV1En).toBeTruthy()
    expect(datos[CLAVE_V1]).toBeTruthy()

    // segunda apertura: no hace nada, ni siquiera después de borrar todo
    await borrarTodo(db)
    expect(await migrarDesdeV1(db, almacen(datos))).toBeNull()
    expect(await db.predicciones.count()).toBe(0)
  })

  it('sin datos de la v1 solo deja la marca', async () => {
    expect(await migrarDesdeV1(db, almacen({}))).toBeNull()
    expect((await leerAjustes(db)).migradoV1En).toBeTruthy()
  })

  it('tolera un localStorage corrupto', async () => {
    expect(await migrarDesdeV1(db, almacen({ [CLAVE_V1]: '{roto' }))).toBeNull()
  })

  it('el respaldo copiado desde la v1 también se puede importar', async () => {
    const respaldoV1 = { app: 'calibra', v: 1, exportado: '2026-09-30T00:00:00Z', role: 'gimnasio', items: V1.items }
    const r = await importar(db, JSON.stringify(respaldoV1))
    expect(r).toMatchObject({ formato: 'v1', predicciones: 5, deportistas: 2 })
    // importarlo de nuevo no duplica nada
    expect(await importar(db, JSON.stringify(respaldoV1))).toMatchObject({ predicciones: 0, deportistas: 0 })
  })

  it('si la ficha ya existe, no la duplica', async () => {
    await crearDeportista(db, { nombre: 'CAMILA' })
    await migrarDesdeV1(db, almacen({ [CLAVE_V1]: JSON.stringify(V1) }))
    expect((await db.deportistas.toArray()).map((d) => d.nombre).sort()).toEqual(['CAMILA', 'Grupo 10B'])
  })
})

describe('exportar e importar', () => {
  async function poblar(d: CalibraDB) {
    await guardarAjustes(d, { rol: 'deportivo', tema: 'oscuro' })
    await cargarEjemplo(d, 'deportivo', '2026-10-03', 4)
    const real = await crearDeportista(d, { nombre: 'Ana Gómez', nota: '800 m', foto: 'data:image/jpeg;base64,AAAA' })
    await registrarSesion(d, { deportistaId: real.id, fecha: '2026-10-02', rpe: 6, minutos: 75, tipo: 'pista' })
    const p = await anotar(d, { deportistaId: real.id, etiqueta: 'Baja de 2:10', confianza: 65, fecha: '2026-10-10', rol: 'deportivo' })
    const q = await anotar(d, { deportistaId: null, etiqueta: 'Llueve el sábado', confianza: 35, fecha: '2026-10-04', rol: 'deportivo' })
    await cerrar(d, q.id, true)
    return p
  }

  it('ida y vuelta: devuelve exactamente los mismos datos', async () => {
    await poblar(db)
    const ida = await exportar(db, new Date('2026-10-03T12:00:00Z'))
    const texto = respaldoComoTexto(ida)

    const otra = new CalibraDB('prueba-destino-' + n++)
    await otra.open()
    const resumen = await importar(otra, texto)
    expect(resumen.predicciones).toBe(ida.predicciones.length)
    const vuelta = await exportar(otra, new Date('2026-10-03T12:00:00Z'))
    expect(vuelta).toEqual(ida)
    expect(respaldoComoTexto(vuelta)).toBe(texto)
    await otra.delete()
  })

  it('importar no sobreescribe: una predicción existente conserva su confianza', async () => {
    const p = await poblar(db)
    const r = await exportar(db)
    const trucado = { ...r, predicciones: r.predicciones.map((x) => (x.id === p.id ? { ...x, confianza: 5 } : x)) }
    const resumen = await importar(db, JSON.stringify(trucado))
    expect(resumen.predicciones).toBe(0)
    expect((await db.predicciones.get(p.id))!.confianza).toBe(65)
  })

  it('rechaza texto que no es un respaldo', async () => {
    await expect(importar(db, 'hola')).rejects.toThrow(RespaldoInvalido)
    await expect(importar(db, '{"app":"otra"}')).rejects.toThrow(RespaldoInvalido)
  })
})

describe('datos de ejemplo', () => {
  it('se cargan marcados y se borran sin tocar lo real', async () => {
    const real = await crearDeportista(db, { nombre: 'Ana' })
    await anotar(db, { deportistaId: real.id, etiqueta: 'real', confianza: 50, fecha: '2026-10-03', rol: 'docente' })
    await cargarEjemplo(db, 'docente', '2026-10-03', 3)
    const ejemplo = (await db.deportistas.toArray()).find((d) => d.ejemplo)!
    // una predicción real anotada sobre una ficha de ejemplo
    const colgada = await anotar(db, { deportistaId: ejemplo.id, etiqueta: 'real 2', confianza: 60, fecha: '2026-10-03', rol: 'docente' })
    expect(await db.deportistas.count()).toBe(4)

    await borrarEjemplo(db)
    expect((await db.deportistas.toArray()).map((d) => d.nombre)).toEqual(['Ana'])
    expect(await db.predicciones.count()).toBe(2)
    expect(await db.sesiones.count()).toBe(0)
    expect((await db.predicciones.get(colgada.id))!.deportistaId).toBeNull()
  })

  it('aguanta 60 deportistas', async () => {
    await cargarEjemplo(db, 'deportivo', '2026-10-03', 60)
    expect(await db.deportistas.count()).toBe(60)
    expect(new Set((await db.deportistas.toArray()).map((d) => d.nombre)).size).toBe(60)
  })
})
