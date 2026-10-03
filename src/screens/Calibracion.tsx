import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Encabezado } from '../components/Encabezado'
import { BarrasPareadas, LeyendaBarras } from '../components/graficos/BarrasPareadas'
import { CurvaCalibracion, TablaBandas } from '../components/graficos/CurvaCalibracion'
import { Grafico, MarcaEjemplo } from '../components/graficos/Grafico'
import { LeyendaMapa, MapaConstancia } from '../components/graficos/MapaConstancia'
import { SesgoMensual } from '../components/graficos/SesgoMensual'
import { useDatos } from '../datos'
import {
  analiza,
  cierresDe,
  fraseBarras,
  fraseCurva,
  fraseMapa,
  fraseSesgo,
  lectura,
  mapaAciertos,
  MIN_CIERRES,
  sesgoMensual,
  veredicto,
  type FiltroCalibracion,
} from '../domain/calibracion'
import { ejemploCierres } from '../domain/ejemplo'
import { mesLargo } from '../domain/lenguaje'
import { LISTA_ROLES, ROLES } from '../domain/roles'
import type { Rol } from '../domain/tipos'
import s from './Calibracion.module.css'

const PERIODOS: { k: string; dias: number | null }[] = [
  { k: 'Todo', dias: null },
  { k: '3 meses', dias: 90 },
  { k: '30 días', dias: 30 },
]

