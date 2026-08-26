export function Crane({ className = 'w-full h-full' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 160" className={className} role="img" aria-label="Conejo de origami en papel reciclado">
      <defs>
        <linearGradient id="paperGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F5EDE0" />
        </linearGradient>
        <filter id="softShadow">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#2D5016" floodOpacity="0.12" />
        </filter>
      </defs>
      <g filter="url(#softShadow)">
        <path d="M100 18 L148 58 L132 72 L100 48 L68 72 L52 58 Z" fill="url(#paperGrad)" stroke="#E8E0D0" strokeWidth="1.2" />
        <path d="M68 72 L100 48 L100 118 L68 72" fill="#FFFFFF" stroke="#E8E0D0" strokeWidth="1" />
        <path d="M132 72 L100 48 L100 118 L132 72" fill="#FDF8F0" stroke="#E8E0D0" strokeWidth="1" />
        <path d="M52 58 L28 88 L52 88 L68 72 L52 58" fill="#FFFFFF" stroke="#E8E0D0" strokeWidth="1" />
        <path d="M148 58 L172 88 L148 88 L132 72 L148 58" fill="#FDF8F0" stroke="#E8E0D0" strokeWidth="1" />
        <path d="M100 118 L84 138 L100 128 L116 138 Z" fill="url(#paperGrad)" stroke="#E8E0D0" strokeWidth="1" />
        <path d="M100 48 L100 118" stroke="#E8E0D0" strokeWidth="0.8" strokeDasharray="4 3" opacity="0.7" />
        <path d="M68 72 L132 72" stroke="#E8E0D0" strokeWidth="0.6" opacity="0.5" />
      </g>
      <g opacity="0.06">
        <path d="M40 40 L60 40 M140 120 L160 120 M30 100 L50 100" stroke="#2D5016" strokeWidth="1" strokeLinecap="round" />
      </g>
    </svg>
  )
}
