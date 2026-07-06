import { useMemo, useState } from 'react'
import QuizEngine from './components/QuizEngine'
import MemoryGame from './games/memory/MemoryGame'
import { buildCriticalQuiz } from './games/critical/data'
import { buildVerbalQuiz } from './games/verbal/data'
import { buildNumericQuiz } from './games/numeric/generator'
import { buildMatricesQuiz } from './games/matrices/generator'
import { GAMES, gameInfo, type GameId, type QuizQuestion } from './games/types'
import {
  loadState,
  recordSession,
  resetProgress,
  totalXp,
  type SessionResult,
} from './state/progress'

type Screen =
  | { name: 'home' }
  | { name: 'game'; id: GameId; runKey: number }
  | { name: 'result'; id: GameId; result: SessionResult }
  | { name: 'stats' }

const QUIZ_BUILDERS: Partial<Record<GameId, (level: number) => QuizQuestion[]>> = {
  critical: buildCriticalQuiz,
  verbal: buildVerbalQuiz,
  numeric: buildNumericQuiz,
  matrices: buildMatricesQuiz,
}

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'home' })

  function startGame(id: GameId) {
    setScreen({ name: 'game', id, runKey: Date.now() })
  }

  function finishGame(id: GameId, score: number, total: number) {
    const result = recordSession(id, score, total)
    setScreen({ name: 'result', id, result })
  }

  switch (screen.name) {
    case 'home':
      return <Home onPlay={startGame} onStats={() => setScreen({ name: 'stats' })} />
    case 'game':
      return (
        <GameScreen
          key={screen.runKey}
          id={screen.id}
          onFinish={(s, t) => finishGame(screen.id, s, t)}
          onBack={() => setScreen({ name: 'home' })}
        />
      )
    case 'result':
      return (
        <ResultScreen
          id={screen.id}
          result={screen.result}
          onReplay={() => startGame(screen.id)}
          onHome={() => setScreen({ name: 'home' })}
        />
      )
    case 'stats':
      return <Stats onBack={() => setScreen({ name: 'home' })} />
  }
}

// ---------------------------------------------------------------- Home

function Home({ onPlay, onStats }: { onPlay: (id: GameId) => void; onStats: () => void }) {
  const state = useMemo(loadState, [])
  return (
    <div className="screen">
      <header className="home-header">
        <div>
          <h1>Jogo QI</h1>
          <p className="subtitle">Treine seu cérebro todos os dias</p>
        </div>
        <button className="stats-chip" onClick={onStats} aria-label="Ver estatísticas">
          🔥 {state.streak.count} &nbsp;·&nbsp; ⭐ {totalXp(state)}
        </button>
      </header>

      <div className="game-list">
        {GAMES.map((g) => {
          const p = state.games[g.id]
          return (
            <button key={g.id} className="game-card" onClick={() => onPlay(g.id)}>
              <span className="game-emoji">{g.emoji}</span>
              <span className="game-text">
                <strong>{g.nome}</strong>
                <small>{g.descricao}</small>
              </span>
              <span className="game-level">
                Nv {p.level}
                <small>/{g.maxLevel}</small>
              </span>
            </button>
          )
        })}
      </div>

      <footer className="home-footer">
        <button className="btn ghost" onClick={onStats}>
          📊 Meu progresso
        </button>
      </footer>
    </div>
  )
}

// ---------------------------------------------------------------- Jogo

function GameScreen({
  id,
  onFinish,
  onBack,
}: {
  id: GameId
  onFinish: (score: number, total: number) => void
  onBack: () => void
}) {
  const level = useMemo(() => loadState().games[id].level, [id])
  const info = gameInfo(id)
  const questions = useMemo(() => QUIZ_BUILDERS[id]?.(level), [id, level])

  return (
    <div className="screen">
      <header className="game-header">
        <button className="back" onClick={onBack} aria-label="Voltar">
          ←
        </button>
        <h2>
          {info.emoji} {info.nome}
        </h2>
        <span className="level-badge">Nv {level}</span>
      </header>

      {id === 'memory' ? (
        <MemoryGame level={level} onFinish={onFinish} />
      ) : (
        <QuizEngine questions={questions!} onFinish={onFinish} />
      )}
    </div>
  )
}

// ---------------------------------------------------------------- Resultado

function ResultScreen({
  id,
  result,
  onReplay,
  onHome,
}: {
  id: GameId
  result: SessionResult
  onReplay: () => void
  onHome: () => void
}) {
  const info = gameInfo(id)
  const accuracy = Math.round((result.score / result.total) * 100)
  const levelUp = result.levelAfter > result.levelBefore
  const levelDown = result.levelAfter < result.levelBefore

  const title =
    accuracy >= 80 ? 'Excelente! 🏆' : accuracy >= 60 ? 'Muito bem! 💪' : accuracy >= 40 ? 'Bom treino! 👍' : 'Continue praticando! 🌱'

  return (
    <div className="screen result">
      <h2>{title}</h2>
      <p className="result-game">
        {info.emoji} {info.nome}
      </p>

      <div className="result-score">
        <span className="big">
          {result.score}/{result.total}
        </span>
        <span>{accuracy}% de acerto</span>
      </div>

      <ul className="result-details">
        <li>⭐ +{result.xpGained} XP</li>
        <li>🔥 Sequência de {result.streak} dia{result.streak === 1 ? '' : 's'}</li>
        {levelUp && <li>🚀 Subiu para o nível {result.levelAfter}!</li>}
        {levelDown && <li>📉 Voltou para o nível {result.levelAfter} — sem pressa!</li>}
      </ul>

      <div className="result-actions">
        <button className="btn primary" onClick={onReplay}>
          Jogar de novo
        </button>
        <button className="btn ghost" onClick={onHome}>
          Início
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------- Estatísticas

function Stats({ onBack }: { onBack: () => void }) {
  const [state, setState] = useState(loadState)

  function handleReset() {
    if (confirm('Apagar todo o progresso? Essa ação não pode ser desfeita.')) {
      resetProgress()
      setState(loadState())
    }
  }

  const sessõesTotais = Object.values(state.games).reduce((n, g) => n + g.sessions.length, 0)

  return (
    <div className="screen">
      <header className="game-header">
        <button className="back" onClick={onBack} aria-label="Voltar">
          ←
        </button>
        <h2>📊 Meu progresso</h2>
        <span />
      </header>

      <div className="stats-summary">
        <div className="stat-tile">
          <strong>{totalXp(state)}</strong>
          <span>XP total</span>
        </div>
        <div className="stat-tile">
          <strong>{state.streak.count}</strong>
          <span>dias seguidos</span>
        </div>
        <div className="stat-tile">
          <strong>{sessõesTotais}</strong>
          <span>sessões</span>
        </div>
      </div>

      <div className="stats-games">
        {GAMES.map((g) => {
          const p = state.games[g.id]
          const last = p.sessions[p.sessions.length - 1]
          return (
            <div key={g.id} className="stats-row">
              <span className="game-emoji">{g.emoji}</span>
              <span className="game-text">
                <strong>{g.nome}</strong>
                <small>
                  {p.sessions.length === 0
                    ? 'Nenhuma sessão ainda'
                    : `Última: ${last.score}/${last.total} · Melhor: ${p.best}%`}
                </small>
              </span>
              <span className="game-level">
                Nv {p.level}
                <small>/{gameInfo(g.id).maxLevel}</small>
              </span>
            </div>
          )
        })}
      </div>

      <footer className="home-footer">
        <button className="btn danger" onClick={handleReset}>
          Apagar progresso
        </button>
      </footer>
    </div>
  )
}
