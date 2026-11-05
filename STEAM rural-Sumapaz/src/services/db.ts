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
  profesor_id?: string
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

export type RegistroEliminado = {
  id: string // `${tabla}:${registro}`
  tabla: string
  registro: string
  deleted_at: string
  profesor_id?: string
}

const TABLAS_SINCRONIZADAS = ['estudiantes', 'progresos', 'evaluaciones', 'actividades', 'asistencias'] as const

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
  eliminados!: Table<RegistroEliminado, string>

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
    // Registro de borrados, para que también se propaguen al sincronizar
    this.version(8).stores({
      eliminados: '&id, tabla',
    })
    // Fecha de última modificación, usada para resolver conflictos entre equipos
    for (const tabla of TABLAS_SINCRONIZADAS) {
      const t = this.table(tabla)
      t.hook('creating', (_pk, obj) => {
        if (!obj.updated_at) obj.updated_at = new Date().toISOString()
      })
      t.hook('updating', (cambios: any) =>
        cambios.updated_at === undefined ? { updated_at: new Date().toISOString() } : undefined
      )
    }
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

const marcaEliminado = (
  tabla: string,
  registro: string,
  deleted_at: string,
  profesor_id?: string
): RegistroEliminado => ({
  // Dos docentes pueden tener un curso con el mismo nombre
  id: tabla === 'cursos' ? `cursos:${profesor_id}:${registro}` : `${tabla}:${registro}`,
  tabla,
  registro,
  deleted_at,
  profesor_id,
})

/**
 * Asigna al docente los estudiantes creados antes de separar los datos por cuenta,
 * junto con la lista de cursos antigua. Solo los recibe el primero que ingresa.
 */
export async function adoptarDatosSinDueno(profesorId: string) {
  await db.estudiantes
    .filter((e) => !e.profesor_id)
    .modify({ profesor_id: profesorId })
  await db.actividades
    .filter((a) => !a.profesor_id)
    .modify({ profesor_id: profesorId })
  const antigua = localStorage.getItem('steam_cursos_lista')
  if (antigua) {
    if (!localStorage.getItem(claveCursos(profesorId))) localStorage.setItem(claveCursos(profesorId), antigua)
    localStorage.removeItem('steam_cursos_lista')
  }
  localStorage.removeItem('steam_curso_activo')
}

/** Solo el docente que creó la actividad puede borrarla. */
export async function eliminarActividadLocal(id: string, profesorId: string) {
  await db.transaction('rw', db.actividades, db.eliminados, async () => {
    const actividad = await db.actividades.get(id)
    if (!actividad) return
    if (actividad.profesor_id !== profesorId) {
      throw new Error('Solo el docente que creó la actividad puede eliminarla.')
    }
    await db.actividades.delete(id)
    await db.eliminados.put(marcaEliminado('actividades', id, new Date().toISOString(), profesorId))
  })
}

/** Borra el curso con sus estudiantes, progresos, evaluaciones y asistencias. */
export async function eliminarCursoCompleto(curso: string, profesorId: string) {
  const ahora = new Date().toISOString()
  await db.transaction(
    'rw',
    [db.estudiantes, db.progresos, db.evaluaciones, db.asistencias, db.eliminados],
    async () => {
      const estudiantes = await db.estudiantes
        .where('profesor_id')
        .equals(profesorId)
        .filter((e) => e.curso === curso)
        .primaryKeys()
      const progresos = await db.progresos.where('estudiante_id').anyOf(estudiantes).primaryKeys()
      const evaluaciones = await db.evaluaciones.where('estudiante_id').anyOf(estudiantes).primaryKeys()
      const asistencias = await db.asistencias.where('estudiante_id').anyOf(estudiantes).primaryKeys()
      await db.estudiantes.bulkDelete(estudiantes)
      await db.progresos.bulkDelete(progresos)
      await db.evaluaciones.bulkDelete(evaluaciones)
      await db.asistencias.bulkDelete(asistencias)
      await db.eliminados.bulkPut([
        marcaEliminado('cursos', curso, ahora, profesorId),
        ...estudiantes.map((id) => marcaEliminado('estudiantes', id, ahora, profesorId)),
        ...progresos.map((id) => marcaEliminado('progresos', id, ahora, profesorId)),
        ...evaluaciones.map((id) => marcaEliminado('evaluaciones', id, ahora, profesorId)),
        ...asistencias.map((id) => marcaEliminado('asistencias', id, ahora, profesorId)),
      ])
    }
  )
}

