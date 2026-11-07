import { useEffect, useState } from 'react'
import { EmotionPicker } from './EmotionPicker'
import { db, guardarProgresoLocal } from '../services/db'
import type { Estudiante } from '../types/models'
import { Check } from 'lucide-react'

/** Al terminar una actividad, el estudiante indica quién es y cómo se siente. */
export function RegistroFinalActividad({ actividadId, totalPasos }: { actividadId: string; totalPasos: number }) {
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])
  const [estudianteId, setEstudianteId] = useState('')
  const [emocion, setEmocion] = useState<string>()
  const [estado, setEstado] = useState<'editando' | 'guardado' | 'error'>('editando')

  useEffect(() => {
    db.estudiantes
      .toArray()
      .then((lista) =>
        setEstudiantes(
          lista.sort((a, b) => a.curso.localeCompare(b.curso) || a.nombre.localeCompare(b.nombre))
        )
      )
      .catch(() => setEstado('error'))
  }, [])

  const guardar = async () => {
    try {
      await guardarProgresoLocal({
        id: crypto.randomUUID(),
        estudiante_id: estudianteId,
        actividad_id: actividadId,
        estado: 'completado',
        pasos_completados: Array.from({ length: totalPasos }, (_, i) => i + 1),
        emocion_inicio: '',
        emocion_fin: emocion ?? null,
        fecha: new Date().toISOString(),
      })
      setEstado('guardado')
    } catch {
      setEstado('error')
    }
  }

  if (estado === 'guardado') {
    return <p className="text-[13px] font-semibold text-paramo mt-3"><Check className="inline-block w-[1em] h-[1em] align-[-0.125em]" aria-hidden="true" /> ¡Registrado! Tu profe verá tu progreso.</p>
  }

  return (
    <div className="mt-4">
      <p className="text-[13px] text-ink/60 mb-2">¿Cómo te sientes al terminar?</p>
      <EmotionPicker value={emocion} onSelect={setEmocion} />
      {estudiantes.length === 0 ? (
        <p className="text-[12px] text-ink/50 mt-3">Pídele a tu profe que te agregue para guardar tu registro.</p>
      ) : (
        <div className="flex flex-col sm:flex-row gap-2 justify-center mt-3">
          <select
            aria-label="Selecciona tu nombre"
            value={estudianteId}
            onChange={(e) => setEstudianteId(e.target.value)}
            className="bg-paper border border-[#E8E0D0] rounded-full px-4 py-2 text-[13px]"
          >
            <option value="">Selecciona tu nombre</option>
            {estudiantes.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre} ({e.curso})
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={guardar}
            disabled={!estudianteId || !emocion}
            className="bg-paramo text-white rounded-full px-5 py-2 font-bold text-[13px] disabled:opacity-40"
          >
            Guardar
          </button>
        </div>
      )}
      {estado === 'error' && (
        <p className="text-[12px] text-red-600 mt-2">No se pudo guardar. Avísale a tu profe.</p>
      )}
    </div>
  )
}
