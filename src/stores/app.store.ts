import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Estudiante, Profesor } from '../services/supabase'

type Rol = 'login' | 'profesor' | 'estudiante'

type UsuarioActual = {
  rol: Rol
  profesor?: Profesor
  estudiante?: Estudiante
}

type AppState = {
  usuario: UsuarioActual
  estudiantes: Estudiante[]
  actividadesCompletadas: Set<string>
  emocionActual: string | null
  setUsuario: (u: UsuarioActual) => void
  setEstudiantes: (e: Estudiante[]) => void
  agregarEstudiante: (e: Estudiante) => void
  setEmocion: (e: string) => void
  marcarActividadCompletada: (actividadId: string) => void
}

export const useAppStore = create<AppState>()(persist(
  (set, get) => ({
    usuario: { rol: 'login' },
    estudiantes: [],
    actividadesCompletadas: new Set(),
    emocionActual: null,
    setUsuario: (u) => set({ usuario: u }),
    setEstudiantes: (e) => set({ estudiantes: e }),
    agregarEstudiante: (e) => set({ estudiantes: [...get().estudiantes, e] }),
    setEmocion: (e) => set({ emocionActual: e }),
    marcarActividadCompletada: (id) => {
      const s = get()
      const nuevoSet = new Set(s.actividadesCompletadas)
      nuevoSet.add(id)
      set({ actividadesCompletadas: nuevoSet })
    }
  }),
  {
    name: 'steam-storage'
  }
))