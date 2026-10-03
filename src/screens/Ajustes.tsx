import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Encabezado } from '../components/Encabezado'
import { useDatos } from '../datos'
import {
  borrarEjemplo,
  borrarTodo,
  cargarEjemplo,
  db,
  exportar,
  guardarAjustes,
  importar,
  respaldoComoTexto,
  RespaldoInvalido,
} from '../db'
import { plural } from '../domain/lenguaje'
import { LISTA_ROLES, ROLES } from '../domain/roles'
import type { Tema } from '../domain/tipos'
import s from './Ajustes.module.css'

type Estado = { texto: string; tipo?: 'ok' | 'bad' }

const TEMAS: { k: Tema; nombre: string }[] = [
  { k: 'claro', nombre: 'Claro' },
  { k: 'oscuro', nombre: 'Oscuro' },
  { k: 'auto', nombre: 'Automático' },
]

export function Ajustes() {
  const { ajustes, rol, deportistas, predicciones, sesiones, hoy } = useDatos()
  const [respaldo, setRespaldo] = useState('')
  const [pegado, setPegado] = useState('')
  const [estExp, setEstExp] = useState<Estado>({ texto: '' })
  const [estImp, setEstImp] = useState<Estado>({ texto: '' })
  const [estEj, setEstEj] = useState<Estado>({ texto: '' })
  const [estBorrar, setEstBorrar] = useState<Estado>({ texto: '' })
  const [armado, setArmado] = useState(false)
  const importarRef = useRef<HTMLHeadingElement>(null)
  const [params] = useSearchParams()

  const ejemplo = deportistas.filter((d) => d.ejemplo).length
  const reales = {
    fichas: deportistas.filter((d) => !d.ejemplo).length,
    predicciones: predicciones.filter((p) => !p.ejemplo).length,
    sesiones: sesiones.filter((x) => !x.ejemplo).length,
  }

  // el respaldo se mantiene al día con lo que hay en la base
  useEffect(() => {
    exportar(db).then((r) => setRespaldo(respaldoComoTexto(r)))
  }, [deportistas, predicciones, sesiones, ajustes])

  useEffect(() => {
    if (params.has('importar')) importarRef.current?.scrollIntoView({ block: 'start' })
  }, [params])

  async function copiar() {
    try {
      await navigator.clipboard.writeText(respaldo)
      setEstExp({ texto: 'Copiado. Pégalo en una nota, un correo o un chat contigo mismo.', tipo: 'ok' })
    } catch {
      setEstExp({ texto: 'No pude copiarlo solo: selecciona el texto de abajo y cópialo a mano.', tipo: 'bad' })
    }
  }

  function descargar() {
    try {
      const url = URL.createObjectURL(new Blob([respaldo], { type: 'application/json' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `calibra-${hoy}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 2000)
      setEstExp({ texto: 'Archivo listo. Si no apareció ninguna descarga, usa «Copiar respaldo».' })
    } catch {
      setEstExp({ texto: 'Este navegador no permite descargar aquí. Usa «Copiar respaldo».', tipo: 'bad' })
    }
  }

  async function traer(texto: string) {
    if (!texto.trim()) {
      setEstImp({ texto: 'Pega primero el texto del respaldo.', tipo: 'bad' })
      return
    }
    try {
      const r = await importar(db, texto)
      const total = r.predicciones + r.deportistas + r.sesiones
      setPegado('')
      setEstImp(
        total
          ? {
              texto: `Listo${r.formato === 'v1' ? ' (respaldo de la versión de la charla)' : ''}: se añadieron ${plural(r.predicciones, 'predicción', 'predicciones')}, ${plural(r.deportistas, 'ficha', 'fichas')} y ${plural(r.sesiones, 'sesión', 'sesiones')}.`,
              tipo: 'ok',
            }
          : { texto: 'Ese respaldo ya estaba completo aquí: no había nada nuevo que añadir.', tipo: 'ok' },
      )
    } catch (e) {
      setEstImp({ texto: e instanceof RespaldoInvalido ? e.message : 'No pude leer ese respaldo.', tipo: 'bad' })
    }
  }

  return (
    <>
      <Encabezado volver />
      <h1 className={s.titulo}>Ajustes</h1>

      {/* ---------- rol ---------- */}
      <h2 className={s.sub}>Tu rol</h2>
      <p className={s.ayuda}>Cambia las sugerencias al anotar.</p>
      <div className={s.roles}>
        {LISTA_ROLES.map((k) => (
          <button key={k} type="button" className={s.rol} aria-pressed={rol === k} onClick={() => guardarAjustes(db, { rol: k })}>
            <span className={s.rn}>{ROLES[k].nombre}</span>
            <span className={s.rd}>{ROLES[k].desc}</span>
          </button>
        ))}
      </div>

      {/* ---------- tema ---------- */}
      <h2 className={s.sub}>Tema</h2>
      <div className={s.segmentos} role="radiogroup" aria-label="Tema">
        {TEMAS.map((t) => (
          <button
            key={t.k}
            type="button"
            role="radio"
            aria-checked={ajustes.tema === t.k}
            onClick={() => guardarAjustes(db, { tema: t.k })}
          >
            {t.nombre}
          </button>
        ))}
      </div>

      {/* ---------- datos ---------- */}
      <h2 className={s.sub}>Tus datos</h2>
      <div className="card">
        <p className={s.privado}>
          <strong>Tus datos no salen de este teléfono.</strong> No hay cuenta, ni servidor, ni analítica, ni telemetría: todo se
          guarda solo en este navegador. Si cambias de teléfono o limpias el navegador, los datos se van contigo solo si guardas
          un respaldo aquí.
        </p>
        <p className={s.cuenta}>
          Tienes {plural(reales.fichas, 'ficha', 'fichas')}, {plural(reales.predicciones, 'predicción', 'predicciones')} y{' '}
          {plural(reales.sesiones, 'sesión', 'sesiones')} propias
          {ejemplo > 0 && `, más ${plural(ejemplo, 'ficha', 'fichas')} de ejemplo`}.
        </p>
        <div className="btn-row" style={{ marginTop: 14 }}>
          <button type="button" className="btn btn-sm" onClick={copiar}>
            Copiar respaldo
          </button>
          <button type="button" className="btn btn-sm" onClick={descargar}>
            Descargar archivo
          </button>
        </div>
        <textarea
          className="input"
          rows={3}
          readOnly
          value={respaldo}
          aria-label="Respaldo de tus datos en texto"
          style={{ marginTop: 10 }}
          onFocus={(e) => e.currentTarget.select()}
        />
        <p className={`status-line ${estExp.tipo ?? ''}`} role="status">
          {estExp.texto}
        </p>

        <h3 className={s.h3} id="importar" ref={importarRef}>
          Traer un respaldo
        </h3>
        <p className={s.ayuda}>
          Pega el texto del respaldo o carga el archivo. Se suma a lo que ya tienes, sin duplicar y sin cambiar nada de lo que
          ya está anotado. <strong>¿Usabas la versión de la charla?</strong> Allí toca «Copiar respaldo» y pégalo aquí: cada
          nombre de «sobre quién» se vuelve una ficha.
        </p>
        <textarea
          className="input"
          rows={3}
          placeholder='{"app":"calibra", ...}'
          value={pegado}
          onChange={(e) => setPegado(e.target.value)}
          aria-label="Pega aquí tu respaldo"
        />
        <div className="btn-row" style={{ marginTop: 9 }}>
          <button type="button" className="btn btn-sm" onClick={() => traer(pegado)}>
            Importar pegado
          </button>
          <label className="btn btn-sm">
            Cargar archivo
            <input
              type="file"
              accept=".json,application/json,text/plain"
              hidden
              onChange={async (e) => {
                const f = e.target.files?.[0]
                if (f) await traer(await f.text())
                e.target.value = ''
              }}
            />
          </label>
        </div>
        <p className={`status-line ${estImp.tipo ?? ''}`} role="status">
          {estImp.texto}
        </p>
      </div>

      {/* ---------- ejemplo ---------- */}
      <h2 className={s.sub}>Datos de ejemplo</h2>
      <div className="card">
        <p className={s.ayuda} style={{ marginTop: 0 }}>
          Fichas, sesiones y pronósticos inventados para explorar la app. Van marcados como ejemplo y se borran aparte: nunca
          se mezclan con lo tuyo.
        </p>
        <div className="btn-row" style={{ marginTop: 12 }}>
          <button
            type="button"
            className="btn btn-sm"
            onClick={async () => {
              await cargarEjemplo(db, rol, hoy, 3)
              setEstEj({ texto: 'Listo: 3 fichas de ejemplo con sus sesiones y pronósticos.', tipo: 'ok' })
            }}
          >
            Cargar deportistas de ejemplo
          </button>
          {ejemplo > 0 && (
            <button
              type="button"
              className="btn btn-sm btn-danger"
              onClick={async () => {
                await borrarEjemplo(db)
                setEstEj({ texto: 'Datos de ejemplo borrados. Lo tuyo sigue intacto.', tipo: 'ok' })
              }}
            >
              Borrar los datos de ejemplo
            </button>
          )}
        </div>
        <p className={`status-line ${estEj.tipo ?? ''}`} role="status">
          {estEj.texto}
        </p>
      </div>

      {/* ---------- otras ---------- */}
      <h2 className={s.sub}>Otras opciones</h2>
      <div className="card">
        <div className="btn-row">
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => guardarAjustes(db, { introVista: false })}>
            Ver la introducción
          </button>
          <button
            type="button"
            className="btn btn-sm btn-danger"
            onClick={async () => {
              if (!armado) {
                setArmado(true)
                setEstBorrar({
                  texto: 'Se borran todas tus fichas, sesiones y predicciones en este teléfono. No hay vuelta atrás: guarda antes tu respaldo.',
                  tipo: 'bad',
                })
                setTimeout(() => {
                  setArmado(false)
                  setEstBorrar({ texto: '' })
                }, 6000)
                return
              }
              await borrarTodo(db)
              setArmado(false)
              setEstBorrar({ texto: 'Listo: no queda ningún dato guardado.', tipo: 'ok' })
            }}
          >
            {armado ? 'Sí, borrar todo' : 'Borrar todo'}
          </button>
        </div>
        <p className={`status-line ${estBorrar.tipo ?? ''}`} role="status">
          {estBorrar.texto}
        </p>
      </div>

      <h2 className={s.sub}>Próximamente</h2>
      <div className={`card ${s.pronto}`}>
        <h3 className={s.h3} style={{ marginTop: 0 }}>
          Modo sala
        </h3>
        <p className={s.ayuda}>
          Una sesión compartida donde un cuerpo técnico o un departamento de educación física pronostica en conjunto y ve su
          calibración agregada. Queda para más adelante: esta es la herramienta personal, de bolsillo.
        </p>
      </div>

      <footer className={s.creditos}>
        Calibra · artefacto de la conferencia «Del cronómetro al algoritmo»
        <br />
        Dr. Darío Mendoza Romero · UPTC Chiquinquirá, 2026
        <br />
        Carga de sesión: RPE de sesión (Foster, 2001), esfuerzo percibido 0-10 × minutos.
        <br />
        Versión {__VERSION__}
      </footer>
    </>
  )
}
