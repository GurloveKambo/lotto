import React from 'react'

type Page = 'dashboard' | 'entry' | 'strategies' | 'reports' | 'settings'

interface LayoutProps {
  page: Page
  setPage: (p: Page) => void
  children: React.ReactNode
}

const NAV_ITEMS: { id: Page; label: string; icon: React.ReactNode }[] = [
  {
    id: 'dashboard',
    label: 'Home',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" /><path d="M9 21V12h6v9" />
      </svg>
    ),
  },
  {
    id: 'entry',
    label: 'Entry',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <circle cx="12" cy="12" r="9" /><path d="M12 8v4m0 4h.01" strokeLinecap="round" />
        <path d="M12 8v8M8 12h8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'strategies',
    label: 'Strategies',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <path d="M3 3v18h18" strokeLinecap="round" /><path d="M7 16l4-5 4 3 4-7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" strokeLinecap="round" />
      </svg>
    ),
  },
]

export function Layout({ page, setPage, children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-[#0D1117] text-[#F0F6FC] flex flex-col max-w-2xl mx-auto">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-[#0D1117]/95 backdrop-blur border-b border-[#21262D] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-violet-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold">₹</span>
          </div>
          <span className="font-semibold text-sm tracking-tight">Lotto Tracker</span>
        </div>
        <span className="text-xs text-[#484F58] font-mono">
          {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
      </header>

      {/* Page content */}
      <main className="flex-1 overflow-y-auto pb-24">
        {children}
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-2xl z-50 bg-[#0D1117]/95 backdrop-blur border-t border-[#21262D] flex">
        {NAV_ITEMS.map(item => {
          const active = page === item.id
          return (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 transition-colors ${
                active ? 'text-violet-400' : 'text-[#484F58] hover:text-[#8B949E]'
              }`}
            >
              {item.icon}
              <span className="text-[10px] font-medium">{item.label}</span>
              {active && <span className="absolute bottom-0 w-10 h-0.5 bg-violet-500 rounded-t-full" />}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
