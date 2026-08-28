// @ts-nocheck
import { useState, useEffect } from 'react'
import { supabase } from '../../services/supabase'
import type { Estudiante } from '../../services/supabase'
import { Layout } from '../../components/Layout'
import { EmotionPicker } from '../../components/EmotionPicker'
import { db, guardarProgresoLocal } from '../../services/db'

export function ProfesorHome() {
  const [curso, setCurso] = useState('3A')
  const [cursos, setCursos] = useState<string[]>(['3A', '4B'])
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])
  const [nombre, setNombre] = useState('')
  const [nuevoCurso, setNuevoCurso] = useState('')
  const [seleccionado, setSeleccionado] = useState<Estudiante | null>(null)
  const [emocionInicio, setEmocionInicio] = useState<string>()
  const [emocionFin, setEmocionFin] = useState<string>()
  const [pasos, setPasos] = useState<Set<number>>(new Set())
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [historial, setHistorial] = useState<any[]>([])

  const cargar = async () => {
    try {
      if (navigator.onLine) {
        const { data, error } = await (supabase.from as any)('estudiantes').select('*').eq('curso', curso)
        if (!error && data) {
          setEstudiantes(data as Estudiante[])
          for (const e of data as Estudiante[]) await db.estudiantes.put(e as any).catch(() => {})
          return
        }
      }
    } catch {}
    try {
      const local = await db.estudiantes.where('curso').equals(curso).toArray()
      setEstudiantes(local as any)
    } catch {
      setEstudiantes([])
    }
  }

  useEffect(() => { cargar() }, [curso])

  const agregar = async () => {
    if (!nombre.trim()) return
    const tempId = crypto.randomUUID()
    let profesorId: string | null = null
    try {
      const { data: { user } } = await (supabase.auth as any).getUser()
      profesorId = user?.id || null
    } catch {}
    if (!profesorId) {
      try {
        const localUser = localStorage.getItem('sb-phutywmnrwradaxzczwl-auth-token')
        if (localUser) {
          const parsed = JSON.parse(localUser)
          profesorId = parsed?.user?.id || null
        }
      } catch {}
    }
    const nuevo: any = { id: tempId, nombre: nombre.trim(), curso, profesor_id: profesorId, created_at: new Date().toISOString() }
    setEstudiantes((prev) => [...prev, nuevo as Estudiante])
    setNombre('')
    try {
      await db.estudiantes.put(nuevo)
      await db.estudiantesPendientes.put(nuevo)
    } catch {}
    if (navigator.onLine && profesorId) {
      try {
        const { data, error } = await (supabase.from as any)('estudiantes').insert({ nombre: nuevo.nombre, curso: nuevo.curso, profesor_id: profesorId }).select().single()
        if (!error && data) {
          setEstudiantes((prev) => prev.map((e) => (e.id === tempId ? (data as Estudiante) : e)))
          await db.estudiantes.put(data as any).catch(() => {})
          await db.estudiantes.delete(tempId).catch(() => {})
          await db.estudiantesPendientes.delete(tempId).catch(() => {})
        }
      } catch {}
    }
  }

  const crearCurso = () => {
    if (!nuevoCurso.trim() || cursos.includes(nuevoCurso)) return
    setCursos([...cursos, nuevoCurso])
    setCurso(nuevoCurso)
    setNuevoCurso('')
  }

  const EMOJI_MAP: Record<string, string> = { feliz: '😄', contento: '🙂', neutro: '😐', triste: '😔', enfado: '😠' }

  const cargarHistorial = async (estudianteId: string) => {
    try {
      const { data } = await (supabase.from as any)('progresos').select('*').eq('estudiante_id', estudianteId).order('fecha', { ascending: false })
      if (data && data.length > 0) {
        setHistorial(data)
        return
      }
    } catch {}
    try {
      const localAll = await db.progresos.where('estudiante_id').equals(estudianteId).toArray()
      setHistorial([...localAll].reverse())
    } catch {
      setHistorial([])
    }
  }

  const abrirEstudiante = async (e: Estudiante) => {
    setSeleccionado(e)
    setEmocionInicio(undefined)
    setEmocionFin(undefined)
    setPasos(new Set())
    setMensaje('')
    setHistorial([])
    try {
      const { data } = await (supabase.from as any)('progresos').select('*').eq('estudiante_id', e.id).order('fecha', { ascending: false }).limit(1).single()
      if (data) {
        setEmocionInicio(data.emocion_inicio || undefined)
        setEmocionFin(data.emocion_fin || undefined)
        setPasos(new Set(data.pasos_completados || []))
      } else {
        const local = await db.progresos.where('estudiante_id').equals(e.id).toArray()
        if (local.length > 0) {
          const ultimo = local[local.length - 1] as any
          setEmocionInicio(ultimo.emocion_inicio || undefined)
          setEmocionFin(ultimo.emocion_fin || undefined)
          setPasos(new Set(ultimo.pasos_completados || []))
        }
      }
    } catch {}
    cargarHistorial(e.id)
  }

  const togglePaso = (n: number) => {
    const next = new Set(pasos)
    if (next.has(n)) next.delete(n)
    else next.add(n)
    setPasos(next)
  }

  const guardarProgreso = async () => {
    if (!seleccionado) return
    if (!emocionInicio && pasos.size === 0) {
      setMensaje('Elige al menos emoción de entrada o un paso')
      return
    }
    setGuardando(true)
    const progreso: any = {
      id: crypto.randomUUID(),
      estudiante_id: seleccionado.id,
      actividad_id: 'origami-conejo',
      estado: pasos.size === 10 ? 'completado' : pasos.size > 0 ? 'en_progreso' : 'pendiente',
      pasos_completados: Array.from(pasos),
      emocion_inicio: emocionInicio || '',
      emocion_fin: emocionFin || null,
      fecha: new Date().toISOString(),
    }
    try {
      await guardarProgresoLocal(progreso)
      const { error } = await (supabase.from as any)('progresos').insert(progreso)
      if (error) throw error
      setMensaje('✓ Guardado en la nube')
    } catch {
      setMensaje('✓ Guardado local (se sincronizará)')
    }
    setHistorial((prev) => [progreso, ...prev])
    setGuardando(false)
    setTimeout(() => setMensaje(''), 2500)
  }

  return (
    <Layout title="Panel Profesor">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[11px] font-bold tracking-[0.14em] uppercase text-white bg-paramo px-2.5 py-1 rounded-full">{estudiantes.length} estudiantes</span>
        <span className="text-[12px] text-ink/50">en</span>
        <span className="font-display font-bold text-ink">{curso}</span>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {cursos.map((c) => (
          <button
            key={c}
            onClick={() => setCurso(c)}
            aria-pressed={curso === c}
            aria-label={`Curso ${c}`}
            className={`px-4 py-2 rounded-full text-[13px] font-bold border transition focus-visible:ring-2 focus-visible:ring-terracota ${curso === c ? 'bg-slateProfesor text-white border-slateProfesor shadow-paper' : 'bg-white text-ink/70 border-[#E8E0D0] hover:border-slateProfesor/30'}`}
          >
            {c}
          </button>
        ))}
        <span className="flex gap-1.5 bg-white border border-[#E8E0D0] rounded-full p-1">
          <input value={nuevoCurso} onChange={(e) => setNuevoCurso(e.target.value)} placeholder="Nuevo curso" className="bg-transparent px-3 text-[13px] w-28 outline-none placeholder:text-ink/30" />
          <button onClick={crearCurso} className="bg-ink text-white rounded-full px-3 text-[12px] font-bold">+ Curso</button>
        </span>
      </div>

      <div className="bg-white rounded-paper border border-[#E8E0D0] shadow-paper p-5 mb-6 paper-texture">
        <h3 className="font-display font-bold text-ink mb-1">Agregar estudiante</h3>
        <p className="text-[12px] text-ink/50 mb-3">Solo nombre y curso — el registro de emociones y progreso se hace en clase.</p>
        <div className="flex gap-2">
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Ana María" className="flex-1 bg-paper border border-[#E8E0D0] rounded-full px-4 py-2.5 text-[14px] outline-none focus:border-paramo/30 focus:bg-white" />
          <button onClick={agregar} className="bg-paramo text-white px-6 rounded-full font-bold text-[13px] tracking-wide hover:bg-[#1e3a0f] transition">Agregar</button>
        </div>
      </div>

      <div className="grid gap-3">
        {estudiantes.map((e) => (
          <button
            key={e.id}
            onClick={() => abrirEstudiante(e)}
            className="group w-full text-left bg-white rounded-2xl border border-[#E8E0D0] p-4 flex items-center gap-4 hover:shadow-paper hover:-translate-y-0.5 transition-all focus-visible:ring-2 focus-visible:ring-terracota text-ink"
            aria-label={`Ver detalle de ${e.nombre}`}
          >
            <div className="w-10 h-10 rounded-full bg-mist border border-moss/20 flex items-center justify-center font-display font-bold text-paramo">
              {e.nombre.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-[14px] leading-none">{e.nombre}</p>
              <p className="text-[11px] font-bold tracking-widest uppercase text-moss">{e.curso}</p>
            </div>
            <span className="text-[11px] font-semibold text-ink/30 group-hover:text-ink/60">Registrar →</span>
          </button>
        ))}
        {estudiantes.length === 0 && (
          <div className="bg-white rounded-paper border border-dashed border-[#E8E0D0] p-10 text-center">
            <p className="text-2xl mb-2">📋</p>
            <p className="font-display font-bold text-ink">Sin estudiantes en {curso}</p>
            <p className="text-[13px] text-ink/50">Agrega el primer nombre arriba.</p>
          </div>
        )}
      </div>

      {seleccionado && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => setSeleccionado(null)} aria-hidden="true" />
          <div className="relative bg-paper rounded-paper border border-[#E8E0D0] shadow-lift w-full max-w-lg max-h-[90vh] overflow-auto paper-texture">
            <div className="sticky top-0 bg-white border-b border-[#E8E0D0] p-4 flex items-center justify-between">
              <div>
                <p className="font-display font-bold text-ink">{seleccionado.nombre}</p>
                <p className="text-[11px] font-bold tracking-widest uppercase text-moss">{seleccionado.curso}</p>
              </div>
              <button onClick={() => setSeleccionado(null)} className="w-8 h-8 rounded-full bg-white border border-[#E8E0D0] flex items-center justify-center hover:bg-mist" aria-label="Cerrar">
                ×
              </button>
            </div>
            <div className="p-5 space-y-6">
              <div>
                <h4 className="font-display font-bold text-ink mb-2">¿Cómo se siente al entrar?</h4>
                <EmotionPicker value={emocionInicio} onSelect={setEmocionInicio} />
              </div>
              <div>
                <h4 className="font-display font-bold text-ink mb-2">¿Cómo se siente al finalizar?</h4>
                <EmotionPicker value={emocionFin} onSelect={setEmocionFin} />
              </div>
              <div>
                <h4 className="font-display font-bold text-ink mb-2">Progreso Origami Conejo (10 pasos)</h4>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <button
                      key={n}
                      onClick={() => togglePaso(n)}
                      aria-pressed={pasos.has(n)}
                      className={`p-3 rounded-xl border text-sm font-semibold transition ${pasos.has(n) ? 'bg-paramo text-white border-paramo' : 'bg-white border-[#E8E0D0] hover:border-paramo/30'}`}
                    >
                      Paso {n} {pasos.has(n) ? '✓' : ''}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-ink/50 mt-2">{pasos.size}/10 pasos completados</p>
              </div>
              {mensaje && <p className="text-center text-[13px] font-medium text-moss bg-mist border border-moss/20 rounded-xl px-3 py-2">{mensaje}</p>}
              <button onClick={guardarProgreso} disabled={guardando} className="w-full bg-paramo text-white rounded-full py-3 font-bold hover:bg-[#1e3a0f] disabled:opacity-50">
                {guardando ? 'Guardando...' : 'Guardar registro'}
              </button>

              {historial.length > 0 && (
                <div className="border-t border-[#E8E0D0] pt-4">
                  <h4 className="font-display font-bold text-ink mb-3">Historial por día</h4>
                  <div className="space-y-3 max-h-64 overflow-auto pr-1">
                    {(() => {
                      const porDia = new Map<string, any>()
                      historial.forEach((h: any) => {
                        const d = new Date(h.fecha)
                        const key = d.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })
                        if (!porDia.has(key) || new Date(h.fecha) > new Date(porDia.get(key).fecha)) porDia.set(key, h)
                      })
                      return Array.from(porDia.entries()).map(([fecha, it]: any) => {
                        const total = 10
                        const hechos = it.pasos_completados?.length || 0
                        const estado = hechos === total ? 'Terminó Origami Conejo' : hechos === 0 ? 'Sin avance' : `Quedó en paso ${hechos}/${total}`
                        return (
                          <div key={fecha} className="bg-white rounded-xl border border-[#E8E0D0] p-3">
                            <p className="text-[12px] font-bold tracking-wide text-ink capitalize">{fecha}</p>
                            <div className="flex items-center gap-2 mt-2 text-[13px]">
                              <span className="text-[11px] font-bold tracking-widest uppercase text-ink/50">Inicio</span>
                              <span className="text-lg leading-none">{EMOJI_MAP[it.emocion_inicio] || '—'}</span>
                              <span className="text-ink/30">→</span>
                              <span className="text-[11px] font-bold tracking-widest uppercase text-ink/50">Fin</span>
                              <span className="text-lg leading-none">{EMOJI_MAP[it.emocion_fin] || '—'}</span>
                            </div>
                            <p className="text-[12px] font-medium text-ink/70 mt-2 bg-paper border border-[#E8E0D0] rounded-full px-3 py-1 inline-block">{estado}</p>
                          </div>
                        )
                      })
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
