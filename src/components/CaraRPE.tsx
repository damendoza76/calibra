/** Cara que acompaña la escala de Foster: de tranquila (0) a exhausta (10). */
export function CaraRPE({ rpe, tam = 56 }: { rpe: number; tam?: number }) {
  const t = Math.max(0, Math.min(10, rpe)) / 10
  // boca: sonrisa → recta → mueca abierta
  const curva = 7 - t * 14
  const abierta = t > 0.75
  const ojoAlto = 2.2 - t * 1.6 // los ojos se entrecierran
  const cejas = t > 0.45
  const sudor = t > 0.6
  const fondo = `color-mix(in srgb, var(--accent) ${Math.round(20 + t * 60)}%, var(--surface))`
  return (
    <svg width={tam} height={tam} viewBox="0 0 48 48" aria-hidden="true" style={{ flex: 'none' }}>
      <circle cx="24" cy="24" r="21" fill={fondo} stroke="var(--accent-deep)" strokeWidth="1.5" />
      <ellipse cx="17" cy="20" rx="2.2" ry={Math.max(0.5, ojoAlto)} fill="var(--on-accent)" />
      <ellipse cx="31" cy="20" rx="2.2" ry={Math.max(0.5, ojoAlto)} fill="var(--on-accent)" />
      {cejas && (
        <>
          <path d={`M13 ${14 - t * 2} L20 ${15 + t}`} stroke="var(--on-accent)" strokeWidth="1.6" strokeLinecap="round" />
          <path d={`M35 ${14 - t * 2} L28 ${15 + t}`} stroke="var(--on-accent)" strokeWidth="1.6" strokeLinecap="round" />
        </>
      )}
      {abierta ? (
        <ellipse cx="24" cy="33" rx={4 + t * 2} ry={2 + t * 3} fill="var(--on-accent)" />
      ) : (
        <path d={`M15 31 Q24 ${31 + curva} 33 31`} fill="none" stroke="var(--on-accent)" strokeWidth="2" strokeLinecap="round" />
      )}
      {sudor && <path d="M39 12 q2 4 0 6 q-2 -2 0 -6" fill="var(--surface)" stroke="var(--accent-deep)" strokeWidth="0.8" />}
    </svg>
  )
}
