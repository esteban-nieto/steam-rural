import { create } from 'zustand'
import type { Profesor } from '../types/models'

type UsuarioActual = {
  rol: 'login' | 'profesor'
  profesor?: Profesor
}

type AppState = {
  usuario: UsuarioActual
  setUsuario: (u: UsuarioActual) => void
}

// La sesión docente no se guarda: el equipo se comparte con estudiantes.
// Versiones anteriores dejaban aquí la sesión, incluido el PIN.
try {
  localStorage.removeItem('steam-storage')
} catch {}

export const useAppStore = create<AppState>()((set) => ({
  usuario: { rol: 'login' },
  setUsuario: (u) => set({ usuario: u }),
}))
