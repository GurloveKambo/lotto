import React, { useState } from 'react'
import { useStore } from '../store/useStore'
import { Card, SectionTitle, Button, Input, Select, Toggle, Badge, pnlColor, pnlStr } from '../components/ui'
import { useAnalytics } from '../store/useStore'
import { StrategyId, STRATEGY_IDS, DEFAULT_S3_DATES } from '../types'

// ─── Number grid editor ───────────────────────────────────────────────────────
function NumberGrid({
  selected,
  onChange,
}: {
  selected: number[]
  onChange: (nums: number[]) => void
}) {
  const toggle = (n: number) => {
    if (selected.includes(n)) {
      onChange(selected.filter(x => x !== n))
    } else if (selected.length < 36) {
      onChange([...selected, n].sort((a, b) => a - b))
    }
  }
  const remaining = 36 - selected.length

  return (
    <div>
      <p className="text-xs text-[#8B949E] mb-2">
        Select exactly 36 numbers &nbsp;
        <span className={remaining === 0 ? 'text-emerald-400' : 'text-amber-400'}>
          ({selected.length}/36 selected)
        </span>
      </p>
      <div className="grid grid-cols-10 gap-1">
        {Array.from({ length: 100 }, (_, i) => {
          const isSelected = selected.includes(i)
          return (
            <button
              key={i}
              onClick={() => toggle(i)}
              className={`aspect-square rounded text-xs font-mono transition-all focus:outline-none ${
                isSelected
                  ? 'bg-violet-600 text-white font-bold'
                  : remaining === 0
                  ? 'bg-[#0D1117] text-[#484F58] cursor-not-allowed'
                  : 'bg-[#21262D] text-[#8B949E] hover:bg-[#30363D] hover:text-[#F0F6FC]'
              }`}
              disabled={!isSelected && remaining === 0}
            >
              {i.toString().padStart(2, '0')}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── S3 date picker ───────────────────────────────────────────────────────────
function S3DatePicker({ dates, onChange }: { dates: number[]; onChange: (d: number[]) => void }) {
  const toggle = (d: number) => {
    onChange(dates.includes(d) ? dates.filter(x => x !== d) : [...dates, d].sort((a, b) => a - b))
  }
  return (
    <div>
      <p className="text-xs text-[#8B949E] mb-2">Active on these dates ({dates.length} selected)</p>
      <div className="grid grid-cols-8 gap-1">
        {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
          <button
            key={d}
            onClick={() => toggle(d)}
            className={`aspect-square rounded text-xs font-mono transition-all ${
              dates.includes(d)
                ? 'bg-violet-600 text-white font-bold'
                : 'bg-[#21262D] text-[#8B949E] hover:bg-[#30363D]'
            }`}
          >
            {d}
          </button>
        ))}
      </div>
      <button
        onClick={() => onChange([...DEFAULT_S3_DATES])}
        className="mt-2 text-xs text-violet-400 hover:underline"
      >
        Reset to default (12 dates)
      </button>
    </div>
  )
}

// ─── Strategy card ────────────────────────────────────────────────────────────
function StrategyCard({ id }: { id: StrategyId }) {
  const { strategies, updateStrategy, resetStrategyBet, resetStrategyCycle } = useStore()
  const { strategySummaries } = useAnalytics()
  const cfg = strategies.find(s => s.id === id)!
  const summary = strategySummaries.find(s => s.strategy === id)

  const [expanded, setExpanded] = useState(false)
  const [tab, setTab] = useState<'numbers' | 'settings'>('numbers')

  const isTrigger = ['S4', 'S5', 'S6', 'S7', 'S8'].includes(id)
  const betMult = cfg.betLevel / 10

  return (
    <Card className="space-y-3">
      {/* Header row */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-[#21262D] flex items-center justify-center">
          <span className="font-bold text-violet-400">{id}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{id}</span>
            {isTrigger && cfg.cycleRemaining > 0 && (
              <Badge variant="amber">Cycle: {cfg.cycleRemaining} left</Badge>
            )}
            {summary && (
              <span className={`ml-auto text-xs font-mono ${pnlColor(summary.pnl)}`}>
                {pnlStr(summary.pnl)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-[#8B949E]">
              {id === 'S1' && 'Always active'}
              {id === 'S2' && 'Day 1, 2, last 2 of month'}
              {id === 'S3' && `${cfg.s3Dates.length} fixed dates/month`}
              {isTrigger && `Trigger cycle · ${cfg.cycleLength} games`}
            </span>
            <Badge variant={cfg.betLevel >= 80 ? 'red' : cfg.betLevel >= 40 ? 'amber' : 'green'}>
              ₹{cfg.betLevel}
            </Badge>
          </div>
        </div>
        <Toggle checked={cfg.enabled} onChange={v => updateStrategy(id, { enabled: v })} />
      </div>

      {/* Quick stats */}
      {summary && (
        <div className="grid grid-cols-4 gap-2 bg-[#0D1117] rounded-lg p-2">
          {[
            { l: 'Bets', v: summary.bets },
            { l: 'Wins', v: summary.wins },
            { l: 'ROI', v: `${summary.roi.toFixed(1)}%` },
            { l: 'Score', v: summary.score.toFixed(1) },
          ].map(x => (
            <div key={x.l} className="text-center">
              <div className="text-xs text-[#484F58]">{x.l}</div>
              <div className="text-xs font-mono text-[#F0F6FC]">{x.v}</div>
            </div>
          ))}
        </div>
      )}

      {/* Expand/collapse */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full text-xs text-violet-400 hover:text-violet-300 transition-colors text-left"
      >
        {expanded ? '▲ Hide editor' : '▼ Edit strategy'}
      </button>

      {expanded && (
        <div className="space-y-4 pt-2 border-t border-[#21262D]">
          {/* Tabs */}
          <div className="flex gap-1 bg-[#0D1117] rounded-lg p-0.5">
            {['numbers', 'settings'].map(t => (
              <button
                key={t}
                onClick={() => setTab(t as any)}
                className={`flex-1 py-1.5 text-xs rounded-md transition-all ${tab === t ? 'bg-[#21262D] text-[#F0F6FC]' : 'text-[#484F58]'}`}
              >
                {t === 'numbers' ? '# Numbers' : '⚙ Settings'}
              </button>
            ))}
          </div>

          {tab === 'numbers' && (
            <NumberGrid
              selected={cfg.numbers}
              onChange={nums => updateStrategy(id, { numbers: nums })}
            />
          )}

          {tab === 'settings' && (
            <div className="space-y-3">
              {id === 'S3' && (
                <S3DatePicker
                  dates={cfg.s3Dates}
                  onChange={dates => updateStrategy(id, { s3Dates: dates })}
                />
              )}

              {isTrigger && (
                <Select
                  label="Cycle Length"
                  value={cfg.cycleLength}
                  onChange={e => updateStrategy(id, { cycleLength: parseInt(e.target.value) as 8 | 12 })}
                >
                  <option value={8}>8 games</option>
                  <option value={12}>12 games</option>
                </Select>
              )}

              {/* Bet & cycle resets */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => resetStrategyBet(id)}
                >
                  Reset bet to ₹10
                </Button>
                {isTrigger && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => resetStrategyCycle(id)}
                  >
                    End cycle
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function Strategies() {
  const { strategySummaries } = useAnalytics()
  const [filter, setFilter] = useState<'all' | 'enabled' | 'disabled'>('all')
  const { strategies } = useStore()

  const filtered = STRATEGY_IDS.filter(id => {
    const cfg = strategies.find(s => s.id === id)!
    if (filter === 'enabled') return cfg.enabled
    if (filter === 'disabled') return !cfg.enabled
    return true
  })

  return (
    <div className="px-4 py-4 space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Strategies</h1>
        <p className="text-xs text-[#8B949E]">Configure numbers, cycles, and bet levels</p>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(['all', 'enabled', 'disabled'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${filter === f ? 'bg-violet-600 text-white' : 'bg-[#21262D] text-[#8B949E] hover:text-[#F0F6FC]'}`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Strategy ranking summary */}
      {strategySummaries.length > 0 && (
        <Card>
          <SectionTitle>Strategy Ranking</SectionTitle>
          <div className="space-y-1.5">
            {strategySummaries.map((s, i) => (
              <div key={s.strategy} className="flex items-center gap-2">
                <span className="text-xs text-[#484F58] w-4">{i + 1}</span>
                <span className="font-semibold text-sm text-violet-400 w-8">{s.strategy}</span>
                <div className="flex-1 h-1.5 bg-[#21262D] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${s.pnl >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(100, Math.abs(s.score) * 5 + 10)}%` }}
                  />
                </div>
                <span className={`font-mono text-xs ml-auto ${pnlColor(s.pnl)}`}>{pnlStr(s.pnl)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {filtered.map(id => <StrategyCard key={id} id={id} />)}
    </div>
  )
}
