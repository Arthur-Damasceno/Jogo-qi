import type { ReactNode } from 'react'

export type GameId = 'critical' | 'verbal' | 'numeric' | 'matrices' | 'memory'

export interface GameInfo {
  id: GameId
  nome: string
  emoji: string
  descricao: string
  maxLevel: number
}

export const GAMES: GameInfo[] = [
  {
    id: 'critical',
    nome: 'Raciocínio Crítico',
    emoji: '🧠',
    descricao: 'Silogismos, falácias e análise de argumentos',
    maxLevel: 3,
  },
  {
    id: 'matrices',
    nome: 'Matrizes de Padrões',
    emoji: '🔷',
    descricao: 'Descubra a peça que completa o padrão visual',
    maxLevel: 5,
  },
  {
    id: 'memory',
    nome: 'Memória de Trabalho',
    emoji: '🎯',
    descricao: 'Memorize e reproduza sequências espaciais',
    maxLevel: 5,
  },
  {
    id: 'numeric',
    nome: 'Raciocínio Numérico',
    emoji: '🔢',
    descricao: 'Complete sequências e padrões numéricos',
    maxLevel: 5,
  },
  {
    id: 'verbal',
    nome: 'Raciocínio Verbal',
    emoji: '📚',
    descricao: 'Analogias, sinônimos e lógica com palavras',
    maxLevel: 3,
  },
]

export const gameInfo = (id: GameId): GameInfo => GAMES.find((g) => g.id === id)!

export interface QuizQuestion {
  /** Instrução curta acima do enunciado, ex.: "Complete a sequência" */
  instrucao?: string
  prompt: ReactNode
  options: ReactNode[]
  correct: number
  explanation?: string
}
