
export type Profesor = {
  id: string
  nombre: string
  email?: string
  /** Solo en perfiles antiguos; se elimina en el siguiente inicio de sesión. */
  pin?: string
  pinHash?: string
  pinSalt?: string
  cursoActual?: string
  created_at: string
}

export type Estudiante = {
  id: string
  nombre: string
  curso: string
  profesor_id?: string | null
  created_at: string
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
