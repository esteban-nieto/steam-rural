type CardProps = {
  title: string
  description?: string
  image?: string
  onClick?: () => void
  badge?: string
  meta?: string
}

export function Card({ title, description, image, onClick, badge, meta }: CardProps) {
  return (
    <button
      onClick={onClick}
      className="group text-left w-full bg-white rounded-paper border border-[#E8E0D0] shadow-paper hover:shadow-lift hover:-translate-y-1 transition-all duration-300 overflow-hidden fold-corner"
    >
      <div className="h-36 bg-gradient-to-br from-mist to-white relative overflow-hidden flex items-center justify-center">
        {image ? (
          <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-[1.02] transition duration-500" />
        ) : (
          <div className="text-5xl opacity-80 group-hover:scale-110 transition duration-300">📄</div>
        )}
        {badge && <span className="absolute top-3 left-3 bg-clay text-white text-[11px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full">{badge}</span>}
      </div>
      <div className="p-4">
        <h3 className="font-display font-bold text-ink text-[17px] leading-tight">{title}</h3>
        {description && <p className="text-[13px] leading-relaxed text-ink/60 mt-1">{description}</p>}
        {meta && <p className="text-[11px] font-semibold tracking-widest uppercase text-moss mt-2">{meta}</p>}
      </div>
    </button>
  )
}
