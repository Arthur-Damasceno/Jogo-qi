import { useState } from 'react'
import type { QuizQuestion } from '../games/types'

interface Props {
  questions: QuizQuestion[]
  onFinish: (score: number, total: number) => void
}

/** Motor compartilhado de perguntas de múltipla escolha com feedback imediato. */
export default function QuizEngine({ questions, onFinish }: Props) {
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [score, setScore] = useState(0)

  const q = questions[index]
  const last = index === questions.length - 1

  function choose(i: number) {
    if (selected !== null) return
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

      {q.instrucao && <p className="quiz-instrucao">{q.instrucao}</p>}
      <div className="quiz-prompt">{q.prompt}</div>

      <div className="quiz-options">
        {q.options.map((opt, i) => {
          let cls = 'option'
          if (selected !== null) {
            if (i === q.correct) cls += ' correct'
            else if (i === selected) cls += ' wrong'
            else cls += ' dim'
          }
          return (
            <button key={i} className={cls} onClick={() => choose(i)} disabled={selected !== null}>
              {opt}
            </button>
          )
        })}
      </div>

      {selected !== null && (
        <div className="quiz-feedback">
          <p className={selected === q.correct ? 'ok' : 'nope'}>
            {selected === q.correct ? '✅ Correto!' : '❌ Não foi dessa vez.'}
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
