import { useEffect, useRef, useState } from 'react'

interface Props {
  level: number
  onFinish: (score: number, total: number) => void
}

const MATCHES = 6

/**
 * N-Back espacial: uma célula acende por vez; o jogador aperta o botão
 * sempre que a posição atual for igual à de N passos atrás.
 * Pontuação: acertos menos alarmes falsos (mínimo zero) sobre 6 repetições.
 */
export default function NBackGame({ level, onFinish }: Props) {
  const n = level <= 3 ? 1 : level <= 7 ? 2 : 3
  const total = 18 + n
  const stimulusMs = Math.max(2200 - level * 110, 1000)

  const [sequence] = useState(() => generateSequence(total, n))
  const [pos, setPos] = useState(-1) // índice do estímulo atual (-1 = instruções)
  const [lit, setLit] = useState<number | null>(null)
  const [pressedAt, setPressedAt] = useState<Set<number>>(new Set())
  const [flash, setFlash] = useState<'good' | 'bad' | null>(null)
  const [running, setRunning] = useState(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  function start() {
    setRunning(true)
    for (let i = 0; i < total; i++) {
      timers.current.push(
        setTimeout(() => {
          setPos(i)
          setLit(sequence[i])
          setFlash(null)
        }, i * stimulusMs),
        setTimeout(() => setLit(null), i * stimulusMs + stimulusMs - 300),
      )
    }
    timers.current.push(setTimeout(() => setPos(total), total * stimulusMs))
  }

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  // fim da sequência: calcula a pontuação
  useEffect(() => {
    if (pos !== total) return
    let hits = 0
    let falseAlarms = 0
    for (const i of pressedAt) {
      if (i >= n && sequence[i] === sequence[i - n]) hits++
      else falseAlarms++
    }
    const t = setTimeout(() => onFinish(Math.max(0, hits - falseAlarms), MATCHES), 600)
    return () => clearTimeout(t)
  }, [pos, total, pressedAt, sequence, n, onFinish])

  function press() {
    if (!running || pos < 0 || pos >= total || pressedAt.has(pos)) return
    setPressedAt((prev) => new Set(prev).add(pos))
    const isMatch = pos >= n && sequence[pos] === sequence[pos - n]
    setFlash(isMatch ? 'good' : 'bad')
  }

  return (
    <div className="memory">
      <p className="quiz-instrucao">
        Aperte quando a posição repetir a de {n} passo{n > 1 ? 's' : ''} atrás
      </p>

      {!running ? (
        <div className="nback-intro">
          <p>
            As células vão acender uma por vez. Sua missão: apertar o botão sempre que a célula
            acesa for <strong>a mesma de {n} passo{n > 1 ? 's' : ''} atrás</strong>. São {total}{' '}
            estímulos com {MATCHES} repetições escondidas.
          </p>
          <button className="btn primary" onClick={start}>
            Começar
          </button>
        </div>
      ) : (
        <>
          <p className="memory-status">
            {pos >= total ? 'Calculando...' : `Estímulo ${Math.max(pos + 1, 1)} de ${total}`}
          </p>
          <div className="memory-grid size-3" role="group" aria-label="Grade N-Back">
            {Array.from({ length: 9 }, (_, i) => (
              <div key={i} className={`memory-cell ${lit === i ? 'lit' : ''}`} />
            ))}
          </div>
          <button
            className={`btn nback-btn ${flash === 'good' ? 'good' : flash === 'bad' ? 'bad' : 'primary'}`}
            onClick={press}
            disabled={pos < 0 || pos >= total}
          >
            {flash === 'good' ? '✅ Repetiu!' : flash === 'bad' ? '❌ Não repetiu' : '🔁 É igual!'}
          </button>
        </>
      )}
    </div>
  )
}

/** Gera sequência com exatamente MATCHES repetições n-back, sem repetições acidentais. */
function generateSequence(total: number, n: number): number[] {
  const matchIdx = new Set<number>()
  while (matchIdx.size < MATCHES) {
    matchIdx.add(n + Math.floor(Math.random() * (total - n)))
  }
  const seq: number[] = []
  for (let i = 0; i < total; i++) {
    if (matchIdx.has(i)) {
      seq.push(seq[i - n])
    } else {
      let c = Math.floor(Math.random() * 9)
      while (i >= n && c === seq[i - n]) c = Math.floor(Math.random() * 9)
      seq.push(c)
    }
  }
  return seq
}
