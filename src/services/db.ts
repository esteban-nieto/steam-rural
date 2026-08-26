import { Dexie, type Table } from 'dexie'
import type { Progreso, Emocion } from '../services/supabase'

class SteamDB extends Dexie {
  progresos!: Table<Progreso, string>

  constructor() {
    super('steamDB')
    this.version(1).stores({
      progresos: '&id, estudiante_id, actividad_id, fecha'
    })
  }
}

export const db = new SteamDB()

export async function guardarProgresoLocal(progreso: Progreso) {
  await db.progresos.put(progreso)
}

export async function obtenerProgresosPendientes(): Promise<Progreso[]> {
  return await db.progresos.toArray()
}

export async function limpiarProgresosEnviados(ids: string[]) {
  await db.progresos.bulkDelete(ids)
}

export const EMOCIONES: Emocion[] = ['feliz', 'contento', 'neutro', 'triste', 'enfado']