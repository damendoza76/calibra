import { Link } from 'react-router-dom'
import { Encabezado } from '../components/Encabezado'
import { IconoFlecha, IconoMas } from '../components/Iconos'
import { TarjetaPendiente } from '../components/TarjetaPendiente'
import { useCierres } from '../components/useCierres'
import { useDatos } from '../datos'
import { analiza, cierresDe, lecturaCorta, MIN_CIERRES } from '../domain/calibracion'
import { cuando, plural } from '../domain/lenguaje'
import { estadoPendiente, ordenarPendientes } from '../domain/predicciones'
import s from './Hoy.module.css'

const MAX_EN_HOY = 4

function fechaLarga(iso: string) {
  const d = new Date(iso + 'T12:00:00')
  return d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })
}

export function Hoy() {
  const { predicciones, porId, hoy } = useDatos()
  const { cerrarConSello, conRecientes } = useCierres()

  const pendientes = ordenarPendientes(predicciones)
  const paraCerrar = pendientes.filter((p) => estadoPendiente(p, hoy) !== 'esperando')
  const vencidas = paraCerrar.filter((p) => estadoPendiente(p, hoy) === 'vencida')
  const proxima = pendientes.find((p) => estadoPendiente(p, hoy) === 'esperando')
  const visibles = conRecientes(paraCerrar.slice(0, MAX_EN_HOY), (ps) =>
    [...ps].sort((a, b) => a.fecha.localeCompare(b.fecha)),
  )

  const cierres = cierresDe(predicciones)
  const a = cierres.length >= MIN_CIERRES ? analiza(cierres) : null

  let resumen: string
  if (paraCerrar.length === 0) resumen = 'Nada que cerrar. Buen momento para anotar.'
  else resumen = `${plural(paraCerrar.length, 'pronóstico listo', 'pronósticos listos')} para cerrar`

  return (
    <div className={s.pantalla}>
      <Encabezado />

      <p className={s.fecha}>{fechaLarga(hoy)}</p>
      <h1 className={s.titulo}>Hoy</h1>
      <p className={s.resumen}>{resumen}</p>

      <Link to="/anotar" className={s.anotar}>
        <span className={s.anotarMas}>
          <IconoMas width={30} height={30} />
        </span>
        <span className={s.anotarTexto}>
          <strong>Anotar predicción</strong>
          <span>Antes de saber qué pasa · menos de 15 segundos</span>
        </span>
      </Link>

      <Link to="/calibracion" className={s.franja} aria-label="Ver tu calibración">
        {a ? (
          <>
            <Medidor sesgo={a.sesgo} />
            <span className={s.franjaTexto}>
              <span className={s.franjaK}>Tu lectura ahora · {a.n} cierres</span>
              <span className={s.franjaV}>{lecturaCorta(a)}</span>
            </span>
          </>
        ) : (
          <>
            <Progreso hechos={cierres.length} />
            <span className={s.franjaTexto}>
              <span className={s.franjaK}>Tu primera lectura</span>
              <span className={s.franjaV}>
                {cierres.length === 0
                  ? `Llega con ${MIN_CIERRES} pronósticos cerrados. Empieza por anotar uno.`
                  : `Llevas ${cierres.length} de ${MIN_CIERRES} cierres. Faltan ${MIN_CIERRES - cierres.length}.`}
              </span>
            </span>
          </>
        )}
        <IconoFlecha className={s.franjaFlecha} />
      </Link>

      {vencidas.length > 0 && (
        <div className={`banner banner-warn ${s.aviso}`}>
          <span className="ic">◷</span>
          <span>
            <strong>
              {vencidas.length === 1 ? '1 pronóstico lleva' : `${vencidas.length} pronósticos llevan`} más de una semana sin
              cerrar.
            </strong>{' '}
            Ciérralos aunque el resultado no te guste.
          </span>
        </div>
      )}

      <div className="sec-title">
        <h2>Para cerrar</h2>
        {paraCerrar.length > 0 && <span className="count">{paraCerrar.length}</span>}
        {pendientes.length > 0 && (
          <Link to="/pendientes" className="more">
            todas las pendientes →
          </Link>
        )}
      </div>

      {visibles.length === 0 ? (
        <div className="empty">
          <h3>Nada que cerrar hoy</h3>
          <p>
            {proxima
              ? `La próxima se sabe ${cuando(proxima.fecha, hoy)}: «${proxima.etiqueta}».`
              : 'Cuando anotes un pronóstico y llegue su fecha, aparecerá aquí para que marques qué pasó.'}
          </p>
        </div>
      ) : (
        <div className={s.lista}>
          {visibles.map((p) => (
            <TarjetaPendiente
              key={p.id}
              p={p}
              deportista={p.deportistaId ? porId.get(p.deportistaId) ?? null : null}
              hoy={hoy}
              onCerrar={(r) => cerrarConSello(p, r)}
            />
          ))}
          {paraCerrar.length > MAX_EN_HOY && (
            <Link to="/pendientes" className="btn btn-ghost">
              Ver las otras {paraCerrar.length - MAX_EN_HOY}
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

/** Medidor horizontal del sesgo: centro = calibrado, derecha = prometes de más. */
function Medidor({ sesgo }: { sesgo: number }) {
  const lim = 30
  const x = 50 + (Math.max(-lim, Math.min(lim, sesgo)) / lim) * 46
  const tipo = sesgo > 0 ? 'sobre' : 'sub'
  const bien = Math.abs(sesgo) < 5
  return (
    <svg viewBox="0 0 100 44" className={s.medidor} aria-hidden="true">
      <rect x="4" y="18" width="92" height="8" rx="4" className={s.medidorPista} />
      <rect x="42" y="18" width="16" height="8" className={s.medidorZona} />
      <line x1="50" y1="12" x2="50" y2="32" className={s.medidorCentro} />
      <circle cx={x} cy="22" r="7" className={bien ? s.medidorBien : tipo === 'sobre' ? s.medidorSobre : s.medidorSub} />
      <text x="4" y="42" className={s.medidorTxt}>
        corto
      </text>
      <text x="96" y="42" textAnchor="end" className={s.medidorTxt}>
        de más
      </text>
    </svg>
  )
}

function Progreso({ hechos }: { hechos: number }) {
  return (
    <svg viewBox="0 0 100 44" className={s.medidor} aria-hidden="true">
      {Array.from({ length: MIN_CIERRES }, (_, i) => (
        <circle key={i} cx={14 + i * 18} cy="22" r="7" className={i < hechos ? s.puntoLleno : s.puntoVacio} />
      ))}
    </svg>
  )
}
