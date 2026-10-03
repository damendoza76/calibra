import { CalibraDB } from './esquema'

/** La base de datos de la app. Vive solo en este dispositivo (IndexedDB). */
export const db = new CalibraDB()

export * from './acciones'
export { leerAjustes, guardarAjustes, CalibraDB } from './esquema'
export { migrarDesdeV1, CLAVE_V1 } from './migracionV1'
export { exportar, importar, respaldoComoTexto, RespaldoInvalido } from './respaldo'
