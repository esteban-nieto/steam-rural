type CardProps = {
  title: string
  description?: string
  image?: string
  onClick?: () => void
  badge?: string
  meta?: string
  progress?: number
  state?: 'pendiente' | 'en_progreso' | 'completado'
}

export function Card({ title, description, image, onClick, badge, meta, progress, state }: CardProps) {
  const isCompleted = state === 'completado'
  return (
    <button
      onClick={onClick}
      aria-label={`${title} — ${state ?? 'pendiente'}`}
      className="group text-left w-full bg-white rounded-paper border border-[#E8E0D0] shadow-paper hover:shadow-lift hover:-translate-y-1 transition-all duration-300 overflow-hidden fold-corner focus-visible:ring-2 focus-visible:ring-terracota focus-visible:outline-none"
    >
      <div className="h-36 bg-gradient-to-br from-mist to-white relative overflow-hidden flex items-center justify-center">
        {image ? (
          <img src={image} alt="" className="w-full h-full object-cover group-hover:scale-[1.02] transition duration-500" aria-hidden="true" />
        ) : (
          <div className="text-5xl opacity-80 group-hover:scale-110 transition duration-300" aria-hidden="true">
            📄
          </div>
        )}
        {badge && (
          <span className="absolute top-3 left-3 bg-terracota text-white text-[11px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full">{badge}</span>
        )}
        {isCompleted && <span className="absolute top-3 right-8 bg-moss text-white text-[11px] font-bold px-2 py-1 rounded-full">✓ Completado</span>}
      </div>
      <div className="p-4">
        <h3 className="font-display font-bold text-ink text-[17px] leading-tight">{title}</h3>
        {description && <p className="text-[13px] leading-relaxed text-ink/60 mt-1">{description}</p>}
        {typeof progress === 'number' && (
          <div className="mt-3">
            <div className="w-full bg-paper border border-[#E8E0D0] rounded-full h-1.5 overflow-hidden" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
              <div className="bg-paramo h-full rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-[11px] font-semibold text-ink/50 mt-1 inline-block">{progress}% completado</span>
          </div>
        )}
        {meta && !progress && <p className="text-[11px] font-semibold tracking-widest uppercase text-moss mt-2">{meta}</p>}
      </div>
    </button>
  )
}
