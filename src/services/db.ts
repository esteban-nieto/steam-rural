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
