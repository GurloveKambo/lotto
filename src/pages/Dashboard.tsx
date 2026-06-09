import React from 'react'
import { useStore, useAnalytics } from '../store/useStore'
import {
  Card, SectionTitle, StatTile, Badge, pnlColor, pnlStr, insightStyle, EmptyState
} from '../components/ui'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { format } from 'date-fns'

function EquityTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const val = payload[0].value
  return (
    <div className="bg-[#161B22] border border-[#30363D] rounded-lg px-3 py-2 text-xs font-mono">
      <p className="text-[#8B949E]">{label}</p>
      <p className={val >= 0 ? 'text-emerald-400' : 'text-red-400'}>
        {val >= 0 ? '+' : ''}₹{Math.abs(val).toLocaleString()}
      </p>
    </div>
  )
}

export function Dashboard() {
  const { strategies, betRecords } = useStore()
  const {
    totalPnl, totalCost, totalPayout, overallRoi, betCount,
    todayPnl, todayCost, todayPayout,
    equity, insights, risk, strategySummaries,
  } = useAnalytics()

  const activeStrategies = strategies.filter(s => s.enabled)
  const equityData = equity.slice(-30).map(e => ({
    date: format(new Date(e.date + 'T12:00:00'), 'dd MMM'),
    value: e.cumulative,
  }))

  const gradientId = 'equityGrad'
  const isPositive = totalPnl >= 0

  return (
    <div className="px-4 py-4 space-y-4">

      {/* Hero P&L */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-900/20 to-transparent pointer-events-none" />
        <SectionTitle>Total P&amp;L</SectionTitle>
        <div className={`text-4xl font-mono font-bold tracking-tight ${pnlColor(totalPnl)}`}>
          {pnlStr(totalPnl)}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3 pt-3 border-t border-[#21262D]">
          <StatTile label="Cost" value={`₹${totalCost.toLocaleString()}`} color="neutral" />
          <StatTile label="Payout" value={`₹${totalPayout.toLocaleString()}`} color="neutral" />
          <StatTile label="ROI" value={`${overallRoi.toFixed(1)}%`} color={overallRoi >= 0 ? 'green' : 'red'} />
        </div>
      </Card>

      {/* Today */}
      <Card>
        <SectionTitle>Today</SectionTitle>
        <div className="grid grid-cols-3 gap-3">
          <StatTile label="Cost" value={`₹${todayCost.toLocaleString()}`} />
          <StatTile label="Payout" value={`₹${todayPayout.toLocaleString()}`} />
          <StatTile label="Net" value={pnlStr(todayPnl)} color={todayPnl >= 0 ? 'green' : 'red'} />
        </div>
      </Card>

      {/* Equity curve */}
      {equityData.length > 1 ? (
        <Card>
          <SectionTitle>Equity Curve (30d)</SectionTitle>
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={equityData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isPositive ? '#22C55E' : '#EF4444'} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={isPositive ? '#22C55E' : '#EF4444'} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#21262D" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#484F58', fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill: '#484F58', fontSize: 10 }} tickLine={false} axisLine={false} width={55}
                tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<EquityTooltip />} />
              <Area type="monotone" dataKey="value" stroke={isPositive ? '#22C55E' : '#EF4444'}
                strokeWidth={2} fill={`url(#${gradientId})`} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      ) : (
        betCount === 0 && <EmptyState icon="📊" title="No data yet" sub="Enter results to populate the dashboard" />
      )}

      {/* Risk panel */}
      <Card>
        <SectionTitle>Risk Snapshot</SectionTitle>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#8B949E]">Exposure Score</span>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-[#21262D] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${risk.exposureScore > 60 ? 'bg-red-500' : risk.exposureScore > 30 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${risk.exposureScore}%` }}
                />
              </div>
              <span className="font-mono text-xs text-[#F0F6FC]">{risk.exposureScore}/100</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#8B949E]">High-bet strategies</span>
            <Badge variant={risk.highBetCount > 0 ? 'red' : 'green'}>{risk.highBetCount}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#8B949E]">Total bets placed</span>
            <span className="font-mono text-sm text-[#F0F6FC]">{betCount}</span>
          </div>
        </div>
      </Card>

      {/* Active strategies + bet levels */}
      <Card>
        <SectionTitle>Active Strategies</SectionTitle>
        {activeStrategies.length === 0
          ? <p className="text-xs text-[#484F58]">No strategies enabled</p>
          : (
            <div className="grid grid-cols-2 gap-2">
              {activeStrategies.map(s => {
                const summary = strategySummaries.find(x => x.strategy === s.id)
                const betMult = Math.log2(s.betLevel / 10)
                return (
                  <div key={s.id} className="bg-[#0D1117] rounded-lg p-3 flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-violet-400">{s.id}</span>
                      <Badge variant={s.betLevel >= 80 ? 'red' : s.betLevel >= 40 ? 'amber' : 'green'}>
                        ₹{s.betLevel}
                      </Badge>
                    </div>
                    {['S4','S5','S6','S7','S8'].includes(s.id) && (
                      <div className="text-xs text-[#8B949E]">
                        Cycle: {s.cycleRemaining > 0 ? `${s.cycleRemaining} left` : 'waiting'}
                      </div>
                    )}
                    {summary && (
                      <div className={`text-xs font-mono ${pnlColor(summary.pnl)}`}>
                        {pnlStr(summary.pnl)}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
      </Card>

      {/* Insights */}
      <div>
        <SectionTitle>System Insights</SectionTitle>
        <div className="space-y-2">
          {insights.map((ins, i) => {
            const st = insightStyle(ins.level)
            return (
              <div key={i} className={`flex items-start gap-3 border rounded-lg p-3 ${st.bg}`}>
                <div className={`w-1 h-full min-h-[1.5rem] rounded-full self-stretch ${st.bar}`} />
                <p className={`text-xs ${st.text} leading-relaxed`}>{ins.message}</p>
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}
