import { useMemo, useState } from 'react'
import QuizEngine from './components/QuizEngine'
import MemoryGame from './games/memory/MemoryGame'
import NBackGame from './games/nback/NBackGame'
import StroopGame from './games/stroop/StroopGame'
import { buildCriticalQuiz } from './games/critical/data'
import { buildVerbalQuiz } from './games/verbal/data'
import { buildNumericQuiz } from './games/numeric/generator'
import { buildMatricesQuiz } from './games/matrices/generator'
import { buildCalcQuiz } from './games/calc/generator'
import { GAMES, gameInfo, type GameId, type QuizQuestion } from './games/types'
import {
  gameQi,
  loadState,
  overallQi,
  recordSession,
  resetProgress,
  totalXp,
  type SessionResult,
} from './state/progress'
import {
  AVATARES,
  MAX_PROFILES,
  activeProfile,
  createProfile,
  deleteProfile,
  loadProfiles,
  progressKey,
  setActiveProfile,
  type Profile,
} from './state/profiles'

type Screen =
  | { name: 'profiles' }
  | { name: 'home' }
  | { name: 'game'; id: GameId; runKey: number }
  | { name: 'result'; id: GameId; result: SessionResult }
  | { name: 'stats' }

const QUIZ_BUILDERS: Partial<Record<GameId, (level: number) => QuizQuestion[]>> = {
  critical: buildCriticalQuiz,
  verbal: buildVerbalQuiz,
  numeric: buildNumericQuiz,
  matrices: buildMatricesQuiz,
  calc: buildCalcQuiz,
}

/** Tempo limite por questão (ms) — aumenta a pressão nos níveis altos. */
function timeLimitFor(id: GameId, level: number): number | undefined {
  switch (id) {
    case 'critical':
    case 'verbal':
      return level >= 4 ? Math.max(26 - level, 14) * 1000 : undefined
    case 'numeric':
      return level >= 5 ? Math.max(34 - 2 * level, 12) * 1000 : undefined
    case 'matrices':
      return level >= 6 ? Math.max(48 - 3 * level, 15) * 1000 : undefined
    case 'calc':
      return Math.max(13 - level, 4) * 1000
    default:
      return undefined
  }
}

