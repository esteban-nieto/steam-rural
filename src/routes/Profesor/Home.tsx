// @ts-nocheck
import * as React from 'react'
import { useState, useEffect } from 'react'
import { supabase } from '../../services/supabase'
import type { Estudiante } from '../../services/supabase'
import { Layout } from '../../components/Layout'
import { EmotionPicker } from '../../components/EmotionPicker'
import { db, guardarProgresoLocal, guardarEvaluacionLocal, generarEvaluacionId } from '../../services/db'

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
  const [observaciones, setObservaciones] = useState<Record<string, string>>({})
  const [rubricaOpen, setRubricaOpen] = useState(false)
  const [historial, setHistorial] = useState<any[]>([])
  const [historialEval, setHistorialEval] = useState<any[]>([])
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [mensajeRubrica, setMensajeRubrica] = useState('')
  const [diaDetalle, setDiaDetalle] = useState<{ fecha: string; items: any[] } | null>(null)
  const [diaRubrica, setDiaRubrica] = useState<any | null>(null)
  const [tipoRubrica, setTipoRubrica] = useState<'pre' | 'post'>('pre')
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

  const totalPasos = ACTIVIDADES.find((a) => a.id === actividad)?.pasos || 11

  const guardarRubricaDirecto = async (
    tipo: 'pre' | 'post',
    crit: Record<string, number>,
    obs: Record<string, string>
  ) => {
    if (!seleccionado) return
    const fechaDia = new Date().toISOString().split('T')[0]
    const actId = tipo === 'post' ? 'molino-casa-post' : 'molino-casa'
    const evId = generarEvaluacionId(seleccionado.id, fechaDia, actId)
    const evForSupabase: any = {
      id: evId,
      estudiante_id: seleccionado.id,
      actividad_id: actId,
      fecha: fechaDia,
      criterios: crit,
      observacion: JSON.stringify(obs),
      created_at: new Date().toISOString(),
    }
    const evLocal: any = { ...evForSupabase, observaciones: obs }
    await db.evaluaciones.put(evLocal).catch(() => {})
    await db.evaluacionesPendientes.put(evLocal).catch(() => {})

    if (navigator.onLine) {
      try {
        const { error } = await (supabase.from as any)('evaluaciones').upsert({
          id: evForSupabase.id,
          estudiante_id: evForSupabase.estudiante_id,
          actividad_id: evForSupabase.actividad_id,
          fecha: evForSupabase.fecha,
          criterios: evForSupabase.criterios,
          observacion: evForSupabase.observacion,
        })
        if (!error) {
          await db.evaluacionesPendientes.delete(evId).catch(() => {})
          setMensajeRubrica('✓ Rúbrica guardada en la nube')
        } else {
          console.error('Error guardando en Supabase:', error)
          setMensajeRubrica('✓ Guardado local (pendiente sincronizar)')
        }
      } catch (err) {
        console.error('Excepción guardando en Supabase:', err)
        setMensajeRubrica('✓ Guardado local (pendiente sincronizar)')
      }
    } else {
      setMensajeRubrica('✓ Guardado local (sin conexión)')
    }

    setHistorialEval((p) => {
      const filtrado = p.filter((x: any) => x.id !== evId)
      return [evLocal, ...filtrado]
    })
    setTimeout(() => setMensajeRubrica(''), 3000)
  }

  const actualizarCriterio = (key: string, val: number) => {
    const nuevos = { ...criterios, [key]: val }
    setCriterios(nuevos)
    guardarRubricaDirecto(tipoRubrica, nuevos, observaciones)
  }

  const actualizarObservacion = (areaKey: string, val: string) => {
    const nuevas = { ...observaciones, [areaKey]: val }
    setObservaciones(nuevas)
    guardarRubricaDirecto(tipoRubrica, criterios, nuevas)
  }

  const cargarRubricaPorTipo = async (tipo: 'pre' | 'post') => {
    if (!seleccionado) return
    const actId = tipo === 'post' ? 'molino-casa-post' : 'molino-casa'
    let found: any = null

    found = historialEval.find((e: any) => e.actividad_id === actId)

    if (!found) {
      try {
        const localAll = await db.evaluaciones.where('estudiante_id').equals(seleccionado.id).toArray()
        found = localAll.filter((e: any) => e.actividad_id === actId).pop()
      } catch {}
    }

    if (!found && navigator.onLine) {
      try {
        const { data } = await (supabase.from as any)('evaluaciones')
          .select('*')
          .eq('estudiante_id', seleccionado.id)
          .eq('actividad_id', actId)
          .order('fecha', { ascending: false })
          .limit(1)
          .single()
        if (data) {
          found = data
          await db.evaluaciones.put(data).catch(() => {})
        }
      } catch {}
    }

    if (found) {
      setCriterios(found.criterios || {})
      let obs = found.observaciones || found.observacion || {}
      if (typeof obs === 'string') {
        try { obs = JSON.parse(obs) } catch { obs = {} }
      }
      setObservaciones(obs || {})
    } else {
      setCriterios({})
      setObservaciones({})
    }
  }

  const abrirRubrica = async (tipo: 'pre' | 'post') => {
    setTipoRubrica(tipo)
    setRubricaOpen(true)
    pushState('rubrica')
    await cargarRubricaPorTipo(tipo)
  }

  const cambiarTipoRubrica = async (nuevoTipo: 'pre' | 'post') => {
    if (nuevoTipo === tipoRubrica) return
    setTipoRubrica(nuevoTipo)
    await cargarRubricaPorTipo(nuevoTipo)
  }

  const exportarRubricaCSV = (
    tipoLabel: string,
    criteriosMap: Record<string, number>,
    obsMap: Record<string, string> | string,
    fechaDoc: string
  ) => {
    let parsedObs: Record<string, string> = {}
    if (typeof obsMap === 'string') {
      try { parsedObs = obsMap ? JSON.parse(obsMap) : {} } catch { parsedObs = {} }
    } else {
      parsedObs = obsMap || {}
    }
    const esc = (v: unknown) =>
      String(v ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
    const NIVELES: Record<number, string> = {
      1: 'En inicio',
      2: 'En desarrollo',
      3: 'Competente',
      4: 'Destacado',
    }
    const estNombre = seleccionado?.nombre || 'Estudiante'
    const estCurso = seleccionado?.curso || curso
    const todos = Object.values(criteriosMap || {}).filter((v) => v != null && v !== '') as number[]
    const promGeneral = todos.length ? (todos.reduce((a, b) => a + Number(b), 0) / todos.length).toFixed(1) : '—'
    const isPost = tipoLabel === 'POST'
    const accent = isPost ? '#2D5016' : '#C47A3C'
    const accentSoft = isPost ? '#E8F0E8' : '#F8EDE3'
    const fechaTxt = fechaDoc
      ? new Date(`${fechaDoc}T12:00:00`).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })
      : fechaDoc

    const areasHtml = RUBRICA.map((area) => {
      const areaKey = area.area.split('(')[1]?.replace(')', '') || area.area
      const obsArea = parsedObs[areaKey] || ''
      const vals = area.items.map((it) => criteriosMap?.[it.key]).filter((v) => v != null && v !== '') as number[]
      const promArea = vals.length ? (vals.reduce((a, b) => a + Number(b), 0) / vals.length).toFixed(1) : '—'
      const itemsHtml = area.items.map((it) => {
        const n = criteriosMap?.[it.key]
        const scores = [1, 2, 3, 4].map((lvl) => {
          const on = n === lvl
          return `<td class="n ${on ? 'on' : ''}">${on ? lvl : ''}</td>`
        }).join('')
        return `<tr>
          <td class="dim">${esc(it.dim)}</td>
          <td class="ind">${esc(it.ind)}</td>
          ${scores}
          <td class="item-score">${n ? n : '—'}</td>
        </tr>`
      }).join('')
      const obsHtml = obsArea
        ? `<tr class="obs"><td colspan="7"><strong>Observación ${esc(areaKey)}:</strong> ${esc(obsArea)}</td></tr>`
        : `<tr class="obs empty"><td colspan="7"><strong>Observación ${esc(areaKey)}:</strong> —</td></tr>`
      return `<tr class="area"><td colspan="6">${esc(area.area)}</td><td class="prom">${esc(promArea)}</td></tr>
        <tr class="desc"><td colspan="7">${esc(area.desc)}</td></tr>
        ${itemsHtml}
        ${obsHtml}`
    }).join('')

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Rúbrica STEAM Molino — ${esc(tipoLabel)} — ${esc(estNombre)}</title>
<style>
  :root { --accent:${accent}; --soft:${accentSoft}; --ink:#1A2E1A; --paper:#FDF8F0; --line:#E4D9C8; }
  * { box-sizing:border-box; }
  body { margin:0; background:#EFE6D6; color:var(--ink); font-family:Calibri,"Segoe UI",Inter,sans-serif; }
  .page { max-width:980px; margin:24px auto; background:var(--paper); border:1px solid var(--line); border-radius:16px; overflow:hidden; box-shadow:0 10px 28px rgba(26,46,26,.08); }
  header { background:var(--accent); color:#fff; padding:22px 24px 18px; }
  header h1 { margin:0 0 4px; font-size:22px; letter-spacing:.02em; }
  header p { margin:0; opacity:.9; font-size:13px; }
  .badge { display:inline-block; background:#fff; color:var(--accent); font-weight:700; font-size:11px; letter-spacing:.12em; padding:3px 10px; border-radius:999px; margin-left:8px; vertical-align:middle; }
  .meta { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; padding:16px 24px; background:#fff; border-bottom:1px solid var(--line); }
  .meta div { background:var(--soft); border:1px solid var(--line); border-radius:10px; padding:10px 12px; }
  .meta span { display:block; font-size:10px; font-weight:700; letter-spacing:.12em; text-transform:uppercase; opacity:.65; }
  .meta strong { display:block; margin-top:3px; font-size:15px; }
  .scale { padding:10px 24px 0; font-size:12px; opacity:.75; }
  table { width:calc(100% - 48px); margin:12px 24px 24px; border-collapse:collapse; background:#fff; }
  th { background:var(--ink); color:#fff; font-size:11px; letter-spacing:.06em; text-transform:uppercase; text-align:left; padding:9px 8px; }
  th.n, td.n, td.prom, td.item-score { text-align:center; width:42px; }
  td { border-bottom:1px solid var(--line); padding:8px; font-size:13px; vertical-align:top; }
  tr.area td { background:var(--soft); font-weight:700; font-size:14px; border-bottom:none; }
  tr.desc td { background:var(--soft); font-size:12px; color:#4a5c4a; padding-top:0; padding-bottom:10px; }
  td.dim { white-space:nowrap; font-weight:700; width:150px; }
  td.ind { line-height:1.4; color:#2b3a2b; }
  td.n { font-weight:700; color:#c5b9a6; }
  td.n.on { background:var(--accent); color:#fff; border-radius:4px; }
  td.item-score { font-weight:700; color:var(--accent); }
  tr.obs td { background:#fff8ee; font-size:12px; line-height:1.45; }
  tr.obs.empty td { color:#8a8073; background:#faf7f1; }
  footer { padding:0 24px 20px; font-size:12px; opacity:.7; }
  @media print {
    body { background:#fff; }
    .page { margin:0; border:none; border-radius:0; box-shadow:none; }
  }
  @media (max-width:720px) {
    .meta { grid-template-columns:1fr 1fr; }
    table { width:calc(100% - 24px); margin:12px; }
  }
</style>
</head>
<body>
  <div class="page">
    <header>
      <h1>Rúbrica STEAM — Molino + Casa <span class="badge">${esc(tipoLabel)}</span></h1>
      <p>1 En inicio · 2 En desarrollo · 3 Competente · 4 Destacado</p>
    </header>
    <section class="meta">
      <div><span>Estudiante</span><strong>${esc(estNombre)}</strong></div>
      <div><span>Curso</span><strong>${esc(estCurso)}</strong></div>
      <div><span>Fecha</span><strong>${esc(fechaTxt)}</strong></div>
      <div><span>Promedio general</span><strong>${esc(promGeneral)} / 4</strong></div>
    </section>
    <p class="scale">El recuadro sombreado indica el nivel alcanzado en cada indicador.</p>
    <table>
      <thead>
        <tr>
          <th>Área / Dimensión</th>
          <th>Indicador observable</th>
          <th class="n">1</th><th class="n">2</th><th class="n">3</th><th class="n">4</th>
          <th class="n">Prom.</th>
        </tr>
      </thead>
      <tbody>
        ${areasHtml}
      </tbody>
    </table>
    <footer>Exportado desde el panel del profesor · Niveles: ${Object.entries(NIVELES).map(([k, v]) => `${k} ${v}`).join(' · ')}</footer>
  </div>
</body>
</html>`

    const filename = `rubrica_molino_${tipoLabel}_${String(estNombre).replace(/\s+/g, '_')}_${fechaDoc || 'sin_fecha'}.html`
    const blob = new Blob(['\uFEFF', html], { type: 'application/octet-stream' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.rel = 'noopener'
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    setTimeout(() => {
      a.remove()
      URL.revokeObjectURL(url)
    }, 2000)
  }

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
      const localE = await db.evaluaciones.where('estudiante_id').equals(estudianteId).toArray().catch(() => [])
      let combined = [...localE]
      if (navigator.onLine) {
        const { data } = await (supabase.from as any)('evaluaciones').select('*').eq('estudiante_id', estudianteId).order('fecha', { ascending: false })
        if (data && data.length > 0) {
          const map = new Map<string, any>()
          localE.forEach((e: any) => map.set(e.id, e))
          data.forEach((e: any) => map.set(e.id, e))
          combined = Array.from(map.values())
          for (const ev of data) await db.evaluaciones.put(ev).catch(() => {})
        }
      }
      setHistorialEval(combined.reverse())
    } catch {
      try { const localE = await db.evaluaciones.where('estudiante_id').equals(estudianteId).toArray(); setHistorialEval([...localE].reverse()) } catch { setHistorialEval([]) }
    }
  }

  const abrirEstudiante = async (e: Estudiante) => {
    setSeleccionado(e); setEmocionInicio(undefined); setEmocionFin(undefined); setPasoHasta(0); setCriterios({}); setObservaciones({}); setMensaje(''); setHistorial([]); setHistorialEval([]); setActividad('origami-conejo')
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
      if (actividad === 'molino-casa' && (Object.keys(criterios).length > 0 || Object.keys(observaciones).length > 0)) {
        const actIdSave = tipoRubrica === 'post' ? 'molino-casa-post' : 'molino-casa'
        const evIdSave = generarEvaluacionId(seleccionado.id, fechaDia, actIdSave)
        const evForSupabase: any = {
          id: evIdSave,
          estudiante_id: seleccionado.id,
          actividad_id: actIdSave,
          fecha: fechaDia,
          criterios,
          observacion: JSON.stringify(observaciones),
          created_at: new Date().toISOString(),
        }
        const evLocal: any = { ...evForSupabase, observaciones }

        await guardarEvaluacionLocal(evLocal)
        if (navigator.onLine) {
          try {
            const { error } = await (supabase.from as any)('evaluaciones').upsert(evForSupabase)
            if (!error) {
              await db.evaluacionesPendientes.delete(evIdSave).catch(() => {})
            } else {
              console.error('Error guardando evaluación en Supabase:', error)
            }
          } catch (err) {
            console.error('Excepción guardando evaluación:', err)
          }
        }
        setHistorialEval((p) => {
          const filtrado = p.filter((x: any) => x.id !== evIdSave)
          return [evLocal, ...filtrado]
        })
      }
      setMensaje(navigator.onLine ? '✓ Registro guardado correctamente' : '✓ Guardado local (se sincronizará al conectar)')
      setHistorial((prev) => [progreso, ...prev])
    } catch {
      setMensaje('✓ Guardado local (se sincronizará al conectar)')
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
    if (h.actividad_id === 'molino-casa' || h.actividad_id === 'molino-casa-post' || h.criterios) {
      try {
        const fechaKey = (h.fecha || h.created_at).split('T')[0]
        const { data } = await (supabase.from as any)('evaluaciones').select('*').eq('estudiante_id', h.estudiante_id).eq('fecha', fechaKey).limit(1).single()
        if (data?.criterios) {
          setCriterios(data.criterios)
          try { setObservaciones(data.observaciones ? (typeof data.observaciones === 'string' ? JSON.parse(data.observaciones) : data.observaciones) : data.observacion ? JSON.parse(data.observacion) : {}) } catch { setObservaciones({}) }
        } else {
          const localE = await db.evaluaciones.where('estudiante_id').equals(h.estudiante_id).toArray()
          const found = localE.find((e: any) => e.fecha === fechaKey)
          if (found) {
            setCriterios((found as any).criterios || {})
            const obs = (found as any).observaciones || (found as any).observacion
            try { setObservaciones(obs ? (typeof obs === 'string' ? JSON.parse(obs) : obs) : {}) } catch { setObservaciones({}) }
          } else setCriterios({})
        }
      } catch { setCriterios({}); setObservaciones({}) }
    } else { setCriterios({}); setObservaciones({}) }
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
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => setSeleccionado(null)} aria-hidden="true" />
          <div className="relative bg-paper rounded-paper border border-[#E8E0D0] shadow-lift w-full max-w-lg max-h-[90vh] overflow-auto paper-texture">
            <div className="sticky top-0 bg-white border-b border-[#E8E0D0] p-4 flex items-center justify-between">
              <div><p className="font-display font-bold text-ink">{seleccionado.nombre}</p><p className="text-[11px] font-bold tracking-widest uppercase text-moss">{seleccionado.curso}</p></div>
              <button onClick={() => setSeleccionado(null)} className="w-8 h-8 rounded-full bg-white border border-[#E8E0D0] flex items-center justify-center hover:bg-mist" aria-label="Cerrar">×</button>
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
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <button
                      type="button"
                      onClick={() => abrirRubrica('pre')}
                      className="w-full bg-white border-2 border-terracota text-terracota rounded-full py-2.5 font-bold hover:bg-terracota hover:text-white transition text-[13px] flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-terracota inline-block"></span>
                      Rúbrica PRE
                    </button>
                    <button
                      type="button"
                      onClick={() => abrirRubrica('post')}
                      className="w-full bg-white border-2 border-paramo text-paramo rounded-full py-2.5 font-bold hover:bg-paramo hover:text-white transition text-[13px] flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-paramo inline-block"></span>
                      Rúbrica POST
                    </button>
                  </div>
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
                      const porActividadDia = new Map<string, any>()
                      ;[...historial, ...historialEval].forEach((h: any) => {
                        const d = new Date(h.fecha || h.created_at)
                        const fechaKey = d.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })
                        const isEval = !!h.criterios
                        const key = `${fechaKey}|${isEval ? 'eval' : 'prog'}|${h.actividad_id || 'origami-conejo'}`
                        if (!porActividadDia.has(key) || new Date(h.fecha || h.created_at) > new Date(porActividadDia.get(key).fecha || porActividadDia.get(key).created_at)) {
                          porActividadDia.set(key, h)
                        }
                      })
                      const porDia = new Map<string, any[]>()
                      Array.from(porActividadDia.values()).forEach((h: any) => {
                        const k = new Date(h.fecha || h.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })
                        if (!porDia.has(k)) porDia.set(k, [])
                        porDia.get(k)!.push(h)
                      })
                      return Array.from(porDia.entries())
                        .sort((a,b) => {
                          const da = new Date(a[1][0].fecha || a[1][0].created_at).getTime()
                          const db = new Date(b[1][0].fecha || b[1][0].created_at).getTime()
                          return db - da
                        })
                        .map(([fecha, items]: any) => {
                        const progresosDia = items.filter((x:any)=> !x.criterios)
                        const evalMolinoPre = items.find((x:any)=> x.criterios && x.actividad_id === 'molino-casa')
                        const evalMolinoPost = items.find((x:any)=> x.criterios && x.actividad_id === 'molino-casa-post')
                        return (
                          <button key={fecha} onClick={() => setDiaDetalle({ fecha, items })} className="w-full text-left bg-white rounded-xl border border-[#E8E0D0] p-3 hover:shadow-paper transition text-left">
                            <p className="text-[12px] font-bold tracking-wide text-ink capitalize">{fecha}</p>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {progresosDia.map((it:any) => {
                                const hechos = it.pasos_completados?.length || 0
                                const totalIt = ACTIVIDADES.find((a) => a.id === it.actividad_id)?.pasos || totalPasos
                                return (
                                  <span key={it.id} className="inline-flex items-center gap-1.5 text-[11px] font-medium bg-paper border border-[#E8E0D0] px-2.5 py-1 rounded-full">
                                    <span className="font-bold tracking-widest uppercase bg-ink text-white px-1.5 py-0.5 rounded-full text-[10px]">{it.actividad_id === 'molino-casa-post' ? 'Molino POST' : it.actividad_id === 'molino-casa' ? 'Molino PRE' : 'Origami'}</span>
                                    <span>{EMOJI_MAP[it.emocion_inicio] || '—'}</span>→<span>{EMOJI_MAP[it.emocion_fin] || '—'}</span>
                                    <span className="text-ink/60">{hechos}/{totalIt}</span>
                                  </span>
                                )
                              })}
                              {evalMolinoPre && <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-terracota text-white px-2.5 py-1 rounded-full">PRE {Object.keys(evalMolinoPre.criterios||{}).length}/15</span>}
                              {evalMolinoPost && <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-paramo text-white px-2.5 py-1 rounded-full">POST {Object.keys(evalMolinoPost.criterios||{}).length}/15</span>}
                            </div>
                            <p className="text-[11px] text-terracota font-semibold mt-2">Ver detalle →</p>
                          </button>
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

      {diaDetalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={() => setDiaDetalle(null)} />
          <div className="relative bg-paper rounded-paper border border-[#E8E0D0] shadow-lift w-[min(560px,95vw)] max-h-[85vh] overflow-auto paper-texture flex flex-col">
            <div className="sticky top-0 bg-white border-b border-[#E8E0D0] p-4 flex items-center justify-between">
              <div><p className="font-display font-bold text-ink capitalize">{diaDetalle.fecha}</p><p className="text-[11px] text-ink/50">{diaDetalle.items.length} registro(s) del día</p></div>
              <button onClick={() => setDiaDetalle(null)} className="px-4 py-2 rounded-full bg-white border border-[#E8E0D0] text-[13px] font-semibold hover:bg-mist" aria-label="Volver">← Volver</button>
            </div>
            <div className="p-4 space-y-3 overflow-auto">
              {diaDetalle.items.filter((x:any)=> !x.criterios).map((it: any) => {
                const hechos = it.pasos_completados?.length || 0
                const totalIt = ACTIVIDADES.find((a) => a.id === it.actividad_id)?.pasos || totalPasos
                const label = it.actividad_id === 'origami-conejo' ? 'Origami Conejo' : 'Molino + Casa'
                return (
                  <div key={it.id} className="bg-white rounded-xl border border-[#E8E0D0] p-3">
                    <p className="text-[11px] font-bold tracking-widest uppercase text-white bg-ink px-2 py-1 rounded-full inline-block">{label}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[11px] font-bold tracking-widest uppercase text-ink/50">Inicio</span><span className="text-xl">{EMOJI_MAP[it.emocion_inicio] || '—'}</span>
                      <span className="text-ink/20">→</span>
                      <span className="text-[11px] font-bold tracking-widest uppercase text-ink/50">Fin</span><span className="text-xl">{EMOJI_MAP[it.emocion_fin] || '—'}</span>
                      <span className="ml-auto text-[11px] font-bold bg-paper border border-[#E8E0D0] px-2 py-1 rounded-full">{hechos}/{totalIt} pasos</span>
                    </div>
                    <p className="text-[11px] text-ink/50 mt-2">{hechos === totalIt ? 'Completado' : hechos === 0 ? 'Sin avance' : `Avance ${hechos}/${totalIt}`}</p>
                  </div>
                )
              })}

              {(() => {
                const fechaKey = (diaDetalle.items[0]?.fecha || diaDetalle.items[0]?.created_at || new Date().toISOString()).split('T')[0]
                const evalPre = diaDetalle.items.find((x: any) => x.criterios && x.actividad_id === 'molino-casa')
                const evalPost = diaDetalle.items.find((x: any) => x.criterios && x.actividad_id === 'molino-casa-post')
                const tieneMolino = diaDetalle.items.some((x: any) => x.actividad_id === 'molino-casa' || x.actividad_id === 'molino-casa-post' || x.criterios)
                if (!tieneMolino) return null

                return (
                  <div className="bg-white rounded-xl border border-[#E8E0D0] p-3 space-y-2 mt-2">
                    <p className="text-[11px] font-bold tracking-widest uppercase text-ink">Rúbricas STEAM — Molino + Casa</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <div className="p-3 rounded-xl border border-terracota/30 bg-terracota/5 flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold bg-terracota text-white px-2 py-0.5 rounded-full">PRE</span>
                          <span className="text-[11px] font-bold text-ink/70">
                            {evalPre ? `${Object.keys(evalPre.criterios || {}).length}/15 ítems` : 'No registrada'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (evalPre) {
                              setDiaRubrica(evalPre)
                            } else {
                              setDiaRubrica({
                                estudiante_id: seleccionado?.id,
                                actividad_id: 'molino-casa',
                                fecha: fechaKey,
                                criterios: {},
                                id: generarEvaluacionId(seleccionado?.id || '', fechaKey, 'molino-casa'),
                              })
                            }
                          }}
                          className="w-full bg-white border border-terracota text-terracota rounded-full py-1.5 text-[12px] font-bold hover:bg-terracota hover:text-white transition flex items-center justify-center gap-1"
                        >
                          📋 Ver Rúbrica PRE
                        </button>
                      </div>

                      <div className="p-3 rounded-xl border border-paramo/30 bg-paramo/5 flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold bg-paramo text-white px-2 py-0.5 rounded-full">POST</span>
                          <span className="text-[11px] font-bold text-ink/70">
                            {evalPost ? `${Object.keys(evalPost.criterios || {}).length}/15 ítems` : 'No registrada'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (evalPost) {
                              setDiaRubrica(evalPost)
                            } else {
                              setDiaRubrica({
                                estudiante_id: seleccionado?.id,
                                actividad_id: 'molino-casa-post',
                                fecha: fechaKey,
                                criterios: {},
                                id: generarEvaluacionId(seleccionado?.id || '', fechaKey, 'molino-casa-post'),
                              })
                            }
                          }}
                          className="w-full bg-white border border-paramo text-paramo rounded-full py-1.5 text-[12px] font-bold hover:bg-paramo hover:text-white transition flex items-center justify-center gap-1"
                        >
                          📋 Ver Rúbrica POST
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      )}

      {diaRubrica && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm" onClick={() => setDiaRubrica(null)} />
          <div className="relative bg-paper rounded-paper border border-[#E8E0D0] shadow-lift w-[min(860px,95vw)] max-h-[85vh] overflow-auto paper-texture flex flex-col">
            <div className="sticky top-0 bg-white border-b border-[#E8E0D0] p-4 flex items-center justify-between">
              <div>
                <p className="font-display font-bold text-ink flex items-center gap-2">
                  Rúbrica STEAM — Molino
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${diaRubrica.actividad_id === 'molino-casa-post' ? 'bg-paramo text-white' : 'bg-terracota text-white'}`}>
                    {diaRubrica.actividad_id === 'molino-casa-post' ? 'POST' : 'PRE'}
                  </span>
                </p>
                <p className="text-[11px] text-ink/50">
                  {new Date(diaRubrica.fecha || diaRubrica.created_at).toLocaleDateString('es-CO', { day:'2-digit', month:'long', year:'numeric'})} · {Object.keys(diaRubrica.criterios||{}).length}/15 ítems evaluados
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const isPost = diaRubrica.actividad_id === 'molino-casa-post'
                    setDiaRubrica(null)
                    abrirRubrica(isPost ? 'post' : 'pre')
                  }}
                  className="px-3.5 py-2 rounded-full bg-white border border-[#E8E0D0] text-[13px] font-semibold text-ink hover:bg-mist transition flex items-center gap-1"
                >
                  ✏️ Editar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    exportarRubricaCSV(
                      diaRubrica.actividad_id === 'molino-casa-post' ? 'POST' : 'PRE',
                      diaRubrica.criterios || {},
                      diaRubrica.observaciones || diaRubrica.observacion || {},
                      (diaRubrica.fecha || diaRubrica.created_at || '').split('T')[0]
                    )
                  }}
                  className="px-4 py-2 rounded-full bg-paramo text-white text-[13px] font-semibold hover:bg-paramo/90 transition shadow-sm"
                >
                  Exportar tabla
                </button>
                <button type="button" onClick={() => setDiaRubrica(null)} className="px-4 py-2 rounded-full bg-white border border-[#E8E0D0] text-[13px] font-semibold hover:bg-mist transition">
                  Volver
                </button>
              </div>
            </div>
            <div className="p-4 overflow-auto">
              <div className="overflow-x-auto">
                <table className="w-full text-[12px] border-collapse">
                  <thead><tr className="bg-ink text-white"><th className="p-2 text-left">Área / Dimensión</th><th className="p-2 text-left">Indicador</th><th className="p-2 text-center w-12">1</th><th className="p-2 text-center w-12">2</th><th className="p-2 text-center w-12">3</th><th className="p-2 text-center w-12">4</th></tr></thead>
                  <tbody>
                    {RUBRICA.map((area) => {
                      const areaKey = area.area.split('(')[1]?.replace(')','') || area.area
                      const prom = (() => {
                        const vals = area.items.map((it) => diaRubrica.criterios?.[it.key]).filter((v:any)=> v!=null) as number[]
                        return vals.length ? (vals.reduce((a:number,b:number)=>a+b,0)/vals.length).toFixed(1) : '—'
                      })()
                      const obs = (() => {
                        try {
                          const o = diaRubrica.observaciones || (diaRubrica.observacion ? (typeof diaRubrica.observacion === 'string' ? JSON.parse(diaRubrica.observacion) : diaRubrica.observacion) : {})
                          return typeof o === 'string' ? o : (o[areaKey] || '')
                        } catch { return '' }
                      })()
                      return (
                        <React.Fragment key={area.area}>
                          <tr className="bg-mist/50"><td colSpan={5} className="p-2 font-bold text-ink text-[12px]">{area.area}</td><td className="p-2 text-center font-bold text-ink">{prom}</td></tr>
                          {area.items.map((it) => (
                            <tr key={it.key} className="border-b border-[#E8E0D0]/50">
                              <td className="p-2 font-semibold text-ink whitespace-nowrap text-[11px]">{it.dim}</td>
                              <td className="p-2 text-ink/80 leading-relaxed text-[11px]">{it.ind}</td>
                              {[1,2,3,4].map((n) => (
                                <td key={n} className="p-2 text-center">
                                  <span className={`inline-flex w-6 h-6 items-center justify-center rounded-full text-[11px] font-bold ${diaRubrica.criterios?.[it.key]===n ? (diaRubrica.actividad_id === 'molino-casa-post' ? 'bg-paramo text-white' : 'bg-terracota text-white') : 'bg-paper border border-[#E8E0D0] text-ink/30'}`}>{diaRubrica.criterios?.[it.key]===n ? '●' : '○'}</span>
                                </td>
                              ))}
                            </tr>
                          ))}
                          {obs && <tr><td colSpan={6} className="p-2 bg-amber-50/50 text-[11px] leading-relaxed text-ink/70"><span className="font-bold">Obs {areaKey}:</span> {obs}</td></tr>}
                        </React.Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {rubricaOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={() => setRubricaOpen(false)} />
          <div className="relative bg-paper rounded-paper border border-[#E8E0D0] shadow-lift w-[min(860px,95vw)] max-h-[85vh] overflow-auto paper-texture flex flex-col">
            <div className="sticky top-0 bg-white border-b border-[#E8E0D0] p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <p className="font-display font-bold text-ink">
                    Rúbrica STEAM — Molino
                  </p>
                  <p className="text-[11px] text-ink/50">1 En inicio · 2 En desarrollo · 3 Competente · 4 Destacado</p>
                </div>
                <div className="flex bg-paper border border-[#E8E0D0] p-1 rounded-full gap-1 ml-auto sm:ml-0">
                  <button
                    type="button"
                    onClick={() => cambiarTipoRubrica('pre')}
                    className={`px-3.5 py-1 rounded-full text-[12px] font-bold transition ${
                      tipoRubrica === 'pre'
                        ? 'bg-terracota text-white shadow-sm'
                        : 'text-ink/60 hover:text-ink'
                    }`}
                  >
                    PRE
                  </button>
                  <button
                    type="button"
                    onClick={() => cambiarTipoRubrica('post')}
                    className={`px-3.5 py-1 rounded-full text-[12px] font-bold transition ${
                      tipoRubrica === 'post'
                        ? 'bg-paramo text-white shadow-sm'
                        : 'text-ink/60 hover:text-ink'
                    }`}
                  >
                    POST
                  </button>
                </div>
              </div>
              <div className="flex gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => {
                    exportarRubricaCSV(
                      tipoRubrica.toUpperCase(),
                      criterios,
                      observaciones,
                      new Date().toISOString().split('T')[0]
                    )
                  }}
                  className="px-4 py-2 rounded-full bg-paramo text-white text-[13px] font-semibold hover:bg-paramo/90 transition shadow-sm"
                >
                  Exportar tabla
                </button>
                <button type="button" onClick={() => setRubricaOpen(false)} className="px-4 py-2 rounded-full bg-white border border-[#E8E0D0] text-[13px] font-semibold hover:bg-mist transition" aria-label="Volver">
                  ← Volver
                </button>
              </div>
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
                      const areaKey = area.area.split('(')[1]?.replace(')','') || area.area
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
                                  <input
                                    type="radio"
                                    name={it.key}
                                    checked={criterios[it.key]===n}
                                    onChange={() => actualizarCriterio(it.key, n)}
                                    className={`w-4 h-4 ${tipoRubrica === 'post' ? 'accent-paramo' : 'accent-terracota'}`}
                                    aria-label={`${it.key} ${n}`}
                                  />
                                </td>
                              ))}
                              <td className={`p-2 text-center font-bold ${tipoRubrica === 'post' ? 'text-paramo' : 'text-terracota'}`}>{criterios[it.key] || '—'}</td>
                            </tr>
                          ))}
                          <tr><td colSpan={7} className="p-2 bg-white">
                            <label className="text-[11px] font-bold tracking-widest uppercase text-ink/60">Observación {areaKey}</label>
                            <textarea
                              value={observaciones[areaKey] || ''}
                              onChange={(e)=> actualizarObservacion(areaKey, e.target.value)}
                              placeholder={`Escribe observación para ${area.area}...`}
                              rows={2}
                              className="w-full mt-1 bg-paper border border-[#E8E0D0] rounded-xl px-3 py-2 text-[13px] outline-none focus:border-paramo/30 focus:bg-white resize-none"
                            />
                          </td></tr>
                        </React.Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <p className="text-[11px] text-ink/50 mt-3">Promedio general molino ({tipoRubrica.toUpperCase()}): {(() => { const v = Object.values(criterios) as number[]; return v.length ? (v.reduce((a,b)=>a+b,0)/v.length).toFixed(1) : '—' })()} / 4</p>
            </div>
            <div className="sticky bottom-0 bg-white border-t border-[#E8E0D0] p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-ink/60 font-medium">
                  {Object.keys(criterios).length}/15 ítems evaluados
                </span>
                {mensajeRubrica && (
                  <span className={`text-[12px] font-bold px-3 py-1 rounded-full ${
                    mensajeRubrica.includes('nube') || mensajeRubrica.includes('correctamente')
                      ? 'bg-moss/10 text-moss border border-moss/20'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}>
                    {mensajeRubrica}
                  </span>
                )}
              </div>
              <div className="flex gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => guardarRubricaDirecto(tipoRubrica, criterios, observaciones)}
                  className={`px-5 py-2.5 rounded-full text-white text-[13px] font-bold transition shadow-sm ${
                    tipoRubrica === 'post' ? 'bg-paramo hover:bg-[#1e3a0f]' : 'bg-terracota hover:bg-[#a65e2a]'
                  }`}
                >
                  💾 Guardar Rúbrica {tipoRubrica.toUpperCase()}
                </button>
                <button
                  type="button"
                  onClick={() => setRubricaOpen(false)}
                  className="px-5 py-2.5 rounded-full bg-white border border-[#E8E0D0] text-[13px] font-semibold hover:bg-mist transition"
                >
                  Listo / Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
