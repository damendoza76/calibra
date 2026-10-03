import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { IconoAjustes, IconoAtras } from './Iconos'
import s from './Encabezado.module.css'

/** Barra superior: marca + acceso a Ajustes, o botón de volver en pantallas internas. */
export function Encabezado({ volver, derecha }: { volver?: boolean; derecha?: ReactNode }) {
  const nav = useNavigate()
  return (
    <header className={s.barra}>
      {volver ? (
        <button type="button" className={s.volver} onClick={() => (history.length > 1 ? nav(-1) : nav('/'))} aria-label="Volver">
          <IconoAtras />
        </button>
      ) : (
        <Link to="/" className={s.marca} aria-label="Calibra, inicio">
          <span className={s.w}>
            Calib<b>ra</b>
          </span>
          <span className={s.sub}>bitácora de pronósticos</span>
        </Link>
      )}
      <div className={s.derecha}>
        {derecha}
        <Link to="/ajustes" className={s.ajustes} aria-label="Ajustes">
          <IconoAjustes />
        </Link>
      </div>
    </header>
  )
}