/** Un curso vuelto a crear deja de contar como eliminado. */
export async function restaurarCurso(curso: string, profesorId: string) {
  await db.eliminados.delete(`cursos:${profesorId}:${curso}`)
}

// --- Progresos, Estudiantes y Evaluaciones ---
export async function guardarProgresoLocal(progreso: Progreso) {
  await db.progresos.put(progreso)
}

export async function guardarEstudianteLocal(estudiante: Estudiante) {
  await db.estudiantes.put(estudiante)
}

export async function guardarEvaluacionLocal(ev: Evaluacion) {
  await db.evaluaciones.put(ev)
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

// Se consulta por estudiantes: el nombre de un curso puede repetirse entre docentes.
export async function obtenerTodasAsistenciasPorCurso(curso: string, estudianteIds: string[]): Promise<RegistroAsistencia[]> {
  return await db.asistencias
    .where('estudiante_id')
    .anyOf(estudianteIds)
    .filter((a) => a.curso === curso)
    .toArray()
    .catch(() => [])
}

export async function obtenerAsistenciasPorCursoYFecha(curso: string, estudianteIds: string[], fecha: string): Promise<RegistroAsistencia[]> {
  const list = await obtenerTodasAsistenciasPorCurso(curso, estudianteIds)
  return list.filter((a) => a.fecha === fecha)
}

export async function obtenerFechasAsistenciaPorCurso(curso: string, estudianteIds: string[]): Promise<string[]> {
  const list = await obtenerTodasAsistenciasPorCurso(curso, estudianteIds)
  const setFechas = new Set<string>(list.map((a) => a.fecha))
  return Array.from(setFechas).sort().reverse()
}

function claveCursos(profesorId: string) {
  return `steam_cursos_lista:${profesorId}`
}

function leerCursosGuardados(profesorId: string): string[] {
  try {
    const lista = JSON.parse(localStorage.getItem(claveCursos(profesorId)) || '[]')
    return Array.isArray(lista) ? lista.filter((c) => typeof c === 'string') : []
  } catch {
    return []
  }
}

// Exportar los datos de un docente. Los perfiles y sus claves nunca salen del equipo,
// y las actividades, visibles para todos los estudiantes, se comparten.
export async function exportarBaseDatosCompleta(profesorId: string) {
  const estudiantes = await db.estudiantes.where('profesor_id').equals(profesorId).toArray()
  const ids = estudiantes.map((e) => e.id)
  const [progresos, evaluaciones, actividades, asistencias, todosEliminados] = await Promise.all([
    db.progresos.where('estudiante_id').anyOf(ids).toArray(),
    db.evaluaciones.where('estudiante_id').anyOf(ids).toArray(),
    db.actividades.toArray(),
    db.asistencias.where('estudiante_id').anyOf(ids).toArray(),
    db.eliminados.toArray(),
  ])
  const eliminados = todosEliminados.filter((b) => b.profesor_id === profesorId)
  return {
    version: 4,
    eliminados,
    fechaExportacion: new Date().toISOString(),
    cursos: leerCursosGuardados(profesorId),
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
 * En cada registro y borrado gana la modificación más reciente (según el reloj
 * de cada equipo). Los datos quedan a nombre del docente que importa, y nunca se
 * tocan los estudiantes de otra cuenta. Los perfiles docentes de respaldos antiguos
 * se ignoran. Lanza un Error con un mensaje para el usuario si no es válido o no se puede guardar.
 */
export async function importarBaseDatosCompleta(datos: any, profesorId: string): Promise<ResultadoImportacion> {
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

  const borrados: RegistroEliminado[] = datos.eliminados ?? []
  if (
    !Array.isArray(borrados) ||
    !borrados.every((b) => esTexto(b?.id) && esTexto(b?.tabla) && esTexto(b?.registro) && esTexto(b?.deleted_at))
  ) {
    throw new Error('Los datos de "eliminados" están dañados o incompletos. No se importó nada.')
  }
  if (borrados.some((b) => b.tabla !== 'cursos' && !(TABLAS_SINCRONIZADAS as readonly string[]).includes(b.tabla))) {
    throw new Error('Los datos de "eliminados" no son válidos. No se importó nada.')
  }

  const r: ResultadoImportacion = { aplicados: 0, conservados: 0, eliminados: 0 }
  const cursosAplicados = new Set<string>()
  const cursosBorrados = new Set<string>()
  const cuentasLocales = new Set(await db.profesores.toCollection().primaryKeys())

  await db.transaction('rw', [...TABLAS_SINCRONIZADAS.map((t) => db.table(t)), db.eliminados], async () => {
    // ¿El registro pertenece a otra cuenta de este equipo?
    const esAjeno = async (tabla: string, r: any) => {
      const dueno = tabla === 'estudiantes' || tabla === 'actividades' ? r : await db.estudiantes.get(r.estudiante_id)
      return !!dueno?.profesor_id && dueno.profesor_id !== profesorId
    }

    // 1. Borrados: se unen con los locales y se aplican si son más recientes que el registro.
    for (const b of borrados) {
      const actual = b.tabla === 'cursos' ? undefined : await db.table(b.tabla).get(b.registro)
      if (actual && (await esAjeno(b.tabla, actual))) continue
      const propio = marcaEliminado(b.tabla, b.registro, b.deleted_at, profesorId)
      const local = await db.eliminados.get(propio.id)
      if (!local || b.deleted_at > local.deleted_at) await db.eliminados.put(propio)
      if (actual && b.deleted_at >= marcaDeTiempo(actual)) {
        await db.table(b.tabla).delete(b.registro)
        r.eliminados++
      }
    }

    // 2. Registros: gana el más reciente, y no revive lo que se borró después.
    for (const tabla of tablas) {
      for (const entrante of datos[tabla]) {
        const marca = marcaDeTiempo(entrante)
        const borrado = await db.eliminados.get(`${tabla}:${entrante.id}`)
        if (borrado && borrado.deleted_at >= marca) {
          r.conservados++
          continue
        }
        const actual = await db.table(tabla).get(entrante.id)
        if (
          (actual && (await esAjeno(tabla, actual) || marcaDeTiempo(actual) >= marca)) ||
          (tabla !== 'estudiantes' && tabla !== 'actividades' && (await esAjeno(tabla, entrante)))
        ) {
          r.conservados++
          continue
        }
        // Una marca explícita evita que el hook registre la hora de la importación.
        await db.table(tabla).put({
          ...entrante,
          ...(tabla === 'estudiantes' ? { profesor_id: profesorId } : {}),
          // Una actividad de otra cuenta de este equipo conserva a su creador;
          // si viene de otro equipo, queda a cargo de quien la importa.
          ...(tabla === 'actividades'
            ? { profesor_id: cuentasLocales.has(entrante.profesor_id) ? entrante.profesor_id : profesorId }
            : {}),
          updated_at: marca || '1970-01-01T00:00:00.000Z',
        })
        if (borrado) await db.eliminados.delete(borrado.id)
        r.aplicados++
        if (tabla === 'estudiantes') cursosAplicados.add(entrante.curso)
      }
    }

    for (const b of await db.eliminados.where('tabla').equals('cursos').toArray()) {
      if (b.profesor_id === profesorId) cursosBorrados.add(b.registro)
    }
  })

  // La lista de cursos vive en localStorage: se completa para que los importados se vean.
  const delRespaldo: string[] = Array.isArray(datos.cursos) ? datos.cursos.filter(esTexto) : []
  const actuales = leerCursosGuardados(profesorId)
  const base = actuales.length ? actuales : ['3A', '4B']
  const cursos = [...new Set([...base, ...delRespaldo])].filter((c) => !cursosBorrados.has(c))
  const lista = [...new Set([...cursos, ...cursosAplicados])]
  localStorage.setItem(claveCursos(profesorId), JSON.stringify(lista.length ? lista : base))

  return r
}

export type ResultadoImportacion = { aplicados: number; conservados: number; eliminados: number }

function marcaDeTiempo(r: any): string {
  return r.updated_at || r.created_at || r.fechaCreacion || r.fecha || ''
}

export function obtenerCursosGuardados(profesorId: string): string[] {
  return leerCursosGuardados(profesorId)
}

export function guardarCursos(profesorId: string, cursos: string[]) {
  localStorage.setItem(claveCursos(profesorId), JSON.stringify(cursos))
}

export const EMOCIONES: Emocion[] = ['feliz', 'contento', 'neutro', 'triste', 'enfado']

