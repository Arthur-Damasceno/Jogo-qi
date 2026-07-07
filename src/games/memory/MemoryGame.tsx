import { useEffect, useRef, useState } from 'react'

interface Props {
  level: number
  onFinish: (score: number, total: number) => void
}

const ROUNDS = 5

/**
 * Memória de trabalho: uma sequência de células acende; o jogador deve
 * reproduzi-la na mesma ordem. A cada rodada vencida a sequência cresce.
 */
export default function MemoryGame({ level, onFinish }: Props) {
  const gridSize = level <= 2 ? 3 : level <= 6 ? 4 : 5
  const cellCount = gridSize * gridSize
  const baseLen = 2 + Math.ceil(level / 2) // nível 1 → 3 células ... nível 10 → 7
  const flashMs = Math.max(650 - level * 45, 260)

  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [phase, setPhase] = useState<'watch' | 'input' | 'roundOk' | 'roundFail'>('watch')
  const [sequence, setSequence] = useState<number[]>([])
  const [litCell, setLitCell] = useState<number | null>(null)
  const [inputPos, setInputPos] = useState(0)
  const [lastTap, setLastTap] = useState<{ cell: number; ok: boolean } | null>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  // inicia cada rodada: sorteia e exibe a sequência
  useEffect(() => {
    const len = baseLen + round
    const seq: number[] = []
    while (seq.length < len) {
      const c = Math.floor(Math.random() * cellCount)
      if (seq[seq.length - 1] !== c) seq.push(c)
    }
    setSequence(seq)
    setPhase('watch')
    setInputPos(0)
    setLastTap(null)

    seq.forEach((cell, i) => {
      timers.current.push(
        setTimeout(() => setLitCell(cell), 600 + i * (flashMs + 180)),
        setTimeout(() => setLitCell(null), 600 + i * (flashMs + 180) + flashMs),
      )
    })
    timers.current.push(
      setTimeout(() => setPhase('input'), 600 + seq.length * (flashMs + 180) + 200),
    )
    return () => {
      timers.current.forEach(clearTimeout)
      timers.current = []
    }
  }, [round, baseLen, cellCount, flashMs])

  function tap(cell: number) {
    if (phase !== 'input') return
    const ok = sequence[inputPos] === cell
    setLastTap({ cell, ok })
    if (!ok) {
      setPhase('roundFail')
      return
    }
    if (inputPos + 1 === sequence.length) {
      setScore((s) => s + 1)
      setPhase('roundOk')
      return
    }
    setInputPos((p) => p + 1)
  }

  function nextRound() {
    const finalScore = score // já inclui a rodada atual (atualizado em tap)
    if (round + 1 === ROUNDS) {
      onFinish(finalScore, ROUNDS)
      return
    }
    setRound((r) => r + 1)
  }

  const statusText =
    phase === 'watch'
      ? '👀 Observe a sequência...'
      : phase === 'input'
        ? `✋ Sua vez! (${inputPos}/${sequence.length})`
        : phase === 'roundOk'
          ? '✅ Sequência correta!'
          : '❌ Ops, não era essa célula.'

  return (
    <div className="memory">
      <div className="quiz-progress">
        {Array.from({ length: ROUNDS }, (_, i) => (
          <span key={i} className={`dot ${i < round ? 'done' : i === round ? 'now' : ''}`} />
        ))}
      </div>

      <p className="quiz-instrucao">
        Rodada {round + 1} de {ROUNDS} — sequência de {sequence.length} células
      </p>
      <p className="memory-status">{statusText}</p>

      <div
        className={`memory-grid size-${gridSize} ${phase === 'input' ? 'active' : ''}`}
        role="group"
        aria-label="Grade de memória"
      >
        {Array.from({ length: cellCount }, (_, i) => {
          let cls = 'memory-cell'
          if (litCell === i) cls += ' lit'
          if (lastTap?.cell === i && phase !== 'watch') cls += lastTap.ok ? ' good' : ' bad'
          return (
            <button
              key={i}
              className={cls}
              onClick={() => tap(i)}
              disabled={phase !== 'input'}
              aria-label={`Célula ${i + 1}`}
            />
          )
        })}
      </div>

      {(phase === 'roundOk' || phase === 'roundFail') && (
        <button className="btn primary" onClick={nextRound}>
          {round + 1 === ROUNDS ? 'Ver resultado' : 'Próxima rodada'}
        </button>
      )}
    </div>
  )
}
