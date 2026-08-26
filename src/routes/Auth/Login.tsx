// @ts-nocheck
import { useState } from 'react'
import { supabase } from '../../services/supabase'

export function Login({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const getErrorMessage = (msg: string) => {
    if (msg.includes('Invalid login credentials')) return 'Correo o contraseña incorrectos. Verifica tus datos o regístrate si no tienes cuenta.'
    if (msg.includes('Email not confirmed')) return 'Debes confirmar tu correo antes de ingresar. Revisa tu bandeja de entrada.'
    if (msg.includes('over_email_send_rate_limit')) return 'Demasiados intentos. Espera un minuto antes de reintentar.'
    return msg
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await (supabase.auth as any).signInWithPassword({ email, password })
    if (error) setError(getErrorMessage(error.message))
    else onSuccess()
    setLoading(false)
  }

  return (
    <div className="w-full max-w-sm bg-white rounded-paper border border-[#E8E0D0] shadow-paper p-6 paper-texture">
      <div className="text-center mb-6">
        <div className="w-10 h-10 rounded-xl bg-paramo text-white flex items-center justify-center mx-auto mb-3">◈</div>
        <h2 className="font-display font-bold text-[20px] text-ink">Ingreso profesor</h2>
        <p className="text-[12px] text-ink/50">Cada profesor ve solo sus cursos y estudiantes</p>
      </div>
      <form onSubmit={handleLogin} className="flex flex-col gap-3">
        <input className="bg-paper border border-[#E8E0D0] rounded-full px-4 py-2.5 text-[14px] outline-none focus:bg-white focus:border-paramo/30" placeholder="Correo" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="bg-paper border border-[#E8E0D0] rounded-full px-4 py-2.5 text-[14px] outline-none focus:bg-white focus:border-paramo/30" placeholder="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="text-red-600 text-[13px] bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>}
        <button disabled={loading} className="bg-paramo text-white rounded-full py-2.5 font-bold text-[14px] hover:bg-[#1e3a0f] transition disabled:opacity-50">
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  )
}
