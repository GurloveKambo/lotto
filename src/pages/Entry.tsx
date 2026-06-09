import React, { useState } from 'react'
import { format, subDays } from 'date-fns'
import { useStore } from '../store/useStore'
import { Card, SectionTitle, Button, Input, Select, Textarea, Badge, pnlColor, pnlStr } from '../components/ui'
import { parseBulkPaste } from '../engines/strategy'
import { Game, GAMES } from '../types'

// ─── Manual Entry ─────────────────────────────────────────────────────────────
function ManualEntry() {
  const { addResult } = useStore()
  const today = format(new Date(), 'yyyy-MM-dd')

  const [date, setDate] = useState(today)
  const [game, setGame] = useState<Game>('FRBD')
  const [result, setResult] = useState('')
  const [isDswr, setIsDswr] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = () => {
    setError('')
    setSuccess('')
    const num = parseInt(result, 10)
    if (isNaN(num) || num < 0 || num > 99) {
      setError('Result must be 00–99')
      return
    }
    // DSWR offset: attribute to previous day
    let entryDate = date
    if (game === 'DSWR') {
      const d = new Date(date + 'T12:00:00')
      d.setDate(d.getDate() - 1)
      entryDate = d.toISOString().split('T')[0]
    }
    addResult(entryDate, game, num)
    setSuccess(`Saved: ${game} ${num.toString().padStart(2, '0')} for ${entryDate}`)
    setResult('')
    setTimeout(() => setSuccess(''), 2500)
  }

  return (
    <Card>
      <SectionTitle>Manual Entry</SectionTitle>
      <div className="space-y-3">
        <Input
          label="Date"
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          max={today}
        />
        <Select label="Game" value={game} onChange={e => setGame(e.target.value as Game)}>
          {GAMES.map(g => <option key={g} value={g}>{g}</option>)}
        </Select>
        <Input
          label="Result (00–99)"
          type="number"
          min={0}
          max={99}
          placeholder="e.g. 45"
          value={result}
          onChange={e => setResult(e.target.value)}
          error={error}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        />
        {game === 'DSWR' && (
          <p className="text-xs text-amber-400">
            ⚠ DSWR result will be attributed to <strong>{format(subDays(new Date(date + 'T12:00:00'), 1), 'dd MMM yyyy')}</strong>
          </p>
        )}
        <Button onClick={handleSubmit} className="w-full">Save Result</Button>
        {success && (
          <div className="text-xs text-emerald-400 bg-emerald-900/20 border border-emerald-800 rounded-lg p-2">
            ✓ {success}
          </div>
        )}
      </div>
    </Card>
  )
}

// ─── Bulk Paste ───────────────────────────────────────────────────────────────
function BulkEntry() {
  const { addResultsBulk } = useStore()
  const [raw, setRaw] = useState('')
  const [preview, setPreview] = useState<ReturnType<typeof parseBulkPaste>>([])
  const [done, setDone] = useState(false)

  const handlePreview = () => {
    setDone(false)
    const parsed = parseBulkPaste(raw, true)
    setPreview(parsed)
  }

  const handleImport = () => {
    const valid = preview.filter(r => !r.error)
    addResultsBulk(valid.map(r => ({ date: r.date, game: r.game, result: r.result })))
    setDone(true)
    setRaw('')
    setPreview([])
  }

  const validCount = preview.filter(r => !r.error).length
  const errorCount = preview.filter(r => !!r.error).length

  return (
    <Card>
      <SectionTitle>Bulk Paste</SectionTitle>
      <Textarea
        label="Paste rows"
        hint="Format: YYYY-MM-DD  GAME  RESULT  (tab or comma separated)"
        placeholder={`2024-01-15\tGALI\t45\n2024-01-15\tFRBD\t72\n2024-01-15\tDSWR\t08`}
        value={raw}
        onChange={e => setRaw(e.target.value)}
        rows={6}
      />
      <div className="flex gap-2 mt-3">
        <Button variant="secondary" onClick={handlePreview} disabled={!raw.trim()}>Preview</Button>
        {validCount > 0 && (
          <Button onClick={handleImport}>Import {validCount} rows</Button>
        )}
      </div>
      {done && (
        <div className="mt-2 text-xs text-emerald-400 bg-emerald-900/20 border border-emerald-800 rounded-lg p-2">
          ✓ Imported successfully
        </div>
      )}
      {preview.length > 0 && (
        <div className="mt-3 space-y-1 max-h-48 overflow-y-auto">
          <div className="flex gap-2 text-xs text-[#8B949E] px-1">
            <Badge variant="green">{validCount} valid</Badge>
            {errorCount > 0 && <Badge variant="red">{errorCount} errors</Badge>}
          </div>
          {preview.map((row, i) => (
            <div key={i} className={`flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg ${row.error ? 'bg-red-900/20 border border-red-900' : 'bg-[#21262D]'}`}>
              {row.error
                ? <span className="text-red-400">{row.error}</span>
                : <>
                  <span className="text-[#8B949E] font-mono w-24 shrink-0">{row.date}</span>
                  <Badge variant="violet">{row.game}</Badge>
                  <span className="font-mono text-[#F0F6FC]">{row.result.toString().padStart(2, '0')}</span>
                </>
              }
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

// ─── Recent Results ───────────────────────────────────────────────────────────
function RecentResults() {
  const { results, betRecords, deleteResult } = useStore()
  const sorted = [...results].sort((a, b) => b.enteredAt.localeCompare(a.enteredAt)).slice(0, 40)

  if (sorted.length === 0) return null

  return (
    <Card>
      <SectionTitle>Recent Results</SectionTitle>
      <div className="space-y-1 max-h-72 overflow-y-auto">
        {sorted.map(r => {
          const bets = betRecords.filter(b => b.resultId === r.id)
          const totalPnl = bets.reduce((a, b) => a + b.pnl, 0)
          const hasBets = bets.length > 0
          return (
            <div key={r.id} className="flex items-center gap-2 bg-[#0D1117] rounded-lg px-3 py-2 group">
              <span className="text-[#8B949E] font-mono text-xs w-20 shrink-0">{r.date}</span>
              <Badge variant="violet">{r.game}</Badge>
              <span className="font-mono font-semibold text-sm">{r.result.toString().padStart(2, '0')}</span>
              {hasBets && (
                <span className={`ml-auto text-xs font-mono ${pnlColor(totalPnl)}`}>
                  {pnlStr(totalPnl)}
                </span>
              )}
              <button
                onClick={() => deleteResult(r.id)}
                className="ml-2 text-[#484F58] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all text-xs"
                title="Delete"
              >
                ✕
              </button>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function Entry() {
  const [tab, setTab] = useState<'manual' | 'bulk'>('manual')

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Tab switcher */}
      <div className="flex bg-[#161B22] rounded-xl p-1 border border-[#30363D]">
        {(['manual', 'bulk'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${tab === t ? 'bg-violet-600 text-white' : 'text-[#8B949E] hover:text-[#F0F6FC]'}`}
          >
            {t === 'manual' ? '✎ Manual' : '⊞ Bulk Paste'}
          </button>
        ))}
      </div>

      {tab === 'manual' ? <ManualEntry /> : <BulkEntry />}

      <RecentResults />
    </div>
  )
}
