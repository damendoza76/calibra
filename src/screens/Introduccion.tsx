import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { db, guardarAjustes } from '../db'
import { LISTA_ROLES, ROLES } from '../domain/roles'
import type { Rol } from '../domain/tipos'
import s from './Introduccion.module.css'

/** Las tres líneas de la v1, la regla única y el ejemplo del RPE. */
export function Introduccion({ rolActual }: { rolActual: Rol | null }) {
  const nav = useNavigate()
  const [rol, setRol] = useState<Rol | null>(rolActual)
  const titulo = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    titulo.current?.focus()
  }, [])

  async function empezar() {
    // al guardar introVista, la introducción se cierra sola
    await guardarAjustes(db, { rol: rol ?? 'deportivo', introVista: true })
  }

  async function traerRespaldo() {
    await empezar()
    nav('/ajustes?importar=1')
  }

  return (
    <div className={s.velo}>
      <motion.div
        className={s.hoja}
        role="dialog"
        aria-modal="true"
        aria-labelledby="intro-titulo"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.25, ease: [0.2, 0.7, 0.2, 1] }}
      >
        <p className={s.k}>Del cronómetro al algoritmo · el artefacto que te llevas</p>
        <h2 id="intro-titulo" ref={titulo} tabIndex={-1}>
          Tu intuición no aprende sola
        </h2>
        <p>
          Cada semana pronosticas: que este deportista cumple la carga, que esta atleta baja su marca, que este estudiante no
          mejora. Casi nunca lo escribes antes, y casi nunca lo comparas después.
        </p>
        <p>
          Sin ese contraste la intuición no mejora: solo se siente cada vez más segura. La memoria es generosa con nosotros y
          recuerda mejor los aciertos que los fallos.
        </p>
        <p>
          Calibra hace una sola cosa: guarda lo que creías <em>antes</em>, y te lo devuelve cuando ya sabes qué pasó.
        </p>

        <div className={s.regla}>
          <div className={s.rk}>Regla única</div>
          <p>
            El pronóstico se anota antes de saber el resultado y la confianza queda congelada.{' '}
            <em>Si se anota después, ya no es un pronóstico: es una excusa.</em>
          </p>
        </div>

        <div className={s.rpe} aria-label="Ejemplo: esperabas 400, pasó 250, tu nueva expectativa es 385">
          <div>
            <span className={s.rpeN}>400</span>
            <span className={s.rpeK}>lo que esperabas</span>
          </div>
          <span className={s.rpeFlecha} aria-hidden="true">→</span>
          <div>
            <span className={`${s.rpeN} ${s.real}`}>250</span>
            <span className={s.rpeK}>lo que pasó</span>
          </div>
          <span className={s.rpeFlecha} aria-hidden="true">→</span>
          <div>
            <span className={`${s.rpeN} ${s.nueva}`}>385</span>
            <span className={s.rpeK}>tu nueva expectativa</span>
          </div>
        </div>
        <p className={s.pie}>
          Es el mismo ciclo del RPE de sesión que vimos en la charla. Aquí lo haces con tus deportistas y con tu propio
          criterio.
        </p>

        <div className={s.sub}>¿Cuál es tu trabajo?</div>
        <div className={s.roles}>
          {LISTA_ROLES.map((k) => (
            <button key={k} type="button" className={s.rol} aria-pressed={rol === k} onClick={() => setRol(k)}>
              <span className={s.rn}>{ROLES[k].nombre}</span>
              <span className={s.rd}>{ROLES[k].desc}</span>
            </button>
          ))}
        </div>
        <button type="button" className="btn btn-primary" onClick={empezar} style={{ marginTop: 16 }}>
          Empezar
        </button>
        <button type="button" className={s.v1} onClick={traerRespaldo}>
          ¿Usabas la versión de la charla? Trae aquí tu respaldo →
        </button>
        <p className={s.privado}>Todo queda en este teléfono. Sin cuenta, sin servidor.</p>
      </motion.div>
    </div>
  )
}
