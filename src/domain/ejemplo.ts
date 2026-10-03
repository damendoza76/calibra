import { colorPara } from './colores'
import { cargaSesion } from './carga'
import type { Cierre } from './calibracion'
import { sumarDias } from './lenguaje'
import { ROLES } from './roles'
import type { Deportista, Prediccion, Rol, Sesion } from './tipos'

/*
 * Datos ilustrativos. Dos usos distintos, nunca mezclados con lo real:
 *  1. ejemploCierres / ejemploSesiones: alimentan paneles marcados
 *     «ejemplo ilustrativo · no son tus datos» y no se guardan.
 *  2. generarEjemplo: lo que carga el botón de Ajustes; cada registro lleva `ejemplo: true`
 *     y «borrar los datos de ejemplo» los quita sin tocar nada más.
 */

/** Generador pseudoaleatorio con semilla: el ejemplo sale igual cada vez. */
export function azar(semilla: number) {
  let a = semilla >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const CONFIANZAS = [85, 90, 80, 75, 95, 85, 70, 60, 90, 55, 65, 80, 75, 85, 50, 95, 30, 40, 25, 70]

/** Historial de alguien que ya lleva un rato: sobreestima al principio y se va calibrando. */
export function ejemploCierres(hoy: string): Cierre[] {
  const out: Cierre[] = []
  // difusión de error en vez de azar: cada tramo acierta casi exactamente lo previsto
  let acumulado = 0.5
  for (let i = 0; i < 48; i++) {
    const confianza = CONFIANZAS[(i * 7) % CONFIANZAS.length]
    const diasAtras = 118 - Math.floor(i * 2.4)
    const exceso = 22 - (i / 47) * 18 // se calibra con el tiempo: de ~22 a ~4 puntos
    acumulado += Math.max(0, confianza - exceso) / 100
    const resultado = acumulado >= 1
    if (resultado) acumulado -= 1
    out.push({ confianza, resultado, cerradaEn: sumarDias(hoy, -diasAtras) + 'T15:00:00.000Z' })
  }
  return out
}

/** Sesiones ilustrativas: nueve alrededor de 400 y una de 250, como en la charla. */
export function ejemploSesiones(hoy: string): Sesion[] {
  const cargas = [380, 420, 410, 390, 400, 430, 370, 400, 400, 250]
  return cargas.map((carga, i) => ({
    id: 'ej' + i,
    deportistaId: 'ejemplo',
    fecha: sumarDias(hoy, -(cargas.length - 1 - i) * 3),
    rpe: Math.round(carga / 60),
    minutos: 60,
    carga,
    ejemplo: true,
  }))
}

const NOMBRES = [
  ['Camila Rojas', '400 m'],
  ['Grupo 10B', 'clase de los martes'],
  ['Andrés Pinzón', 'cliente 6 a.m.'],
  ['Valentina Suárez', 'fondo, 10 km'],
  ['Juan David Mora', 'arquero sub-17'],
  ['Laura Chaparro', 'cliente 7 p.m.'],
  ['Santiago Ávila', 'salto largo'],
  ['Grupo 11A', 'clase de los jueves'],
  ['María José Lozano', 'natación'],
  ['Nicolás Forero', 'ciclismo de ruta'],
  ['Daniela Rincón', 'cliente 5 p.m.'],
  ['Sebastián Cárdenas', 'voleibol'],
]

export type DatosEjemplo = { deportistas: Deportista[]; predicciones: Prediccion[]; sesiones: Sesion[] }

export function generarEjemplo(opciones: { cuantos?: number; hoy: string; rol: Rol; semilla?: number }): DatosEjemplo {
  const { cuantos = 3, hoy, rol } = opciones
  const r = azar(opciones.semilla ?? 2026)
  const deportistas: Deportista[] = []
  const predicciones: Prediccion[] = []
  const sesiones: Sesion[] = []
  const sug = ROLES[rol].sugerencias
  const ahoraISO = (f: string, h = 15) => `${f}T${h < 10 ? '0' : ''}${h}:00:00.000Z`

  for (let d = 0; d < cuantos; d++) {
    const [nombre, nota] = NOMBRES[d % NOMBRES.length]
    const id = `ejd${d}`
    deportistas.push({
      id,
      nombre: d < NOMBRES.length ? nombre : `${nombre} ${Math.floor(d / NOMBRES.length) + 1}`,
      nota,
      color: colorPara(d),
      archivado: false,
      creadoEn: ahoraISO(sumarDias(hoy, -120), 9),
      ejemplo: true,
    })

    // sesiones: ~3 por semana durante 8 semanas
    const base = 300 + r() * 250
    for (let dia = -55; dia <= 0; dia++) {
      if (r() > 0.43) continue
      const rpe = Math.max(2, Math.min(9, Math.round(base / 70 + (r() - 0.5) * 4)))
      const minutos = Math.round((45 + r() * 55) / 5) * 5
      sesiones.push({
        id: `ejs${d}_${dia + 55}`,
        deportistaId: id,
        fecha: sumarDias(hoy, dia),
        rpe,
        minutos,
        carga: cargaSesion(rpe, minutos),
        tipo: ['fuerza', 'pista', 'técnica', 'partido'][Math.floor(r() * 4)],
        ejemplo: true,
      })
    }

    // predicciones cerradas: algo de exceso de confianza
    const cerradas = 6 + Math.floor(r() * 6)
    for (let k = 0; k < cerradas; k++) {
      const confianza = CONFIANZAS[(d * 7 + k) % CONFIANZAS.length]
      const diasAtras = 5 + Math.floor(r() * 110)
      const fecha = sumarDias(hoy, -diasAtras)
      predicciones.push({
        id: `ejp${d}_${k}`,
        deportistaId: id,
        etiqueta: sug[(d + k) % sug.length],
        confianza,
        fecha,
        creadaEn: ahoraISO(sumarDias(fecha, -3), 8),
        estado: 'cerrada',
        resultado: r() * 100 < confianza - 12,
        cerradaEn: ahoraISO(fecha, 18),
        rol,
        ejemplo: true,
      })
    }
    // una pendiente que ya se puede cerrar y otra que espera
    for (const [k, delta] of [[0, -1], [1, 4]] as const) {
      predicciones.push({
        id: `ejq${d}_${k}`,
        deportistaId: id,
        etiqueta: sug[(d + k + 2) % sug.length],
        confianza: 60 + Math.floor(r() * 7) * 5,
        fecha: sumarDias(hoy, delta),
        creadaEn: ahoraISO(sumarDias(hoy, -2), 8),
        estado: 'pendiente',
        resultado: null,
        cerradaEn: null,
        rol,
        ejemplo: true,
      })
    }
  }
  // una general, sin persona, ya vencida
  predicciones.push({
    id: 'ejg0',
    deportistaId: null,
    etiqueta: 'El torneo intercolegiado se juega en la fecha prevista',
    confianza: 80,
    fecha: sumarDias(hoy, -9),
    creadaEn: ahoraISO(sumarDias(hoy, -20), 8),
    estado: 'pendiente',
    resultado: null,
    cerradaEn: null,
    rol,
    ejemplo: true,
  })
  return { deportistas, predicciones, sesiones }
}
