// @ts-nocheck
import { useState } from 'react'
import { supabase } from '../../services/supabase'

export function Registro({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nombre, setNombre] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegistro = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({ email, password, options: { data: { nombre } } })
    if (error) setError(error.message)
    else onSuccess()
    setLoading(false)
  }

  return (
    <div className="max-w-sm mx-auto bg-white p-6 rounded-2xl shadow">
      <h2 className="text-xl font-bold text-center mb-4">Registro Profesor</h2>
      <form onSubmit={handleRegistro} className="flex flex-col gap-3">
        <input className="border rounded-lg px-3 py-2" placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
        <input className="border rounded-lg px-3 py-2" placeholder="Correo" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="border rounded-lg px-3 py-2" placeholder="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button disabled={loading} className="bg-primary text-white rounded-lg py-2 font-semibold hover:bg-green-800">
          {loading ? 'Creando...' : 'Crear cuenta'}
        </button>
      </form>
    </div>
  )
}
