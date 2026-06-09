import React from 'react'

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-[#161B22] border border-[#30363D] rounded-xl p-4 ${className}`}>
      {children}
    </div>
  )
}

// ─── Section title ────────────────────────────────────────────────────────────
export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xs font-semibold uppercase tracking-widest text-[#8B949E] mb-3">{children}</h2>
}

// ─── Stat tile ────────────────────────────────────────────────────────────────
interface StatTileProps {
  label: string
  value: string | number
  sub?: string
  color?: 'green' | 'red' | 'neutral' | 'violet'
  mono?: boolean
}
export function StatTile({ label, value, sub, color = 'neutral', mono = true }: StatTileProps) {
  const colMap = {
    green: 'text-emerald-400',
    red: 'text-red-400',
    neutral: 'text-[#F0F6FC]',
    violet: 'text-violet-400',
  }
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-[#8B949E] uppercase tracking-wider">{label}</span>
      <span className={`${mono ? 'font-mono' : 'font-semibold'} text-lg leading-none ${colMap[color]}`}>{value}</span>
      {sub && <span className="text-xs text-[#8B949E]">{sub}</span>}
    </div>
  )
}

// ─── Badge ────────────────────────────────────────────────────────────────────
export function Badge({ children, variant = 'neutral' }: {
  children: React.ReactNode
  variant?: 'green' | 'red' | 'violet' | 'neutral' | 'amber'
}) {
  const cls = {
    green: 'bg-emerald-900/50 text-emerald-400 border-emerald-800',
    red: 'bg-red-900/50 text-red-400 border-red-800',
    violet: 'bg-violet-900/50 text-violet-400 border-violet-800',
    neutral: 'bg-[#21262D] text-[#8B949E] border-[#30363D]',
    amber: 'bg-amber-900/50 text-amber-400 border-amber-800',
  }[variant]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border font-medium ${cls}`}>
      {children}
    </span>
  )
}

// ─── Button ───────────────────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md'
}
export function Button({ children, variant = 'primary', size = 'md', className = '', ...rest }: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-violet-500/50 disabled:opacity-40 disabled:cursor-not-allowed'
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm' }
  const variants = {
    primary: 'bg-violet-600 hover:bg-violet-500 text-white',
    secondary: 'bg-[#21262D] hover:bg-[#30363D] text-[#F0F6FC] border border-[#30363D]',
    danger: 'bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-800',
    ghost: 'hover:bg-[#21262D] text-[#8B949E] hover:text-[#F0F6FC]',
  }
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </button>
  )
}

// ─── Input ────────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}
export function Input({ label, error, className = '', ...rest }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs text-[#8B949E] uppercase tracking-wider">{label}</label>}
      <input
        className={`bg-[#0D1117] border ${error ? 'border-red-600' : 'border-[#30363D]'} rounded-lg px-3 py-2 text-sm text-[#F0F6FC] placeholder-[#484F58] focus:outline-none focus:border-violet-500 transition-colors ${className}`}
        {...rest}
      />
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  )
}

// ─── Select ───────────────────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
}
export function Select({ label, children, className = '', ...rest }: SelectProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs text-[#8B949E] uppercase tracking-wider">{label}</label>}
      <select
        className={`bg-[#0D1117] border border-[#30363D] rounded-lg px-3 py-2 text-sm text-[#F0F6FC] focus:outline-none focus:border-violet-500 transition-colors ${className}`}
        {...rest}
      >
        {children}
      </select>
    </div>
  )
}

// ─── Textarea ─────────────────────────────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  hint?: string
}
export function Textarea({ label, hint, className = '', ...rest }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs text-[#8B949E] uppercase tracking-wider">{label}</label>}
      {hint && <span className="text-xs text-[#484F58]">{hint}</span>}
      <textarea
        className={`bg-[#0D1117] border border-[#30363D] rounded-lg px-3 py-2 text-sm text-[#F0F6FC] font-mono placeholder-[#484F58] focus:outline-none focus:border-violet-500 transition-colors resize-none ${className}`}
        {...rest}
      />
    </div>
  )
}

// ─── Toggle ───────────────────────────────────────────────────────────────────
export function Toggle({ checked, onChange, label }: {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500/50 ${checked ? 'bg-violet-600' : 'bg-[#30363D]'}`}
      >
        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
      </button>
      {label && <span className="text-sm text-[#8B949E]">{label}</span>}
    </label>
  )
}

// ─── P&L color helper ─────────────────────────────────────────────────────────
export function pnlColor(val: number) {
  if (val > 0) return 'text-emerald-400'
  if (val < 0) return 'text-red-400'
  return 'text-[#8B949E]'
}

export function pnlStr(val: number) {
  return `${val >= 0 ? '+' : ''}₹${Math.abs(val).toLocaleString()}`
}

// ─── Empty state ──────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, sub }: { icon: string; title: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <span className="text-4xl">{icon}</span>
      <p className="text-[#F0F6FC] font-medium">{title}</p>
      {sub && <p className="text-xs text-[#8B949E] max-w-xs">{sub}</p>}
    </div>
  )
}

// ─── Insight level colors ─────────────────────────────────────────────────────
export function insightStyle(level: 'info' | 'warning' | 'danger') {
  return {
    info: { bar: 'bg-violet-500', text: 'text-violet-300', bg: 'bg-violet-900/20 border-violet-800' },
    warning: { bar: 'bg-amber-500', text: 'text-amber-300', bg: 'bg-amber-900/20 border-amber-800' },
    danger: { bar: 'bg-red-500', text: 'text-red-300', bg: 'bg-red-900/20 border-red-800' },
  }[level]
}
