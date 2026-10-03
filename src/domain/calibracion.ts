import { aISO, diasDesde, mesLargo, plural, sumarDias } from './lenguaje'
import type { Prediccion, Rol } from './tipos'

/* ------------------------------------------------------------------ */
/* Bandas de confianza (las mismas de la v1)                           */
/* ------------------------------------------------------------------ */

export type Banda = { lo: number; hi: number; nombre: string }

export const BANDAS: Banda[] = [
  { lo: 0, hi: 20, nombre: 'Casi seguro que no' },
  { lo: 20, hi: 40, nombre: 'Poco probable' },
  { lo: 40, hi: 60, nombre: 'Moneda al aire' },
  { lo: 60, hi: 80, nombre: 'Probable' },
  { lo: 80, hi: 101, nombre: 'Casi seguro que sí' },
]

export function bandaDe(confianza: number): Banda {
  return BANDAS.find((b) => confianza >= b.lo && confianza < b.hi) ?? BANDAS[BANDAS.length - 1]
}

/** Mínimo de cierres para que el cálculo diga algo que valga la pena. */
export const MIN_CIERRES = 5
/** Por debajo de este margen (en puntos) hablamos de buena calibración. */
export const MARGEN_CALIBRADO = 5

/* ------------------------------------------------------------------ */
/* Análisis                                                            */
/* ------------------------------------------------------------------ */

export type Cierre = { confianza: number; resultado: boolean; cerradaEn?: string | null }

export type ResultadoBanda = {
  nombre: string
  lo: number
  hi: number
  n: number
  aciertos: number
  dices: number // promedio de confianza en la banda
  ocurre: number // % de veces que ocurrió
  minimo: number // franja de incertidumbre (Wilson 95 %)
  maximo: number
}

export type Analisis = {
  n: number
  aciertos: number
  dices: number
  ocurre: number
  sesgo: number // dices − ocurre: positivo = sobreestimas
  bandas: ResultadoBanda[]
}

/** Intervalo de Wilson al 95 % para una proporción, en %. Se porta bien con pocos datos. */
export function wilson(aciertos: number, n: number, z = 1.96): [number, number] {
  if (n === 0) return [0, 100]
  const p = aciertos / n
  const z2 = z * z
  const centro = (p + z2 / (2 * n)) / (1 + z2 / n)
  const margen = (z * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n))) / (1 + z2 / n)
  return [Math.max(0, centro - margen) * 100, Math.min(1, centro + margen) * 100]
}

export function analiza(cierres: Cierre[]): Analisis | null {
  const n = cierres.length
  if (!n) return null
  let suma = 0
  let aciertos = 0
  for (const c of cierres) {
    suma += c.confianza
    if (c.resultado) aciertos++
  }
  const dices = suma / n
  const ocurre = (aciertos / n) * 100
  const bandas: ResultadoBanda[] = []
  for (const b of BANDAS) {
    const dentro = cierres.filter((c) => c.confianza >= b.lo && c.confianza < b.hi)
    if (!dentro.length) continue
    const h = dentro.filter((c) => c.resultado).length
    const [minimo, maximo] = wilson(h, dentro.length)
    bandas.push({
      nombre: b.nombre,
      lo: b.lo,
      hi: Math.min(b.hi, 100),
      n: dentro.length,
      aciertos: h,
      dices: dentro.reduce((s, c) => s + c.confianza, 0) / dentro.length,
      ocurre: (h / dentro.length) * 100,
      minimo,
      maximo,
    })
  }
  return { n, aciertos, dices, ocurre, sesgo: dices - ocurre, bandas }
}

/* ------------------------------------------------------------------ */
/* Frases                                                              */
/* ------------------------------------------------------------------ */

export type TipoVeredicto = 'bien' | 'sobre' | 'sub'

export function tipoVeredicto(a: Analisis): TipoVeredicto {
  if (Math.abs(a.sesgo) < MARGEN_CALIBRADO) return 'bien'
  return a.sesgo > 0 ? 'sobre' : 'sub'
}

export function veredicto(a: Analisis): { tipo: TipoVeredicto; titular: string; detalle: string } {
  const tipo = tipoVeredicto(a)
  const abs = Math.abs(a.sesgo).toFixed(0)
  const cifras = `Dices ${a.dices.toFixed(0)}% en promedio, y las cosas ocurren el ${a.ocurre.toFixed(0)}% de las veces.`
  if (tipo === 'bien') {
    return {
      tipo,
      titular: 'Estás bien calibrado.',
      detalle: `Lo que dices y lo que pasa van casi a la par: dices ${a.dices.toFixed(0)}% en promedio y ocurre el ${a.ocurre.toFixed(0)}% de las veces.`,
    }
  }
  if (tipo === 'sobre') return { tipo, titular: `Tiendes a sobreestimar, ~${abs} puntos.`, detalle: cifras }
  return { tipo, titular: `Tiendes a subestimar, ~${abs} puntos.`, detalle: cifras }
}

