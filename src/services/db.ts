import { Dexie, type Table } from 'dexie'
import type { Progreso, Estudiante, Emocion } from '../services/supabase'

class SteamDB extends Dexie {
  progresos!: Table<Progreso, string>
  estudiantes!: Table<Estudiante, string>
  progresosPendientes!: Table<Progreso, string>
  estudiantesPendientes!: Table<Estudiante, string>

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
  }
}

export const db = new SteamDB()

export async function guardarProgresoLocal(progreso: Progreso) {
  await db.progresos.put(progreso)
  await db.progresosPendientes.put(progreso).catch(() => {})
}

export async function guardarEstudianteLocal(estudiante: Estudiante) {
  await db.estudiantes.put(estudiante)
  await db.estudiantesPendientes.put(estudiante).catch(() => {})
}

export async function obtenerProgresosPendientes(): Promise<Progreso[]> {
  return await db.progresosPendientes.toArray()
}

export async function obtenerEstudiantesPendientes(): Promise<Estudiante[]> {
  return await db.estudiantesPendientes.toArray()
}

export async function limpiarProgresosEnviados(ids: string[]) {
  await db.progresosPendientes.bulkDelete(ids)
}

export async function limpiarEstudiantesEnviados(ids: string[]) {
  await db.estudiantesPendientes.bulkDelete(ids)
}

export const EMOCIONES: Emocion[] = ['feliz', 'contento', 'neutro', 'triste', 'enfado']
