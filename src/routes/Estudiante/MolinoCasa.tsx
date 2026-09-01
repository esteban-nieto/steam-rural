import { useRef, useState, useEffect } from 'react'
import { Layout } from '../../components/Layout'

type Checkpoint = { id: number; start: number; end: number; label: string }

const CHECKPOINTS: Checkpoint[] = [
  { id: 1, start: 8, end: 10, label: 'Paso 1' },
  { id: 2, start: 10, end: 14, label: 'Paso 2' },
  { id: 3, start: 20, end: 33, label: 'Paso 3' },
  { id: 4, start: 34, end: 46, label: 'Paso 4' },
  { id: 5, start: 47, end: 64, label: 'Paso 5' },
  { id: 6, start: 65, end: 85, label: 'Paso 6' },
  { id: 7, start: 86, end: 99, label: 'Paso 7' },
  { id: 8, start: 100, end: 105, label: 'Paso 8' },
  { id: 9, start: 128, end: 152, label: 'Paso 9' },
  { id: 10, start: 153, end: 178, label: 'Paso 10' },
  { id: 11, start: 179, end: 185, label: 'Paso 11' },
  { id: 12, start: 188, end: 189, label: 'Paso 12' },
  { id: 13, start: 190, end: 237, label: 'Paso 13' },
  { id: 14, start: 239, end: 279, label: 'Paso 14' },
  { id: 15, start: 280, end: 291, label: 'Paso 15' },
  { id: 16, start: 292, end: 326, label: 'Paso 16' },
  { id: 17, start: 327, end: 358, label: 'Paso 17' },
  { id: 18, start: 359, end: 391, label: 'Paso 18' },
  { id: 19, start: 392, end: 408, label: 'Paso 19' },
  { id: 20, start: 428, end: 435, label: 'Paso 20' },
]

function formatTime(s: number) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

export function MolinoCasa({ onBack }: { onBack: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [idx, setIdx] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [completado, setCompletado] = useState(false)
  const cp = CHECKPOINTS[idx]
  const total = CHECKPOINTS.length

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    v.pause()
    v.currentTime = cp.start
  }, [idx])

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    const onTimeUpdate = () => {
      if (v.currentTime >= cp.end - 0.15) {
        v.pause()
        setIsPlaying(false)
      }
    }
    v.addEventListener('timeupdate', onTimeUpdate)
    return () => v.removeEventListener('timeupdate', onTimeUpdate)
  }, [cp])

  const goPrev = () => {
    if (idx > 0) setIdx(idx - 1)
  }
  const goNext = () => {
    if (idx < total - 1) setIdx(idx + 1)
  }
  const doRepeat = () => {
    const v = videoRef.current
    if (!v) return
    v.currentTime = cp.start
    v.play()
    setIsPlaying(true)
  }

  const handlePlayPause = () => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) {
      if (v.currentTime < cp.start || v.currentTime >= cp.end) v.currentTime = cp.start
      v.play()
      setIsPlaying(true)
    } else {
      v.pause()
      setIsPlaying(false)
    }
  }

  return (
    <Layout title="Molino + Casa" onBack={onBack}>
      <div className="bg-white rounded-paper border border-[#E8E0D0] shadow-paper overflow-hidden paper-texture">
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <span className="text-[11px] font-bold tracking-[0.14em] uppercase text-white bg-terracota px-2.5 py-1 rounded-full">
            Paso {cp.id} de {total}
          </span>
          <span className="text-[11px] font-medium text-ink/60">
            {formatTime(cp.start)} → {formatTime(cp.end)}
          </span>
        </div>

        <div className="px-5">
          <div className="w-full bg-paper border border-[#E8E0D0] rounded-full h-2 overflow-hidden">
            <div className="bg-paramo h-2 rounded-full transition-all" style={{ width: `${((idx + 1) / total) * 100}%` }} />
          </div>
        </div>

        <div className="p-5">
          <div className="aspect-video bg-black rounded-2xl overflow-hidden relative border border-[#E8E0D0]">
            <video
              ref={videoRef}
              src={`${import.meta.env.BASE_URL}videos/molino-casa.mp4`}
              poster={`${import.meta.env.BASE_URL}videos/Portada.png`}
              preload="metadata"
              playsInline
              className="w-full h-full object-contain bg-black"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
          </div>
          <p className="text-center text-[11px] font-bold tracking-widest uppercase text-moss mt-3">{cp.label}</p>

          <div className="flex gap-2 justify-center mt-4">
            <button
              onClick={goPrev}
              disabled={idx === 0}
              className="px-5 py-2.5 rounded-full border border-[#E8E0D0] bg-white text-[13px] font-semibold disabled:opacity-30 hover:bg-paper focus-visible:ring-2 focus-visible:ring-terracota"
            >
              ← Anterior
            </button>
            <button
              onClick={doRepeat}
              className="px-5 py-2.5 rounded-full bg-white border border-[#E8E0D0] text-[13px] font-semibold hover:bg-paper focus-visible:ring-2 focus-visible:ring-terracota"
            >
              Repetir
            </button>
            {idx === total - 1 ? (
              completado ? (
                <span className="px-6 py-2.5 rounded-full bg-mist text-paramo border border-moss/20 font-bold text-[13px]">✓ Completado</span>
              ) : (
                <button
                  onClick={() => {
                    setCompletado(true)
                    const v = videoRef.current
                    if (v) v.pause()
                  }}
                  className="px-6 py-2.5 rounded-full bg-paramo text-white font-bold text-[13px] hover:bg-[#1e3a0f]"
                >
                  Completar
                </button>
              )
            ) : (
              <button
                onClick={goNext}
                className="px-5 py-2.5 rounded-full bg-paramo text-white text-[13px] font-semibold hover:bg-[#1e3a0f] focus-visible:ring-2 focus-visible:ring-terracota"
              >
                Siguiente →
              </button>
            )}
          </div>

          <button
            onClick={handlePlayPause}
            className="mx-auto mt-3 flex items-center gap-2 text-[12px] font-semibold text-ink/60 hover:text-ink"
          >
            <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-moss animate-pulse' : 'bg-ink/20'}`} />
            {isPlaying ? 'Reproduciendo...' : 'Pausado — espera tu acción'}
          </button>
        </div>
      </div>

      {completado && (
        <div className="bg-white rounded-paper border border-[#E8E0D0] shadow-paper p-6 mt-4 text-center paper-texture">
          <p className="text-3xl mb-2">🎉</p>
          <h3 className="font-display font-bold text-[18px] text-ink">¡Molino y casa terminados!</h3>
          <p className="text-[13px] text-ink/60 mt-2">Así debe quedar tu proyecto:</p>
          <img src={`${import.meta.env.BASE_URL}videos/Portada.png`} alt="Molino y casa terminados - referencia final" className="w-full max-w-sm mx-auto mt-4 rounded-2xl border border-[#E8E0D0] object-contain" />
        </div>
      )}

      <p className="text-center text-[11px] text-ink/40 mt-4">Video se pausa automáticamente al final del paso. Usa Repetir para verlo de nuevo.</p>
    </Layout>
  )
}
