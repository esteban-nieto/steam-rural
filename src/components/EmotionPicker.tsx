const EMOJIS = [
  { id: 'feliz', emoji: '😄', label: 'Feliz' },
  { id: 'contento', emoji: '🙂', label: 'Bien' },
  { id: 'neutro', emoji: '😐', label: 'Normal' },
  { id: 'triste', emoji: '😔', label: 'Triste' },
  { id: 'enfado', emoji: '😠', label: 'Molesto' },
] as const

export function EmotionPicker({ value, onSelect }: { value?: string; onSelect: (id: string) => void }) {
  return (
    <div role="radiogroup" aria-label="Selecciona cómo te sientes" className="flex gap-2 sm:gap-3 justify-center flex-wrap">
      {EMOJIS.map((e) => {
        const selected = value === e.id
        return (
          <button
            key={e.id}
            role="radio"
            aria-checked={selected}
            aria-label={e.label}
            onClick={() => onSelect(e.id)}
            onKeyDown={(ev) => {
              if (ev.key === 'Enter' || ev.key === ' ') {
                ev.preventDefault()
                onSelect(e.id)
              }
            }}
            className={`group flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-all duration-200 focus-visible:ring-2 focus-visible:ring-terracota focus-visible:outline-none ${selected ? 'bg-white shadow-paper scale-105 ring-2 ring-paramo/20' : 'hover:bg-white/60'}`}
          >
            <span
              aria-hidden="true"
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-2xl border-2 transition ${selected ? 'border-paramo bg-white' : 'border-transparent bg-white/80'}`}
              style={{ background: selected ? '#fff' : '#fff' }}
            >
              {e.emoji}
            </span>
            <span className={`text-[11px] font-semibold tracking-wide ${selected ? 'text-paramo' : 'text-ink/50'}`}>{e.label}</span>
          </button>
        )
      })}
    </div>
  )
}
