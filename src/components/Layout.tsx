import type { ReactNode } from 'react'

export function Layout({ children, title, onBack }: { children: ReactNode; title?: string; onBack?: () => void }) {
  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-[#E8E0D0]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-[56px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button onClick={onBack} className="w-8 h-8 rounded-full bg-white border border-[#E8E0D0] flex items-center justify-center hover:bg-mist transition text-ink">
                ←
              </button>
            )}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-paramo flex items-center justify-center text-white text-[16px]">◈</div>
              <span className="font-display font-bold text-[18px] tracking-tight text-ink">STEAM Rural</span>
              <span className="hidden sm:inline text-[11px] font-semibold tracking-widest uppercase text-moss border border-moss/20 px-2 py-1 rounded-full">Sumapaz</span>
            </div>
          </div>
          {title && <span className="font-display font-semibold text-paramo text-sm hidden sm:block">{title}</span>}
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">{children}</main>
    </div>
  )
}
