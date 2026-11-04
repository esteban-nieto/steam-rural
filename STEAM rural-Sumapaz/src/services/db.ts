import { Dexie, type Table } from 'dexie'
import type { Progreso, Estudiante, Emocion, Profesor } from '../types/models'

export type Evaluacion = {
  id: string
  estudiante_id: string
  actividad_id: string
  fecha: string
  criterios: Record<string, number>
  observacion?: string
}

export function generarEvaluacionId(estudianteId: string, fecha: string, actividadId: string): string {
  const str = `${estudianteId}:${fecha}:${actividadId}`
  let h1 = 0xdeadbeef ^ 0, h2 = 0x41c6ce57 ^ 0, h3 = 0x6291a27e ^ 0, h4 = 0x9e3779b9 ^ 0
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ (ch << 5), 1597334677)
    h3 = Math.imul(h3 ^ (ch << 11), 3847528343)
    h4 = Math.imul(h4 ^ (ch << 16), 3344921057)
  }
  const toHex = (n: number) => (n >>> 0).toString(16).padStart(8, '0')
  const hex = toHex(h1) + toHex(h2) + toHex(h3) + toHex(h4)
  const p1 = hex.substring(0, 8)
  const p2 = hex.substring(8, 12)
  const p3 = '4' + hex.substring(13, 16)
  const p4 = 'a' + hex.substring(17, 20)
  const p5 = hex.substring(20, 32)
  return `${p1}-${p2}-${p3}-${p4}-${p5}`
}

export type PasoActividad = {
  paso: number
  texto: string
  multimedia?: string
  tipoMultimedia?: 'imagen' | 'video'
  videoStart?: number
  videoEnd?: number
}

export type Actividad = {
  id: string
  nombre: string
  numeroPasos: number
  pasos: PasoActividad[]
  portada?: string
  videoPrincipal?: string
  tipoActividad?: 'pasos' | 'video_segmentado'
  fechaCreacion: string
}

export type RegistroAsistencia = {
  id: string // `${curso}_${fecha}_${estudiante_id}`
  curso: string
  fecha: string // YYYY-MM-DD
  estudiante_id: string
  estudiante_nombre: string
  estado: 'presente' | 'ausente' | 'excusa'
  observacion?: string
}

class SteamDB extends Dexie {
  progresos!: Table<Progreso, string>
  estudiantes!: Table<Estudiante, string>
  progresosPendientes!: Table<Progreso, string>
  estudiantesPendientes!: Table<Estudiante, string>
  evaluaciones!: Table<Evaluacion, string>
  evaluacionesPendientes!: Table<Evaluacion, string>
  actividades!: Table<Actividad, string>
  profesores!: Table<Profesor, string>
  asistencias!: Table<RegistroAsistencia, string>

  constructor() {
    super('steamDB')
    this.version(1).stores({
      progresos: '&id, estudiante_id, actividad_id, fecha',
    })
    this.version(2).stores({
      progresos: '&id, estudiante_id, actividad_id, fecha',
      estudiantes: '&id, curso, profesor_id',
      progresosPendientes: '&id, estudiante_id, actividad_id, fecha',
      estudiantesPendientes: '&id, curso, profesor_id',
    })
    this.version(3).stores({
      progresos: '&id, estudiante_id, actividad_id, fecha',
      estudiantes: '&id, curso, profesor_id',
      progresosPendientes: '&id, estudiante_id, actividad_id, fecha',
      estudiantesPendientes: '&id, curso, profesor_id',
      evaluaciones: '&id, estudiante_id, actividad_id, fecha',
      evaluacionesPendientes: '&id, estudiante_id, actividad_id, fecha',
    })
    this.version(4).stores({
      progresos: '&id, estudiante_id, actividad_id, fecha',
      estudiantes: '&id, curso, profesor_id',
      progresosPendientes: '&id, estudiante_id, actividad_id, fecha',
      estudiantesPendientes: '&id, curso, profesor_id',
      evaluaciones: '&id, estudiante_id, actividad_id, fecha',
      evaluacionesPendientes: '&id, estudiante_id, actividad_id, fecha',
      actividades: '&id, nombre, fechaCreacion',
    })
    this.version(5).stores({
      progresos: '&id, estudiante_id, actividad_id, fecha',
      estudiantes: '&id, curso, profesor_id',
      progresosPendientes: '&id, estudiante_id, actividad_id, fecha',
      estudiantesPendientes: '&id, curso, profesor_id',
      evaluaciones: '&id, estudiante_id, actividad_id, fecha',
      evaluacionesPendientes: '&id, estudiante_id, actividad_id, fecha',
      actividades: '&id, nombre, fechaCreacion',
      profesores: '&id, email, pin',
    })
    this.version(6).stores({
      progresos: '&id, estudiante_id, actividad_id, fecha',
      estudiantes: '&id, curso, profesor_id',
      progresosPendientes: '&id, estudiante_id, actividad_id, fecha',
      estudiantesPendientes: '&id, curso, profesor_id',
      evaluaciones: '&id, estudiante_id, actividad_id, fecha',
      evaluacionesPendientes: '&id, estudiante_id, actividad_id, fecha',
      actividades: '&id, nombre, fechaCreacion',
      profesores: '&id, email, pin',
      asistencias: '&id, curso, fecha, estudiante_id',
    })
    // Se retira el índice sobre el PIN
    this.version(7).stores({
      profesores: '&id, email',
    })
    this.on('blocked', () => {
      this.close()
      setTimeout(() => location.reload(), 500)
    })
    this.on('versionchange', () => this.close())
  }
}

