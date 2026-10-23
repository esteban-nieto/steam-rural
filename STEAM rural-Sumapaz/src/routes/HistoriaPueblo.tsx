import { useRef, useState, useEffect } from 'react'
import { Layout } from '../components/Layout'

const PARTES = [
  {
    id: 1,
    titulo: 'Parte 1',
    subtitulo: 'El inicio del molino que dio luz al pueblo',
    video: 'historia/pueblo-soleado-parte1.mp4',
    poster: 'historia/pueblo-soleado-poster.jpg',
  },
  {
    id: 2,
    titulo: 'Parte 2',
    subtitulo: 'El tractor',
    video: 'historia/pueblo-soleado-parte2.mp4',
    poster: 'historia/pueblo-soleado-parte2-poster.jpg',
  },
]

export function HistoriaPueblo({ onBack }: { onBack: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [parte, setParte] = useState(1)
  const [canPlay, setCanPlay] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [loading, setLoading] = useState(true)

  const actual = PARTES.find((p) => p.id === parte) || PARTES[0]

  useEffect(() => {
    setCanPlay(false)
    setLoading(true)
    setIsPlaying(false)
    const v = videoRef.current
    if (!v) return
    v.load()
  }, [parte])

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    const onCanPlayThrough = () => {
      setCanPlay(true)
      setLoading(false)
    }
    const onWaiting = () => setLoading(true)
    const onPlaying = () => { setIsPlaying(true); setLoading(false) }
    const onPause = () => setIsPlaying(false)
    const onProgress = () => {
      if (v.buffered.length > 0) {
        const bufferedEnd = v.buffered.end(v.buffered.length - 1)
        if (bufferedEnd >= v.duration - 0.5) setCanPlay(true)
      }
    }
    v.addEventListener('canplaythrough', onCanPlayThrough)
    v.addEventListener('waiting', onWaiting)
    v.addEventListener('playing', onPlaying)
    v.addEventListener('pause', onPause)
    v.addEventListener('progress', onProgress)
    if (v.readyState >= 4) { setCanPlay(true); setLoading(false) }
    return () => {
      v.removeEventListener('canplaythrough', onCanPlayThrough)
      v.removeEventListener('waiting', onWaiting)
      v.removeEventListener('playing', onPlaying)
      v.removeEventListener('pause', onPause)
      v.removeEventListener('progress', onProgress)
    }
  }, [parte])

  const handlePlay = () => {
    const v = videoRef.current
    if (!v || !canPlay) return
    v.play()
  }

  const handleFullscreen = () => {
    const v = videoRef.current as any
    if (!v) return
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    else (v.requestFullscreen ? v.requestFullscreen() : v.webkitEnterFullscreen?.())?.catch?.(() => {})
  }

  return (
    <Layout title="Historia Pueblo Soleado" onBack={onBack}>
      <div className="bg-white rounded-full border border-[#E8E0D0] p-1 flex gap-1 justify-center mb-4 max-w-xs mx-auto">
        {PARTES.map((p) => (
          <button
            key={p.id}
            onClick={() => setParte(p.id)}
            className={`flex-1 px-4 py-2 rounded-full text-[13px] font-bold transition ${parte === p.id ? 'bg-clay text-white shadow-sm' : 'text-ink/60 hover:bg-paper'}`}
          >
            {p.titulo}
          </button>
        ))}
      </div>
      <p className="text-center text-[11px] font-bold tracking-widest uppercase text-ink/40 mb-3">Toca para cambiar de capítulo</p>

      <div className="bg-white rounded-paper border border-[#E8E0D0] shadow-paper overflow-hidden paper-texture">
        <div className="p-4 border-b border-[#E8E0D0] flex items-center gap-2">
          <span className="text-[11px] font-bold tracking-[0.14em] uppercase bg-clay text-white px-2.5 py-1 rounded-full">{actual.titulo}</span>
          <span className="text-[13px] font-medium text-ink/60">{actual.subtitulo}</span>
        </div>

        <div className="p-5">
          <div className="aspect-video bg-black rounded-2xl overflow-hidden relative border border-[#E8E0D0]">
            <video
              key={actual.id}
              ref={videoRef}
              src={`${import.meta.env.BASE_URL}${actual.video}`}
              poster={`${import.meta.env.BASE_URL}${actual.poster}`}
              preload="auto"
              playsInline
              controls={false}
              className="w-full h-full object-contain bg-black"
            />
            {loading && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                <div className="w-10 h-10 border-3 border-white/20 border-t-white rounded-full animate-spin" style={{ borderWidth: '3px' }} />
                <p className="text-white text-[12px] font-semibold tracking-wide">Cargando historia...</p>
                <p className="text-white/60 text-[11px]">Se habilitará Reproducir al terminar</p>
              </div>
            )}
            {!loading && !isPlaying && canPlay && (
              <button
                onClick={handlePlay}
                className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition"
                aria-label="Reproducir historia"
              >
                <span className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center text-2xl shadow-lg">▶</span>
              </button>
            )}
          </div>

          <div className="flex gap-2 justify-center mt-5 flex-wrap">
            <button
              onClick={handlePlay}
              disabled={!canPlay}
              className="px-6 py-2.5 rounded-full bg-paramo text-white font-bold text-[13px] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#1e3a0f] focus-visible:ring-2 focus-visible:ring-terracota"
            >
              {canPlay ? '▶ Reproducir' : 'Cargando...'}
            </button>
            {isPlaying && (
              <button
                onClick={() => videoRef.current?.pause()}
                className="px-6 py-2.5 rounded-full bg-white border border-[#E8E0D0] text-[13px] font-semibold hover:bg-paper"
              >
                Pausar
              </button>
            )}
            <button
              onClick={handleFullscreen}
              disabled={!canPlay}
              className="px-5 py-2.5 rounded-full bg-white border border-[#E8E0D0] text-[13px] font-semibold hover:bg-paper disabled:opacity-40 flex items-center gap-1.5"
              aria-label="Pantalla completa"
            >
              ⛶ Pantalla completa
            </button>
          </div>

          {!canPlay && <p className="text-center text-[11px] text-ink/40 mt-2">El video se está descargando para reproducirse sin cortes offline.</p>}
        </div>
      </div>

      <p className="text-center text-[11px] text-ink/30 mt-4">Más partes próximamente.</p>
    </Layout>
  )
}
