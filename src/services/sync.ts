import { db, obtenerProgresosPendientes, obtenerEstudiantesPendientes, obtenerEvaluacionesPendientes, limpiarProgresosEnviados, limpiarEstudiantesEnviados, limpiarEvaluacionesEnviadas, generarEvaluacionId } from './db'
import { supabase } from './supabase'

/** Verifica que hay una sesión activa de Supabase antes de sincronizar */
async function tieneSession(): Promise<boolean> {
  try {
    const { data } = await (supabase.auth as any).getSession()
    return !!data?.session
  } catch {
    return false
  }
}

/**
 * Migra evaluaciones viejas que tengan IDs aleatorios (UUID de crypto.randomUUID)
 * al formato determinístico nuevo basado en estudiante+fecha+actividad.
 * Esto asegura que rúbricas llenadas offline con el código viejo se encuentren
 * al buscar con generarEvaluacionId().
 */
async function migrarEvaluacionesLocales() {
  try {
    const todas = await db.evaluaciones.toArray()
    for (const ev of todas) {
      const idDeterministico = generarEvaluacionId(ev.estudiante_id, (ev.fecha || '').split('T')[0], ev.actividad_id)
      if (ev.id !== idDeterministico) {
        // La evaluación tiene un ID viejo — guardar con el ID nuevo
        const nuevaEv = { ...ev, id: idDeterministico }
        await db.evaluaciones.put(nuevaEv as any).catch(() => {})
        // También migrar en pendientes si existe
        try {
          const pendiente = await db.evaluacionesPendientes.get(ev.id)
          if (pendiente) {
            await db.evaluacionesPendientes.delete(ev.id).catch(() => {})
            await db.evaluacionesPendientes.put({ ...pendiente, id: idDeterministico } as any).catch(() => {})
          }
        } catch {}
        // Borrar el registro viejo
        if (ev.id !== idDeterministico) {
          await db.evaluaciones.delete(ev.id).catch(() => {})
        }
        console.log(`[sync] Migrada evaluación ${ev.id} → ${idDeterministico}`)
      }
    }
  } catch (err) {
    console.warn('[sync] Error migrando evaluaciones locales:', err)
  }
}

export async function syncPendientes() {
  if (!navigator.onLine) return

  // Verificar autenticación — sin sesión las RLS policies rechazan todo
  const autenticado = await tieneSession()
  if (!autenticado) {
    console.log('[sync] Sin sesión activa, sincronización pospuesta')
    return
  }

  // Migrar IDs viejos antes de sincronizar
  await migrarEvaluacionesLocales()

  try {
    const estPendientes = await obtenerEstudiantesPendientes()
    if (estPendientes.length > 0) {
      let currentProfesorId: string | null = null
      try {
        const { data } = await supabase.auth.getUser()
        currentProfesorId = data?.user?.id || null
      } catch {}
      const estSaneados = estPendientes.map((e) => ({
        ...e,
        profesor_id: e.profesor_id || currentProfesorId,
      }))
      const { error } = await supabase.from('estudiantes').upsert(estSaneados)
      if (!error) {
        const ids = estPendientes.map((e) => e.id)
        await limpiarEstudiantesEnviados(ids)
        console.log(`[sync] ${ids.length} estudiante(s) sincronizado(s)`)
      } else {
        console.warn('[sync] Error sincronizando estudiantes:', error.message)
      }
    }
  } catch (err) {
    console.warn('[sync] Excepción sincronizando estudiantes:', err)
  }

  try {
    const progPendientes = await obtenerProgresosPendientes()
    if (progPendientes.length > 0) {
      const { error } = await supabase.from('progresos').upsert(progPendientes)
      if (!error) {
        const ids = progPendientes.map((p) => p.id)
        await limpiarProgresosEnviados(ids)
        console.log(`[sync] ${ids.length} progreso(s) sincronizado(s)`)
      } else {
        console.warn('[sync] Error sincronizando progresos:', error.message)
      }
    }
  } catch (err) {
    console.warn('[sync] Excepción sincronizando progresos:', err)
  }

  try {
    const evalPendientes = await obtenerEvaluacionesPendientes()
    if (evalPendientes.length > 0) {
      const datosParaSupabase = evalPendientes.map((ev: any) => {
        // Siempre usar ID determinístico para que se encuentre después
        const fecha = (ev.fecha || '').split('T')[0]
        const idVal = generarEvaluacionId(ev.estudiante_id, fecha, ev.actividad_id)
        return {
          id: idVal,
          estudiante_id: ev.estudiante_id,
          actividad_id: ev.actividad_id,
          fecha: fecha,
          criterios: ev.criterios,
          observacion: typeof ev.observacion === 'string' ? ev.observacion : JSON.stringify(ev.observaciones || {}),
        }
      })
      const { error } = await supabase.from('evaluaciones').upsert(datosParaSupabase)
      if (!error) {
        const ids = evalPendientes.map((e) => e.id)
        await limpiarEvaluacionesEnviadas(ids)
        // Guardar con ID determinístico en local también
        for (const d of datosParaSupabase) {
          await db.evaluaciones.put(d).catch(() => {})
        }
        console.log(`[sync] ${datosParaSupabase.length} evaluación(es) sincronizada(s)`)
      } else {
        console.warn('[sync] Error sincronizando evaluaciones:', error.message)
      }
    }
  } catch (err) {
    console.warn('[sync] Excepción sincronizando evaluaciones:', err)
  }

  try { await db.open().catch(() => {}) } catch {}
}

export function initSyncListener() {
  window.addEventListener('online', syncPendientes)
  // Intentar cada 30s (no 15s para no saturar si no hay sesión)
  setInterval(syncPendientes, 30000)
  // El sync inicial solo corre si hay sesión; si no, espera al login
  syncPendientes()
}
