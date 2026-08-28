import { obtenerProgresosPendientes, obtenerEstudiantesPendientes, limpiarProgresosEnviados, limpiarEstudiantesEnviados } from './db'
import { supabase } from './supabase'

export async function syncPendientes() {
  if (!navigator.onLine) return

  try {
    const estPendientes = await obtenerEstudiantesPendientes()
    if (estPendientes.length > 0) {
      const { error } = await supabase.from('estudiantes').upsert(estPendientes)
      if (!error) {
        const ids = estPendientes.map((e) => e.id)
        await limpiarEstudiantesEnviados(ids)
      }
    }
  } catch {}

  try {
    const progPendientes = await obtenerProgresosPendientes()
    if (progPendientes.length > 0) {
      const { error } = await supabase.from('progresos').upsert(progPendientes)
      if (!error) {
        const ids = progPendientes.map((p) => p.id)
        await limpiarProgresosEnviados(ids)
      }
    }
  } catch {}
}

export function initSyncListener() {
  window.addEventListener('online', syncPendientes)
  setInterval(syncPendientes, 15000)
  syncPendientes()
}
