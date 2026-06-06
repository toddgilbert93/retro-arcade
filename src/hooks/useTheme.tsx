import { createContext, useContext, useEffect, useState } from 'react'
import {
  DEFAULT_THEME_ID,
  getTheme,
  normalizeThemeId,
  type Theme,
  type ThemeId,
} from '../themes/themes'

const STORAGE_KEY = 'chess-sim-theme'

function readStoredTheme(): ThemeId {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    const normalized = normalizeThemeId(stored)
    if (normalized) return normalized
  } catch {
    // ignore storage errors
  }
  return DEFAULT_THEME_ID
}

export function applyTheme(id: ThemeId) {
  document.documentElement.dataset.theme = id
}

export function initTheme() {
  applyTheme(readStoredTheme())
}

interface ThemeContextValue {
  theme: Theme
  themeId: ThemeId
  setThemeId: (id: ThemeId) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeIdState] = useState<ThemeId>(readStoredTheme)

  useEffect(() => {
    applyTheme(themeId)
    try {
      localStorage.setItem(STORAGE_KEY, themeId)
    } catch {
      // ignore storage errors
    }
  }, [themeId])

  const setThemeId = (id: ThemeId) => setThemeIdState(id)

  return (
    <ThemeContext.Provider
      value={{ theme: getTheme(themeId), themeId, setThemeId }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return ctx
}
