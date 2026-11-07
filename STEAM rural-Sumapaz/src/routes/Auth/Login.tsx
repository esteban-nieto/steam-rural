import { useState } from 'react'
import { adoptarDatosSinDueno, guardarProfesorLocal, obtenerProfesores } from '../../services/db'
import {
  PIN_MINIMO,
  crearCredencial,
  esperaLogin,
  limpiarFallosLogin,
  registrarFalloLogin,
  sinCredenciales,
  verificarPin,
} from '../../services/auth'
import { useAppStore } from '../../stores/app.store'

export function Login({ onSuccess, onRegistrar }: { onSuccess: () => void; onRegistrar: () => void }) {
  const [identificador, setIdentificador] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const setUsuario = useAppStore((s) => s.setUsuario)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const inputNombre = identificador.trim()
    const inputPin = pin.trim()

    if (!inputNombre) {
      setError('Por favor ingresa tu nombre de usuario o correo.')
      return
    }

    const espera = esperaLogin()
    if (espera > 0) {
      setError(`Demasiados intentos. Espera ${Math.ceil(espera / 1000)} segundos.`)
      return
    }

    const claveCorta = `La contraseña o PIN debe tener al menos ${PIN_MINIMO} caracteres.`
    const profesores = await obtenerProfesores()

    if (profesores.length > 0) {
      const buscado = inputNombre.toLowerCase()
      const profesor = profesores.find(
        (p) => p.nombre?.toLowerCase() === buscado || p.email?.toLowerCase() === buscado
      )

      if (!profesor) {
        registrarFalloLogin()
        setError('El usuario o correo no coincide con ningún profesor registrado en este equipo.')
        return
      }

      const tieneClave = Boolean(profesor.pinHash || profesor.pin)
      if (!tieneClave && inputPin.length < PIN_MINIMO) {
        setError(claveCorta)
        return
      }
      if (tieneClave && !(await verificarPin(profesor, inputPin))) {
        registrarFalloLogin()
        setError('La contraseña o PIN ingresado es incorrecto.')
        return
      }
      limpiarFallosLogin()

      // Perfiles antiguos: el PIN en texto plano se reemplaza por su hash.
      if (!profesor.pinHash) {
        const { pin: _antiguo, ...resto } = profesor
        await guardarProfesorLocal({ ...resto, ...(await crearCredencial(inputPin)) })
      }

      await adoptarDatosSinDueno(profesor.id)
      setUsuario({
        rol: 'profesor',
        profesor: sinCredenciales(profesor),
      })
      onSuccess()
      return
    }

    setError('Aún no hay cuentas en este equipo. Crea la primera con "Crear cuenta".')
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
        <button
          type="button"
          onClick={onRegistrar}
          className="text-[13px] font-semibold text-paramo hover:underline"
        >
          Crear cuenta
        </button>
      </form>
    </div>
  )
}

