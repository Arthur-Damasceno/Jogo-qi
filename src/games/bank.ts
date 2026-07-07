import type { QuizQuestion } from './types'

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

/**
 * Monta uma sessão a partir do banco: sorteia `count` questões do tier
 * correspondente ao nível (completando com tiers vizinhos se faltar)
 * e embaralha as alternativas.
 * Níveis 1-3 → tier 1, 4-7 → tier 2, 8-10 → tier 3 (nos níveis altos a
 * dificuldade extra vem também do tempo limite por questão).
 */
export function buildQuizFromBank(bank: BankItem[], level: number, count: number): QuizQuestion[] {
  const tier = (level <= 3 ? 1 : level <= 7 ? 2 : 3) as 1 | 2 | 3
  const primary = shuffle(bank.filter((b) => b.tier === tier))
  const rest = shuffle(bank.filter((b) => b.tier !== tier)).sort(
    (a, b) => Math.abs(a.tier - tier) - Math.abs(b.tier - tier),
  )
  const chosen = [...primary, ...rest].slice(0, count)

  return shuffle(chosen).map((item) => {
    const order = shuffle(item.choices.map((_, i) => i))
    return {
      prompt: item.q,
      options: order.map((i) => item.choices[i]),
      correct: order.indexOf(0),
      explanation: item.explain,
    }
  })
}
