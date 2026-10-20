// @ts-nocheck
import { useState, useEffect } from 'react'
import { db, guardarProfesorLocal, obtenerProfesorActivo } from '../../services/db'
import { useAppStore } from '../../stores/app.store'
import type { Profesor } from '../../types/models'

export function Login({ onSuccess }: { onSuccess: () => void }) {
  const [pin, setPin] = useState('')
  const [nombre, setNombre] = useState('')
  const [profesorGuardado, setProfesorGuardado] = useState<Profesor | null>(null)
  const [error, setError] = useState('')
  const setUsuario = useAppStore((s) => s.setUsuario)

  useEffect(() => {
    obtenerProfesorActivo().then((p) => {
      if (p) {
        setProfesorGuardado(p)
        setNombre(p.nombre)
      }
    })
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Si ya existe un profesor guardado en este equipo
    if (profesorGuardado) {
      if (profesorGuardado.pin && profesorGuardado.pin !== pin.trim()) {
        setError('El PIN o clave ingresada no coincide.')
        return
      }
      setUsuario({
        rol: 'profesor',
        profesor: profesorGuardado,
      })
      onSuccess()
      return
    }

    // Si es la primera vez que ingresa en este equipo
    if (!nombre.trim()) {
      setError('Por favor escribe tu nombre.')
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
        <div className="w-10 h-10 rounded-xl bg-paramo text-white flex items-center justify-center mx-auto mb-3">
          ◈
        </div>
        <h2 className="font-display font-bold text-[20px] text-ink">
          {profesorGuardado ? `¡Hola, ${profesorGuardado.nombre}!` : 'Acceso Docente'}
        </h2>
        <p className="text-[12px] text-ink/50">
          {profesorGuardado
            ? 'Ingresa tu PIN de seguridad para acceder al panel'
            : 'Perfil local en este computador'}
        </p>
      </div>

      <form onSubmit={handleLogin} className="flex flex-col gap-3">
        {!profesorGuardado && (
          <div>
            <label className="block text-[11px] font-bold text-ink/70 uppercase mb-1">
              Nombre del Docente *
            </label>
            <input
              className="w-full bg-paper border border-[#E8E0D0] rounded-full px-4 py-2.5 text-[14px] outline-none focus:bg-white focus:border-paramo/30"
              placeholder="Ej. Profe María"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>
        )}

        <div>
          <label className="block text-[11px] font-bold text-ink/70 uppercase mb-1">
            {profesorGuardado?.pin ? 'PIN o Clave de acceso' : 'PIN o Clave (Opcional)'}
          </label>
          <input
            className="w-full bg-paper border border-[#E8E0D0] rounded-full px-4 py-2.5 text-[14px] outline-none focus:bg-white focus:border-paramo/30"
            placeholder="Ej. 1234"
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            required={!!profesorGuardado?.pin}
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2">
            <p className="text-red-600 text-[13px]">{error}</p>
          </div>
        )}

        <button
          type="submit"
          className="bg-paramo text-white rounded-full py-2.5 font-bold text-[14px] hover:bg-[#1e3a0f] transition shadow-paper mt-1"
        >
          {profesorGuardado ? 'Ingresar al Panel' : 'Crear Perfil e Ingresar'}
        </button>
      </form>
    </div>
  )
}
