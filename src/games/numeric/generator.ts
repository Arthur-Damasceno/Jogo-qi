import type { QuizQuestion } from '../types'
import { pick, randInt, shuffle } from '../bank'

interface Seq {
  terms: number[]
  answer: number
  rule: string
}

type SeqGen = () => Seq

// ---------- geradores de sequência por dificuldade ----------

const arithmetic = (min: number, max: number): SeqGen => () => {
  const step = randInt(min, max) * (Math.random() < 0.3 ? -1 : 1)
  const start = randInt(1, 20)
  const terms = Array.from({ length: 5 }, (_, i) => start + step * i)
  return {
    terms,
    answer: start + step * 5,
    rule: step > 0 ? `Cada termo aumenta ${step}.` : `Cada termo diminui ${-step}.`,
  }
}

const geometric = (): Seq => {
  const ratio = pick([2, 3])
  const start = randInt(1, 5)
  const terms = Array.from({ length: 5 }, (_, i) => start * ratio ** i)
  return { terms, answer: start * ratio ** 5, rule: `Cada termo é multiplicado por ${ratio}.` }
}

const alternating = (): Seq => {
  const up = randInt(4, 12)
  const down = randInt(1, up - 1)
  const start = randInt(1, 15)
  const terms = [start]
  for (let i = 1; i < 5; i++) terms.push(terms[i - 1] + (i % 2 === 1 ? up : -down))
  return {
    terms,
    answer: terms[4] + (5 % 2 === 1 ? up : -down),
    rule: `A sequência alterna: soma ${up}, subtrai ${down}.`,
  }
}

const squares = (): Seq => {
  const offset = randInt(0, 4)
  const shift = randInt(-2, 2)
  const terms = Array.from({ length: 5 }, (_, i) => (i + 1 + offset) ** 2 + shift)
  return {
    terms,
    answer: (6 + offset) ** 2 + shift,
    rule:
      shift === 0
        ? 'São quadrados perfeitos consecutivos.'
        : `São quadrados perfeitos ${shift > 0 ? `mais ${shift}` : `menos ${-shift}`}.`,
  }
}

const growingDiff = (): Seq => {
  const start = randInt(1, 10)
  const firstDiff = randInt(1, 4)
  const terms = [start]
  for (let i = 1; i < 5; i++) terms.push(terms[i - 1] + firstDiff + (i - 1))
  return {
    terms,
    answer: terms[4] + firstDiff + 4,
    rule: `A diferença entre os termos cresce 1 a cada passo (+${firstDiff}, +${firstDiff + 1}, +${firstDiff + 2}...).`,
  }
}

const fibonacciLike = (): Seq => {
  const a = randInt(1, 5)
  const b = randInt(a, 8)
  const terms = [a, b]
  for (let i = 2; i < 5; i++) terms.push(terms[i - 1] + terms[i - 2])
  return {
    terms,
    answer: terms[4] + terms[3],
    rule: 'Cada termo é a soma dos dois anteriores.',
  }
}

const affine = (): Seq => {
  const mult = 2
  const add = pick([1, -1, 3])
  const start = randInt(1, 6)
  const terms = [start]
  for (let i = 1; i < 5; i++) terms.push(terms[i - 1] * mult + add)
  return {
    terms,
    answer: terms[4] * mult + add,
    rule: `Cada termo é o anterior ×${mult} ${add > 0 ? `+ ${add}` : `− ${-add}`}.`,
  }
}

const interleaved = (): Seq => {
  const stepA = randInt(2, 6)
  const stepB = randInt(2, 6)
  const a0 = randInt(1, 10)
  const b0 = randInt(1, 10)
  const terms = Array.from({ length: 6 }, (_, i) =>
    i % 2 === 0 ? a0 + stepA * (i / 2) : b0 + stepB * ((i - 1) / 2),
  )
  return {
    terms,
    answer: a0 + stepA * 3,
    rule: `Duas sequências intercaladas: uma soma ${stepA}, a outra soma ${stepB}.`,
  }
}

const primes = (): Seq => {
  const ps = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43]
  const start = randInt(0, 7)
  const terms = ps.slice(start, start + 5)
  return { terms, answer: ps[start + 5], rule: 'São números primos consecutivos.' }
}

const cubes = (): Seq => {
  const offset = randInt(0, 2)
  const terms = Array.from({ length: 5 }, (_, i) => (i + 1 + offset) ** 3)
  return { terms, answer: (6 + offset) ** 3, rule: 'São cubos perfeitos consecutivos.' }
}

