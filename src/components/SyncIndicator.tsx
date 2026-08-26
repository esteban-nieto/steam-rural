import { useEffect, useState } from 'react'

export function SyncIndicator() {
  const [status, setStatus] = useState<'online' | 'offline' | 'syncing'>('online')

  useEffect(() => {
    const update = () => setStatus(navigator.onLine ? 'online' : 'offline')
    update()
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])

  const cfg = {
    online: { label: 'Sincronizado', dot: 'bg-moss', bg: 'bg-mist border-moss/20 text-paramo' },
    offline: { label: 'Sin conexión · guardado local', dot: 'bg-terracota', bg: 'bg-[#FEF3E2] border-terracota/20 text-ink' },
    syncing: { label: 'Sincronizando...', dot: 'bg-amber-400 animate-pulse', bg: 'bg-amber-50 border-amber-200 text-ink' },
  }[status]

  return (
    <span
      role="status"
      aria-live="polite"
      aria-label={cfg.label}
      className={`inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wide border px-2.5 py-1 rounded-full ${cfg.bg}`}
    >
      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} aria-hidden="true" />
      {cfg.label}
    </span>
  )
}
