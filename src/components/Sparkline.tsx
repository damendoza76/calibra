/** Mini curva de carga semanal. Sin ejes: solo la forma, con el último punto marcado. */
export function Sparkline({ valores, color, ancho = 84, alto = 28 }: { valores: number[]; color: string; ancho?: number; alto?: number }) {
  const max = Math.max(...valores, 1)
  const pad = 3
  const paso = (ancho - pad * 2) / Math.max(valores.length - 1, 1)
  const pts = valores.map((v, i) => [pad + i * paso, alto - pad - (v / max) * (alto - pad * 2)] as const)
  const linea = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const area = `${linea} L${pts[pts.length - 1][0].toFixed(1)},${alto - pad} L${pad},${alto - pad} Z`
  const vacia = valores.every((v) => v === 0)
  const [ux, uy] = pts[pts.length - 1]
  return (
    <svg
      width={ancho}
      height={alto}
      viewBox={`0 0 ${ancho} ${alto}`}
      role="img"
      style={{ filter: 'var(--color-ficha-filtro, none)', flex: 'none' }}
      aria-label={
        vacia
          ? 'Sin sesiones registradas en las últimas semanas'
          : `Carga semanal de las últimas ${valores.length} semanas: ${valores.map((v) => Math.round(v)).join(', ')}`
      }
    >
      {vacia ? (
        <line x1={pad} x2={ancho - pad} y1={alto - pad} y2={alto - pad} stroke="var(--line-2)" strokeDasharray="2 3" />
      ) : (
        <>
          <path d={area} fill={color} opacity={0.18} />
          <path d={linea} fill="none" stroke={color} strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round" />
          <circle cx={ux} cy={uy} r={2.6} fill={color} stroke="var(--surface)" strokeWidth={1.2} />
        </>
      )}
    </svg>
  )
}
