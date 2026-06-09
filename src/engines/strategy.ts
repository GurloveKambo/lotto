import { getDaysInMonth, getDate, getMonth, getYear } from 'date-fns'
import {
  Game, StrategyId, GameResult, BetRecord, StrategyConfig,
  BASE_BET, NUMBERS_COUNT, PAYOUT_PER_UNIT, DEFAULT_S3_DATES
} from '../types'
import { v4 as uuidv4 } from 'uuid'

// ─── Calendar helpers ────────────────────────────────────────────────────────

function parseDateParts(dateStr: string): { day: number; month: number; year: number; daysInMonth: number } {
  const d = new Date(dateStr + 'T12:00:00')
  return {
    day: getDate(d),
    month: getMonth(d) + 1,
    year: getYear(d),
    daysInMonth: getDaysInMonth(d),
  }
}

// ─── Strategy active-day logic ───────────────────────────────────────────────

export function isStrategyActiveOnDate(cfg: StrategyConfig, dateStr: string): boolean {
  if (!cfg.enabled) return false

  const { day, daysInMonth } = parseDateParts(dateStr)

  switch (cfg.id) {
    case 'S1':
      return true

    case 'S2': {
      const lastDay = daysInMonth
      const secondLastDay = daysInMonth - 1
      return day === 1 || day === 2 || day === lastDay || day === secondLastDay
    }

    case 'S3':
      return cfg.s3Dates.includes(day)

    case 'S4':
    case 'S5':
    case 'S6':
    case 'S7':
    case 'S8':
      // Active only when inside an active cycle
      return cfg.cycleRemaining > 0

    default:
      return false
  }
}

// ─── Payout engine ───────────────────────────────────────────────────────────

export function calcCost(betLevel: number): number {
  return NUMBERS_COUNT * betLevel
}

export function calcPayout(betLevel: number): number {
  return (betLevel / BASE_BET) * PAYOUT_PER_UNIT
}

export function calcNextBet(win: boolean, currentBet: number): number {
  return win ? BASE_BET : currentBet * 2
}

// ─── Core processor ──────────────────────────────────────────────────────────

export interface ProcessResultOutput {
  betRecords: BetRecord[]
  updatedStrategies: StrategyConfig[]
}

/**
 * Given a newly entered GameResult and the current array of StrategyConfigs,
 * returns the BetRecords generated and the mutated (cloned) strategy states.
 *
 * Order of operations per strategy:
 *  1. For S4–S8 NOT in a cycle → check if result triggers cycle; activate if so.
 *  2. For ALL active strategies → place bet, check win/loss, update bet level.
 *  3. For S4–S8 in a cycle → decrement cycleRemaining.
 */
export function processResult(
  gameResult: GameResult,
  strategies: StrategyConfig[]
): ProcessResultOutput {
  const betRecords: BetRecord[] = []
  const updatedStrategies: StrategyConfig[] = strategies.map(cfg => ({ ...cfg, numbers: [...cfg.numbers], s3Dates: [...cfg.s3Dates] }))

  for (const cfg of updatedStrategies) {
    if (!cfg.enabled) continue

    const isTriggerStrategy = ['S4', 'S5', 'S6', 'S7', 'S8'].includes(cfg.id)
    const resultInSet = cfg.numbers.includes(gameResult.result)

    // ── Step 1: Trigger check for S4–S8 ────────────────────────────────────
    if (isTriggerStrategy && cfg.cycleRemaining === 0 && resultInSet) {
      // Trigger fires — cycle starts from the NEXT game
      cfg.cycleRemaining = cfg.cycleLength
      // No bet placed on the trigger game itself
      continue
    }

    // ── Step 2: Determine if strategy is active for this game ───────────────
    const active = isStrategyActiveOnDate(cfg, gameResult.date)
    if (!active) continue

    // ── Step 3: Place bet ───────────────────────────────────────────────────
    const betLevel = cfg.betLevel
    const cost = calcCost(betLevel)
    const win = resultInSet
    const payout = win ? calcPayout(betLevel) : 0
    const pnl = payout - cost

    betRecords.push({
      id: uuidv4(),
      resultId: gameResult.id,
      date: gameResult.date,
      game: gameResult.game,
      strategy: cfg.id,
      betLevel,
      cost,
      win,
      payout,
      pnl,
    })

    // ── Step 4: Update bet level ────────────────────────────────────────────
    cfg.betLevel = calcNextBet(win, betLevel)

    // ── Step 5: Decrement cycle for S4–S8 ──────────────────────────────────
    if (isTriggerStrategy && cfg.cycleRemaining > 0) {
      cfg.cycleRemaining -= 1
    }
  }

  return { betRecords, updatedStrategies }
}