export default function App() {
  const [screen, setScreen] = useState<Screen>(() =>
    activeProfile() ? { name: 'home' } : { name: 'profiles' },
  )

  function startGame(id: GameId) {
    setScreen({ name: 'game', id, runKey: Date.now() })
  }

  function finishGame(id: GameId, score: number, total: number) {
    const result = recordSession(id, score, total)
    setScreen({ name: 'result', id, result })
  }

  switch (screen.name) {
    case 'profiles':
      return <ProfilesScreen onReady={() => setScreen({ name: 'home' })} />
    case 'home':
      return (
        <Home
          onPlay={startGame}
          onStats={() => setScreen({ name: 'stats' })}
          onProfiles={() => setScreen({ name: 'profiles' })}
        />
      )
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

// ---------------------------------------------------------------- Perfis

function ProfilesScreen({ onReady }: { onReady: () => void }) {
  const [{ profiles }, setProfilesState] = useState(loadProfiles)
  const [creating, setCreating] = useState(profiles.length === 0)
  const [nome, setNome] = useState('')
  const [emoji, setEmoji] = useState(AVATARES[0])

  function refresh() {
    setProfilesState(loadProfiles())
  }

  function choose(p: Profile) {
    setActiveProfile(p.id)
    onReady()
  }

  function handleCreate() {
    const created = createProfile(nome, emoji)
    if (created) onReady()
  }

  function handleDelete(p: Profile) {
    if (confirm(`Apagar o perfil "${p.nome}" e todo o seu progresso?`)) {
      deleteProfile(p.id)
      refresh()
    }
  }

  if (creating) {
    return (
      <div className="screen">
        <header className="home-header">
          <div>
            <h1>Quem vai treinar?</h1>
            <p className="subtitle">Crie seu perfil — o progresso é individual</p>
          </div>
        </header>

        <div className="profile-form">
          <label className="profile-label" htmlFor="nome">
            Nome
          </label>
          <input
            id="nome"
            className="profile-input"
            value={nome}
            maxLength={20}
            placeholder={`Jogador ${profiles.length + 1}`}
            onChange={(e) => setNome(e.target.value)}
          />

          <label className="profile-label">Avatar</label>
          <div className="avatar-grid">
            {AVATARES.map((a) => (
              <button
                key={a}
                className={`avatar-option ${a === emoji ? 'selected' : ''}`}
                onClick={() => setEmoji(a)}
                aria-label={`Avatar ${a}`}
              >
                {a}
              </button>
            ))}
          </div>

          <button className="btn primary" onClick={handleCreate}>
            Criar perfil
          </button>
          {profiles.length > 0 && (
            <button className="btn ghost" onClick={() => setCreating(false)}>
              Voltar
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="screen">
      <header className="home-header">
        <div>
          <h1>Quem vai treinar?</h1>
          <p className="subtitle">
            {profiles.length}/{MAX_PROFILES} perfis
          </p>
        </div>
      </header>

      <div className="profile-list">
        {profiles.map((p) => (
          <ProfileCard key={p.id} profile={p} onChoose={() => choose(p)} onDelete={() => handleDelete(p)} />
        ))}
      </div>

      {profiles.length < MAX_PROFILES && (
        <button
          className="btn ghost"
          onClick={() => {
            setNome('')
            setCreating(true)
          }}
        >
          ＋ Novo jogador
        </button>
      )}
    </div>
  )
}

function ProfileCard({
  profile,
  onChoose,
  onDelete,
}: {
  profile: Profile
  onChoose: () => void
  onDelete: () => void
}) {
  // lê o QI do perfil sem trocar o perfil ativo
  const qi = useMemo(() => {
    try {
      const raw = localStorage.getItem(progressKey(profile.id))
      if (!raw) return null
      return overallQi(JSON.parse(raw))
    } catch {
      return null
    }
  }, [profile.id])

  return (
    <div className="profile-card">
      <button className="profile-main" onClick={onChoose}>
        <span className="profile-avatar">{profile.emoji}</span>
        <span className="game-text">
          <strong>{profile.nome}</strong>
          <small>{qi !== null ? `QI estimado: ${qi}` : 'Ainda sem treinos'}</small>
        </span>
      </button>
      <button className="profile-delete" onClick={onDelete} aria-label={`Apagar ${profile.nome}`}>
        ✕
      </button>
    </div>
  )
}

// ---------------------------------------------------------------- Medidor de QI

function QiGauge({ qi }: { qi: number | null }) {
  // arco de 80 a 200
  const frac = qi === null ? 0 : Math.min(1, Math.max(0, (qi - 80) / 120))
  const angle = Math.PI * (1 - frac)
  const r = 84
  const cx = 100
  const cy = 96
  const x = cx + r * Math.cos(angle)
  const y = cy - r * Math.sin(angle)
  const largeArc = frac > 0.5 ? 1 : 0

  return (
    <svg viewBox="0 0 200 110" className="qi-gauge" role="img" aria-label={`QI estimado: ${qi ?? 'sem dados'}`}>
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} className="qi-track" />
      {qi !== null && (
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 ${largeArc} 1 ${x} ${y}`} className="qi-arc" />
      )}
      <text x={cx} y={78} textAnchor="middle" className="qi-value">
        {qi ?? '—'}
      </text>
      <text x={cx} y={100} textAnchor="middle" className="qi-label">
        QI estimado
      </text>
      <text x={cx - r} y={108} textAnchor="middle" className="qi-bound">
        80
      </text>
      <text x={cx + r} y={108} textAnchor="middle" className="qi-bound">
        200
      </text>
    </svg>
  )
}

// ---------------------------------------------------------------- Home

function Home({
  onPlay,
  onStats,
  onProfiles,
}: {
  onPlay: (id: GameId) => void
  onStats: () => void
  onProfiles: () => void
}) {
  const state = useMemo(loadState, [])
  const profile = activeProfile()
  const qi = overallQi(state)
  const played = Object.values(state.games).filter((g) => g.sessions.length > 0).length

  return (
    <div className="screen">
      <header className="home-header">
        <div>
          <h1>Jogo QI</h1>
          <p className="subtitle">Treine seu cérebro todos os dias</p>
        </div>
        <button className="stats-chip" onClick={onProfiles} aria-label="Trocar de perfil">
          {profile?.emoji} {profile?.nome}
        </button>
      </header>

      <button className="qi-card" onClick={onStats}>
        <QiGauge qi={qi} />
        <div className="qi-meta">
          <span>🔥 {state.streak.count} dia{state.streak.count === 1 ? '' : 's'}</span>
          <span>⭐ {totalXp(state)} XP</span>
        </div>
        {qi === null && (
          <p className="qi-hint">Complete uma sessão de qualquer jogo para estimar seu QI</p>
        )}
        {qi !== null && played < GAMES.length && (
          <p className="qi-hint">
            Treine os {GAMES.length} jogos para uma estimativa completa ({played}/{GAMES.length})
          </p>
        )}
      </button>

      <div className="game-list">
        {GAMES.map((g) => {
          const p = state.games[g.id]
          return (
            <button
              key={g.id}
              className="game-card"
              style={{ ['--game-cor' as string]: g.cor }}
              onClick={() => onPlay(g.id)}
            >
              <span className="game-emoji">{g.emoji}</span>
              <span className="game-text">
                <strong>{g.nome}</strong>
                <small>{g.descricao}</small>
                <span className="game-bar">
                  <span
                    className="game-bar-fill"
                    style={{ width: `${((p.level - 1) / (g.maxLevel - 1)) * 100}%` }}
                  />
                </span>
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
      ) : id === 'nback' ? (
        <NBackGame level={level} onFinish={onFinish} />
      ) : id === 'stroop' ? (
        <StroopGame level={level} onFinish={onFinish} />
      ) : (
        <QuizEngine questions={questions!} timeLimitMs={timeLimitFor(id, level)} onFinish={onFinish} />
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
  const qiDelta =
    result.qiBefore !== null && result.qiAfter !== null ? result.qiAfter - result.qiBefore : null

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

      {result.qiAfter !== null && (
        <div className="result-qi">
          <span className="result-qi-value">QI estimado: {result.qiAfter}</span>
          {qiDelta !== null && qiDelta !== 0 && (
            <span className={`result-qi-delta ${qiDelta > 0 ? 'up' : 'down'}`}>
              {qiDelta > 0 ? `▲ +${qiDelta}` : `▼ ${qiDelta}`}
            </span>
          )}
        </div>
      )}

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
  const profile = activeProfile()

  function handleReset() {
    if (confirm('Apagar todo o progresso deste perfil? Essa ação não pode ser desfeita.')) {
      resetProgress()
      setState(loadState())
    }
  }

  const sessõesTotais = Object.values(state.games).reduce((n, g) => n + g.sessions.length, 0)
  const qi = overallQi(state)

  return (
    <div className="screen">
      <header className="game-header">
        <button className="back" onClick={onBack} aria-label="Voltar">
          ←
        </button>
        <h2>
          📊 {profile?.emoji} {profile?.nome}
        </h2>
        <span />
      </header>

      <div className="stats-summary">
        <div className="stat-tile highlight">
          <strong>{qi ?? '—'}</strong>
          <span>QI estimado</span>
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
          const qiGame = gameQi(p)
          return (
            <div key={g.id} className="stats-row" style={{ ['--game-cor' as string]: g.cor }}>
              <span className="game-emoji">{g.emoji}</span>
              <span className="game-text">
                <strong>{g.nome}</strong>
                <small>
                  {p.sessions.length === 0
                    ? 'Nenhuma sessão ainda'
                    : `Última: ${last.score}/${last.total} · Melhor: ${p.best}% · QI ${qiGame}`}
                </small>
                <span className="game-bar">
                  <span
                    className="game-bar-fill"
                    style={{ width: `${((p.level - 1) / (g.maxLevel - 1)) * 100}%` }}
                  />
                </span>
              </span>
              <span className="game-level">
                Nv {p.level}
                <small>/{g.maxLevel}</small>
              </span>
            </div>
          )
        })}
      </div>

      <p className="qi-disclaimer">
        O QI estimado reflete seu progresso nos jogos deste app (escala 80–200) e não substitui um
        teste psicométrico aplicado por profissionais.
      </p>

      <footer className="home-footer">
        <button className="btn danger" onClick={handleReset}>
          Apagar progresso deste perfil
        </button>
      </footer>
    </div>
  )
}
