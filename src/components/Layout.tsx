import type { ReactNode } from 'react'

export function Layout({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="font-bold text-primary text-lg">STEAM Rural</h1>
          {title && <span className="text-sm text-gray-500">{title}</span>}
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
