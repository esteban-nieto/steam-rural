// @ts-nocheck
import { useState, useEffect } from 'react'
import { db, guardarProfesorLocal, obtenerProfesorActivo } from '../../services/db'
import { useAppStore } from '../../stores/app.store'
import type { Profesor } from '../../types/models'

export function Login({ onSuccess }: { onSuccess: () => void }) {
  const [identificador, setIdentificador] = useState('')
  const [pin, setPin] = useState('')
  const [profesorGuardado, setProfesorGuardado] = useState<Profesor | null>(null)
  const [error, setError] = useState('')
  const setUsuario = useAppStore((s) => s.setUsuario)

  useEffect(() => {
    obtenerProfesorActivo().then((p) => {
      if (p) {
        setProfesorGuardado(p)
      }
    })
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const inputNombre = identificador.trim()
    const inputPin = pin.trim()

    if (!inputNombre) {
      setError('Por favor ingresa tu nombre de usuario o correo.')
      return
    }

    // Si ya existe un profesor guardado en este equipo
    if (profesorGuardado) {
      const matchNombre =
        (profesorGuardado.nombre && profesorGuardado.nombre.toLowerCase() === inputNombre.toLowerCase()) ||
        (profesorGuardado.email && profesorGuardado.email.toLowerCase() === inputNombre.toLowerCase())

      if (!matchNombre) {
        setError('El usuario o correo no coincide con el profesor registrado en este equipo.')
        return
      }

      if (profesorGuardado.pin && profesorGuardado.pin !== inputPin) {
        setError('La contraseña o PIN ingresado es incorrecto.')
        return
      }

      setUsuario({
        rol: 'profesor',
        profesor: profesorGuardado,
      })
      onSuccess()
      return
    }

    // Si es la primera vez que se registra en este equipo
    const nuevoProfesor: Profesor = {
      id: crypto.randomUUID(),
      nombre: inputNombre,
      pin: inputPin || undefined,
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
          Acceso Docente
        </h2>
        <p className="text-[12px] text-ink/50">
          Ingresa tu usuario / correo y tu contraseña o PIN
        </p>
      </div>

      <form onSubmit={handleLogin} className="flex flex-col gap-3">
        <div>
          <label className="block text-[11px] font-bold text-ink/70 uppercase mb-1">
            Usuario o Nombre del Docente *
          </label>
          <input
            className="w-full bg-paper border border-[#E8E0D0] rounded-full px-4 py-2.5 text-[14px] outline-none focus:bg-white focus:border-paramo/30"
            placeholder="Ej. Profe María"
            value={identificador}
            onChange={(e) => setIdentificador(e.target.value)}
            required
            autoComplete="username"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-ink/70 uppercase mb-1">
            Contraseña o PIN de acceso *
          </label>
          <input
            className="w-full bg-paper border border-[#E8E0D0] rounded-full px-4 py-2.5 text-[14px] outline-none focus:bg-white focus:border-paramo/30"
            placeholder="Ingresa tu clave o PIN"
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            required
            autoComplete="current-password"
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
          Ingresar al Panel
        </button>
      </form>
    </div>
  )
}

