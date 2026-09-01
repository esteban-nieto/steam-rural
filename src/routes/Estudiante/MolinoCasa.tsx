import { useRef, useState, useEffect } from 'react'
import { Layout } from '../../components/Layout'

type Checkpoint = { id: number; start: number; end: number; label: string }

const CHECKPOINTS: Checkpoint[] = [
  { id: 1, start: 8, end: 10, label: 'Paso 1' },
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
              poster={`${import.meta.env.BASE_URL}videos/molino-casa-poster.jpg`}
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
              <button
                onClick={() => {
                  const v = videoRef.current
                  if (v) {
                    v.currentTime = cp.start
                    v.play()
                  }
                }}
                className="px-6 py-2.5 rounded-full bg-paramo text-white font-bold text-[13px] hover:bg-[#1e3a0f]"
              >
                Completar
              </button>
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

      <p className="text-center text-[11px] text-ink/40 mt-4">Video se pausa automáticamente al final del paso. Usa Repetir para verlo de nuevo.</p>
    </Layout>
  )
}
