import { useState } from 'react'
import {
  addStudyEntry,
  fmtMinutes,
  loadState,
  removeLastStudyEntry,
  setStudyGoal,
  studyThisWeek,
  weekStart,
  type AppState,
} from '../state/progress'

interface Props {
  onBack: () => void
  onScience: () => void
}

const GOAL_PRESETS = [120, 300, 420, 600] // 2h, 5h, 7h, 10h

/**
 * Meta semanal de estudo: registrar horas de aprendizado estruturado —
 * a intervenção com melhor evidência para aumentar a inteligência.
 */
export default function StudyScreen({ onBack, onScience }: Props) {
  const [state, setState] = useState<AppState>(loadState)
  const [assunto, setAssunto] = useState('')

  const done = studyThisWeek(state)
  const goal = state.study.goalMinutes
  const pct = Math.min(100, Math.round((done / goal) * 100))
  const thisWeekEntries = state.study.entries.filter((e) => e.date >= weekStart())

  function add(minutes: number) {
    setState(addStudyEntry(minutes, assunto))
    setAssunto('')
  }

  return (
    <div className="screen">
      <header className="game-header">
        <button className="back" onClick={onBack} aria-label="Voltar">
          ←
        </button>
        <h2>🎓 Estudo semanal</h2>
        <span />
      </header>

      <div className="study-hero">
        <span className="study-big">
          {fmtMinutes(done)} <small>de {fmtMinutes(goal)}</small>
        </span>
        <div className="study-bar">
          <div className={`study-bar-fill ${pct >= 100 ? 'complete' : ''}`} style={{ width: `${pct}%` }} />
        </div>
        <p className="qi-hint">
          {pct >= 100
            ? '🏆 Meta da semana batida — é assim que QI sobe de verdade!'
            : `Faltam ${fmtMinutes(goal - done)} nesta semana`}
        </p>
      </div>

      <section className="science-card">
        <h3>Registrar estudo de hoje</h3>
        <input
          className="profile-input"
          placeholder="Assunto (opcional): inglês, matemática..."
          value={assunto}
          maxLength={30}
          onChange={(e) => setAssunto(e.target.value)}
        />
        <div className="study-add-row">
          {[15, 30, 60].map((m) => (
            <button key={m} className="btn ghost study-add" onClick={() => add(m)}>
              +{m}min
            </button>
          ))}
        </div>
        {state.study.entries.length > 0 && (
          <button className="study-undo" onClick={() => setState(removeLastStudyEntry())}>
            ↩ Desfazer último registro
          </button>
        )}
      </section>

      <section className="science-card">
        <h3>Meta semanal</h3>
        <div className="study-add-row">
          {GOAL_PRESETS.map((m) => (
            <button
              key={m}
              className={`btn ghost study-add ${goal === m ? 'selected' : ''}`}
              onClick={() => setState(setStudyGoal(m))}
            >
              {fmtMinutes(m)}
            </button>
          ))}
        </div>
        <p className="qi-hint">
          Estudo estruturado é o que melhor aumenta a inteligência —{' '}
          <button className="link-btn" onClick={onScience}>
            entenda a ciência
          </button>
        </p>
      </section>

      {thisWeekEntries.length > 0 && (
        <section className="science-card">
          <h3>Esta semana</h3>
          <ul className="study-log">
            {[...thisWeekEntries].reverse().map((e, i) => (
              <li key={i}>
                <span>{e.date.slice(8)}/{e.date.slice(5, 7)}</span>
                <span className="study-log-assunto">{e.assunto ?? 'Estudo'}</span>
                <strong>{fmtMinutes(e.minutes)}</strong>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
