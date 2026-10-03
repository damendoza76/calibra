import { useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ActualizacionAnimada } from '../components/ActualizacionAnimada'
import { Avatar } from '../components/Avatar'
import { Encabezado } from '../components/Encabezado'
import { FormularioFicha } from '../components/FormularioFicha'
import { CurvaCalibracion, TablaBandas } from '../components/graficos/CurvaCalibracion'
import { CurvaCarga, LeyendaCarga } from '../components/graficos/CurvaCarga'
import { Grafico, MarcaEjemplo } from '../components/graficos/Grafico'
import { IconoMas } from '../components/Iconos'
import { RegistrarSesion } from '../components/RegistrarSesion'
import { TarjetaPendiente } from '../components/TarjetaPendiente'
import { useCierres } from '../components/useCierres'
import { useDatos } from '../datos'
import { borrarSesion, db } from '../db'
import { analiza, cierresDe, fraseCurva, MIN_CIERRES } from '../domain/calibracion'
import { actualizacionPorSesion, expectativas, fraseCurvaCarga, serieDiaria, type Actualizacion } from '../domain/carga'
import { ejemploCierres, ejemploSesiones } from '../domain/ejemplo'
import { fechaCorta, plural } from '../domain/lenguaje'
import { ordenarCerradas, ordenarPendientes } from '../domain/predicciones'
import type { Sesion } from '../domain/tipos'
import s from './Ficha.module.css'

const DIAS_CURVA = 42

