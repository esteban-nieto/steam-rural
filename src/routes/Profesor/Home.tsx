// @ts-nocheck
import * as React from 'react'
import { useState, useEffect } from 'react'
import { supabase } from '../../services/supabase'
import type { Estudiante } from '../../services/supabase'
import { Layout } from '../../components/Layout'
import { EmotionPicker } from '../../components/EmotionPicker'
import { db, guardarProgresoLocal, guardarEvaluacionLocal } from '../../services/db'

const ACTIVIDADES = [
  { id: 'origami-conejo', label: 'Actividad 1- Origami conejo', pasos: 11 },
  { id: 'molino-casa', label: 'Actividad 2- Molino + Casa', pasos: 20 },
]

const RUBRICA = [
  { area: '1. CIENCIAS (S)', desc: 'Conocimiento y exploración de fenómenos físicos y transformaciones de energía.', items: [
    { key: 'S-AF', dim: 'Afectiva (AF)', ind: 'Muestra asombro y curiosidad al observar la transformación de la fuerza o energía del sistema en movimiento rotacional de las aspas.' },
    { key: 'S-CG', dim: 'Cognitiva (CG)', ind: 'Explica cómo la fuerza o energía aplicada al sistema se transmite hasta generar el giro del molino.' },
    { key: 'S-CD', dim: 'Conductual (CD)', ind: 'Experimenta cómo afecta la fuerza de gravedad o el peso de los insumos al giro continuo de las aspas.' },
  ]},
  { area: '2. TECNOLOGÍA (T)', desc: 'Uso, manipulación y comprensión de los componentes y mecanismos del sistema.', items: [
    { key: 'T-AF', dim: 'Afectiva (AF)', ind: 'Confía y manipula con destreza las herramientas, materiales y componentes del sistema para armar el mecanismo del molino.' },
    { key: 'T-CG', dim: 'Cognitiva (CG)', ind: 'Identifica las partes del mecanismo que hace girar el molino y comprende cómo se conectan entre sí para lograr el movimiento.' },
    { key: 'T-CD', dim: 'Conductual (CD)', ind: 'Ensambla, ajusta y reacomoda de forma autónoma las piezas y componentes del molino para lograr un giro estable.' },
  ]},
  { area: '3. INGENIERÍA (E)', desc: 'Diseño estructural, resolución de problemas mecánicos, pruebas e iteración.', items: [
    { key: 'E-AF', dim: 'Afectiva (AF)', ind: 'Mantiene la calma, la motivación y la persistencia ante las fallas mecánicas iniciales del prototipo.' },
    { key: 'E-CG', dim: 'Cognitiva (CG)', ind: 'Diagnostica la causa de un fallo en la estructura o en el mecanismo de rotación (p. ej., "el eje se frena porque choca con el cartón").' },
    { key: 'E-CD', dim: 'Conductual (CD)', ind: 'Rediseña y ajusta el soporte del eje, el acople de las aspas o la firmeza de la caja para asegurar la estabilidad física del molino.' },
  ]},
  { area: '4. ARTE (A)', desc: 'Creatividad, identidad rural, sensibilidad estética y personalización del prototipo.', items: [
    { key: 'A-AF', dim: 'Afectiva (AF)', ind: 'Expresa orgullo y satisfacción al decorar la maqueta con elementos visuales característicos de su finca o vereda.' },
    { key: 'A-CG', dim: 'Cognitiva (CG)', ind: 'Propone soluciones creativas para integrar estéticamente los componentes del sistema dentro del escenario de la maqueta.' },
    { key: 'A-CD', dim: 'Conductual (CD)', ind: 'Aplica color, textura y formas artesanales utilizando materiales del entorno para dar un acabado único a su invento.' },
  ]},
  { area: '5. MATEMÁTICAS (M)', desc: 'Medición, proporciones, geometría de las aspas y estimación de magnitudes.', items: [
    { key: 'M-AF', dim: 'Afectiva (AF)', ind: 'Disfruta medir, trazar y comparar formas geométricas para construir las piezas del molino.' },
    { key: 'M-CG', dim: 'Cognitiva (CG)', ind: 'Razona sobre la relación de proporcionalidad entre la simetría de las aspas y el equilibrio del giro.' },
    { key: 'M-CD', dim: 'Conductual (CD)', ind: 'Mide, cuenta y recorta con precisión igual número de paletas y ángulos para garantizar la simetría del eje.' },
  ]},
]

