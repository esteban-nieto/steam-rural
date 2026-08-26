const EMOJIS = [
  { id: 'feliz', emoji: '😄', label: 'Feliz' },
  { id: 'contento', emoji: '🙂', label: 'Contento' },
  { id: 'neutro', emoji: '😐', label: 'Normal' },
  { id: 'triste', emoji: '😔', label: 'Triste' },
  { id: 'enfado', emoji: '😠', label: 'Molesto' },
]

export function EmotionPicker({ value, onSelect }: { value?: string; onSelect: (id: string) => void }) {
  return (
    <div className="flex gap-2 justify-center flex-wrap">
      {EMOJIS.map((e) => (
        <button
          key={e.id}
          onClick={() => onSelect(e.id)}
          className={`w-14 h-14 rounded-full text-2xl flex items-center justify-center border-2 transition ${
            value === e.id ? 'border-primary bg-green-50 scale-110' : 'border-gray-200 bg-white hover:border-primary'
          }`}
          title={e.label}
        >
          {e.emoji}
        </button>
      ))}
    </div>
  )
}