export function Ficha() {
  const { id } = useParams()
  const { porId, sesiones, predicciones, hoy } = useDatos()
  const d = id ? porId.get(id) : undefined
  const [editando, setEditando] = useState(false)
  const [registrando, setRegistrando] = useState(false)
  const [recienGuardada, setRecien] = useState<{ a: Actualizacion; clave: string; id: string } | null>(null)
  const cajaActualizacion = useRef<HTMLElement>(null)
  const { cerrarConSello, borrar, conRecientes } = useCierres()

  const suyas = useMemo(() => sesiones.filter((x) => x.deportistaId === id), [sesiones, id])
  const preds = useMemo(() => predicciones.filter((p) => p.deportistaId === id), [predicciones, id])

  if (!d) {
    return (
      <>
        <Encabezado volver />
        <div className="empty" style={{ marginTop: 20 }}>
          <h3>No encontré esa ficha</h3>
          <p>Puede que se haya borrado con los datos de ejemplo.</p>
          <Link to="/deportistas" className="btn" style={{ marginTop: 14 }}>
            Ver todas las fichas
          </Link>
        </div>
      </>
    )
  }

  // «Camila» para Camila Rojas, pero «Grupo 10B» completo
  const corto = d.nombre.length <= 14 ? d.nombre : d.nombre.split(' ')[0]

  // ---------- carga ----------
  const pocasSesiones = suyas.length < 2
  const sesionesCurva = pocasSesiones ? ejemploSesiones(hoy) : suyas
  const serie = serieDiaria(sesionesCurva, hoy, DIAS_CURVA)
  const pts = expectativas(sesionesCurva)
  const ultimaReal = (() => {
    if (pocasSesiones) return null
    const ord = expectativas(suyas)
    const u = ord[ord.length - 1]
    if (!u || u.previa === null) return null
    return { a: { previa: u.previa, real: u.sesion.carga, nueva: u.nueva, n: u.n }, clave: u.sesion.id }
  })()
  // la animación recién registrada solo vale para esta ficha
  const recien = recienGuardada && recienGuardada.id === d.id ? recienGuardada : null
  const ejemploAct = { a: { previa: 400, real: 250, nueva: 385, n: 10 }, clave: 'ejemplo' }
  const actualizacion = recien ?? ultimaReal ?? ejemploAct
  const actEsEjemplo = actualizacion === ejemploAct

  // ---------- predicciones ----------
  const pendientes = conRecientes(ordenarPendientes(preds), (ps) => [...ps].sort((a, b) => a.fecha.localeCompare(b.fecha)))
  const cerradas = ordenarCerradas(preds)
  const cierres = cierresDe(preds)
  const pocosCierres = cierres.length < MIN_CIERRES
  const analisis = analiza(pocosCierres ? ejemploCierres(hoy) : cierres)!

  function alGuardarSesion(nueva: Sesion) {
    setRegistrando(false)
    const a = actualizacionPorSesion(suyas, nueva.carga)
    if (a) {
      setRecien({ a, clave: nueva.id, id: d!.id })
      setTimeout(() => cajaActualizacion.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 80)
    }
  }

  return (
    <>
      <Encabezado volver />

      <header className={s.cabeza} style={{ ['--color' as string]: d.color }}>
        <div className={s.franja} aria-hidden="true" />
        <div className={s.identidad}>
          <Avatar d={d} tam={72} />
          <div className={s.nombreCaja}>
            <h1 className={s.nombre}>{d.nombre}</h1>
            <p className={s.nota}>
              {d.nota && <span>{d.nota}</span>}
              {d.ejemplo && <span className={s.ejemplo}>ficha de ejemplo</span>}
              {d.archivado && <span className={s.ejemplo}>archivada</span>}
            </p>
          </div>
          <button type="button" className={`btn btn-sm btn-ghost ${s.editar}`} onClick={() => setEditando(true)}>
            Editar
          </button>
        </div>
        <div className={s.resumen}>
          <span>
            <b className="num">{suyas.length}</b> {suyas.length === 1 ? 'sesión' : 'sesiones'}
          </span>
          <span>
            <b className="num">{pendientes.filter((p) => p.estado === 'pendiente').length}</b> pendientes
          </span>
          <span>
            <b className="num">{cerradas.length}</b> cerradas
          </span>
        </div>
        <div className={s.acciones}>
          <button type="button" className="btn btn-primary" onClick={() => setRegistrando(true)}>
            <IconoMas width={18} height={18} /> Registrar sesión
          </button>
          <Link to={`/anotar?d=${d.id}`} className="btn">
            Anotar pronóstico
          </Link>
        </div>
      </header>

      {/* ---------- la actualización ---------- */}
      <section ref={cajaActualizacion} className={`card ${s.actualizacion}`} aria-labelledby="t-act">
        {actEsEjemplo && <MarcaEjemplo />}
        <h2 id="t-act" className={s.h2}>
          {recien ? 'Así se actualiza tu expectativa' : actEsEjemplo ? 'Cómo se actualiza una expectativa' : 'La última actualización'}
        </h2>
        <ActualizacionAnimada a={actualizacion.a} clave={actualizacion.clave} />
        {actEsEjemplo && (
          <p className="note" style={{ marginTop: 10, textAlign: 'center' }}>
            El ejemplo de la charla. Con dos sesiones registradas, aquí aparecen los números de {corto}.
          </p>
        )}
      </section>

      {/* ---------- curva de carga ---------- */}
      <div className={s.seccion}>
        <Grafico
          titulo="Carga de entrenamiento"
          ejemplo={pocasSesiones}
          frase={
            pocasSesiones
              ? 'Así se verá cuando registres sesiones: las barras son la carga de cada día y la línea, lo que esperabas. Las sesiones que se salen mucho llevan un punto.'
              : fraseCurvaCarga(serie)
          }
          tabla={
            <TablaSesiones
              filas={[...pts].reverse().slice(0, 12).map((p) => p)}
              editable={!pocasSesiones}
            />
          }
        >
          <CurvaCarga serie={serie} color={d.color} />
          <LeyendaCarga color={d.color} />
        </Grafico>
        <details className={s.metodo}>
          <summary>¿De dónde sale la línea?</summary>
          <p>
            Carga de la sesión = esfuerzo percibido (0-10) × minutos: es el RPE de sesión de Foster (2001), una forma
            validada de medir la carga interna.
          </p>
          <p>
            La línea usa la regla de la charla: <span className="mono">nueva = previa + (1/n) × (real − previa)</span>. Da el
            promedio de todas las sesiones y se puede hacer a mano; es una simplificación. En la práctica se usan promedios que
            pesan más lo reciente (la variante EWMA del ACWR; Williams et al., 2017).
          </p>
          <p>
            Úsala para contrastar lo que esperabas con lo que pasó, <strong>no para predecir lesiones</strong>: esa capacidad
            del ACWR está cuestionada (Impellizzeri et al., 2020).
          </p>
        </details>
      </div>

      {/* ---------- predicciones ---------- */}
      <div className="sec-title">
        <h2>Pronósticos sobre {corto}</h2>
      </div>
      {pendientes.length === 0 && cerradas.length === 0 ? (
        <div className="empty">
          <p>Todavía no has anotado nada sobre esta ficha.</p>
          <Link to={`/anotar?d=${d.id}`} className="btn btn-primary" style={{ marginTop: 14 }}>
            Anotar el primero
          </Link>
        </div>
      ) : (
        <div className={s.lista}>
          {pendientes.map((p) => (
            <TarjetaPendiente
              key={p.id}
              p={p}
              deportista={d}
              hoy={hoy}
              mostrarPersona={false}
              onCerrar={(r) => cerrarConSello(p, r)}
              onBorrar={() => borrar(p)}
            />
          ))}
          {cerradas.length > 0 && (
            <p className="note">
              {plural(cerradas.length, 'cerrada', 'cerradas')}:{' '}
              {cerradas.filter((p) => p.resultado).length} ocurrieron, {cerradas.filter((p) => !p.resultado).length} no.
            </p>
          )}
        </div>
      )}

      <div className={s.seccion}>
        <Grafico
          titulo={`Tu calibración con ${corto}`}
          ejemplo={pocosCierres}
          frase={
            pocosCierres
              ? `Llevas ${cierres.length} de ${MIN_CIERRES} cierres sobre esta ficha. Con ${MIN_CIERRES} aparece tu propia curva; mientras tanto, así se ve la de alguien que ya lleva un rato.`
              : fraseCurva(analisis)
          }
          tabla={<TablaBandas a={analisis} />}
        >
          <CurvaCalibracion a={analisis} />
        </Grafico>
      </div>

      {editando && <FormularioFicha ficha={d} onCerrar={() => setEditando(false)} />}
      {registrando && (
        <RegistrarSesion d={d} hoy={hoy} onCerrar={() => setRegistrando(false)} onGuardada={alGuardarSesion} />
      )}
    </>
  )
}

function TablaSesiones({ filas, editable }: { filas: ReturnType<typeof expectativas>; editable: boolean }) {
  const [armada, setArmada] = useState<string | null>(null)
  return (
    <table>
      <thead>
        <tr>
          <th>Fecha</th>
          <th>RPE×min</th>
          <th>carga</th>
          <th>esperabas</th>
          {editable && <th aria-label="Acciones" />}
        </tr>
      </thead>
      <tbody>
        {filas.map((p) => (
          <tr key={p.sesion.id}>
            <td>{fechaCorta(p.sesion.fecha).replace(/ \d{4}$/, '')}</td>
            <td>
              {p.sesion.rpe}×{p.sesion.minutos}
            </td>
            <td>{p.sesion.carga}</td>
            <td>{p.previa === null ? '—' : Math.round(p.previa)}</td>
            {editable && (
              <td>
                <button
                  type="button"
                  className={s.borrarSesion}
                  aria-label={`Borrar la sesión del ${fechaCorta(p.sesion.fecha)}`}
                  onClick={() => {
                    if (armada === p.sesion.id) borrarSesion(db, p.sesion.id)
                    else setArmada(p.sesion.id)
                  }}
                >
                  {armada === p.sesion.id ? '¿borrar?' : '×'}
                </button>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
