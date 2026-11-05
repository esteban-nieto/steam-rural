import { useState, type FormEvent } from 'react'
import { adoptarDatosSinDueno, guardarProfesorLocal, obtenerProfesores } from '../../services/db'
import { PIN_MINIMO, crearCredencial, sinCredenciales } from '../../services/auth'
import { useAppStore } from '../../stores/app.store'
import type { Profesor } from '../../types/models'

const claseInput =
  'w-full bg-paper border border-[#E8E0D0] rounded-full px-4 py-2.5 text-[14px] outline-none focus:bg-white focus:border-paramo/30'
const claseEtiqueta = 'block text-[11px] font-bold text-ink/70 uppercase mb-1'

export function Registro({ onSuccess, onIrALogin }: { onSuccess: () => void; onIrALogin: () => void }) {
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [pin, setPin] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [error, setError] = useState('')
  const setUsuario = useAppStore((s) => s.setUsuario)

  const registrar = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    const nombreLimpio = nombre.trim()
    const emailLimpio = email.trim()

    if (pin.length < PIN_MINIMO) {
      setError(`El PIN debe tener al menos ${PIN_MINIMO} caracteres.`)
      return
    }
    if (pin !== confirmacion) {
      setError('Los PIN no coinciden.')
      return
    }

    try {
      const profesores = await obtenerProfesores()
      const nuevosDatos = [nombreLimpio.toLowerCase(), emailLimpio.toLowerCase()].filter(Boolean)
      const repetido = profesores.some((p) =>
        [p.nombre, p.email].some((v) => v && nuevosDatos.includes(v.toLowerCase()))
      )
      if (repetido) {
        setError('Ya existe una cuenta con ese nombre o correo.')
        return
      }

      const nuevo: Profesor = {
        id: crypto.randomUUID(),
        nombre: nombreLimpio,
        email: emailLimpio || undefined,
        ...(await crearCredencial(pin)),
        cursoActual: '3A',
        created_at: new Date().toISOString(),
      }
      await guardarProfesorLocal(nuevo)
      await adoptarDatosSinDueno(nuevo.id)
      setUsuario({ rol: 'profesor', profesor: sinCredenciales(nuevo) })
      onSuccess()
    } catch {
      setError('No se pudo crear la cuenta. Inténtalo de nuevo.')
    }
  }

  return (
    <div className="w-full max-w-sm bg-white rounded-paper border border-[#E8E0D0] shadow-paper p-6 paper-texture">
      <div className="text-center mb-6">
        <div className="w-10 h-10 rounded-xl bg-clay text-white flex items-center justify-center mx-auto mb-3">
          ✦
        </div>
        <h2 className="font-display font-bold text-[20px] text-ink">Crear cuenta docente</h2>
        <p className="text-[12px] text-ink/50">Tus datos se guardan solo en este equipo</p>
      </div>

      <form onSubmit={registrar} className="flex flex-col gap-3">
        <div>
          <label htmlFor="registro-nombre" className={claseEtiqueta}>Nombre del docente *</label>
          <input id="registro-nombre" className={claseInput} value={nombre} onChange={(e) => setNombre(e.target.value)} required autoComplete="name" />
        </div>
        <div>
          <label htmlFor="registro-email" className={claseEtiqueta}>Correo (opcional)</label>
          <input id="registro-email" className={claseInput} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </div>
        <div>
          <label htmlFor="registro-pin" className={claseEtiqueta}>PIN o contraseña *</label>
          <input id="registro-pin" className={claseInput} type="password" value={pin} onChange={(e) => setPin(e.target.value)} required minLength={PIN_MINIMO} autoComplete="new-password" />
        </div>
        <div>
          <label htmlFor="registro-confirmacion" className={claseEtiqueta}>Repite el PIN *</label>
          <input id="registro-confirmacion" className={claseInput} type="password" value={confirmacion} onChange={(e) => setConfirmacion(e.target.value)} required autoComplete="new-password" />
        </div>

        <p className="text-[11px] text-ink/50">Guarda bien tu PIN: por ahora no se puede recuperar.</p>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2">
            <p className="text-red-600 text-[13px]">{error}</p>
          </div>
        )}

        <button type="submit" className="bg-[#C47A3C] text-white rounded-full py-2.5 font-bold text-[14px] hover:bg-[#a65e2a] transition shadow-paper mt-1">
          Crear cuenta e ingresar
        </button>
        <button type="button" onClick={onIrALogin} className="text-[13px] font-semibold text-paramo hover:underline">
          Ya tengo cuenta
        </button>
      </form>
    </div>
  )
}
