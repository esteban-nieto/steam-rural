import { useState, useRef, useEffect } from 'react'
import { Layout } from '../../components/Layout'
import { RegistroFinalActividad } from '../../components/RegistroFinalActividad'
import type { Actividad } from '../../services/db'
import { PartyPopper, Wrench } from 'lucide-react'

interface Props {
  actividad: Actividad
  onBack: () => void
}

export function ActividadDinamica({ actividad, onBack }: Props) {
  const [paso, setPaso] = useState(0)
  const [completados, setCompletados] = useState<Set<number>>(new Set())
  const videoRef = useRef<HTMLVideoElement>(null)

  const pasos = actividad.pasos || []
  const total = actividad.numeroPasos || pasos.length || 1
  const pasoActual = pasos[paso]
  const esVideoSegmentado = actividad.tipoActividad === 'video_segmentado' && !!actividad.videoPrincipal

  // El video se pasa a un blob en memoria: así cualquier punto es alcanzable y el salto al
  // inicio del paso no se pierde (antes se reproducía desde el segundo 0 hasta el fin del paso).
  const [videoSrc, setVideoSrc] = useState<string>()
  useEffect(() => {
    if (!esVideoSegmentado || !actividad.videoPrincipal) return
    let cancelado = false
    let objectUrl: string | undefined
    fetch(actividad.videoPrincipal)
      .then((r) => r.blob())
      .then((blob) => {
        if (cancelado) return
        objectUrl = URL.createObjectURL(blob)
        setVideoSrc(objectUrl)
      })
      .catch(() => {
        if (!cancelado) setVideoSrc(actividad.videoPrincipal)
      })
    return () => {
      cancelado = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [esVideoSegmentado, actividad.videoPrincipal])

  const inicioPaso = pasoActual?.videoStart ?? 0
  const finPaso = pasoActual?.videoEnd

  // Salta al inicio del paso solo cuando el video ya conoce su duración.
  useEffect(() => {
    const v = videoRef.current
    if (!esVideoSegmentado || !v || !videoSrc || !pasoActual) return
    const irAlPaso = () => {
      v.currentTime = inicioPaso
      v.play().catch(() => {})
    }
    if (v.readyState >= HTMLMediaElement.HAVE_METADATA) {
      irAlPaso()
      return
    }
    v.addEventListener('loadedmetadata', irAlPaso, { once: true })
    return () => v.removeEventListener('loadedmetadata', irAlPaso)
  }, [paso, esVideoSegmentado, videoSrc])

  const handleTimeUpdate = () => {
    const v = videoRef.current
    if (!esVideoSegmentado || !v || finPaso === undefined) return
    if (v.currentTime >= finPaso - 0.1) {
      v.pause()
    }
  }

  // Si el estudiante pulsa reproducir fuera del tramo del paso, vuelve a su inicio.
  const handlePlay = () => {
    const v = videoRef.current
    if (!esVideoSegmentado || !v) return
    if (v.currentTime < inicioPaso - 0.25 || (finPaso !== undefined && v.currentTime >= finPaso - 0.1)) {
      v.currentTime = inicioPaso
    }
  }

  const marcarSiguiente = () => {
    const n = new Set(completados)
    n.add(paso)
    setCompletados(n)
    if (paso < total - 1) {
      setPaso(paso + 1)
    }
  }

  const progreso = total > 0 ? Math.round(((paso + 1) / total) * 100) : 0

  return (
    <Layout title={actividad.nombre} onBack={onBack}>
      <div className="bg-white rounded-paper border border-[#E8E0D0] shadow-paper overflow-hidden paper-texture">
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <span className="text-[11px] font-bold tracking-[0.14em] uppercase text-white bg-clay px-2.5 py-1 rounded-full">
            Paso {paso + 1} de {total}
          </span>
          <span className="text-[12px] font-bold text-ink/60">{progreso}%</span>
        </div>
        <div className="px-5">
          <div className="w-full bg-paper border border-[#E8E0D0] rounded-full h-2 overflow-hidden">
            <div
              className="bg-paramo h-2 rounded-full transition-all duration-500"
              style={{ width: `${progreso}%` }}
            />
          </div>
        </div>

        <div className="p-5">
          <div className="h-[45vh] min-h-[220px] max-h-[440px] bg-gradient-to-br from-mist/50 to-white rounded-2xl border border-[#E8E0D0] flex items-center justify-center overflow-hidden relative">
            {esVideoSegmentado ? (
              <video
                ref={videoRef}
                src={videoSrc}
                controls
                onTimeUpdate={handleTimeUpdate}
                onPlay={handlePlay}
                className="w-full h-full object-contain p-2"
              />
            ) : pasoActual?.multimedia ? (
              pasoActual.tipoMultimedia === 'video' ? (
                <video
                  src={pasoActual.multimedia}
                  controls
                  className="w-full h-full object-contain p-2"
                />
              ) : (
                <img
                  src={pasoActual.multimedia}
                  alt={`Paso ${paso + 1}`}
                  className="w-full h-full object-contain p-2"
                />
              )
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 text-ink/40">
                <span className="text-4xl"><Wrench className="inline-block w-[1em] h-[1em] align-[-0.125em]" aria-hidden="true" /></span>
                <span className="text-[12px] font-bold tracking-widest uppercase">
                  Paso interactivo
                </span>
              </div>
            )}
          </div>

          <div className="mt-4 p-4 rounded-xl bg-paper/60 border border-[#E8E0D0]">
            <h3 className="font-display font-bold text-ink text-[17px] mb-1">
              Instrucción del Paso {paso + 1}
            </h3>
            <p className="text-[14px] leading-relaxed text-ink/80">
              {pasoActual?.texto || 'Sigue las instrucciones del profesor.'}
            </p>
          </div>

          <div className="flex items-center justify-between gap-3 mt-5">
            <button
              onClick={() => setPaso((p) => Math.max(0, p - 1))}
              disabled={paso === 0}
              className="px-4 py-2.5 rounded-full border border-[#E8E0D0] text-ink/70 font-semibold text-sm hover:bg-paper disabled:opacity-30 disabled:pointer-events-none"
            >
              ← Anterior
            </button>

            {paso < total - 1 ? (
              <button
                onClick={marcarSiguiente}
                className="flex-1 bg-paramo text-white py-2.5 px-5 rounded-full font-bold text-sm hover:bg-[#1e3a0f] transition shadow-paper"
              >
                Completar paso y seguir →
              </button>
            ) : (
              <div className="flex-1 text-center py-2 px-4 bg-moss/20 text-moss font-bold text-sm rounded-full">
                <PartyPopper className="inline-block w-[1em] h-[1em] align-[-0.125em]" aria-hidden="true" /> ¡Has completado todos los pasos!
              </div>
            )}
          </div>

          {paso === total - 1 && (
            <div className="mt-6 pt-5 border-t border-[#E8E0D0] text-center">
              <RegistroFinalActividad actividadId={actividad.id} totalPasos={total} />
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
