// @ts-nocheck
import { useState, useEffect } from 'react'
import { supabase } from './services/supabase'
import { initSyncListener } from './services/sync'
import { Login } from './routes/Auth/Login'
import { Registro } from './routes/Auth/Registro'
import { ProfesorHome } from './routes/Profesor/Home'
import { EstudianteHome } from './routes/Estudiante/Home'
import { OrigamiDetalle } from './routes/Estudiante/Origami'
import { MolinoCasa } from './routes/Estudiante/MolinoCasa'
import { HistoriaPueblo } from './routes/HistoriaPueblo'
import { SyncIndicator } from './components/SyncIndicator'

type View = 'selector' | 'login' | 'registro' | 'profesor' | 'estudiante' | 'origami' | 'molino' | 'historia'

export default function App() {
  const [view, setView] = useState<View>(() => {
    const h = location.hash.replace('#', '') as View
    return (['selector','login','registro','profesor','estudiante','origami','molino','historia'].includes(h) ? h : 'selector') as View
  })
  const [session, setSession] = useState<boolean>(false)

  const pushView = (v: View) => {
    try { history.pushState({ view: v }, '', `#${v}`) } catch {}
    setView(v)
  }

  useEffect(() => {
    initSyncListener()
    const onPop = (e: PopStateEvent) => {
      const v = (e.state?.view || location.hash.replace('#','') || 'selector') as View
      if (['selector','login','registro','profesor','estudiante','origami','molino','historia'].includes(v)) setView(v)
      else setView('selector')
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  useEffect(() => {
    const initSession = async () => {
      if (!navigator.onLine) {
        try {
          const raw = localStorage.getItem('sb-phutywmnrwradaxzczwl-auth-token')
          if (raw) {
            const parsed = JSON.parse(raw)
            setSession(!!parsed?.access_token || !!parsed?.currentSession)
          }
        } catch {}
        return
      }
      try {
        const { data } = await (supabase.auth as any).getSession()
        setSession(!!data?.session)
      } catch {}
    }
    initSession()
    try {
      const { data: sub } = (supabase.auth as any).onAuthStateChange((_: any, s: any) => setSession(!!s))
      return () => sub?.subscription?.unsubscribe()
    } catch {
      return () => {}
    }
  }, [])

  if (view === 'selector')
    return (
      <div className="min-h-screen bg-paper paper-texture">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <nav className="h-[56px] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-paramo flex items-center justify-center text-white" aria-hidden="true">
                ◈
              </div>
              <span className="font-display font-bold text-ink">STEAM Rural</span>
              <span className="hidden sm:inline text-[10px] font-bold tracking-[0.14em] uppercase text-white bg-paramo px-2 py-1 rounded-full">Sumapaz</span>
            </div>
            <div className="flex items-center gap-2">
              <SyncIndicator />
              {!session && (
                <button
                  onClick={() => pushView('registro')}
                  aria-label="Crear cuenta de profesor"
                  className="text-[13px] font-semibold text-paramo border border-paramo/20 px-4 py-2 rounded-full hover:bg-white transition focus-visible:ring-2 focus-visible:ring-terracota"
                >
                  Soy profesor
                </button>
              )}
            </div>
          </nav>

          <section className="py-8 sm:py-12 grid lg:grid-cols-[1.1fr_0.9fr] gap-8 items-center">
            <div>
              <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-clay mb-3">Santa Rita · Buenos Aires</p>
              <h1 className="font-display font-extrabold text-[38px] sm:text-[52px] leading-[0.95] tracking-[-0.03em] text-ink">
                Dobla papel,
                <br />
                <span className="text-paramo">construye</span> ideas.
              </h1>
              <p className="text-[15px] leading-relaxed text-ink/60 mt-4 max-w-[46ch]">Talleres de robótica creativa y STEAM para escuelas rurales.</p>
            </div>

            <button onClick={() => pushView('historia')} className="relative text-left w-full group">
              <div className="bg-white rounded-[28px] border border-[#E8E0D0] shadow-paper p-6 sm:p-8 paper-texture group-hover:shadow-lift group-hover:-translate-y-1 transition-all">
                <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-mist to-paper border border-[#E8E0D0] flex items-center justify-center relative overflow-hidden">
                  <img src={`${import.meta.env.BASE_URL}historia/pueblo-soleado-poster.jpg`} alt="Historia Pueblo Soleado" className="absolute inset-0 w-full h-full object-cover" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center text-xl shadow-lg group-hover:scale-110 transition">▶</span>
                  </div>
                  <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full border border-[#E8E0D0] text-[11px] font-bold tracking-widest uppercase text-ink">Ver historia</div>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-[11px] font-bold tracking-widest uppercase text-clay">Historia Pueblo Soleado</span>
                  <span className="text-[12px] font-semibold text-ink/50">Parte 1</span>
                </div>
                <p className="text-[12px] leading-relaxed text-ink/60 mt-2">Una historia creada con IA para incentivar la actividad del molino. Toca para ver la primera parte.</p>
              </div>
              <div className="absolute -z-10 -bottom-4 -right-4 w-full h-full rounded-[28px] bg-clay/10 border border-clay/10 group-hover:bg-clay/20 transition" />
            </button>
          </section>

          <section className="pb-10 grid sm:grid-cols-2 gap-4 sm:gap-6 max-w-3xl mx-auto">
            <button
              onClick={() => pushView('estudiante')}
              className="group text-left bg-white rounded-paper border border-[#E8E0D0] shadow-paper hover:shadow-lift hover:-translate-y-1 transition-all p-6 fold-corner"
            >
              <div className="w-12 h-12 rounded-2xl bg-mist border border-moss/20 flex items-center justify-center text-2xl mb-4 group-hover:scale-105 transition">🎨</div>
              <h3 className="font-display font-bold text-[20px] text-ink">Entrar como estudiante</h3>
              <p className="text-[13px] leading-relaxed text-ink/60 mt-1">Elige cómo te sientes, abre la tarjeta Origami y sigue los pasos con tus imágenes.</p>
              <span className="inline-flex items-center gap-1 text-[12px] font-bold tracking-widest uppercase text-paramo mt-4">Explorar actividades →</span>
            </button>

            <button
              onClick={() => pushView(session ? 'profesor' : 'login')}
              aria-label={session ? 'Abrir panel del profesor' : 'Iniciar sesión como profesor'}
              className="group text-left bg-slateProfesor text-white rounded-paper shadow-paper hover:shadow-lift hover:-translate-y-1 transition-all p-6 relative overflow-hidden focus-visible:ring-2 focus-visible:ring-terracota focus-visible:ring-offset-2"
            >
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
              <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center text-2xl mb-4" aria-hidden="true">
                👩‍🏫
              </div>
              <h3 className="font-display font-bold text-[20px]">Panel del profesor</h3>
              <p className="text-[13px] leading-relaxed text-white/70 mt-1">Crea cursos, registra estudiantes por nombre y curso, y revisa el progreso y emociones.</p>
              <span className="inline-flex items-center gap-1 text-[12px] font-bold tracking-widest uppercase text-white/90 mt-4">{session ? 'Abrir panel →' : 'Iniciar sesión →'}</span>
            </button>
          </section>

          <p className="text-center text-[11px] tracking-wide text-ink/40 pb-8">Funciona sin conexión después de la primera carga · Se sincroniza al volver a tener internet</p>
        </div>
      </div>
    )

  if (view === 'login')
    return (
      <div className="min-h-screen bg-paper paper-texture p-6 flex flex-col items-center">
        <button onClick={() => pushView('selector')} className="self-start max-w-sm w-full mx-auto text-sm text-ink/60 mb-4">← Volver</button>
        <Login onSuccess={() => pushView('profesor')} />
        <p className="text-center text-sm mt-4 text-ink/60">
          ¿Sin cuenta? <button onClick={() => pushView('registro')} className="text-paramo font-semibold underline">Regístrate</button>
        </p>
      </div>
    )

  if (view === 'registro')
    return (
      <div className="min-h-screen bg-paper paper-texture p-6 flex flex-col items-center">
        <button onClick={() => pushView('selector')} className="self-start max-w-sm w-full mx-auto text-sm text-ink/60 mb-4">← Volver</button>
        <Registro onSuccess={() => pushView('login')} />
      </div>
    )

  if (view === 'profesor')
    return (
      <div className="min-h-screen bg-paper">
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-[#E8E0D0] px-4 py-2 flex justify-between max-w-6xl mx-auto">
          <button onClick={() => pushView('selector')} className="text-sm font-medium text-ink/70">← Inicio</button>
          <button onClick={async () => { await (supabase.auth as any).signOut(); pushView('selector') }} className="text-sm font-semibold text-red-600">
            Cerrar sesión
          </button>
        </div>
        <ProfesorHome />
      </div>
    )

  if (view === 'estudiante')
    return (
      <EstudianteHome
        onSelect={(id) => {
          if (id === 'origami') pushView('origami')
          else if (id === 'molino') pushView('molino')
        }}
        onBack={() => pushView('selector')}
      />
    )
  if (view === 'origami') return <OrigamiDetalle onBack={() => pushView('estudiante')} />
  if (view === 'molino') return <MolinoCasa onBack={() => pushView('estudiante')} />
  if (view === 'historia') return <HistoriaPueblo onBack={() => pushView('selector')} />
  return null
}
