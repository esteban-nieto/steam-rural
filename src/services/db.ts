import { Dexie, type Table } from 'dexie'
import type { Progreso, Estudiante, Emocion } from '../services/supabase'

export type Evaluacion = {
  id: string
  estudiante_id: string
  actividad_id: string
  fecha: string
  criterios: Record<string, number>
  observacion?: string
}

class SteamDB extends Dexie {
  progresos!: Table<Progreso, string>
  estudiantes!: Table<Estudiante, string>
  progresosPendientes!: Table<Progreso, string>
  estudiantesPendientes!: Table<Estudiante, string>
  evaluaciones!: Table<Evaluacion, string>
  evaluacionesPendientes!: Table<Evaluacion, string>

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
    this.on('blocked', () => {
      this.close()
      setTimeout(() => location.reload(), 500)
    })
    this.on('versionchange', () => this.close())
  }
}

export const db = new SteamDB()

export async function guardarProgresoLocal(progreso: Progreso) {
  await db.progresos.put(progreso).catch(() => {})
  await db.progresosPendientes.put(progreso).catch(() => {})
}

export async function guardarEstudianteLocal(estudiante: Estudiante) {
  await db.estudiantes.put(estudiante).catch(() => {})
  await db.estudiantesPendientes.put(estudiante).catch(() => {})
}

export async function guardarEvaluacionLocal(ev: Evaluacion) {
  await db.evaluaciones.put(ev).catch(() => {})
  await db.evaluacionesPendientes.put(ev).catch(() => {})
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

export const EMOCIONES: Emocion[] = ['feliz', 'contento', 'neutro', 'triste', 'enfado']