/** Una frase práctica, apoyada en la banda con más registros (igual que la v1). */
export function lectura(a: Analisis): string {
  const top = [...a.bandas].sort((x, y) => y.n - x.n)[0]
  const tipo = tipoVeredicto(a)
  let frase: string
  if (tipo === 'bien') {
    frase =
      'Cuando pones un número, ese número significa algo. Sigue anotando: la calibración se mantiene con el hábito, no se consigue una vez.'
  } else if (tipo === 'sobre') {
    frase = `Cuando digas que estás ${Math.round(top.dices)}% seguro, en la práctica aciertas menos que eso — conviene bajar un poco la confianza cuando el número se sienta así de alto.`
  } else {
    frase = `Te estás quedando corto: cuando digas ${Math.round(top.dices)}% podrías subirle, porque en la práctica pasa más de lo que anuncias. Tu criterio es mejor de lo que le reconoces.`
  }
  const alto = a.bandas.find((b) => b.lo >= 80)
  if (alto && alto.n >= 3 && alto.dices - alto.ocurre > 12) {
    frase += ` Ojo con tus «casi seguro»: de ${alto.n} veces que lo dijiste, ocurrió ${alto.aciertos}.`
  }
  return frase
}

/** La franja corta de la pantalla Hoy. */
export function lecturaCorta(a: Analisis): string {
  const tipo = tipoVeredicto(a)
  const abs = Math.round(Math.abs(a.sesgo))
  if (tipo === 'bien') return 'Ahora mismo estás bien calibrado: lo que dices y lo que pasa van a la par.'
  if (tipo === 'sobre') return `Ahora mismo sobreestimas ~${abs} puntos: prometes más de lo que pasa.`
  return `Ahora mismo subestimas ~${abs} puntos: pasa más de lo que anuncias.`
}

/** Frase honesta al cerrar, cuando el resultado contradice una confianza extrema. */
export function fraseContradiccion(confianza: number, resultado: boolean): string | null {
  if (confianza >= 80 && !resultado)
    return `Dijiste ${confianza}% y no pasó — eso es exactamente lo que esta bitácora existe para mostrarte.`
  if (confianza <= 20 && resultado)
    return `Dijiste ${confianza}% y pasó — eso es exactamente lo que esta bitácora existe para mostrarte.`
  return null
}

export function fraseCurva(a: Analisis): string {
  const debajo = a.bandas.filter((b) => b.ocurre < b.dices - 8).length
  const encima = a.bandas.filter((b) => b.ocurre > b.dices + 8).length
  let s: string
  if (!debajo && !encima) s = 'Tus puntos caen cerca de la línea punteada: tu confianza coincide con lo que pasa.'
  else if (debajo >= encima)
    s = `${plural(debajo, 'grupo cae', 'grupos caen')} por debajo de la línea: ahí prometiste más de lo que pasó.`
  else s = `${plural(encima, 'grupo cae', 'grupos caen')} por encima de la línea: ahí pasó más de lo que prometiste.`
  if (a.bandas.some((b) => b.n < 5))
    s += ' La franja sombreada muestra dónde podría estar cada punto con tan pocos registros; se angosta a medida que anotas.'
  return s
}

export function fraseBarras(a: Analisis): string {
  const candidatas = a.bandas.filter((b) => b.n >= 2)
  const peor = [...(candidatas.length ? candidatas : a.bandas)].sort(
    (x, y) => Math.abs(y.dices - y.ocurre) - Math.abs(x.dices - x.ocurre),
  )[0]
  if (!peor || Math.abs(peor.dices - peor.ocurre) < 8)
    return 'En todas las bandas, lo que dices y lo que pasa van cerca. Así se ve un criterio calibrado.'
  return `La distancia más grande está en «${peor.nombre.toLowerCase()}»: dijiste ${Math.round(peor.dices)}% y pasó el ${Math.round(peor.ocurre)}%.`
}

/* ------------------------------------------------------------------ */
/* Evolución del sesgo mes a mes                                       */
/* ------------------------------------------------------------------ */

export type PuntoMes = { mes: string; n: number; sesgo: number; fiable: boolean }

export const MIN_POR_MES = 3

export function sesgoMensual(cierres: Cierre[]): PuntoMes[] {
  const grupos = new Map<string, Cierre[]>()
  for (const c of cierres) {
    if (!c.cerradaEn) continue
    const mes = aISO(new Date(c.cerradaEn)).slice(0, 7)
    const g = grupos.get(mes) ?? []
    g.push(c)
    grupos.set(mes, g)
  }
  return [...grupos.keys()].sort().map((mes) => {
    const a = analiza(grupos.get(mes)!)!
    return { mes, n: a.n, sesgo: a.sesgo, fiable: a.n >= MIN_POR_MES }
  })
}

