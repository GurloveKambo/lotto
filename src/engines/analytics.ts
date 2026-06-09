import { BetRecord, GameResult, StrategyId, StrategySummary, DailySummary } from '../types'

// ─── Aggregate helpers ────────────────────────────────────────────────────────

export function sumField<T>(arr: T[], key: keyof T): number {
  return arr.reduce((acc, item) => acc + (item[key] as unknown as number), 0)
}

// ─── Daily summaries ──────────────────────────────────────────────────────────

export function buildDailySummaries(betRecords: BetRecord[]): DailySummary[] {
  const map = new Map<string, DailySummary>()

  for (const r of betRecords) {
    const existing = map.get(r.date) ?? { date: r.date, cost: 0, payout: 0, pnl: 0, wins: 0, bets: 0 }
    existing.cost += r.cost
    existing.payout += r.payout
    existing.pnl += r.pnl
    existing.wins += r.win ? 1 : 0
    existing.bets += 1
    map.set(r.date, existing)
  }

  return [...map.values()].sort((a, b) => a.date.localeCompare(b.date))
}

// ─── Strategy summaries ────────────────────────────────────────────────────────

export function buildStrategySummaries(
  betRecords: BetRecord[],
  currentBets: Record<StrategyId, number>
): StrategySummary[] {
  const map = new Map<StrategyId, Omit<StrategySummary, 'roi' | 'score'>>()

  for (const r of betRecords) {
    const existing = map.get(r.strategy) ?? {
      strategy: r.strategy, cost: 0, payout: 0, pnl: 0, wins: 0, bets: 0, currentBet: 0
    }
    existing.cost += r.cost
    existing.payout += r.payout
    existing.pnl += r.pnl
    existing.wins += r.win ? 1 : 0
    existing.bets += 1
    map.set(r.strategy, existing)
  }

  return [...map.values()].map(s => {
    const roi = s.cost > 0 ? (s.pnl / s.cost) * 100 : 0
    const currentBet = currentBets[s.strategy] ?? 10
    // Score: profit contribution + ROI bonus − cost penalty for high bets
    const score = parseFloat((s.pnl / 1000 + roi * 0.1 - (Math.log2(currentBet / 10)) * 5).toFixed(2))
    return { ...s, roi, score, currentBet }
  }).sort((a, b) => b.score - a.score)
}

// ─── Equity curve ─────────────────────────────────────────────────────────────

export interface EquityPoint {
  date: string
  cumulative: number
  dailyPnl: number
}

export function buildEquityCurve(betRecords: BetRecord[]): EquityPoint[] {
  const daily = buildDailySummaries(betRecords)
  let cumulative = 0
  return daily.map(d => {
    cumulative += d.pnl
    return { date: d.date, cumulative, dailyPnl: d.pnl }
  })
}

// ─── Drawdown engine ──────────────────────────────────────────────────────────

export interface DrawdownStats {
  maxDrawdown: number      // largest peak-to-trough drop (negative)
  maxDrawdownPct: number   // as % of peak
  currentDrawdown: number  // current drawdown from last peak
}

export function calcDrawdown(equity: EquityPoint[]): DrawdownStats {
  if (equity.length === 0) return { maxDrawdown: 0, maxDrawdownPct: 0, currentDrawdown: 0 }

  let peak = equity[0].cumulative
  let maxDD = 0

  for (const pt of equity) {
    if (pt.cumulative > peak) peak = pt.cumulative
    const dd = pt.cumulative - peak
    if (dd < maxDD) maxDD = dd
  }

  const lastPeak = equity.reduce((p, c) => c.cumulative > p ? c.cumulative : p, equity[0].cumulative)
  const lastVal = equity[equity.length - 1].cumulative
  const currentDD = lastVal - lastPeak

  return {
    maxDrawdown: maxDD,
    maxDrawdownPct: lastPeak !== 0 ? (maxDD / Math.abs(lastPeak)) * 100 : 0,
    currentDrawdown: currentDD,
  }
}

// ─── Volatility engine ────────────────────────────────────────────────────────

export function calcVolatility(betRecords: BetRecord[]): number {
  const daily = buildDailySummaries(betRecords)
  if (daily.length < 2) return 0
  const vals = daily.map(d => d.pnl)
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length
  const variance = vals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / vals.length
  return Math.sqrt(variance)
}

// ─── Risk engine ──────────────────────────────────────────────────────────────

export interface RiskMetrics {
  exposureScore: number     // 0–100
  highBetCount: number      // strategies with bet ≥ 80
  consecutiveLossStreaks: Record<StrategyId, number>
  dailyLossFlag: boolean    // today's loss exceeds threshold
  instabilitySignal: boolean
}

