export type ThemeId =
  | 'sunset-circuit'
  | 'neon-arcade'
  | 'forest-night'
  | 'ocean-depth'
  | 'cherry-terminal'

export interface Theme {
  id: ThemeId
  label: string
  swatch: [string, string, string]
  board: {
    light: string
    dark: string
    highlight: string
  }
}

export const THEMES: Theme[] = [
  {
    id: 'sunset-circuit',
    label: 'Sunset Circuit',
    swatch: ['#1c1210', '#f59e0b', '#f97316'],
    board: {
      light: '#fcd9a0',
      dark: '#78350f',
      highlight: 'rgba(249, 115, 22, 0.45)',
    },
  },
  {
    id: 'neon-arcade',
    label: 'Neon Arcade',
    swatch: ['#1a0a2e', '#e040fb', '#00e5ff'],
    board: {
      light: '#f0abfc',
      dark: '#581c87',
      highlight: 'rgba(0, 229, 255, 0.45)',
    },
  },
  {
    id: 'forest-night',
    label: 'Forest Night',
    swatch: ['#0f1f14', '#4ade80', '#d4a574'],
    board: {
      light: '#a8c686',
      dark: '#2d4a35',
      highlight: 'rgba(212, 165, 116, 0.5)',
    },
  },
  {
    id: 'ocean-depth',
    label: 'Ocean Depth',
    swatch: ['#0a1628', '#22d3ee', '#38bdf8'],
    board: {
      light: '#7dd3fc',
      dark: '#0c4a6e',
      highlight: 'rgba(34, 211, 238, 0.45)',
    },
  },
  {
    id: 'cherry-terminal',
    label: 'Cherry Terminal',
    swatch: ['#1a0a10', '#f43f5e', '#e879f9'],
    board: {
      light: '#fda4af',
      dark: '#881337',
      highlight: 'rgba(232, 121, 249, 0.45)',
    },
  },
]

export const DEFAULT_THEME_ID: ThemeId = 'sunset-circuit'

export function getTheme(id: ThemeId): Theme {
  return (
    THEMES.find((t) => t.id === id) ??
    THEMES.find((t) => t.id === DEFAULT_THEME_ID) ??
    THEMES[0]
  )
}

export function normalizeThemeId(stored: string | null): ThemeId | null {
  if (!stored) return null
  if (stored === 'greyscale' || stored === 'greenscale') return 'sunset-circuit'
  if (THEMES.some((t) => t.id === stored)) return stored as ThemeId
  return null
}
