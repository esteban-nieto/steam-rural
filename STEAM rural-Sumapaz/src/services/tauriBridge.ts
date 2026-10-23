// Servicio puente para comunicación con el backend nativo de Tauri (P2P y Diálogos)

// Detecta si la app está corriendo dentro del runtime de escritorio de Tauri
export function isTauriEnvironment(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

/**
 * Invoca un comando Tauri si está en entorno de escritorio, o emula/falla elegantemente en web
 */
async function invokeTauri<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  if (!isTauriEnvironment()) {
    throw new Error('Esta función requiere la aplicación de escritorio de STEAM Rural.')
  }
  const { invoke } = await import('@tauri-apps/api/core')
  return await invoke<T>(command, args)
}

/**
 * Obtiene la dirección IP local de este computador
 */
export async function getLocalIp(): Promise<string> {
  return await invokeTauri<string>('get_local_ip')
}

/**
 * Inicia el servidor emisor temporal P2P protegido por PIN
 */
export async function startP2pHost(pin: string, jsonData: string): Promise<string> {
  return await invokeTauri<string>('start_p2p_host', { pin, jsonData })
}

/**
 * Detiene el servidor emisor P2P
 */
export async function stopP2pHost(): Promise<boolean> {
  return await invokeTauri<boolean>('stop_p2p_host')
}

/**
 * Conecta al equipo emisor para descargar la base de datos completa
 */
export async function receiveP2pData(targetIp: string, pin: string): Promise<string> {
  return await invokeTauri<string>('receive_p2p_data', { targetIp, pin })
}
