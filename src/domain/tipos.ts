export type Rol = 'deportivo' | 'gimnasio' | 'docente'

export type Deportista = {
  id: string
  nombre: string
  nota?: string // "400 m", "grupo 10B", "cliente 6 a.m."
  color: string
  foto?: string // data URL pequeña; así viaja en el respaldo JSON
  archivado: boolean
  creadoEn: string
  ejemplo?: true
}

export type Prediccion = {
  id: string
  deportistaId: string | null // null = pronóstico general
  etiqueta: string
  confianza: number // 0-100, congelada desde que se anota
  fecha: string // AAAA-MM-DD: cuándo se sabrá
  creadaEn: string
  estado: 'pendiente' | 'cerrada'
  resultado: boolean | null
  cerradaEn: string | null
  rol: Rol // rol con el que se anotó, para filtrar
  quienV1?: string // texto «sobre quién» original de la v1
  ejemplo?: true
}

export type Sesion = {
  id: string
  deportistaId: string
  fecha: string
  rpe: number // 0-10
  minutos: number
  carga: number // rpe × minutos
  tipo?: string
  nota?: string
  ejemplo?: true
}

export type Tema = 'claro' | 'oscuro' | 'auto'

export type Ajustes = {
  clave: 'app'
  rol: Rol | null
  tema: Tema
  introVista: boolean
  migradoV1En?: string
}