// ─── Default strategy configs ────────────────────────────────────────────────

function generateDefaultNumbers(strategyIndex: number): number[] {
  // Deterministic spread across 0–99, different per strategy
  const nums: number[] = []
  const step = Math.floor(100 / NUMBERS_COUNT)
  const offset = strategyIndex * 3
  for (let i = 0; i < NUMBERS_COUNT; i++) {
    nums.push((i * step + offset) % 100)
  }
  return [...new Set(nums)].slice(0, NUMBERS_COUNT)
}

export function buildDefaultStrategies(): StrategyConfig[] {
  return (['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'] as StrategyId[]).map((id, idx) => ({
    id,
    enabled: ['S1', 'S2', 'S3'].includes(id),
    numbers: generateDefaultNumbers(idx),
    betLevel: BASE_BET,
    s3Dates: [...DEFAULT_S3_DATES],
    cycleLength: 8 as 8 | 12,
    cycleRemaining: 0,
  }))
}

// ─── Bulk-paste parser ───────────────────────────────────────────────────────

export interface ParsedBulkRow {
  date: string   // YYYY-MM-DD
  game: Game
  result: number
  error?: string
}

const GAME_ALIASES: Record<string, Game> = {
  frbd: 'FRBD', faridabad: 'FRBD', fb: 'FRBD',
  gzbd: 'GZBD', ghaziabad: 'GZBD', gz: 'GZBD',
  gali: 'GALI', gl: 'GALI',
  dswr: 'DSWR', disawar: 'DSWR', dw: 'DSWR',
}

/**
 * Parse tab/comma separated bulk paste:
 * Each row: date | game | result
 * e.g.  "2024-01-15  GALI  45"
 */
export function parseBulkPaste(raw: string, dswrOffset: boolean = true): ParsedBulkRow[] {
  const rows: ParsedBulkRow[] = []
  const lines = raw.trim().split('\n').filter(l => l.trim())

  for (const line of lines) {
    const parts = line.trim().split(/[\t,|; ]+/)
    if (parts.length < 3) {
      rows.push({ date: '', game: 'GALI', result: 0, error: `Cannot parse: "${line}"` })
      continue
    }

    const [rawDate, rawGame, rawResult] = parts
    const gameKey = rawGame.toLowerCase()
    const game = GAME_ALIASES[gameKey]
    if (!game) {
      rows.push({ date: rawDate, game: 'GALI', result: 0, error: `Unknown game: "${rawGame}"` })
      continue
    }

    const result = parseInt(rawResult, 10)
    if (isNaN(result) || result < 0 || result > 99) {
      rows.push({ date: rawDate, game, result: 0, error: `Invalid result: "${rawResult}"` })
      continue
    }

    let date = rawDate
    // DSWR belongs to previous day
    if (game === 'DSWR' && dswrOffset) {
      const d = new Date(rawDate + 'T12:00:00')
      d.setDate(d.getDate() - 1)
      date = d.toISOString().split('T')[0]
    }

    rows.push({ date, game, result })
  }

  return rows
}
