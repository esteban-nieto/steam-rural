// @ts-nocheck
import { useState, useEffect } from 'react'
import { supabase } from './services/supabase'
import { initSyncListener } from './services/sync'
import { Login } from './routes/Auth/Login'
import { Registro } from './routes/Auth/Registro'
import { ProfesorHome } from './routes/Profesor/Home'
import { EstudianteHome } from './routes/Estudiante/Home'
import { OrigamiDetalle } from './routes/Estudiante/Origami'

type View = 'selector' | 'login' | 'registro' | 'profesor' | 'estudiante' | 'origami'

export default function App() {
  const [view, setView] = useState<View>('selector')
  const [session, setSession] = useState<boolean>(false)

  useEffect(() => {
    initSyncListener()
    supabase.auth.getSession().then(({ data }) => setSession(!!data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_, s) => setSession(!!s))
    return () => sub.subscription.unsubscribe()
  }, [])

  if (view === 'selector')
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 gap-6">
        <h1 className="text-3xl font-bold text-primary">STEAM Rural</h1>
        <p className="text-gray-500 text-center max-w-md">Talleres de robótica creativa con material reciclado — Sumapaz</p>
        <div className="grid grid-cols-2 gap-4 w-full max-w-md">
          <button onClick={() => setView('estudiante')} className="bg-white p-6 rounded-2xl shadow hover:shadow-lg border-2 border-transparent hover:border-primary">
            <div className="text-4xl mb-2">🎨</div>
            <div className="font-bold">Estudiante</div>
            <div className="text-xs text-gray-500">Actividades STEAM</div>
          </button>
          <button onClick={() => setView(session ? 'profesor' : 'login')} className="bg-white p-6 rounded-2xl shadow hover:shadow-lg border-2 border-transparent hover:border-secondary">
            <div className="text-4xl mb-2">👩‍🏫</div>
            <div className="font-bold">Profesor</div>
            <div className="text-xs text-gray-500">Gestionar cursos</div>
          </button>
        </div>
        {!session && (
          <button onClick={() => setView('registro')} className="text-sm text-primary underline">
            ¿Eres profesor? Crea tu cuenta
          </button>
        )}
      </div>
    )

  if (view === 'login')
    return (
      <div className="min-h-screen bg-surface p-6">
        <button onClick={() => setView('selector')} className="text-sm mb-4 text-gray-500">← Volver</button>
        <Login onSuccess={() => setView('profesor')} />
        <p className="text-center text-sm mt-4">
          ¿Sin cuenta?{' '}
          <button onClick={() => setView('registro')} className="text-primary underline">
            Regístrate
          </button>
        </p>
      </div>
    )

  if (view === 'registro')
    return (
      <div className="min-h-screen bg-surface p-6">
        <button onClick={() => setView('selector')} className="text-sm mb-4 text-gray-500">← Volver</button>
        <Registro onSuccess={() => setView('login')} />
      </div>
    )

  if (view === 'profesor')
    return (
      <div>
        <div className="bg-white border-b px-4 py-2 flex justify-between">
          <button onClick={() => setView('selector')} className="text-sm text-gray-500">← Inicio</button>
          <button
            onClick={async () => {
              await supabase.auth.signOut()
              setView('selector')
            }}
            className="text-sm text-red-500"
          >
            Cerrar sesión
          </button>
        </div>
        <ProfesorHome />
      </div>
    )

  if (view === 'estudiante')
    return <EstudianteHome onSelect={(id) => (id === 'origami' ? setView('origami') : null)} />

  if (view === 'origami') return <OrigamiDetalle onBack={() => setView('estudiante')} />

  return null
}
