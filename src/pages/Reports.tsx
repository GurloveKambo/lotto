import React, { useState } from 'react'
import { useAnalytics } from '../store/useStore'
import { useStore } from '../store/useStore'
import { Card, SectionTitle, Badge, pnlColor, pnlStr, EmptyState } from '../components/ui'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, LineChart, Line, Legend, PieChart, Pie, Cell,
} from 'recharts'
import { StrategyId } from '../types'
import { format } from 'date-fns'

const COLORS = ['#7C3AED', '#2563EB', '#059669', '#D97706', '#DC2626', '#0891B2', '#7C3AED', '#BE185D']

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#161B22] border border-[#30363D] rounded-lg px-3 py-2 text-xs">
      <p className="text-[#8B949E] mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-mono">
          {p.name}: {p.value >= 0 ? '+' : ''}₹{Math.abs(p.value).toLocaleString()}
        </p>
      ))}
    </div>
  )
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────
type ReportTab = 'daily' | 'strategy' | 'game' | 'ledger'

export function Reports() {
  const [tab, setTab] = useState<ReportTab>('daily')
  const { betRecords } = useStore()
  const {
    daily, strategySummaries, gameSummaries, equity,
    drawdown, volatility, totalPnl, overallRoi,
  } = useAnalytics()

  if (betRecords.length === 0) {
    return (
      <div className="px-4 py-4">
        <EmptyState icon="📈" title="No data yet" sub="Enter results to generate reports" />
      </div>
    )
  }

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Tab bar */}
      <div className="flex bg-[#161B22] rounded-xl p-1 border border-[#30363D] gap-0.5">
        {([
          { id: 'daily', label: 'Daily' },
          { id: 'strategy', label: 'Strategy' },
          { id: 'game', label: 'Game' },
          { id: 'ledger', label: 'Ledger' },
        ] as const).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${tab === t.id ? 'bg-violet-600 text-white' : 'text-[#8B949E] hover:text-[#F0F6FC]'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Daily P&L ───────────────────────────────────────────────────── */}
      {tab === 'daily' && (
        <>
          {/* Summary stats */}
          <Card>
            <SectionTitle>Performance Summary</SectionTitle>
            <div className="grid grid-cols-2 gap-3">
              {[
                { l: 'Total P&L', v: pnlStr(totalPnl), color: pnlColor(totalPnl) },
                { l: 'Overall ROI', v: `${overallRoi.toFixed(1)}%`, color: pnlColor(overallRoi) },
                { l: 'Max Drawdown', v: `₹${Math.abs(drawdown.maxDrawdown).toLocaleString()}`, color: 'text-red-400' },
                { l: 'Volatility (σ)', v: `₹${volatility.toFixed(0)}`, color: 'text-amber-400' },
              ].map(x => (
                <div key={x.l} className="bg-[#0D1117] rounded-lg p-3">
                  <p className="text-xs text-[#484F58]">{x.l}</p>
                  <p className={`font-mono text-sm font-semibold mt-0.5 ${x.color}`}>{x.v}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Daily P&L bar chart */}
          <Card>
            <SectionTitle>Daily P&amp;L (last 30 days)</SectionTitle>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={daily.slice(-30).map(d => ({
                date: format(new Date(d.date + 'T12:00:00'), 'dd/MM'),
                pnl: d.pnl,
              }))} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#21262D" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#484F58', fontSize: 9 }} tickLine={false} axisLine={false} interval={4} />
                <YAxis tick={{ fill: '#484F58', fontSize: 9 }} tickLine={false} axisLine={false} width={55}
                  tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="pnl" name="P&L" radius={[2, 2, 0, 0]}>
                  {daily.slice(-30).map((d, i) => (
                    <Cell key={i} fill={d.pnl >= 0 ? '#22C55E' : '#EF4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Equity curve */}
          <Card>
            <SectionTitle>Equity Curve</SectionTitle>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={equity.map(e => ({
                date: format(new Date(e.date + 'T12:00:00'), 'dd/MM'),
                value: e.cumulative,
              }))} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#21262D" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#484F58', fontSize: 9 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fill: '#484F58', fontSize: 9 }} tickLine={false} axisLine={false} width={55}
                  tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="value" name="Equity" stroke="#7C3AED" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Daily table */}
          <Card>
            <SectionTitle>Daily Ledger</SectionTitle>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[#484F58] border-b border-[#21262D]">
                    <th className="text-left py-2">Date</th>
                    <th className="text-right py-2">Cost</th>
                    <th className="text-right py-2">Payout</th>
                    <th className="text-right py-2">P&L</th>
                    <th className="text-right py-2">Bets</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {[...daily].reverse().slice(0, 30).map(d => (
                    <tr key={d.date} className="border-b border-[#21262D]/50 hover:bg-[#21262D]/40 transition-colors">
                      <td className="py-1.5 text-[#8B949E]">{d.date}</td>
                      <td className="py-1.5 text-right">₹{d.cost.toLocaleString()}</td>
                      <td className="py-1.5 text-right">₹{d.payout.toLocaleString()}</td>
                      <td className={`py-1.5 text-right font-semibold ${pnlColor(d.pnl)}`}>{pnlStr(d.pnl)}</td>
                      <td className="py-1.5 text-right text-[#8B949E]">{d.bets}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* ── Strategy breakdown ──────────────────────────────────────────── */}
      {tab === 'strategy' && (
        <>
          <Card>
            <SectionTitle>Strategy P&amp;L Comparison</SectionTitle>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={strategySummaries.map(s => ({ name: s.strategy, pnl: s.pnl }))}
                margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#21262D" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#8B949E', fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#484F58', fontSize: 9 }} tickLine={false} axisLine={false} width={55}
                  tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="pnl" name="P&L" radius={[3, 3, 0, 0]}>
                  {strategySummaries.map((s, i) => (
                    <Cell key={i} fill={s.pnl >= 0 ? '#22C55E' : '#EF4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <SectionTitle>Strategy Details</SectionTitle>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[#484F58] border-b border-[#21262D]">
                    <th className="text-left py-2">ID</th>
                    <th className="text-right py-2">Bets</th>
                    <th className="text-right py-2">Win%</th>
                    <th className="text-right py-2">ROI</th>
                    <th className="text-right py-2">P&L</th>
                    <th className="text-right py-2">Bet</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {strategySummaries.map(s => (
                    <tr key={s.strategy} className="border-b border-[#21262D]/50 hover:bg-[#21262D]/40">
                      <td className="py-1.5 font-semibold text-violet-400">{s.strategy}</td>
                      <td className="py-1.5 text-right">{s.bets}</td>
                      <td className="py-1.5 text-right">{s.bets > 0 ? ((s.wins / s.bets) * 100).toFixed(1) : 0}%</td>
                      <td className={`py-1.5 text-right ${pnlColor(s.roi)}`}>{s.roi.toFixed(1)}%</td>
                      <td className={`py-1.5 text-right font-semibold ${pnlColor(s.pnl)}`}>{pnlStr(s.pnl)}</td>
                      <td className={`py-1.5 text-right ${s.currentBet >= 80 ? 'text-red-400' : s.currentBet >= 40 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        ₹{s.currentBet}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* ── Game breakdown ──────────────────────────────────────────────── */}
      {tab === 'game' && (
        <>
          <Card>
            <SectionTitle>P&amp;L by Game</SectionTitle>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={gameSummaries.map(g => ({ name: g.game, cost: g.cost, payout: g.payout }))}
                margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#21262D" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#8B949E', fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#484F58', fontSize: 9 }} tickLine={false} axisLine={false} width={55}
                  tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#8B949E' }} />
                <Bar dataKey="cost" name="Cost" fill="#7C3AED" radius={[2, 2, 0, 0]} />
                <Bar dataKey="payout" name="Payout" fill="#22C55E" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Pie chart: bets distribution */}
          <Card>
            <SectionTitle>Bet Distribution</SectionTitle>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie data={gameSummaries} dataKey="bets" nameKey="game" cx="50%" cy="50%" outerRadius={60} strokeWidth={0}>
                    {gameSummaries.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => [`${v} bets`, '']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {gameSummaries.map((g, i) => (
                  <div key={g.game} className="flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-[#8B949E] w-10">{g.game}</span>
                    <span className="font-mono">{g.bets} bets</span>
                    <span className={`font-mono ml-2 ${pnlColor(g.pnl)}`}>{pnlStr(g.pnl)}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card>
            <SectionTitle>Game Win Rates</SectionTitle>
            <div className="space-y-2">
              {gameSummaries.map(g => (
                <div key={g.game} className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-violet-400 w-12">{g.game}</span>
                  <div className="flex-1 h-2 bg-[#21262D] rounded-full overflow-hidden">
                    <div className="h-full bg-violet-500 rounded-full" style={{ width: `${g.winRate}%` }} />
                  </div>
                  <span className="font-mono text-xs text-[#8B949E] w-12 text-right">{g.winRate.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {/* ── Full Ledger ─────────────────────────────────────────────────── */}
      {tab === 'ledger' && <LedgerTab />}
    </div>
  )
}

function LedgerTab() {
  const { betRecords } = useStore()
  const [filterStrategy, setFilterStrategy] = useState<string>('all')
  const [filterGame, setFilterGame] = useState<string>('all')
  const sorted = [...betRecords].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))

  const filtered = sorted.filter(r =>
    (filterStrategy === 'all' || r.strategy === filterStrategy) &&
    (filterGame === 'all' || r.game === filterGame)
  )

  return (
    <>
      <div className="flex gap-2 flex-wrap">
        <select
          value={filterStrategy}
          onChange={e => setFilterStrategy(e.target.value)}
          className="bg-[#161B22] border border-[#30363D] rounded-lg px-2 py-1 text-xs text-[#F0F6FC]"
        >
          <option value="all">All strategies</option>
          {['S1','S2','S3','S4','S5','S6','S7','S8'].map(s => <option key={s}>{s}</option>)}
        </select>
        <select
          value={filterGame}
          onChange={e => setFilterGame(e.target.value)}
          className="bg-[#161B22] border border-[#30363D] rounded-lg px-2 py-1 text-xs text-[#F0F6FC]"
        >
          <option value="all">All games</option>
          {['FRBD','GZBD','GALI','DSWR'].map(g => <option key={g}>{g}</option>)}
        </select>
        <span className="text-xs text-[#484F58] self-center">{filtered.length} records</span>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[#484F58] border-b border-[#21262D]">
                <th className="text-left py-2">Date</th>
                <th className="text-left py-2">Game</th>
                <th className="text-left py-2">Strat</th>
                <th className="text-right py-2">Bet</th>
                <th className="text-right py-2">Cost</th>
                <th className="text-right py-2">Payout</th>
                <th className="text-right py-2">P&L</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {filtered.slice(0, 100).map(r => (
                <tr key={r.id} className={`border-b border-[#21262D]/50 hover:bg-[#21262D]/40 transition-colors ${r.win ? 'bg-emerald-950/10' : ''}`}>
                  <td className="py-1.5 text-[#8B949E]">{r.date}</td>
                  <td className="py-1.5">
                    <Badge variant="violet">{r.game}</Badge>
                  </td>
                  <td className="py-1.5 text-violet-400 font-semibold">{r.strategy}</td>
                  <td className="py-1.5 text-right">₹{r.betLevel}</td>
                  <td className="py-1.5 text-right">₹{r.cost.toLocaleString()}</td>
                  <td className="py-1.5 text-right">{r.payout > 0 ? `₹${r.payout.toLocaleString()}` : '—'}</td>
                  <td className={`py-1.5 text-right font-semibold ${pnlColor(r.pnl)}`}>{pnlStr(r.pnl)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length > 100 && (
            <p className="text-xs text-[#484F58] text-center py-2">Showing 100 of {filtered.length} records</p>
          )}
        </div>
      </Card>
    </>
  )
}
