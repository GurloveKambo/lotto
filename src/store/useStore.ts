import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import { format, subDays } from 'date-fns'
import {
  Game, GameResult, BetRecord, StrategyConfig, AppSettings,
  StrategyId, BASE_BET
} from '../types'
import { processResult, buildDefaultStrategies } from '../engines/strategy'
import {
  buildDailySummaries, buildStrategySummaries, buildEquityCurve,
  calcDrawdown, calcVolatility, calcRisk, generateInsights, buildGameSummaries,
} from '../engines/analytics'

// ─── State shape ──────────────────────────────────────────────────────────────

interface StoreState {
  results: GameResult[]
  betRecords: BetRecord[]
  strategies: StrategyConfig[]
  settings: AppSettings

  // ── Derived (computed on demand via selectors) ────────────────────────────
  addResult: (date: string, game: Game, result: number) => void
  addResultsBulk: (rows: Array<{ date: string; game: Game; result: number }>) => void
  deleteResult: (id: string) => void
  editResult: (id: string, date: string, game: Game, result: number) => void

  updateStrategy: (id: StrategyId, patch: Partial<StrategyConfig>) => void
  resetStrategyBet: (id: StrategyId) => void
  resetStrategyCycle: (id: StrategyId) => void

  updateSettings: (patch: Partial<AppSettings>) => void

  exportBackup: () => void
  importBackup: (json: string) => void
  resetAll: () => void
  loadSampleData: () => void
}

// ─── Default settings ─────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: AppSettings = {
  maxBetAlert: 80,
  maxDailyLossAlert: 5000,
  repoName: 'lotto-tracker',
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      results: [],
      betRecords: [],
      strategies: buildDefaultStrategies(),
      settings: DEFAULT_SETTINGS,

      // ── Add single result ────────────────────────────────────────────────
      addResult(date, game, result) {
        const gameResult: GameResult = {
          id: uuidv4(),
          date,
          game,
          result,
          enteredAt: new Date().toISOString(),
        }
        const { betRecords: newBets, updatedStrategies } = processResult(gameResult, get().strategies)
        set(s => ({
          results: [...s.results, gameResult],
          betRecords: [...s.betRecords, ...newBets],
          strategies: updatedStrategies,
        }))
      },

      // ── Bulk add results ─────────────────────────────────────────────────
      addResultsBulk(rows) {
        let strategies = get().strategies
        const allNewResults: GameResult[] = []
        const allNewBets: BetRecord[] = []

        for (const row of rows) {
          const gameResult: GameResult = {
            id: uuidv4(),
            date: row.date,
            game: row.game,
            result: row.result,
            enteredAt: new Date().toISOString(),
          }
          const { betRecords: newBets, updatedStrategies } = processResult(gameResult, strategies)
          strategies = updatedStrategies
          allNewResults.push(gameResult)
          allNewBets.push(...newBets)
        }

        set(s => ({
          results: [...s.results, ...allNewResults],
          betRecords: [...s.betRecords, ...allNewBets],
          strategies,
        }))
      },

      // ── Delete result (+ its bet records) ───────────────────────────────
      deleteResult(id) {
        set(s => ({
          results: s.results.filter(r => r.id !== id),
          betRecords: s.betRecords.filter(b => b.resultId !== id),
        }))
      },

      // ── Edit result: delete + re-add in-place ────────────────────────────
      editResult(id, date, game, result) {
        const { deleteResult, addResult } = get()
        deleteResult(id)
        addResult(date, game, result)
      },

      // ── Strategy management ──────────────────────────────────────────────
      updateStrategy(id, patch) {
        set(s => ({
          strategies: s.strategies.map(cfg => cfg.id === id ? { ...cfg, ...patch } : cfg),
        }))
      },

      resetStrategyBet(id) {
        set(s => ({
          strategies: s.strategies.map(cfg => cfg.id === id ? { ...cfg, betLevel: BASE_BET } : cfg),
        }))
      },

      resetStrategyCycle(id) {
        set(s => ({
          strategies: s.strategies.map(cfg => cfg.id === id ? { ...cfg, cycleRemaining: 0 } : cfg),
        }))
      },

      // ── Settings ─────────────────────────────────────────────────────────
      updateSettings(patch) {
        set(s => ({ settings: { ...s.settings, ...patch } }))
      },

      // ── Backup / restore ──────────────────────────────────────────────────
      exportBackup() {
        const { results, betRecords, strategies, settings } = get()
        const json = JSON.stringify({ results, betRecords, strategies, settings, exportedAt: new Date().toISOString() }, null, 2)
        const blob = new Blob([json], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `lotto-backup-${format(new Date(), 'yyyyMMdd-HHmm')}.json`
        a.click()
        URL.revokeObjectURL(url)
      },

      importBackup(json) {
        try {
          const data = JSON.parse(json)
          set({
            results: data.results ?? [],
            betRecords: data.betRecords ?? [],
            strategies: data.strategies ?? buildDefaultStrategies(),
            settings: { ...DEFAULT_SETTINGS, ...(data.settings ?? {}) },
          })
        } catch {
          throw new Error('Invalid backup file')
        }
      },

      resetAll() {
        set({ results: [], betRecords: [], strategies: buildDefaultStrategies(), settings: DEFAULT_SETTINGS })
      },

      // ── Sample data ───────────────────────────────────────────────────────
      loadSampleData() {
        const GAMES: Game[] = ['FRBD', 'GZBD', 'GALI', 'DSWR']
        const rows: Array<{ date: string; game: Game; result: number }> = []
        for (let daysBack = 29; daysBack >= 0; daysBack--) {
          const date = format(subDays(new Date(), daysBack), 'yyyy-MM-dd')
          for (const game of GAMES) {
            rows.push({ date, game, result: Math.floor(Math.random() * 100) })
          }
        }
        get().addResultsBulk(rows)
      },
    }),
    {
      name: 'lotto-tracker-v2',
      partialize: (state) => ({
        results: state.results,
        betRecords: state.betRecords,
        strategies: state.strategies,
        settings: state.settings,
      }),
    }
  )
)

