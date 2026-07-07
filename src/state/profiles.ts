export interface Profile {
  id: string
  nome: string
  emoji: string
  criadoEm: string
}

export const MAX_PROFILES = 6

export const AVATARES = ['🦊', '🐼', '🦉', '🐯', '🐸', '🦄', '🐨', '🐙', '🦁', '🐺', '🐳', '🦋']

const KEY = 'jogo-qi-profiles-v1'
const LEGACY_PROGRESS_KEY = 'jogo-qi-v1'

interface ProfilesState {
  profiles: Profile[]
  activeId: string | null
}

export function loadProfiles(): ProfilesState {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as ProfilesState
  } catch {
    /* estado corrompido: recomeça */
  }
  return migrateLegacy()
}

/** Usuários da v1 (sem perfis) ganham automaticamente um perfil com seu progresso. */
function migrateLegacy(): ProfilesState {
  const state: ProfilesState = { profiles: [], activeId: null }
  const legacy = localStorage.getItem(LEGACY_PROGRESS_KEY)
  if (legacy) {
    const profile: Profile = {
      id: newId(),
      nome: 'Jogador 1',
      emoji: AVATARES[0],
      criadoEm: new Date().toISOString(),
    }
    localStorage.setItem(progressKey(profile.id), legacy)
    localStorage.removeItem(LEGACY_PROGRESS_KEY)
    state.profiles.push(profile)
    state.activeId = profile.id
    save(state)
  }
  return state
}

function save(state: ProfilesState) {
  localStorage.setItem(KEY, JSON.stringify(state))
}

const newId = () => Math.random().toString(36).slice(2, 10)

export const progressKey = (profileId: string) => `${LEGACY_PROGRESS_KEY}:${profileId}`

export function createProfile(nome: string, emoji: string): Profile | null {
  const state = loadProfiles()
  if (state.profiles.length >= MAX_PROFILES) return null
  const profile: Profile = {
    id: newId(),
    nome: nome.trim().slice(0, 20) || `Jogador ${state.profiles.length + 1}`,
    emoji,
    criadoEm: new Date().toISOString(),
  }
  state.profiles.push(profile)
  state.activeId = profile.id
  save(state)
  return profile
}

export function setActiveProfile(id: string) {
  const state = loadProfiles()
  if (state.profiles.some((p) => p.id === id)) {
    state.activeId = id
    save(state)
  }
}

export function deleteProfile(id: string) {
  const state = loadProfiles()
  state.profiles = state.profiles.filter((p) => p.id !== id)
  if (state.activeId === id) state.activeId = null
  localStorage.removeItem(progressKey(id))
  save(state)
}

export function activeProfile(): Profile | null {
  const state = loadProfiles()
  return state.profiles.find((p) => p.id === state.activeId) ?? null
}
