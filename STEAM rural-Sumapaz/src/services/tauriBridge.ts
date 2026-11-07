// Comandos nativos de transferencia (src-tauri/src/p2p.rs). Fuera de la app de escritorio no existen.

export function isTauriEnvironment(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

async function invokeTauri<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  if (!isTauriEnvironment()) {
    throw new Error('Esta función requiere la aplicación de escritorio de STEAM Rural.')
  }
  const { invoke } = await import('@tauri-apps/api/core')
  return invoke<T>(command, args)
}

export const getLocalIp = () => invokeTauri<string>('get_local_ip')

export const startP2pHost = (pin: string, jsonData: string) => invokeTauri<string>('start_p2p_host', { pin, jsonData })

export const stopP2pHost = () => invokeTauri<boolean>('stop_p2p_host')

export const receiveP2pData = (targetIp: string, pin: string) => invokeTauri<string>('receive_p2p_data', { targetIp, pin })
