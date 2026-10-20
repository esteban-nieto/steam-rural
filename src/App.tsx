// @ts-nocheck
import { useState, useEffect } from 'react'
import { Login } from './routes/Auth/Login'
import { Registro } from './routes/Auth/Registro'
import { ProfesorHome } from './routes/Profesor/Home'
import { EstudianteHome } from './routes/Estudiante/Home'
import { OrigamiDetalle } from './routes/Estudiante/Origami'
import { MolinoCasa } from './routes/Estudiante/MolinoCasa'
import { ActividadDinamica } from './routes/Estudiante/ActividadDinamica'
import { HistoriaPueblo } from './routes/HistoriaPueblo'
import { obtenerProfesorActivo } from './services/db'
import { useAppStore } from './stores/app.store'
import type { Actividad } from './services/db'

type View =
  | 'selector'
  | 'login'
  | 'registro'
  | 'profesor'
  | 'estudiante'
  | 'origami'
  | 'molino'
  | 'historia'
  | 'actividad_dinamica'

export default function App() {
  const [view, setView] = useState<View>(() => {
    const h = location.hash.replace('#', '') as View
    return ([
      'selector',
      'login',
      'registro',
      'profesor',
      'estudiante',
      'origami',
      'molino',
      'historia',
      'actividad_dinamica',
    ].includes(h)
      ? h
      : 'selector') as View
  })

  const [actividadSeleccionada, setActividadSeleccionada] = useState<Actividad | null>(null)
  const usuario = useAppStore((s) => s.usuario)
  const setUsuario = useAppStore((s) => s.setUsuario)

  const pushView = (v: View) => {
    try {
      history.pushState({ view: v }, '', `#${v}`)
    } catch {}
    setView(v)
  }

  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      const h = location.hash.replace('#', '')
      const v = (e.state?.view || h || 'selector') as View
      if (
        [
          'selector',
          'login',
          'registro',
          'profesor',
          'estudiante',
          'origami',
          'molino',
          'historia',
          'actividad_dinamica',
        ].includes(v)
      ) {
        setView(v)
      } else if (h === 'ficha' || h === 'rubrica') {
        // Sub-vistas modales dentro de profesor: no alterar view principal
      } else {
        setView('selector')
      }
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  // Cargar perfil docente guardado si existe
  useEffect(() => {
    obtenerProfesorActivo().then((p) => {
      if (p && !usuario?.profesor) {
        setUsuario({
          ...usuario,
          profesor: p,
        })
      }
    })
  }, [])

  if (view === 'selector')
    return (
      <div className="min-h-screen bg-paper paper-texture">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <nav className="h-[56px] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg bg-paramo flex items-center justify-center text-white"
                aria-hidden="true"
              >
                ◈
              </div>
              <span className="font-display font-bold text-ink">STEAM Rural</span>
              <span className="hidden sm:inline text-[10px] font-bold tracking-[0.14em] uppercase text-white bg-paramo px-2 py-1 rounded-full">
                Sumapaz
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => pushView('login')}
                aria-label="Acceso docente"
                className="text-[13px] font-semibold text-paramo border border-paramo/20 px-4 py-2 rounded-full hover:bg-white transition focus-visible:ring-2 focus-visible:ring-terracota"
              >
                Soy profesor
              </button>
            </div>
          </nav>

          <main className="min-h-[calc(100vh-56px)] flex items-center justify-center py-12">
            <div className="w-full max-w-xl text-center">
              <div className="mb-6">
                <h1 className="font-display font-extrabold text-[36px] sm:text-[44px] text-ink leading-tight mb-2">
                  Aprender con las manos y el corazón
                </h1>
                <p className="text-[15px] sm:text-[17px] text-ink/70">
                  Ciencia, tecnología y arte para las escuelas rurales del Sumapaz
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                <button
                  onClick={() => pushView('estudiante')}
                  className="group bg-white rounded-paper border-2 border-moss/30 p-8 text-center hover:border-moss hover:shadow-paper transition focus-visible:ring-2 focus-visible:ring-terracota"
                >
                  <div className="w-16 h-16 rounded-2xl bg-mist text-moss text-[32px] flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition">
                    🌱
                  </div>
                  <h2 className="font-display font-bold text-[22px] text-ink mb-1">
                    Soy estudiante
                  </h2>
                  <p className="text-[13px] text-ink/60">
                    Hacer origami, construir molinos y explorar actividades
                  </p>
                </button>

                <button
                  onClick={() => pushView('login')}
                  className="group bg-white rounded-paper border-2 border-paramo/20 p-8 text-center hover:border-paramo hover:shadow-paper transition focus-visible:ring-2 focus-visible:ring-terracota"
                >
                  <div className="w-16 h-16 rounded-2xl bg-[#E8E0D0]/50 text-paramo text-[32px] flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition">
                    📋
                  </div>
                  <h2 className="font-display font-bold text-[22px] text-ink mb-1">
                    Soy docente
                  </h2>
                  <p className="text-[13px] text-ink/60">
                    Evaluar rúbricas, registrar estudiantes y crear actividades
                  </p>
                </button>
              </div>

              <div className="mt-8 flex items-center justify-center gap-2 text-ink/50 text-xs">
                <span>📍</span>
                <span>Modo fuera de línea local · Sincronización P2P en el aula</span>
              </div>
            </div>
          </main>
        </div>
      </div>
    )

  if (view === 'login')
    return (
      <div className="min-h-screen bg-paper paper-texture flex flex-col items-center justify-center p-4">
        <button
          onClick={() => pushView('selector')}
          className="mb-4 text-[13px] text-ink/60 hover:text-ink transition flex items-center gap-1 font-semibold"
        >
          ← Volver al inicio
        </button>
        <Login onSuccess={() => pushView('profesor')} />
      </div>
    )

  if (view === 'registro')
    return (
      <div className="min-h-screen bg-paper paper-texture flex flex-col items-center justify-center p-4">
        <button
          onClick={() => pushView('selector')}
          className="mb-4 text-[13px] text-ink/60 hover:text-ink transition flex items-center gap-1 font-semibold"
        >
          ← Volver al inicio
        </button>
        <Registro onSuccess={() => pushView('profesor')} />
      </div>
    )

  if (view === 'profesor')
    return (
      <ProfesorHome
        onCerrarSesion={() => {
          setUsuario({ rol: 'login' })
          pushView('selector')
        }}
      />
    )

  if (view === 'estudiante')
    return (
      <EstudianteHome
        onSelectOrigami={() => pushView('origami')}
        onSelectMolino={() => pushView('molino')}
        onSelectHistoria={() => pushView('historia')}
        onSelectActividadDinamica={(act) => {
          setActividadSeleccionada(act)
          pushView('actividad_dinamica')
        }}
        onBack={() => pushView('selector')}
      />
    )

  if (view === 'actividad_dinamica' && actividadSeleccionada)
    return (
      <ActividadDinamica
        actividad={actividadSeleccionada}
        onBack={() => pushView('estudiante')}
      />
    )

  if (view === 'origami') return <OrigamiDetalle onBack={() => pushView('estudiante')} />
  if (view === 'molino') return <MolinoCasa onBack={() => pushView('estudiante')} />
  if (view === 'historia') return <HistoriaPueblo onBack={() => pushView('estudiante')} />

  return null
}