const triangular = (): Seq => {
  const offset = randInt(1, 5)
  const tri = (n: number) => (n * (n + 1)) / 2
  const terms = Array.from({ length: 5 }, (_, i) => tri(i + offset))
  return {
    terms,
    answer: tri(5 + offset),
    rule: 'São números triangulares: a diferença cresce 1 a cada termo.',
  }
}

const affine3 = (): Seq => {
  const add = pick([1, 2, -1, -2])
  const start = randInt(1, 4)
  const terms = [start]
  for (let i = 1; i < 5; i++) terms.push(terms[i - 1] * 3 + add)
  return {
    terms,
    answer: terms[4] * 3 + add,
    rule: `Cada termo é o anterior ×3 ${add > 0 ? `+ ${add}` : `− ${-add}`}.`,
  }
}

const alternatingGeo = (): Seq => {
  const sub = randInt(1, 6)
  const start = randInt(2, 8)
  const terms = [start]
  for (let i = 1; i < 5; i++) terms.push(i % 2 === 1 ? terms[i - 1] * 2 : terms[i - 1] - sub)
  return {
    terms,
    answer: 5 % 2 === 1 ? terms[4] * 2 : terms[4] - sub,
    rule: `A sequência alterna: multiplica por 2, subtrai ${sub}.`,
  }
}

const interleavedGeo = (): Seq => {
  const stepA = randInt(3, 8)
  const a0 = randInt(1, 10)
  const b0 = randInt(1, 4)
  const terms = Array.from({ length: 6 }, (_, i) =>
    i % 2 === 0 ? a0 + stepA * (i / 2) : b0 * 2 ** ((i - 1) / 2),
  )
  return {
    terms,
    answer: a0 + stepA * 3,
    rule: `Duas sequências intercaladas: uma soma ${stepA}, a outra dobra.`,
  }
}

const GENS_BY_LEVEL: SeqGen[][] = [
  /* 1 */ [arithmetic(2, 9)],
  /* 2 */ [arithmetic(3, 12), geometric],
  /* 3 */ [alternating, growingDiff, arithmetic(4, 15)],
  /* 4 */ [squares, fibonacciLike, alternating],
  /* 5 */ [affine, growingDiff, triangular],
  /* 6 */ [interleaved, affine, squares, triangular],
  /* 7 */ [primes, alternatingGeo, fibonacciLike, interleaved],
  /* 8 */ [cubes, interleavedGeo, affine3],
  /* 9 */ [primes, cubes, alternatingGeo, interleavedGeo],
  /* 10 */ [affine3, interleavedGeo, cubes, primes, alternatingGeo],
]

function distractors(seq: Seq): number[] {
  const { terms, answer } = seq
  const lastDiff = Math.abs(terms[terms.length - 1] - terms[terms.length - 2]) || 2
  const candidates = new Set<number>()
  const tryAdd = (n: number) => {
    if (n !== answer && !terms.includes(n)) candidates.add(n)
  }
  tryAdd(answer + lastDiff)
  tryAdd(answer - lastDiff)
  tryAdd(answer + Math.max(1, Math.round(lastDiff / 2)))
  tryAdd(answer + randInt(1, 3))
  tryAdd(answer - randInt(1, 3))
  tryAdd(answer + lastDiff + randInt(1, 4))
  return shuffle([...candidates]).slice(0, 3)
}

export function buildNumericQuiz(level: number, count = 8): QuizQuestion[] {
  const gens = GENS_BY_LEVEL[Math.min(level, GENS_BY_LEVEL.length) - 1]
  const questions: QuizQuestion[] = []
  for (let i = 0; i < count; i++) {
    let seq = pick(gens)()
    let wrong = distractors(seq)
    // regenera nos raros casos em que não há 3 distratores válidos
    for (let guard = 0; wrong.length < 3 && guard < 5; guard++) {
      seq = pick(gens)()
      wrong = distractors(seq)
    }
    const options = shuffle([seq.answer, ...wrong])
    questions.push({
      instrucao: 'Qual é o próximo número da sequência?',
      prompt: `${seq.terms.join(',  ')},  ?`,
      options: options.map(String),
      correct: options.indexOf(seq.answer),
      explanation: seq.rule,
    })
  }
  return questions
}
