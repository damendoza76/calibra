/* Fechas y palabras. Todas las funciones reciben «hoy» para poder probarlas. */

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const MESES_LARGOS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

const dos = (n: number) => (n < 10 ? '0' : '') + n

export function aISO(d: Date): string {
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`
}

export function hoyISO(): string {
  return aISO(new Date())
}

/** Días desde `iso` hasta `hoy` (positivo = ya pasó). */
export function diasDesde(iso: string, hoy: string = hoyISO()): number {
  const a = Date.parse(iso.slice(0, 10) + 'T12:00:00Z')
  const b = Date.parse(hoy.slice(0, 10) + 'T12:00:00Z')
  if (Number.isNaN(a) || Number.isNaN(b)) return 0
  return Math.round((b - a) / 86400000)
}

export function sumarDias(iso: string, n: number): string {
  const t = Date.parse(iso.slice(0, 10) + 'T12:00:00Z') + n * 86400000
  return new Date(t).toISOString().slice(0, 10)
}

export function fechaCorta(iso: string): string {
  const p = iso.slice(0, 10).split('-')
  if (p.length !== 3) return iso
  return `${parseInt(p[2], 10)} ${MESES[parseInt(p[1], 10) - 1] ?? ''} ${p[0]}`
}

export function mesLargo(mes: string): string {
  // mes = 'AAAA-MM'
  const [a, m] = mes.split('-')
  return `${MESES_LARGOS[parseInt(m, 10) - 1] ?? ''} ${a}`
}

export function mesCorto(mes: string): string {
  const [, m] = mes.split('-')
  return MESES[parseInt(m, 10) - 1] ?? mes
}

export function cuando(iso: string, hoy: string = hoyISO()): string {
  const d = diasDesde(iso, hoy)
  if (d === 0) return 'hoy'
  if (d === 1) return 'ayer'
  if (d === -1) return 'mañana'
  if (d < 0) return `en ${-d} días`
  return `hace ${d} días`
}

/** La lectura en palabras del deslizador de confianza (idéntica a la v1). */
export function confWord(v: number): string {
  if (v <= 10) return 'casi imposible'
  if (v <= 30) return 'poco probable'
  if (v <= 45) return 'más bien no'
  if (v <= 55) return 'moneda al aire'
  if (v <= 70) return 'probable'
  if (v <= 89) return 'bastante seguro'
  if (v <= 97) return 'casi seguro'
  return 'seguro — cuidado con los 100%'
}

export function plural(n: number, uno: string, varios: string): string {
  return `${n} ${n === 1 ? uno : varios}`
}

export function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean)
  if (!partes.length) return '?'
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
}
