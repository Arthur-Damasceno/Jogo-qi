import { GAMES, gameInfo, type GameId } from '../games/types'

export interface SessionRecord {
  date: string // YYYY-MM-DD
  score: number
  total: number
  level: number
}

export interface GameProgress {
  level: number
  xp: number
  best: number // melhor % de acerto
  sessions: SessionRecord[]
}

export interface AppState {
  games: Record<GameId, GameProgress>
  streak: { count: number; last: string }
}

const KEY = 'jogo-qi-v1'

const emptyGame = (): GameProgress => ({ level: 1, xp: 0, best: 0, sessions: [] })

const emptyState = (): AppState => ({
  games: Object.fromEntries(GAMES.map((g) => [g.id, emptyGame()])) as Record<GameId, GameProgress>,
  streak: { count: 0, last: '' },
})

/** Data local no formato YYYY-MM-DD */
export const today = (): string => new Date().toLocaleDateString('sv')

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return emptyState()
    const parsed = JSON.parse(raw) as AppState
    // garante que jogos novos ganhem entrada ao atualizar o app
    const base = emptyState()
    return {
      streak: parsed.streak ?? base.streak,
      games: { ...base.games, ...parsed.games },
    }
  } catch {
    return emptyState()
  }
}

function save(state: AppState) {
  localStorage.setItem(KEY, JSON.stringify(state))
}

export interface SessionResult {
  score: number
  total: number
  xpGained: number
  levelBefore: number
  levelAfter: number
  streak: number
}

/** Regras de progressão: ≥80% de acerto sobe de nível, <40% desce. */
export function recordSession(gameId: GameId, score: number, total: number): SessionResult {
  const state = loadState()
  const game = state.games[gameId]
  const accuracy = total > 0 ? score / total : 0
  const levelBefore = game.level
  const maxLevel = gameInfo(gameId).maxLevel

  let levelAfter = levelBefore
  if (accuracy >= 0.8 && levelBefore < maxLevel) levelAfter = levelBefore + 1
  else if (accuracy < 0.4 && levelBefore > 1) levelAfter = levelBefore - 1

  const xpGained = score * 10 * levelBefore
  game.level = levelAfter
  game.xp += xpGained
  game.best = Math.max(game.best, Math.round(accuracy * 100))
  game.sessions.push({ date: today(), score, total, level: levelBefore })
  if (game.sessions.length > 60) game.sessions = game.sessions.slice(-60)

  // sequência de dias treinados
  const t = today()
  if (state.streak.last !== t) {
    const yesterday = new Date(Date.now() - 86_400_000).toLocaleDateString('sv')
    state.streak.count = state.streak.last === yesterday ? state.streak.count + 1 : 1
    state.streak.last = t
  }

  save(state)
  return { score, total, xpGained, levelBefore, levelAfter, streak: state.streak.count }
}

export const totalXp = (state: AppState): number =>
  Object.values(state.games).reduce((sum, g) => sum + g.xp, 0)

export function resetProgress() {
  localStorage.removeItem(KEY)
}