export function calcRisk(
  betRecords: BetRecord[],
  currentBets: Record<string, number>,
  maxBetAlert: number,
  maxDailyLossAlert: number
): RiskMetrics {
  // Exposure: average log-multiple of all bets vs base (10)
  const bets = Object.values(currentBets)
  const logMultiples = bets.map(b => Math.log2(b / 10))
  const avgLog = logMultiples.reduce((a, b) => a + b, 0) / (bets.length || 1)
  const maxLog = Math.log2(512 / 10) // cap at ₹512 = ~9 doublings
  const exposureScore = Math.min(100, Math.round((avgLog / maxLog) * 100))

  const highBetCount = bets.filter(b => b >= maxBetAlert).length

  // Consecutive loss streaks per strategy
  const lossStreaks: Record<string, number> = {}
  const sortedRecords = [...betRecords].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))
  for (const r of sortedRecords) {
    if (!lossStreaks[r.strategy]) lossStreaks[r.strategy] = 0
    if (r.win) lossStreaks[r.strategy] = 0
    else lossStreaks[r.strategy] += 1
  }

  // Daily loss flag
  const today = new Date().toISOString().split('T')[0]
  const todayRecords = betRecords.filter(r => r.date === today)
  const todayPnl = todayRecords.reduce((a, b) => a + b.pnl, 0)
  const dailyLossFlag = todayPnl < -maxDailyLossAlert

  const instabilitySignal = exposureScore > 60 || highBetCount > 2

  return {
    exposureScore,
    highBetCount,
    consecutiveLossStreaks: lossStreaks as Record<StrategyId, number>,
    dailyLossFlag,
    instabilitySignal,
  }
}

// ─── Insight engine ───────────────────────────────────────────────────────────

export interface Insight {
  level: 'info' | 'warning' | 'danger'
  message: string
  strategy?: StrategyId
}

export function generateInsights(
  betRecords: BetRecord[],
  risk: RiskMetrics,
  summarySorted: StrategySummary[],
  drawdown: DrawdownStats
): Insight[] {
  const insights: Insight[] = []

  // Drawdown
  if (drawdown.maxDrawdown < -50000) {
    insights.push({ level: 'danger', message: `Max drawdown ₹${Math.abs(drawdown.maxDrawdown).toLocaleString()} — capital at risk` })
  } else if (drawdown.maxDrawdown < -10000) {
    insights.push({ level: 'warning', message: `Drawdown ₹${Math.abs(drawdown.maxDrawdown).toLocaleString()} — monitor progression` })
  }

  // High bets
  if (risk.highBetCount > 0) {
    insights.push({ level: 'warning', message: `${risk.highBetCount} strategy(ies) at elevated bet level — high escalation risk` })
  }

  // Per strategy insights
  for (const s of summarySorted) {
    const streak = risk.consecutiveLossStreaks[s.strategy] ?? 0
    if (streak >= 6) {
      insights.push({ level: 'danger', message: `${s.strategy}: ${streak}-game loss streak — bet now ₹${s.currentBet}`, strategy: s.strategy })
    } else if (streak >= 3) {
      insights.push({ level: 'warning', message: `${s.strategy}: ${streak} consecutive losses`, strategy: s.strategy })
    }

    if (s.bets > 10 && s.roi < -30) {
      insights.push({ level: 'warning', message: `${s.strategy}: Capital efficiency degrading (ROI ${s.roi.toFixed(1)}%)`, strategy: s.strategy })
    }

    if (s.pnl < 0 && s.currentBet >= 80) {
      insights.push({ level: 'danger', message: `${s.strategy}: In sustained drawdown with bet ₹${s.currentBet}`, strategy: s.strategy })
    }
  }

  if (risk.instabilitySignal) {
    insights.push({ level: 'warning', message: 'System instability detected — exposure score elevated' })
  }

  if (insights.length === 0) {
    insights.push({ level: 'info', message: 'System operating within normal parameters' })
  }

  return insights.slice(0, 8)
}

// ─── Game performance ────────────────────────────────────────────────────────

export interface GameSummary {
  game: string
  bets: number
  wins: number
  cost: number
  payout: number
  pnl: number
  winRate: number
}

export function buildGameSummaries(betRecords: BetRecord[]): GameSummary[] {
  const map = new Map<string, GameSummary>()
  for (const r of betRecords) {
    const ex = map.get(r.game) ?? { game: r.game, bets: 0, wins: 0, cost: 0, payout: 0, pnl: 0, winRate: 0 }
    ex.bets += 1; ex.wins += r.win ? 1 : 0
    ex.cost += r.cost; ex.payout += r.payout; ex.pnl += r.pnl
    map.set(r.game, ex)
  }
  return [...map.values()].map(g => ({ ...g, winRate: g.bets > 0 ? (g.wins / g.bets) * 100 : 0 }))
}
