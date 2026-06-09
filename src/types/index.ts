export type Game = 'FRBD' | 'GZBD' | 'GALI' | 'DSWR'
export type StrategyId = 'S1' | 'S2' | 'S3' | 'S4' | 'S5' | 'S6' | 'S7' | 'S8'

export const GAMES: Game[] = ['FRBD', 'GZBD', 'GALI', 'DSWR']
export const STRATEGY_IDS: StrategyId[] = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8']

export const DEFAULT_S3_DATES = [1,3,5,8,10,12,15,18,20,22,25,28]
export const BASE_BET = 10
export const NUMBERS_COUNT = 36
export const PAYOUT_PER_UNIT = 950

export interface GameResult {
  id: string
  date: string        // YYYY-MM-DD — for DSWR this is the PREVIOUS day
  game: Game
  result: number      // 00–99
  enteredAt: string   // ISO timestamp
}

export interface BetRecord {
  id: string
  resultId: string
  date: string
  game: Game
  strategy: StrategyId
  betLevel: number    // bet unit placed (10, 20, 40 …)
  cost: number        // 36 × betLevel
  win: boolean
  payout: number      // (betLevel/10) × 950 if win, else 0
  pnl: number         // payout − cost
}

export interface StrategyConfig {
  id: StrategyId
  enabled: boolean
  numbers: number[]   // exactly 36 numbers 00–99

  // Progression
  betLevel: number    // NEXT bet to place (resets to 10 on win, doubles on loss)

  // S3 calendar dates
  s3Dates: number[]   // day-of-month values, e.g. [1,3,5,…]

  // S4–S8 cycle
  cycleLength: 8 | 12
  cycleRemaining: number  // 0 = not in cycle; >0 = games left in current cycle
}

export interface AppSettings {
  maxBetAlert: number      // alert when any strategy bet ≥ this value
  maxDailyLossAlert: number
  repoName: string         // for GitHub Pages base path
}

export interface DailySummary {
  date: string
  cost: number
  payout: number
  pnl: number
  wins: number
  bets: number
}

export interface StrategySummary {
  strategy: StrategyId
  cost: number
  payout: number
  pnl: number
  wins: number
  bets: number
  roi: number  // pnl / cost * 100
  currentBet: number
  score: number
}
