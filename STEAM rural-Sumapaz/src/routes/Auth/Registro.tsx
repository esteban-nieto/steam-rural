// @ts-nocheck
import { useState } from 'react'
import { guardarProfesorLocal } from '../../services/db'
import { useAppStore } from '../../stores/app.store'
import type { Profesor } from '../../types/models'

export function Registro({ onSuccess }: { onSuccess: () => void }) {
  const [nombre, setNombre] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const setUsuario = useAppStore((s) => s.setUsuario)

  const handleRegistro = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim()) {
      setError('Por favor ingresa tu nombre.')
      return
    }

    const nuevoProfesor: Profesor = {
      id: crypto.randomUUID(),
      nombre: nombre.trim(),
      pin: pin.trim() || undefined,
      cursoActual: '3A',
      created_at: new Date().toISOString(),
    }

    await guardarProfesorLocal(nuevoProfesor)
    setUsuario({
      rol: 'profesor',
      profesor: nuevoProfesor,
    })
    onSuccess()
  }

  return (
    <div className="w-full max-w-sm bg-white rounded-paper border border-[#E8E0D0] shadow-paper p-6 paper-texture">
      <div className="text-center mb-6">
        <div className="w-10 h-10 rounded-xl bg-clay text-white flex items-center justify-center mx-auto mb-3">
          ✦
        </div>
        <h2 className="font-display font-bold text-[20px] text-ink">Nuevo perfil docente</h2>
        <p className="text-[12px] text-ink/50">Tus datos se guardan de forma 100% local en este equipo</p>
      </div>

      <form onSubmit={handleRegistro} className="flex flex-col gap-3">
        <div>
          <label className="block text-[11px] font-bold text-ink/70 uppercase mb-1">
            Nombre del Docente *
          </label>
          <input
            className="w-full bg-paper border border-[#E8E0D0] rounded-full px-4 py-2.5 text-[14px] outline-none focus:bg-white focus:border-paramo/30"
            placeholder="Ej. Profesor Carlos"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-ink/70 uppercase mb-1">
            PIN o Clave de acceso (Opcional)
          </label>
          <input
            className="w-full bg-paper border border-[#E8E0D0] rounded-full px-4 py-2.5 text-[14px] outline-none focus:bg-white focus:border-paramo/30"
            placeholder="Ej. 1234"
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
          />
          <p className="text-[11px] text-ink/40 mt-1">
            Útil para evitar que los estudiantes cambien notas o borren actividades.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2">
            <p className="text-red-600 text-[13px]">{error}</p>
          </div>
        )}

        <button
          type="submit"
          className="bg-[#C47A3C] text-white rounded-full py-2.5 font-bold text-[14px] hover:bg-[#a65e2a] transition shadow-paper mt-1"
        >
          Guardar Perfil e Ingresar
        </button>
      </form>
    </div>
  )
}