export function ProfesorHome() {
  const [curso, setCurso] = useState('3A')
  const [cursos, setCursos] = useState<string[]>(['3A', '4B'])
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])
  const [nombre, setNombre] = useState('')
  const [nuevoCurso, setNuevoCurso] = useState('')
  const [seleccionado, setSeleccionado] = useState<Estudiante | null>(null)
  const [emocionInicio, setEmocionInicio] = useState<string>()
  const [emocionFin, setEmocionFin] = useState<string>()
  const [actividad, setActividad] = useState<string>('origami-conejo')
  const [pasoHasta, setPasoHasta] = useState<number>(0)
  const [criterios, setCriterios] = useState<Record<string, number>>({})
  const [rubricaOpen, setRubricaOpen] = useState(false)
  const [historial, setHistorial] = useState<any[]>([])
  const [historialEval, setHistorialEval] = useState<any[]>([])
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const criteriosInicialRef = React.useRef(true)

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
    } catch { setEstudiantes([]) }
  }

  useEffect(() => { cargar() }, [curso])

  useEffect(() => {
    const onPop = () => {
      if (rubricaOpen) setRubricaOpen(false)
      else if (seleccionado) setSeleccionado(null)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [rubricaOpen, seleccionado])

  const pushState = (view: string) => {
    try { history.pushState({ view }, '', `#${view}`) } catch {}
  }

  const agregar = async () => {
    if (!nombre.trim()) return
    const tempId = crypto.randomUUID()
    let profesorId: string | null = null
    try { const { data: { user } } = await (supabase.auth as any).getUser(); profesorId = user?.id || null } catch {}
    if (!profesorId) { try { const raw = localStorage.getItem('sb-phutywmnrwradaxzczwl-auth-token'); if (raw) profesorId = JSON.parse(raw)?.user?.id || null } catch {} }
    const nuevo: any = { id: tempId, nombre: nombre.trim(), curso, profesor_id: profesorId, created_at: new Date().toISOString() }
    setEstudiantes((p) => [...p, nuevo as Estudiante])
    setNombre('')
    try { await db.estudiantes.put(nuevo); await db.estudiantesPendientes.put(nuevo) } catch {}
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
    setCursos([...cursos, nuevoCurso]); setCurso(nuevoCurso); setNuevoCurso('')
  }

  const EMOJI_MAP: Record<string, string> = { feliz: '😄', contento: '🙂', neutro: '😐', triste: '😔', enfado: '😠' }

  useEffect(() => {
    if (criteriosInicialRef.current) {
      criteriosInicialRef.current = false
      return
    }
    if (!seleccionado || actividad !== 'molino-casa' || Object.keys(criterios).length === 0) return
    const fechaDia = new Date().toISOString().split('T')[0]
    const ev: any = {
      id: `${seleccionado.id}-${fechaDia}-molino`,
      estudiante_id: seleccionado.id,
      actividad_id: 'molino-casa',
      fecha: fechaDia,
      criterios,
      observacion: null,
      created_at: new Date().toISOString(),
    }
    db.evaluaciones.put(ev).catch(() => {})
    db.evaluacionesPendientes.put(ev).catch(() => {})
    if (navigator.onLine) {
      ;(supabase.from as any)('evaluaciones').upsert(ev).then(({ error }: any) => {
        if (!error) db.evaluacionesPendientes.delete(ev.id).catch(() => {})
      }).catch(() => {})
    }
  }, [criterios])

  const totalPasos = ACTIVIDADES.find((a) => a.id === actividad)?.pasos || 11

  const cargarHistorial = async (estudianteId: string) => {
    try {
      const { data } = await (supabase.from as any)('progresos').select('*').eq('estudiante_id', estudianteId).order('fecha', { ascending: false })
      if (data && data.length > 0) setHistorial(data)
      else {
        const localAll = await db.progresos.where('estudiante_id').equals(estudianteId).toArray()
        setHistorial([...localAll].reverse())
      }
    } catch {
      const localAll = await db.progresos.where('estudiante_id').equals(estudianteId).toArray().catch(() => [])
      setHistorial([...localAll].reverse())
    }
    try {
      const { data } = await (supabase.from as any)('evaluaciones').select('*').eq('estudiante_id', estudianteId).order('fecha', { ascending: false })
      if (data && data.length > 0) setHistorialEval(data)
      else {
        const localE = await db.evaluaciones.where('estudiante_id').equals(estudianteId).toArray().catch(() => [])
        setHistorialEval([...localE].reverse())
      }
    } catch {
      try { const localE = await db.evaluaciones.where('estudiante_id').equals(estudianteId).toArray(); setHistorialEval([...localE].reverse()) } catch { setHistorialEval([]) }
    }
  }

  const abrirEstudiante = async (e: Estudiante) => {
    criteriosInicialRef.current = true
    setSeleccionado(e); setEmocionInicio(undefined); setEmocionFin(undefined); setPasoHasta(0); setCriterios({}); setMensaje(''); setHistorial([]); setHistorialEval([]); setActividad('origami-conejo')
    pushState('ficha')
    try {
      const { data } = await (supabase.from as any)('progresos').select('*').eq('estudiante_id', e.id).order('fecha', { ascending: false }).limit(1).single()
      if (data) {
        setEmocionInicio(data.emocion_inicio || undefined); setEmocionFin(data.emocion_fin || undefined)
        setPasoHasta(data.pasos_completados?.length || 0)
        setActividad(data.actividad_id || 'origami-conejo')
      } else {
        const local = await db.progresos.where('estudiante_id').equals(e.id).toArray()
        if (local.length > 0) {
          const ultimo = local[local.length - 1] as any
          setEmocionInicio(ultimo.emocion_inicio || undefined); setEmocionFin(ultimo.emocion_fin || undefined)
          setPasoHasta(ultimo.pasos_completados?.length || 0)
          setActividad(ultimo.actividad_id || 'origami-conejo')
        }
      }
    } catch {}
    try {
      const { data } = await (supabase.from as any)('evaluaciones').select('*').eq('estudiante_id', e.id).order('fecha', { ascending: false }).limit(1).single()
      if (data?.criterios) setCriterios(data.criterios)
      else {
        const localE = await db.evaluaciones.where('estudiante_id').equals(e.id).toArray()
        if (localE.length > 0) setCriterios((localE[localE.length - 1] as any).criterios || {})
      }
    } catch {}
    setTimeout(() => { criteriosInicialRef.current = false }, 300)
    cargarHistorial(e.id)
  }

  const guardarProgreso = async () => {
    if (!seleccionado) return
    if (!emocionInicio && pasoHasta === 0) { setMensaje('Elige emoción de entrada o hasta qué paso llegó'); return }
    setGuardando(true)
    const pasosArr = pasoHasta > 0 ? Array.from({ length: pasoHasta }, (_, i) => i + 1) : []
    const progreso: any = {
      id: crypto.randomUUID(), estudiante_id: seleccionado.id, actividad_id: actividad,
      estado: pasoHasta === totalPasos ? 'completado' : pasoHasta > 0 ? 'en_progreso' : 'pendiente',
      pasos_completados: pasosArr, emocion_inicio: emocionInicio || '', emocion_fin: emocionFin || null, fecha: new Date().toISOString(),
    }
    const fechaDia = new Date().toISOString().split('T')[0]
    try {
      await db.open().catch(() => {})
      await guardarProgresoLocal(progreso)
      if (navigator.onLine) {
        const { error } = await (supabase.from as any)('progresos').insert(progreso)
        if (error) throw error
      }
      if (actividad === 'molino-casa' && Object.keys(criterios).length > 0) {
        const ev: any = { id: crypto.randomUUID(), estudiante_id: seleccionado.id, actividad_id: actividad, fecha: fechaDia, criterios, observacion: null, created_at: new Date().toISOString() }
        await guardarEvaluacionLocal(ev)
        if (navigator.onLine) {
          const { error } = await (supabase.from as any)('evaluaciones').insert(ev)
          if (error) throw error
          else await db.evaluacionesPendientes.delete(ev.id).catch(() => {})
        }
        setHistorialEval((p) => [ev, ...p])
      }
      setMensaje('✓ Guardado local (se sincronizará)')
      setHistorial((prev) => [progreso, ...prev])
    } catch {
      setMensaje('✓ Guardado local (se sincronizará)')
    }
    setGuardando(false)
    setTimeout(() => setMensaje(''), 2500)
  }

  const abrirHistorial = async (h: any) => {
    criteriosInicialRef.current = true
    setActividad(h.actividad_id || 'origami-conejo')
    setPasoHasta(h.pasos_completados?.length || 0)
    setEmocionInicio(h.emocion_inicio || undefined)
    setEmocionFin(h.emocion_fin || undefined)
    if (h.actividad_id === 'molino-casa') {
      try {
        const { data } = await (supabase.from as any)('evaluaciones').select('*').eq('estudiante_id', h.estudiante_id).eq('fecha', h.fecha.split('T')[0]).limit(1).single()
        if (data?.criterios) setCriterios(data.criterios)
        else {
          const localE = await db.evaluaciones.where('estudiante_id').equals(h.estudiante_id).toArray()
          const found = localE.find((e: any) => e.fecha === h.fecha.split('T')[0])
          if (found) setCriterios((found as any).criterios || {})
          else setCriterios({})
        }
      } catch { setCriterios({}) }
    } else setCriterios({})
    setTimeout(() => { criteriosInicialRef.current = false }, 300)
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
          <button key={c} onClick={() => setCurso(c)} aria-pressed={curso === c} aria-label={`Curso ${c}`} className={`px-4 py-2 rounded-full text-[13px] font-bold border transition focus-visible:ring-2 focus-visible:ring-terracota ${curso === c ? 'bg-slateProfesor text-white border-slateProfesor shadow-paper' : 'bg-white text-ink/70 border-[#E8E0D0] hover:border-slateProfesor/30'}`}>{c}</button>
        ))}
        <span className="flex gap-1.5 bg-white border border-[#E8E0D0] rounded-full p-1">
          <input value={nuevoCurso} onChange={(e) => setNuevoCurso(e.target.value)} placeholder="Nuevo curso" className="bg-transparent px-3 text-[13px] w-28 outline-none placeholder:text-ink/30" />
          <button onClick={crearCurso} className="bg-ink text-white rounded-full px-3 text-[12px] font-bold">+ Curso</button>
        </span>
      </div>

      <div className="bg-white rounded-paper border border-[#E8E0D0] shadow-paper p-5 mb-6 paper-texture">
        <h3 className="font-display font-bold text-ink mb-1">Agregar estudiante</h3>
        <p className="text-[12px] text-ink/50 mb-3">Solo nombre y curso — el registro se hace al seleccionar.</p>
        <div className="flex gap-2">
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Ana María" className="flex-1 bg-paper border border-[#E8E0D0] rounded-full px-4 py-2.5 text-[14px] outline-none focus:border-paramo/30 focus:bg-white" />
          <button onClick={agregar} className="bg-paramo text-white px-6 rounded-full font-bold text-[13px] tracking-wide hover:bg-[#1e3a0f] transition">Agregar</button>
        </div>
      </div>

      <div className="grid gap-3">
        {estudiantes.map((e) => (
          <button key={e.id} onClick={() => abrirEstudiante(e)} className="group w-full text-left bg-white rounded-2xl border border-[#E8E0D0] p-4 flex items-center gap-4 hover:shadow-paper hover:-translate-y-0.5 transition-all focus-visible:ring-2 focus-visible:ring-terracota text-ink" aria-label={`Ver detalle de ${e.nombre}`}>
            <div className="w-10 h-10 rounded-full bg-mist border border-moss/20 flex items-center justify-center font-display font-bold text-paramo">{e.nombre.charAt(0).toUpperCase()}</div>
            <div className="flex-1"><p className="font-semibold text-[14px] leading-none">{e.nombre}</p><p className="text-[11px] font-bold tracking-widest uppercase text-moss">{e.curso}</p></div>
            <span className="text-[11px] font-semibold text-ink/30 group-hover:text-ink/60">Registrar →</span>
          </button>
        ))}
        {estudiantes.length === 0 && (
          <div className="bg-white rounded-paper border border-dashed border-[#E8E0D0] p-10 text-center">
            <p className="text-2xl mb-2">📋</p><p className="font-display font-bold text-ink">Sin estudiantes en {curso}</p><p className="text-[13px] text-ink/50">Agrega el primer nombre arriba.</p>
          </div>
        )}
      </div>

      {seleccionado && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => { setSeleccionado(null); history.back() }} aria-hidden="true" />
          <div className="relative bg-paper rounded-paper border border-[#E8E0D0] shadow-lift w-full max-w-lg max-h-[90vh] overflow-auto paper-texture">
            <div className="sticky top-0 bg-white border-b border-[#E8E0D0] p-4 flex items-center justify-between">
              <div><p className="font-display font-bold text-ink">{seleccionado.nombre}</p><p className="text-[11px] font-bold tracking-widest uppercase text-moss">{seleccionado.curso}</p></div>
              <button onClick={() => { setSeleccionado(null); try{history.back()}catch{} }} className="w-8 h-8 rounded-full bg-white border border-[#E8E0D0] flex items-center justify-center hover:bg-mist" aria-label="Cerrar">×</button>
            </div>
            <div className="p-5 space-y-6">
              <div><h4 className="font-display font-bold text-ink mb-2">¿Cómo se siente al entrar?</h4><EmotionPicker value={emocionInicio} onSelect={setEmocionInicio} /></div>
              <div><h4 className="font-display font-bold text-ink mb-2">¿Cómo se siente al finalizar?</h4><EmotionPicker value={emocionFin} onSelect={setEmocionFin} /></div>

              <div>
                <h4 className="font-display font-bold text-ink mb-2">Actividades</h4>
                <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-1 px-1">
                  {ACTIVIDADES.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => setActividad(a.id)}
                      className={`min-w-[220px] w-[220px] snap-start text-left bg-white rounded-2xl border-2 p-4 flex flex-col gap-2 transition ${actividad === a.id ? 'border-terracota shadow-paper bg-mist/30' : 'border-[#E8E0D0] hover:border-terracota/30'}`}
                    >
                      <span className="text-[11px] font-bold tracking-widest uppercase text-terracota">{a.id === 'origami-conejo' ? 'Actividad 1' : 'Actividad 2'}</span>
                      <span className="font-display font-bold text-ink text-[15px] leading-tight">{a.label}</span>
                      <span className="text-[11px] text-ink/60">{a.pasos} pasos · {a.id === 'molino-casa' ? 'Video + Rúbrica' : 'Papel'}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[#E8E0D0] p-4">
                <h4 className="font-display font-bold text-ink mb-3">{ACTIVIDADES.find((a) => a.id === actividad)?.label} — ¿Hasta qué paso llegó?</h4>
                <select value={pasoHasta} onChange={(e) => setPasoHasta(Number(e.target.value))} className="w-full bg-paper border border-[#E8E0D0] rounded-full px-4 py-3 text-[14px] font-medium focus:border-paramo/30 focus:bg-white outline-none">
                  <option value={0}>0 — Sin avance</option>
                  {Array.from({ length: totalPasos }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>{n} / {totalPasos} {n === totalPasos ? '— Completado' : ''}</option>
                  ))}
                </select>
                <p className="text-[11px] text-ink/50 mt-2">{pasoHasta}/{totalPasos} pasos</p>
                {actividad === 'molino-casa' && (
                  <button onClick={() => { setRubricaOpen(true); pushState('rubrica') }} className="w-full mt-4 bg-white border-2 border-terracota text-terracota rounded-full py-3 font-bold hover:bg-terracota hover:text-white transition">
                    Evaluar rúbrica STEAM (15 ítems) →
                  </button>
                )}
              </div>

              {mensaje && <p className="text-center text-[13px] font-medium text-moss bg-mist border border-moss/20 rounded-xl px-3 py-2">{mensaje}</p>}
              <button onClick={guardarProgreso} disabled={guardando} className="w-full bg-paramo text-white rounded-full py-3 font-bold hover:bg-[#1e3a0f] disabled:opacity-50">
                {guardando ? 'Guardando...' : 'Guardar registro'}
              </button>

              {(historial.length > 0 || historialEval.length > 0) && (
                <div className="border-t border-[#E8E0D0] pt-4">
                  <h4 className="font-display font-bold text-ink mb-3">Historial por día</h4>
                  <div className="space-y-3 max-h-64 overflow-auto pr-1">
                    {(() => {
                      const mapa = new Map<string, any>()
                      const todos = [...historial, ...historialEval]
                      todos.forEach((h: any) => {
                        const d = new Date(h.fecha || h.created_at)
                        const key = `${d.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}|${h.actividad_id || 'progreso'}`
                        if (!mapa.has(key) || new Date(h.fecha || h.created_at) > new Date(mapa.get(key).fecha || mapa.get(key).created_at)) mapa.set(key, h)
                      })
                      const porDia = new Map<string, any[]>()
                      Array.from(mapa.values()).forEach((h: any) => {
                        const k = new Date(h.fecha || h.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })
                        if (!porDia.has(k)) porDia.set(k, [])
                        porDia.get(k)!.push(h)
                      })
                      return Array.from(porDia.entries()).map(([fecha, items]: any) => (
                        <div key={fecha} className="bg-white rounded-xl border border-[#E8E0D0] p-3">
                          <p className="text-[12px] font-bold tracking-wide text-ink capitalize">{fecha}</p>
                          {items.map((it: any) => {
                            const esEval = !!it.criterios
                            const hechos = it.pasos_completados?.length || 0
                            const totalIt = ACTIVIDADES.find((a) => a.id === it.actividad_id)?.pasos || totalPasos
                            const estado = esEval ? `${Object.keys(it.criterios || {}).length}/15 criterios` : hechos === totalIt ? `Terminó ${it.actividad_id}` : hechos === 0 ? 'Sin avance' : `Quedó en paso ${hechos}/${totalIt}`
                            return (
                              <button key={it.id} onClick={() => abrirHistorial(it)} className="w-full text-left flex items-center gap-2 text-[13px] py-2 border-b last:border-0 border-[#E8E0D0]/50 hover:bg-paper/50 rounded-lg px-1">
                                <span className="text-[11px] font-bold tracking-widest uppercase px-2 py-1 rounded-full bg-ink text-white">{it.actividad_id === 'molino-casa' ? 'Molino' : 'Origami'}</span>
                                {!esEval && <><span className="text-lg leading-none">{EMOJI_MAP[it.emocion_inicio] || '—'}</span><span className="text-ink/30">→</span><span className="text-lg leading-none">{EMOJI_MAP[it.emocion_fin] || '—'}</span></>}
                                {esEval && <span className="text-[11px] bg-terracota text-white px-2 py-1 rounded-full">Rúbrica</span>}
                                <span className="ml-auto text-[11px] font-medium text-ink/60 bg-paper border border-[#E8E0D0] px-2 py-1 rounded-full">{estado}</span>
                              </button>
                            )
                          })}
                        </div>
                      ))
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {rubricaOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={() => setRubricaOpen(false)} />
          <div className="relative bg-paper rounded-paper border border-[#E8E0D0] shadow-lift w-[min(860px,95vw)] max-h-[85vh] overflow-auto paper-texture flex flex-col">
            <div className="sticky top-0 bg-white border-b border-[#E8E0D0] p-4 flex items-center justify-between">
              <div><p className="font-display font-bold text-ink">Rúbrica STEAM — Molino (1 a 4)</p><p className="text-[11px] text-ink/50">1 En inicio · 2 En desarrollo · 3 Competente · 4 Destacado</p></div>
              <button onClick={() => setRubricaOpen(false)} className="px-4 py-2 rounded-full bg-white border border-[#E8E0D0] text-[13px] font-semibold hover:bg-mist" aria-label="Volver">← Volver</button>
            </div>
            <div className="p-4 overflow-auto">
              <div className="overflow-x-auto">
                <table className="w-full text-[12px] border-collapse">
                  <thead>
                    <tr className="bg-ink text-white">
                      <th className="p-2 text-left rounded-tl-xl">Área / Dimensión</th>
                      <th className="p-2 text-left">Indicador observable</th>
                      <th className="p-2 text-center w-12">1</th><th className="p-2 text-center w-12">2</th><th className="p-2 text-center w-12">3</th><th className="p-2 text-center w-12 rounded-tr-xl">4</th>
                      <th className="p-2 text-center w-16">Prom.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {RUBRICA.map((area) => {
                      const prom = (() => {
                        const vals = area.items.map((it) => criterios[it.key]).filter((v) => v != null)
                        return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : '—'
                      })()
                      return (
                        <React.Fragment key={area.area}>
                          <tr className="bg-mist/50"><td colSpan={6} className="p-2 font-bold text-ink text-[13px]">{area.area}</td><td className="p-2 text-center font-bold text-ink">{prom}</td></tr>
                          <tr><td colSpan={7} className="p-1 text-[11px] text-ink/60 bg-paper/50">{area.desc}</td></tr>
                          {area.items.map((it) => (
                            <tr key={it.key} className="border-b border-[#E8E0D0]/50 hover:bg-white">
                              <td className="p-2 font-semibold text-ink whitespace-nowrap">{it.dim}</td>
                              <td className="p-2 text-ink/80 leading-relaxed">{it.ind}</td>
                              {[1,2,3,4].map((n) => (
                                <td key={n} className="p-2 text-center">
                                  <input type="radio" name={it.key} checked={criterios[it.key]===n} onChange={() => setCriterios((p)=>({...p, [it.key]:n}))} className="w-4 h-4 accent-paramo" aria-label={`${it.key} ${n}`} />
                                </td>
                              ))}
                              <td className="p-2 text-center font-bold text-paramo">{criterios[it.key] || '—'}</td>
                            </tr>
                          ))}
                        </React.Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <p className="text-[11px] text-ink/50 mt-3">Promedio general molino: {(() => { const v = Object.values(criterios) as number[]; return v.length ? (v.reduce((a,b)=>a+b,0)/v.length).toFixed(1) : '—' })()} / 4</p>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
