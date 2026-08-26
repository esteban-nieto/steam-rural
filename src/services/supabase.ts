import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://YOUR_PROJECT.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_ANON_KEY'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export type Profesor = {
  id: string
  email: string
  name: string
  curso: string
  created_at: string
}

export type Estudiante = {
  id: string
  nombre: string
  curso: string
  profesor_id: string
  created_at: string
}

export type Actividad = {
  id: string
  titulo: string
  tipo: string
  pasos: Array<{ numero: number; img: string; descripcion: string }>
}

export type Progreso = {
  id: string
  estudiante_id: string
  actividad_id: string
  estado: 'pendiente' | 'en_progreso' | 'completado'
  pasos_completados: number[]
  emocion_inicio: string
  emocion_fin: string | null
  fecha: string
}

export type Emocion = 'feliz' | 'contento' | 'neutro' | 'triste' | 'enfado'

export const ACTIVIDADES_PREDETERMINADAS: Actividad[] = [
  {
    id: 'origami-grulla',
    titulo: 'Origami Grulla',
    tipo: 'origami',
    pasos: [
      { numero: 1, img: '/origami/grulla/paso1.jpg', descripcion: 'Dobla el papel en forma de cuadrado' },
      { numero: 2, img: '/origami/grulla/paso2.jpg', descripcion: 'Pliega las esquinas hacia el centro' },
      { numero: 3, img: '/origami/grulla/paso3.jpg', descripcion: 'Continúa doblando hacia arriba' }
    ]
  }
]