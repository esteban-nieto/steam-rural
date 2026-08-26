const EMOJIS = [
  { id: 'feliz', emoji: '😄', label: 'Feliz', color: '#fef3c7' },
  { id: 'contento', emoji: '🙂', label: 'Bien', color: '#dcfce7' },
  { id: 'neutro', emoji: '😐', label: 'Normal', color: '#f3f4f6' },
  { id: 'triste', emoji: '😔', label: 'Triste', color: '#dbeafe' },
  { id: 'enfado', emoji: '😠', label: 'Molesto', color: '#fee2e2' },
]

export function EmotionPicker({ value, onSelect }: { value?: string; onSelect: (id: string) => void }) {
  return (
    <div className="flex gap-2 sm:gap-3 justify-center flex-wrap">
      {EMOJIS.map((e) => (
        <button
          key={e.id}
          onClick={() => onSelect(e.id)}
          className={`group flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-all duration-200 ${value === e.id ? 'bg-white shadow-paper scale-105 ring-2 ring-paramo/20' : 'hover:bg-white/60'}`}
        >
          <span
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-2xl border-2 transition ${value === e.id ? 'border-paramo bg-white' : 'border-transparent'}`}
            style={{ background: value === e.id ? '#fff' : e.color }}
          >
            {e.emoji}
          </span>
          <span className={`text-[11px] font-semibold tracking-wide ${value === e.id ? 'text-paramo' : 'text-ink/50'}`}>{e.label}</span>
        </button>
      ))}
    </div>
  )
}
