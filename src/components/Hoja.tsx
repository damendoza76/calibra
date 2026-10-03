import { motion } from 'framer-motion'
import { useEffect, useRef, type ReactNode } from 'react'
import s from './Hoja.module.css'

/** Hoja que sube desde abajo (formularios cortos). Escape o tocar fuera la cierra. */
export function Hoja({ titulo, onCerrar, children }: { titulo: string; onCerrar: () => void; children: ReactNode }) {
  const caja = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null
    caja.current?.querySelector<HTMLElement>('input, button, textarea')?.focus()
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar()
    document.addEventListener('keydown', tecla)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', tecla)
      document.body.style.overflow = ''
      anterior?.focus?.()
    }
  }, [onCerrar])

  return (
    <div className={s.velo} onClick={(e) => e.target === e.currentTarget && onCerrar()}>
      <motion.div
        ref={caja}
        className={s.hoja}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.22, ease: [0.2, 0.7, 0.2, 1] }}
      >
        <div className={s.asa} aria-hidden="true" />
        <div className={s.cabeza}>
          <h2>{titulo}</h2>
          <button type="button" className={s.cerrar} onClick={onCerrar} aria-label="Cerrar">
            ×
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  )
}
