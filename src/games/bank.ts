import { getSeenQuestions, markQuestionsSeen } from '../state/progress'
import type { GameId, QuizQuestion } from './types'

/** Item de banco de questões: a primeira alternativa é sempre a correta. */
export interface BankItem {
  tier: 1 | 2 | 3
  q: string
  choices: string[]
  explain: string
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1))
}

/** ID estável de uma questão (hash djb2 do enunciado). */
export function questionId(item: BankItem): string {
  let h = 5381
  for (let i = 0; i < item.q.length; i++) h = ((h << 5) + h + item.q.charCodeAt(i)) >>> 0
  return h.toString(36)
}

/**
 * Monta uma sessão a partir do banco: sorteia `count` questões do tier
 * correspondente ao nível e embaralha as alternativas.
 * Níveis 1-3 → tier 1, 4-7 → tier 2, 8-10 → tier 3 (nos níveis altos a
 * dificuldade extra vem também do tempo limite por questão).
 *
 * Anti-repetição: questões nunca vistas têm prioridade absoluta (primeiro as
 * do tier do nível, depois as dos tiers vizinhos). Só há repetição quando o
 * banco inteiro já foi visto — e então voltam primeiro as vistas há mais tempo.
 */
export function buildQuizFromBank(
  bank: BankItem[],
  level: number,
  count: number,
  gameId: GameId,
): QuizQuestion[] {
  const tier = (level <= 3 ? 1 : level <= 7 ? 2 : 3) as 1 | 2 | 3
  const seen = getSeenQuestions(gameId)
  const seenRank = new Map(seen.map((id, i) => [id, i]))

  const ranked = shuffle(bank)
    .map((item) => {
      const id = questionId(item)
      const rank = seenRank.get(id)
      return { item, id, seenKey: rank === undefined ? -1 : rank, dist: Math.abs(item.tier - tier) }
    })
    .sort((a, b) => {
      const aSeen = a.seenKey >= 0 ? 1 : 0
      const bSeen = b.seenKey >= 0 ? 1 : 0
      if (aSeen !== bSeen) return aSeen - bSeen // não vistas primeiro
      if (aSeen === 0) return a.dist - b.dist // não vistas: tier mais próximo primeiro
      if (a.seenKey !== b.seenKey) return a.seenKey - b.seenKey // vistas: mais antigas primeiro
      return a.dist - b.dist
    })

  const chosen = ranked.slice(0, count)
  markQuestionsSeen(gameId, chosen.map((c) => c.id))

  return shuffle(chosen.map((c) => c.item)).map((item) => {
    const order = shuffle(item.choices.map((_, i) => i))
    return {
      prompt: item.q,
      options: order.map((i) => item.choices[i]),
      correct: order.indexOf(0),
      explanation: item.explain,
    }
  })
}
