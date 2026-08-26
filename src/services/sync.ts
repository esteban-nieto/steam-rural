import { db } from './db'
import { supabase } from './supabase'

export async function syncPendientes() {
  if (!navigator.onLine) return
  const pendientes = await db.progresos.toArray()
  if (pendientes.length === 0) return
  const { error } = await supabase.from('progresos').upsert(pendientes)
  if (!error) {
    const ids = pendientes.map((p) => p.id)
    await db.progresos.bulkDelete(ids)
  }
}

export function initSyncListener() {
  window.addEventListener('online', syncPendientes)
  setInterval(syncPendientes, 30000)
}