// ─── Selectors (computed outside store to avoid re-render loops) ──────────────

export function useAnalytics() {
  const betRecords = useStore(s => s.betRecords)
  const strategies = useStore(s => s.strategies)
  const settings = useStore(s => s.settings)

  const currentBets = Object.fromEntries(
    strategies.map(s => [s.id, s.betLevel])
  ) as Record<StrategyId, number>

  const daily = buildDailySummaries(betRecords)
  const strategySummaries = buildStrategySummaries(betRecords, currentBets)
  const equity = buildEquityCurve(betRecords)
  const drawdown = calcDrawdown(equity)
  const volatility = calcVolatility(betRecords)
  const risk = calcRisk(betRecords, currentBets, settings.maxBetAlert, settings.maxDailyLossAlert)
  const insights = generateInsights(betRecords, risk, strategySummaries, drawdown)
  const gameSummaries = buildGameSummaries(betRecords)

  const totalPnl = betRecords.reduce((a, b) => a + b.pnl, 0)
  const totalCost = betRecords.reduce((a, b) => a + b.cost, 0)
  const totalPayout = betRecords.reduce((a, b) => a + b.payout, 0)
  const totalWins = betRecords.filter(b => b.win).length
  const overallRoi = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0

  const today = format(new Date(), 'yyyy-MM-dd')
  const todayRecords = betRecords.filter(r => r.date === today)
  const todayPnl = todayRecords.reduce((a, b) => a + b.pnl, 0)
  const todayCost = todayRecords.reduce((a, b) => a + b.cost, 0)
  const todayPayout = todayRecords.reduce((a, b) => a + b.payout, 0)

  return {
    daily, strategySummaries, equity, drawdown, volatility,
    risk, insights, gameSummaries,
    totalPnl, totalCost, totalPayout, totalWins, overallRoi,
    todayPnl, todayCost, todayPayout,
    betCount: betRecords.length,
  }
}
