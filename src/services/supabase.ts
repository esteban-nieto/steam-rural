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
    id: 'origami-conejo',
    titulo: 'Origami Conejo',
    tipo: 'origami',
    pasos: [
      { numero: 1, img: 'origami/conejo/Paso%201.jpeg', descripcion: 'Paso 1' },
      { numero: 2, img: 'origami/conejo/Paso%202.jpeg', descripcion: 'Paso 2' },
      { numero: 3, img: 'origami/conejo/Paso%203.jpeg', descripcion: 'Paso 3' },
      { numero: 4, img: 'origami/conejo/Paso%204.jpeg', descripcion: 'Paso 4' },
      { numero: 5, img: 'origami/conejo/Paso%205.jpeg', descripcion: 'Paso 5' },
      { numero: 6, img: 'origami/conejo/Paso%206.jpeg', descripcion: 'Paso 6' },
      { numero: 7, img: 'origami/conejo/Paso%207.jpeg', descripcion: 'Paso 7' },
      { numero: 8, img: 'origami/conejo/Paso%208.jpeg', descripcion: 'Paso 8' },
      { numero: 9, img: 'origami/conejo/Paso%209.jpeg', descripcion: 'Paso 9' }
    ]
  }
]