export function fraseSesgo(meses: PuntoMes[]): string {
  const f = meses.filter((m) => m.fiable)
  if (f.length < 2)
    return 'Cuando tengas al menos dos meses con tres cierres o más, aquí verás si te estás calibrando con el tiempo.'
  const a = f[0]
  const b = f[f.length - 1]
  const da = Math.round(Math.abs(a.sesgo))
  const db = Math.round(Math.abs(b.sesgo))
  if (db <= da - 3)
    return `Te estás calibrando: en ${mesLargo(a.mes)} te desviabas ~${da} puntos; en ${mesLargo(b.mes)}, ~${db}. Ese es el premio por sostener el hábito.`
  if (db >= da + 3)
    return `Te estás alejando: en ${mesLargo(a.mes)} te desviabas ~${da} puntos; en ${mesLargo(b.mes)}, ~${db}. Vale la pena mirar qué cambió.`
  return `Estable: entre ${mesLargo(a.mes)} y ${mesLargo(b.mes)} tu desvío se mantiene alrededor de ${db} puntos.`
}

/* ------------------------------------------------------------------ */
/* Mapa de constancia (calendario)                                      */
/* ------------------------------------------------------------------ */

export type DiaMapa = { fecha: string; n: number; aciertos: number }

/** Días desde el lunes de hace `semanas` semanas hasta hoy, con los cierres de cada día. */
export function mapaAciertos(cierres: Cierre[], hoy: string, semanas = 12): DiaMapa[] {
  const porDia = new Map<string, DiaMapa>()
  for (const c of cierres) {
    if (!c.cerradaEn) continue
    const f = aISO(new Date(c.cerradaEn))
    const d = porDia.get(f) ?? { fecha: f, n: 0, aciertos: 0 }
    d.n++
    if (c.resultado) d.aciertos++
    porDia.set(f, d)
  }
  const diaSemana = (new Date(hoy + 'T12:00:00Z').getUTCDay() + 6) % 7 // 0 = lunes
  const inicio = sumarDias(hoy, -diaSemana - (semanas - 1) * 7)
  const dias: DiaMapa[] = []
  for (let f = inicio; f <= hoy; f = sumarDias(f, 1)) {
    dias.push(porDia.get(f) ?? { fecha: f, n: 0, aciertos: 0 })
  }
  return dias
}

/** Semanas seguidas (contando hacia atrás desde esta o la anterior) con al menos un cierre. */
export function rachaSemanas(dias: DiaMapa[]): number {
  const semanas: number[] = []
  for (let i = 0; i < dias.length; i += 7) semanas.push(dias.slice(i, i + 7).reduce((s, d) => s + d.n, 0))
  let k = semanas.length - 1
  if (k >= 0 && semanas[k] === 0) k-- // la semana en curso todavía puede llenarse
  let racha = 0
  for (; k >= 0 && semanas[k] > 0; k--) racha++
  return racha
}

export function fraseMapa(dias: DiaMapa[]): string {
  const activos = dias.filter((d) => d.n > 0).length
  if (!activos) return 'Cada día que cierres un pronóstico se pinta un cuadro. La constancia se ve aquí.'
  const racha = rachaSemanas(dias)
  const semanas = Math.ceil(dias.length / 7)
  let s = `Cerraste pronósticos en ${plural(activos, 'día', 'días')} de las últimas ${semanas} semanas.`
  if (racha >= 2) s += ` Llevas ${racha} semanas seguidas sin soltar el hábito.`
  return s
}

/* ------------------------------------------------------------------ */
/* Selección de cierres                                                */
/* ------------------------------------------------------------------ */

export type FiltroCalibracion = {
  deportistaId?: string | 'general' | null // null/undefined = todos
  rol?: Rol | null
  dias?: number | null // solo los cerrados en los últimos N días
}

export function cierresDe(predicciones: Prediccion[], filtro: FiltroCalibracion = {}, hoy?: string): Cierre[] {
  return predicciones
    .filter((p) => p.estado === 'cerrada' && p.resultado !== null)
    .filter((p) => {
      if (filtro.deportistaId === 'general') return p.deportistaId === null
      if (filtro.deportistaId) return p.deportistaId === filtro.deportistaId
      return true
    })
    .filter((p) => !filtro.rol || p.rol === filtro.rol)
    .filter((p) => !filtro.dias || !p.cerradaEn || diasDesde(aISO(new Date(p.cerradaEn)), hoy) <= filtro.dias)
    .map((p) => ({ confianza: p.confianza, resultado: p.resultado as boolean, cerradaEn: p.cerradaEn }))
}