export const db = new SteamDB()

// --- Actividades ---
export async function guardarActividadLocal(act: Actividad) {
  await db.actividades.put(act).catch((err) => console.error('Error guardando actividad:', err))
}

export async function obtenerActividadesLocales(): Promise<Actividad[]> {
  return await db.actividades.toArray().catch(() => [])
}

export async function eliminarActividadLocal(id: string) {
  await db.actividades.delete(id).catch((err) => console.error('Error eliminando actividad:', err))
}

// --- Progresos, Estudiantes y Evaluaciones ---
export async function guardarProgresoLocal(progreso: Progreso) {
  await db.progresos.put(progreso).catch(() => {})
}

export async function guardarEstudianteLocal(estudiante: Estudiante) {
  await db.estudiantes.put(estudiante).catch(() => {})
}

export async function guardarEvaluacionLocal(ev: Evaluacion) {
  await db.evaluaciones.put(ev).catch(() => {})
}

export async function obtenerProgresosPendientes(): Promise<Progreso[]> {
  return await db.progresosPendientes.toArray().catch(() => [])
}

export async function obtenerEstudiantesPendientes(): Promise<Estudiante[]> {
  return await db.estudiantesPendientes.toArray().catch(() => [])
}

export async function obtenerEvaluacionesPendientes(): Promise<Evaluacion[]> {
  return await db.evaluacionesPendientes.toArray().catch(() => [])
}

export async function limpiarProgresosEnviados(ids: string[]) {
  await db.progresosPendientes.bulkDelete(ids).catch(() => {})
}

export async function limpiarEstudiantesEnviados(ids: string[]) {
  await db.estudiantesPendientes.bulkDelete(ids).catch(() => {})
}

export async function limpiarEvaluacionesEnviadas(ids: string[]) {
  await db.evaluacionesPendientes.bulkDelete(ids).catch(() => {})
}

// --- Perfil Local de Profesor ---
export async function guardarProfesorLocal(profesor: Profesor) {
  await db.profesores.put(profesor).catch((err) => console.error('Error guardando profesor:', err))
}

export async function obtenerProfesores(): Promise<Profesor[]> {
  return await db.profesores.toArray()
}

// --- Asistencias ---
export async function guardarAsistenciasLocal(registros: RegistroAsistencia[]) {
  if (!registros.length) return
  await db.asistencias.bulkPut(registros).catch((err) => console.error('Error guardando asistencias:', err))
}

export async function obtenerAsistenciasPorCursoYFecha(curso: string, fecha: string): Promise<RegistroAsistencia[]> {
  return await db.asistencias.where('curso').equals(curso).filter((a) => a.fecha === fecha).toArray().catch(() => [])
}

