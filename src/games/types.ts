import type { ReactNode } from 'react'

export type GameId =
  | 'critical'
  | 'verbal'
  | 'numeric'
  | 'matrices'
  | 'memory'
  | 'nback'
  | 'stroop'
  | 'calc'

export const MAX_LEVEL = 10

export interface GameInfo {
  id: GameId
  nome: string
  emoji: string
  descricao: string
  cor: string
  maxLevel: number
}

export const GAMES: GameInfo[] = [
  {
    id: 'critical',
    nome: 'Raciocínio Crítico',
    emoji: '🧠',
    descricao: 'Silogismos, falácias e análise de argumentos',
    cor: '#9b5cff',
    maxLevel: MAX_LEVEL,
  },
  {
    id: 'matrices',
    nome: 'Matrizes de Padrões',
    emoji: '🔷',
    descricao: 'Descubra a peça que completa o padrão visual',
    cor: '#6ea2ff',
    maxLevel: MAX_LEVEL,
  },
  {
    id: 'memory',
    nome: 'Memória de Trabalho',
    emoji: '🎯',
    descricao: 'Memorize e reproduza sequências espaciais',
    cor: '#3ecf8e',
    maxLevel: MAX_LEVEL,
  },
  {
    id: 'nback',
    nome: 'N-Back',
    emoji: '🔁',
    descricao: 'Detecte repetições N passos atrás',
    cor: '#ff9f43',
    maxLevel: MAX_LEVEL,
  },
  {
    id: 'stroop',
    nome: 'Stroop',
    emoji: '🎨',
    descricao: 'Toque na cor da tinta, não na palavra',
    cor: '#ff6b9d',
    maxLevel: MAX_LEVEL,
  },
  {
    id: 'numeric',
    nome: 'Raciocínio Numérico',
    emoji: '🔢',
    descricao: 'Complete sequências e padrões numéricos',
    cor: '#4ecdc4',
    maxLevel: MAX_LEVEL,
  },
  {
    id: 'calc',
    nome: 'Cálculo Mental',
    emoji: '➗',
    descricao: 'Aritmética rápida contra o relógio',
    cor: '#ffd34d',
    maxLevel: MAX_LEVEL,
  },
  {
    id: 'verbal',
    nome: 'Raciocínio Verbal',
    emoji: '📚',
    descricao: 'Analogias, sinônimos e lógica com palavras',
    cor: '#63e6be',
    maxLevel: MAX_LEVEL,
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
