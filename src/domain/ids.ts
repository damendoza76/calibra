export function uid(prefijo: string): string {
  const azar =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 10)
      : Math.random().toString(36).slice(2, 12)
  return prefijo + Date.now().toString(36) + azar
}