export async function obtenerFechasAsistenciaPorCurso(curso: string): Promise<string[]> {
  const list = await db.asistencias.where('curso').equals(curso).toArray().catch(() => [])
  const setFechas = new Set<string>(list.map((a) => a.fecha))
  return Array.from(setFechas).sort().reverse()
}

export async function obtenerTodasAsistenciasPorCurso(curso: string): Promise<RegistroAsistencia[]> {
  return await db.asistencias.where('curso').equals(curso).toArray().catch(() => [])
}

const CLAVE_CURSOS = 'steam_cursos_lista'

function leerCursosGuardados(): string[] {
  try {
    const lista = JSON.parse(localStorage.getItem(CLAVE_CURSOS) || '[]')
    return Array.isArray(lista) ? lista.filter((c) => typeof c === 'string') : []
  } catch {
    return []
  }
}

// Exportar los datos del aula. Los perfiles docentes y sus claves nunca salen del equipo.
export async function exportarBaseDatosCompleta() {
  const [estudiantes, progresos, evaluaciones, actividades, asistencias] = await Promise.all([
    db.estudiantes.toArray(),
    db.progresos.toArray(),
    db.evaluaciones.toArray(),
    db.actividades.toArray(),
    db.asistencias.toArray(),
  ])
  return {
    version: 2,
    fechaExportacion: new Date().toISOString(),
    cursos: leerCursosGuardados(),
    estudiantes,
    progresos,
    evaluaciones,
    actividades,
    asistencias,
  }
}

const esTexto = (v: unknown) => typeof v === 'string' && v.length > 0

const VALIDADORES: Record<string, (r: any) => boolean> = {
  estudiantes: (r) => esTexto(r.nombre) && esTexto(r.curso),
  progresos: (r) => esTexto(r.estudiante_id) && esTexto(r.actividad_id),
  evaluaciones: (r) => esTexto(r.estudiante_id) && esTexto(r.actividad_id) && esTexto(r.fecha),
  actividades: (r) => esTexto(r.nombre) && Array.isArray(r.pasos),
  asistencias: (r) => esTexto(r.curso) && esTexto(r.fecha) && esTexto(r.estudiante_id),
}

/**
 * Importa datos de otro equipo: valida todo primero y guarda todo o nada.
 * Los perfiles docentes de respaldos antiguos se ignoran. Lanza un Error con
 * un mensaje para el usuario si el contenido no es válido o no se puede guardar.
 */
export async function importarBaseDatosCompleta(datos: any): Promise<number> {
  if (!datos || typeof datos !== 'object' || Array.isArray(datos)) {
    throw new Error('El archivo no es un respaldo de STEAM Rural.')
  }
  const tablas = Object.keys(VALIDADORES).filter((t) => t in datos)
  if (!tablas.length) {
    throw new Error('El archivo no es un respaldo de STEAM Rural.')
  }
  for (const tabla of tablas) {
    const registros = datos[tabla]
    const validos =
      Array.isArray(registros) &&
      registros.every((r) => r && typeof r === 'object' && esTexto(r.id) && VALIDADORES[tabla](r))
    if (!validos) {
      throw new Error(`Los datos de "${tabla}" están dañados o incompletos. No se importó nada.`)
    }
  }

  const tablasDexie = tablas.map((t) => db.table(t))
  await db.transaction('rw', tablasDexie, async () => {
    for (const tabla of tablas) await db.table(tabla).bulkPut(datos[tabla])
  })

  // La lista de cursos vive en localStorage: se completa para que los importados se vean.
  const delRespaldo = Array.isArray(datos.cursos) ? datos.cursos.filter(esTexto) : []
  const deEstudiantes = (datos.estudiantes ?? []).map((e: any) => e.curso)
  const actuales = leerCursosGuardados()
  const base = actuales.length ? actuales : ['3A', '4B']
  localStorage.setItem(CLAVE_CURSOS, JSON.stringify([...new Set([...base, ...delRespaldo, ...deEstudiantes])]))

  return tablas.reduce((total, tabla) => total + datos[tabla].length, 0)
}

export function obtenerCursosGuardados(): string[] {
  return leerCursosGuardados()
}

export const EMOCIONES: Emocion[] = ['feliz', 'contento', 'neutro', 'triste', 'enfado']

