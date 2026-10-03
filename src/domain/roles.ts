import type { Rol } from './tipos'

export type InfoRol = { nombre: string; desc: string; corto: string; sugerencias: string[] }

export const ROLES: Record<Rol, InfoRol> = {
  deportivo: {
    nombre: 'Entrenador deportivo',
    desc: 'Equipo o deportista en proceso de entrenamiento.',
    corto: 'entrenador deportivo',
    sugerencias: [
      'Cumple la carga planificada de hoy',
      'Reporta un RPE de sesión más bajo de lo previsto',
      'Baja su marca personal este mes',
      'Llega a la sesión del sábado',
      'Termina la serie 4 sin caída de técnica',
    ],
  },
  gimnasio: {
    nombre: 'Entrenador de gimnasio',
    desc: 'Clientes que entrenan por salud, estética o rendimiento.',
    corto: 'entrenador de gimnasio',
    sugerencias: [
      'Completa las 3 sesiones de esta semana',
      'Sostiene la técnica en la última serie',
      'Vuelve después del festivo',
      'Sube de carga sin dolor esta semana',
      'Sigue viniendo dentro de un mes',
    ],
  },
  docente: {
    nombre: 'Profesor de educación física',
    desc: 'Clases, grupos y estudiantes en el colegio o la universidad.',
    corto: 'profe de EF',
    sugerencias: [
      'Logra el objetivo motor de la clase de hoy',
      'El grupo participa sin que haya que insistir',
      'Mejora su marca en el test de este mes',
      'Entrega el trabajo del periodo a tiempo',
      'La clase de la lluvia no se desordena',
    ],
  },
}

export const LISTA_ROLES = Object.keys(ROLES) as Rol[]

export function esRol(x: unknown): x is Rol {
  return typeof x === 'string' && x in ROLES
}
