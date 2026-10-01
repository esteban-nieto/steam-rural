import { db, obtenerProgresosPendientes, obtenerEstudiantesPendientes, obtenerEvaluacionesPendientes, limpiarProgresosEnviados, limpiarEstudiantesEnviados, limpiarEvaluacionesEnviadas, generarEvaluacionId } from './db'
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
  try {
    const evalPendientes = await obtenerEvaluacionesPendientes()
    if (evalPendientes.length > 0) {
      const datosParaSupabase = evalPendientes.map((ev: any) => {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(ev.id)
        const idVal = isUuid ? ev.id : generarEvaluacionId(ev.estudiante_id, ev.fecha, ev.actividad_id)
        return {
          id: idVal,
          estudiante_id: ev.estudiante_id,
          actividad_id: ev.actividad_id,
          fecha: ev.fecha,
          criterios: ev.criterios,
          observacion: typeof ev.observacion === 'string' ? ev.observacion : JSON.stringify(ev.observaciones || {}),
        }
      })
      const { error } = await supabase.from('evaluaciones').upsert(datosParaSupabase)
      if (!error) {
        const ids = evalPendientes.map((e) => e.id)
        await limpiarEvaluacionesEnviadas(ids)
      }
    }
  } catch {}
  try { await db.open().catch(() => {}) } catch {}
}

export function initSyncListener() {
  window.addEventListener('online', syncPendientes)
  setInterval(syncPendientes, 15000)
  syncPendientes()
}
