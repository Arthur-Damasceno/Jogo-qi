import type { QuizQuestion } from '../types'
import { pick, randInt, shuffle } from '../bank'

interface Problem {
  texto: string
  resposta: number
}

type ProblemGen = () => Problem

const soma = (max: number): ProblemGen => () => {
  const a = randInt(2, max)
  const b = randInt(2, max)
  return { texto: `${a} + ${b}`, resposta: a + b }
}

const subtracao = (max: number): ProblemGen => () => {
  const a = randInt(10, max)
  const b = randInt(2, a - 1)
  return { texto: `${a} − ${b}`, resposta: a - b }
}

const multiplicacao = (min: number, max: number): ProblemGen => () => {
  const a = randInt(min, max)
  const b = randInt(min, max)
  return { texto: `${a} × ${b}`, resposta: a * b }
}

const divisao = (max: number): ProblemGen => () => {
  const b = randInt(2, 9)
  const q = randInt(2, max)
  return { texto: `${b * q} ÷ ${b}`, resposta: q }
}

const somaTripla = (): Problem => {
  const [a, b, c] = [randInt(5, 40), randInt(5, 40), randInt(5, 40)]
  return { texto: `${a} + ${b} + ${c}`, resposta: a + b + c }
}

const multMaisSoma = (): Problem => {
  const a = randInt(3, 12)
  const b = randInt(3, 12)
  const c = randInt(5, 30)
  return { texto: `${a} × ${b} + ${c}`, resposta: a * b + c }
}

const quadrado = (): Problem => {
  const a = randInt(11, 20)
  return { texto: `${a}²`, resposta: a * a }
}

const parenteses = (): Problem => {
  const a = randInt(4, 15)
  const b = randInt(4, 15)
  const c = randInt(2, 9)
  return { texto: `(${a} + ${b}) × ${c}`, resposta: (a + b) * c }
}

const porcentagem = (): Problem => {
  const pct = pick([10, 20, 25, 50, 75])
  const base = pick([40, 60, 80, 120, 160, 200, 240, 300])
  return { texto: `${pct}% de ${base}`, resposta: (pct / 100) * base }
}

const multGrande = (): Problem => {
  const a = randInt(12, 19)
  const b = randInt(12, 19)
  return { texto: `${a} × ${b}`, resposta: a * b }
}

const tresOperacoes = (): Problem => {
  const a = randInt(3, 9)
  const b = randInt(3, 9)
  const c = randInt(10, 60)
  const d = randInt(2, 20)
  return { texto: `${a} × ${b} + ${c} − ${d}`, resposta: a * b + c - d }
}

const GENS_BY_LEVEL: ProblemGen[][] = [
  /* 1 */ [soma(20)],
  /* 2 */ [soma(50), subtracao(50)],
  /* 3 */ [multiplicacao(2, 9), subtracao(80)],
  /* 4 */ [multiplicacao(3, 12), divisao(12)],
  /* 5 */ [somaTripla, multiplicacao(4, 12), divisao(15)],
  /* 6 */ [multMaisSoma, quadrado, divisao(20)],
  /* 7 */ [parenteses, multMaisSoma, somaTripla],
  /* 8 */ [porcentagem, quadrado, parenteses],
  /* 9 */ [multGrande, tresOperacoes, porcentagem],
  /* 10 */ [tresOperacoes, multGrande, parenteses, porcentagem],
]

function distractors(resposta: number): number[] {
  const out = new Set<number>()
  const deltas = shuffle([1, 2, 10, -1, -2, -10, resposta >= 100 ? 100 : 5])
  for (const d of deltas) {
    const v = resposta + d
    if (v !== resposta && v >= 0) out.add(v)
    if (out.size === 3) break
  }
  return [...out]
}

export function buildCalcQuiz(level: number, count = 10): QuizQuestion[] {
  const gens = GENS_BY_LEVEL[Math.min(level, GENS_BY_LEVEL.length) - 1]
  return Array.from({ length: count }, () => {
    const p = pick(gens)()
    const options = shuffle([p.resposta, ...distractors(p.resposta)])
    return {
      instrucao: 'Calcule de cabeça',
      prompt: `${p.texto} = ?`,
      options: options.map(String),
      correct: options.indexOf(p.resposta),
    }
  })
}
