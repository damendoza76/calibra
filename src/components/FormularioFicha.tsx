import { useState } from 'react'
import { crearDeportista, db, editarDeportista } from '../db'
import { colorPara } from '../domain/colores'
import { ReglaRota } from '../domain/predicciones'
import type { Deportista } from '../domain/tipos'
import { Avatar } from './Avatar'
import { reducirFoto } from './foto'
import { Hoja } from './Hoja'
import s from './FormularioFicha.module.css'

/** Crear o editar una ficha. Archivar la saca de las listas sin borrar su historial. */
export function FormularioFicha({
  ficha,
  onCerrar,
  onCreada,
}: {
  ficha?: Deportista
  onCerrar: () => void
  onCreada?: (d: Deportista) => void
}) {
  const [nombre, setNombre] = useState(ficha?.nombre ?? '')
  const [nota, setNota] = useState(ficha?.nota ?? '')
  const [foto, setFoto] = useState<string | undefined>(ficha?.foto)
  const [error, setError] = useState('')

  async function guardar() {
    try {
      if (ficha) {
        await editarDeportista(db, ficha.id, { nombre: nombre.trim(), nota: nota.trim() || undefined, foto })
        onCerrar()
      } else {
        const d = await crearDeportista(db, { nombre, nota, foto })
        onCreada?.(d)
        onCerrar()
      }
    } catch (e) {
      setError(e instanceof ReglaRota ? e.message : 'No se pudo guardar.')
    }
  }

  async function alternarArchivo() {
    if (!ficha) return
    await editarDeportista(db, ficha.id, { archivado: !ficha.archivado })
    onCerrar()
  }

  return (
    <Hoja titulo={ficha ? 'Editar ficha' : 'Nueva ficha'} onCerrar={onCerrar}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          guardar()
        }}
      >
        <div className={s.fotoFila}>
          <Avatar d={{ nombre: nombre || '?', color: ficha?.color ?? colorPara(0), foto }} tam={64} />
          <div className={s.fotoAcciones}>
            <label className="btn btn-sm">
              {foto ? 'Cambiar foto' : 'Agregar foto'}
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={async (e) => {
                  const f = e.target.files?.[0]
                  if (!f) return
                  try {
                    setFoto(await reducirFoto(f))
                  } catch {
                    setError('No pude leer esa imagen.')
                  }
                  e.target.value = ''
                }}
              />
            </label>
            {foto && (
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => setFoto(undefined)}>
                Quitar
              </button>
            )}
            <p className="note">Opcional. Se guarda pequeña y solo en este teléfono.</p>
          </div>
        </div>

        <label className="lbl" htmlFor="f-nombre">
          Nombre
        </label>
        <input
          id="f-nombre"
          className="input"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Camila Rojas · Grupo 10B"
          maxLength={60}
          autoComplete="off"
        />
        <label className="lbl" htmlFor="f-nota" style={{ marginTop: 14 }}>
          Nota <span style={{ textTransform: 'none', letterSpacing: 0 }}>(opcional)</span>
        </label>
        <input
          id="f-nota"
          className="input"
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          placeholder="400 m · cliente 6 a.m. · clase de los martes"
          maxLength={60}
          autoComplete="off"
        />

        {error && (
          <p className="status-line bad" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="btn btn-primary" style={{ marginTop: 18 }}>
          {ficha ? 'Guardar cambios' : 'Crear ficha'}
        </button>
        {ficha && (
          <button type="button" className={`btn btn-ghost ${s.archivar}`} onClick={alternarArchivo}>
            {ficha.archivado ? 'Sacar del archivo' : 'Archivar ficha'}
          </button>
        )}
        {ficha && !ficha.archivado && (
          <p className="note" style={{ marginTop: 8, textAlign: 'center' }}>
            Archivar la saca de las listas. Sus pronósticos y sesiones se conservan.
          </p>
        )}
      </form>
    </Hoja>
  )
}
