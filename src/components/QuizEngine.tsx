import { useEffect, useState } from 'react'
import type { QuizQuestion } from '../games/types'

interface Props {
  questions: QuizQuestion[]
  /** Tempo limite por questão em ms; expirar conta como erro. */
  timeLimitMs?: number
  onFinish: (score: number, total: number) => void
}

const TIMEOUT = -1

/** Motor compartilhado de perguntas de múltipla escolha com feedback imediato. */
export default function QuizEngine({ questions, timeLimitMs, onFinish }: Props) {
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [remaining, setRemaining] = useState(timeLimitMs ?? 0)

  const q = questions[index]
  const last = index === questions.length - 1
  const answered = selected !== null

  // cronômetro por questão
  useEffect(() => {
    if (!timeLimitMs || answered) return
    const start = Date.now()
    setRemaining(timeLimitMs)
    const tick = setInterval(() => {
      const left = timeLimitMs - (Date.now() - start)
      setRemaining(Math.max(0, left))
      if (left <= 0) {
        clearInterval(tick)
        setSelected(TIMEOUT)
      }
    }, 100)
    return () => clearInterval(tick)
  }, [index, timeLimitMs, answered])

  function choose(i: number) {
    if (answered) return
    setSelected(i)
    if (i === q.correct) setScore((s) => s + 1)
  }

  function next() {
    if (last) {
      onFinish(score, questions.length)
      return
    }
    setSelected(null)
    setIndex((i) => i + 1)
  }

  return (
    <div className="quiz">
      <div className="quiz-progress" role="progressbar" aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={index + 1}>
        {questions.map((_, i) => (
          <span key={i} className={`dot ${i < index ? 'done' : i === index ? 'now' : ''}`} />
        ))}
      </div>

      {timeLimitMs && !answered && (
        <div className="quiz-timer" aria-label="Tempo restante">
          <div
            className={`quiz-timer-bar ${remaining < timeLimitMs * 0.25 ? 'urgent' : ''}`}
            style={{ width: `${(remaining / timeLimitMs) * 100}%` }}
          />
        </div>
      )}

      {q.instrucao && <p className="quiz-instrucao">{q.instrucao}</p>}
      <div className="quiz-prompt">{q.prompt}</div>

      <div className="quiz-options">
        {q.options.map((opt, i) => {
          let cls = 'option'
          if (answered) {
            if (i === q.correct) cls += ' correct'
            else if (i === selected) cls += ' wrong'
            else cls += ' dim'
          }
          return (
            <button key={i} className={cls} onClick={() => choose(i)} disabled={answered}>
              {opt}
            </button>
          )
        })}
      </div>

      {answered && (
        <div className="quiz-feedback">
          <p className={selected === q.correct ? 'ok' : 'nope'}>
            {selected === q.correct
              ? '✅ Correto!'
              : selected === TIMEOUT
                ? '⏰ Tempo esgotado!'
                : '❌ Não foi dessa vez.'}
          </p>
          {q.explanation && <p className="explain">{q.explanation}</p>}
          <button className="btn primary" onClick={next}>
            {last ? 'Ver resultado' : 'Próxima'}
          </button>
        </div>
      )}
    </div>
  )
}
