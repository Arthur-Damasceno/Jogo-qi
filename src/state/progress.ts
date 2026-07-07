import { GAMES, gameInfo, type GameId } from '../games/types'
import { activeProfile, progressKey } from './profiles'

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

const emptyGame = (): GameProgress => ({ level: 1, xp: 0, best: 0, sessions: [] })

const emptyState = (): AppState => ({
  games: Object.fromEntries(GAMES.map((g) => [g.id, emptyGame()])) as Record<GameId, GameProgress>,
  streak: { count: 0, last: '' },
})

/** Data local no formato YYYY-MM-DD */
export const today = (): string => new Date().toLocaleDateString('sv')

function storageKey(): string | null {
  const profile = activeProfile()
  return profile ? progressKey(profile.id) : null
}

export function loadState(): AppState {
  try {
    const key = storageKey()
    const raw = key ? localStorage.getItem(key) : null
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
  const key = storageKey()
  if (key) localStorage.setItem(key, JSON.stringify(state))
}

// ---------------------------------------------------------------- QI estimado

/**
 * QI estimado por jogo, numa escala de 80 a 200.
 * "Nível efetivo" = (nível − 1) + acerto médio das últimas 5 sessões (0 a 1).
 * Cada nível efetivo vale 12 pontos: nível 10 com 100% de acerto ≈ 200.
 */
export function gameQi(g: GameProgress): number | null {
  if (g.sessions.length === 0) return null
  const recent = g.sessions.slice(-5)
  const acc = recent.reduce((s, r) => s + r.score / r.total, 0) / recent.length
  const eff = g.level - 1 + acc
  return Math.min(200, Math.round(80 + 12 * eff))
}

/** QI estimado geral: média dos jogos já treinados. */
export function overallQi(state: AppState): number | null {
  const values = Object.values(state.games)
    .map(gameQi)
    .filter((v): v is number => v !== null)
  if (values.length === 0) return null
  return Math.round(values.reduce((s, v) => s + v, 0) / values.length)
}

// ---------------------------------------------------------------- sessões

export interface SessionResult {
  score: number
  total: number
  xpGained: number
  levelBefore: number
  levelAfter: number
  streak: number
  qiBefore: number | null
  qiAfter: number | null
}

/** Regras de progressão: ≥80% de acerto sobe de nível, <40% desce. */
export function recordSession(gameId: GameId, score: number, total: number): SessionResult {
  const state = loadState()
  const qiBefore = overallQi(state)
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
  return {
    score,
    total,
    xpGained,
    levelBefore,
    levelAfter,
    streak: state.streak.count,
    qiBefore,
    qiAfter: overallQi(state),
  }
}

export const totalXp = (state: AppState): number =>
  Object.values(state.games).reduce((sum, g) => sum + g.xp, 0)

export function resetProgress() {
  const key = storageKey()
  if (key) localStorage.removeItem(key)
}
