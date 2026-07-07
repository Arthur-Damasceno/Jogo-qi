import { useEffect, useMemo, useState } from 'react'
import { pick, shuffle } from '../bank'

interface Props {
  level: number
  onFinish: (score: number, total: number) => void
}

interface Cor {
  nome: string
  hex: string
}

const CORES: Cor[] = [
  { nome: 'VERMELHO', hex: '#ff6b6b' },
  { nome: 'AZUL', hex: '#5b9bff' },
  { nome: 'VERDE', hex: '#3ecf8e' },
  { nome: 'AMARELO', hex: '#ffd34d' },
  { nome: 'ROXO', hex: '#b98aff' },
]

const TRIALS = 14

interface Trial {
  palavra: Cor // o que está escrito
  tinta: Cor // a cor em que está escrito (resposta certa)
  opcoes: Cor[]
}

function makeTrial(level: number): Trial {
  const palavra = pick(CORES)
  const incongruente = Math.random() < Math.min(0.55 + level * 0.04, 0.95)
  const tinta = incongruente ? pick(CORES.filter((c) => c.nome !== palavra.nome)) : palavra
  const outras = shuffle(CORES.filter((c) => c.nome !== tinta.nome)).slice(0, 3)
  return { palavra, tinta, opcoes: shuffle([tinta, ...outras]) }
}

/**
 * Teste de Stroop: a palavra nomeia uma cor, mas está pintada de outra.
 * Toque na cor da TINTA antes do tempo acabar.
 */
export default function StroopGame({ level, onFinish }: Props) {
  const timeMs = Math.max(2600 - level * 160, 1000)
  const trials = useMemo(() => Array.from({ length: TRIALS }, () => makeTrial(level)), [level])

  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [remaining, setRemaining] = useState(timeMs)
  const [feedback, setFeedback] = useState<'good' | 'bad' | 'timeout' | null>(null)
  const [started, setStarted] = useState(false)

  const trial = trials[index]

  // cronômetro do trial
  useEffect(() => {
    if (!started || feedback !== null || index >= TRIALS) return
    const start = Date.now()
    setRemaining(timeMs)
    const tick = setInterval(() => {
      const left = timeMs - (Date.now() - start)
      setRemaining(Math.max(0, left))
      if (left <= 0) {
        clearInterval(tick)
        setFeedback('timeout')
      }
    }, 80)
    return () => clearInterval(tick)
  }, [index, started, feedback, timeMs])

  // avança automaticamente após o feedback rápido
  useEffect(() => {
    if (feedback === null) return
    const t = setTimeout(() => {
      if (index + 1 >= TRIALS) {
        onFinish(score, TRIALS)
      } else {
        setFeedback(null)
        setIndex((i) => i + 1)
      }
    }, 550)
    return () => clearTimeout(t)
  }, [feedback, index, score, onFinish])

  function answer(cor: Cor) {
    if (feedback !== null) return
    const ok = cor.nome === trial.tinta.nome
    if (ok) setScore((s) => s + 1)
    setFeedback(ok ? 'good' : 'bad')
  }

  if (!started) {
    return (
      <div className="memory">
        <div className="nback-intro">
          <p>
            Vai aparecer o nome de uma cor pintado de <strong>outra</strong> cor. Ignore o que está
            escrito e toque no botão da <strong>cor da tinta</strong>. São {TRIALS} rodadas de{' '}
            {(timeMs / 1000).toFixed(1)}s cada.
          </p>
          <button className="btn primary" onClick={() => setStarted(true)}>
            Começar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="quiz">
      <div className="quiz-progress">
        {trials.map((_, i) => (
          <span key={i} className={`dot ${i < index ? 'done' : i === index ? 'now' : ''}`} />
        ))}
      </div>

      <div className="quiz-timer" aria-label="Tempo restante">
        <div
          className={`quiz-timer-bar ${remaining < timeMs * 0.3 ? 'urgent' : ''}`}
          style={{ width: `${(remaining / timeMs) * 100}%` }}
        />
      </div>

      <p className="quiz-instrucao">Toque na cor da tinta</p>
      <div className={`quiz-prompt stroop-word ${feedback ?? ''}`} style={{ color: trial.tinta.hex }}>
        {trial.palavra.nome}
      </div>

      <div className="stroop-options">
        {trial.opcoes.map((cor) => (
          <button
            key={cor.nome}
            className="option stroop-option"
            onClick={() => answer(cor)}
            disabled={feedback !== null}
          >
            <span className="stroop-swatch" style={{ background: cor.hex }} />
            {cor.nome}
          </button>
        ))}
      </div>

      <p className="memory-status">
        {feedback === 'good' && '✅ Certo!'}
        {feedback === 'bad' && '❌ Era a cor da tinta!'}
        {feedback === 'timeout' && '⏰ Tempo esgotado!'}
        {feedback === null && `Acertos: ${score}`}
      </p>
    </div>
  )
}