export function Calibracion() {
  const { predicciones, deportistas, hoy } = useDatos()
  const [persona, setPersona] = useState<string>('')
  const [dias, setDias] = useState<number | null>(null)
  const [rol, setRol] = useState<Rol | null>(null)

  const filtro: FiltroCalibracion = { deportistaId: persona || null, dias, rol }
  const reales = cierresDe(predicciones, filtro, hoy)
  const totalCierres = cierresDe(predicciones).length
  const esEjemplo = reales.length < MIN_CIERRES
  const datos = esEjemplo ? ejemploCierres(hoy) : reales
  const a = analiza(datos)!
  const v = veredicto(a)
  const meses = sesgoMensual(datos)
  const mapa = mapaAciertos(datos, hoy, 12)
  const hayFiltro = !!persona || dias !== null || rol !== null
  const conFichas = deportistas.filter((d) => predicciones.some((p) => p.deportistaId === d.id && p.estado === 'cerrada'))

  return (
    <>
      <Encabezado />
      <div className="sec-title" style={{ marginTop: 6 }}>
        <h1 className={s.titulo}>Tu calibración</h1>
        {!esEjemplo && <span className="count">{reales.length} cerradas</span>}
      </div>

      {/* ---------- filtros ---------- */}
      <div className={s.filtros}>
        <label className={s.selector}>
          <span className="sr-only">Sobre quién</span>
          <select value={persona} onChange={(e) => setPersona(e.target.value)}>
            <option value="">Todas las personas</option>
            <option value="general">Solo pronósticos generales</option>
            {conFichas
              .sort((x, y) => x.nombre.localeCompare(y.nombre, 'es'))
              .map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nombre}
                </option>
              ))}
          </select>
        </label>
        <div className={s.chips} role="group" aria-label="Periodo">
          {PERIODOS.map((p) => (
            <button key={p.k} type="button" aria-pressed={dias === p.dias} className={s.chip} onClick={() => setDias(p.dias)}>
              {p.k}
            </button>
          ))}
        </div>
        <div className={s.chips} role="group" aria-label="Rol">
          <button type="button" aria-pressed={rol === null} className={s.chip} onClick={() => setRol(null)}>
            Todos los roles
          </button>
          {LISTA_ROLES.map((r) => (
            <button key={r} type="button" aria-pressed={rol === r} className={s.chip} onClick={() => setRol(r)}>
              {ROLES[r].corto}
            </button>
          ))}
        </div>
      </div>

      {esEjemplo && (
        <div className="banner banner-note">
          <span className="ic">◑</span>
          <span>
            {hayFiltro && totalCierres >= MIN_CIERRES ? (
              <>
                Con este filtro hay <strong>{reales.length}</strong> {reales.length === 1 ? 'cierre' : 'cierres'}: no alcanza
                para una lectura. Prueba con un filtro más amplio.
              </>
            ) : (
              <>
                {reales.length === 0
                  ? 'Tu panel se llena solo, con cada pronóstico que cierres. '
                  : `Llevas ${reales.length} ${reales.length === 1 ? 'pronóstico cerrado' : 'pronósticos cerrados'}. `}
                <strong>
                  Faltan {MIN_CIERRES - reales.length} {MIN_CIERRES - reales.length === 1 ? 'cierre' : 'cierres'}
                </strong>{' '}
                para que el cálculo diga algo que valga la pena. Mientras tanto, así se ve con el historial de alguien que ya
                lleva un rato.
              </>
            )}
          </span>
        </div>
      )}

      {/* ---------- veredicto ---------- */}
      <section className={`card ${s.veredicto} ${s[v.tipo]}`} aria-labelledby="veredicto">
        {esEjemplo && <MarcaEjemplo />}
        <p id="veredicto" className={s.titular}>
          {v.titular}
        </p>
        <p className={s.detalle}>{v.detalle}</p>
        <MedidorGrande sesgo={a.sesgo} />
        <p className={s.lectura}>{lectura(a)}</p>
        <div className={s.cifras}>
          <div>
            <span className={s.k}>cerradas</span>
            <span className={`${s.v} num`}>{a.n}</span>
          </div>
          <div>
            <span className={s.k}>dices en promedio</span>
            <span className={`${s.v} num`}>{Math.round(a.dices)}%</span>
          </div>
          <div>
            <span className={s.k}>ocurre de verdad</span>
            <span className={`${s.v} num`}>{Math.round(a.ocurre)}%</span>
          </div>
        </div>
      </section>

      <div className={s.graficos}>
        <Grafico titulo="Lo que dijiste vs. lo que pasó" ejemplo={esEjemplo} frase={fraseBarras(a)} tabla={<TablaBandas a={a} />}>
          <BarrasPareadas a={a} />
          <LeyendaBarras />
        </Grafico>

        <Grafico titulo="Curva de calibración" ejemplo={esEjemplo} frase={fraseCurva(a)} tabla={<TablaBandas a={a} />}>
          <CurvaCalibracion a={a} />
        </Grafico>

        <Grafico
          titulo="¿Te estás calibrando?"
          ejemplo={esEjemplo}
          frase={fraseSesgo(meses)}
          tabla={
            <table>
              <thead>
                <tr>
                  <th>Mes</th>
                  <th>cierres</th>
                  <th>desvío</th>
                </tr>
              </thead>
              <tbody>
                {meses.map((m) => (
                  <tr key={m.mes}>
                    <td>{mesLargo(m.mes)}</td>
                    <td>{m.n}</td>
                    <td>
                      {m.sesgo > 0 ? '+' : ''}
                      {Math.round(m.sesgo)} {m.fiable ? '' : '(pocos datos)'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          }
        >
          {meses.length > 0 ? (
            <SesgoMensual meses={meses} />
          ) : (
            <p className="note">Todavía no hay meses que comparar.</p>
          )}
        </Grafico>

        <Grafico titulo="Tu constancia" ejemplo={esEjemplo} frase={fraseMapa(mapa)}>
          <MapaConstancia dias={mapa} />
          <LeyendaMapa />
        </Grafico>
      </div>

      <p className="note" style={{ marginTop: 16, textAlign: 'center' }}>
        Cada número sale solo de lo que anotaste y cerraste. Nada de esto pronostica por ti:{' '}
        <Link to="/anotar" style={{ color: 'var(--accent-deep)' }}>
          anotar y contrastar
        </Link>{' '}
        es el método.
      </p>
    </>
  )
}

/** Medidor del sesgo: centro = calibrado; derecha = prometes de más; izquierda = te quedas corto. */
function MedidorGrande({ sesgo }: { sesgo: number }) {
  const lim = 30
  const pos = 50 + (Math.max(-lim, Math.min(lim, sesgo)) / lim) * 45
  return (
    <div className={s.medidor} aria-hidden="true">
      <div className={s.pista}>
        <div className={s.zonaBien} />
        <div className={s.aguja} style={{ left: `${pos}%` }}>
          <span className="num">
            {sesgo > 0 ? '+' : sesgo < 0 ? '−' : ''}
            {Math.abs(Math.round(sesgo))}
          </span>
        </div>
      </div>
      <div className={s.rotulos}>
        <span>te quedas corto</span>
        <span>calibrado</span>
        <span>prometes de más</span>
      </div>
    </div>
  )
}
