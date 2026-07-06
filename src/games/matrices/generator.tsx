import type { ReactNode } from 'react'
import type { QuizQuestion } from '../types'
import { pick, randInt, shuffle } from '../bank'

/** Uma célula da matriz: forma, quantidade e preenchimento. */
interface Cell {
  shape: number // índice em SHAPES
  count: number // 1 a 3
  filled: boolean
}

const SHAPES = ['circle', 'square', 'triangle', 'diamond'] as const
const COLORS = ['#6ea2ff', '#c58fff', '#ffd34d', '#63e6be']

function shapePath(shape: number, cx: number, cy: number, r: number): ReactNode {
  const key = `${shape}-${cx}-${cy}`
  switch (SHAPES[shape % SHAPES.length]) {
    case 'circle':
      return <circle key={key} cx={cx} cy={cy} r={r} />
    case 'square':
      return <rect key={key} x={cx - r} y={cy - r} width={2 * r} height={2 * r} rx={r * 0.15} />
    case 'triangle':
      return (
        <polygon
          key={key}
          points={`${cx},${cy - r} ${cx + r * 0.95},${cy + r * 0.75} ${cx - r * 0.95},${cy + r * 0.75}`}
        />
      )
    case 'diamond':
      return (
        <polygon key={key} points={`${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`} />
      )
  }
}

/** Desenha uma célula (até 3 cópias da forma) num quadrado 100×100. */
function CellArt({ cell, color }: { cell: Cell; color: string }) {
  const positions: Record<number, [number, number][]> = {
    1: [[50, 50]],
    2: [
      [32, 32],
      [68, 68],
    ],
    3: [
      [28, 28],
      [50, 50],
      [72, 72],
    ],
  }
  const r = cell.count === 1 ? 26 : cell.count === 2 ? 18 : 14
  return (
    <g
      fill={cell.filled ? color : 'none'}
      stroke={color}
      strokeWidth={cell.filled ? 0 : 5}
    >
      {positions[cell.count].map(([x, y]) => shapePath(cell.shape, x, y, r))}
    </g>
  )
}

function sameCell(a: Cell, b: Cell): boolean {
  return a.shape === b.shape && a.count === b.count && a.filled === b.filled
}

/** Gera a regra da matriz 3×3 conforme o nível e devolve as 9 células. */
function generateGrid(level: number): Cell[][] {
  const shapes = shuffle([0, 1, 2, 3]).slice(0, 3)
  const transposed = Math.random() < 0.5
  const at = (r: number, c: number) => (transposed ? [c, r] : [r, c])

  const grid: Cell[][] = []
  for (let r = 0; r < 3; r++) {
    grid.push([])
    for (let c = 0; c < 3; c++) {
      const [rr, cc] = at(r, c)
      let cell: Cell
      if (level <= 1) {
        // uma dimensão varia: forma por linha
        cell = { shape: shapes[rr], count: 1, filled: true }
      } else if (level === 2) {
        // forma por linha, quantidade por coluna
        cell = { shape: shapes[rr], count: cc + 1, filled: true }
      } else if (level === 3) {
        // + preenchimento alternado
        cell = { shape: shapes[rr], count: cc + 1, filled: (rr + cc) % 2 === 0 }
      } else if (level === 4) {
        // quadrado latino de formas, quantidade por linha
        cell = { shape: shapes[(rr + cc) % 3], count: rr + 1, filled: true }
      } else {
        // quadrado latino de formas e de quantidades, preenchimento alternado
        cell = {
          shape: shapes[(rr + cc) % 3],
          count: ((rr + 2 * cc) % 3) + 1,
          filled: (rr + cc) % 2 === 0,
        }
      }
      grid[r].push(cell)
    }
  }
  return grid
}

function mutate(cell: Cell, shapes: number[]): Cell {
  const kind = randInt(0, 2)
  if (kind === 0) {
    const others = shapes.filter((s) => s !== cell.shape)
    return { ...cell, shape: pick(others) }
  }
  if (kind === 1) {
    const counts = [1, 2, 3].filter((n) => n !== cell.count)
    return { ...cell, count: pick(counts) }
  }
  return { ...cell, filled: !cell.filled }
}

function MatrixArt({ grid }: { grid: Cell[][] }) {
  const color = pickColorForGrid(grid)
  return (
    <svg viewBox="0 0 316 316" className="matrix-grid" role="img" aria-label="Matriz de padrões 3 por 3">
      {grid.map((row, r) =>
        row.map((cell, c) => {
          const x = c * 106
          const y = r * 106
          const missing = r === 2 && c === 2
          return (
            <g key={`${r}-${c}`} transform={`translate(${x + 2}, ${y + 2})`}>
              <rect width={100} height={100} rx={12} className="matrix-cell-bg" />
              {missing ? (
                <text x={50} y={64} textAnchor="middle" className="matrix-question">
                  ?
                </text>
              ) : (
                <CellArt cell={cell} color={color} />
              )}
            </g>
          )
        }),
      )}
    </svg>
  )
}

// cor estável por matriz (derivada do conteúdo, para variar entre questões)
function pickColorForGrid(grid: Cell[][]): string {
  const seed = grid.flat().reduce((s, c) => s + c.shape + c.count * 7, 0)
  return COLORS[seed % COLORS.length]
}

function OptionArt({ cell, color }: { cell: Cell; color: string }) {
  return (
    <svg viewBox="0 0 100 100" className="matrix-option" aria-hidden="true">
      <CellArt cell={cell} color={color} />
    </svg>
  )
}

export function buildMatricesQuiz(level: number, count = 8): QuizQuestion[] {
  const questions: QuizQuestion[] = []
  for (let i = 0; i < count; i++) {
    const grid = generateGrid(level)
    const answer = grid[2][2]
    const usedShapes = [...new Set(grid.flat().map((c) => c.shape))]
    const color = pickColorForGrid(grid)

    const wrong: Cell[] = []
    for (let guard = 0; wrong.length < 3 && guard < 40; guard++) {
      let m = mutate(answer, usedShapes)
      if (Math.random() < 0.4) m = mutate(m, usedShapes)
      if (!sameCell(m, answer) && !wrong.some((w) => sameCell(w, m))) wrong.push(m)
    }

    const cells = shuffle([answer, ...wrong])
    questions.push({
      instrucao: 'Qual peça completa o padrão?',
      prompt: <MatrixArt grid={grid} />,
      options: cells.map((cell, j) => <OptionArt key={j} cell={cell} color={color} />),
      correct: cells.indexOf(answer),
      explanation: 'Observe como forma, quantidade e preenchimento mudam ao longo das linhas e colunas.',
    })
  }
  return questions
}
