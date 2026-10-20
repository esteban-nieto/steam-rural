// @ts-nocheck
import * as React from 'react'
import { useState, useEffect } from 'react'
import type { Estudiante } from '../../types/models'
import { Layout } from '../../components/Layout'
import { EmotionPicker } from '../../components/EmotionPicker'
import { ModalP2PSync } from '../../components/ModalP2PSync'
import { useAppStore } from '../../stores/app.store'
import {
  db,
  guardarProgresoLocal,
  guardarEvaluacionLocal,
  generarEvaluacionId,
  guardarActividadLocal,
  obtenerActividadesLocales,
  eliminarActividadLocal,
  type Actividad,
  type PasoActividad,
} from '../../services/db'

const ACTIVIDADES_BASE = [
  { id: 'origami-conejo', label: 'Actividad 1- Origami conejo', pasos: 11 },
  { id: 'molino-casa', label: 'Actividad 2- Molino + Casa', pasos: 20 },
]
const ACTIVIDADES = ACTIVIDADES_BASE

const EMOJI_MAP: Record<string, string> = {
  feliz: '😄',
  contento: '🙂',
  neutro: '😐',
  triste: '😔',
  enfado: '😠',
}

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

export function ProfesorHome({ onCerrarSesion }: { onCerrarSesion?: () => void }) {
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
  const [modalP2pOpen, setModalP2pOpen] = useState(false)
  const criteriosInicialRef = React.useRef(true)

  const cargar = async () => {
    try {
      const local = await db.estudiantes.where('curso').equals(curso).toArray()
      setEstudiantes(local as any)
    } catch {
      setEstudiantes([])
    }
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
    const nuevo: any = {
      id: tempId,
      nombre: nombre.trim(),
      curso,
      created_at: new Date().toISOString(),
    }
    setEstudiantes((p) => [...p, nuevo as Estudiante])
    setNombre('')
    try {
      await db.estudiantes.put(nuevo)
    } catch (err) {
      console.error('Error guardando estudiante local:', err)
    }
  }

  const crearCurso = () => {
    if (!nuevoCurso.trim() || cursos.includes(nuevoCurso)) return
    setCursos([...cursos, nuevoCurso]); setCurso(nuevoCurso); setNuevoCurso('')
  }

  const [actividadesLocales, setActividadesLocales] = useState<Actividad[]>([])
  const [modalActividadOpen, setModalActividadOpen] = useState(false)
  const [modoCreacionActividad, setModoCreacionActividad] = useState<'selector' | 'pasos' | 'video'>('selector')
  const [nombreNuevaAct, setNombreNuevaAct] = useState('')
  const [numPasosNuevaAct, setNumPasosNuevaAct] = useState<number>(3)
  const [pasosNuevaAct, setPasosNuevaAct] = useState<PasoActividad[]>([
    { paso: 1, texto: '', multimedia: undefined, tipoMultimedia: 'imagen' },
    { paso: 2, texto: '', multimedia: undefined, tipoMultimedia: 'imagen' },
    { paso: 3, texto: '', multimedia: undefined, tipoMultimedia: 'imagen' },
  ])

  const cargarActividadesLocales = async () => {
    const list = await obtenerActividadesLocales()
    setActividadesLocales(list)
  }

  useEffect(() => {
    cargarActividadesLocales()
  }, [])

  const todasLasActividades = [
    ...ACTIVIDADES_BASE,
    ...actividadesLocales.map((a) => ({
      id: a.id,
      label: a.nombre,
      pasos: a.numeroPasos,
      esDinamica: true,
    })),
  ]

  const totalPasos = todasLasActividades.find((a) => a.id === actividad)?.pasos || 11

  const cambiarCantidadPasos = (cantidad: number) => {
    const n = Math.max(1, Math.min(50, cantidad))
    setNumPasosNuevaAct(n)
    setPasosNuevaAct((prev) => {
      const nuevoArray: PasoActividad[] = []
      for (let i = 1; i <= n; i++) {
        const existente = prev.find((p) => p.paso === i)
        if (existente) {
          nuevoArray.push(existente)
        } else {
          nuevoArray.push({ paso: i, texto: '', multimedia: undefined, tipoMultimedia: 'imagen' })
        }
      }
      return nuevoArray
    })
  }

  const handleSubirMultimediaPaso = (pasoNum: number, file: File) => {
    const tipo: 'imagen' | 'video' = file.type.startsWith('video') ? 'video' : 'imagen'
    const reader = new FileReader()
    reader.onload = (e) => {
      const res = e.target?.result as string
      setPasosNuevaAct((prev) =>
        prev.map((p) => (p.paso === pasoNum ? { ...p, multimedia: res, tipoMultimedia: tipo } : p))
      )
    }
    reader.readAsDataURL(file)
  }

  const [portadaNuevaAct, setPortadaNuevaAct] = useState<string | null>(null)

  const guardarNuevaActividad = async () => {
    if (!nombreNuevaAct.trim()) {
      alert('Por favor escribe un nombre para la actividad.')
      return
    }
    const nueva: Actividad = {
      id: `act-${Date.now()}`,
      nombre: nombreNuevaAct.trim(),
      numeroPasos: numPasosNuevaAct,
      pasos: pasosNuevaAct,
      portada: portadaNuevaAct || undefined,
      fechaCreacion: new Date().toISOString(),
    }
    await guardarActividadLocal(nueva)
    await cargarActividadesLocales()
    setModalActividadOpen(false)
    setNombreNuevaAct('')
    setPortadaNuevaAct(null)
    cambiarCantidadPasos(3)
    setMensaje('✓ Nueva actividad creada correctamente')
    setTimeout(() => setMensaje(''), 2500)
  }

  const [modalVideoOpen, setModalVideoOpen] = useState(false)
  const [nombreActVideo, setNombreActVideo] = useState('')
  const [portadaActVideo, setPortadaActVideo] = useState<string | null>(null)
  const [videoFileUrl, setVideoFileUrl] = useState<string | null>(null)
  const [videoDuracion, setVideoDuracion] = useState<number>(0)
  const [isDraggingVideo, setIsDraggingVideo] = useState(false)
  const [numPasosVideo, setNumPasosVideo] = useState<number>(4)
  const [segmentosVideo, setSegmentosVideo] = useState<
    Array<{ paso: number; texto: string; start: number; end: number }>
  >([
    { paso: 1, texto: '', start: 0, end: 10 },
    { paso: 2, texto: '', start: 10, end: 20 },
    { paso: 3, texto: '', start: 20, end: 30 },
    { paso: 4, texto: '', start: 30, end: 40 },
  ])
  const previewVideoRef = React.useRef<HTMLVideoElement>(null)
  const modalScrollContainerRef = React.useRef<HTMLDivElement>(null)

  const secondsToMmSs = (secTotal: number): string => {
    const s = Math.max(0, Math.round(secTotal || 0))
    const m = Math.floor(s / 60)
    const rem = s % 60
    return `${String(m).padStart(2, '0')}:${String(rem).padStart(2, '0')}`
  }

  const parseMmSsToSeconds = (val: string): number => {
    const clean = val.trim()
    if (!clean) return 0
    if (clean.includes(':')) {
      const parts = clean.split(':')
      const m = parseInt(parts[0], 10) || 0
      const s = parseInt(parts[1], 10) || 0
      return m * 60 + s
    }
    return Math.max(0, parseInt(clean, 10) || 0)
  }

  const handleSubirVideoPrincipal = (file: File) => {
    if (!file || !file.type.startsWith('video/')) {
      alert('Por favor selecciona un archivo de video válido (MP4, WebM, etc.).')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const res = e.target?.result as string
      setVideoFileUrl(res)
    }
    reader.readAsDataURL(file)
  }

  const cambiarCantidadPasosVideo = (cant: number) => {
    const n = Math.max(1, Math.min(30, cant))
    setNumPasosVideo(n)
    setSegmentosVideo((prev) => {
      const durPorPaso = videoDuracion > 0 ? Math.floor(videoDuracion / n) : 10
      const nuevoArray = []
      for (let i = 1; i <= n; i++) {
        const existente = prev.find((p) => p.paso === i)
        if (existente) {
          nuevoArray.push(existente)
        } else {
          const start = (i - 1) * durPorPaso
          const end = i === n && videoDuracion > 0 ? Math.floor(videoDuracion) : i * durPorPaso
          nuevoArray.push({ paso: i, texto: '', start, end })
        }
      }
      return nuevoArray
    })
  }

  const guardarActividadVideoSegmentado = async () => {
    if (!nombreActVideo.trim()) {
      alert('Por favor escribe un nombre para la actividad.')
      return
    }
    if (!videoFileUrl) {
      alert('Por favor sube el archivo de video.')
      return
    }

    const nueva: Actividad = {
      id: `act-video-${Date.now()}`,
      nombre: nombreActVideo.trim(),
      numeroPasos: numPasosVideo,
      tipoActividad: 'video_segmentado',
      videoPrincipal: videoFileUrl,
      portada: portadaActVideo || undefined,
      pasos: segmentosVideo.map((s) => ({
        paso: s.paso,
        texto: s.texto.trim() || `Paso ${s.paso}`,
        videoStart: s.start,
        videoEnd: s.end,
        tipoMultimedia: 'video',
      })),
      fechaCreacion: new Date().toISOString(),
    }

    await guardarActividadLocal(nueva)
    await cargarActividadesLocales()
    setModalVideoOpen(false)
    setNombreActVideo('')
    setVideoFileUrl(null)
    setPortadaActVideo(null)
    setMensaje('✓ Actividad de video por pasos creada correctamente')
    setTimeout(() => setMensaje(''), 2500)
  }

  const eliminarActividad = async (id: string) => {
    if (confirm('¿Seguro que deseas eliminar esta actividad?')) {
      await eliminarActividadLocal(id)
      await cargarActividadesLocales()
      if (actividad === id) setActividad('origami-conejo')
    }
  }

  const guardarRubricaDirecto = async (
    tipo: 'pre' | 'post',
    crit: Record<string, number>,
    obs: Record<string, string>
  ) => {
    if (!seleccionado) return
    const fechaDia = new Date().toISOString().split('T')[0]
    const actId = tipo === 'post' ? 'molino-casa-post' : 'molino-casa'
    const evId = generarEvaluacionId(seleccionado.id, fechaDia, actId)
    const evLocal: any = {
      id: evId,
      estudiante_id: seleccionado.id,
      actividad_id: actId,
      fecha: fechaDia,
      criterios: crit,
      observacion: JSON.stringify(obs),
      observaciones: obs,
      created_at: new Date().toISOString(),
    }
    await db.evaluaciones.put(evLocal).catch(() => {})
    setMensajeRubrica('✓ Rúbrica guardada localmente')

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

  const generarHtmlRubrica = ({
    tipoLabel,
    criteriosMap,
    obsMap,
    fechaDoc,
    estNombre,
    estCurso,
  }: {
    tipoLabel: string
    criteriosMap: Record<string, number>
    obsMap: Record<string, string> | string
    fechaDoc: string
    estNombre: string
    estCurso: string
  }) => {
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

    return `<div class="page" style="page-break-after:always; margin-bottom:32px;">
      <header style="background:${accent};">
        <h1>Rúbrica STEAM — Molino + Casa <span class="badge" style="color:${accent};">${esc(tipoLabel)}</span></h1>
        <p>1 En inicio · 2 En desarrollo · 3 Competente · 4 Destacado</p>
      </header>
      <section class="meta">
        <div><span>Estudiante</span><strong>${esc(estNombre)}</strong></div>
        <div><span>Curso</span><strong>${esc(estCurso)}</strong></div>
        <div><span>Fecha</span><strong>${esc(fechaTxt || 'Sin registrar')}</strong></div>
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
      <footer>Evaluación ${esc(tipoLabel)} · Niveles: ${Object.entries(NIVELES).map(([k, v]) => `${k} ${v}`).join(' · ')}</footer>
    </div>`
  }

  const descargarArchivoHtml = (htmlContent: string, filename: string) => {
    const blob = new Blob(['\uFEFF', htmlContent], { type: 'application/octet-stream' })
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

  const [descargandoGrupo, setDescargandoGrupo] = useState(false)

  const descargarTodasLasRubricasGrupo = async () => {
    if (!estudiantes || estudiantes.length === 0) {
      alert('No hay estudiantes en este grupo.')
      return
    }

    setDescargandoGrupo(true)
    try {
      const estudianteIds = estudiantes.map((e) => e.id)
      const todasEvals = await db.evaluaciones
        .where('estudiante_id')
        .anyOf(estudianteIds)
        .toArray()
        .catch(() => [])

      const paginasHtml: string[] = []
      let totalRubricasEncontradas = 0

      for (const est of estudiantes) {
        const evalsEst = todasEvals.filter((ev: any) => ev.estudiante_id === est.id)
        const evPre = evalsEst.find((ev: any) => ev.actividad_id === 'molino-casa' && ev.criterios && Object.keys(ev.criterios).length > 0)
        const evPost = evalsEst.find((ev: any) => ev.actividad_id === 'molino-casa-post' && ev.criterios && Object.keys(ev.criterios).length > 0)

        if (evPre) {
          totalRubricasEncontradas++
          paginasHtml.push(
            generarHtmlRubrica({
              tipoLabel: 'PRE',
              criteriosMap: evPre.criterios || {},
              obsMap: evPre.observaciones || evPre.observacion || {},
              fechaDoc: (evPre.fecha || evPre.created_at || '').split('T')[0],
              estNombre: est.nombre,
              estCurso: est.curso || curso,
            })
          )
        }

        if (evPost) {
          totalRubricasEncontradas++
          paginasHtml.push(
            generarHtmlRubrica({
              tipoLabel: 'POST',
              criteriosMap: evPost.criterios || {},
              obsMap: evPost.observaciones || evPost.observacion || {},
              fechaDoc: (evPost.fecha || evPost.created_at || '').split('T')[0],
              estNombre: est.nombre,
              estCurso: est.curso || curso,
            })
          )
        }
      }

      if (paginasHtml.length === 0) {
        alert(`No se encontraron rúbricas evaluadas (PRE o POST) para los estudiantes del grupo ${curso}.`)
        setDescargandoGrupo(false)
        return
      }

      const htmlCompleto = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Rúbricas STEAM Grupo ${curso} — PRE y POST (${totalRubricasEncontradas} evaluaciones)</title>
<style>
  :root { --ink:#1A2E1A; --paper:#FDF8F0; --line:#E4D9C8; }
  * { box-sizing:border-box; }
  body { margin:0; background:#EFE6D6; color:var(--ink); font-family:Calibri,"Segoe UI",Inter,sans-serif; padding:16px 0; }
  .page { max-width:980px; margin:24px auto; background:var(--paper); border:1px solid var(--line); border-radius:16px; overflow:hidden; box-shadow:0 10px 28px rgba(26,46,26,.08); }
  header { color:#fff; padding:22px 24px 18px; }
  header h1 { margin:0 0 4px; font-size:22px; letter-spacing:.02em; }
  header p { margin:0; opacity:.9; font-size:13px; }
  .badge { display:inline-block; background:#fff; font-weight:700; font-size:11px; letter-spacing:.12em; padding:3px 10px; border-radius:999px; margin-left:8px; vertical-align:middle; }
  .meta { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; padding:16px 24px; background:#fff; border-bottom:1px solid var(--line); }
  .meta div { background:#faf7f0; border:1px solid var(--line); border-radius:10px; padding:10px 12px; }
  .meta span { display:block; font-size:10px; font-weight:700; letter-spacing:.12em; text-transform:uppercase; opacity:.65; }
  .meta strong { display:block; margin-top:3px; font-size:15px; }
  .scale { padding:10px 24px 0; font-size:12px; opacity:.75; }
  table { width:calc(100% - 48px); margin:12px 24px 24px; border-collapse:collapse; background:#fff; }
  th { background:var(--ink); color:#fff; font-size:11px; letter-spacing:.06em; text-transform:uppercase; text-align:left; padding:9px 8px; }
  th.n, td.n, td.prom, td.item-score { text-align:center; width:42px; }
  td { border-bottom:1px solid var(--line); padding:8px; font-size:13px; vertical-align:top; }
  tr.area td { background:#faf6ee; font-weight:700; font-size:14px; border-bottom:none; }
  tr.desc td { background:#faf6ee; font-size:12px; color:#4a5c4a; padding-top:0; padding-bottom:10px; }
  td.dim { white-space:nowrap; font-weight:700; width:150px; }
  td.ind { line-height:1.4; color:#2b3a2b; }
  td.n { font-weight:700; color:#c5b9a6; }
  td.n.on { background:#2D5016; color:#fff; border-radius:4px; }
  td.item-score { font-weight:700; color:#2D5016; }
  tr.obs td { background:#fff8ee; font-size:12px; line-height:1.45; }
  tr.obs.empty td { color:#8a8073; background:#faf7f1; }
  footer { padding:0 24px 20px; font-size:12px; opacity:.7; }
  .banner-grupo { max-width:980px; margin:0 auto 20px; background:#fff; border:1px solid var(--line); border-radius:16px; padding:20px 24px; display:flex; justify-content:space-between; align-items:center; }
  @media print {
    body { background:#fff; padding:0; }
    .banner-grupo { display:none; }
    .page { margin:0 0 20mm 0; border:none; border-radius:0; box-shadow:none; page-break-after:always; }
  }
  @media (max-width:720px) {
    .meta { grid-template-columns:1fr 1fr; }
    table { width:calc(100% - 24px); margin:12px; }
  }
</style>
</head>
<body>
  <div class="banner-grupo">
    <div>
      <h2 style="margin:0 0 4px; font-size:20px; color:#1A2E1A;">Compilado de Rúbricas STEAM — Grupo ${curso}</h2>
      <p style="margin:0; font-size:13px; color:#666;">Incluye evaluaciones PRE y POST evaluadas (${totalRubricasEncontradas} rúbricas en total)</p>
    </div>
    <button onclick="window.print()" style="background:#2D5016; color:#fff; border:none; padding:10px 18px; border-radius:999px; font-weight:bold; cursor:pointer; font-size:13px;">Imprimir / Guardar como PDF</button>
  </div>
  ${paginasHtml.join('\n')}
</body>
</html>`

      const fechaHoy = new Date().toISOString().split('T')[0]
      const filename = `rubricas_grupo_${curso}_PRE_POST_${fechaHoy}.html`
      descargarArchivoHtml(htmlCompleto, filename)
    } catch (err) {
      console.error(err)
      alert('Ocurrió un error al compilar las rúbricas del grupo.')
    } finally {
      setDescargandoGrupo(false)
    }
  }

  const exportarRubricaCSV = (
    tipoLabel: string,
    criteriosMap: Record<string, number>,
    obsMap: Record<string, string> | string,
    fechaDoc: string
  ) => {
    const estNombre = seleccionado?.nombre || 'Estudiante'
    const estCurso = seleccionado?.curso || curso
    const bodyPage = generarHtmlRubrica({
      tipoLabel,
      criteriosMap,
      obsMap,
      fechaDoc,
      estNombre,
      estCurso,
    })

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Rúbrica STEAM Molino — ${tipoLabel} — ${estNombre}</title>
<style>
  :root { --ink:#1A2E1A; --paper:#FDF8F0; --line:#E4D9C8; }
  * { box-sizing:border-box; }
  body { margin:0; background:#EFE6D6; color:var(--ink); font-family:Calibri,"Segoe UI",Inter,sans-serif; }
  .page { max-width:980px; margin:24px auto; background:var(--paper); border:1px solid var(--line); border-radius:16px; overflow:hidden; box-shadow:0 10px 28px rgba(26,46,26,.08); }
  header { color:#fff; padding:22px 24px 18px; }
  header h1 { margin:0 0 4px; font-size:22px; letter-spacing:.02em; }
  header p { margin:0; opacity:.9; font-size:13px; }
  .badge { display:inline-block; background:#fff; font-weight:700; font-size:11px; letter-spacing:.12em; padding:3px 10px; border-radius:999px; margin-left:8px; vertical-align:middle; }
  .meta { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; padding:16px 24px; background:#fff; border-bottom:1px solid var(--line); }
  .meta div { background:#faf7f0; border:1px solid var(--line); border-radius:10px; padding:10px 12px; }
  .meta span { display:block; font-size:10px; font-weight:700; letter-spacing:.12em; text-transform:uppercase; opacity:.65; }
  .meta strong { display:block; margin-top:3px; font-size:15px; }
  .scale { padding:10px 24px 0; font-size:12px; opacity:.75; }
  table { width:calc(100% - 48px); margin:12px 24px 24px; border-collapse:collapse; background:#fff; }
  th { background:var(--ink); color:#fff; font-size:11px; letter-spacing:.06em; text-transform:uppercase; text-align:left; padding:9px 8px; }
  th.n, td.n, td.prom, td.item-score { text-align:center; width:42px; }
  td { border-bottom:1px solid var(--line); padding:8px; font-size:13px; vertical-align:top; }
  tr.area td { background:#faf6ee; font-weight:700; font-size:14px; border-bottom:none; }
  tr.desc td { background:#faf6ee; font-size:12px; color:#4a5c4a; padding-top:0; padding-bottom:10px; }
  td.dim { white-space:nowrap; font-weight:700; width:150px; }
  td.ind { line-height:1.4; color:#2b3a2b; }
  td.n { font-weight:700; color:#c5b9a6; }
  td.n.on { background:var(--accent, #2D5016); color:#fff; border-radius:4px; }
  td.item-score { font-weight:700; color:var(--accent, #2D5016); }
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
  ${bodyPage}
</body>
</html>`

    const filename = `rubrica_molino_${tipoLabel}_${String(estNombre).replace(/\s+/g, '_')}_${fechaDoc || 'sin_fecha'}.html`
    descargarArchivoHtml(html, filename)
  }



  const cargarHistorial = async (estudianteId: string) => {
    try {
      const localAll = await db.progresos.where('estudiante_id').equals(estudianteId).toArray()
      setHistorial([...localAll].reverse())
    } catch {
      setHistorial([])
    }
    try {
      const localE = await db.evaluaciones.where('estudiante_id').equals(estudianteId).toArray()
      setHistorialEval([...localE].reverse())
    } catch {
      setHistorialEval([])
    }
  }

  const abrirEstudiante = async (e: Estudiante) => {
    setSeleccionado(e)
    setEmocionInicio(undefined)
    setEmocionFin(undefined)
    setPasoHasta(0)
    setCriterios({})
    setObservaciones({})
    setMensaje('')
    setHistorial([])
    setHistorialEval([])
    setActividad('origami-conejo')
    pushState('ficha')

    try {
      const local = await db.progresos.where('estudiante_id').equals(e.id).toArray()
      if (local.length > 0) {
        const ultimo = local[local.length - 1] as any
        setEmocionInicio(ultimo.emocion_inicio || undefined)
        setEmocionFin(ultimo.emocion_fin || undefined)
        setPasoHasta(ultimo.pasos_completados?.length || 0)
        setActividad(ultimo.actividad_id || 'origami-conejo')
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
      if (actividad === 'molino-casa' && (Object.keys(criterios).length > 0 || Object.keys(observaciones).length > 0)) {
        const actIdSave = tipoRubrica === 'post' ? 'molino-casa-post' : 'molino-casa'
        const evIdSave = generarEvaluacionId(seleccionado.id, fechaDia, actIdSave)
        const evLocal: any = {
          id: evIdSave,
          estudiante_id: seleccionado.id,
          actividad_id: actIdSave,
          fecha: fechaDia,
          criterios,
          observacion: JSON.stringify(observaciones),
          observaciones,
          created_at: new Date().toISOString(),
        }

        await guardarEvaluacionLocal(evLocal)
        setHistorialEval((p) => {
          const filtrado = p.filter((x: any) => x.id !== evIdSave)
          return [evLocal, ...filtrado]
        })
      }
      setMensaje('✓ Registro guardado localmente')
      setHistorial((prev) => [progreso, ...prev])
    } catch {
      setMensaje('✓ Guardado localmente')
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
        const localE = await db.evaluaciones.where('estudiante_id').equals(h.estudiante_id).toArray()
        const found = localE.find((e: any) => e.fecha === fechaKey)
        if (found) {
          setCriterios((found as any).criterios || {})
          const obs = (found as any).observaciones || (found as any).observacion
          try {
            setObservaciones(obs ? (typeof obs === 'string' ? JSON.parse(obs) : obs) : {})
          } catch {
            setObservaciones({})
          }
        } else {
          setCriterios({})
          setObservaciones({})
        }
      } catch {
        setCriterios({})
        setObservaciones({})
      }
    } else {
      setCriterios({})
      setObservaciones({})
    }
    setTimeout(() => {
      criteriosInicialRef.current = false
    }, 300)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <Layout title="Panel Profesor">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold tracking-[0.14em] uppercase text-white bg-paramo px-2.5 py-1 rounded-full">{estudiantes.length} estudiantes</span>
          <span className="text-[12px] text-ink/50">en</span>
          <span className="font-display font-bold text-ink">{curso}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setModoCreacionActividad('selector')
              setModalActividadOpen(true)
            }}
            className="flex items-center gap-1.5 bg-paramo text-white hover:bg-[#1e3a0f] px-4 py-2 rounded-full text-[13px] font-bold shadow-paper hover:shadow transition"
          >
            <span>✨</span>
            <span>+ Nueva Actividad</span>
          </button>

          <button
            type="button"
            onClick={descargarTodasLasRubricasGrupo}
            disabled={descargandoGrupo || estudiantes.length === 0}
            className="flex items-center gap-2 bg-white border-2 border-slateProfesor text-slateProfesor hover:bg-slateProfesor hover:text-white px-4 py-2 rounded-full text-[13px] font-bold shadow-paper hover:shadow transition disabled:opacity-50 disabled:pointer-events-none"
            title="Descarga un documento único con todas las rúbricas PRE y POST registradas para este curso"
          >
            <span>📥</span>
            <span>{descargandoGrupo ? 'Generando reporte...' : 'Descargar Rúbricas'}</span>
          </button>

          <button
            type="button"
            onClick={() => setModalP2pOpen(true)}
            className="flex items-center gap-1.5 bg-white border border-terracota/30 text-terracota hover:bg-terracota hover:text-white px-4 py-2 rounded-full text-[13px] font-bold shadow-paper hover:shadow transition"
            title="Sincronizar cursos, notas y actividades con otro equipo de la sala por red WiFi o USB"
          >
            <span>📡</span>
            <span>Sincronizar Sala</span>
          </button>

          {onCerrarSesion && (
            <button
              type="button"
              onClick={onCerrarSesion}
              className="flex items-center gap-1.5 bg-white border border-[#E8E0D0] text-ink/70 hover:text-ink hover:bg-mist px-3.5 py-2 rounded-full text-[13px] font-semibold transition"
              title="Salir al selector principal"
            >
              <span>🚪</span>
              <span>Salir</span>
            </button>
          )}
        </div>
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
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-display font-bold text-ink">Actividades</h4>
                  <button
                    type="button"
                    onClick={() => {
                      setModoCreacionActividad('selector')
                      setModalActividadOpen(true)
                    }}
                    className="text-[12px] font-bold text-paramo hover:underline flex items-center gap-1"
                  >
                    + Agregar actividad
                  </button>
                </div>
                <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-1 px-1">
                  {todasLasActividades.map((a, idx) => (
                    <div key={a.id} className="relative min-w-[220px] w-[220px] snap-start">
                      <button
                        onClick={() => setActividad(a.id)}
                        className={`w-full text-left bg-white rounded-2xl border-2 p-4 flex flex-col gap-2 transition ${
                          actividad === a.id
                            ? 'border-terracota shadow-paper bg-mist/30'
                            : 'border-[#E8E0D0] hover:border-terracota/30'
                        }`}
                      >
                        <span className="text-[11px] font-bold tracking-widest uppercase text-terracota">
                          Actividad {idx + 1}
                        </span>
                        <span className="font-display font-bold text-ink text-[15px] leading-tight">
                          {a.label}
                        </span>
                        <span className="text-[11px] text-ink/60">
                          {a.pasos} pasos · {a.id === 'molino-casa' ? 'Video + Rúbrica' : a.esDinamica ? 'Personalizada' : 'Papel'}
                        </span>
                      </button>
                      {a.esDinamica && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            eliminarActividad(a.id)
                          }}
                          className="absolute top-2 right-2 text-ink/30 hover:text-red-500 font-bold p-1 text-[13px]"
                          title="Eliminar actividad"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[#E8E0D0] p-4">
                <h4 className="font-display font-bold text-ink mb-3">{todasLasActividades.find((a) => a.id === actividad)?.label} — ¿Hasta qué paso llegó?</h4>
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

      {/* MODAL ÚNICO DE CREACIÓN DE ACTIVIDADES */}
      {modalActividadOpen && (
        <div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#E8E0D0] overflow-hidden my-auto">
            {/* Header unificado */}
            <div className="bg-slateProfesor text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-lg flex items-center gap-2">
                  <span>✨</span>
                  <span>
                    {modoCreacionActividad === 'selector'
                      ? 'Crear Nueva Actividad'
                      : modoCreacionActividad === 'pasos'
                      ? 'Creación Paso a Paso (Fotos/Videos individuales)'
                      : 'Dividir Video Completo en Pasos'}
                  </span>
                </h3>
                <p className="text-white/70 text-xs">
                  {modoCreacionActividad === 'selector'
                    ? 'Selecciona cómo deseas diseñar la actividad para tus estudiantes'
                    : modoCreacionActividad === 'pasos'
                    ? 'Escribe el texto de cada paso y sube fotos o videos individuales'
                    : 'Sube un video completo y define los segundos de inicio y fin de cada paso'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalActividadOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* VISTA 1: SELECTOR DE OPCIONES */}
            {modoCreacionActividad === 'selector' && (
              <div className="p-8 space-y-6">
                <div className="text-center max-w-md mx-auto">
                  <h4 className="font-display font-bold text-ink text-xl mb-2">
                    ¿Qué tipo de actividad deseas crear?
                  </h4>
                  <p className="text-sm text-ink/60">
                    Puedes diseñar una guía ilustrada paso a paso o partir un video largo en fragmentos interactivos.
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto pt-2">
                  <button
                    type="button"
                    onClick={() => setModoCreacionActividad('pasos')}
                    className="group text-left p-6 rounded-2xl border-2 border-[#E8E0D0] hover:border-paramo hover:bg-mist/30 transition-all flex flex-col gap-3 shadow-sm hover:shadow"
                  >
                    <div className="w-12 h-12 rounded-xl bg-paramo/10 text-paramo flex items-center justify-center text-2xl group-hover:scale-105 transition">
                      📸
                    </div>
                    <div>
                      <h5 className="font-display font-bold text-ink text-base">
                        Creación paso por paso
                      </h5>
                      <p className="text-xs text-ink/60 mt-1 leading-relaxed">
                        Define la cantidad de pasos, escribe la instrucción de cada uno y adjunta fotos o videos cortos individuales.
                      </p>
                    </div>
                    <span className="text-xs font-bold text-paramo uppercase tracking-wider mt-auto flex items-center gap-1">
                      Elegir esta opción →
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModoCreacionActividad('video')}
                    className="group text-left p-6 rounded-2xl border-2 border-[#E8E0D0] hover:border-terracota hover:bg-terracota/5 transition-all flex flex-col gap-3 shadow-sm hover:shadow"
                  >
                    <div className="w-12 h-12 rounded-xl bg-terracota/10 text-terracota flex items-center justify-center text-2xl group-hover:scale-105 transition">
                      🎬
                    </div>
                    <div>
                      <h5 className="font-display font-bold text-ink text-base">
                        Dividir video en pasos
                      </h5>
                      <p className="text-xs text-ink/60 mt-1 leading-relaxed">
                        Sube un video completo (ej. armado del molino), define cuántos pasos tiene y marca los segundos exactos de cada corte.
                      </p>
                    </div>
                    <span className="text-xs font-bold text-terracota uppercase tracking-wider mt-auto flex items-center gap-1">
                      Elegir esta opción →
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* VISTA 2: CREACIÓN PASO POR PASO */}
            {modoCreacionActividad === 'pasos' && (
              <>
                <div className="p-6 overflow-y-auto space-y-6 flex-1">
                  <div className="flex items-center justify-between pb-2 border-b border-[#E8E0D0]">
                    <button
                      type="button"
                      onClick={() => setModoCreacionActividad('selector')}
                      className="text-xs font-bold text-ink/60 hover:text-ink flex items-center gap-1"
                    >
                      ← Cambiar tipo de actividad
                    </button>
                    <span className="text-xs font-bold text-paramo bg-mist px-2.5 py-0.5 rounded-full">
                      Paso a paso ilustrado
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink/70 mb-1.5">
                      Nombre de la Actividad *
                    </label>
                    <input
                      type="text"
                      value={nombreNuevaAct}
                      onChange={(e) => setNombreNuevaAct(e.target.value)}
                      placeholder="Ej. Construcción de Carrito con Cartón"
                      className="w-full bg-paper border border-[#E8E0D0] rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:border-paramo focus:bg-white"
                    />
                  </div>

                  {/* Portada de la actividad */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink/70 mb-1.5">
                      Portada (imagen de presentación)
                    </label>
                    {portadaNuevaAct ? (
                      <div className="flex items-center gap-3 p-3 bg-paper/60 border border-[#E8E0D0] rounded-xl">
                        <img
                          src={portadaNuevaAct}
                          alt="Portada"
                          className="w-16 h-16 object-cover rounded-lg border border-[#E8E0D0]"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-ink">Portada cargada</p>
                          <p className="text-[11px] text-ink/50">Se mostrará en la tarjeta de la actividad</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPortadaNuevaAct(undefined)}
                          className="text-xs text-red-500 font-bold hover:underline shrink-0"
                        >
                          ✕ Quitar
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer border-2 border-dashed border-[#E8E0D0] hover:border-paramo rounded-xl p-4 flex items-center gap-3 bg-white transition">
                        <span className="text-2xl">🖼️</span>
                        <div>
                          <p className="text-xs font-bold text-ink">Subir imagen de portada</p>
                          <p className="text-[11px] text-ink/50">JPG, PNG o WebP recomendado</p>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const f = e.target.files?.[0]
                            if (!f) return
                            const reader = new FileReader()
                            reader.onload = (ev) => setPortadaNuevaAct(ev.target?.result as string)
                            reader.readAsDataURL(f)
                          }}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-ink/70">
                        Número de Pasos
                      </label>
                      <span className="text-xs font-bold text-paramo bg-mist px-2.5 py-0.5 rounded-full">
                        {numPasosNuevaAct} pasos configurados
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={1}
                        max={30}
                        value={numPasosNuevaAct}
                        onChange={(e) => cambiarCantidadPasos(Number(e.target.value))}
                        className="flex-1 accent-paramo"
                      />
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={numPasosNuevaAct}
                        onChange={(e) => cambiarCantidadPasos(Number(e.target.value))}
                        className="w-16 text-center bg-paper border border-[#E8E0D0] rounded-lg py-1.5 text-sm font-bold outline-none"
                      />
                    </div>
                  </div>

                  {/* Lista de pasos */}
                  <div className="space-y-4 pt-2">
                    <h4 className="font-display font-bold text-ink text-sm flex items-center gap-2">
                      <span>📝</span>
                      <span>Detalle de cada paso</span>
                    </h4>

                    {pasosNuevaAct.map((pasoItem) => (
                      <div
                        key={pasoItem.paso}
                        className="p-4 rounded-2xl bg-paper/50 border border-[#E8E0D0] space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold bg-slateProfesor text-white px-2.5 py-1 rounded-full uppercase tracking-wider">
                            Paso {pasoItem.paso}
                          </span>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-ink/60 uppercase mb-1">
                            Instrucción o texto del paso
                          </label>
                          <textarea
                            rows={2}
                            value={pasoItem.texto}
                            onChange={(e) =>
                              setPasosNuevaAct((prev) =>
                                prev.map((p) =>
                                  p.paso === pasoItem.paso ? { ...p, texto: e.target.value } : p
                                )
                              )
                            }
                            placeholder={`Describe qué debe hacer el estudiante en el paso ${pasoItem.paso}...`}
                            className="w-full bg-white border border-[#E8E0D0] rounded-xl p-3 text-xs outline-none focus:border-paramo resize-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-ink/60 uppercase mb-1">
                            Multimedia (Foto o Video)
                          </label>
                          <div className="flex items-center gap-3">
                            <label className="cursor-pointer bg-white border border-dashed border-[#E8E0D0] hover:border-paramo rounded-xl px-4 py-2 text-xs font-semibold text-ink/70 hover:text-paramo transition flex items-center gap-2 shadow-sm">
                              <span>📎</span>
                              <span>{pasoItem.multimedia ? 'Cambiar archivo' : 'Subir foto o video'}</span>
                              <input
                                type="file"
                                accept="image/*,video/*"
                                onChange={(e) => {
                                  const f = e.target.files?.[0]
                                  if (f) handleSubirMultimediaPaso(pasoItem.paso, f)
                                }}
                                className="hidden"
                              />
                            </label>

                            {pasoItem.multimedia && (
                              <div className="flex items-center gap-2 bg-mist px-3 py-1.5 rounded-lg border border-moss/20">
                                {pasoItem.tipoMultimedia === 'video' ? (
                                  <span className="text-xs font-medium text-moss flex items-center gap-1">
                                    🎬 Video cargado
                                  </span>
                                ) : (
                                  <img
                                    src={pasoItem.multimedia}
                                    alt="Vista previa"
                                    className="w-8 h-8 object-cover rounded border border-[#E8E0D0]"
                                  />
                                )}
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPasosNuevaAct((prev) =>
                                      prev.map((p) =>
                                        p.paso === pasoItem.paso
                                          ? { ...p, multimedia: undefined, tipoMultimedia: undefined }
                                          : p
                                      )
                                    )
                                  }
                                  className="text-xs text-red-500 font-bold hover:underline ml-1"
                                >
                                  ✕ Quitar
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-paper p-4 border-t border-[#E8E0D0] flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setModoCreacionActividad('selector')}
                    className="px-5 py-2.5 rounded-full border border-[#E8E0D0] text-xs font-bold text-ink/70 hover:bg-white transition"
                  >
                    Atrás
                  </button>
                  <button
                    type="button"
                    onClick={guardarNuevaActividad}
                    className="px-6 py-2.5 rounded-full bg-paramo text-white text-xs font-bold hover:bg-[#1e3a0f] transition shadow-paper"
                  >
                    ✓ Guardar Actividad
                  </button>
                </div>
              </>
            )}

            {/* VISTA 3: DIVIDIR VIDEO EN PASOS */}
            {modoCreacionActividad === 'video' && (
              <>
                <div ref={modalScrollContainerRef} className="p-6 overflow-y-auto space-y-6 flex-1 scroll-smooth">
                  <div className="flex items-center justify-between pb-2 border-b border-[#E8E0D0]">
                    <button
                      type="button"
                      onClick={() => setModoCreacionActividad('selector')}
                      className="text-xs font-bold text-ink/60 hover:text-ink flex items-center gap-1"
                    >
                      ← Cambiar tipo de actividad
                    </button>
                    <span className="text-xs font-bold text-terracota bg-terracota/10 px-2.5 py-0.5 rounded-full">
                      Video segmentado
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink/70 mb-1.5">
                      Nombre de la Actividad *
                    </label>
                    <input
                      type="text"
                      value={nombreActVideo}
                      onChange={(e) => setNombreActVideo(e.target.value)}
                      placeholder="Ej. Armado del Molino de Viento con Motor"
                      className="w-full bg-paper border border-[#E8E0D0] rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:border-terracota focus:bg-white"
                    />
                  </div>

                  {/* Portada de la actividad */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink/70 mb-1.5">
                      Portada (imagen de presentación)
                    </label>
                    {portadaActVideo ? (
                      <div className="flex items-center gap-3 p-3 bg-paper/60 border border-[#E8E0D0] rounded-xl">
                        <img
                          src={portadaActVideo}
                          alt="Portada"
                          className="w-16 h-16 object-cover rounded-lg border border-[#E8E0D0]"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-ink">Portada cargada</p>
                          <p className="text-[11px] text-ink/50">Se mostrará en la tarjeta de la actividad</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPortadaActVideo(undefined)}
                          className="text-xs text-red-500 font-bold hover:underline shrink-0"
                        >
                          ✕ Quitar
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer border-2 border-dashed border-[#E8E0D0] hover:border-terracota rounded-xl p-4 flex items-center gap-3 bg-white transition">
                        <span className="text-2xl">🖼️</span>
                        <div>
                          <p className="text-xs font-bold text-ink">Subir imagen de portada</p>
                          <p className="text-[11px] text-ink/50">JPG, PNG o WebP recomendado</p>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const f = e.target.files?.[0]
                            if (!f) return
                            const reader = new FileReader()
                            reader.onload = (ev) => setPortadaActVideo(ev.target?.result as string)
                            reader.readAsDataURL(f)
                          }}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {/* Subida y Previsualización del Video con Drag & Drop */}
                  <div
                    className={`p-4 rounded-2xl border transition-colors ${
                      isDraggingVideo
                        ? 'border-terracota bg-terracota/10'
                        : 'bg-paper/60 border-[#E8E0D0]'
                    }`}
                    onDragOver={(e) => {
                      e.preventDefault()
                      if (!isDraggingVideo) setIsDraggingVideo(true)
                    }}
                    onDragLeave={(e) => {
                      // Solo cancelar si salimos del contenedor padre
                      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                        setIsDraggingVideo(false)
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault()
                      setIsDraggingVideo(false)
                      const file = e.dataTransfer.files?.[0]
                      if (file) handleSubirVideoPrincipal(file)
                    }}
                  >
                    <div className="flex items-center justify-between mb-2 pointer-events-none">
                      <label className="text-xs font-bold uppercase tracking-wider text-ink/70">
                        Archivo de Video *
                      </label>
                      <span className="text-[11px] font-semibold text-terracota">
                        Puedes arrastrar y soltar el archivo aquí
                      </span>
                    </div>

                    {!videoFileUrl ? (
                      <label
                        className={`cursor-pointer border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-2 transition text-center ${
                          isDraggingVideo
                            ? 'border-terracota bg-white shadow-lg pointer-events-none'
                            : 'border-[#E8E0D0] hover:border-terracota bg-white'
                        }`}
                      >
                        <span className="text-4xl pointer-events-none">🎬</span>
                        <span className="text-sm font-bold text-ink pointer-events-none">
                          Arrastra tu video aquí o haz clic para seleccionarlo
                        </span>
                        <span className="text-xs text-ink/50 pointer-events-none">Formatos MP4 o WebM · Procesamiento 100% local</span>
                        <input
                          type="file"
                          accept="video/*"
                          onChange={(e) => {
                            const f = e.target.files?.[0]
                            if (f) handleSubirVideoPrincipal(f)
                          }}
                          className="hidden"
                        />
                      </label>
                    ) : (
                      <div className="space-y-3">
                        <div className="aspect-video bg-black rounded-xl overflow-hidden max-h-64 mx-auto relative shadow-inner">
                          <video
                            ref={previewVideoRef}
                            src={videoFileUrl}
                            controls
                            onLoadedMetadata={(e) => {
                              const dur = (e.currentTarget as HTMLVideoElement).duration || 0
                              setVideoDuracion(dur)
                              cambiarCantidadPasosVideo(numPasosVideo)
                            }}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs text-ink/60 bg-white p-2.5 rounded-xl border border-[#E8E0D0]">
                          <span className="flex items-center gap-1.5 font-medium">
                            <span>⏱️ Duración total:</span>
                            <strong className="text-ink font-bold font-mono">
                              {secondsToMmSs(videoDuracion)}
                            </strong>
                            <span className="text-ink/40">({Math.round(videoDuracion)} segundos)</span>
                          </span>
                          <label className="cursor-pointer text-terracota font-bold hover:underline flex items-center gap-1">
                            <span>🔄</span>
                            <span>Cambiar video</span>
                            <input
                              type="file"
                              accept="video/*"
                              onChange={(e) => {
                                const f = e.target.files?.[0]
                                if (f) handleSubirVideoPrincipal(f)
                              }}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Selector de número de pasos */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-ink/70">
                        Número de Pasos en que se dividirá el video
                      </label>
                      <span className="text-xs font-bold text-terracota bg-mist px-2.5 py-0.5 rounded-full">
                        {numPasosVideo} pasos
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={1}
                        max={25}
                        value={numPasosVideo}
                        onChange={(e) => cambiarCantidadPasosVideo(Number(e.target.value))}
                        className="flex-1 accent-terracota"
                      />
                      <input
                        type="number"
                        min={1}
                        max={25}
                        value={numPasosVideo}
                        onChange={(e) => cambiarCantidadPasosVideo(Number(e.target.value))}
                        className="w-16 text-center bg-paper border border-[#E8E0D0] rounded-lg py-1.5 text-sm font-bold outline-none"
                      />
                    </div>
                  </div>

                  {/* Intervalos por paso en formato MM:SS */}
                  <div className="space-y-4 pt-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-display font-bold text-ink text-sm">
                        ⏱️ Intervalos de tiempo por paso (MM:SS)
                      </h4>
                      <span className="text-xs text-ink/50">
                        Formato Minutos:Segundos (ej. 01:30)
                      </span>
                    </div>

                    {segmentosVideo.map((seg) => (
                      <div
                        key={seg.paso}
                        className="p-4 rounded-2xl bg-paper/50 border border-[#E8E0D0] space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold bg-terracota text-white px-2.5 py-1 rounded-full uppercase tracking-wider">
                            Paso {seg.paso}
                          </span>
                          {videoFileUrl && (
                            <button
                              type="button"
                              onClick={() => {
                                // Auto-scroll al reproductor de video arriba
                                if (modalScrollContainerRef.current) {
                                  modalScrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' })
                                }
                                if (previewVideoRef.current) {
                                  previewVideoRef.current.currentTime = seg.start
                                  previewVideoRef.current.play()
                                  const checkEnd = () => {
                                    if (
                                      previewVideoRef.current &&
                                      previewVideoRef.current.currentTime >= seg.end
                                    ) {
                                      previewVideoRef.current.pause()
                                      previewVideoRef.current.removeEventListener('timeupdate', checkEnd)
                                    }
                                  }
                                  previewVideoRef.current.addEventListener('timeupdate', checkEnd)
                                }
                              }}
                              className="text-xs font-bold bg-white text-terracota border border-terracota/30 hover:bg-terracota hover:text-white px-3 py-1 rounded-full transition flex items-center gap-1.5 shadow-sm"
                            >
                              <span>▶</span>
                              <span>
                                Probar tramo ({secondsToMmSs(seg.start)} a {secondsToMmSs(seg.end)})
                              </span>
                            </button>
                          )}
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-ink/60 uppercase mb-1">
                            Instrucción o subtítulo del paso
                          </label>
                          <input
                            type="text"
                            value={seg.texto}
                            onChange={(e) =>
                              setSegmentosVideo((prev) =>
                                prev.map((s) => (s.paso === seg.paso ? { ...s, texto: e.target.value } : s))
                              )
                            }
                            placeholder={`Ej. Medir y recortar la base de cartón`}
                            className="w-full bg-white border border-[#E8E0D0] rounded-xl px-3 py-2 text-xs outline-none focus:border-terracota"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-ink/60 uppercase mb-1">
                              Inicio (MM:SS)
                            </label>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                pattern="[0-9]{1,2}:[0-9]{2}"
                                value={secondsToMmSs(seg.start)}
                                onChange={(e) => {
                                  const val = e.target.value
                                  const sec = parseMmSsToSeconds(val)
                                  setSegmentosVideo((prev) =>
                                    prev.map((s) => (s.paso === seg.paso ? { ...s, start: sec } : s))
                                  )
                                }}
                                placeholder="00:00"
                                className="w-full bg-white border border-[#E8E0D0] rounded-xl px-3 py-2 text-xs font-mono font-bold outline-none focus:border-terracota text-center"
                              />
                              <span className="text-[11px] text-ink/40 font-mono">({seg.start}s)</span>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-ink/60 uppercase mb-1">
                              Fin (MM:SS)
                            </label>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                pattern="[0-9]{1,2}:[0-9]{2}"
                                value={secondsToMmSs(seg.end)}
                                onChange={(e) => {
                                  const val = e.target.value
                                  const sec = parseMmSsToSeconds(val)
                                  setSegmentosVideo((prev) =>
                                    prev.map((s) => (s.paso === seg.paso ? { ...s, end: sec } : s))
                                  )
                                }}
                                placeholder="00:00"
                                className="w-full bg-white border border-[#E8E0D0] rounded-xl px-3 py-2 text-xs font-mono font-bold outline-none focus:border-terracota text-center"
                              />
                              <span className="text-[11px] text-ink/40 font-mono">({seg.end}s)</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-paper p-4 border-t border-[#E8E0D0] flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setModoCreacionActividad('selector')}
                    className="px-5 py-2.5 rounded-full border border-[#E8E0D0] text-xs font-bold text-ink/70 hover:bg-white transition"
                  >
                    Atrás
                  </button>
                  <button
                    type="button"
                    onClick={guardarActividadVideoSegmentado}
                    className="px-6 py-2.5 rounded-full bg-terracota text-white text-xs font-bold hover:bg-[#a65e2a] transition shadow-paper"
                  >
                    ✓ Guardar Video en Pasos
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal de sincronización P2P en el aula */}
      <ModalP2PSync
        isOpen={modalP2pOpen}
        onClose={() => setModalP2pOpen(false)}
        onSyncCompletado={() => {
          cargar()
          cargarActividadesLocales()
        }}
      />
    </Layout>
  )
}
