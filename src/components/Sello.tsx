import { motion, useReducedMotion } from 'framer-motion'
import s from './Sello.module.css'

type Props = {
  confianza: number
  estado: 'pendiente' | 'si' | 'no'
  /** Estampar con animación (al cerrar). */
  estampar?: boolean
  pequeno?: boolean
}

/** El sello de libreta: la confianza que quedó congelada. */
export function Sello({ confianza, estado, estampar, pequeno }: Props) {
  const reducir = useReducedMotion()
  const texto = estado === 'pendiente' ? 'pendiente' : estado === 'si' ? 'ocurrió' : 'no ocurrió'
  const clase = [s.sello, s[estado], pequeno ? s.pequeno : ''].join(' ')
  const etiqueta = `Confianza ${confianza}%, ${texto}`
  if (estampar && !reducir) {
    return (
      <motion.div
        className={clase}
        role="img"
        aria-label={etiqueta}
        initial={{ scale: 1.9, rotate: -14, opacity: 0 }}
        animate={{ scale: 1, rotate: -3, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 520, damping: 22, mass: 0.7 }}
      >
        <span className={`${s.n} num`}>{confianza}%</span>
        {texto}
      </motion.div>
    )
  }
  return (
    <div className={clase} role="img" aria-label={etiqueta}>
      <span className={`${s.n} num`}>{confianza}%</span>
      {texto}
    </div>
  )
}
