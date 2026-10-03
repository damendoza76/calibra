import { NavLink } from 'react-router-dom'
import { IconoCalibracion, IconoFichas, IconoHoy, IconoMas, IconoPendientes } from './Iconos'
import s from './BarraInferior.module.css'

export function BarraInferior({ pendientesListas }: { pendientesListas: number }) {
  const clase = ({ isActive }: { isActive: boolean }) => (isActive ? `${s.tab} ${s.activa}` : s.tab)
  return (
    <nav className={s.barra} aria-label="Secciones">
      <div className={s.interior}>
        <NavLink to="/" end className={clase}>
          <IconoHoy />
          <span>Hoy</span>
        </NavLink>
        <NavLink to="/deportistas" className={clase}>
          <IconoFichas />
          <span>Fichas</span>
        </NavLink>
        <NavLink to="/anotar" className={s.anotar} aria-label="Anotar predicción">
          <span className={s.botonMas}>
            <IconoMas />
          </span>
          <span>Anotar</span>
        </NavLink>
        <NavLink to="/pendientes" className={clase}>
          <span className={s.conInsignia}>
            <IconoPendientes />
            {pendientesListas > 0 && (
              <span className={s.insignia} aria-label={`${pendientesListas} para cerrar`}>
                {pendientesListas}
              </span>
            )}
          </span>
          <span>Pendientes</span>
        </NavLink>
        <NavLink to="/calibracion" className={clase}>
          <IconoCalibracion />
          <span>Calibración</span>
        </NavLink>
      </div>
    </nav>
  )
}
